# 🎸 Peach - Guitar Tuner

![Version](https://img.shields.io/badge/version-v52.1.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)
![PWA](https://img.shields.io/badge/PWA-ready-success.svg)
![GitHub Pages](https://img.shields.io/badge/deployment-GitHub%20Pages-lightgrey.svg)

Peach is a static, installable Progressive Web App (PWA) guitar tuner built with plain HTML, CSS, and JavaScript.

It includes an automatic microphone tuner, a chromatic wheel, reference tones, preset tunings, saved custom tunings, and a small embedded song tuning library.

## ✨ Features

- **Microphone Tuner:** Automatic pitch detection and chromatic wheel.
- **Reference Tones:** Play exact frequencies for manual tuning.
- **Tuning Library:** Preset tunings, saved custom tunings, and an embedded song tuning library.
- **Offline Capable PWA:** Installable locally without needing an app store. All app code is local; no CDN scripts are required at runtime.
- **Optional Backend MVP:** A plain Node.js process (separate from GitHub Pages static hosting) for global tuning search and AI fallbacks.

## 🚀 Live Demo

The current production target is hosted on GitHub Pages:
👉 **[Play Peach Guitar Tuner](https://shiftcommander.github.io/Peach-app/)**

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (No framework required).
- **Backend (Optional):** Node.js 20+ (for the global tuning API).
- **Deployment:** GitHub Pages (Static app), Docker (Backend).

## 📦 Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20 (for backend and tests)
- Python 3 (for serving static files locally)

### Frontend Local Preview

Serve the directory from the repository root:

```sh
python3 -m http.server 4273
```

Then open `http://localhost:4273` in your browser. The page title should be `Peach - Guitar Tuner`.

### Backend Local Preview (Global Tuning Search MVP)

To test the global tuning search MVP with the local mock API:

1. Start the mock backend:

   ```sh
   npm run dev:api
   # or: node dev/global-tuning-api-mock.js
   ```

2. Open `http://localhost:4274`.
3. Set the API endpoint once in your browser's DevTools console:

   ```javascript
   localStorage.setItem('peach-global-tuning-api-url-v1', '/api/tunings/search');
   ```

4. Search for `Black Hole Sun` to get a mock global database result, or any unknown song to trigger the mock AI fallback and persistence behavior.

*(Note: The backend stores generated rows in `.tmp/global-tunings-dev.json` during local development.)*

## 📁 Project Structure

- `index.html` - App shell and metadata.
- `styles.css` - Full UI styling.
- `app.js` - Tuner logic and UI behavior.
- `pwa-lifecycle.js` - Installability, installed-app detection, update checks, and app launching.
- `release.json` - Machine-readable production release version.
- `sw.js` - Offline cache, version messaging, explicit updates, and navigation fallback.
- `manifest.json` - PWA manifest and install metadata.
- `version.txt` - Human-readable release marker.
- `config.js` - Static frontend runtime config for GitHub Pages.
- `server/` - Optional deployable Node.js backend for global tuning search.
- `tests/` - Backend regression tests.
- `dev/` - Local development scripts.

## 🧪 Testing and PWA Checks

### Backend Tests

Run the backend API regression tests:

```sh
npm test
# or: node --test tests/*.test.js
```

You can also check syntax:

```sh
npm run check
```

### PWA Checks Before Release

Before a release, verify:

- The app loads over HTTPS in production.
- `manifest.json` loads and exposes the expected app name, icons, `start_url`, `scope`, and `id`.
- On GitHub Pages, static files use GitHub's default cache headers.
- The service worker installs and activates without console errors.
- Reload once after the first service worker installation, then test offline reload.
- Android Chrome shows the in-app install action only when the native install prompt is available.
- An already-installed PWA is detected when Chrome supports related-app detection; Peach then checks for a waiting service-worker update before offering to open the app.
- Microphone permission works on a secure origin and the tuner reacts to input.

## 🚢 Backend Deployment

GitHub Pages cannot execute the backend. Deploy the API on any Node-capable runtime, then point `config.js` to that API URL.

### Environment Variables

```env
PORT=8080
PEACH_TUNING_DB_PATH=/data/global-tunings.json
PEACH_PUBLIC_GLOBAL_TUNING_API_URL=https://your-api.example/api/tunings/search
PEACH_AI_MODE=mock
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
PEACH_RATE_LIMIT=60
PEACH_RATE_LIMIT_WINDOW_MS=60000
```

### Run as a Node process

```sh
npm start
# or: node server/start.js
```

### Run as a container (Docker)

```sh
docker build -t peach-global-tuning-api .
docker run -p 8080:8080 -v peach-tunings:/data peach-global-tuning-api
```

## 📝 Release Notes

### V52.1.0 (Current)

- Restore PWA install and update flow (merged from `codex/pwa-install-update`).
- Added installability, installed-app detection, explicit service-worker update activation, and Android launch action.

### V52

- Restored the install action only for contexts where Chrome exposes a genuine PWA install prompt.
- Added installed-PWA detection, release checks, explicit service-worker update activation, and an Android launch action.
- Added a one-time legacy-cache migration so pre-V52 installations load the new lifecycle controller; later releases wait for the explicit update action.
- Added relative manifest launch metadata for the GitHub Pages `/Peach-app/` project path.
- Synchronized package, release, human-readable, and service-worker versions.

### V44

- Removed deprecated serverless-specific files, dependencies, tests, and deployment notes.
- Kept GitHub Pages as the primary static deployment path.
- Updated tablet breakpoint behavior to prevent clipped cards in portrait.
- Bumped the service worker cache from V43 to V44.

### V43

- Confirmed GitHub Pages as the primary production target for the static app.
- Kept the optional Node.js backend workflow for global tuning search.
- Bumped the service worker cache from V42 to V43.

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
- Expanded cache behavior guidance for release-friendly static asset updates without requiring hashed asset filenames.
- Replaced the placeholder README with release, preview, and PWA verification notes.
