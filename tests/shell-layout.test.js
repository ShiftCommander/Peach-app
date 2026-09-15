const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const refinements = fs.readFileSync(path.join(root, 'ui-refinements.css'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('the obsolete header and settings drawer are absent', () => {
  assert.doesNotMatch(index, /class="app-header"/);
  assert.doesNotMatch(index, /id="library-menu-button"/);
  assert.doesNotMatch(index, /id="saved-drawer"/);
});

test('theme switching remains available at the end of the page', () => {
  assert.match(index, /class="theme-switch-footer"/);
  assert.match(index, /id="theme-toggle-button"/);
  assert.match(index, /id="theme-toggle-text"/);
});

test('theme switching uses the shared section spacing token', () => {
  assert.match(styles, /--space-section:\s*clamp\(/);
  assert.match(refinements, /\.theme-switch-footer\s*\{[\s\S]*margin-top:\s*var\(--space-section\);[\s\S]*padding:\s*0\s+0\s+var\(--shell-edge-bottom\);/);
  assert.doesNotMatch(refinements, /--theme-switch-reveal-space/);
});

test('wide tuning carousels keep horizontal scrolling and shadow clearance', () => {
  assert.match(styles, /--space-scroll-shadow:\s*var\(--space-6\);/);
  assert.match(styles, /\.tuning-scroll\s*\{[\s\S]*overflow-x:\s*auto;[\s\S]*padding:[^;]*var\(--space-scroll-shadow\)/);
  assert.match(styles, /@media \(min-width: 760px\) \{[\s\S]*?\.tuning-scroll\s*\{[\s\S]*?overflow-x:\s*auto;[\s\S]*?padding:[^;]*var\(--space-scroll-shadow\)/);
  assert.doesNotMatch(styles, /@media \(min-width: 760px\) \{[\s\S]*?\.tuning-scroll\s*\{[\s\S]*?overflow:\s*hidden;/);
});

test('the library search field has a visible search icon', () => {
  assert.match(index, /class="search-field-icon"/);
  assert.match(index, /id="saved-tuning-search"/);
});

test('the install card is an out-of-flow high-layer prompt', () => {
  assert.match(refinements, /\.pwa-card\s*\{[\s\S]*position:\s*fixed;/);
  assert.match(refinements, /\.pwa-card\s*\{[\s\S]*z-index:\s*80;/);
});

test('the refinement stylesheet is loaded and cached offline', () => {
  assert.match(index, /href="ui-refinements\.css"/);
  assert.match(serviceWorker, /'\.\/ui-refinements\.css'/);
});
