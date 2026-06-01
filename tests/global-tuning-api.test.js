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
