// This single dialing-safe value powers every phone call and SMS request.
const BUSINESS_PHONE = "+12052437867";

function displayPhoneNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return local.length === 10
    ? `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}` : String(value || "");
}

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const menuLabel = menuButton.querySelector(".sr-only");

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuLabel.textContent = "Open navigation";
  navigation.classList.remove("open");
  document.body.classList.remove("menu-open");
}

menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  menuLabel.textContent = open ? "Close navigation" : "Open navigation";
  navigation.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
});

navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });

const phoneLinks = document.querySelectorAll("[data-phone-link]");
const phoneDisplays = document.querySelectorAll("[data-phone-display]");

if (BUSINESS_PHONE) {
  phoneLinks.forEach(link => { link.href = `tel:${BUSINESS_PHONE}`; });
  phoneDisplays.forEach(display => { display.textContent = displayPhoneNumber(BUSINESS_PHONE); });
} else {
  phoneLinks.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
    });
  });
}

document.querySelector("[data-current-year]").textContent = new Date().getFullYear();

const requestContext = {
  diagnostic: "",
  diagnosticSummary: "",
  problemArea: "",
  symptoms: [],
  timing: "",
  vehicleArea: "",
  vehicleSummary: "",
  vehicleType: "",
  engineTrim: "",
  landmark: "",
  bestTime: "",
  additionalNotes: "",
  serviceArea: "",
};

const diagnosticDialog = document.querySelector("[data-diagnostic-dialog]");
const diagnosticView = diagnosticDialog.querySelector("[data-diagnostic-view]");
const diagnosticBack = diagnosticDialog.querySelector("[data-diagnostic-back]");
const diagnosticProgress = diagnosticDialog.querySelector("[data-diagnostic-progress]");
const diagnosticSession = HHDiagnostic.createSession();
let diagnosticTrigger = null;
let diagnosticResultReceiver = null;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function animateDiagnosticView() {
  diagnosticView.classList.remove("diagnostic-view-enter");
  void diagnosticView.offsetWidth;
  diagnosticView.classList.add("diagnostic-view-enter");
}

function renderDiagnostic() {
  const state = diagnosticSession.current();
  diagnosticView.replaceChildren();
  diagnosticBack.disabled = !diagnosticSession.canGoBack();
  diagnosticProgress.style.width = state.type === "result" ? "100%"
    : `${Math.min(80, 24 + diagnosticSession.selections().length * 28)}%`;

  if (state.type === "result") renderDiagnosticResult(state);
  else renderDiagnosticQuestion(state);
  animateDiagnosticView();
}

function renderDiagnosticQuestion(state) {
  const question = element("h3", "diagnostic-question", state.prompt);
  question.tabIndex = -1;
  diagnosticView.append(question);

  if (state.warning) {
    diagnosticView.append(element("p", "diagnostic-warning", state.warning));
  }

  const choices = element("div", `diagnostic-options ${state.optionClass || ""}`.trim());
  state.options.forEach((choice, index) => {
    const button = element("button", "diagnostic-option", choice.label);
    button.type = "button";
    button.addEventListener("click", () => {
      diagnosticSession.select(index);
      renderDiagnostic();
      diagnosticView.querySelector("h3").focus();
    });
    choices.append(button);
  });
  diagnosticView.append(choices);
  question.focus();
}

function renderDiagnosticResult(state) {
  const heading = element("h3", "diagnostic-question", "Possible Systems to Inspect");
  heading.tabIndex = -1;
  diagnosticView.append(heading);

  const trail = element("div", "diagnostic-trail");
  state.selections.forEach(item => trail.append(element("span", "", item.label)));
  diagnosticView.append(trail);

  if (state.warning) diagnosticView.append(element("p", "diagnostic-warning", state.warning));
  diagnosticView.append(element("p", "diagnostic-explanation", state.explanation));

  const causes = element("ul", "diagnostic-causes");
  state.causes.forEach(cause => causes.append(element("li", "", cause)));
  diagnosticView.append(causes);
  diagnosticView.append(element("p", "diagnostic-result-note", HHDiagnostic.common.resultNote));

  const actions = element("div", "diagnostic-result-actions");
  const request = element("button", "button", "Request Mobile Diagnostic");
  request.type = "button";
  request.addEventListener("click", () => requestDiagnosticService(state.summary));
  const reset = element("button", "button button-outline", "Start Over");
  reset.type = "button";
  reset.addEventListener("click", resetDiagnostic);
  const close = element("button", "diagnostic-control", "Close");
  close.type = "button";
  close.addEventListener("click", closeDiagnostic);
  actions.append(request, reset, close);
  diagnosticView.append(actions);
  heading.focus();
}

function openDiagnostic(event) {
  diagnosticTrigger = event.currentTarget;
  diagnosticSession.reset();
  const initialChoice = Number.parseInt(event.currentTarget.dataset.diagnosticInitial, 10);
  if (Number.isInteger(initialChoice) && initialChoice >= 0) diagnosticSession.select(initialChoice);
  diagnosticDialog.showModal();
  document.body.classList.add("diagnostic-open");
  renderDiagnostic();
}

function closeDiagnostic() {
  if (!diagnosticDialog.open) return;
  diagnosticDialog.close();
  document.body.classList.remove("diagnostic-open");
  diagnosticTrigger?.focus();
}

function resetDiagnostic() {
  diagnosticSession.reset();
  renderDiagnostic();
}

function requestDiagnosticService(summary) {
  const problem = document.querySelector("#problem");
  const result = diagnosticSession.current();
  if (diagnosticResultReceiver && result.type === "result") {
    const receiver = diagnosticResultReceiver;
    diagnosticResultReceiver = null;
    closeDiagnostic();
    receiver(result, summary);
    return;
  }
  requestContext.diagnostic = result.type === "result"
    ? result.selections.map(selection => selection.label).join(" > ") : "";
  requestContext.diagnosticSummary = summary;
  problem.value = HHDiagnostic.mergeSummary(problem.value, summary);
  closeDiagnostic();
  document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
  problem.focus({ preventScroll: true });
}

document.querySelectorAll("[data-diagnostic-open]").forEach(button => button.addEventListener("click", openDiagnostic));
diagnosticDialog.querySelectorAll("[data-diagnostic-close]").forEach(button => button.addEventListener("click", closeDiagnostic));
diagnosticDialog.querySelectorAll("[data-diagnostic-reset]").forEach(button => button.addEventListener("click", resetDiagnostic));
diagnosticBack.addEventListener("click", () => { diagnosticSession.back(); renderDiagnostic(); });
diagnosticDialog.addEventListener("cancel", event => { event.preventDefault(); closeDiagnostic(); });
diagnosticDialog.addEventListener("click", event => {
  if (event.target === diagnosticDialog) closeDiagnostic();
});

const vehicleMap = document.querySelector("[data-vehicle-map]");

if (vehicleMap) {
  const hotspots = [...vehicleMap.querySelectorAll("[data-vehicle-hotspot]")];
  const regions = [...vehicleMap.querySelectorAll("[data-vehicle-region]")];
  const resultPanel = vehicleMap.querySelector("[data-vehicle-result]");
  const areaHeading = vehicleMap.querySelector("[data-vehicle-area]");
  const serviceList = vehicleMap.querySelector("[data-vehicle-services]");
  const requestButton = vehicleMap.querySelector("[data-vehicle-request]");
  const diagnosticButton = vehicleMap.querySelector("[data-vehicle-diagnostic]");
  let selectedAreaId = null;

  function regionFor(id) {
    return regions.find(region => region.dataset.vehicleRegion === id);
  }

  function previewArea(id, active) {
    if (id === selectedAreaId) return;
    regionFor(id)?.classList.toggle("is-preview", active);
  }

  function selectVehicleArea(id) {
    const area = HHVehicleMap.getArea(id);
    if (!area) return;
    selectedAreaId = id;
    requestContext.vehicleArea = area.name;
    requestContext.vehicleSummary = area.summary;
    hotspots.forEach(hotspot => {
      const selected = hotspot.dataset.vehicleHotspot === id;
      hotspot.classList.toggle("is-selected", selected);
      hotspot.setAttribute("aria-pressed", String(selected));
    });
    regions.forEach(region => {
      region.classList.remove("is-preview");
      region.classList.toggle("is-selected", region.dataset.vehicleRegion === id);
    });
    areaHeading.textContent = area.name;
    serviceList.replaceChildren(...area.services.map(service => element("li", "", service)));
    requestButton.disabled = false;
    diagnosticButton.disabled = false;
    diagnosticButton.dataset.diagnosticInitial = String(area.diagnosticInitial);
    resultPanel.classList.remove("vehicle-result-updated");
    void resultPanel.offsetWidth;
    resultPanel.classList.add("vehicle-result-updated");
  }

  hotspots.forEach(hotspot => {
    const id = hotspot.dataset.vehicleHotspot;
    hotspot.addEventListener("click", () => selectVehicleArea(id));
    hotspot.addEventListener("pointerenter", () => previewArea(id, true));
    hotspot.addEventListener("pointerleave", () => previewArea(id, false));
    hotspot.addEventListener("focus", () => previewArea(id, true));
    hotspot.addEventListener("blur", () => previewArea(id, false));
  });

  requestButton.addEventListener("click", () => {
    const summary = HHVehicleMap.serviceSummary(selectedAreaId);
    if (!summary) return;
    const problem = document.querySelector("#problem");
    problem.value = HHDiagnostic.mergeSummary(problem.value, summary);
    document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
    problem.focus({ preventScroll: true });
  });

  diagnosticButton.addEventListener("click", openDiagnostic);
}

const areaChecker = document.querySelector("[data-area-checker]");

if (areaChecker) {
  const checkerForm = areaChecker.querySelector("[data-area-checker-form]");
  const checkerInput = checkerForm.querySelector("input");
  const resultPanel = areaChecker.querySelector("[data-area-checker-result]");
  const resultTitle = resultPanel.querySelector("[data-area-result-title]");
  const resultMessage = resultPanel.querySelector("[data-area-result-message]");
  const resultNote = resultPanel.querySelector("[data-area-result-note]");
  const resultActions = resultPanel.querySelector("[data-area-result-actions]");
  const callAction = resultPanel.querySelector("[data-area-call]");
  const requestAction = resultPanel.querySelector("[data-area-request]");
  let latestResult = null;

  function renderAreaResult(result) {
    latestResult = result;
    requestContext.serviceArea = result.status === "invalid" ? ""
      : `${result.entered} — ${result.title}`;
    resultPanel.hidden = false;
    resultPanel.dataset.areaState = result.status;
    resultTitle.textContent = result.title;
    resultMessage.textContent = result.message;
    resultNote.textContent = result.notes;
    resultNote.hidden = !result.notes;
    resultActions.hidden = result.status === "invalid";
    callAction.textContent = result.status === "outside" ? "Call to Confirm" : "Call Now";
    checkerInput.setAttribute("aria-invalid", String(result.status === "invalid"));
    resultPanel.classList.remove("area-result-updated");
    void resultPanel.offsetWidth;
    resultPanel.classList.add("area-result-updated");
  }

  checkerForm.addEventListener("submit", event => {
    event.preventDefault();
    renderAreaResult(HHServiceArea.checkServiceArea(checkerInput.value));
    if (latestResult.status === "invalid") checkerInput.focus();
  });

  requestAction.addEventListener("click", () => {
    if (!latestResult || latestResult.status === "invalid") return;
    const location = document.querySelector("#location");
    location.value = latestResult.entered;
    document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
    location.focus({ preventScroll: true });
  });
}

const serviceRequestForm = document.querySelector("[data-service-form]");

if (serviceRequestForm) {
  const status = serviceRequestForm.querySelector("[data-form-status]");
  const errorPanel = serviceRequestForm.querySelector("[data-form-errors]");
  const readyPanel = serviceRequestForm.querySelector("[data-request-ready]");
  const readyMessage = readyPanel.querySelector("[data-request-ready-message]");
  const preview = readyPanel.querySelector("[data-request-preview]");
  const copyButton = readyPanel.querySelector("[data-copy-request]");
  const copyStatus = readyPanel.querySelector("[data-copy-status]");
  let formattedRequest = "";

  function formValues() {
    return {
      name: serviceRequestForm.elements.name.value,
      phone: serviceRequestForm.elements.phone.value,
      year: serviceRequestForm.elements["vehicle-year"].value,
      make: serviceRequestForm.elements["vehicle-make"].value,
      model: serviceRequestForm.elements["vehicle-model"].value,
      location: serviceRequestForm.elements.location.value,
      problem: serviceRequestForm.elements.problem.value,
    };
  }

  function showValidation(errors) {
    errorPanel.replaceChildren();
    const heading = element("strong", "", "Please complete the request:");
    const list = element("ul");
    errors.forEach(error => list.append(element("li", "", error)));
    errorPanel.append(heading, list);
    errorPanel.hidden = false;
    status.textContent = "Service request needs more information.";
    readyPanel.hidden = true;
  }

  serviceRequestForm.addEventListener("submit", event => {
    event.preventDefault();
    const validation = HHServiceRequest.validateRequest(formValues());
    if (!validation.valid) {
      showValidation(validation.errors);
      serviceRequestForm.querySelector(":invalid")?.focus();
      return;
    }

    errorPanel.hidden = true;
    formattedRequest = HHServiceRequest.formatRequest(validation.values, requestContext);
    preview.textContent = formattedRequest;
    readyPanel.hidden = false;
    copyStatus.textContent = "";

    const platform = HHServiceRequest.smsPlatform(navigator);
    const smsUrl = HHServiceRequest.buildSmsUrl(BUSINESS_PHONE, formattedRequest, platform);
    const canOpenSms = Boolean(smsUrl) && HHServiceRequest.isMobileDevice(navigator);
    if (canOpenSms) {
      status.textContent = "Opening your messaging app. Review the request and press Send.";
      readyMessage.textContent = "Your messaging app is opening. Review the request and press Send yourself. Your form information remains on this page.";
      window.location.href = smsUrl;
    } else {
      status.textContent = BUSINESS_PHONE
        ? "Service request ready. Copy it or call H&H from this device."
        : "Service request ready. Add the business phone number before SMS delivery is available.";
      readyMessage.textContent = "This device may not support SMS links. Copy the complete request below or call H&H. Nothing has been marked as sent.";
    }
  });

  copyButton.addEventListener("click", async () => {
    if (!formattedRequest) return;
    try {
      await navigator.clipboard.writeText(formattedRequest);
      copyStatus.textContent = "Request copied.";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(preview);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = "Select Copy from your browser to copy the highlighted request.";
    }
  });
}

const garageDialog = document.querySelector("[data-garage-dialog]");

if (garageDialog) {
  const garageSession = HHGarage.createSession();
  const stepView = garageDialog.querySelector("[data-garage-step]");
  const progress = garageDialog.querySelector("[data-garage-progress]");
  const summaryView = garageDialog.querySelector("[data-garage-summary]");
  const errorView = garageDialog.querySelector("[data-garage-error]");
  const backButton = garageDialog.querySelector("[data-garage-back]");
  const nextButton = garageDialog.querySelector("[data-garage-next]");
  let garageTrigger = null;
  let garageInitialized = false;

  function garageInput(label, key, options = {}) {
    const field = element("div", "garage-field");
    const id = `garage-${key}`;
    const labelNode = element("label", "", label);
    labelNode.htmlFor = id;
    const input = document.createElement(options.multiline ? "textarea" : "input");
    input.id = id;
    input.value = garageSession.get()[key];
    if (options.type) input.type = options.type;
    if (options.inputMode) input.inputMode = options.inputMode;
    if (options.placeholder) input.placeholder = options.placeholder;
    if (options.multiline) input.rows = 4;
    input.addEventListener("input", () => {
      garageSession.set({ [key]: input.value });
      options.onInput?.(input.value);
      updateGarageSummary();
    });
    field.append(labelNode, input);
    return field;
  }

  function choiceGrid(values, selected, callback, multiple = false) {
    const grid = element("div", "garage-choices");
    values.forEach(value => {
      const button = element("button", `garage-choice ${multiple ? "garage-choice-multi" : ""}`, value);
      button.type = "button";
      const active = multiple ? selected.includes(value) : selected === value;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
      button.addEventListener("click", () => { callback(value); renderGarage(); });
      grid.append(button);
    });
    return grid;
  }

  function renderVehicleStep(state) {
    stepView.append(element("p", "garage-kicker", "Step 1 // Vehicle"), element("h3", "", "What Are You Driving?"));
    stepView.append(choiceGrid(HHGarage.vehicleTypes, state.vehicleType, value => garageSession.set({ vehicleType: value })));
    const fields = element("div", "garage-fields garage-fields-vehicle");
    fields.append(garageInput("Year", "year", { inputMode: "numeric" }), garageInput("Make", "make"),
      garageInput("Model", "model"), garageInput("Engine / Trim (Optional)", "engineTrim"));
    stepView.append(fields);
  }

  function renderAreaStep(state) {
    stepView.append(element("p", "garage-kicker", "Step 2 // Area"), element("h3", "", "Where Is the Problem?"));
    const choices = Object.entries(HHGarage.areas).map(([id, area]) => ({ id, name: area.name }));
    const grid = element("div", "garage-choices garage-area-choices");
    choices.forEach(({ id, name }) => {
      const button = element("button", "garage-choice", name); button.type = "button";
      button.classList.toggle("is-selected", state.areaId === id); button.setAttribute("aria-pressed", String(state.areaId === id));
      button.addEventListener("click", () => {
        garageSession.set(state.areaId === id ? { areaId: id } : { areaId: id, symptoms: [], timing: "" });
        renderGarage();
      });
      grid.append(button);
    });
    stepView.append(grid);
  }

  function renderSymptomsStep(state) {
    stepView.append(element("p", "garage-kicker", "Step 3 // Symptoms"), element("h3", "", "What Is It Doing?"));
    if (state.areaId === "unsure") {
      const info = element("p", "garage-help", state.diagnostic || "Use the existing H&H Quick Diagnostic, or describe what you notice below.");
      const diagnostic = element("button", "button", state.diagnostic ? "Run Diagnostic Again" : "Run H&H Quick Diagnostic");
      diagnostic.type = "button";
      diagnostic.addEventListener("click", () => {
        diagnosticResultReceiver = (result, summary) => {
          garageSession.set({ diagnostic: result.selections.map(item => item.label).join(" > "), diagnosticSummary: summary });
          garageDialog.showModal(); document.body.classList.add("garage-open"); renderGarage();
        };
        garageDialog.close(); document.body.classList.remove("garage-open");
        openDiagnostic({ currentTarget: diagnostic });
      });
      stepView.append(info, diagnostic, garageInput("Additional Notes", "additionalNotes", { multiline: true }));
      return;
    }
    stepView.append(choiceGrid(HHGarage.areas[state.areaId].symptoms, state.symptoms,
      value => garageSession.toggleSymptom(value), true));
    stepView.append(element("h4", "garage-followup", "When Does It Happen?"));
    stepView.append(choiceGrid(HHGarage.timings, state.timing, value => garageSession.set({ timing: value })));
  }

  function renderLocationStep(state) {
    stepView.append(element("p", "garage-kicker", "Step 4 // Location"), element("h3", "", "Where Is the Vehicle?"));
    const status = element("p", "garage-area-status");
    status.setAttribute("aria-live", "polite");
    function updateLocationStatus(value) {
      const entered = value.trim();
      if (!entered) {
        garageSession.set({ serviceAreaStatus: "" });
        status.hidden = true;
        return;
      }
      const result = HHServiceArea.checkServiceArea(entered);
      const serviceAreaStatus = result.status === "invalid" ? result.title : `${entered} — ${result.title}`;
      garageSession.set({ serviceAreaStatus });
      status.className = `garage-area-status garage-area-${result.status}`;
      status.textContent = result.title;
      status.hidden = false;
    }
    stepView.append(garageInput("City / Location", "location", { onInput: updateLocationStatus }),
      garageInput("Address or Landmark (Optional)", "landmark"), status);
    updateLocationStatus(state.location);
  }

  function renderContactStep() {
    stepView.append(element("p", "garage-kicker", "Step 5 // Contact"), element("h3", "", "How Should H&H Reach You?"));
    stepView.append(garageInput("Name", "name"), garageInput("Phone", "phone", { type: "tel", inputMode: "tel" }),
      garageInput("Best Time to Contact (Optional)", "bestTime"),
      garageInput("Additional Notes (Optional)", "additionalNotes", { multiline: true }));
  }

  function renderReviewStep(state) {
    stepView.append(element("p", "garage-kicker", "Step 6 // Review"), element("h3", "", "Review Your Request"));
    const review = element("pre", "garage-review", HHGarage.summary(state));
    const actions = element("div", "garage-review-actions");
    const send = element("button", "button", "Send Request to H&H"); send.type = "button";
    send.addEventListener("click", sendGarageRequest);
    const edit = element("button", "button button-outline", "Edit Request"); edit.type = "button";
    edit.addEventListener("click", () => { garageSession.set({ step: 0 }); renderGarage(); });
    const reset = element("button", "diagnostic-control", "Start Over"); reset.type = "button";
    reset.addEventListener("click", () => {
      if (HHGarage.hasRequestData(garageSession.get())
        && !window.confirm("Start over and clear this service request?")) return;
      garageSession.reset(); renderGarage();
    });
    actions.append(send, edit, reset); stepView.append(review, actions);
  }

  function updateGarageSummary() { summaryView.textContent = HHGarage.summary(garageSession.get()); }

  function renderGarage() {
    const state = garageSession.get();
    stepView.replaceChildren(); errorView.textContent = "";
    progress.replaceChildren(...HHGarage.steps.map((name, index) => {
      const item = element("li", index === state.step ? "is-active" : index < state.step ? "is-complete" : "", `${index + 1} ${name}`);
      if (index === state.step) item.setAttribute("aria-current", "step"); return item;
    }));
    [renderVehicleStep, renderAreaStep, renderSymptomsStep, renderLocationStep, renderContactStep, renderReviewStep][state.step](state);
    backButton.disabled = state.step === 0; nextButton.hidden = state.step === 5;
    nextButton.textContent = state.step === 4 ? "Review Request" : "Next";
    updateGarageSummary();
    stepView.classList.remove("garage-step-enter"); void stepView.offsetWidth; stepView.classList.add("garage-step-enter");
    stepView.querySelector("h3")?.setAttribute("tabindex", "-1"); stepView.querySelector("h3")?.focus();
  }

  function syncGarageToForm() {
    const converted = HHGarage.toRequest(garageSession.get(), requestContext);
    const fields = serviceRequestForm.elements;
    fields.name.value = converted.data.name; fields.phone.value = converted.data.phone;
    fields["vehicle-year"].value = converted.data.year; fields["vehicle-make"].value = converted.data.make;
    fields["vehicle-model"].value = converted.data.model; fields.location.value = converted.data.location;
    fields.problem.value = converted.data.problem;
    Object.assign(requestContext, converted.context);
  }

  function sendGarageRequest() {
    syncGarageToForm(); garageDialog.close(); document.body.classList.remove("garage-open");
    document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
    serviceRequestForm.requestSubmit();
  }

  document.querySelectorAll("[data-garage-open]").forEach(button => button.addEventListener("click", event => {
    garageTrigger = event.currentTarget;
    if (!garageInitialized) {
      const fields = serviceRequestForm.elements;
      garageSession.set({ name: fields.name.value, phone: fields.phone.value, year: fields["vehicle-year"].value,
        make: fields["vehicle-make"].value, model: fields["vehicle-model"].value, location: fields.location.value,
        diagnostic: requestContext.diagnostic,
        diagnosticSummary: requestContext.diagnosticSummary, vehicleMapSelection: requestContext.vehicleArea });
      garageInitialized = true;
    }
    const saved = garageSession.get();
    garageSession.set({ diagnostic: saved.diagnostic || requestContext.diagnostic,
      diagnosticSummary: saved.diagnosticSummary || requestContext.diagnosticSummary,
      vehicleMapSelection: requestContext.vehicleArea || saved.vehicleMapSelection });
    garageDialog.showModal(); document.body.classList.add("garage-open"); renderGarage();
  }));
  garageDialog.querySelector("[data-garage-close]").addEventListener("click", () => {
    garageDialog.close(); document.body.classList.remove("garage-open"); garageTrigger?.focus();
  });
  garageDialog.addEventListener("cancel", () => { document.body.classList.remove("garage-open"); });
  backButton.addEventListener("click", () => { garageSession.back(); renderGarage(); });
  nextButton.addEventListener("click", () => {
    const current = garageSession.get();
    if (current.step === 3 && current.location.trim()) {
      const result = HHServiceArea.checkServiceArea(current.location);
      garageSession.set({ serviceAreaStatus: `${current.location.trim()} — ${result.title}` });
    }
    const error = garageSession.validate(); if (error) { errorView.textContent = error; return; }
    garageSession.next(); renderGarage();
  });
}
