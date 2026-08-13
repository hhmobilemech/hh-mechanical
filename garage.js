(function initializeGarage(globalScope) {
  "use strict";

  const steps = Object.freeze(["Vehicle", "Area", "Symptoms", "Location", "Contact", "Review"]);
  const vehicleTypes = Object.freeze(["Car", "SUV", "Truck", "Light-Duty Diesel"]);
  const areas = Object.freeze({
    engine: { name: "Engine / Front", symptoms: ["Won't Start", "Cranks but Won't Start", "Running Rough", "Loss of Power", "Stalling", "Strange Noise"] },
    electrical: { name: "Battery / Electrical", symptoms: ["No Power", "Rapid Clicking", "Battery Keeps Dying", "Lights Flicker", "Accessory Issue", "Intermittent Issue"] },
    brakes: { name: "Brakes", symptoms: ["Grinding", "Squealing", "Shaking", "Soft Pedal", "Pulling", "Warning Light"] },
    steering: { name: "Steering / Suspension", symptoms: ["Clunking", "Shaking", "Pulling", "Loose Steering", "Bouncing", "Uneven Tire Wear"] },
    cooling: { name: "Cooling System", symptoms: ["Overheating", "Coolant Leak", "Steam / Smell", "Fan Not Working", "Overheats at Idle", "Overheats While Driving"] },
    drivetrain: { name: "Transmission / Drivetrain", symptoms: ["Hard Shift", "Slipping", "Won't Move", "Vibration", "Leak", "Noise"] },
    exhaust: { name: "Exhaust / Under Vehicle", symptoms: ["Exhaust Noise", "Rattling", "Visible Damage", "Possible Leak", "Under-Vehicle Noise"] },
    unsure: { name: "Not Sure", symptoms: [] },
  });
  const timings = Object.freeze(["At Startup", "At Idle", "While Driving", "Under Acceleration", "While Braking", "All the Time", "Intermittently"]);

  function emptyState() {
    return { step: 0, vehicleType: "", year: "", make: "", model: "", engineTrim: "", areaId: "",
      symptoms: [], timing: "", location: "", landmark: "", serviceAreaStatus: "", name: "", phone: "",
      bestTime: "", diagnostic: "", diagnosticSummary: "", additionalNotes: "" };
  }

  function createSession(initial = {}) {
    let state = { ...emptyState(), ...initial, symptoms: [...(initial.symptoms || [])] };
    return {
      get: () => ({ ...state, symptoms: [...state.symptoms] }),
      set(patch) { state = { ...state, ...patch, symptoms: patch.symptoms ? [...patch.symptoms] : state.symptoms }; return this.get(); },
      toggleSymptom(symptom) { const selected = state.symptoms.includes(symptom); state.symptoms = selected
        ? state.symptoms.filter(value => value !== symptom) : [...state.symptoms, symptom]; return this.get(); },
      next() { if (state.step < steps.length - 1) state.step += 1; return this.get(); },
      back() { if (state.step > 0) state.step -= 1; return this.get(); },
      reset() { state = emptyState(); return this.get(); },
      validate() { return validateStep(state); },
    };
  }

  function validateStep(state) {
    if (state.step === 0 && (!state.vehicleType || !state.year.trim() || !state.make.trim() || !state.model.trim())) return "Choose a vehicle type and enter year, make, and model.";
    if (state.step === 1 && !state.areaId) return "Choose a problem area.";
    if (state.step === 2 && state.areaId !== "unsure" && state.symptoms.length === 0) return "Choose at least one symptom.";
    if (state.step === 2 && state.areaId === "unsure" && !state.diagnostic && !state.additionalNotes.trim()) return "Run the Quick Diagnostic or add a short note about the problem.";
    if (state.step === 3 && !state.location.trim()) return "Enter the vehicle city or location.";
    if (state.step === 4 && (!state.name.trim() || !state.phone.trim())) return "Enter your name and phone number.";
    return "";
  }

  function summary(state) {
    const vehicle = [state.year, state.make, state.model].filter(Boolean).join(" ").toUpperCase();
    const lines = ["YOUR H&H SERVICE REQUEST"];
    if (vehicle) lines.push("", vehicle);
    if (state.vehicleType) lines.push(state.vehicleType.toUpperCase());
    if (state.engineTrim) lines.push(`ENGINE / TRIM: ${state.engineTrim.toUpperCase()}`);
    if (state.areaId) lines.push("", "AREA:", areas[state.areaId].name.toUpperCase());
    if (state.symptoms.length) lines.push("", "SYMPTOM:", state.symptoms.join(", ").toUpperCase());
    if (state.timing) lines.push("", "WHEN:", state.timing.toUpperCase());
    if (state.diagnostic) lines.push("", "DIAGNOSTIC:", state.diagnostic.toUpperCase());
    if (state.location) lines.push("", "LOCATION:", [state.location, state.landmark].filter(Boolean).join(" // ").toUpperCase());
    if (state.serviceAreaStatus) lines.push(state.serviceAreaStatus.toUpperCase());
    if (state.name || state.phone) lines.push("", "CONTACT:", [state.name, state.phone].filter(Boolean).join(" // ").toUpperCase());
    if (state.bestTime) lines.push(`BEST TIME: ${state.bestTime.toUpperCase()}`);
    if (state.additionalNotes) lines.push("", "NOTES:", state.additionalNotes);
    return lines.join("\n");
  }

  function toRequest(state) {
    const problemParts = [];
    if (state.areaId) problemParts.push(`Problem area: ${areas[state.areaId].name}.`);
    if (state.symptoms.length) problemParts.push(`Symptoms: ${state.symptoms.join(", ")}.`);
    if (state.timing) problemParts.push(`When: ${state.timing}.`);
    if (state.landmark) problemParts.push(`Address / landmark: ${state.landmark}.`);
    if (state.bestTime) problemParts.push(`Best time to contact: ${state.bestTime}.`);
    if (state.additionalNotes) problemParts.push(`Additional notes: ${state.additionalNotes}`);
    return {
      data: { name: state.name, phone: state.phone, year: state.year, make: state.make, model: state.model,
        location: state.location, problem: problemParts.join(" ") },
      context: { diagnostic: state.diagnostic, diagnosticSummary: state.diagnosticSummary,
        vehicleArea: state.areaId ? areas[state.areaId].name : "", vehicleType: state.vehicleType,
        engineTrim: state.engineTrim, serviceArea: state.serviceAreaStatus },
    };
  }

  const api = Object.freeze({ steps, vehicleTypes, areas, timings, emptyState, createSession, validateStep, summary, toRequest });
  globalScope.HHGarage = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
