(function initializeDiagnostic(globalScope) {
  "use strict";

  const common = {
    disclaimer: "Possible causes only. A proper inspection is required to diagnose the vehicle.",
    resultNote: "This tool helps narrow down the type of problem. It does not replace a hands-on diagnosis.",
  };

  const option = (label, summary, causes, extra = {}) => ({ label, summary, causes, ...extra });
  const coolingCauses = ["Low coolant", "Cooling-system leak", "Thermostat", "Cooling fan", "Water pump", "Radiator restriction", "Other cooling-system problem"];
  const roughCauses = ["Ignition / misfire", "Fuel delivery", "Air / vacuum leak", "Sensor issue", "Engine-management problem"];

  const trees = {
    start: {
      prompt: "What is your vehicle doing?",
      options: [
        { label: "Won't Start", next: "wont-start", summary: "Vehicle won't start." },
        { label: "Overheating", next: "overheating", summary: "Vehicle is overheating." },
        { label: "Running Rough", next: "running-rough", summary: "Vehicle is running rough." },
        { label: "Warning Light", next: "warning-light", summary: "A dashboard warning light is on." },
        { label: "Brake Problem", next: "brakes", summary: "Vehicle has a brake-related problem." },
        { label: "Steering / Suspension", next: "steering", summary: "Vehicle has a steering or suspension concern." },
        { label: "Electrical Problem", next: "electrical", summary: "Vehicle has an electrical problem." },
        { label: "Strange Noise", next: "noise-location", summary: "Vehicle is making a strange noise." },
        option("Other", "The vehicle has another symptom not listed.", ["General vehicle diagnostic inspection"]),
      ],
    },
    "wont-start": {
      prompt: "What happens when you try to start it?",
      options: [
        option("Nothing Happens", "Nothing happens when attempting to start.", ["Battery / battery connection", "Ignition circuit", "Starter circuit", "Neutral-safety / starting-control issue"]),
        option("One Click", "One click when attempting to start.", ["Weak battery", "Poor battery connection", "Starter / starter-solenoid issue", "High-resistance starting circuit"]),
        option("Rapid Clicking", "Rapid clicking when attempting to start.", ["Low battery voltage", "Poor battery-terminal connection", "Charging-system issue"]),
        option("Cranks But Won't Start", "Engine cranks but won't start.", ["Fuel delivery", "Ignition / spark", "Sensor / engine-management issue", "Air / timing related issue"]),
        option("Starts Then Dies", "Engine starts, then dies.", ["Fuel delivery", "Air / throttle issue", "Sensor / engine-management issue", "Charging/electrical issue"]),
      ],
    },
    overheating: {
      prompt: "What are you noticing?",
      warning: "If the engine is actively overheating, shut it off when safe. Continuing to drive an overheating engine can cause serious damage.",
      options: [
        option("Temperature Gauge High", "Temperature gauge is reading high.", coolingCauses),
        option("Coolant Leak", "Coolant appears to be leaking.", coolingCauses),
        option("Steam / Coolant Smell", "Steam or a coolant smell is present.", coolingCauses),
        option("Overheats While Idling", "Engine overheats while idling.", coolingCauses),
        option("Overheats While Driving", "Engine overheats while driving.", coolingCauses),
      ],
    },
    "running-rough": {
      prompt: "When does it run rough?",
      options: [
        option("At Idle", "Engine runs rough at idle.", roughCauses),
        option("Under Acceleration", "Engine runs rough under acceleration.", roughCauses),
        option("All the Time", "Engine runs rough all the time.", roughCauses),
        option("Engine Shakes", "Engine is shaking.", roughCauses),
        option("Loss of Power", "Vehicle has a loss of power.", roughCauses),
        option("Stalling", "Engine is stalling.", roughCauses),
      ],
    },
    "warning-light": {
      prompt: "Which warning light is on?",
      optionClass: "dashboard-options",
      options: [
        option("Check Engine", "Check Engine warning light is on.", ["Engine-management diagnostic scan", "Stored fault-code inspection"], { explanation: "The engine computer detected a condition that needs proper scanning and diagnosis." }),
        option("Battery", "Battery warning light is on.", ["Charging system", "Battery and electrical connections", "Alternator drive system"], { explanation: "This often indicates a charging-system concern rather than the battery alone." }),
        option("Temperature", "Temperature warning light is on.", coolingCauses, { explanation: "The engine may be overheating and needs a cooling-system inspection.", warning: "Continuing to operate an overheating engine can risk serious engine damage. Shut it off when safe.", urgent: true }),
        option("ABS", "ABS warning light is on.", ["ABS fault-code scan", "Wheel-speed sensing system", "Anti-lock brake electrical system"], { explanation: "The anti-lock function may be limited; the complete brake system should be inspected." }),
        option("Brake", "Brake warning light is on.", ["Brake fluid and hydraulic system", "Parking-brake switch", "Brake-system inspection"], { explanation: "A brake warning can indicate a serious hydraulic or braking concern. Confirm safe braking operation before driving.", urgent: true }),
        option("Traction / Stability", "Traction or stability warning light is on.", ["Stability-control fault-code scan", "Wheel-speed and steering sensors", "Related engine or brake system"], { explanation: "Traction or stability assistance may be limited until the fault is inspected." }),
        option("Oil Pressure", "Oil-pressure warning light is on.", ["Engine oil level and condition", "Oil-pressure testing", "Lubrication system"], { explanation: "The lubrication system requires an appropriate inspection.", warning: "Low oil pressure can quickly cause serious engine damage. Shut the engine off when safe and avoid continued operation until inspected.", urgent: true }),
        option("Other", "Another dashboard warning light is on.", ["Dashboard warning identification", "Vehicle system scan", "Appropriate system inspection"], { explanation: "Record the warning symbol and when it appears so it can be identified accurately." }),
      ],
    },
    brakes: {
      prompt: "What brake symptom are you noticing?",
      options: [
        option("Grinding", "Brakes make a grinding sound.", ["Brake friction components", "Rotors or drums", "Complete brake inspection"]),
        option("Squealing", "Brakes make a squealing sound.", ["Brake friction components", "Brake hardware", "Complete brake inspection"]),
        option("Shaking While Braking", "Vehicle shakes while braking.", ["Rotors or drums", "Brake friction components", "Steering / suspension interaction"]),
        option("Soft Brake Pedal", "Brake pedal feels abnormally soft.", ["Brake hydraulic system", "Brake fluid loss or air", "Master cylinder / brake components"], { warning: "An abnormally soft pedal or reduced braking ability can be unsafe. Do not drive the vehicle until it can be inspected." }),
        option("Vehicle Pulls While Braking", "Vehicle pulls while braking.", ["Uneven brake operation", "Brake hydraulic or friction components", "Tire / steering / suspension condition"]),
        option("Brake Warning Light", "Brake warning light is on.", ["Brake fluid and hydraulic system", "Parking-brake switch", "Complete brake-system inspection"], { warning: "If braking ability is reduced, do not drive the vehicle until it can be inspected." }),
      ],
    },
    steering: {
      prompt: "What steering or suspension symptom are you noticing?",
      options: [
        option("Clunking", "Clunking from the steering or suspension area.", ["Steering and suspension joints", "Bushings and mounts", "Loose or worn chassis components"]),
        option("Vehicle Pulls", "Vehicle pulls while driving.", ["Tire condition and pressure", "Wheel alignment", "Steering / suspension components", "Brake drag"]),
        option("Steering Wheel Shakes", "Steering wheel shakes.", ["Tires and wheel balance", "Steering / suspension components", "Wheel or hub condition"]),
        option("Loose Steering", "Steering feels loose.", ["Steering linkage", "Steering gear or rack", "Suspension joints"]),
        option("Bouncing", "Vehicle continues bouncing after bumps.", ["Shocks or struts", "Springs and mounts", "Suspension inspection"]),
        option("Uneven Tire Wear", "Tires have uneven wear.", ["Wheel alignment", "Tire condition and pressure", "Steering / suspension wear"]),
      ],
    },
    electrical: {
      prompt: "What electrical symptom are you noticing?",
      options: [
        option("Battery Keeps Dying", "Battery repeatedly loses its charge.", ["Battery condition", "Charging system", "Parasitic electrical draw", "Battery connections"]),
        option("Lights Flicker", "Vehicle lights flicker.", ["Charging-system output", "Battery / ground connections", "Lighting or electrical circuit"]),
        option("No Power", "Vehicle has no electrical power.", ["Battery and terminals", "Main power and ground connections", "Primary fuse / power distribution"]),
        option("Accessories Not Working", "One or more accessories are not working.", ["Fuses and relays", "Accessory circuit", "Switch / control system"]),
        option("Fuse Keeps Blowing", "A fuse repeatedly blows.", ["Short circuit", "Overloaded circuit", "Failed device or wiring issue"]),
        option("Intermittent Electrical Issue", "Electrical problem happens intermittently.", ["Loose or damaged connection", "Ground circuit", "Wiring / control-module diagnosis"]),
      ],
    },
    "noise-location": {
      prompt: "Where does the noise seem to come from?",
      options: [
        { label: "Engine Area", next: "noise-sound", summary: "Noise seems to come from the engine area." },
        { label: "Front of Vehicle", next: "noise-sound", summary: "Noise seems to come from the front of the vehicle." },
        { label: "Rear of Vehicle", next: "noise-sound", summary: "Noise seems to come from the rear of the vehicle." },
        { label: "Wheel Area", next: "noise-sound", summary: "Noise seems to come from a wheel area." },
        { label: "Under Vehicle", next: "noise-sound", summary: "Noise seems to come from under the vehicle." },
        { label: "Not Sure", next: "noise-sound", summary: "Noise location is uncertain." },
      ],
    },
    "noise-sound": {
      prompt: "What does it sound like?",
      options: [
        option("Clicking", "Noise sounds like clicking.", ["Noise-source inspection", "Rotating / moving components", "Related engine, driveline, wheel or chassis system"]),
        option("Grinding", "Noise sounds like grinding.", ["Noise-source inspection", "Brake, bearing or rotating-component area", "Related mechanical system"]),
        option("Knocking", "Noise sounds like knocking.", ["Noise-source inspection", "Engine, suspension or driveline area", "Related mechanical system"]),
        option("Squealing", "Noise sounds like squealing.", ["Noise-source inspection", "Belt, brake or rotating-component area", "Related mechanical system"]),
        option("Rattling", "Noise sounds like rattling.", ["Noise-source inspection", "Loose shield, mount or mechanical component", "Related vehicle system"]),
        option("Humming / Roaring", "Noise sounds like humming or roaring.", ["Noise-source inspection", "Tire, bearing, driveline or airflow-related area", "Related mechanical system"]),
        option("Other", "Noise has another sound.", ["Hands-on noise-source inspection", "Relevant engine, driveline, brake, wheel or chassis system"]),
      ],
    },
  };

  function createSession() {
    let nodeId = "start";
    let selections = [];
    let result = null;

    return {
      current() { return result ? { type: "result", ...result } : { type: "question", id: nodeId, ...trees[nodeId] }; },
      select(index) {
        if (result) throw new Error("Cannot select an option from the result screen");
        const node = trees[nodeId];
        const selected = node.options[index];
        if (!selected) throw new RangeError("Invalid diagnostic option");
        selections.push({ nodeId, index, label: selected.label, summary: selected.summary });
        if (selected.next) nodeId = selected.next;
        else result = {
          causes: [...selected.causes],
          explanation: selected.explanation || "The selected symptoms point to an appropriate system inspection.",
          warning: selected.warning || node.warning || "",
          selections: selections.map(item => ({ ...item })),
          summary: `H&H Quick Diagnostic:\n${selections.map(item => item.summary).join("\n")}\nPossible ${resultArea(selected.causes)}.`,
        };
        return this.current();
      },
      back() {
        if (result) result = null;
        if (selections.length === 0) return this.current();
        const removed = selections.pop();
        nodeId = removed.nodeId;
        return this.current();
      },
      reset() { nodeId = "start"; selections = []; result = null; return this.current(); },
      canGoBack() { return selections.length > 0; },
      selections() { return selections.map(item => ({ ...item })); },
    };
  }

  function resultArea(causes) {
    const joined = causes.join(" ").toLowerCase();
    if (joined.includes("cool")) return "cooling-system issue";
    if (joined.includes("battery") || joined.includes("charging") || joined.includes("starter")) return "starting/charging-system issue";
    if (joined.includes("brake")) return "brake-system issue";
    if (joined.includes("steering") || joined.includes("suspension")) return "steering/suspension issue";
    if (joined.includes("electrical") || joined.includes("circuit") || joined.includes("wiring")) return "electrical-system issue";
    if (joined.includes("engine") || joined.includes("fuel") || joined.includes("ignition")) return "engine-management or mechanical issue";
    return "vehicle-system inspection needed";
  }

  function mergeSummary(existing, summary) {
    const priorText = String(existing || "").trim();
    const diagnosticText = String(summary || "").trim();
    if (!priorText) return diagnosticText;
    if (!diagnosticText || priorText.includes(diagnosticText)) return priorText;
    return `${priorText}\n\n${diagnosticText}`;
  }

  const api = Object.freeze({ common: Object.freeze(common), trees: Object.freeze(trees), createSession, mergeSummary });
  globalScope.HHDiagnostic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
