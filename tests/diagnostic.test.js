const assert = require("node:assert/strict");
const test = require("node:test");
const { common, createSession, mergeSummary, trees } = require("../diagnostic.js");

function walkEveryBranch(nodeId = "start", path = [], branches = []) {
  const node = trees[nodeId];
  node.options.forEach((choice, index) => {
    const nextPath = [...path, index];
    if (choice.next) walkEveryBranch(choice.next, nextPath, branches);
    else branches.push(nextPath);
  });
  return branches;
}

function complete(path) {
  const session = createSession();
  path.forEach(index => session.select(index));
  return { session, result: session.current() };
}

test("every configured diagnostic branch reaches a complete, non-definitive result", () => {
  const branches = walkEveryBranch();
  assert.equal(branches.length, 85);
  for (const path of branches) {
    const { result } = complete(path);
    assert.equal(result.type, "result");
    assert.ok(result.causes.length > 0);
    assert.ok(result.causes.every(cause => typeof cause === "string" && cause.length > 0));
    assert.match(result.summary, /^H&H Quick Diagnostic:/);
    assert.match(result.summary, /Possible .+\.$/);
    assert.doesNotMatch(result.explanation, /definitely|guaranteed/i);
  }
});

test("initial menu exposes all nine requested symptom categories", () => {
  const labels = createSession().current().options.map(choice => choice.label);
  assert.deepEqual(labels, ["Won't Start", "Overheating", "Running Rough", "Warning Light", "Brake Problem",
    "Steering / Suspension", "Electrical Problem", "Strange Noise", "Other"]);
});

test("won't-start choices produce the matching starting-system possibilities", () => {
  const node = trees["wont-start"];
  assert.equal(node.options.length, 5);
  node.options.forEach((choice, index) => {
    const { result } = complete([0, index]);
    assert.equal(result.selections.at(-1).label, choice.label);
    assert.deepEqual(result.causes, choice.causes);
  });
  assert.match(complete([0, 2]).result.summary, /Rapid clicking when attempting to start/);
  assert.match(complete([0, 2]).result.summary, /Possible starting\/charging-system issue/);
});

test("overheating branches always carry causes and the engine-damage warning", () => {
  trees.overheating.options.forEach((choice, index) => {
    const { result } = complete([1, index]);
    assert.deepEqual(result.causes, choice.causes);
    assert.match(result.warning, /shut it off/i);
    assert.match(result.warning, /serious damage/i);
  });
});

test("warning-light branches explain each light and elevate temperature and oil pressure", () => {
  trees["warning-light"].options.forEach((choice, index) => {
    const { result } = complete([3, index]);
    assert.ok(result.explanation.length > 20);
    assert.deepEqual(result.causes, choice.causes);
  });
  assert.match(complete([3, 2]).result.warning, /engine damage/i);
  assert.match(complete([3, 6]).result.warning, /engine damage/i);
});

test("serious brake symptoms advise against driving", () => {
  assert.match(complete([4, 3]).result.warning, /do not drive/i);
  assert.match(complete([4, 5]).result.warning, /do not drive/i);
});

test("noise checker records both location and sound without claiming certainty", () => {
  for (let location = 0; location < trees["noise-location"].options.length; location += 1) {
    for (let sound = 0; sound < trees["noise-sound"].options.length; sound += 1) {
      const { result } = complete([7, location, sound]);
      assert.equal(result.selections.length, 3);
      assert.match(result.causes[0], /inspection/i);
      assert.doesNotMatch(result.summary, /is bad|failed component/i);
    }
  }
});

test("Back returns through multi-step selections and can revise a result", () => {
  const session = createSession();
  session.select(7);
  session.select(0);
  session.select(2);
  assert.equal(session.current().type, "result");
  assert.equal(session.back().id, "noise-sound");
  assert.equal(session.selections().length, 2);
  assert.equal(session.back().id, "noise-location");
  assert.equal(session.selections().length, 1);
  assert.equal(session.back().id, "start");
  assert.equal(session.canGoBack(), false);
});

test("Start Over clears selections and restores the initial question", () => {
  const session = createSession();
  session.select(0);
  session.select(1);
  const state = session.reset();
  assert.equal(state.id, "start");
  assert.deepEqual(session.selections(), []);
  assert.equal(session.canGoBack(), false);
});

test("invalid selections fail predictably and result screens cannot be reselected", () => {
  const session = createSession();
  assert.throws(() => session.select(999), RangeError);
  session.select(8);
  assert.throws(() => session.select(0), /result screen/);
});

test("required safety and limitation language remains present", () => {
  assert.equal(common.disclaimer, "Possible causes only. A proper inspection is required to diagnose the vehicle.");
  assert.equal(common.resultNote, "This tool helps narrow down the type of problem. It does not replace a hands-on diagnosis.");
});

test("form integration preserves existing problem text while adding the diagnostic summary", () => {
  const summary = complete([0, 2]).result.summary;
  assert.equal(mergeSummary("", summary), summary);
  assert.equal(mergeSummary("Customer already entered this detail.", summary),
    `Customer already entered this detail.\n\n${summary}`);
  assert.equal(mergeSummary(summary, summary), summary, "the same result is not duplicated");
});
