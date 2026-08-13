const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const project = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(project, "app.js"), "utf8");
const css = fs.readFileSync(path.join(project, "styles.css"), "utf8");
const html = fs.readFileSync(path.join(project, "index.html"), "utf8");

test("scroll reveals are one-shot and progressively enhanced", () => {
  assert.match(app, /new IntersectionObserver/);
  assert.match(app, /observer\.unobserve\(entry\.target\)/);
  assert.match(app, /"IntersectionObserver" in window/);
  assert.match(css, /\.reveal-pending\.is-revealed \{ opacity: 1; transform: none; \}/);
});

test("reduced motion removes reveal and component animation", () => {
  assert.match(app, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.reveal-pending, \.diagnostic-causes li/);
});

test("service cards, buttons, Garage, and diagnostic receive bounded interaction polish", () => {
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*\.service-card:hover/);
  assert.match(css, /\.button:active/);
  assert.match(css, /\.garage-choice:active/);
  assert.match(css, /\.diagnostic-warning/);
});

test("vehicle artwork orientation and hotspot coordinates remain untouched by polish", () => {
  assert.match(html, /vehicle-base" transform="translate\(900 0\) scale\(-1 1\)" data-vehicle-artwork-direction="left"/);
  assert.match(css, /\.hotspot-front-brakes \{ top: 78%; left: 23\.2%; \}/);
  assert.match(css, /\.hotspot-rear-brakes \{ top: 78%; left: 76\.7%; \}/);
});

test("polished assets are cache-versioned for static deployment", () => {
  assert.match(html, /styles\.css\?v=20260813-visual-polish/);
  assert.match(html, /app\.js\?v=20260813-walker-county/);
});
