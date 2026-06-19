(function exposePwaLifecycle(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.PeachPwa = api;

    if (root.document) {
      root.PeachPwaController = api.createPwaLifecycle();
      root.PeachPwaController.start();
    }
  }
})(typeof window !== 'undefined' ? window : null, function createPwaApi() {
  function normalizeVersion(value) {
    if (typeof value !== 'string') return null;

    const match = value.trim().match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/i);
    if (!match) return null;

    return [match[1], match[2] || '0', match[3] || '0']
      .map((part) => Number.parseInt(part, 10))
      .join('.');
  }

  function versionsMatch(left, right) {
    const normalizedLeft = normalizeVersion(left);
    const normalizedRight = normalizeVersion(right);
    return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
  }

  function hasInstalledWebApp(apps) {
    return Array.isArray(apps) && apps.some((app) => app && app.platform === 'webapp');
  }

  function getPwaUiState({
    standalone = false,
    installPrompt = null,
    installed = false,
    waitingWorker = null,
    activeVersion = null,
    onlineVersion = null,
    updateCheckFailed = false,
  } = {}) {
    if (standalone) return 'hidden';

    if (installed) {
      if (waitingWorker) return 'installed-update';
      if (updateCheckFailed) return 'installed-unknown';
      if (versionsMatch(activeVersion, onlineVersion)) return 'installed-current';
      return 'installed-unknown';
    }

    return installPrompt ? 'installable' : 'hidden';
  }

  function defaultRequestWorkerVersion(worker, { setTimeoutImpl, clearTimeoutImpl }) {
    if (!worker || typeof MessageChannel === 'undefined') return Promise.resolve(null);

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      const timeout = setTimeoutImpl(() => resolve(null), 1200);

      channel.port1.onmessage = (event) => {
        clearTimeoutImpl(timeout);
        resolve(event.data && event.data.version ? event.data.version : null);
      };

      worker.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
    });
  }

  async function fetchOnlineReleaseVersion(fetchImpl, cacheBust = Date.now()) {
    if (typeof fetchImpl !== 'function') return null;

    const separator = './release.json'.includes('?') ? '&' : '?';
    const response = await fetchImpl(`./release.json${separator}ts=${cacheBust}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error(`Release metadata request failed: ${response.status}`);
    const release = await response.json();
    return release && typeof release.version === 'string' ? release.version : null;
  }

  function waitForWaitingWorker(registration, setTimeoutImpl) {
    if (!registration) return Promise.resolve(null);
    if (registration.waiting) return Promise.resolve(registration.waiting);

    const worker = registration.installing;
    if (!worker || typeof worker.addEventListener !== 'function') return Promise.resolve(null);

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve(registration.waiting || (worker.state === 'installed' ? worker : null));
      };

      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' || worker.state === 'redundant') finish();
      });
      setTimeoutImpl(finish, 4000);
    });
  }

  function createPwaLifecycle(options = {}) {
    const windowObject = options.windowObject || (typeof window !== 'undefined' ? window : null);
    const documentObject = options.documentObject || (windowObject && windowObject.document);
    const navigatorObject = options.navigatorObject || (windowObject && windowObject.navigator);
    const fetchImpl = options.fetchImpl || (windowObject && windowObject.fetch && windowObject.fetch.bind(windowObject));
    const setTimeoutImpl = options.setTimeoutImpl || setTimeout;
    const clearTimeoutImpl = options.clearTimeoutImpl || clearTimeout;
    const debug = options.debug || ((message, error) => {
      if (typeof console !== 'undefined' && console.debug) console.debug(message, error || '');
    });
    const fetchReleaseVersion = options.fetchReleaseVersion
      || (() => fetchOnlineReleaseVersion(fetchImpl));
    const requestWorkerVersion = options.requestWorkerVersion
      || ((worker) => defaultRequestWorkerVersion(worker, { setTimeoutImpl, clearTimeoutImpl }));

    let started = false;
    let installPrompt = null;
    let installed = false;
    let suppressUi = false;
    let registration = null;
    let waitingWorker = null;
    let activeVersion = null;
    let onlineVersion = null;
    let updateCheckFailed = false;
    let elements = null;

    function isStandalone() {
      const mediaStandalone = windowObject
        && typeof windowObject.matchMedia === 'function'
        && windowObject.matchMedia('(display-mode: standalone)').matches;
      return Boolean(mediaStandalone || (navigatorObject && navigatorObject.standalone));
    }

    function resolveElements() {
      if (!documentObject || typeof documentObject.getElementById !== 'function') return null;
      const resolved = {
        card: documentObject.getElementById('pwa-card'),
        title: documentObject.getElementById('pwa-title'),
        text: documentObject.getElementById('pwa-text'),
        action: documentObject.getElementById('pwa-action'),
      };
      return Object.values(resolved).every(Boolean) ? resolved : null;
    }

    function currentState() {
      if (suppressUi) return 'hidden';
      return getPwaUiState({
        standalone: isStandalone(),
        installPrompt,
        installed,
        waitingWorker,
        activeVersion,
        onlineVersion,
        updateCheckFailed,
      });
    }

    function render() {
      if (!elements) return;
      const state = currentState();

      if (state === 'hidden') {
        elements.card.classList.add('is-hidden');
        return;
      }

      const content = {
        installable: {
          title: 'Installer Peach',
          text: 'Ajoute l’accordeur à ton écran d’accueil.',
          action: 'Installer Peach',
        },
        'installed-current': {
          title: 'Peach est installée',
          text: 'La dernière version disponible est prête.',
          action: 'Ouvrir Peach',
        },
        'installed-update': {
          title: 'Mise à jour disponible',
          text: 'Actualise Peach puis ouvre l’application installée.',
          action: 'Mettre à jour et ouvrir Peach',
        },
        'installed-unknown': {
          title: 'Peach est installée',
          text: 'Vérifie la version disponible avant l’ouverture.',
          action: 'Vérifier et ouvrir Peach',
        },
      }[state];

      elements.title.textContent = content.title;
      elements.text.textContent = content.text;
      elements.action.textContent = content.action;
      elements.action.href = './';
      elements.action.target = '_blank';
      elements.action.rel = 'noopener';
      elements.card.classList.remove('is-hidden');
    }

    async function handleAction(event) {
      const state = currentState();

      if (state === 'installable') {
        event.preventDefault();
        const prompt = installPrompt;
        installPrompt = null;

        try {
          await prompt.prompt();
          await prompt.userChoice;
        } catch (error) {
          debug('PWA install prompt failed:', error);
        }

        render();
        return;
      }

      if (state === 'installed-update' && waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }
    }

    function bindControllerReload() {
      if (!navigatorObject || !navigatorObject.serviceWorker) return;

      navigatorObject.serviceWorker.addEventListener('controllerchange', () => {
        if (!isStandalone()) return;

        const reloadKey = 'peach-pwa-v52-controller-reloaded';
        try {
          if (windowObject.sessionStorage.getItem(reloadKey)) return;
          windowObject.sessionStorage.setItem(reloadKey, '1');
        } catch (error) {
          debug('PWA reload guard storage unavailable:', error);
        }
        windowObject.location.reload();
      });
    }

    async function registerServiceWorker() {
      if (!navigatorObject || !navigatorObject.serviceWorker) return null;

      try {
        return await navigatorObject.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
      } catch (error) {
        debug('Service worker registration failed:', error);
        return null;
      }
    }

    async function refreshInstalledState() {
      if (isStandalone() || !navigatorObject
        || typeof navigatorObject.getInstalledRelatedApps !== 'function') return;

      let relatedApps;
      try {
        relatedApps = await navigatorObject.getInstalledRelatedApps();
      } catch (error) {
        debug('Installed PWA detection failed:', error);
        return;
      }

      installed = hasInstalledWebApp(relatedApps);
      if (!installed) {
        render();
        return;
      }

      try {
        if (registration && typeof registration.update === 'function') {
          await registration.update();
          waitingWorker = await waitForWaitingWorker(registration, setTimeoutImpl);
        } else {
          updateCheckFailed = true;
        }
      } catch (error) {
        updateCheckFailed = true;
        debug('Service worker update check failed:', error);
      }

      const activeWorker = (registration && registration.active)
        || (navigatorObject.serviceWorker && navigatorObject.serviceWorker.controller);
      const results = await Promise.allSettled([
        requestWorkerVersion(activeWorker),
        fetchReleaseVersion(),
      ]);
      activeVersion = results[0].status === 'fulfilled' ? results[0].value : null;
      onlineVersion = results[1].status === 'fulfilled' ? results[1].value : null;
      render();
    }

    async function start() {
      if (started || !windowObject || !navigatorObject) return;
      started = true;
      elements = resolveElements();

      windowObject.addEventListener('beforeinstallprompt', (event) => {
        if (isStandalone() || installed) return;
        event.preventDefault();
        suppressUi = false;
        installPrompt = event;
        render();
      });

      windowObject.addEventListener('appinstalled', () => {
        installPrompt = null;
        installed = true;
        suppressUi = true;
        render();
      });

      if (elements) elements.action.addEventListener('click', handleAction);
      bindControllerReload();
      registration = await registerServiceWorker();
      await refreshInstalledState();
      render();
    }

    return {
      getState: currentState,
      refreshInstalledState,
      start,
    };
  }

  return {
    createPwaLifecycle,
    fetchOnlineReleaseVersion,
    getPwaUiState,
    hasInstalledWebApp,
    normalizeVersion,
    versionsMatch,
  };
});
