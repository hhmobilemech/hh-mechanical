(function initializeDashboardStartup(globalScope) {
  "use strict";

  const TIMING = Object.freeze({ fullDuration: 2200, reducedDuration: 260, exitDuration: 240 });

  function createController({
    overlay,
    eventTarget,
    reducedMotion = false,
    schedule = globalScope.setTimeout.bind(globalScope),
    cancel = globalScope.clearTimeout.bind(globalScope),
    nextFrame = callback => globalScope.requestAnimationFrame(callback),
  }) {
    let finishTimer = null;
    let removeTimer = null;
    let finished = false;

    function remove() {
      if (!overlay) return;
      overlay.remove();
      eventTarget.removeEventListener("keydown", onKeydown);
      overlay.removeEventListener("pointerdown", skip);
    }

    function finish(immediate = false) {
      if (finished) return;
      finished = true;
      cancel(finishTimer);
      overlay.classList.add("is-exiting");
      overlay.style.pointerEvents = "none";
      removeTimer = schedule(remove, immediate ? 120 : TIMING.exitDuration);
    }

    function skip() { finish(true); }
    function onKeydown(event) { if (event.key === "Escape") skip(); }

    function start() {
      if (!overlay) return;
      eventTarget.addEventListener("keydown", onKeydown);
      overlay.addEventListener("pointerdown", skip);
      nextFrame(() => overlay.classList.add("is-running", reducedMotion ? "is-reduced" : "is-full"));
      finishTimer = schedule(() => finish(false), reducedMotion ? TIMING.reducedDuration : TIMING.fullDuration);
    }

    return Object.freeze({ start, skip, finish, isFinished: () => finished, timing: TIMING });
  }

  function mount(documentObject = globalScope.document) {
    if (!documentObject) return null;
    const overlay = documentObject.querySelector("[data-dashboard-startup]");
    if (!overlay) return null;
    const reducedMotion = globalScope.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    const controller = createController({ overlay, eventTarget: documentObject, reducedMotion });
    controller.start();
    return controller;
  }

  const api = Object.freeze({ TIMING, createController, mount });
  globalScope.HHDashboardStartup = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (globalScope.document) mount();
})(typeof globalThis !== "undefined" ? globalThis : window);
