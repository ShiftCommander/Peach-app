# Peach Adaptive Pitch Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Peach's existing YIN tuner so it acquires reliably, tracks instrument decay much longer, and resists noise/octave glitches without changing the visible tuner UX.

**Architecture:** Add a focused `pitch-tracker.js` wrapper around the current global YIN detector. The wrapper applies analysis-only gain to quiet buffers, feeds true RMS plus YIN clarity into a stateful tracker, and returns only accepted/smoothed pitch observations to the existing `app.js` loop. V1 preserves the current 45–1000 Hz range and microphone filters so sensitivity can be measured independently from future multi-instrument range work.

**Tech Stack:** Plain browser JavaScript, Web Audio buffers, existing YIN detector, Node 20 built-in test runner, Service Worker precache.

**Spec:** `docs/superpowers/specs/2026-09-15-adaptive-pitch-tracking-design.md`

## Global Constraints

- Keep the existing `app.js` tuning UI and YIN implementation behavior intact; integrate through the new wrapper module.
- Keep the V1 analysis range at `45–1000 Hz` and current high-pass/low-pass microphone filters.
- Use no runtime dependency.
- Preserve raw microphone capture settings with echo cancellation, noise suppression, and browser auto gain disabled.
- Treat the numeric thresholds in the spec as benchmarkable starting values rather than permanent product constants.
- Keep all new signal-processing behavior unit-testable under Node.

---

### Task 1: Lock Adaptive Tracking Behavior With Failing Tests

**Files:**
- Create: `tests/pitch-tracker.test.js`
- Create later in Task 2: `pitch-tracker.js`

**Interfaces:**
- Consumes: Node's `node:test` and `node:assert/strict`.
- Produces: expected public API `createAdaptivePitchDetector(baseDetector, options?)`, `createPitchTracker(options?)`, `rmsOf(buffer)`, and `centsBetween(a, b)`.

- [ ] **Step 1: Write deterministic synthetic-audio helpers** for sine generation, seeded broadband noise, frame decay, and a test-local copy of Peach's current legacy YIN behavior including RMS cutoff `0.0028`.
- [ ] **Step 2: Write failing acquisition tests** proving two coherent strong frames establish a lock and a single frame does not.
- [ ] **Step 3: Write failing decay test** proving a quiet sine below RMS `0.0028` remains trackable when periodicity is strong and level remains above the adaptive noise floor.
- [ ] **Step 4: Write failing robustness tests** for low-level noise rejection, one-frame octave suppression, deliberate strong note change, dropout hold/expiry, and bounded cents jitter.
- [ ] **Step 5: Run** `node --test tests/pitch-tracker.test.js` and verify RED because `pitch-tracker.js` does not exist.

### Task 2: Implement the Adaptive Detector and Tracker

**Files:**
- Create: `pitch-tracker.js`
- Test: `tests/pitch-tracker.test.js`

**Interfaces:**
- `createPitchTracker(options?) -> { process(observation, nowMs), reset(), getState(), getMetrics() }`
- observation shape: `{ frequency: number, rms: number, clarity: number } | null`
- `createAdaptivePitchDetector(baseDetector, options?) -> detector(buffer, sampleRate)`
- detector returns Peach-compatible `{ frequency, rms, clarity } | null` and exposes `.reset()`, `.getTrackerState()`, `.getMetrics()`.

- [ ] **Step 1: Implement RMS/db/cents helpers** and default constants from the design.
- [ ] **Step 2: Implement adaptive noise-floor estimation** using only weak/unpitched evidence with asymmetric smoothing.
- [ ] **Step 3: Implement state transitions** `listening → acquiring → locked → decaying → lost`, including two-frame acquisition and lock-memory timing.
- [ ] **Step 4: Implement continuity and octave handling** with an 80-cent lock window and octave folding toward an existing lock.
- [ ] **Step 5: Implement deliberate note replacement** requiring two coherent acquisition-quality frames around the new pitch.
- [ ] **Step 6: Implement smoothing** as median-of-three in absolute cents followed by EMA alpha `0.45`.
- [ ] **Step 7: Implement adaptive detector wrapper** that measures true RMS, copies/scales quiet input only for YIN analysis toward RMS `0.008` with max gain `32x`, restores original RMS, and feeds observations to the tracker.
- [ ] **Step 8: Add browser auto-install**: when loaded after `app.js`, capture the current global `detectPitchYin` and replace it with the adaptive detector; expose the module API for diagnostics and CommonJS tests.
- [ ] **Step 9: Run focused tests after each behavior until GREEN** with `node --test tests/pitch-tracker.test.js`.

### Task 3: Integrate the Tracker Into the PWA

**Files:**
- Modify: `index.html`
- Modify: `sw.js`

**Interfaces:**
- `index.html` loads `pitch-tracker.js` immediately after deferred `app.js` and before `dial-lens.js`.
- Service worker precaches `./pitch-tracker.js`.

- [ ] **Step 1: Add `<script src="pitch-tracker.js" defer></script>` after `app.js`.**
- [ ] **Step 2: Add `./pitch-tracker.js` to `CORE_ASSETS` in `sw.js`.**
- [ ] **Step 3: Run syntax checks** for `pitch-tracker.js`, `sw.js`, and `index.html` integration assertions.

### Task 4: Synchronize Release Metadata and Project Checks

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `release.json`
- Modify: `version.txt`
- Modify: `sw.js`

**Interfaces:**
- Frontend release version: `52.2.0`.
- Service-worker cache: `peach-guitar-tuner-v52-2-0`.

- [ ] **Step 1: Bump package/release/version/service-worker metadata to `52.2.0`.**
- [ ] **Step 2: Synchronize the small lockfile root/package versions to `52.2.0`.**
- [ ] **Step 3: Extend `npm run check`** with `node --check pitch-tracker.js` and `node --check tests/pitch-tracker.test.js`.
- [ ] **Step 4: Run focused tests and syntax checks locally.**

### Task 5: Verify, Record Results, and Open the PR

**Files:**
- Modify: `docs/superpowers/plans/2026-09-15-adaptive-pitch-tracking.md`
- Verify all changed files.

- [ ] **Step 1: Record benchmark results** for acquisition frames, lowest tracked decay RMS/amplitude, cents error/jitter, false locks, and deliberate note-change reacquisition.
- [ ] **Step 2: Mark completed plan items and add a compact `State handoff` section** summarizing branch, implementation state, chosen thresholds, and physical-device validation still needed.
- [ ] **Step 3: Run fresh verification**: focused Node tests, syntax checks, JSON parsing, and whitespace/diff sanity checks available in the local harness.
- [ ] **Step 4: Review the GitHub branch diff against the spec.**
- [ ] **Step 5: Open a pull request against `main`** with benchmark results, architectural summary, known scope boundary (`45–1000 Hz` remains V1), and physical-device follow-up.
- [ ] **Step 6: Inspect GitHub CI/status for the PR head commit** and report any repository-level checks that cannot be proven locally.

## Future PLAN.md / STATE.md Handoff

When root coordination files are added, `PLAN.md` should link to this plan as the completed V1 adaptive-tracking milestone and create a V2 item for instrument-aware analysis ranges/profiles. `STATE.md` should capture the PR number, head commit, benchmark values, final tuned constants, CI status, and the result of real Android tests with guitar/bass/other instruments.