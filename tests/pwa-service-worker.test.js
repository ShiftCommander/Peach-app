const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const serviceWorkerSource = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function loadServiceWorker(cacheNames) {
  const handlers = new Map();
  const deletedCaches = [];
  const navigatedClients = [];
  let skipWaitingCalls = 0;
  let claimCalls = 0;

  const context = {
    URL,
    caches: {
      keys: async () => [...cacheNames],
      open: async () => ({
        addAll: async () => {},
        put: async () => {},
      }),
      delete: async (key) => {
        deletedCaches.push(key);
        return true;
      },
      match: async () => null,
    },
    fetch: async () => ({ clone: () => ({}) }),
    self: {
      location: { origin: 'https://shiftcommander.github.io' },
      addEventListener: (type, handler) => handlers.set(type, handler),
      skipWaiting: async () => { skipWaitingCalls += 1; },
      clients: {
        claim: async () => { claimCalls += 1; },
        matchAll: async () => [{
          url: 'https://shiftcommander.github.io/Peach-app/',
          navigate: async (url) => { navigatedClients.push(url); },
        }],
      },
    },
  };

  vm.runInNewContext(serviceWorkerSource, context);
  return {
    handlers,
    deletedCaches,
    navigatedClients,
    getClaimCalls: () => claimCalls,
    getSkipWaitingCalls: () => skipWaitingCalls,
  };
}

async function dispatchExtendable(handler) {
  let work = Promise.resolve();
  handler({ waitUntil: (promise) => { work = promise; } });
  await work;
}

test('V52 immediately activates over a legacy cache so the new controller can load', async () => {
  const worker = loadServiceWorker(['peach-guitar-tuner-v51', 'unrelated-app-cache']);
  await dispatchExtendable(worker.handlers.get('install'));
  assert.equal(worker.getSkipWaitingCalls(), 1);

  await dispatchExtendable(worker.handlers.get('activate'));
  assert.deepEqual(worker.navigatedClients, ['https://shiftcommander.github.io/Peach-app/']);
  assert.deepEqual(worker.deletedCaches, ['peach-guitar-tuner-v51']);
  assert.equal(worker.getClaimCalls(), 1);
});

test('an update from V52 waits for the explicit update action', async () => {
  const worker = loadServiceWorker(['peach-guitar-tuner-v52']);
  await dispatchExtendable(worker.handlers.get('install'));
  assert.equal(worker.getSkipWaitingCalls(), 0);
});
