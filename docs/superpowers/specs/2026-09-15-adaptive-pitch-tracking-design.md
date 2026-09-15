# Peach Adaptive Pitch Tracking Design

## Goal

Make Peach acquire instrument pitch reliably and keep tracking it much deeper into the natural decay of a note, while preserving low latency and avoiding noise-driven false locks.

This V1 improves sensitivity and tracking around the existing YIN detector. Instrument-specific analysis ranges and alternative detectors such as SwiftF0 are deferred to later iterations.

## Current Constraint

The current `detectPitchYin()` rejects every frame below RMS `0.0028` before YIN can use its periodicity result. Peach already computes YIN clarity, yet the tuning loop currently treats pitch frames as valid or invalid without stateful confidence tracking. The microphone path otherwise provides an appropriate raw signal: browser echo cancellation, noise suppression, and auto gain control are disabled.

## Architecture

Add a focused `pitch-tracker.js` browser script loaded immediately after `app.js`. It wraps the existing global `detectPitchYin()` function and keeps `app.js` unchanged in V1.

The wrapper has two layers:

1. **Adaptive detector adapter** — measures true RMS, applies temporary analysis-only gain to very quiet buffers so the existing YIN implementation can still evaluate periodicity, restores the true RMS in the returned observation, and feeds observations into the tracker.
2. **Stateful pitch tracker** — combines RMS relative to an adaptive noise floor, YIN clarity, pitch continuity, octave handling, short-term history, and elapsed time.

The module exports pure/testable helpers under Node and installs itself automatically in the browser when `window.detectPitchYin` is available.

## Tracking State Machine

States are `listening`, `acquiring`, `locked`, `decaying`, and `lost`.

- `listening`: estimate ambient noise floor and wait for a credible pitch candidate.
- `acquiring`: require two coherent strong frames before locking a new pitch.
- `locked`: accept confident frames near the tracked pitch and smooth them in cents.
- `decaying`: keep accepting quieter coherent frames using relaxed thresholds while the note fades.
- `lost`: expose the loss transition, then return to listening while retaining no stale pitch.

A deliberate strong new note may replace a lock after two coherent acquisition-quality frames. A one-frame octave candidate is corrected toward the existing lock when doubling or halving places it within the continuity window.

## Starting Parameters

These are initial engineering values to benchmark and tune from real-device recordings:

- initial noise floor: `-75 dBFS`
- acquisition margin: noise floor `+10 dB`
- tracking/decay margin: noise floor `+4 dB`
- acquisition clarity: `0.82`
- tracking clarity: `0.62`
- deliberate note-change clarity: `0.86`
- acquisition frames: `2`
- continuity window: `80 cents`
- note-change coherence window: `45 cents`
- short dropout hold: `250 ms`
- lock memory before full loss: `900 ms`
- median history: `3` accepted pitches in log-frequency/cents space
- EMA smoothing after median: alpha `0.45`
- analysis-only quiet-buffer target RMS: `0.008`
- maximum analysis-only gain: `32x`

Noise-floor updates use weak/unpitched frames and asymmetric smoothing so a sounding instrument does not quickly redefine itself as ambient noise.

## Signal Rules

- The original buffer is never modified in place.
- Analysis-only gain exists solely to let the existing scale-invariant YIN difference function inspect quiet periodic signals past its legacy RMS guard.
- The tracker reports the original measured RMS to Peach.
- Acquisition needs both sufficient level over the adaptive floor and strong clarity.
- Once locked, continuity and clarity allow a note to remain trackable at lower level.
- Pure/aperiodic noise must not establish a lock.
- A short missing frame may reuse the last smoothed pitch during the dropout hold; longer gaps return no pitch even while lock memory remains available for reacquisition.

## V1 Frequency Scope

Keep Peach's existing `45–1000 Hz` analysis range and current microphone filters in this PR. This isolates the sensitivity improvement from multi-instrument range work and gives the next iteration a stable tracker to build on.

A follow-up V2 should add instrument-aware analysis profiles, including bass below `45 Hz` and upper-register instruments above `1000 Hz`.

## Testing and Benchmarks

Use Node's built-in test runner with deterministic synthetic audio and a test copy of the current legacy YIN behavior.

Required scenarios:

- acquire a stable sine within two coherent frames;
- track a decaying sine materially below the legacy RMS cutoff;
- reject low-level broadband noise;
- suppress a one-frame octave jump while locked;
- switch to a deliberate strong new note within a small bounded number of frames;
- bridge a short dropout and expire after the hold/loss windows;
- keep stable-note jitter within a small cents envelope on deterministic noisy sine input.

Report benchmark-style metrics from assertions: acquisition frames, lowest tracked amplitude/RMS, decay tracking extension versus legacy cutoff, cents error/jitter, false-lock count, and note-change reacquisition frames.

## Integration

- Load `pitch-tracker.js` after `app.js` in `index.html` so it can wrap the existing global YIN function before deferred scripts finish and microphone analysis begins.
- Precache `pitch-tracker.js` in `sw.js`.
- Add syntax checking for the new module and test file.
- Bump synchronized frontend release metadata for the deployed asset change.

## Completion Criteria

V1 is complete when the focused synthetic tests pass, project syntax checks include the new files, release/PWA metadata is synchronized, the full repository test suite passes in GitHub CI, and a pull request documents measured sensitivity improvement plus the remaining physical-device validation for guitar/bass/other instruments.

## Future PLAN.md / STATE.md Handoff

When root project coordination files are introduced, this spec should become the architectural reference for the adaptive-tracking work item. `PLAN.md` should link to the implementation plan and V2 instrument-profile follow-up. `STATE.md` should record the active branch/PR, benchmark results, chosen thresholds, and physical-device validation status.