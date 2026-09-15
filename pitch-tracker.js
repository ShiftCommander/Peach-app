(function initPeachPitchTracker(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) module.exports = api;

  if (root) {
    root.PeachPitchTracker = api;
    if (typeof root.detectPitchYin === 'function') {
      const legacyDetector = root.detectPitchYin;
      root.detectPitchYin = api.createAdaptivePitchDetector(legacyDetector);
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function buildPeachPitchTracker() {
  const DEFAULTS = Object.freeze({
    initialNoiseFloorDb: -75,
    minNoiseFloorDb: -100,
    maxNoiseFloorDb: -25,
    noiseRiseAlpha: 0.04,
    noiseFallAlpha: 0.18,
    noiseEvidenceClarity: 0.5,
    acquireMarginDb: 10,
    trackMarginDb: 4,
    acquireClarity: 0.82,
    trackClarity: 0.62,
    switchClarity: 0.86,
    acquireFrames: 2,
    continuityCents: 80,
    switchCoherenceCents: 45,
    octaveToleranceCents: 100,
    holdMs: 250,
    lockMemoryMs: 900,
    medianWindow: 3,
    smoothingAlpha: 0.45,
    quietTargetRms: 0.008,
    maxQuietGain: 32,
    minRms: 1e-8
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rmsOf(buffer) {
    if (!buffer || !buffer.length) return 0;
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] * buffer[i];
    return Math.sqrt(sum / buffer.length);
  }

  function toDb(rms) {
    if (!Number.isFinite(rms) || rms <= 0) return -Infinity;
    return 20 * Math.log10(rms);
  }

  function centsBetween(a, b) {
    if (!(a > 0) || !(b > 0)) return Infinity;
    return 1200 * Math.log2(a / b);
  }

  function frequencyToAbsoluteCents(frequency) {
    return 1200 * Math.log2(frequency);
  }

  function absoluteCentsToFrequency(cents) {
    return 2 ** (cents / 1200);
  }

  function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function geometricMeanFrequency(a, b) {
    if (!(a > 0)) return b;
    if (!(b > 0)) return a;
    return Math.sqrt(a * b);
  }

  function createPitchTracker(overrides = {}) {
    const options = { ...DEFAULTS, ...overrides };
    let state = 'listening';
    let noiseFloorDb = options.initialNoiseFloorDb;
    let acquireFrequency = null;
    let acquireCount = 0;
    let switchFrequency = null;
    let switchCount = 0;
    let lockedFrequency = null;
    let lastAcceptedAt = -Infinity;
    let lastOutput = null;
    let centsHistory = [];
    let smoothedCents = null;
    const metrics = {
      locks: 0,
      switches: 0,
      octaveCorrections: 0,
      heldFrames: 0,
      acceptedFrames: 0,
      quietAcceptedFrames: 0
    };

    function clearAcquisition() {
      acquireFrequency = null;
      acquireCount = 0;
    }

    function clearSwitch() {
      switchFrequency = null;
      switchCount = 0;
    }

    function clearLock() {
      lockedFrequency = null;
      lastOutput = null;
      lastAcceptedAt = -Infinity;
      centsHistory = [];
      smoothedCents = null;
      clearSwitch();
      clearAcquisition();
    }

    function updateNoiseFloor(observation) {
      const rms = observation && Number.isFinite(observation.rms) ? observation.rms : 0;
      const db = toDb(rms);
      if (!Number.isFinite(db)) return;

      const hasPitch = observation && Number.isFinite(observation.frequency) && observation.frequency > 0;
      const clarity = observation && Number.isFinite(observation.clarity) ? observation.clarity : 0;
      const weakEvidence = !hasPitch || clarity < options.noiseEvidenceClarity;

      if (lockedFrequency !== null) {
        if (db < noiseFloorDb) {
          noiseFloorDb += options.noiseFallAlpha * (db - noiseFloorDb);
          noiseFloorDb = clamp(noiseFloorDb, options.minNoiseFloorDb, options.maxNoiseFloorDb);
        }
        return;
      }

      if (!weakEvidence) return;
      const alpha = db < noiseFloorDb ? options.noiseFallAlpha : options.noiseRiseAlpha;
      noiseFloorDb += alpha * (db - noiseFloorDb);
      noiseFloorDb = clamp(noiseFloorDb, options.minNoiseFloorDb, options.maxNoiseFloorDb);
    }

    function thresholds(observation) {
      const levelDb = toDb(observation?.rms || 0);
      const clarity = Number.isFinite(observation?.clarity) ? observation.clarity : 0;
      const frequency = Number.isFinite(observation?.frequency) && observation.frequency > 0
        ? observation.frequency
        : null;
      return {
        frequency,
        levelDb,
        clarity,
        strong: frequency !== null
          && levelDb >= noiseFloorDb + options.acquireMarginDb
          && clarity >= options.acquireClarity,
        switchStrong: frequency !== null
          && levelDb >= noiseFloorDb + options.acquireMarginDb
          && clarity >= options.switchClarity,
        trackable: frequency !== null
          && levelDb >= noiseFloorDb + options.trackMarginDb
          && clarity >= options.trackClarity
      };
    }

    function smoothAccepted(frequency, observation, nowMs, nextState, resetSmoothing = false) {
      if (resetSmoothing) {
        centsHistory = [];
        smoothedCents = null;
      }

      const cents = frequencyToAbsoluteCents(frequency);
      centsHistory.push(cents);
      if (centsHistory.length > options.medianWindow) centsHistory.shift();
      const medianCents = median(centsHistory);
      smoothedCents = smoothedCents === null
        ? medianCents
        : smoothedCents + options.smoothingAlpha * (medianCents - smoothedCents);

      const smoothedFrequency = absoluteCentsToFrequency(smoothedCents);
      lockedFrequency = frequency;
      lastAcceptedAt = nowMs;
      state = nextState;
      metrics.acceptedFrames += 1;
      if (nextState === 'decaying') metrics.quietAcceptedFrames += 1;
      lastOutput = {
        frequency: smoothedFrequency,
        rms: observation.rms,
        clarity: observation.clarity
      };
      return { ...lastOutput };
    }

    function stageCandidate(currentFrequency, kind) {
      if (kind === 'acquire') {
        if (acquireFrequency !== null
          && Math.abs(centsBetween(currentFrequency, acquireFrequency)) <= options.switchCoherenceCents) {
          acquireFrequency = geometricMeanFrequency(acquireFrequency, currentFrequency);
          acquireCount += 1;
        } else {
          acquireFrequency = currentFrequency;
          acquireCount = 1;
        }
        return acquireCount;
      }

      if (switchFrequency !== null
        && Math.abs(centsBetween(currentFrequency, switchFrequency)) <= options.switchCoherenceCents) {
        switchFrequency = geometricMeanFrequency(switchFrequency, currentFrequency);
        switchCount += 1;
      } else {
        switchFrequency = currentFrequency;
        switchCount = 1;
      }
      return switchCount;
    }

    function holdOrLose(observation, nowMs) {
      if (lockedFrequency === null) {
        state = 'listening';
        return null;
      }

      const elapsed = nowMs - lastAcceptedAt;
      if (elapsed <= options.holdMs && lastOutput) {
        state = 'decaying';
        metrics.heldFrames += 1;
        return {
          frequency: lastOutput.frequency,
          rms: observation?.rms || 0,
          clarity: observation?.clarity || 0
        };
      }

      if (elapsed <= options.lockMemoryMs) {
        state = 'decaying';
        return null;
      }

      clearLock();
      state = 'lost';
      return null;
    }

    function process(observation, nowMs = Date.now()) {
      if (state === 'lost' && lockedFrequency === null) state = 'listening';
      updateNoiseFloor(observation);
      const candidate = thresholds(observation || {});

      if (lockedFrequency === null) {
        if (!candidate.strong) {
          clearAcquisition();
          state = 'listening';
          return null;
        }

        state = 'acquiring';
        const count = stageCandidate(candidate.frequency, 'acquire');
        if (count < options.acquireFrames) return null;

        const frequency = acquireFrequency;
        clearAcquisition();
        lockedFrequency = frequency;
        metrics.locks += 1;
        return smoothAccepted(frequency, observation, nowMs, 'locked', true);
      }

      const rawFrequency = candidate.frequency;
      if (rawFrequency !== null && candidate.trackable) {
        const rawDelta = Math.abs(centsBetween(rawFrequency, lockedFrequency));

        if (rawDelta <= options.continuityCents) {
          clearSwitch();
          const nextState = candidate.levelDb >= noiseFloorDb + options.acquireMarginDb ? 'locked' : 'decaying';
          return smoothAccepted(rawFrequency, observation, nowMs, nextState);
        }

        const nearOctave = Math.abs(rawDelta - 1200) <= options.octaveToleranceCents;
        if (nearOctave) {
          const down = rawFrequency / 2;
          const up = rawFrequency * 2;
          const folded = Math.abs(centsBetween(down, lockedFrequency)) <= Math.abs(centsBetween(up, lockedFrequency))
            ? down
            : up;

          if (Math.abs(centsBetween(folded, lockedFrequency)) <= options.continuityCents) {
            if (candidate.switchStrong) {
              const switchFrames = stageCandidate(rawFrequency, 'switch');
              if (switchFrames >= options.acquireFrames) {
                const replacement = switchFrequency;
                clearSwitch();
                metrics.switches += 1;
                return smoothAccepted(replacement, observation, nowMs, 'locked', true);
              }
            } else {
              clearSwitch();
            }
            metrics.octaveCorrections += 1;
            return smoothAccepted(folded, observation, nowMs, candidate.strong ? 'locked' : 'decaying');
          }
        }

        if (candidate.switchStrong) {
          const switchFrames = stageCandidate(rawFrequency, 'switch');
          if (switchFrames >= options.acquireFrames) {
            const replacement = switchFrequency;
            clearSwitch();
            metrics.switches += 1;
            return smoothAccepted(replacement, observation, nowMs, 'locked', true);
          }
          return holdOrLose(observation, nowMs);
        }
      }

      clearSwitch();
      return holdOrLose(observation, nowMs);
    }

    function reset() {
      state = 'listening';
      noiseFloorDb = options.initialNoiseFloorDb;
      clearLock();
      metrics.locks = 0;
      metrics.switches = 0;
      metrics.octaveCorrections = 0;
      metrics.heldFrames = 0;
      metrics.acceptedFrames = 0;
      metrics.quietAcceptedFrames = 0;
    }

    function getState() {
      return {
        state,
        noiseFloorDb,
        lockedFrequency,
        lastAcceptedAt,
        acquireCount,
        switchCount
      };
    }

    function getMetrics() {
      return { ...metrics };
    }

    return { process, reset, getState, getMetrics };
  }

  function createAdaptivePitchDetector(baseDetector, overrides = {}) {
    if (typeof baseDetector !== 'function') throw new TypeError('baseDetector must be a function');
    const options = { ...DEFAULTS, ...overrides };
    const tracker = createPitchTracker(options);
    const now = typeof overrides.now === 'function'
      ? overrides.now
      : () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());

    function detector(buffer, sampleRate) {
      const trueRms = rmsOf(buffer);
      let analysisBuffer = buffer;

      if (trueRms > options.minRms && trueRms < options.quietTargetRms) {
        const gain = Math.min(options.maxQuietGain, options.quietTargetRms / trueRms);
        if (gain > 1.001) {
          analysisBuffer = new Float32Array(buffer.length);
          for (let i = 0; i < buffer.length; i += 1) analysisBuffer[i] = buffer[i] * gain;
        }
      }

      const detected = trueRms > options.minRms ? baseDetector(analysisBuffer, sampleRate) : null;
      const observation = detected
        ? { frequency: detected.frequency, rms: trueRms, clarity: detected.clarity }
        : { frequency: null, rms: trueRms, clarity: 0 };
      return tracker.process(observation, now());
    }

    detector.reset = tracker.reset;
    detector.getTrackerState = tracker.getState;
    detector.getMetrics = tracker.getMetrics;
    return detector;
  }

  return {
    DEFAULTS,
    createAdaptivePitchDetector,
    createPitchTracker,
    centsBetween,
    rmsOf,
    toDb
  };
});