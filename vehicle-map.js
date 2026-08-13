(function initializeVehicleMap(globalScope) {
  "use strict";

  const areas = Object.freeze({
    engine: Object.freeze({
      name: "Engine / Front",
      summary: "Vehicle area selected: Front / Engine",
      diagnosticInitial: 2,
      services: Object.freeze(["No-start issues", "Running rough", "Loss of power", "Tune-ups", "Engine diagnostics", "Starter", "Alternator", "Belt-related issues"]),
    }),
    electrical: Object.freeze({
      name: "Battery / Electrical",
      summary: "Vehicle area selected: Battery / Electrical",
      diagnosticInitial: 6,
      services: Object.freeze(["Battery testing / replacement", "Charging-system diagnosis", "Alternator", "Starter circuits", "Electrical diagnosis", "Intermittent electrical problems"]),
    }),
    "front-brakes": Object.freeze({
      name: "Front Wheels / Brakes",
      summary: "Vehicle area selected: Front Wheels / Brakes",
      diagnosticInitial: 4,
      services: Object.freeze(["Brake inspection", "Pads / rotors", "Grinding or squealing", "Brake vibration", "Soft pedal diagnosis", "Brake warning concerns"]),
    }),
    steering: Object.freeze({
      name: "Steering / Suspension",
      summary: "Vehicle area selected: Steering / Suspension",
      diagnosticInitial: 5,
      services: Object.freeze(["Clunks", "Loose steering", "Pulling", "Shaking", "Suspension inspection", "Steering-component diagnosis"]),
    }),
    drivetrain: Object.freeze({
      name: "Transmission / Drivetrain",
      summary: "Vehicle area selected: Transmission / Drivetrain",
      diagnosticInitial: 7,
      services: Object.freeze(["Drivetrain diagnosis", "Shifting concerns", "Vibration / noise inspection", "Leaks / related inspection"]),
    }),
    "rear-brakes": Object.freeze({
      name: "Rear Wheels / Brakes",
      summary: "Vehicle area selected: Rear Wheels / Brakes",
      diagnosticInitial: 4,
      services: Object.freeze(["Brake inspection", "Pads / rotors", "Grinding or squealing", "Brake vibration", "Soft pedal diagnosis", "Brake warning concerns"]),
    }),
    exhaust: Object.freeze({
      name: "Exhaust / Under Vehicle",
      summary: "Vehicle area selected: Exhaust / Under Vehicle",
      diagnosticInitial: 7,
      services: Object.freeze(["Exhaust noise", "Rattles", "Visible damage", "Leak inspection", "Under-vehicle mechanical inspection"]),
    }),
    cooling: Object.freeze({
      name: "Cooling System",
      summary: "Vehicle area selected: Cooling System",
      diagnosticInitial: 1,
      services: Object.freeze(["Overheating", "Coolant leaks", "Radiator", "Cooling fan", "Thermostat", "Water pump", "Cooling-system diagnosis"]),
    }),
  });

  function getArea(id) {
    return areas[id] || null;
  }

  function serviceSummary(id) {
    return getArea(id)?.summary || "";
  }

  const api = Object.freeze({ areas, getArea, serviceSummary });
  globalScope.HHVehicleMap = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
