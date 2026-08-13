const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { serviceAreas, normalizeCity, inputType, checkServiceArea, requestStatus, prefillLocation } = require("../service-area.js");

const project = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(project, "app.js"), "utf8");
const html = fs.readFileSync(path.join(project, "index.html"), "utf8");

test("Walker County coverage is centralized with 39 communities or aliases and 19 ZIP codes", () => {
  assert.equal(serviceAreas.name, "Walker County, Alabama");
  assert.equal(serviceAreas.cities.length, 36);
  assert.equal(serviceAreas.aliases.length, 3);
  assert.equal(serviceAreas.cities.length + serviceAreas.aliases.length, 39);
  assert.equal(serviceAreas.zipCodes.length, 19);
  assert.deepEqual(serviceAreas.aliases, ["Barney", "Gravleeton", "Praco"]);
  assert.deepEqual(serviceAreas.counties, ["Walker County"]);
  for (const value of [serviceAreas, serviceAreas.cities, serviceAreas.aliases, serviceAreas.zipCodes]) assert.ok(Object.isFrozen(value));
});

test("all configured communities, aliases, and ZIPs resolve as standard coverage", () => {
  for (const value of [...serviceAreas.cities, ...serviceAreas.aliases, ...serviceAreas.zipCodes]) {
    assert.equal(checkServiceArea(value).status, "standard", value);
  }
});

test("required examples and Alabama suffix variations match exactly", () => {
  const examples = ["Oakman", "Oakman, AL", "Oakman Alabama", "Jasper", "Curry", "Townley", "Parrish",
    "35501", "35579", "  OAKMAN  ", "Jasper, Alabama", "Walker County, AL"];
  for (const value of examples) {
    const result = checkServiceArea(value);
    assert.equal(result.status, "standard", value);
    assert.equal(result.title, "H&H Mechanical Services Your Area");
    assert.equal(result.message, "Walker County Mobile Service");
    assert.equal(result.notes, "Call or text 205-243-7867 to request service.");
    assert.equal(requestStatus(result), "WALKER COUNTY // STANDARD SERVICE AREA");
  }
});

test("normalization is case-insensitive and removes only an exact Alabama suffix", () => {
  assert.equal(normalizeCity("  Oakman, AL  "), "oakman");
  assert.equal(normalizeCity("OAKMAN Alabama"), "oakman");
  assert.equal(normalizeCity("St. Louis, MO"), "st louis, mo");
  assert.equal(checkServiceArea("Oakmanville").status, "outside", "no fuzzy city matching");
});

test("outside cities and unknown ZIPs remain eligible for confirmation", () => {
  for (const value of ["Birmingham", "Tuscaloosa", "35203"]) {
    const result = checkServiceArea(value);
    assert.equal(result.status, "outside", value);
    assert.equal(result.title, "Outside Our Normal Service Area");
    assert.equal(result.message, "We may still be able to come to you depending on distance and availability.");
    assert.equal(result.notes, "Call or text 205-243-7867 to confirm service availability.");
    assert.equal(requestStatus(result), "OUTSIDE NORMAL AREA // CONFIRM AVAILABILITY");
  }
});

test("blank and malformed ZIP-like input retain validation behavior", () => {
  assert.equal(checkServiceArea("   ").status, "invalid");
  for (const value of ["3550", "355011", "35501-1234", "12-34", "----"]) {
    const result = checkServiceArea(value);
    assert.equal(result.status, "invalid", value);
    assert.equal(result.title, "Enter a Valid City or 5-Digit ZIP Code");
  }
  assert.equal(inputType("35501"), "zip");
  assert.equal(inputType("Oakman, AL"), "city");
});

test("request prefill updates only location and preserves every other form value", () => {
  const before = { name: "Pat", phone: "555-0100", year: "2015", make: "Ford", model: "F-150", location: "", problem: "No start" };
  assert.deepEqual(prefillLocation(before, "  Oakman, AL  "), { ...before, location: "Oakman, AL" });
  assert.equal(before.location, "");
  assert.match(app, /location\.value = latestResult\.entered/);
});

test("checker actions retain central phone and request integrations", () => {
  assert.match(app, /callAction\.textContent = result\.status === "outside" \? "Call \/ Text H&H" : "Call Now"/);
  assert.match(html, /data-phone-link data-area-call/);
  assert.match(app, /link\.href = `tel:\$\{BUSINESS_PHONE\}`/);
  assert.match(app, /const BUSINESS_PHONE = "\+12052437867"/);
  assert.match(html, /service-area\.js\?v=20260813-walker-county/);
  assert.match(html, /<h3>Walker County Mobile Service<\/h3>/);
  assert.doesNotMatch(html, /Cities &amp; counties coming soon/);
});
