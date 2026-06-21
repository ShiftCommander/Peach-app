const APP_VERSION = '52.1.1';
const CACHE_NAME = 'peach-guitar-tuner-v52-1-1';
const EXPLICIT_UPDATE_BASE_CACHE = 'peach-guitar-tuner-v52';
const CACHE_PREFIX = 'peach-guitar-tuner-v';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './dial-lens.css',
  './luthier-theme.css',
  './config.js',
  './pwa-lifecycle.js',
  './app.js',
  './dial-lens.js',
  './dial-smooth.js',
  './manifest.json',
  './version.txt',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys(),
      caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)),
    ]).then(([keys]) => {
      const hasLegacyCache = keys.some((key) => key.startsWith(CACHE_PREFIX));
      const supportsExplicitUpdates = keys.some((key) => key.startsWith(EXPLICIT_UPDATE_BASE_CACHE));
      return hasLegacyCache && !supportsExplicitUpdates ? self.skipWaiting() : null;
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;

  if (event.data.type === 'GET_VERSION') {
    const replyTarget = event.ports && event.ports[0] ? event.ports[0] : event.source;
    if (replyTarget) replyTarget.postMessage({ version: APP_VERSION });
    return;
  }

  if (event.data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(async (keys) => {
        const isUpgrade = keys.some((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME);
        await Promise.all(keys.map((key) => (
          key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME ? caches.delete(key) : null
        )));
        await self.clients.claim();

        if (!isUpgrade) return;
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        await Promise.all(clients.map((client) => client.navigate(client.url)));
      })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (requestUrl.pathname.includes('/api/')) return;
  if (requestUrl.pathname.endsWith('/release.json')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
