const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function count(text, token) {
  return text.split(token).length - 1;
}

test('Luthier CSS remains scoped and structurally valid', () => {
  const css = read('luthier-theme.css');
  const fidelity = read('luthier-fidelity.css');

  assert.match(css, /:root\[data-theme="luthier"\]/);
  assert.match(fidelity, /:root\[data-theme="luthier"\]/);
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /--luthier-ebony-grain:/);
  assert.match(css, /--luthier-rosewood-grain:/);
  assert.match(css, /\.dial-glass--smoked[\s\S]*?backdrop-filter:\s*none/);
  assert.equal(count(css, '{'), count(css, '}'));
  assert.equal(count(css, '('), count(css, ')'));
  assert.equal(count(fidelity, '{'), count(fidelity, '}'));
  assert.equal(count(fidelity, '('), count(fidelity, ')'));
  assert.doesNotMatch(css, /LUTHIER CSS PASS 2|NEUTRAL PLACEHOLDER/);
});

test('Luthier owns its material assets and fidelity layer loads after the Console lens stylesheet', () => {
  const html = read('index.html');
  const lensCss = read('dial-lens.css');
  const refinements = read('ui-refinements.css');
  const luthierIndex = html.indexOf('href="luthier-theme.css"');
  const fidelityIndex = html.indexOf('href="luthier-fidelity.css"');
  const lensIndex = html.indexOf('href="dial-lens.css"');
  const refinementsIndex = html.indexOf('href="ui-refinements.css"');

  assert.ok(lensIndex >= 0, 'dial-lens.css must remain loaded for Console');
  assert.ok(luthierIndex > lensIndex, 'luthier-theme.css must load after dial-lens.css');
  assert.ok(fidelityIndex > luthierIndex, 'luthier-fidelity.css must load after the base Luthier theme');
  assert.ok(refinementsIndex > fidelityIndex, 'cross-theme refinements must load after Luthier styling');
  assert.doesNotMatch(lensCss, /@import\s+url\(["']luthier-theme\.css["']\)/);
  assert.doesNotMatch(refinements, /:root\[data-theme="luthier"\]/);
});

test('Luthier uses dedicated wood and nacre textures and disables the Console loupe', () => {
  const css = `${read('luthier-theme.css')}\n${read('luthier-fidelity.css')}`;

  assert.match(css, /textures\/ebony-512\.webp/);
  assert.match(css, /textures\/rosewood-768\.webp/);
  assert.match(css, /textures\/nacre-strip\.webp/);
  assert.match(css, /:root\[data-theme="luthier"\]\s+\.dial-lens\s*\{[\s\S]*?display:\s*none\s*!important/);
  assert.match(css, /:root\[data-theme="luthier"\]\s+\.chromatic-wheel--lens\s*\{[\s\S]*?display:\s*none\s*!important/);
});

test('Luthier dial has a fixed needle and one rotating quarter-tone marker between notes', () => {
  const html = read('index.html');
  const css = read('luthier-theme.css');

  assert.match(html, /class="luthier-needle"/);
  assert.match(css, /:root\[data-theme="luthier"\]\s+\.luthier-needle/);
  assert.match(css, /repeating-conic-gradient\(from 15deg/);
  assert.match(css, /transparent\s+0\.28deg\s+30deg/);
});

test('Luthier frame and ornaments use the validated physical construction', () => {
  const fidelity = read('luthier-fidelity.css');
  const requiredAssets = [
    'ornaments/luthier-readout-flower.svg',
    'ornaments/luthier-divider.svg',
    'ornaments/luthier-finial.svg',
    'ornaments/luthier-binding-crown.svg',
  ];

  assert.match(fidelity, /:root\[data-theme="luthier"\]\s+\.dial::before\s*\{[\s\S]*?content:\s*none/);
  assert.match(fidelity, /url\("\.\/ornaments\/luthier-readout-flower\.svg"\)/);
  assert.match(fidelity, /url\("\.\/ornaments\/luthier-divider\.svg"\)/);
  assert.match(fidelity, /url\("\.\/ornaments\/luthier-finial\.svg"\)/);
  assert.match(fidelity, /url\("\.\/ornaments\/luthier-binding-crown\.svg"\)/);
  assert.doesNotMatch(fidelity, /content:\s*"✥"|content:\s*"✦"/);
  for (const asset of requiredAssets) {
    assert.ok(fs.existsSync(path.join(root, asset)), `${asset} must exist`);
  }
});

test('Release metadata and service worker cache stay synchronized', () => {
  const packageJson = JSON.parse(read('package.json'));
  const releaseJson = JSON.parse(read('release.json'));
  const versionText = read('version.txt');
  const serviceWorker = read('sw.js');
  const version = packageJson.version;
  const cacheVersion = version.replaceAll('.', '-');

  assert.equal(releaseJson.version, version);
  assert.match(versionText, new RegExp(`V${version.replaceAll('.', '\\.')}`));
  assert.match(serviceWorker, new RegExp(`APP_VERSION = '${version.replaceAll('.', '\\.')}'`));
  assert.match(serviceWorker, new RegExp(`CACHE_NAME = 'peach-guitar-tuner-v${cacheVersion}'`));
  assert.match(serviceWorker, /'\.\/luthier-theme\.css'/);
  assert.match(serviceWorker, /'\.\/luthier-fidelity\.css'/);
  assert.match(serviceWorker, /'\.\/textures\/ebony-512\.webp'/);
  assert.match(serviceWorker, /'\.\/textures\/rosewood-768\.webp'/);
  assert.match(serviceWorker, /'\.\/textures\/nacre-strip\.webp'/);
  assert.match(serviceWorker, /'\.\/ornaments\/luthier-readout-flower\.svg'/);
  assert.match(serviceWorker, /'\.\/ornaments\/luthier-divider\.svg'/);
  assert.match(serviceWorker, /'\.\/ornaments\/luthier-finial\.svg'/);
  assert.match(serviceWorker, /'\.\/ornaments\/luthier-binding-crown\.svg'/);
});
