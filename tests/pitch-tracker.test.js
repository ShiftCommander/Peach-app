const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createAdaptivePitchDetector,
  createPitchTracker,
  centsBetween,
  rmsOf
} = require('../pitch-tracker.js');

const SAMPLE_RATE = 8000;
const FRAME_SIZE = 2048;

function seededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function makeFrame({ frequency = 110, amplitude = 0.02, noiseAmplitude = 0, phase = 0, seed = 1 } = {}) {
  const random = seededRandom(seed);
  const buffer = new Float32Array(FRAME_SIZE);
  for (let i = 0; i < buffer.length; i += 1) {
    const tone = frequency > 0 ? amplitude * Math.sin((2 * Math.PI * frequency * i / SAMPLE_RATE) + phase) : 0;
    const noise = noiseAmplitude * ((random() * 2) - 1);
    buffer[i] = tone + noise;
  }
  return buffer;
}

function parabolicInterpolate(values, index) {
  const left = values[index - 1] ?? values[index];
  const center = values[index];
  const right = values[index + 1] ?? values[index];
  const denominator = (2 * center) - left - right;
  if (Math.abs(denominator) < 1e-12) return index;
  return index + 0.5 * (right - left) / denominator;
}

function legacyYinDetector(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i += 1) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.0028) return null;

  const minTau = Math.max(2, Math.floor(sampleRate / 1000));
  const maxTau = Math.min(Math.floor(sampleRate / 45), Math.floor(buffer.length / 2));
  const yin = new Float32Array(maxTau + 1);

  for (let tau = 1; tau <= maxTau; tau += 1) {
    let sum = 0;
    for (let i = 0; i < buffer.length - tau; i += 1) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yin[tau] = sum;
  }

  let runningSum = 0;
  yin[0] = 1;
  for (let tau = 1; tau <= maxTau; tau += 1) {
    runningSum += yin[tau];
    yin[tau] = runningSum === 0 ? 1 : yin[tau] * tau / runningSum;
  }

  const threshold = 0.13;
  let tauEstimate = -1;
  for (let tau = minTau + 1; tau < maxTau; tau += 1) {
    if (yin[tau] < threshold && yin[tau] < yin[tau - 1]) {
      while (tau + 1 < maxTau && yin[tau + 1] < yin[tau]) tau += 1;
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate < 0) return null;
  const betterTau = parabolicInterpolate(yin, tauEstimate);
  const frequency = sampleRate / betterTau;
  if (!Number.isFinite(frequency)) return null;
  return { frequency, rms, clarity: 1 - yin[tauEstimate] };
}

function makeClock(stepMs = 42) {
  let now = 0;
  return {
    now: () => now,
    tick: (steps = 1) => { now += stepMs * steps; return now; }
  };
}

function centsError(actual, expected) {
  return Math.abs(centsBetween(actual, expected));
}

test('acquires only after two coherent strong frames', () => {
  const tracker = createPitchTracker();
  const obs = { frequency: 110, rms: 0.02, clarity: 0.98 };

  assert.equal(tracker.process(obs, 0), null);
  assert.equal(tracker.getState().state, 'acquiring');

  const locked = tracker.process({ ...obs, frequency: 110.2 }, 42);
  assert.ok(locked);
  assert.equal(tracker.getState().state, 'locked');
  assert.ok(centsError(locked.frequency, 110) < 5);
});

test('tracks a decaying sine well below the legacy RMS cutoff', () => {
  const clock = makeClock();
  const adaptive = createAdaptivePitchDetector(legacyYinDetector, { now: clock.now });

  for (let i = 0; i < 16; i += 1) {
    adaptive(makeFrame({ frequency: 0, amplitude: 0, noiseAmplitude: 0.00005, seed: 100 + i }), SAMPLE_RATE);
    clock.tick();
  }

  let result = adaptive(makeFrame({ amplitude: 0.02, noiseAmplitude: 0.00005, seed: 1 }), SAMPLE_RATE);
  clock.tick();
  result = adaptive(makeFrame({ amplitude: 0.018, noiseAmplitude: 0.00005, seed: 2 }), SAMPLE_RATE);
  clock.tick();
  assert.ok(result, 'strong sine should lock');

  const decayAmplitudes = [0.008, 0.0035, 0.0014, 0.00075, 0.00045, 0.00032];
  let lastFrame = null;
  for (let i = 0; i < decayAmplitudes.length; i += 1) {
    lastFrame = makeFrame({ amplitude: decayAmplitudes[i], noiseAmplitude: 0.00005, seed: 20 + i });
    result = adaptive(lastFrame, SAMPLE_RATE);
    clock.tick();
    assert.ok(result, `decay amplitude ${decayAmplitudes[i]} should remain tracked`);
    assert.ok(centsError(result.frequency, 110) < 8, `pitch error should remain bounded at amplitude ${decayAmplitudes[i]}`);
  }

  assert.ok(rmsOf(lastFrame) < 0.0028, 'final decay frame must be below the legacy RMS cutoff');
  assert.equal(legacyYinDetector(lastFrame, SAMPLE_RATE), null, 'legacy detector should drop the same final frame');
});

test('does not lock onto deterministic low-level broadband noise', () => {
  const clock = makeClock();
  const adaptive = createAdaptivePitchDetector(legacyYinDetector, { now: clock.now });
  let locks = 0;

  for (let i = 0; i < 40; i += 1) {
    const result = adaptive(makeFrame({ frequency: 0, amplitude: 0, noiseAmplitude: 0.0012, seed: 500 + i }), SAMPLE_RATE);
    clock.tick();
    if (result) locks += 1;
  }

  assert.equal(locks, 0);
  assert.notEqual(adaptive.getTrackerState().state, 'locked');
});

test('suppresses a one-frame octave jump while locked', () => {
  const tracker = createPitchTracker();
  tracker.process({ frequency: 110, rms: 0.02, clarity: 0.99 }, 0);
  const locked = tracker.process({ frequency: 110.1, rms: 0.02, clarity: 0.99 }, 42);
  assert.ok(locked);

  const octave = tracker.process({ frequency: 220.2, rms: 0.02, clarity: 0.99 }, 84);
  assert.ok(octave);
  assert.ok(centsError(octave.frequency, 110) < 10);
  assert.equal(tracker.getState().state, 'locked');
});

test('reacquires a deliberate strong new note in two coherent frames', () => {
  const tracker = createPitchTracker();
  tracker.process({ frequency: 110, rms: 0.02, clarity: 0.99 }, 0);
  tracker.process({ frequency: 110.1, rms: 0.02, clarity: 0.99 }, 42);

  const first = tracker.process({ frequency: 146.83, rms: 0.02, clarity: 0.99 }, 84);
  const second = tracker.process({ frequency: 146.9, rms: 0.02, clarity: 0.99 }, 126);

  assert.ok(first, 'first replacement frame should bridge with the existing lock');
  assert.ok(second, 'second replacement frame should establish the new lock');
  assert.ok(centsError(second.frequency, 146.83) < 25);
});

test('bridges a short dropout and expires stale pitch after lock memory', () => {
  const tracker = createPitchTracker();
  tracker.process({ frequency: 110, rms: 0.02, clarity: 0.99 }, 0);
  tracker.process({ frequency: 110, rms: 0.02, clarity: 0.99 }, 42);

  const held = tracker.process({ frequency: null, rms: 0, clarity: 0 }, 200);
  assert.ok(held, 'short dropout should reuse the last stable pitch');
  assert.equal(tracker.getState().state, 'decaying');

  const quietGap = tracker.process({ frequency: null, rms: 0, clarity: 0 }, 400);
  assert.equal(quietGap, null, 'pitch output should stop after dropout hold');

  const lost = tracker.process({ frequency: null, rms: 0, clarity: 0 }, 1000);
  assert.equal(lost, null);
  assert.equal(tracker.getState().state, 'lost');
});

test('keeps stable noisy-sine jitter within 5 cents after lock', () => {
  const clock = makeClock();
  const adaptive = createAdaptivePitchDetector(legacyYinDetector, { now: clock.now });
  const outputs = [];

  for (let i = 0; i < 20; i += 1) {
    const result = adaptive(makeFrame({ amplitude: 0.008, noiseAmplitude: 0.00035, seed: 900 + i }), SAMPLE_RATE);
    clock.tick();
    if (result) outputs.push(result.frequency);
  }

  assert.ok(outputs.length >= 15);
  const errors = outputs.map((frequency) => centsBetween(frequency, 110));
  const spread = Math.max(...errors) - Math.min(...errors);
  assert.ok(spread < 5, `jitter spread was ${spread.toFixed(2)} cents`);
});