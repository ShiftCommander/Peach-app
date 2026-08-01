const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const read = (fileName) => fs.readFileSync(path.join(projectRoot, fileName), 'utf8');

test('wheel visuals inherit one rotation value from the dial', () => {
  const app = read('app.js');
  const index = read('index.html');
  const lens = read('dial-lens.js');
  const baseCss = read('styles.css');
  const css = read('dial-lens.css');

  assert.match(app, /return wheel\.closest\('\.dial'\) \|\| wheel;/);
  assert.match(app, /requestAnimationFrame\(forceSavedManagerClosedOnBoot\);\s+renderChromaticWheel\(null\);/);
  assert.equal((app.match(/setProperty\('--wheel-rotation'/g) || []).length, 1);
  assert.doesNotMatch(index, /dial-smooth\.js/);
  assert.doesNotMatch(lens, /setProperty\('--wheel-rotation'/);
  assert.doesNotMatch(baseCss, /transition:[^;]*transform 138ms/);
  assert.match(css, /\.chromatic-wheel[\s\S]*rotate\(var\(--wheel-rotation, 0deg\)\)/);
  assert.equal((css.match(/rotate\(var\(--wheel-rotation, 0deg\)\)/g) || []).length, 1);
  assert.match(css, /\.chromatic-wheel--lens\s*\{[^}]*transition:\s*none !important;/);
});
