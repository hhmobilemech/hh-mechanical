const assert = require("node:assert/strict");
const test = require("node:test");
const { TIMING, createController } = require("../startup.js");

function fixture(reducedMotion = false) {
  const timers = [];
  const documentListeners = new Map();
  const overlayListeners = new Map();
  const classes = new Set();
  const overlay = {
    removed: false,
    style: {},
    classList: { add: (...names) => names.forEach(name => classes.add(name)) },
    addEventListener: (name, listener) => overlayListeners.set(name, listener),
    removeEventListener: name => overlayListeners.delete(name),
    remove() { this.removed = true; },
  };
  const eventTarget = {
    addEventListener: (name, listener) => documentListeners.set(name, listener),
    removeEventListener: name => documentListeners.delete(name),
  };
  const controller = createController({
    overlay, eventTarget, reducedMotion,
    schedule(callback, delay) { const timer = { callback, delay, cancelled: false }; timers.push(timer); return timer; },
    cancel(timer) { if (timer) timer.cancelled = true; },
    nextFrame(callback) { callback(); },
  });
  function runTimer(delay) {
    const timer = timers.find(item => item.delay === delay && !item.cancelled);
    assert.ok(timer, `expected an active ${delay}ms timer`);
    timer.callback();
  }
  return { controller, overlay, classes, timers, documentListeners, overlayListeners, runTimer };
}

test("full startup begins once and completes within the requested duration", () => {
  const state = fixture();
  state.controller.start();
  assert.ok(state.classes.has("is-running"));
  assert.ok(state.classes.has("is-full"));
  assert.equal(state.timers[0].delay, 2200);
  state.runTimer(TIMING.fullDuration);
  assert.ok(state.classes.has("is-exiting"));
  assert.equal(state.overlay.style.pointerEvents, "none");
  state.runTimer(TIMING.exitDuration);
  assert.equal(state.overlay.removed, true);
  assert.equal(state.documentListeners.size, 0);
  assert.equal(state.overlayListeners.size, 0);
});

test("pointer click or tap skips immediately and cancels normal completion", () => {
  const state = fixture();
  state.controller.start();
  state.overlayListeners.get("pointerdown")();
  assert.equal(state.controller.isFinished(), true);
  assert.equal(state.timers[0].cancelled, true);
  state.runTimer(120);
  assert.equal(state.overlay.removed, true);
});

test("Escape skips while unrelated keyboard input does not", () => {
  const state = fixture();
  state.controller.start();
  state.documentListeners.get("keydown")({ key: "Enter" });
  assert.equal(state.controller.isFinished(), false);
  state.documentListeners.get("keydown")({ key: "Escape" });
  assert.equal(state.controller.isFinished(), true);
  state.runTimer(120);
  assert.equal(state.overlay.removed, true);
});

test("reduced-motion mode uses the short reveal instead of the gauge-sweep wait", () => {
  const state = fixture(true);
  state.controller.start();
  assert.ok(state.classes.has("is-reduced"));
  assert.equal(state.timers[0].delay, TIMING.reducedDuration);
  assert.ok(TIMING.reducedDuration < 300);
  state.runTimer(TIMING.reducedDuration);
  state.runTimer(TIMING.exitDuration);
  assert.equal(state.overlay.removed, true);
});

test("finishing twice is harmless and creates only one removal timer", () => {
  const state = fixture();
  state.controller.start();
  state.controller.skip();
  state.controller.skip();
  assert.equal(state.timers.filter(timer => timer.delay === 120).length, 1);
});
