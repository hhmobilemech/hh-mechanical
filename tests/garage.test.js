const assert = require("node:assert/strict");
const test = require("node:test");
const { steps, vehicleTypes, areas, timings, createSession, validateStep, summary, toRequest } = require("../garage.js");
const { formatRequest, buildSmsUrl } = require("../service-request.js");

const complete = {
  step: 5, vehicleType: "SUV", year: "2020", make: "Chevrolet", model: "Tahoe", engineTrim: "5.3L",
  areaId: "cooling", symptoms: ["Overheating"], timing: "While Driving", location: "Oakman, AL",
  landmark: "Near city hall", serviceAreaStatus: "Oakman, AL — Service Area Confirmation Needed",
  name: "Arron", phone: "205-530-4397", bestTime: "Afternoon", diagnostic: "",
  diagnosticSummary: "", additionalNotes: "Coolant smell after stopping.",
};

test("builder exposes the requested six-step progress and vehicle choices", () => {
  assert.deepEqual(steps, ["Vehicle", "Area", "Symptoms", "Location", "Contact", "Review"]);
  assert.deepEqual(vehicleTypes, ["Car", "SUV", "Truck", "Light-Duty Diesel"]);
  assert.deepEqual(timings, ["At Startup", "At Idle", "While Driving", "Under Acceleration", "While Braking", "All the Time", "Intermittently"]);
});

test("all requested problem areas and their symptom choices are present", () => {
  assert.deepEqual(Object.keys(areas), ["engine", "electrical", "brakes", "steering", "cooling", "drivetrain", "exhaust", "unsure"]);
  assert.ok(areas.engine.symptoms.includes("Won't Start"));
  assert.ok(areas.electrical.symptoms.includes("Rapid Clicking"));
  assert.ok(areas.brakes.symptoms.includes("Soft Pedal"));
  assert.ok(areas.cooling.symptoms.includes("Overheats While Driving"));
  assert.ok(areas.steering.symptoms.includes("Uneven Tire Wear"));
  assert.ok(areas.drivetrain.symptoms.includes("Slipping"));
  assert.deepEqual(areas.unsure.symptoms, []);
});

test("Back and Next preserve all request data during the page session", () => {
  const session = createSession();
  session.set({ vehicleType: "Truck", year: "2018", make: "Ford", model: "F-150" });
  session.next(); session.set({ areaId: "engine" }); session.next();
  session.toggleSymptom("Running Rough"); session.set({ timing: "At Idle" });
  session.back(); session.back();
  const state = session.get();
  assert.equal(state.vehicleType, "Truck");
  assert.equal(state.make, "Ford");
  assert.deepEqual(state.symptoms, ["Running Rough"]);
  assert.equal(state.timing, "At Idle");
});

test("required fields validate at each workflow boundary", () => {
  assert.match(validateStep(createSession().get()), /vehicle type/i);
  assert.match(validateStep({ ...complete, step: 1, areaId: "" }), /problem area/i);
  assert.match(validateStep({ ...complete, step: 2, symptoms: [] }), /symptom/i);
  assert.match(validateStep({ ...complete, step: 2, areaId: "unsure", symptoms: [], diagnostic: "", additionalNotes: "" }), /Quick Diagnostic/i);
  assert.match(validateStep({ ...complete, step: 3, location: "" }), /location/i);
  assert.match(validateStep({ ...complete, step: 4, name: "" }), /name and phone/i);
  assert.equal(validateStep(complete), "");
});

test("multi-select symptoms toggle without duplicates", () => {
  const session = createSession({ symptoms: ["Grinding"] });
  session.toggleSymptom("Squealing"); session.toggleSymptom("Grinding");
  assert.deepEqual(session.get().symptoms, ["Squealing"]);
});

test("live summary updates every populated request category", () => {
  const text = summary(complete);
  for (const expected of ["2020 CHEVROLET TAHOE", "SUV", "ENGINE / TRIM: 5.3L", "COOLING SYSTEM",
    "OVERHEATING", "WHILE DRIVING", "OAKMAN, AL", "ARRON // 205-530-4397", "AFTERNOON"]) assert.match(text, new RegExp(expected.replace("/", "\\/")));
});

test("conversion produces one reusable form-data and context structure", () => {
  const converted = toRequest(complete);
  assert.deepEqual(converted.data, {
    name: "Arron", phone: "205-530-4397", year: "2020", make: "Chevrolet", model: "Tahoe", location: "Oakman, AL",
    problem: "Problem area: Cooling System. Symptoms: Overheating. When: While Driving. Address / landmark: Near city hall. Best time to contact: Afternoon. Additional notes: Coolant smell after stopping.",
  });
  assert.equal(converted.context.vehicleType, "SUV");
  assert.equal(converted.context.engineTrim, "5.3L");
  assert.equal(converted.context.serviceArea, complete.serviceAreaStatus);
});

test("builder output uses the established formatter and official SMS recipient", () => {
  const converted = toRequest({ ...complete, diagnostic: "Overheating > Overheats While Driving" });
  const message = formatRequest(converted.data, converted.context);
  assert.match(message, /Vehicle Type: SUV/);
  assert.match(message, /Engine \/ Trim: 5.3L/);
  assert.match(message, /Diagnostic:\nOverheating > Overheats While Driving/);
  assert.match(message, /Vehicle Area:\nCooling System/);
  assert.match(message, /Service Area Check:\nOakman, AL — Service Area Confirmation Needed/);
  assert.match(buildSmsUrl("+12052437867", message, "android"), /^sms:\+12052437867\?body=/);
});

test("Start Over clears sensitive state without localStorage", () => {
  const session = createSession(complete);
  const reset = session.reset();
  assert.equal(reset.name, ""); assert.equal(reset.phone, ""); assert.equal(reset.step, 0);
});
