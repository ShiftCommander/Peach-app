# Peach - Guitar Tuner

Peach is a static, installable PWA guitar tuner built with plain HTML, CSS and JavaScript.

It includes an automatic microphone tuner, a chromatic wheel, reference tones, preset tunings, saved custom tunings, and a small embedded song tuning library.

## Release Status

Current release: **V35**

- Static app: no package manager, build step or framework runtime is required.
- PWA assets: `manifest.json`, `sw.js`, `_headers`, and app icons are included.
- Offline runtime: all app code is local; there are no CDN scripts required at runtime.
- Cache version: `peach-guitar-tuner-v35`.

## Local Preview

Serve the directory from the repository root:

```sh
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

The page title should be `Peach - Guitar Tuner`.

## PWA Checks

Before a release, verify:

- The app loads over HTTPS in production.
- `manifest.json` returns `Content-Type: application/manifest+json; charset=utf-8`.
- `sw.js`, `/`, `/index.html`, `/version.txt`, `app.js`, and `styles.css` are served with `Cache-Control: no-cache`.
- `icons/*` are served with long-lived immutable caching.
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

## Release Notes

### V35

- Removed the external GSAP CDN script so the app can run fully from local cached assets.
- Replaced GSAP-only chromatic wheel smoothing with a local `requestAnimationFrame` animation.
- Bumped the service worker cache from V34 to V35.
- Updated service worker first-install reload guard to the V35 key.
- Expanded Netlify headers for release-friendly cache behavior without requiring hashed asset filenames.
- Replaced the placeholder README with release, preview, and PWA verification notes.
