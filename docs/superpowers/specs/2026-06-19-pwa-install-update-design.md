# Peach PWA Installation and Update Design

## Goal

Restore a context-aware mobile installation prompt and add a Chrome Android flow that detects an already installed Peach PWA, checks for an available web release, and offers one user-initiated action to update and open the installed app.

The Android/TWA and Play Store approach is explicitly deferred.

## Supported Behavior

### Installation

- Keep the install UI hidden by default.
- Show it only after the browser emits `beforeinstallprompt` while Peach is running in browser display mode.
- Never show generic installation instructions when the event is absent. This prevents false prompts on unsupported browsers, already-installed PWAs, insecure contexts, and other non-installable situations.
- Invoke the captured browser prompt only from the user's **Installer Peach** click.
- Hide the card after acceptance, dismissal, or `appinstalled`; a later browser event may make it eligible again.

### Installed App Detection

- Add a self-referencing `related_applications` web-app entry to the manifest.
- In browser display mode, use `navigator.getInstalledRelatedApps()` when available.
- Treat a matching `webapp` result as authoritative. Do not infer installation only from user-agent strings or local storage.
- Do not show installation or launch UI while already running in standalone mode.
- If detection is unsupported, fails, or returns no match, fall back to the install-event behavior without showing an installed-app claim.

### Version and Update Check

- Introduce machine-readable release metadata whose version matches the service worker's declared release version.
- Fetch the online metadata with a cache-busting URL and `cache: "no-store"`; the service worker must bypass its runtime cache for this resource.
- Let the active service worker answer a `GET_VERSION` message with its release version.
- Always call `registration.update()` after detecting an installed PWA. Browser service-worker state remains the update source of truth; the explicit versions provide UI state and diagnostics.
- If a newer worker reaches `waiting`, show **Mettre à jour et ouvrir Peach** and retain that worker reference.
- If no worker is waiting and the active version matches the online version, show **Ouvrir Peach**.
- If the active worker predates version messaging or the online check fails, use **Vérifier et ouvrir Peach** without claiming that an update exists.

### Update and Launch Action

- The installed-app card contains a real same-origin launch link targeting a new top-level context so Chrome Android can apply navigation capture.
- On **Mettre à jour et ouvrir Peach**, synchronously send `SKIP_WAITING` to the waiting worker and activate the launch link in the same user gesture. The standalone client listens for `controllerchange` and reloads once so it adopts the new cached assets.
- On **Ouvrir Peach**, activate the same launch link without an update message.
- Chrome and Android retain final control over navigation capture. If they keep the destination in Chrome, the page remains usable and does not loop or repeatedly open windows.
- No automatic launch occurs without a user gesture.

## Architecture

- Add a focused PWA lifecycle controller loaded as its own browser script. Keeping it separate from the large tuner script makes capability decisions testable and lets older cache-first service workers fetch the new file as a cache miss.
- Restore one accessible status card near the top of the main content. Its title, message, action label, and link behavior are driven by controller states: `hidden`, `installable`, `installed-current`, `installed-update`, and `installed-unknown`.
- Extend the service worker with release/version messaging, explicit `SKIP_WAITING` handling, release-metadata network bypass, and the new controller asset in the precache.
- Add `launch_handler.client_mode: "navigate-existing"` so Chrome can reuse an existing Peach app window when it captures the launch.
- Keep tuner, microphone, theme, and backend behavior unchanged.

## Failure Handling

- Capability or detection errors keep the card hidden unless a genuine install event was captured.
- Network/version failures never block opening the installed app.
- Service-worker update failures produce the neutral **Vérifier et ouvrir Peach** state and log a debug message only.
- Time-bound service-worker message requests so an old or unresponsive worker cannot stall initialization.
- Prevent duplicate prompts, duplicate update listeners, repeated reloads, and automatic relaunch loops.

## Testing

- Unit-test capability/state decisions with injected browser and service-worker adapters.
- Cover unsupported context, standalone mode, genuine install event, accepted/dismissed install prompt, installed detection, current version, waiting update, unknown legacy worker, and network/update failure.
- Verify service-worker syntax and the full existing Node test suite.
- Browser-test desktop/mobile responsive rendering and absence of console errors.
- Production acceptance on Chrome Android:
  - uninstalled and installable: install card appears and native prompt opens;
  - unsupported or non-installable: no card appears;
  - installed and current: **Ouvrir Peach** launches the standalone PWA when Chrome captures the link;
  - installed with waiting update: update action activates the new worker and opens/reloads the standalone PWA.

## Release Assumptions

- Production is the classic GitHub Pages branch deployment at `https://shiftcommander.github.io/Peach-app/`.
- GitHub Pages publishes the repository root (`/`) from `main`; feature-branch pushes do not change production, while merging to `main` starts the Pages build-and-deployment workflow.
- The default `shiftcommander.github.io` domain is used without a custom domain, and GitHub enforces HTTPS.
- Manifest, service-worker scope, launch URLs, related-app metadata, and release-metadata requests must remain relative to the `/Peach-app/` project path. No URL may assume origin-root hosting.
- Release metadata must live in the repository root so the branch-based Pages deployment publishes it without a build step.
- Release metadata and the service-worker version are incremented together for every deployed frontend release.
- Installed-PWA detection is enhanced behavior for supporting Chromium browsers; it is not presented as universally available.
- Android package distribution, Play Store versioning, deep-link intents, and TWA signing are out of scope.
