const assert = require('assert/strict');
const test = require('node:test');

test('Netlify health function exposes the expected API health response', async () => {
  const mod = await import('../netlify/functions/health.mjs');
  assert.equal(mod.config.path, '/api/health');

  const response = await mod.default(new Request('http://localhost/api/health'), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: 'peach-global-tuning-api' });
});

test('Netlify runtime config function emits Peach API configuration JavaScript', async () => {
  const mod = await import('../netlify/functions/config-js.mjs');
  assert.equal(mod.config.path, '/config.js');
  assert.equal(mod.config.preferStatic, false);

  const response = await mod.default(new Request('http://localhost/config.js'), {});
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/javascript/);
  assert.match(await response.text(), /PEACH_GLOBAL_TUNING_API_URL/);
});

test('Netlify tuning search function exposes the production API route and preflight', async () => {
  const mod = await import('../netlify/functions/tunings-search.mjs');
  assert.equal(mod.config.path, '/api/tunings/search');

  const response = await mod.default(new Request('http://localhost/api/tunings/search', { method: 'OPTIONS' }), {});
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
});
