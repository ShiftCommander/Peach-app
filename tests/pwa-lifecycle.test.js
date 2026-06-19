const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createPwaLifecycle,
  fetchOnlineReleaseVersion,
  getPwaUiState,
  hasInstalledWebApp,
  versionsMatch,
} = require('../pwa-lifecycle.js');

function createEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    async emit(type, event = {}) {
      const handlers = listeners.get(type) || [];
      await Promise.all(handlers.map((handler) => handler(event)));
    },
  };
}

function createElement() {
  const target = createEventTarget();
  const classes = new Set(['is-hidden']);
  return {
    ...target,
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    textContent: '',
  };
}

function createControllerEnvironment({
  standalone = false,
  relatedApps = [],
  registration = null,
  onlineVersion = '52.0.0',
  activeVersion = '52.0.0',
} = {}) {
  const windowEvents = createEventTarget();
  const serviceWorkerEvents = createEventTarget();
  const elements = {
    'pwa-card': createElement(),
    'pwa-title': createElement(),
    'pwa-text': createElement(),
    'pwa-action': createElement(),
  };
  let reloads = 0;
  let registerCalls = 0;
  let updateCalls = 0;

  const actualRegistration = registration || {
    active: { id: 'active' },
    waiting: null,
    async update() {
      updateCalls += 1;
      return this;
    },
  };

  if (!actualRegistration.update) {
    actualRegistration.update = async function update() {
      updateCalls += 1;
      return this;
    };
  }

  const sessionValues = new Map();
  const navigatorObject = {
    async getInstalledRelatedApps() {
      return relatedApps;
    },
    serviceWorker: {
      ...serviceWorkerEvents,
      controller: actualRegistration.active,
      async register() {
        registerCalls += 1;
        return actualRegistration;
      },
    },
  };

  const windowObject = {
    ...windowEvents,
    matchMedia: () => ({ matches: standalone }),
    navigator: navigatorObject,
    location: { reload: () => { reloads += 1; } },
    sessionStorage: {
      getItem: (key) => sessionValues.get(key) || null,
      setItem: (key, value) => sessionValues.set(key, value),
    },
  };

  const documentObject = {
    readyState: 'complete',
    getElementById: (id) => elements[id] || null,
  };

  const controller = createPwaLifecycle({
    windowObject,
    documentObject,
    navigatorObject,
    fetchReleaseVersion: async () => onlineVersion,
    requestWorkerVersion: async () => activeVersion,
    debug: () => {},
  });

  return {
    actualRegistration,
    controller,
    elements,
    getRegisterCalls: () => registerCalls,
    getReloads: () => reloads,
    getUpdateCalls: () => updateCalls,
    navigatorObject,
    windowObject,
  };
}

test('PWA UI stays hidden outside a supported actionable context', () => {
  assert.equal(getPwaUiState({ standalone: true, installPrompt: {} }), 'hidden');
  assert.equal(getPwaUiState({}), 'hidden');
});

test('PWA UI exposes installation only for a captured browser prompt', () => {
  assert.equal(getPwaUiState({ installPrompt: {} }), 'installable');
});

test('PWA UI distinguishes installed current, waiting update, and unknown releases', () => {
  assert.equal(getPwaUiState({
    installed: true,
    waitingWorker: {},
    activeVersion: '51.0.0',
    onlineVersion: '52.0.0',
  }), 'installed-update');

  assert.equal(getPwaUiState({
    installed: true,
    activeVersion: '52.0.0',
    onlineVersion: '52.0.0',
  }), 'installed-current');

  assert.equal(getPwaUiState({
    installed: true,
    activeVersion: '51.0.0',
    onlineVersion: '52.0.0',
  }), 'installed-unknown');
});

test('release comparison normalizes common version notation', () => {
  assert.equal(versionsMatch('V52', '52.0.0'), true);
  assert.equal(versionsMatch('52.1', '52.1.0'), true);
  assert.equal(versionsMatch('51.0.0', '52.0.0'), false);
  assert.equal(versionsMatch(null, '52.0.0'), false);
});

test('online release metadata bypasses caches with a relative URL', async () => {
  let requestedUrl = null;
  let requestedOptions = null;
  const version = await fetchOnlineReleaseVersion(async (url, options) => {
    requestedUrl = url;
    requestedOptions = options;
    return {
      ok: true,
      async json() {
        return { version: '52.0.0' };
      },
    };
  }, 1234);

  assert.equal(version, '52.0.0');
  assert.equal(requestedUrl, './release.json?ts=1234');
  assert.equal(requestedOptions.cache, 'no-store');
});

test('installed detection accepts only a related web app result', () => {
  assert.equal(hasInstalledWebApp([{ platform: 'webapp', url: './manifest.json' }]), true);
  assert.equal(hasInstalledWebApp([{ platform: 'play', id: 'example' }]), false);
  assert.equal(hasInstalledWebApp([]), false);
  assert.equal(hasInstalledWebApp(null), false);
});

test('install card appears only for a genuine prompt and invokes it from the action', async () => {
  const env = createControllerEnvironment();
  await env.controller.start();
  assert.equal(env.elements['pwa-card'].classList.contains('is-hidden'), true);

  let prevented = 0;
  let prompted = 0;
  const promptEvent = {
    preventDefault: () => { prevented += 1; },
    prompt: async () => { prompted += 1; },
    userChoice: Promise.resolve({ outcome: 'dismissed' }),
  };

  await env.windowObject.emit('beforeinstallprompt', promptEvent);
  assert.equal(prevented, 1);
  assert.equal(env.elements['pwa-card'].classList.contains('is-hidden'), false);
  assert.equal(env.elements['pwa-action'].textContent, 'Installer Peach');

  let actionPrevented = 0;
  await env.elements['pwa-action'].emit('click', {
    preventDefault: () => { actionPrevented += 1; },
  });

  assert.equal(actionPrevented, 1);
  assert.equal(prompted, 1);
  assert.equal(env.elements['pwa-card'].classList.contains('is-hidden'), true);
});

test('completed browser installation hides the card for the current page', async () => {
  const env = createControllerEnvironment();
  await env.controller.start();

  await env.windowObject.emit('beforeinstallprompt', {
    preventDefault: () => {},
    prompt: async () => {},
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  });
  assert.equal(env.elements['pwa-card'].classList.contains('is-hidden'), false);

  await env.windowObject.emit('appinstalled');
  assert.equal(env.elements['pwa-card'].classList.contains('is-hidden'), true);
});

test('installed current app is checked and receives an open action', async () => {
  const env = createControllerEnvironment({
    relatedApps: [{ platform: 'webapp', url: './manifest.json' }],
  });

  await env.controller.start();

  assert.equal(env.getRegisterCalls(), 1);
  assert.equal(env.getUpdateCalls(), 1);
  assert.equal(env.elements['pwa-card'].classList.contains('is-hidden'), false);
  assert.equal(env.elements['pwa-action'].textContent, 'Ouvrir Peach');
});

test('waiting update is activated by the launch action without cancelling navigation', async () => {
  const messages = [];
  const waiting = { postMessage: (message) => messages.push(message) };
  const env = createControllerEnvironment({
    relatedApps: [{ platform: 'webapp' }],
    registration: { active: { id: 'active' }, waiting },
    activeVersion: '51.0.0',
  });

  await env.controller.start();
  assert.equal(env.elements['pwa-action'].textContent, 'Mettre à jour et ouvrir Peach');

  let prevented = 0;
  await env.elements['pwa-action'].emit('click', {
    preventDefault: () => { prevented += 1; },
  });

  assert.deepEqual(messages, [{ type: 'SKIP_WAITING' }]);
  assert.equal(prevented, 0);
});

test('standalone mode keeps browser UI hidden and reloads once after activation', async () => {
  const env = createControllerEnvironment({
    standalone: true,
    relatedApps: [{ platform: 'webapp' }],
  });

  await env.controller.start();
  assert.equal(env.elements['pwa-card'].classList.contains('is-hidden'), true);
  assert.equal(env.getUpdateCalls(), 0);

  await env.navigatorObject.serviceWorker.emit('controllerchange');
  await env.navigatorObject.serviceWorker.emit('controllerchange');
  assert.equal(env.getReloads(), 1);
});

test('installed detection failure never fabricates an install action', async () => {
  const env = createControllerEnvironment();
  env.navigatorObject.getInstalledRelatedApps = async () => {
    throw new Error('unsupported');
  };

  await env.controller.start();
  assert.equal(env.elements['pwa-card'].classList.contains('is-hidden'), true);
});

test('service worker update failure uses a neutral installed-app action', async () => {
  const env = createControllerEnvironment({
    relatedApps: [{ platform: 'webapp' }],
    registration: {
      active: { id: 'active' },
      waiting: null,
      async update() {
        throw new Error('offline');
      },
    },
  });

  await env.controller.start();
  assert.equal(env.elements['pwa-action'].textContent, 'Vérifier et ouvrir Peach');
});
