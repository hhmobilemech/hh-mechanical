const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { createSession, mergeSummary } = require("../diagnostic.js");
const { areas, getArea, serviceSummary } = require("../vehicle-map.js");

const expectedAreas = ["engine", "electrical", "front-brakes", "steering", "drivetrain", "rear-brakes", "exhaust", "cooling"];
const indexSource = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const styleSource = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

function hotspotLeft(className) {
  const match = styleSource.match(new RegExp(`\\.${className}\\s*\\{[^}]*left:\\s*([\\d.]+)%`));
  assert.ok(match, `${className} must have an explicit horizontal coordinate`);
  return Number(match[1]);
}

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

test("vehicle artwork establishes front-left and rear-right orientation", () => {
  assert.match(indexSource, /class="vehicle-base" transform="translate\(900 0\) scale\(-1 1\)" data-vehicle-artwork-direction="left"/);
  assert.match(indexSource, /data-vehicle-end="front"/);
  assert.match(indexSource, /data-vehicle-end="rear"/);
  assert.match(indexSource, />FRONT<\/text>/);
  assert.match(indexSource, />REAR<\/text>/);
  assert.match(indexSource, /vehicle-wheel-outer" cx="209"/);
  assert.match(indexSource, /vehicle-wheel-outer" cx="690"/);
});

test("only the physical vehicle artwork is mirrored", () => {
  const mirroredGroup = indexSource.match(/<g class="vehicle-base"[^>]*>([\s\S]*?)<\/g>/);
  assert.ok(mirroredGroup, "vehicle base must be a distinct mirrored SVG group");
  assert.doesNotMatch(mirroredGroup[1], /vehicle-region|vehicle-orientation|data-vehicle-hotspot/);
  assert.match(indexSource, /<\/g>\s*<g class="vehicle-direction-details"/);
  assert.match(indexSource, /<g class="vehicle-orientation" aria-hidden="true">/);
});

test("hotspot coordinates follow front-left and rear-right vehicle geometry", () => {
  const engine = hotspotLeft("hotspot-engine");
  const electrical = hotspotLeft("hotspot-electrical");
  const frontBrakes = hotspotLeft("hotspot-front-brakes");
  const steering = hotspotLeft("hotspot-steering");
  const drivetrain = hotspotLeft("hotspot-drivetrain");
  const rearBrakes = hotspotLeft("hotspot-rear-brakes");
  const exhaust = hotspotLeft("hotspot-exhaust");
  const cooling = hotspotLeft("hotspot-cooling");

  assert.ok(engine < drivetrain && electrical < drivetrain && cooling < drivetrain);
  assert.ok(frontBrakes < drivetrain && steering < drivetrain);
  assert.ok(rearBrakes > drivetrain && exhaust > drivetrain);
  assert.ok(frontBrakes < rearBrakes, "front wheel must remain left of rear wheel");
});

test("SVG highlight regions retain the matching physical zone metadata", () => {
  for (const id of ["engine", "electrical", "steering", "cooling"]) {
    assert.match(indexSource, new RegExp(`data-vehicle-region="${id}" data-vehicle-zone="front"`));
  }
  assert.match(indexSource, /data-vehicle-region="drivetrain" data-vehicle-zone="center"/);
  assert.match(indexSource, /data-vehicle-region="exhaust" data-vehicle-zone="center-rear"/);
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
