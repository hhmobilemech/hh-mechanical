const assert = require("node:assert/strict");
const test = require("node:test");
const {
  requiredFields, validateRequest, withoutIntegratedSummaries, formatRequest, buildSmsUrl, isMobileDevice,
} = require("../service-request.js");

const complete = {
  name: "John Smith",
  phone: "205-555-1234",
  year: "2012",
  make: "Ford",
  model: "F-250",
  location: "Jasper, AL",
  problem: "Cranks but won't start. Rapid clicking.",
};

test("minimum required customer, vehicle, location, and problem fields validate", () => {
  assert.deepEqual(requiredFields, ["name", "phone", "year", "make", "model", "location", "problem"]);
  const result = validateRequest(complete);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("missing fields produce clear grouped validation messages", () => {
  const result = validateRequest({});
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["Enter your name.", "Enter your phone number.",
    "Enter the vehicle year, make, and model.", "Enter the current location or city.",
    "Describe the vehicle problem."]);
  assert.equal(validateRequest({ ...complete, make: "" }).valid, false);
});

test("complete request uses the required clean message format", () => {
  const message = formatRequest(complete);
  assert.equal(message, `H&H MECHANICAL SERVICE REQUEST

Name: John Smith
Phone: 205-555-1234

Vehicle:
2012 Ford F-250

Location:
Jasper, AL

Problem:
Cranks but won't start. Rapid clicking.

Please contact me about mobile service.`);
});

test("diagnostic, vehicle-map, and service-area context are included when available", () => {
  const message = formatRequest(complete, {
    diagnostic: "Won't Start > Rapid Clicking",
    vehicleArea: "Battery / Electrical",
    serviceArea: "Jasper, AL — Service Area Confirmation Needed",
  });
  assert.match(message, /Diagnostic:\nWon't Start > Rapid Clicking/);
  assert.match(message, /Vehicle Area:\nBattery \/ Electrical/);
  assert.match(message, /Service Area Check:\nJasper, AL — Service Area Confirmation Needed/);
});

test("blank optional context labels are omitted", () => {
  const message = formatRequest(complete, { diagnostic: " ", vehicleArea: "", serviceArea: null });
  assert.doesNotMatch(message, /Diagnostic:|Vehicle Area:|Service Area Check:/);
});

test("integrated diagnostic and vehicle summaries are not duplicated inside Problem", () => {
  const diagnosticSummary = "H&H Quick Diagnostic:\nVehicle won't start.\nRapid clicking when attempting to start.\nPossible starting/charging-system issue.";
  const vehicleSummary = "Vehicle area selected: Battery / Electrical";
  const problem = `${complete.problem}\n\n${diagnosticSummary}\n\n${vehicleSummary}`;
  assert.equal(withoutIntegratedSummaries(problem, { diagnosticSummary, vehicleSummary }), complete.problem);
  const message = formatRequest({ ...complete, problem }, {
    diagnosticSummary, vehicleSummary, diagnostic: "Won't Start > Rapid Clicking", vehicleArea: "Battery / Electrical",
  });
  assert.equal(message.match(/H&H Quick Diagnostic/g), null);
  assert.equal((message.match(/Battery \/ Electrical/g) || []).length, 1);
});

test("SMS URL uses one recipient and correctly encodes special characters", () => {
  const message = "H&H request: won't start & battery + cable?\nJasper, AL";
  const url = buildSmsUrl("+12055551234", message);
  assert.equal(url, `sms:+12055551234?&body=${encodeURIComponent(message)}`);
  assert.equal(decodeURIComponent(url.split("body=")[1]), message);
  assert.equal(buildSmsUrl("", message), "");
});

test("mobile detection supports modern hints and common mobile user agents", () => {
  assert.equal(isMobileDevice({ userAgentData: { mobile: true }, userAgent: "Desktop" }), true);
  assert.equal(isMobileDevice({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS)" }), true);
  assert.equal(isMobileDevice({ userAgent: "Mozilla/5.0 (Linux; Android 15; Mobile)" }), true);
  assert.equal(isMobileDevice({ userAgentData: { mobile: false }, userAgent: "Mozilla/5.0 (X11; Linux x86_64)" }), false);
});

test("formatter trims values without modifying source form data", () => {
  const source = { ...complete, name: "  John Smith  ", location: " Jasper, AL " };
  const snapshot = { ...source };
  const message = formatRequest(source);
  assert.match(message, /Name: John Smith/);
  assert.match(message, /Location:\nJasper, AL/);
  assert.deepEqual(source, snapshot);
});
