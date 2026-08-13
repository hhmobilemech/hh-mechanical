(function initializeServiceRequest(globalScope) {
  "use strict";

  const requiredFields = Object.freeze(["name", "phone", "year", "make", "model", "location", "problem"]);

  function clean(value) {
    return String(value || "").trim();
  }

  function validateRequest(data) {
    const values = Object.fromEntries(requiredFields.map(field => [field, clean(data[field])]));
    const errors = [];
    if (!values.name) errors.push("Enter your name.");
    if (!values.phone) errors.push("Enter your phone number.");
    if (!values.year || !values.make || !values.model) errors.push("Enter the vehicle year, make, and model.");
    if (!values.location) errors.push("Enter the current location or city.");
    if (!values.problem) errors.push("Describe the vehicle problem.");
    return { valid: errors.length === 0, errors, values };
  }

  function withoutIntegratedSummaries(problem, context = {}) {
    let result = clean(problem);
    for (const summary of [context.diagnosticSummary, context.vehicleSummary]) {
      const text = clean(summary);
      if (!text) continue;
      result = result.replace(`\n\n${text}`, "").replace(text, "").trim();
    }
    return result;
  }

  function formatRequest(data, context = {}) {
    const values = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, clean(value)]));
    const lines = ["H&H MECHANICAL SERVICE REQUEST"];
    if (values.name) lines.push("", `Name: ${values.name}`);
    if (values.phone) lines.push(`Phone: ${values.phone}`);

    const vehicle = [values.year, values.make, values.model].filter(Boolean).join(" ");
    if (vehicle) lines.push("", "Vehicle:", vehicle);
    if (values.location) lines.push("", "Location:", values.location);

    const problem = withoutIntegratedSummaries(values.problem, context);
    if (problem) lines.push("", "Problem:", problem);
    if (clean(context.diagnostic)) lines.push("", "Diagnostic:", clean(context.diagnostic));
    if (clean(context.vehicleArea)) lines.push("", "Vehicle Area:", clean(context.vehicleArea));
    if (clean(context.serviceArea)) lines.push("", "Service Area Check:", clean(context.serviceArea));
    lines.push("", "Please contact me about mobile service.");
    return lines.join("\n");
  }

  function buildSmsUrl(phone, message) {
    const recipient = clean(phone);
    if (!recipient) return "";
    return `sms:${recipient}?&body=${encodeURIComponent(String(message || ""))}`;
  }

  function isMobileDevice(navigatorObject = {}) {
    if (navigatorObject.userAgentData?.mobile === true) return true;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(String(navigatorObject.userAgent || ""));
  }

  const api = Object.freeze({ requiredFields, validateRequest, withoutIntegratedSummaries, formatRequest, buildSmsUrl, isMobileDevice });
  globalScope.HHServiceRequest = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
