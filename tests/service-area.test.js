const assert = require("node:assert/strict");
const test = require("node:test");
const {
  serviceAreas, normalizeCity, inputType, checkServiceArea, prefillLocation,
} = require("../service-area.js");

const configured = {
  cities: ["Austin", "St. Louis, MO"],
  zipCodes: ["78701", "63101"],
  counties: ["Travis County"],
  notes: "Standard coverage depends on scheduling.",
};

test("default service-area configuration is centralized and contains no invented coverage", () => {
  assert.deepEqual(serviceAreas, { cities: [], zipCodes: [], counties: [], notes: "" });
  assert.ok(Object.isFrozen(serviceAreas));
});

test("blank input is rejected with the required validation message", () => {
  const result = checkServiceArea("   ");
  assert.equal(result.status, "invalid");
  assert.equal(result.title, "Enter a Valid City or 5-Digit ZIP Code");
});

test("valid city and city-state input are recognized without inventing default coverage", () => {
  assert.equal(inputType("Austin"), "city");
  assert.equal(inputType("St. Louis, MO"), "city");
  assert.equal(checkServiceArea("Austin").status, "unknown");
  assert.equal(checkServiceArea("St. Louis, MO").status, "unknown");
});

test("valid 5-digit ZIP input is accepted but remains unknown when coverage is unconfigured", () => {
  assert.equal(inputType("78701"), "zip");
  const result = checkServiceArea(" 78701 ");
  assert.equal(result.status, "unknown");
  assert.equal(result.entered, "78701");
  assert.equal(result.title, "Service Area Confirmation Needed");
});

test("malformed ZIP-like values are rejected", () => {
  for (const value of ["7870", "787011", "78701-1234", "12-34", "----"]) {
    const result = checkServiceArea(value);
    assert.equal(result.status, "invalid", value);
    assert.equal(result.title, "Enter a Valid City or 5-Digit ZIP Code");
  }
});

test("city normalization handles capitalization, periods, commas, and surrounding whitespace", () => {
  assert.equal(normalizeCity("  ST. LOUIS,mo  "), "st louis, mo");
  assert.equal(checkServiceArea("  aUsTiN ", configured).status, "standard");
  assert.equal(checkServiceArea(" ST LOUIS, mo ", configured).status, "standard");
  assert.equal(checkServiceArea("travis county", configured).status, "standard");
});

test("configured cities and ZIP codes produce the normal-area result", () => {
  for (const value of ["Austin", "78701", "63101"]) {
    const result = checkServiceArea(value, configured);
    assert.equal(result.status, "standard");
    assert.equal(result.title, "You're in Our Normal Service Area");
    assert.equal(result.message, "H&H Mechanical provides mobile service in your area.");
    assert.equal(result.notes, configured.notes);
  }
});

test("valid exact nonmatches are conservatively classified outside configured standard coverage", () => {
  for (const value of ["Dallas", "75001", "Austinville"]) {
    const result = checkServiceArea(value, configured);
    assert.equal(result.status, "outside");
    assert.equal(result.title, "Outside Normal Service Area");
    assert.match(result.message, /may still be able to help/i);
  }
});

test("unconfigured and unknown locations require confirmation", () => {
  const result = checkServiceArea("Any Valid City", serviceAreas);
  assert.equal(result.status, "unknown");
  assert.equal(result.message, "Call or request service and H&H Mechanical will confirm availability for your location.");
});

test("request prefill updates only location and preserves every other form value", () => {
  const before = { name: "Pat", phone: "555-0100", year: "2015", make: "Ford", model: "F-150",
    location: "", problem: "No start" };
  const after = prefillLocation(before, "  Austin, TX  ");
  assert.deepEqual(after, { ...before, location: "Austin, TX" });
  assert.equal(before.location, "", "input snapshot remains unchanged");
});
