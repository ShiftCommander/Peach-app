const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { createTuningApiServer } = require('../server/tuning-api');

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

test('global tuning API searches, falls back to AI, and persists generated results', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peach-tunings-'));
  const dbPath = path.join(tempDir, 'tunings.json');
  const { server } = createTuningApiServer({ dbPath, enableStatic: false, aiMode: 'mock' });
  const baseUrl = await listen(server);

  try {
    const globalResponse = await fetch(`${baseUrl}/api/tunings/search?query=Black%20Hole%20Sun`);
    assert.equal(globalResponse.status, 200);
    const globalPayload = await globalResponse.json();
    assert.equal(globalPayload.source, 'global');
    assert.equal(globalPayload.results[0].title, 'Black Hole Sun');
    assert.deepEqual(globalPayload.results[0].notes, ['D2', 'A2', 'D3', 'G3', 'B3', 'E4']);

    const uniqueQuery = `Codex Test ${Date.now()}`;
    const aiResponse = await fetch(`${baseUrl}/api/tunings/search?query=${encodeURIComponent(uniqueQuery)}`);
    assert.equal(aiResponse.status, 200);
    const aiPayload = await aiResponse.json();
    assert.equal(aiPayload.source, 'ai');
    assert.equal(aiPayload.results[0].generated, true);
    assert.equal(aiPayload.results[0].persisted, true);
    assert.equal(aiPayload.results[0].tuningName, 'Open D');

    const repeatedResponse = await fetch(`${baseUrl}/api/tunings/search?query=${encodeURIComponent(uniqueQuery)}`);
    assert.equal(repeatedResponse.status, 200);
    const repeatedPayload = await repeatedResponse.json();
    assert.equal(repeatedPayload.source, 'global');
    assert.equal(repeatedPayload.results[0].displayName, aiPayload.results[0].displayName);

    const storedRows = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    assert.ok(storedRows.some((row) => row.displayName === aiPayload.results[0].displayName));
  } finally {
    await close(server);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('global tuning API does not reuse a partial title match for a different version/query', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peach-tunings-'));
  const dbPath = path.join(tempDir, 'tunings.json');
  const { server } = createTuningApiServer({ dbPath, enableStatic: false, aiMode: 'mock' });
  const baseUrl = await listen(server);

  try {
    const firstQuery = `Codex Similar ${Date.now()} A`;
    const secondQuery = firstQuery.replace(' A', ' B');

    const firstResponse = await fetch(`${baseUrl}/api/tunings/search?query=${encodeURIComponent(firstQuery)}`);
    assert.equal(firstResponse.status, 200);
    const firstPayload = await firstResponse.json();
    assert.equal(firstPayload.source, 'ai');

    const secondResponse = await fetch(`${baseUrl}/api/tunings/search?query=${encodeURIComponent(secondQuery)}`);
    assert.equal(secondResponse.status, 200);
    const secondPayload = await secondResponse.json();
    assert.equal(secondPayload.source, 'ai');
    assert.notEqual(secondPayload.results[0].displayName, firstPayload.results[0].displayName);
  } finally {
    await close(server);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('global tuning API exposes health, runtime config, and rate limits abusive traffic', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'peach-tunings-'));
  const dbPath = path.join(tempDir, 'tunings.json');
  const { server } = createTuningApiServer({
    dbPath,
    enableStatic: false,
    aiMode: 'mock',
    publicApiUrl: 'https://api.example.test/api/tunings/search',
    rateLimit: 1,
    rateLimitWindowMs: 60_000
  });
  const baseUrl = await listen(server);

  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthResponse.status, 200);
    assert.equal((await healthResponse.json()).ok, true);

    const configResponse = await fetch(`${baseUrl}/config.js`);
    assert.equal(configResponse.status, 200);
    const configBody = await configResponse.text();
    assert.match(configBody, /PEACH_CONFIG/);
    assert.match(configBody, /https:\/\/api\.example\.test\/api\/tunings\/search/);

    const firstSearch = await fetch(`${baseUrl}/api/tunings/search?query=Black%20Hole%20Sun`);
    assert.equal(firstSearch.status, 200);

    const secondSearch = await fetch(`${baseUrl}/api/tunings/search?query=Kashmir`);
    assert.equal(secondSearch.status, 429);
    assert.equal((await secondSearch.json()).error, 'rate_limited');
  } finally {
    await close(server);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
