const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const project = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(project, "app.js"), "utf8");
const html = fs.readFileSync(path.join(project, "index.html"), "utf8");
const request = fs.readFileSync(path.join(project, "service-request.js"), "utf8");

test("service request has exactly one authoritative submit listener", () => {
  assert.equal((app.match(/serviceRequestForm\.addEventListener\("submit"/g) || []).length, 1);
  assert.equal((html.match(/data-service-form/g) || []).length, 1);
});

test("obsolete demo submission copy is absent from customer-facing sources", () => {
  for (const source of [html, app, request]) {
    assert.doesNotMatch(source, /REQUEST FORM DEMO|PHONE CONTACT RECOMMENDED/i);
  }
});

test("versioned request scripts bypass stale mobile copies after deployment", () => {
  assert.match(html, /service-request\.js\?v=20260813-garage-complete/);
  assert.match(html, /garage\.js\?v=20260813-garage-complete/);
  assert.match(html, /app\.js\?v=20260813-visual-polish/);
});

test("mobile handoff and desktop fallback share the same formatted request", () => {
  assert.match(app, /formattedRequest = HHServiceRequest\.formatRequest/);
  assert.match(app, /preview\.textContent = formattedRequest/);
  assert.match(app, /window\.location\.href = smsUrl/);
  assert.match(app, /const canOpenSms = Boolean\(smsUrl\) && HHServiceRequest\.isMobileDevice\(navigator\)/);
});

test("copy and official call fallback controls remain wired", () => {
  assert.match(app, /navigator\.clipboard\.writeText\(formattedRequest\)/);
  assert.match(html, /data-copy-request>Copy Request<\/button>/);
  assert.match(html, /data-phone-link[^>]*>Call H&amp;H<\/a>/);
});

test("interactive context is captured before formatting the request", () => {
  assert.match(app, /requestContext\.diagnostic =/);
  assert.match(app, /requestContext\.vehicleArea = area\.name/);
  assert.match(app, /requestContext\.serviceArea =/);
  assert.match(app, /formatRequest\(validation\.values, requestContext\)/);
});
