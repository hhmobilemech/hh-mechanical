const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { steps, vehicleTypes, areas, timings, createSession, validateStep, summary, toRequest,
  hasRequestData, mapArea } = require("../garage.js");
const { formatRequest, buildSmsUrl, isMobileDevice } = require("../service-request.js");
const { checkServiceArea } = require("../service-area.js");
const vehicleMap = require("../vehicle-map.js");

const project = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(project, "app.js"), "utf8");
const htmlSource = fs.readFileSync(path.join(project, "index.html"), "utf8");
const cssSource = fs.readFileSync(path.join(project, "styles.css"), "utf8");

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

test("Garage problem areas reuse corrected vehicle-map concepts", () => {
  assert.equal(mapArea("engine", vehicleMap.areas), vehicleMap.areas.engine);
  assert.equal(mapArea("brakes", vehicleMap.areas), vehicleMap.areas["front-brakes"]);
  assert.equal(mapArea("cooling", vehicleMap.areas), vehicleMap.areas.cooling);
  assert.equal(mapArea("unsure", vehicleMap.areas), null);
  assert.match(htmlSource, /vehicle-base" transform="translate\(900 0\) scale\(-1 1\)" data-vehicle-artwork-direction="left"/);
  assert.match(htmlSource, />FRONT<\/text>[\s\S]*>REAR<\/text>/);
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

test("complete happy path advances through all six steps without losing data", () => {
  const session = createSession();
  session.set({ vehicleType: "SUV", year: "2020", make: "Chevrolet", model: "Tahoe" });
  assert.equal(session.validate(), ""); session.next();
  session.set({ areaId: "cooling" }); assert.equal(session.validate(), ""); session.next();
  session.toggleSymptom("Overheating"); session.toggleSymptom("Coolant Leak");
  session.set({ timing: "While Driving" }); assert.equal(session.validate(), ""); session.next();
  session.set({ location: "Oakman, AL", serviceAreaStatus: checkServiceArea("Oakman, AL").title });
  assert.equal(session.validate(), ""); session.next();
  session.set({ name: "Arron", phone: "205-530-4397" }); assert.equal(session.validate(), ""); session.next();
  assert.equal(session.get().step, 5);
  assert.deepEqual(session.get().symptoms, ["Overheating", "Coolant Leak"]);
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
  const converted = toRequest({ ...complete, diagnostic: "Overheating > Overheats While Driving",
    vehicleMapSelection: "Front / Engine" });
  const message = formatRequest(converted.data, converted.context);
  assert.match(message, /Vehicle Type: SUV/);
  assert.match(message, /Engine \/ Trim: 5.3L/);
  assert.match(message, /Problem Area:\nCooling System/);
  assert.match(message, /Symptoms:\nOverheating/);
  assert.match(message, /Quick Diagnostic:\nOverheating > Overheats While Driving/);
  assert.match(message, /Vehicle Map Selection:\nFront \/ Engine/);
  assert.match(message, /Service Area: Oakman, AL — Service Area Confirmation Needed/);
  assert.match(buildSmsUrl("+12052437867", message, "android"), /^sms:\+12052437867\?body=/);
});

test("shared diagnostic and vehicle-map context survives Garage conversion", () => {
  const converted = toRequest({ ...complete, diagnostic: "", vehicleMapSelection: "" }, {
    diagnostic: "Won't Start > Rapid Clicking", vehicleArea: "Battery / Electrical",
  });
  assert.equal(converted.context.diagnostic, "Won't Start > Rapid Clicking");
  assert.equal(converted.context.vehicleArea, "Battery / Electrical");
});

test("service-area status is non-blocking and supports all configured result states", () => {
  assert.equal(checkServiceArea("Oakman, AL").status, "unknown");
  assert.equal(checkServiceArea("Jasper, AL", { cities: ["Jasper, AL"], zipCodes: [], counties: [] }).status, "standard");
  assert.equal(checkServiceArea("Oakman, AL", { cities: ["Jasper, AL"], zipCodes: [], counties: [] }).status, "outside");
  assert.equal(validateStep({ ...complete, serviceAreaStatus: "Outside Normal Service Area" }), "");
});

test("Edit, confirmed Start Over, diagnostic handoff, and shared submit flow are wired once", () => {
  assert.match(appSource, /edit\.addEventListener\("click"[\s\S]*step: 0/);
  assert.match(appSource, /window\.confirm\("Start over and clear this service request\?"\)/);
  assert.match(appSource, /diagnosticResultReceiver = \(result, summary\)/);
  assert.match(appSource, /serviceRequestForm\.requestSubmit\(\)/);
  assert.equal((appSource.match(/serviceRequestForm\.addEventListener\("submit"/g) || []).length, 1);
  assert.equal(hasRequestData(complete), true);
  assert.equal(hasRequestData(createSession().get()), false);
});

test("mobile SMS and desktop fallback remain part of the shared request path", () => {
  assert.equal(isMobileDevice({ userAgentData: { mobile: true } }), true);
  assert.match(appSource, /window\.location\.href = smsUrl/);
  assert.match(appSource, /preview\.textContent = formattedRequest/);
  assert.match(htmlSource, /data-request-ready[\s\S]*Copy Request[\s\S]*Call H&amp;H/);
});

test("phone layout and reduced-motion safeguards cover the Garage dialog", () => {
  assert.match(cssSource, /@media \(max-width: 680px\)[\s\S]*\.garage-dialog \{ width: 100%; height: 100dvh/);
  assert.match(cssSource, /\.garage-choices, \.garage-fields \{ grid-template-columns: 1fr; \}/);
  assert.match(cssSource, /\.garage-footer > div > button \{ flex: 1 1 0; \}/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.garage-step, \.garage-step::before \{ animation: none !important; \}/);
});

test("Start Over clears sensitive state without localStorage", () => {
  const session = createSession(complete);
  const reset = session.reset();
  assert.equal(reset.name, ""); assert.equal(reset.phone, ""); assert.equal(reset.step, 0);
});
