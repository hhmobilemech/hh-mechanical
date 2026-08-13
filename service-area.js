(function initializeServiceArea(globalScope) {
  "use strict";

  // Add confirmed coverage here. Keep all service-area geography in this one object.
  const serviceAreas = Object.freeze({
    cities: Object.freeze([]),
    zipCodes: Object.freeze([]),
    counties: Object.freeze([]),
    notes: "",
  });

  const messages = Object.freeze({
    invalid: Object.freeze({
      title: "Enter a Valid City or 5-Digit ZIP Code",
      message: "Check the location and try again.",
    }),
    unknown: Object.freeze({
      title: "Service Area Confirmation Needed",
      message: "Call or request service and H&H Mechanical will confirm availability for your location.",
    }),
    standard: Object.freeze({
      title: "You're in Our Normal Service Area",
      message: "H&H Mechanical provides mobile service in your area.",
    }),
    outside: Object.freeze({
      title: "Outside Normal Service Area",
      message: "We may still be able to help depending on distance and availability.",
    }),
  });

  function normalizeCity(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/\s*,\s*/g, ", ")
      .replace(/\s+/g, " ");
  }

  function normalizeZip(value) {
    return String(value || "").trim();
  }

  function inputType(value) {
    const input = String(value || "").trim();
    if (!input) return "invalid";
    if (/^\d{5}$/.test(input)) return "zip";
    if (/^[\d\s-]+$/.test(input)) return "invalid";
    if (/^[a-zA-Z][a-zA-Z .,'-]*$/.test(input) && /[a-zA-Z]{2}/.test(input)) return "city";
    return "invalid";
  }

  function normalizedConfiguration(configuration = serviceAreas) {
    return {
      cities: (configuration.cities || []).map(normalizeCity),
      zipCodes: (configuration.zipCodes || []).map(value => normalizeZip(value)),
      counties: (configuration.counties || []).map(normalizeCity),
      notes: String(configuration.notes || "").trim(),
    };
  }

  function checkServiceArea(value, configuration = serviceAreas) {
    const entered = String(value || "").trim();
    const type = inputType(entered);
    if (type === "invalid") return { status: "invalid", entered, ...messages.invalid, notes: "" };

    const config = normalizedConfiguration(configuration);
    const configured = config.cities.length + config.zipCodes.length + config.counties.length > 0;
    if (!configured) return { status: "unknown", entered, ...messages.unknown, notes: config.notes };

    const normalized = type === "zip" ? normalizeZip(entered) : normalizeCity(entered);
    const matches = type === "zip"
      ? config.zipCodes.includes(normalized)
      : config.cities.includes(normalized) || config.counties.includes(normalized);
    const state = matches ? "standard" : "outside";
    return { status: state, entered, ...messages[state], notes: config.notes };
  }

  function prefillLocation(fields, location) {
    return { ...fields, location: String(location || "").trim() };
  }

  const api = Object.freeze({ serviceAreas, messages, normalizeCity, normalizeZip, inputType, checkServiceArea, prefillLocation });
  globalScope.HHServiceArea = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
