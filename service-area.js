(function initializeServiceArea(globalScope) {
  "use strict";

  // This is the single source of truth for H&H's configured normal service area.
  // ZIP entries describe business coverage and are not county-boundary claims.
  const serviceAreas = Object.freeze({
    name: "Walker County, Alabama",
    cities: Object.freeze([
      "Jasper", "Carbon Hill", "Cordova", "Dora", "Sumiton", "Eldridge", "Kansas", "Nauvoo",
      "Oakman", "Parrish", "Sipsey", "Aldridge", "Argo", "Benoit", "Boldo", "Burnwell",
      "Coal Valley", "Corinth", "Corona", "Curry", "Dogtown", "Empire", "Goodsprings", "Gorgas",
      "Hilliard", "Lupton", "Manchester", "McCollum", "Mount Hope", "Patton", "Quinton",
      "Saragossa", "Slicklizzard", "Spring Hill", "Townley", "Union Chapel",
    ]),
    aliases: Object.freeze(["Barney", "Gravleeton", "Praco"]),
    zipCodes: Object.freeze([
      "35038", "35062", "35063", "35130", "35148", "35501", "35502", "35503", "35504",
      "35549", "35550", "35554", "35560", "35573", "35578", "35579", "35580", "35584", "35587",
    ]),
    counties: Object.freeze(["Walker County"]),
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
      title: "H&H Mechanical Services Your Area",
      message: "Walker County Mobile Service",
      notes: "Call or text 205-243-7867 to request service.",
      requestLabel: "WALKER COUNTY // STANDARD SERVICE AREA",
    }),
    outside: Object.freeze({
      title: "Outside Our Normal Service Area",
      message: "We may still be able to come to you depending on distance and availability.",
      notes: "Call or text 205-243-7867 to confirm service availability.",
      requestLabel: "OUTSIDE NORMAL AREA // CONFIRM AVAILABILITY",
    }),
  });

  function normalizeCity(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/\s*,\s*/g, ", ")
      .replace(/\s+/g, " ")
      .replace(/(?:,\s*|\s+)(?:al|alabama)$/i, "")
      .trim();
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
      aliases: (configuration.aliases || []).map(normalizeCity),
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
    const configured = config.cities.length + config.aliases.length + config.zipCodes.length + config.counties.length > 0;
    if (!configured) return { status: "unknown", entered, ...messages.unknown, notes: config.notes };

    const normalized = type === "zip" ? normalizeZip(entered) : normalizeCity(entered);
    const matches = type === "zip"
      ? config.zipCodes.includes(normalized)
      : config.cities.includes(normalized) || config.aliases.includes(normalized) || config.counties.includes(normalized);
    const state = matches ? "standard" : "outside";
    return { status: state, entered, ...messages[state], notes: messages[state].notes || config.notes };
  }

  function requestStatus(result) {
    return result?.requestLabel || "";
  }

  function prefillLocation(fields, location) {
    return { ...fields, location: String(location || "").trim() };
  }

  const api = Object.freeze({ serviceAreas, messages, normalizeCity, normalizeZip, inputType, checkServiceArea,
    requestStatus, prefillLocation });
  globalScope.HHServiceArea = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
