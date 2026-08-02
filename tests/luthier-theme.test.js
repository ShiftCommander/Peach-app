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

  assert.match(css, /:root\[data-theme="luthier"\]/);
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /--luthier-ebony-grain:/);
  assert.match(css, /--luthier-rosewood-grain:/);
  assert.match(css, /\.dial-glass--smoked[\s\S]*?backdrop-filter:\s*none/);
  assert.match(css, /\.dial-lens/);
  assert.match(css, /\.chromatic-wheel--lens/);
  assert.equal(count(css, '{'), count(css, '}'));
  assert.equal(count(css, '('), count(css, ')'));
  assert.doesNotMatch(css, /LUTHIER CSS PASS 2|NEUTRAL PLACEHOLDER/);
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
});
