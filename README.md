# Peach - Guitar Tuner

Peach is a static, installable PWA guitar tuner built with plain HTML, CSS and JavaScript.

It includes an automatic microphone tuner, a chromatic wheel, reference tones, preset tunings, saved custom tunings, and a small embedded song tuning library.

## Release Status

Current release: **V42**

- Static app: no package manager, build step or framework runtime is required for the PWA.
- Optional backend MVP: plain Node.js, no third-party package install required.
- PWA assets: `manifest.json`, `sw.js`, `_headers`, and app icons are included.
- Offline runtime: all app code is local; there are no CDN scripts required at runtime.
- Cache version: `peach-guitar-tuner-v42`.
- Current production target: GitHub Pages at `https://shiftcommander.github.io/Peach-app/`.

## Local Preview

Serve the directory from the repository root:

```sh
python3 -m http.server 4273
```

Then open:

```text
http://localhost:4273
```

The page title should be `Peach - Guitar Tuner`.

To test the global tuning search MVP with the local mock API:

```sh
node dev/global-tuning-api-mock.js
```

Open `http://localhost:4274`, then set the API endpoint once in DevTools:

```js
localStorage.setItem('peach-global-tuning-api-url-v1', '/api/tunings/search')
```

Search for `Black Hole Sun` to get a mock global database result, or any unknown song to trigger the mock AI fallback and persistence behavior.

Run the backend API regression test:

```sh
node --test tests/global-tuning-api.test.js
```

The backend stores generated rows in `.tmp/global-tunings-dev.json` during local development.

## PWA Checks

Before a release, verify:

- The app loads over HTTPS in production.
- `manifest.json` loads and exposes the expected app name, icons, `start_url`, `scope`, and `id`.
- On GitHub Pages, static files use GitHub's default cache headers. The `_headers` file is kept for Netlify-compatible deployments, but GitHub Pages does not apply it.
- The service worker installs and activates without console errors.
- Reload once after first service worker installation, then test offline reload.
- Android Chrome shows the install prompt or the manual install option in the browser menu.
- Microphone permission works on a secure origin and the tuner reacts to input.

## Files

- `index.html` - app shell and metadata.
- `styles.css` - full UI styling.
- `app.js` - tuner logic, UI behavior, install prompt, and service worker registration.
- `sw.js` - offline cache and navigation fallback.
- `manifest.json` - PWA manifest and install metadata.
- `_headers` - Netlify headers for manifest type, service worker freshness, and asset caching.
- `version.txt` - human-readable release marker.
- `config.js` - static frontend runtime config for GitHub Pages.
- `server/` - optional deployable Node.js backend for global tuning search.
- `tests/` - backend regression tests.

## Backend Deployment

GitHub Pages cannot execute the backend. Deploy the Node API on a service that can run a long-lived Node process or container, then point `config.js` to that API URL.

Required runtime:

```text
Node.js 20+
```

Useful environment variables:

```text
PORT=8080
PEACH_TUNING_DB_PATH=/data/global-tunings.json
PEACH_PUBLIC_GLOBAL_TUNING_API_URL=https://your-api.example/api/tunings/search
PEACH_AI_MODE=mock
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
PEACH_RATE_LIMIT=60
PEACH_RATE_LIMIT_WINDOW_MS=60000
```

Run as a Node process:

```sh
npm start
```

Run as a container:

```sh
docker build -t peach-global-tuning-api .
docker run -p 8080:8080 -v peach-tunings:/data peach-global-tuning-api
```

## Release Notes

### V42

- Added `config.js` and dynamic backend-served runtime config for production API wiring.
- Added `package.json`, `server/start.js`, `Dockerfile`, and `.dockerignore` for deployable backend packaging.
- Added `/api/health` and a basic per-IP rate limit for API hardening.
- Expanded backend tests to cover health, runtime config, and rate limiting.
- Bumped the service worker cache from V41 to V42.

### V41

- Added a reusable Node.js global tuning API server with JSON persistence.
- Added a server-side AI lookup adapter with mock mode and optional OpenAI mode.
- Converted the dev mock server to use the real backend implementation.
- Added an automated API test for global hit, AI fallback, persistence, and repeated lookup.
- Bumped the service worker cache from V40 to V41.

### V40

- Added the frontend flow for global song tuning search when the embedded library has no result.
- Added support for AI-generated backend results that are returned after being persisted globally.
- Added `docs/global-tuning-api.md` with the backend API contract and data model requirements.
- Added `dev/global-tuning-api-mock.js` to test global database hits and AI fallback locally.
- Prevented the service worker from caching `/api/` responses, so global tuning results and AI fallback responses stay fresh.
- Completed browser-tested global tuning search MVP with mock global database hits, AI fallback, persistence behavior, and local saving.
- Bumped the service worker cache from V38 to V40.

### V38

- Aligned release documentation with the current GitHub Pages deployment.
- Added `.nojekyll` so GitHub Pages publishes the static app as raw files.
- Set the manifest `id` to a relative app identity so GitHub Pages and local preview resolve it inside their own served path.
- Bumped the service worker cache from V37 to V38.

### V37

- Removed proven-dead JavaScript from the tuning and reference-tone flows.
- Fixed the unsaved custom tuning save-state logic so `Sauvegarder` enables only when it can actually save a new or changed tuning.
- Fixed a stale custom tuning name assignment in the save flow.
- Bumped the service worker cache from V36 to V37.

### V36

- Rebuilt the stylesheet around a cleaner light soft-UI system.
- Fixed mobile carousel sizing for the Diapason and Accordage libre cards.
- Improved note and hertz readability in the tuning controls.
- Bumped the service worker cache from V35 to V36.

### V35

- Removed the external GSAP CDN script so the app can run fully from local cached assets.
- Replaced GSAP-only chromatic wheel smoothing with a local `requestAnimationFrame` animation.
- Bumped the service worker cache from V34 to V35.
- Updated service worker first-install reload guard to the V35 key.
- Expanded Netlify headers for release-friendly cache behavior without requiring hashed asset filenames.
- Replaced the placeholder README with release, preview, and PWA verification notes.
