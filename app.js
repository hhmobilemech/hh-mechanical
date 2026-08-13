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
