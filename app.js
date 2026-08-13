// Replace this one value when the business phone number is available.
// Use digits with an optional leading +, for example: "+15551234567".
const BUSINESS_PHONE = "";

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
const phoneNotes = document.querySelectorAll("[data-phone-note]");

if (BUSINESS_PHONE) {
  phoneLinks.forEach(link => { link.href = `tel:${BUSINESS_PHONE}`; });
  phoneNotes.forEach(note => { note.hidden = true; });
} else {
  phoneLinks.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
    });
  });
}

document.querySelector("[data-service-form]").addEventListener("submit", event => {
  event.preventDefault();
  event.currentTarget.querySelector("[data-form-status]").textContent =
    "REQUEST FORM DEMO // PHONE CONTACT RECOMMENDED";
});

document.querySelector("[data-current-year]").textContent = new Date().getFullYear();

const diagnosticDialog = document.querySelector("[data-diagnostic-dialog]");
const diagnosticView = diagnosticDialog.querySelector("[data-diagnostic-view]");
const diagnosticBack = diagnosticDialog.querySelector("[data-diagnostic-back]");
const diagnosticProgress = diagnosticDialog.querySelector("[data-diagnostic-progress]");
const diagnosticSession = HHDiagnostic.createSession();
let diagnosticTrigger = null;

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
