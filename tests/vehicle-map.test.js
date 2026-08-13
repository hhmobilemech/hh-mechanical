const assert = require("node:assert/strict");
const test = require("node:test");
const { createSession, mergeSummary } = require("../diagnostic.js");
const { areas, getArea, serviceSummary } = require("../vehicle-map.js");

const expectedAreas = ["engine", "electrical", "front-brakes", "steering", "drivetrain", "rear-brakes", "exhaust", "cooling"];

test("service map exposes exactly the eight requested vehicle hotspots", () => {
  assert.deepEqual(Object.keys(areas), expectedAreas);
  expectedAreas.forEach(id => {
    const area = getArea(id);
    assert.ok(area.name.length > 0);
    assert.ok(area.services.length >= 4);
    assert.equal(serviceSummary(id), area.summary);
    assert.match(area.summary, /^Vehicle area selected: /);
  });
  assert.equal(getArea("unknown"), null);
  assert.equal(serviceSummary("unknown"), "");
});

test("engine/front mapping covers the requested diagnostic and service concerns", () => {
  assert.deepEqual(areas.engine.services, ["No-start issues", "Running rough", "Loss of power", "Tune-ups",
    "Engine diagnostics", "Starter", "Alternator", "Belt-related issues"]);
});

test("battery/electrical mapping covers charging, starting circuits, and intermittent concerns", () => {
  assert.deepEqual(areas.electrical.services, ["Battery testing / replacement", "Charging-system diagnosis",
    "Alternator", "Starter circuits", "Electrical diagnosis", "Intermittent electrical problems"]);
});

test("both wheel hotspots use the complete conservative brake mapping", () => {
  const expected = ["Brake inspection", "Pads / rotors", "Grinding or squealing", "Brake vibration",
    "Soft pedal diagnosis", "Brake warning concerns"];
  assert.deepEqual(areas["front-brakes"].services, expected);
  assert.deepEqual(areas["rear-brakes"].services, expected);
});

test("steering/suspension mapping covers all requested symptoms", () => {
  assert.deepEqual(areas.steering.services, ["Clunks", "Loose steering", "Pulling", "Shaking",
    "Suspension inspection", "Steering-component diagnosis"]);
});

test("drivetrain mapping stays diagnostic and does not claim major rebuilding", () => {
  assert.deepEqual(areas.drivetrain.services, ["Drivetrain diagnosis", "Shifting concerns",
    "Vibration / noise inspection", "Leaks / related inspection"]);
  assert.doesNotMatch(areas.drivetrain.services.join(" "), /rebuild|replacement/i);
});

test("exhaust and cooling mappings cover their requested inspection areas", () => {
  assert.deepEqual(areas.exhaust.services, ["Exhaust noise", "Rattles", "Visible damage", "Leak inspection",
    "Under-vehicle mechanical inspection"]);
  assert.deepEqual(areas.cooling.services, ["Overheating", "Coolant leaks", "Radiator", "Cooling fan",
    "Thermostat", "Water pump", "Cooling-system diagnosis"]);
});

test("each area routes into a relevant existing Quick Diagnostic branch", () => {
  const expectedPrompts = {
    engine: "When does it run rough?",
    electrical: "What electrical symptom are you noticing?",
    "front-brakes": "What brake symptom are you noticing?",
    steering: "What steering or suspension symptom are you noticing?",
    drivetrain: "Where does the noise seem to come from?",
    "rear-brakes": "What brake symptom are you noticing?",
    exhaust: "Where does the noise seem to come from?",
    cooling: "What are you noticing?",
  };
  expectedAreas.forEach(id => {
    const session = createSession();
    session.select(areas[id].diagnosticInitial);
    assert.equal(session.current().prompt, expectedPrompts[id]);
    assert.equal(session.canGoBack(), true);
  });
});

test("request-service text appends without erasing or duplicating customer text", () => {
  const selection = serviceSummary("cooling");
  assert.equal(mergeSummary("Customer reports steam.", selection),
    "Customer reports steam.\n\nVehicle area selected: Cooling System");
  assert.equal(mergeSummary(selection, selection), selection);
});
