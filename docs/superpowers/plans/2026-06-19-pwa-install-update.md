# Peach PWA Installation and Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore capability-driven PWA installation and add an installed-app update/open flow for Chrome Android without displaying unavailable actions.

**Architecture:** A small `pwa-lifecycle.js` controller owns installability, installed-app detection, release checks, service-worker updates, and card state. Pure state helpers are exported for Node tests, while browser dependencies remain injectable. The service worker exposes its active release and waits for an explicit update action before activating.

**Tech Stack:** Plain HTML/CSS/JavaScript, Web App Manifest, Service Worker API, `beforeinstallprompt`, `getInstalledRelatedApps()`, Node test runner.

---

### Task 1: Lock State Decisions With Tests

**Files:**
- Create: `tests/pwa-lifecycle.test.js`
- Create: `pwa-lifecycle.js`

- [ ] Add failing tests for `getPwaUiState()` covering standalone, unsupported, installable, installed/current, installed/waiting-update, and installed/unknown states.
- [ ] Add failing tests for normalized release comparison and related-webapp detection.
- [ ] Run `node --test tests/pwa-lifecycle.test.js` and confirm failure because the controller does not exist.
- [ ] Add only the pure exported helpers and rerun the focused test to green.

### Task 2: Implement the Browser Lifecycle Controller

**Files:**
- Modify: `tests/pwa-lifecycle.test.js`
- Modify: `pwa-lifecycle.js`

- [ ] Add failing adapter-driven tests proving that the install card remains hidden until a genuine install event, prompts only from the action click, hides after dismissal/installation, and never initializes browser UI in standalone mode.
- [ ] Add failing tests for installed-app detection, `registration.update()`, active-worker version requests with a timeout, online `release.json` fetching with `no-store`, waiting-worker update state, and neutral fallback on API/network failure.
- [ ] Implement `createPwaLifecycle()` with injected window/document/navigator/fetch/timers, one-time listeners, state rendering, and debug-only error handling.
- [ ] Make the action a real relative launch link. Prevent navigation only for native installation; for a waiting update, synchronously post `SKIP_WAITING` and allow the user-initiated link navigation to continue.
- [ ] Listen for `controllerchange` in standalone mode and reload once per session to adopt newly activated assets.
- [ ] Run the focused test after each behavior until all controller tests pass.

### Task 3: Integrate UI, Manifest, and Release Metadata

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `manifest.json`
- Create: `release.json`
- Modify: `app.js`

- [ ] Restore one accessible hidden PWA status card above the microphone card, with title, message, and an anchor action targeting `./` in a new top-level context.
- [ ] Restore responsive card styling using existing card/button tokens and add Luthier-scoped surface styling without changing tuner layouts.
- [ ] Load `pwa-lifecycle.js` before `app.js`; remove the duplicate service-worker registration from `app.js`.
- [ ] Add a relative self `related_applications` entry and `launch_handler.client_mode: "navigate-existing"` to the manifest.
- [ ] Add root `release.json` with release `52.0.0`; keep all project URLs relative so GitHub Pages serves them below `/Peach-app/`.
- [ ] Run JSON parsing and JavaScript syntax checks.

### Task 4: Make Service-Worker Updates Explicit

**Files:**
- Modify: `sw.js`
- Modify: `version.txt`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`

- [ ] Set the service-worker release and cache to V52 and precache `pwa-lifecycle.js`.
- [ ] Bypass the service-worker cache for `release.json` so the controller can read production truth.
- [ ] Replace unconditional install-time `skipWaiting()` with message-driven `SKIP_WAITING`; answer `GET_VERSION` through the supplied message port.
- [ ] Synchronize human-readable/package release metadata and README PWA instructions with V52 and the GitHub Pages root deployment.
- [ ] Run the full test suite and project syntax check.

### Task 5: Browser and Completion Verification

**Files:**
- Verify only; no expected source changes.

- [ ] Serve the repository locally and inspect desktop plus 390px mobile layouts in Console and Luthier themes.
- [ ] Confirm the card is hidden in the ordinary non-installable local context, there is no horizontal overflow, and no console errors occur.
- [ ] Use browser-side controlled event/API stubs only if needed to inspect each card label; rely on unit tests for privileged browser prompt behavior.
- [ ] Run `npm test`, `npm run check`, `git diff --check`, manifest/release JSON parsing, and a service-worker syntax check fresh.
- [ ] Review the final diff against every design requirement, commit the implementation, and report the remaining physical-device Chrome Android acceptance check separately if it cannot be proven locally.
