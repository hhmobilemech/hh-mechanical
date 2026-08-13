const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { buildSmsUrl } = require("../service-request.js");

const project = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(project, "app.js"), "utf8");
const html = fs.readFileSync(path.join(project, "index.html"), "utf8");

test("one operational business phone constant contains the official dialing value", () => {
  const declarations = [...app.matchAll(/const BUSINESS_PHONE\s*=\s*"([^"]*)"/g)];
  assert.equal(declarations.length, 1);
  assert.equal(declarations[0][1], "+12052437867");
  assert.match(app, /link\.href = `tel:\$\{BUSINESS_PHONE\}`/);
  assert.match(app, /buildSmsUrl\(BUSINESS_PHONE, formattedRequest\)/);
});

test("all phone-action links are managed by the central phone configuration", () => {
  const phoneActions = [...html.matchAll(/<a\b[^>]*class="[^"]*phone-action[^"]*"[^>]*>/g)].map(match => match[0]);
  assert.equal(phoneActions.length, 8);
  assert.ok(phoneActions.every(link => link.includes("data-phone-link")));
});

test("official formatted number appears in the header, hero, and Contact section", () => {
  assert.match(html, /class="header-phone[^>]+>205-243-7867<\/a>/);
  assert.match(html, /Call or text <a[^>]+>205-243-7867<\/a>/i);
  assert.match(html, /<span>Call or Text<\/span>\s*<a[^>]+>205-243-7867<\/a>/);
});

test("official number produces the SMS recipient without changing the prepared body", () => {
  const message = "H&H MECHANICAL SERVICE REQUEST\n\nProblem:\nNo start & clicking";
  const url = buildSmsUrl("+12052437867", message);
  assert.equal(url, `sms:+12052437867?&body=${encodeURIComponent(message)}`);
});

test("customer-facing phone placeholders have been removed", () => {
  assert.doesNotMatch(html, /phone number coming soon/i);
  assert.doesNotMatch(app, /BUSINESS_PHONE\s*=\s*""/);
});
