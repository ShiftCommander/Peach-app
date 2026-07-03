const presetTunings = {
  standard: { notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], freqs: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63] },
  dropD: { notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'], freqs: [73.42, 110.00, 146.83, 196.00, 246.94, 329.63] },
  dadgad: { notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'], freqs: [73.42, 110.00, 146.83, 196.00, 220.00, 293.66] },
  openG: { notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'], freqs: [73.42, 98.00, 146.83, 196.00, 246.94, 293.66] },
  custom: { notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], freqs: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63] }
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_LABELS = ['C', 'C# / Db', 'D', 'D# / Eb', 'E', 'F', 'F# / Gb', 'G', 'G# / Ab', 'A', 'A# / Bb', 'B'];
const CUSTOM_NOTE_MIN_OCTAVE = 1;
const CUSTOM_NOTE_MAX_OCTAVE = 5;
const ANALYSIS_MIN_FREQ = 45;
const ANALYSIS_MAX_FREQ = 1000;
const ANALYSIS_INTERVAL_MS = 42;
const SIGNAL_STALE_MS = 920;
const PERFECT_CENTS = 3;
const CLOSE_CENTS = 12;
const CUSTOM_TUNING_STORAGE_KEY = 'timtuner-custom-tuning-v1';
const SAVED_TUNINGS_STORAGE_KEY = 'timtuner-saved-tunings-v1';
const CUSTOM_DISCOVERY_STORAGE_KEY = 'timtuner-custom-card-discovered-v1';
const GLOBAL_TUNING_API_STORAGE_KEY = 'peach-global-tuning-api-url-v1';
const THEME_STORAGE_KEY = 'peach-theme';
const GLOBAL_TUNING_SEARCH_DEBOUNCE_MS = 420;
const REFERENCE_TONE_MODE = 'clear';
const PRESET_SELECT_META = [
  ['standard', 'Standard'],
  ['dropD', 'Drop D'],
  ['dadgad', 'DADGAD'],
  ['openG', 'Open G']
];

const SONG_TUNING_LIBRARY = [
  {
    id: 'iris-goo-goo-dolls-studio',
    title: 'Iris',
    artist: 'The Goo Goo Dolls',
    displayName: 'Iris — The Goo Goo Dolls',
    version: 'Version studio',
    role: 'Guitare principale',
    tuningName: 'BDDDDD',
    notes: ['B1', 'D3', 'D3', 'D3', 'D4', 'D4'],
    aliases: ['iris', 'goo goo dolls', 'john rzeznik', 'city of angels'],
    confidence: 'élevée',
    sourceLabel: 'Base test · BDDDDD'
  },
  {
    id: 'kashmir-led-zeppelin-studio',
    title: 'Kashmir',
    artist: 'Led Zeppelin',
    displayName: 'Kashmir — Led Zeppelin',
    version: 'Version studio',
    role: 'Jimmy Page · guitare',
    tuningName: 'DADGAD',
    notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'],
    aliases: ['kashmir', 'led zeppelin', 'jimmy page', 'dadgad'],
    confidence: 'élevée',
    sourceLabel: 'Base test · DADGAD'
  },
  {
    id: 'everlong-foo-fighters-drop-d',
    title: 'Everlong',
    artist: 'Foo Fighters',
    displayName: 'Everlong — Foo Fighters',
    version: 'Version studio',
    role: 'Guitares',
    tuningName: 'Drop D',
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    aliases: ['everlong', 'foo fighters', 'dave grohl', 'drop d'],
    confidence: 'bonne',
    sourceLabel: 'Base test · Drop D'
  },
  {
    id: 'monkey-wrench-foo-fighters-drop-d',
    title: 'Monkey Wrench',
    artist: 'Foo Fighters',
    displayName: 'Monkey Wrench — Foo Fighters',
    version: 'Version studio',
    role: 'Guitares',
    tuningName: 'Drop D',
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    aliases: ['monkey wrench', 'foo fighters', 'drop d'],
    confidence: 'élevée',
    sourceLabel: 'Base test · Drop D'
  },
  {
    id: 'start-me-up-rolling-stones-open-g',
    title: 'Start Me Up',
    artist: 'The Rolling Stones',
    displayName: 'Start Me Up — The Rolling Stones',
    version: 'Version studio',
    role: 'Keith Richards · guitare rythmique',
    tuningName: 'Open G',
    notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
    aliases: ['start me up', 'rolling stones', 'keith richards', 'open g'],
    confidence: 'élevée',
    sourceLabel: 'Base test · Open G'
  },
  {
    id: 'sweet-child-o-mine-guns-n-roses-eb',
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    displayName: "Sweet Child O' Mine — Guns N' Roses",
    version: 'Version studio',
    role: 'Slash · guitare lead',
    tuningName: 'Mi♭ standard',
    notes: ['D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'],
    aliases: ['sweet child o mine', 'sweet child', 'guns n roses', 'slash', 'eb standard', 'mi bemol'],
    confidence: 'bonne',
    sourceLabel: 'Base test · Mi♭ standard'
  },
  {
    id: 'today-smashing-pumpkins-standard',
    title: 'Today',
    artist: 'The Smashing Pumpkins',
    displayName: 'Today — The Smashing Pumpkins',
    version: 'Version studio',
    role: 'Guitares',
    tuningName: 'Standard',
    notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    aliases: ['today', 'smashing pumpkins', 'billy corgan', 'standard'],
    confidence: 'élevée',
    sourceLabel: 'Base test · Standard'
  },
  {
    id: 'nothing-else-matters-metallica-standard',
    title: 'Nothing Else Matters',
    artist: 'Metallica',
    displayName: 'Nothing Else Matters — Metallica',
    version: 'Version studio',
    role: 'Guitare',
    tuningName: 'Standard',
    notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    aliases: ['nothing else matters', 'metallica', 'standard'],
    confidence: 'indicative',
    sourceLabel: 'Base test · Standard'
  },
  {
    id: 'blackbird-beatles-standard',
    title: 'Blackbird',
    artist: 'The Beatles',
    displayName: 'Blackbird — The Beatles',
    version: 'Version studio',
    role: 'Guitare acoustique',
    tuningName: 'Standard',
    notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    aliases: ['blackbird', 'beatles', 'paul mccartney', 'standard'],
    confidence: 'indicative',
    sourceLabel: 'Base test · Standard'
  },
  {
    id: 'chop-suey-system-of-a-down-drop-c',
    title: 'Chop Suey!',
    artist: 'System Of A Down',
    displayName: 'Chop Suey! — System Of A Down',
    version: 'Version studio',
    role: 'Daron Malakian · guitare',
    tuningName: 'Drop C',
    notes: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'],
    aliases: ['chop suey', 'system of a down', 'soad', 'drop c'],
    confidence: 'bonne',
    sourceLabel: 'Base test · Drop C'
  }
];


let currentPresetKey = 'standard';
let currentFreqs = [...presetTunings.standard.freqs];
let currentNotes = [...presetTunings.standard.notes];
let currentTargetIndex = null;
let savedTunings = [];
let activeSavedTuningId = null;
let activeCustomName = '';
let openSavedMenuId = null;

let audioContext = null;
let activeTone = null;
let savedDrawerReturnFocus = null;
let helpPopoverReturnFocus = null;
let activeStringIndex = null;
let referenceToneActive = false;
let resumeMicAfterReference = false;

let micStream = null;
let micSourceNode = null;
let micFilterNodes = [];
let micAnalyser = null;
let micAnimationId = null;
let isMicTuning = false;
let isStartingMic = false;
let micBlocked = false;
let suppressTrackEndedRestart = false;
let lastAnalysisAt = 0;
let lastSignalAt = 0;
let lastUiFrequency = null;
let chromaticWheelRotationDeg = 0;
let chromaticWheelQuickTo = null;
let chromaticWheelTween = null;
let chromaticWheelTweenElement = null;
let chromaticWheelInitialized = false;
let lastNearestNoteIndex = null;
let smoothedDisplayFrequency = null;
let lastUiFeedbackAt = 0;
let suppressAnalysisUntil = 0;

let noteHistory = [];
let lastStableTarget = '';
let stableFrames = 0;
let tuningPage = 'diapason';
let customCardDiscovered = false;
let autoApplyTimer = null;
let globalSearchTimer = null;
let globalSearchController = null;
let globalSearchState = {
  query: '',
  status: 'idle',
  message: '',
  results: []
};

const $ = (selector) => document.querySelector(selector);

let currentTheme = 'console';
try {
  currentTheme = localStorage.getItem(THEME_STORAGE_KEY) === 'luthier' ? 'luthier' : 'console';
  document.documentElement.setAttribute('data-theme', currentTheme);
} catch (error) {}

window.addEventListener('DOMContentLoaded', () => {
  restoreUserPreferences();
  renderTuningSelect();
  bindUI();
  forceSavedManagerClosedOnBoot();
  requestAnimationFrame(forceSavedManagerClosedOnBoot);
  renderTargetNotes();
  renderStringsGrid();
  renderCustomInputs();
  setTuningPage('diapason', { scroll: true, smooth: false });
  updateCustomActionState();
  updateCustomSwipeHint();
  renderSavedManager();
  renderSongTuningResults();
  requestMicrophoneWhenPossible();
  applyTheme(currentTheme);
});

function applyTheme(theme) {
  currentTheme = theme === 'luthier' ? 'luthier' : 'console';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  const label = $('#current-theme-label');
  if (label) label.innerText = currentTheme === 'luthier' ? 'Thème actuel : Luthier' : 'Thème actuel : Console';
  
  const btnText = $('#theme-toggle-text');
  if (btnText) btnText.innerText = currentTheme === 'luthier' ? 'Passer au thème Console' : 'Passer au thème Luthier';
  
  const btn = $('#theme-toggle-button');
  if (btn) btn.setAttribute('aria-label', currentTheme === 'luthier' ? 'Passer au thème Console' : 'Passer au thème Luthier');
}
function toggleTheme() {
  const newTheme = currentTheme === 'luthier' ? 'console' : 'luthier';
  try { localStorage.setItem(THEME_STORAGE_KEY, newTheme); } catch (e) {}
  applyTheme(newTheme);
}

function restoreUserPreferences() {
  try {
    customCardDiscovered = localStorage.getItem(CUSTOM_DISCOVERY_STORAGE_KEY) === '1';

    const savedCustom = JSON.parse(localStorage.getItem(CUSTOM_TUNING_STORAGE_KEY) || 'null');
    if (savedCustom?.notes?.length === 6 && savedCustom?.freqs?.length === 6) {
      presetTunings.custom.notes = savedCustom.notes.map(sanitizeNoteName);
      presetTunings.custom.freqs = savedCustom.freqs.map(Number);
      activeCustomName = savedCustom.name || '';
    }

    const savedList = JSON.parse(localStorage.getItem(SAVED_TUNINGS_STORAGE_KEY) || '[]');
    savedTunings = Array.isArray(savedList) ? savedList
      .filter((item) => item?.id && item?.notes?.length === 6)
      .map(normalizeSavedTuning)
      .filter(Boolean) : [];
  } catch (error) {
    console.debug('Preferences unavailable:', error);
    savedTunings = [];
  }
}
function forceSavedManagerClosedOnBoot() {
  const drawer = $('#saved-drawer');
  const button = $('#library-menu-button');
  openSavedMenuId = null;
  if (!drawer) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('drawer-open');
  if (button) button.setAttribute('aria-expanded', 'false');
}

function bindUI() {
  $('#tuning-select').addEventListener('change', handleTuningChange);
  $('#saved-tuning-search').addEventListener('input', handleSongSearchInput);
  $('#save-custom').addEventListener('click', saveActiveCustomTuning);
  $('#custom-tuning-name').addEventListener('input', () => {
    activeCustomName = $('#custom-tuning-name').value.trim();
    updateCustomActionState();
  });
  $('#library-menu-button')?.addEventListener('click', () => setSavedManagerOpen(true));
  $('#saved-drawer-close')?.addEventListener('click', () => setSavedManagerOpen(false));
  $('#saved-drawer-backdrop')?.addEventListener('click', () => setSavedManagerOpen(false));
  $('#saved-manager-search')?.addEventListener('input', renderSavedManager);
  document.addEventListener('click', (event) => {
    if (!openSavedMenuId) return;
    if (event.target.closest('.saved-item__more') || event.target.closest('.saved-item__menu')) return;
    openSavedMenuId = null;
    renderSavedManager();
  });

  $('#mic-permission-button').addEventListener('click', () => requestMicrophoneWhenPossible({ force: true }));
  $('#theme-toggle-button')?.addEventListener('click', toggleTheme);
  bindHelpPopovers();

  bindTuningCardScroll();
  bindUiFeedback();



  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      resumeAfterReturn();
    } else {
      pauseForBackground();
    }
  });

  window.addEventListener('focus', resumeAfterReturn);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) forceSavedManagerClosedOnBoot();
    resumeAfterReturn();
  });
  window.addEventListener('pagehide', pauseForBackground);
  window.addEventListener('blur', () => {
    if (document.visibilityState !== 'visible') pauseForBackground();
  });

  document.addEventListener('pointerdown', () => {
    if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
    if (!referenceToneActive && !isMicTuning && !isStartingMic) requestMicrophoneWhenPossible({ force: false });
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.glass-help-popover:not(.is-hidden)').forEach((popover) => popover.classList.add('is-hidden'));
      setSavedManagerOpen(false);
    }
    if (event.key === 'Tab') trapSavedDrawerFocus(event);
  });
}

function bindHelpPopovers() {
  document.querySelectorAll('.help-toggle').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const target = document.getElementById(button.dataset.helpTarget || '');
      if (!target) return;
      const willOpen = target.classList.contains('is-hidden');
      document.querySelectorAll('.glass-help-popover').forEach((popover) => popover.classList.add('is-hidden'));
      if (willOpen) {
        helpPopoverReturnFocus = button;
        target.classList.remove('is-hidden');
        window.setTimeout(() => target.querySelector('.glass-help-close')?.focus?.(), 0);
      }
      playUiFeedback('tap');
    });
  });

  document.querySelectorAll('.glass-help-close').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      button.closest('.glass-help-popover')?.classList.add('is-hidden');
      window.setTimeout(() => helpPopoverReturnFocus?.focus?.(), 0);
      playUiFeedback('tap');
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.glass-help-popover') || event.target.closest('.help-toggle')) return;
    document.querySelectorAll('.glass-help-popover:not(.is-hidden)').forEach((popover) => popover.classList.add('is-hidden'));
  }, { passive: true });
}


function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => element.offsetParent !== null || element === document.activeElement);
}

function focusFirstIn(container) {
  const focusables = getFocusableElements(container);
  (focusables[0] || container)?.focus?.();
}

function trapSavedDrawerFocus(event) {
  const drawer = $('#saved-drawer');
  if (!drawer?.classList.contains('is-open')) return;
  const panel = drawer.querySelector('.saved-drawer__panel');
  const focusables = getFocusableElements(panel);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function resumeAfterReturn() {
  if (document.visibilityState !== 'visible') return;

  if (audioContext?.state === 'suspended') {
    audioContext.resume().catch(() => showMicCard('Touchez pour relancer', 'Android a suspendu l’audio. Touche “Relancer” pour reprendre l’écoute automatique.', 'Relancer'));
  }

  if (!referenceToneActive && !isMicTuning && !isStartingMic) {
    window.setTimeout(() => requestMicrophoneWhenPossible({ force: false }), 160);
  }

  if (isMicTuning && !micAnimationId) {
    processAudioAnalysis(performance.now());
  }
}

function pauseForBackground() {
  stopReferenceTone({ resumeMic: false });
  stopMicrophone({ resetVisuals: false, showWaiting: false });

  if (audioContext?.state === 'running') {
    audioContext.suspend().catch(() => {});
  }

  setListeningState('waiting', 'En pause hors app');
  setSignalState(false, 'Micro libéré');
  hideMicCard();

  const detail = $('#heard-note-detail');
  if (detail && lastUiFrequency) {
    detail.innerText = `${lastUiFrequency.toFixed(1)} Hz · micro libéré hors app`;
  } else if (detail) {
    detail.innerText = 'Micro libéré hors app';
  }
}

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    return audioContext.resume();
  }

  return Promise.resolve();
}

async function requestMicrophoneWhenPossible({ force = false } = {}) {
  if (document.visibilityState !== 'visible') return;
  if (referenceToneActive) return;
  if (isMicTuning || isStartingMic) return;
  if (micBlocked && !force) {
    showMicCard('Micro en attente', 'Autorise le micro une fois : ensuite Peach écoute automatiquement tant que l’app est ouverte.', 'Autoriser');
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    showMicCard('HTTPS requis', 'Le micro mobile exige une page HTTPS. Ouvre Peach depuis l’URL GitHub Pages sécurisée.', 'Réessayer');
    return;
  }

  isStartingMic = true;
  setListeningState('waiting', 'Connexion micro…');

  try {
    await initAudioContext();

    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      }
    });

    micSourceNode = audioContext.createMediaStreamSource(micStream);
    const highpassFilter = audioContext.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.value = 55;
    highpassFilter.Q.value = 0.7;

    const lowpassFilter = audioContext.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.value = 1200;
    lowpassFilter.Q.value = 0.7;

    const preampNode = audioContext.createGain();
    preampNode.gain.value = 2.4;

    micAnalyser = audioContext.createAnalyser();
    micAnalyser.fftSize = 4096;
    micAnalyser.smoothingTimeConstant = 0;

    micSourceNode.connect(highpassFilter);
    highpassFilter.connect(lowpassFilter);
    lowpassFilter.connect(preampNode);
    preampNode.connect(micAnalyser);
    micFilterNodes = [highpassFilter, lowpassFilter, preampNode, micAnalyser];

    micStream.getTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        if (suppressTrackEndedRestart || referenceToneActive || document.visibilityState !== 'visible') return;
        stopMicrophone({ resetVisuals: false, suppressRestart: true });
        window.setTimeout(() => requestMicrophoneWhenPossible({ force: false }), 300);
      });
    });

    isMicTuning = true;
    isStartingMic = false;
    micBlocked = false;
    lastSignalAt = 0;
    lastAnalysisAt = 0;
    hideMicCard();
    setListeningState('live', 'Écoute automatique');
    processAudioAnalysis(performance.now());
  } catch (error) {
    console.debug('Microphone unavailable:', error);
    isStartingMic = false;
    isMicTuning = false;

    const denied = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError';
    micBlocked = denied;
    setListeningState('waiting', 'Micro en attente');
    showMicCard(
      denied ? 'Micro non autorisé' : 'Micro suspendu',
      denied
        ? 'Autorise le micro dans Chrome/Android pour que l’accordeur écoute automatiquement.'
        : 'Le micro n’a pas pu démarrer. Relance l’écoute depuis ce bouton.',
      denied ? 'Autoriser' : 'Relancer'
    );
  }
}

function stopMicrophone({ resetVisuals = true, showWaiting = true, suppressRestart = true } = {}) {
  if (micAnimationId) cancelAnimationFrame(micAnimationId);
  micAnimationId = null;

  if (micStream && suppressRestart) {
    suppressTrackEndedRestart = true;
    window.setTimeout(() => { suppressTrackEndedRestart = false; }, 500);
  }

  if (micStream) micStream.getTracks().forEach((track) => track.stop());

  if (micSourceNode) {
    try { micSourceNode.disconnect(); } catch (error) { console.debug('Mic source already disconnected', error); }
  }

  micFilterNodes.forEach((node) => {
    try { node.disconnect(); } catch (error) { console.debug('Audio node already disconnected', error); }
  });

  micStream = null;
  micSourceNode = null;
  micFilterNodes = [];
  micAnalyser = null;
  isMicTuning = false;
  isStartingMic = false;

  if (showWaiting) setListeningState('waiting', 'Micro en attente');
  if (resetVisuals) resetTunerVisuals();
}

function setListeningState(state, text) {
  const listening = $('#listening-pill');
  if (!listening) return;
  listening.classList.remove('is-live', 'is-waiting', 'is-ear');
  if (state === 'live') listening.classList.add('is-live');
  else if (state === 'ear') listening.classList.add('is-ear');
  else listening.classList.add('is-waiting');
  listening.innerText = text;
}

function setSignalState(hasSignal, text) {
  const signal = $('#signal-pill');
  if (!signal) return;
  signal.classList.toggle('is-signal', hasSignal);
  signal.classList.toggle('is-silent', !hasSignal);
  signal.innerText = text;
}

function showMicCard(title, text, buttonText) {
  $('#mic-permission-title').innerText = title;
  $('#mic-permission-text').innerText = text;
  $('#mic-permission-button').innerText = buttonText;
  $('#mic-permission-card').classList.remove('is-hidden');
}

function hideMicCard() {
  $('#mic-permission-card').classList.add('is-hidden');
}

function handleTuningChange() {
  const selected = $('#tuning-select').value;
  currentPresetKey = selected || 'standard';
  activeSavedTuningId = null;

  if (currentPresetKey.startsWith('saved:')) {
    const id = currentPresetKey.slice(6);
    const saved = savedTunings.find((item) => item.id === id);
    if (saved) {
      activeSavedTuningId = saved.id;
      activeCustomName = saved.name;
      currentFreqs = [...saved.freqs];
      currentNotes = [...saved.notes];
      $('#custom-tuning-name').value = saved.name;
      saved.lastUsedAt = new Date().toISOString();
      persistSavedTunings();
    }
    setTuningPage('diapason');
  } else if (currentPresetKey === 'custom') {
    currentFreqs = [...presetTunings.custom.freqs];
    currentNotes = [...presetTunings.custom.notes];
    $('#custom-tuning-name').value = activeCustomName || '';
    setTuningPage('custom');
  } else {
    currentFreqs = [...presetTunings[currentPresetKey].freqs];
    currentNotes = [...presetTunings[currentPresetKey].notes];
    activeCustomName = '';
    $('#custom-tuning-name').value = '';
    setTuningPage('diapason');
  }

  saveCustomTuning();
  renderTargetNotes();
  renderStringsGrid();
  renderCustomInputs();
  updateCustomActionState();
  stopReferenceTone({ resumeMic: true });
}

function setTuningPage(page, { scroll = true, smooth = true } = {}) {
  const nextPage = page === 'custom' ? 'custom' : 'diapason';
  tuningPage = nextPage;

  const scrollEl = $('#tuning-scroll');
  const customCard = $('#tuning-card-custom');
  const diapasonCard = $('#tuning-card-diapason');

  if (nextPage === 'custom') markCustomCardDiscovered();

  if (scroll && scrollEl) {
    const targetLeft = nextPage === 'custom'
      ? (customCard?.offsetLeft || 0)
      : (diapasonCard?.offsetLeft || 0);
    scrollEl.scrollTo({ left: targetLeft, behavior: smooth ? 'smooth' : 'auto' });
  }

  updateCustomSwipeHint();
  if (nextPage === 'custom') renderCustomInputs();
}

function bindTuningCardScroll() {
  const scrollEl = $('#tuning-scroll');
  const customCard = $('#tuning-card-custom');
  if (!scrollEl || !customCard) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const viewportCenter = scrollEl.scrollLeft + scrollEl.clientWidth / 2;
    const customCenter = customCard.offsetLeft + customCard.offsetWidth / 2;
    const distance = Math.abs(viewportCenter - customCenter);
    const isCustomVisible = distance < customCard.offsetWidth * 0.46;

    if (isCustomVisible) {
      tuningPage = 'custom';
      markCustomCardDiscovered();
    } else {
      tuningPage = 'diapason';
    }
  };

  scrollEl.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
}

function markCustomCardDiscovered() {
  if (customCardDiscovered) return;
  customCardDiscovered = true;
  try { localStorage.setItem(CUSTOM_DISCOVERY_STORAGE_KEY, '1'); } catch (error) { console.debug('Custom discovery storage unavailable:', error); }
  updateCustomSwipeHint();
}

function updateCustomSwipeHint() {
  const hint = $('#custom-swipe-hint');
  if (!hint) return;
  hint.classList.toggle('is-hidden', customCardDiscovered);
}

function scheduleAutoApplyCustomTuning({ fromHz = false } = {}) {
  clearTimeout(autoApplyTimer);
  autoApplyTimer = window.setTimeout(() => {
    applyCustomTuning({ silent: true, stayOnCustom: true, fromHz });
  }, 90);
}

function applyCustomTuning({ silent = false, stayOnCustom = true, fromHz = false } = {}) {
  const tuning = readCustomUnifiedFromUI();

  currentFreqs = tuning.freqs;
  currentNotes = tuning.notes;

  if (!activeSavedTuningId) {
    presetTunings.custom.freqs = [...tuning.freqs];
    presetTunings.custom.notes = [...tuning.notes];
    currentPresetKey = 'custom';
  }

  const select = $('#tuning-select');
  if (select && Array.from(select.options).some((option) => option.value === currentPresetKey)) {
    select.value = currentPresetKey;
  }

  if (!fromHz) syncHzInputs(currentFreqs);
  if (fromHz) syncNoteInputs(currentNotes);
  saveCustomTuning();

  renderTargetNotes();
  renderStringsGrid();
  updateCustomActionState();
  stopReferenceTone({ resumeMic: true });
  resetTunerVisuals();
  if (!stayOnCustom) setTuningPage('diapason');
}

function saveCustomTuning() {
  try {
    localStorage.setItem(CUSTOM_TUNING_STORAGE_KEY, JSON.stringify({
      name: activeCustomName || '',
      notes: currentNotes,
      freqs: currentFreqs
    }));
  } catch (error) {
    console.debug('Custom tuning preference unavailable:', error);
  }
}


function normalizeSavedTuning(item) {
  try {
    const notes = item.notes.map(sanitizeNoteName);
    const freqs = item.freqs?.length === 6
      ? item.freqs.map((freq, index) => {
          const parsed = Number(freq);
          return Number.isFinite(parsed) && parsed >= 30 && parsed <= 1000 ? parsed : frequencyFromNoteName(notes[index]);
        })
      : notes.map(frequencyFromNoteName);

    return {
      id: String(item.id),
      name: String(item.name || 'Accordage sans nom').trim().slice(0, 80) || 'Accordage sans nom',
      notes,
      freqs,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
      lastUsedAt: item.lastUsedAt || item.updatedAt || new Date().toISOString(),
      source: item.source || 'local'
    };
  } catch (error) {
    console.debug('Invalid saved tuning skipped:', error);
    return null;
  }
}

function persistSavedTunings() {
  try {
    localStorage.setItem(SAVED_TUNINGS_STORAGE_KEY, JSON.stringify(savedTunings));
  } catch (error) {
    console.debug('Saved tunings unavailable:', error);
  }
}

function createTuningId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `tuning-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}


function normalizeSearchTerm(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[^a-zA-Z0-9#' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getGlobalTuningApiUrl() {
  const configured = String(window.PEACH_GLOBAL_TUNING_API_URL || '').trim();
  if (configured) return configured;

  try {
    return String(localStorage.getItem(GLOBAL_TUNING_API_STORAGE_KEY) || '').trim();
  } catch (error) {
    console.debug('Global tuning API preference unavailable:', error);
    return '';
  }
}

function isGlobalTuningSearchEnabled() {
  return Boolean(getGlobalTuningApiUrl());
}

function handleSongSearchInput() {
  renderTuningSelect({ preserveSelection: true });
  renderSongTuningResults();
  scheduleGlobalTuningSearch();
}

function getSongTuningMatches(query) {
  const cleanQuery = normalizeSearchTerm(query);
  if (cleanQuery.length < 2) return [];
  const terms = cleanQuery.split(' ').filter(Boolean);

  return SONG_TUNING_LIBRARY
    .map((song) => {
      const haystack = normalizeSearchTerm([
        song.title,
        song.artist,
        song.displayName,
        song.version,
        song.role,
        song.tuningName,
        song.notes.join(' '),
        ...(song.aliases || [])
      ].join(' '));

      let score = 0;
      let matchedTerms = 0;
      if (haystack.includes(cleanQuery)) score += 14;
      terms.forEach((term) => {
        if (haystack.includes(term)) {
          matchedTerms += 1;
          score += term.length > 2 ? 3 : 1;
        }
      });
      if (normalizeSearchTerm(song.title).startsWith(cleanQuery)) score += 8;
      if (normalizeSearchTerm(song.artist).includes(cleanQuery)) score += 4;
      if (terms.length > 1 && !haystack.includes(cleanQuery) && matchedTerms < 2) score = 0;

      return { song, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.song.displayName.localeCompare(b.song.displayName))
    .slice(0, 4)
    .map((item) => item.song);
}

function getActiveGlobalResults(query) {
  return globalSearchState.query === normalizeSearchTerm(query) ? globalSearchState.results : [];
}

function scheduleGlobalTuningSearch() {
  clearTimeout(globalSearchTimer);
  if (globalSearchController) {
    globalSearchController.abort();
    globalSearchController = null;
  }

  const query = $('#saved-tuning-search')?.value || '';
  const cleanQuery = normalizeSearchTerm(query);
  const localMatches = getSongTuningMatches(query);

  if (cleanQuery.length < 2) {
    globalSearchState = { query: '', status: 'idle', message: '', results: [] };
    renderSongTuningResults();
    return;
  }

  if (localMatches.length) {
    globalSearchState = { query: cleanQuery, status: 'idle', message: '', results: [] };
    renderSongTuningResults();
    return;
  }

  if (!isGlobalTuningSearchEnabled()) {
    globalSearchState = {
      query: cleanQuery,
      status: 'not-configured',
      message: 'Base globale non connectée sur ce déploiement.',
      results: []
    };
    renderSongTuningResults();
    return;
  }

  globalSearchState = {
    query: cleanQuery,
    status: 'loading',
    message: 'Recherche dans la base globale…',
    results: []
  };
  renderSongTuningResults();

  globalSearchTimer = window.setTimeout(() => {
    fetchGlobalSongTunings(query, cleanQuery);
  }, GLOBAL_TUNING_SEARCH_DEBOUNCE_MS);
}

async function fetchGlobalSongTunings(query, cleanQuery) {
  const endpoint = getGlobalTuningApiUrl();
  if (!endpoint) return;

  const controller = new AbortController();
  globalSearchController = controller;

  try {
    const url = new URL(endpoint, window.location.href);
    url.searchParams.set('query', query.trim());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`Global tuning API returned ${response.status}`);

    const payload = await response.json();
    const results = normalizeGlobalTuningPayload(payload)
      .filter((song) => song)
      .slice(0, 4);

    if (globalSearchState.query !== cleanQuery) return;

    globalSearchState = {
      query: cleanQuery,
      status: results.length ? 'ready' : 'empty',
      message: results.length
        ? globalSearchMessage(payload, results)
        : 'Aucun accordage global trouvé.',
      results
    };
    renderSongTuningResults();
  } catch (error) {
    if (error.name === 'AbortError') return;
    console.debug('Global tuning search failed:', error);
    if (globalSearchState.query !== cleanQuery) return;
    globalSearchState = {
      query: cleanQuery,
      status: 'error',
      message: 'Recherche globale indisponible.',
      results: []
    };
    renderSongTuningResults();
  } finally {
    if (globalSearchController === controller) globalSearchController = null;
  }
}

function normalizeGlobalTuningPayload(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  return results.map(normalizeGlobalSongTuning).filter(Boolean);
}

function normalizeGlobalSongTuning(item) {
  try {
    const notes = Array.isArray(item?.notes) ? item.notes.map(sanitizeNoteName) : [];
    if (notes.length !== 6) return null;

    const freqs = Array.isArray(item?.freqs) && item.freqs.length === 6
      ? item.freqs.map(Number)
      : notes.map(frequencyFromNoteName);

    const title = String(item.title || item.songTitle || item.displayName || 'Morceau').trim().slice(0, 90);
    const artist = String(item.artist || 'Artiste inconnu').trim().slice(0, 90);
    const tuningName = String(item.tuningName || item.tuning || notes.map(stripOctave).join(' ')).trim().slice(0, 50);
    const displayName = String(item.displayName || `${title} — ${artist}`).trim().slice(0, 120);
    const source = String(item.source || item.origin || 'global-database');
    const generated = Boolean(item.generated || item.aiGenerated || source.includes('ai'));
    const persisted = item.persisted !== false;

    return {
      id: `global:${String(item.id || displayName).slice(0, 120)}`,
      title,
      artist,
      displayName,
      version: String(item.version || 'Version demandée').trim().slice(0, 80),
      role: String(item.role || item.instrument || 'Guitare').trim().slice(0, 80),
      tuningName,
      notes,
      freqs,
      aliases: Array.isArray(item.aliases) ? item.aliases.slice(0, 8) : [],
      confidence: String(item.confidence || (generated ? 'IA à vérifier' : 'globale')).trim().slice(0, 40),
      sourceLabel: generated
        ? (persisted ? 'IA · ajouté à la base globale' : 'IA · non persisté')
        : 'Base globale',
      source,
      generated,
      persisted
    };
  } catch (error) {
    console.debug('Invalid global tuning result skipped:', error);
    return null;
  }
}

function globalSearchMessage(payload, results) {
  if (payload?.source === 'ai') {
    return 'Trouvé par IA et ajouté à la base globale.';
  }
  return 'Trouvé dans la base globale.';
}

function findSongById(id) {
  return SONG_TUNING_LIBRARY.find((item) => item.id === id)
    || globalSearchState.results.find((item) => item.id === id);
}

function renderSongTuningResults() {
  const results = $('#song-tuning-results');
  if (!results) return;
  const query = $('#saved-tuning-search')?.value || '';
  const cleanQuery = normalizeSearchTerm(query);
  const localMatches = getSongTuningMatches(query);
  const globalMatches = getActiveGlobalResults(query);
  const matches = [...localMatches, ...globalMatches];
  const globalEnabled = isGlobalTuningSearchEnabled();

  results.innerHTML = '';
  results.classList.toggle('is-hidden', cleanQuery.length < 2);
  if (cleanQuery.length < 2) return;

  const header = document.createElement('div');
  header.className = 'song-results-head';
  const statusText = songSearchStatusText(localMatches, globalMatches, globalEnabled);
  header.innerHTML = `
    <strong>Base morceaux</strong>
    <span>${escapeHtml(statusText)}</span>
  `;
  results.appendChild(header);

  if (!matches.length) {
    const empty = document.createElement('p');
    empty.className = 'song-result-empty';
    empty.innerText = songSearchEmptyText(globalEnabled);
    results.appendChild(empty);
    return;
  }

  matches.forEach((song) => {
    const row = document.createElement('article');
    row.className = 'song-result-item';
    row.innerHTML = `
      <button class="song-result-main" type="button" data-song-action="apply" data-song-id="${escapeHtml(song.id)}" aria-label="Appliquer ${escapeHtml(song.displayName)}">
        <strong>${escapeHtml(song.title)}</strong>
        <span>${escapeHtml(song.artist)} · ${escapeHtml(song.tuningName)}</span>
        <small>${escapeHtml(song.notes.map(stripOctave).join(' '))} · ${escapeHtml(song.version)}${song.role ? ' · ' + escapeHtml(song.role) : ''} · ${escapeHtml(song.sourceLabel || 'Base morceaux')}</small>
      </button>
      <button class="song-result-save" type="button" data-song-action="save" data-song-id="${escapeHtml(song.id)}" aria-label="Sauvegarder ${escapeHtml(song.displayName)}" title="Sauvegarder">
        <span aria-hidden="true">＋</span>
      </button>
    `;
    results.appendChild(row);
  });

  results.querySelectorAll('button[data-song-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const song = findSongById(button.dataset.songId);
      if (!song) return;
      if (button.dataset.songAction === 'save') saveSongTuning(song);
      else applySongTuning(song, { flash: true });
    });
  });
}

function songSearchStatusText(localMatches, globalMatches, globalEnabled) {
  if (localMatches.length) return 'Résultats embarqués disponibles.';
  if (globalMatches.length) return globalSearchState.message || 'Résultats globaux disponibles.';
  if (globalSearchState.status === 'loading') return globalSearchState.message;
  if (globalSearchState.status === 'error') return globalSearchState.message;
  if (globalSearchState.status === 'empty') return globalSearchState.message;
  if (!globalEnabled) return 'Pas dans la mini-base. Base globale à connecter.';
  return 'Recherche globale prête.';
}

function songSearchEmptyText(globalEnabled) {
  if (globalSearchState.status === 'loading') return 'Recherche globale en cours…';
  if (globalSearchState.status === 'error') return 'La recherche globale ne répond pas pour le moment.';
  if (globalSearchState.status === 'empty') return 'Aucun accordage trouvé dans la base globale.';
  if (!globalEnabled) return 'Connecte une API globale pour chercher les morceaux non documentés.';
  return 'Essaie “Iris”, “Kashmir”, “Everlong”, “Start Me Up”, “Chop Suey”…';
}

function applySongTuning(song, { flash = false } = {}) {
  const notes = song.notes.map(sanitizeNoteName);
  const freqs = getSongFrequencies(song, notes);

  activeSavedTuningId = null;
  activeCustomName = song.displayName;
  currentPresetKey = 'custom';
  currentNotes = notes;
  currentFreqs = freqs;
  presetTunings.custom.notes = [...notes];
  presetTunings.custom.freqs = [...freqs];

  const nameInput = $('#custom-tuning-name');
  if (nameInput) nameInput.value = song.displayName;

  saveCustomTuning();
  renderTuningSelect();
  const select = $('#tuning-select');
  if (select) select.value = 'custom';
  renderTargetNotes();
  renderStringsGrid();
  renderCustomInputs();
  updateCustomActionState();
  stopReferenceTone({ resumeMic: true });
  resetTunerVisuals();
  setTuningPage('diapason');
  if (flash) flashActionFeedback(`${song.tuningName} appliqué.`);
}

function saveSongTuning(song) {
  const notes = song.notes.map(sanitizeNoteName);
  const freqs = getSongFrequencies(song, notes);
  const existing = savedTunings.find((item) => item.name === song.displayName && arraysEqual(item.notes, notes));

  if (existing) {
    activateSavedTuning(existing.id);
    flashActionFeedback('Déjà sauvegardé · accordage activé.');
    return;
  }

  const now = new Date().toISOString();
  const item = {
    id: createTuningId(),
    name: song.displayName,
    notes,
    freqs,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: now,
    source: song.source || 'embedded-song-library',
    songId: song.id,
    sourceLabel: song.sourceLabel,
    confidence: song.confidence,
    generated: Boolean(song.generated),
    persisted: song.persisted !== false
  };

  savedTunings.unshift(item);
  persistSavedTunings();
  applySongTuning(song, { flash: false });
  activeSavedTuningId = item.id;
  currentPresetKey = `saved:${item.id}`;
  renderTuningSelect();
  const select = $('#tuning-select');
  if (select) select.value = currentPresetKey;
  renderSavedManager();
  setTuningPage('diapason');
}

function getSongFrequencies(song, notes) {
  if (Array.isArray(song.freqs) && song.freqs.length === 6) {
    const freqs = song.freqs.map(Number);
    if (freqs.every((freq) => Number.isFinite(freq) && freq > 0)) return freqs;
  }
  return notes.map(frequencyFromNoteName);
}

function renderTuningSelect({ preserveSelection = false } = {}) {
  const select = $('#tuning-select');
  if (!select) return;

  const previous = preserveSelection ? select.value || currentPresetKey : currentPresetKey;
  const search = ($('#saved-tuning-search')?.value || '').trim().toLowerCase();
  select.innerHTML = '';

  const presetGroup = document.createElement('optgroup');
  presetGroup.label = 'Présets';
  PRESET_SELECT_META.forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    presetGroup.appendChild(option);
  });
  select.appendChild(presetGroup);

  const savedGroup = document.createElement('optgroup');
  savedGroup.label = 'Mes accordages';
  const filteredSaved = savedTunings
    .slice()
    .sort((a, b) => String(b.lastUsedAt || b.updatedAt).localeCompare(String(a.lastUsedAt || a.updatedAt)))
    .filter((item) => !search || item.name.toLowerCase().includes(search) || item.notes.join(' ').toLowerCase().includes(search));

  if (filteredSaved.length) {
    filteredSaved.forEach((item) => {
      const option = document.createElement('option');
      option.value = `saved:${item.id}`;
      option.textContent = `${item.name} — ${item.notes.map(stripOctave).join(' ')}`;
      savedGroup.appendChild(option);
    });
  } else {
    const empty = document.createElement('option');
    empty.disabled = true;
    empty.textContent = search ? 'Aucun accordage sauvegardé trouvé' : 'Aucun accordage sauvegardé';
    savedGroup.appendChild(empty);
  }
  select.appendChild(savedGroup);

  const customGroup = document.createElement('optgroup');
  customGroup.label = 'Création';
  const custom = document.createElement('option');
  custom.value = 'custom';
  custom.textContent = 'Créer…';
  customGroup.appendChild(custom);
  select.appendChild(customGroup);

  const values = Array.from(select.options).map((option) => option.value);
  select.value = values.includes(previous) ? previous : (values.includes(currentPresetKey) ? currentPresetKey : 'standard');
}

function getTuningNameInputValue() {
  const value = ($('#custom-tuning-name')?.value || '').trim();
  return value || activeCustomName || 'Accordage personnalisé';
}

function saveActiveCustomTuning() {
  const tuning = readCustomUnifiedFromUI();
  const now = new Date().toISOString();
  const name = getTuningNameInputValue().slice(0, 80);

  currentNotes = tuning.notes;
  currentFreqs = tuning.freqs;
  activeCustomName = name;

  if (activeSavedTuningId) {
    const index = savedTunings.findIndex((item) => item.id === activeSavedTuningId);
    if (index !== -1) {
      savedTunings[index] = {
        ...savedTunings[index],
        name,
        notes: [...currentNotes],
        freqs: [...currentFreqs],
        updatedAt: now,
        lastUsedAt: now
      };
    }
  } else {
    const item = {
      id: createTuningId(),
      name,
      notes: [...currentNotes],
      freqs: [...currentFreqs],
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
      source: 'local'
    };
    savedTunings.unshift(item);
    activeSavedTuningId = item.id;
  }

  currentPresetKey = `saved:${activeSavedTuningId}`;
  persistSavedTunings();
  saveCustomTuning();
  renderTuningSelect();
  $('#tuning-select').value = currentPresetKey;
  $('#custom-tuning-name').value = name;
  renderTargetNotes();
  renderStringsGrid();
  renderSavedManager();
  updateCustomActionState();
  flashActionFeedback('Accordage sauvegardé.');
}

function duplicateActiveSavedTuning(id = activeSavedTuningId) {
  const source = savedTunings.find((item) => item.id === id);
  if (!source) return;

  const now = new Date().toISOString();
  const copy = {
    ...source,
    id: createTuningId(),
    name: `${source.name} — copie`,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: now
  };
  savedTunings.unshift(copy);
  activeSavedTuningId = copy.id;
  activeCustomName = copy.name;
  currentPresetKey = `saved:${copy.id}`;
  currentNotes = [...copy.notes];
  currentFreqs = [...copy.freqs];
  persistSavedTunings();
  renderTuningSelect();
  $('#tuning-select').value = currentPresetKey;
  $('#custom-tuning-name').value = copy.name;
  renderCustomInputs();
  renderTargetNotes();
  renderStringsGrid();
  renderSavedManager();
  updateCustomActionState();
  flashActionFeedback('Copie créée.');
}

function deleteActiveSavedTuning(id = activeSavedTuningId) {
  const source = savedTunings.find((item) => item.id === id);
  if (!source) return;
  const ok = window.confirm(`Supprimer “${source.name}” de Mes accordages ?`);
  if (!ok) return;

  savedTunings = savedTunings.filter((item) => item.id !== id);
  if (activeSavedTuningId === id) {
    activeSavedTuningId = null;
    activeCustomName = '';
    currentPresetKey = 'standard';
    currentNotes = [...presetTunings.standard.notes];
    currentFreqs = [...presetTunings.standard.freqs];
    $('#custom-tuning-name').value = '';
  }
  persistSavedTunings();
  renderTuningSelect();
  $('#tuning-select').value = currentPresetKey;
  renderCustomInputs();
  renderTargetNotes();
  renderStringsGrid();
  renderSavedManager();
  updateCustomActionState();
  flashActionFeedback('Accordage supprimé.');
}

function renameSavedTuning(id) {
  const source = savedTunings.find((item) => item.id === id);
  if (!source) return;
  const nextName = window.prompt('Nouveau nom de l’accordage', source.name);
  if (nextName === null) return;
  const cleanName = nextName.trim().slice(0, 80);
  if (!cleanName) return;

  source.name = cleanName;
  source.updatedAt = new Date().toISOString();
  if (activeSavedTuningId === id) {
    activeCustomName = cleanName;
    $('#custom-tuning-name').value = cleanName;
  }
  persistSavedTunings();
  renderTuningSelect();
  $('#tuning-select').value = activeSavedTuningId === id ? `saved:${id}` : currentPresetKey;
  renderSavedManager();
  updateCustomActionState();
  flashActionFeedback('Accordage renommé.');
}

function activateSavedTuning(id) {
  const saved = savedTunings.find((item) => item.id === id);
  if (!saved) return;
  currentPresetKey = `saved:${id}`;
  activeSavedTuningId = id;
  activeCustomName = saved.name;
  currentNotes = [...saved.notes];
  currentFreqs = [...saved.freqs];
  saved.lastUsedAt = new Date().toISOString();
  persistSavedTunings();
  renderTuningSelect();
  $('#tuning-select').value = currentPresetKey;
  $('#custom-tuning-name').value = saved.name;
  renderCustomInputs();
  renderTargetNotes();
  renderStringsGrid();
  renderSavedManager();
  updateCustomActionState();
  stopReferenceTone({ resumeMic: true });
}

function updateCustomActionState() {
  const save = $('#save-custom');
  if (!save) return;

  const rawName = ($('#custom-tuning-name')?.value || '').trim();
  const fallbackName = (activeCustomName || '').trim();
  const name = rawName || fallbackName;
  const tuning = readCustomUnifiedFromUI();
  const selectedSaved = activeSavedTuningId ? savedTunings.find((item) => item.id === activeSavedTuningId) : null;
  const canResolveName = Boolean(name);
  const normalizedCurrentFreqs = tuning.freqs.map((value) => Number(value.toFixed(2)));
  const duplicateNameAndNotes = canResolveName && savedTunings.some((item) => {
    const sameName = item.id !== activeSavedTuningId && item.name === name;
    const sameNotes = arraysEqual(item.notes, tuning.notes);
    const sameFreqs = arraysEqual(
      item.freqs.map((value) => Number(Number(value).toFixed(2))),
      normalizedCurrentFreqs
    );
    return sameName && sameNotes && sameFreqs;
  });

  let disabled = !canResolveName || duplicateNameAndNotes;

  if (selectedSaved) {
    const normalizedBaselineFreqs = selectedSaved.freqs.map((value) => Number(Number(value).toFixed(2)));
    const hasPitchChanges = !arraysEqual(tuning.notes, selectedSaved.notes) || !arraysEqual(normalizedCurrentFreqs, normalizedBaselineFreqs);
    const hasNameChanges = rawName.length > 0 && rawName !== selectedSaved.name;
    disabled = disabled || !(hasPitchChanges || hasNameChanges);
  }

  save.innerText = 'Sauvegarder';
  save.disabled = disabled;
  save.classList.toggle('is-disabled', disabled);
  save.setAttribute('aria-disabled', disabled ? 'true' : 'false');
}

function arraysEqual(a = [], b = []) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function setSavedManagerOpen(open) {
  const drawer = $('#saved-drawer');
  const button = $('#library-menu-button');
  if (!drawer) return;

  const shouldOpen = Boolean(open);
  if (shouldOpen) savedDrawerReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : button;

  drawer.classList.toggle('is-open', shouldOpen);
  drawer.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  document.body.classList.toggle('drawer-open', shouldOpen);

  // Show branding when menu opens; hide again when closed
  document.querySelector('.app-header')?.classList.toggle('is-menu-open', shouldOpen);

  if (button) button.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  if (shouldOpen) {
    renderSavedManager();
    window.setTimeout(() => focusFirstIn($('#saved-drawer .saved-drawer__panel')), 0);
  } else if (savedDrawerReturnFocus) {
    window.setTimeout(() => savedDrawerReturnFocus?.focus?.(), 0);
  }
}

function renderSavedManager() {
  const list = $('#saved-manager-list');
  if (!list) return;
  list.innerHTML = '';

  const query = ($('#saved-manager-search')?.value || '').trim().toLowerCase();
  const items = savedTunings
    .slice()
    .sort((a, b) => String(b.lastUsedAt || b.updatedAt).localeCompare(String(a.lastUsedAt || a.updatedAt)))
    .filter((item) => {
      if (!query) return true;
      const haystack = `${item.name} ${item.notes.join(' ')} ${item.notes.map(stripOctave).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });

  if (!savedTunings.length) {
    const empty = document.createElement('p');
    empty.className = 'saved-empty';
    empty.innerText = 'Aucun accordage enregistré pour l’instant. Crée un accordage, donne-lui un nom, puis sauvegarde-le.';
    list.appendChild(empty);
    return;
  }

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'saved-empty';
    empty.innerText = 'Aucun accordage ne correspond à cette recherche.';
    list.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const isMenuOpen = openSavedMenuId === item.id;
    const row = document.createElement('div');
    row.className = `saved-item${activeSavedTuningId === item.id ? ' is-active' : ''}${isMenuOpen ? ' is-menu-open' : ''}`;
    row.innerHTML = `
      <div class="saved-item__top">
        <button class="saved-item__title saved-item__title-button" type="button" data-action="use" data-id="${item.id}" aria-label="Utiliser ${escapeHtml(item.name)}">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.notes.map(stripOctave).join(' · '))}</span>
        </button>
        <button class="saved-item__more" type="button" data-action="toggle-menu" data-id="${item.id}" aria-label="Plus d’actions pour ${escapeHtml(item.name)}" aria-expanded="${isMenuOpen ? 'true' : 'false'}">…</button>
      </div>
      <div class="saved-item__menu${isMenuOpen ? '' : ' is-hidden'}">
        <button type="button" data-action="rename" data-id="${item.id}" aria-label="Renommer ${escapeHtml(item.name)}">Renommer</button>
        <button type="button" data-action="duplicate" data-id="${item.id}" aria-label="Dupliquer ${escapeHtml(item.name)}">Dupliquer</button>
        <button type="button" data-action="delete" data-id="${item.id}" aria-label="Supprimer ${escapeHtml(item.name)}">Supprimer</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('button[data-action]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const id = button.dataset.id;
      const action = button.dataset.action;
      if (action === 'toggle-menu') {
        event.stopPropagation();
        openSavedMenuId = openSavedMenuId === id ? null : id;
        renderSavedManager();
        return;
      }
      if (action === 'use') {
        activateSavedTuning(id);
        setSavedManagerOpen(false);
      }
      if (action === 'rename') {
        openSavedMenuId = null;
        renameSavedTuning(id);
      }
      if (action === 'duplicate') {
        openSavedMenuId = null;
        duplicateActiveSavedTuning(id);
      }
      if (action === 'delete') {
        openSavedMenuId = null;
        deleteActiveSavedTuning(id);
      }
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}



function renderTargetNotes() {
  const targetDiv = $('#target-notes-ui');
  if (!targetDiv) return;
  targetDiv.innerHTML = '';

  currentNotes.forEach((note, index) => {
    const targetNote = document.createElement('span');
    targetNote.className = 'target-note';
    targetNote.dataset.index = String(index);
    targetNote.innerText = stripOctave(note);
    if (index === currentTargetIndex) targetNote.classList.add('is-current');
    targetDiv.appendChild(targetNote);
  });
}

function renderStringsGrid() {
  const grid = $('#strings-grid');
  grid.innerHTML = '';

  currentFreqs.forEach((freq, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `string-btn-${index}`;
    button.className = 'string-card';
    button.setAttribute('aria-label', `Corde ${6 - index} : ${currentNotes[index]}, ${freq.toFixed(1)} Hz`);
    if (index === activeStringIndex) button.classList.add('is-playing');
    if (index === currentTargetIndex) button.classList.add('is-current-target');
    button.addEventListener('click', () => toggleStringSound(index));
    button.innerHTML = `
      <span class="string-note">${currentNotes[index]}</span>
      <span class="string-freq">${freq.toFixed(1)} Hz</span>
    `;
    grid.appendChild(button);
  });
}

function renderCustomInputs() {
  renderCustomUnifiedInputs();
  syncNoteInputs(currentNotes);
  syncHzInputs(currentFreqs);
}

function renderCustomUnifiedInputs() {
  const grid = $('#custom-note-grid');
  if (!grid) return;
  grid.innerHTML = '';

  currentNotes.forEach((note, index) => {
    const freq = Number(currentFreqs[index] || frequencyFromNoteName(note));
    const label = document.createElement('label');
    label.className = 'custom-field custom-field--dual';
    label.innerHTML = `
      <span>Corde ${6 - index}</span>
      <div class="custom-dual-input">
        <select id="custom-note-${index}" aria-label="Note de la corde ${6 - index}">${getNoteOptionsHtml(note)}</select>
        <input type="number" id="custom-f-${index}" aria-label="Fréquence de la corde ${6 - index}" step="0.01" min="30" max="1000" value="${freq.toFixed(2)}" inputmode="decimal" />
      </div>
    `;
    grid.appendChild(label);

    const select = label.querySelector('select');
    const input = label.querySelector('input');

    select.addEventListener('change', () => {
      const sanitized = sanitizeNoteName(select.value);
      input.value = frequencyFromNoteName(sanitized).toFixed(2);
      scheduleAutoApplyCustomTuning();
    });

    input.addEventListener('change', () => {
      const value = Number.parseFloat(String(input.value || '').replace(',', '.'));
      const fallback = frequencyFromNoteName(select.value || currentNotes[index] || 'E2');
      const freqValue = Number.isFinite(value) && value >= 30 && value <= 1000 ? value : fallback;
      const closest = getClosestChromaticNote(freqValue).name;
      select.value = sanitizeNoteName(closest);
      input.value = freqValue.toFixed(2);
      scheduleAutoApplyCustomTuning({ fromHz: true });
    });
  });
}

function readCustomUnifiedFromUI() {
  const notes = [];
  const freqs = [];

  for (let i = 0; i < 6; i += 1) {
    const select = $(`#custom-note-${i}`);
    const input = $(`#custom-f-${i}`);
    const selectedNote = sanitizeNoteName(select?.value || currentNotes[i] || 'E2');
    const parsedFreq = Number.parseFloat(String(input?.value || '').replace(',', '.'));
    const fallbackFreq = frequencyFromNoteName(selectedNote);
    const freq = Number.isFinite(parsedFreq) && parsedFreq >= 30 && parsedFreq <= 1000 ? parsedFreq : fallbackFreq;
    const note = input && Number.isFinite(parsedFreq) ? sanitizeNoteName(getClosestChromaticNote(freq).name) : selectedNote;
    notes.push(note);
    freqs.push(freq);
  }

  return { notes, freqs };
}

function syncNoteInputs(notes) {
  notes.forEach((note, index) => {
    const sanitized = sanitizeNoteName(note);
    const select = $(`#custom-note-${index}`);
    if (select) select.value = sanitized;
    const freqLabel = $(`#custom-note-freq-${index}`);
    if (freqLabel) freqLabel.innerText = `${frequencyFromNoteName(sanitized).toFixed(2)} Hz`;
  });
}

function syncHzInputs(freqs) {
  freqs.forEach((freq, index) => {
    const input = $(`#custom-f-${index}`);
    if (input) input.value = Number(freq).toFixed(2);
  });
}

function getNoteOptionsHtml(selectedNote) {
  const selected = sanitizeNoteName(selectedNote);
  const options = [];

  for (let octave = CUSTOM_NOTE_MIN_OCTAVE; octave <= CUSTOM_NOTE_MAX_OCTAVE; octave += 1) {
    NOTE_NAMES.forEach((noteName, noteIndex) => {
      const value = `${noteName}${octave}`;
      const label = `${NOTE_LABELS[noteIndex]}${octave}`;
      options.push(`<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`);
    });
  }

  return options.join('');
}

function toggleStringSound(index) {
  initAudioContext().then(() => {
    if (activeStringIndex === index && referenceToneActive) {
      stopReferenceTone({ resumeMic: true });
      return;
    }

    startReferenceTone(index);
  }).catch(() => showMicCard('Audio suspendu', 'Android demande une interaction pour relancer l’audio.', 'Relancer'));
}

function startReferenceTone(index) {
  stopReferenceTone({ resumeMic: false });

  resumeMicAfterReference = isMicTuning || isStartingMic || !micBlocked;
  stopMicrophone({ resetVisuals: false, showWaiting: false });
  setListeningState('ear', 'Mode Oreille');
  setSignalState(false, 'Micro en pause');
  hideMicCard();

  const frequency = currentFreqs[index];
  const note = currentNotes[index];
  const now = audioContext.currentTime;
  const profile = getToneProfile(frequency, REFERENCE_TONE_MODE);

  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(profile.filterHz, now);
  filter.Q.setValueAtTime(0.45, now);

  const masterGain = audioContext.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(profile.masterGain, now + profile.attack);
  masterGain.connect(filter);
  filter.connect(audioContext.destination);

  const oscillators = [];
  const gainNodes = [];

  profile.harmonics.forEach((harmonic) => {
    const harmonicFreq = frequency * harmonic.multiplier;
    if (harmonicFreq > 5200) return;

    const oscillator = audioContext.createOscillator();
    oscillator.type = harmonic.type || 'sine';
    oscillator.frequency.setValueAtTime(harmonicFreq, now);
    oscillator.detune.setValueAtTime(0, now);

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(harmonic.gain, now);

    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(now);
    oscillators.push(oscillator);
    gainNodes.push(gain);
  });

  activeTone = { oscillators, gainNodes, masterGain, filter, release: profile.release };
  activeStringIndex = index;
  referenceToneActive = true;
  currentTargetIndex = index;
  renderTargetNotes();
  updatePlayingButtonState();

  $('.tuner-card').classList.remove('is-perfect', 'is-perfect-outside', 'is-low', 'is-high');
  $('.tuner-card').classList.add('is-ear');
  $('#detected-note').innerText = note;
  $('#heard-note-detail').innerText = `${frequency.toFixed(1)} Hz`;
  renderChromaticWheel({ ...getClosestChromaticNote(frequency), cents: 0, name: note });
}

function getToneProfile(frequency, mode) {
  const lowNote = frequency < 145;
  if (mode === 'pure') mode = 'warm';

  if (mode === 'clear') {
    return {
      attack: 0.055,
      release: 0.20,
      masterGain: 0.72,
      filterHz: 2800,
      harmonics: [
        { multiplier: 1, gain: lowNote ? 0.13 : 0.20, type: 'sine' },
        { multiplier: 2, gain: lowNote ? 0.30 : 0.19, type: 'sine' },
        { multiplier: 3, gain: 0.13, type: 'sine' },
        { multiplier: 4, gain: 0.07, type: 'sine' },
        { multiplier: 6, gain: 0.035, type: 'sine' }
      ]
    };
  }

  return {
    attack: 0.12,
    release: 0.26,
    masterGain: 0.78,
    filterHz: 2100,
    harmonics: [
      { multiplier: 1, gain: lowNote ? 0.16 : 0.24, type: 'sine' },
      { multiplier: 2, gain: lowNote ? 0.27 : 0.15, type: 'sine' },
      { multiplier: 3, gain: 0.085, type: 'sine' },
      { multiplier: 4, gain: 0.04, type: 'sine' }
    ]
  };
}

function stopReferenceTone({ resumeMic = true } = {}) {
  if (!activeTone) {
    activeStringIndex = null;
    referenceToneActive = false;
    updatePlayingButtonState();
    if (resumeMic) scheduleMicResumeAfterReference();
    return;
  }

  const tone = activeTone;
  const now = audioContext?.currentTime || 0;
  const release = tone.release || 0.18;

  try {
    tone.masterGain.gain.cancelScheduledValues(now);
    tone.masterGain.gain.setValueAtTime(tone.masterGain.gain.value, now);
    tone.masterGain.gain.linearRampToValueAtTime(0, now + release);
    tone.oscillators.forEach((oscillator) => oscillator.stop(now + release + 0.03));
  } catch (error) {
    console.debug('Reference tone already stopped:', error);
  }

  window.setTimeout(() => {
    try { tone.masterGain.disconnect(); } catch (error) { console.debug('Master gain already disconnected', error); }
    try { tone.filter.disconnect(); } catch (error) { console.debug('Filter already disconnected', error); }
    tone.gainNodes.forEach((node) => {
      try { node.disconnect(); } catch (error) { console.debug('Gain already disconnected', error); }
    });
  }, Math.ceil((release + 0.06) * 1000));

  activeTone = null;
  activeStringIndex = null;
  referenceToneActive = false;
  $('.tuner-card')?.classList.remove('is-ear');
  updatePlayingButtonState();

  if (resumeMic) {
    setListeningState('waiting', 'Reprise micro…');
    setSignalState(false, 'Micro en reprise');
    $('#heard-note-detail').innerText = 'Reprise de l’écoute automatique…';
    scheduleMicResumeAfterReference();
  }
}

function scheduleMicResumeAfterReference() {
  if (!resumeMicAfterReference && micBlocked) return;
  if (document.visibilityState !== 'visible') return;
  window.setTimeout(() => requestMicrophoneWhenPossible({ force: false }), 260);
}

function updatePlayingButtonState() {
  document.querySelectorAll('.string-card').forEach((button, index) => {
    button.classList.toggle('is-playing', referenceToneActive && index === activeStringIndex);
    button.classList.toggle('is-current-target', index === currentTargetIndex);
  });
}

function resetTunerVisuals() {
  const tunerCard = $('.tuner-card');
  tunerCard.classList.remove('is-perfect', 'is-perfect-outside', 'is-low', 'is-high', 'is-ear');
  $('#detected-note').innerText = '--';
  $('#heard-note-detail').innerText = 'En attente d’une corde…';
  setSignalState(false, referenceToneActive ? 'Micro en pause' : 'Aucun signal');
  smoothedDisplayFrequency = null;
  setFeedbackText('Joue une corde pour commencer.', { force: true });
  renderChromaticWheel(null);
  currentTargetIndex = null;
  renderTargetNotes();
  updatePlayingButtonState();
  lastStableTarget = '';
  stableFrames = 0;
}

function processAudioAnalysis(now = performance.now()) {
  if (!isMicTuning || !micAnalyser || !audioContext || referenceToneActive) {
    micAnimationId = null;
    return;
  }

  micAnimationId = requestAnimationFrame(processAudioAnalysis);

  if (now - lastAnalysisAt < ANALYSIS_INTERVAL_MS) return;
  if (now < suppressAnalysisUntil) return;
  lastAnalysisAt = now;

  const buffer = new Float32Array(micAnalyser.fftSize);
  micAnalyser.getFloatTimeDomainData(buffer);

  const pitch = detectPitchYin(buffer, audioContext.sampleRate);

  if (pitch && pitch.frequency >= ANALYSIS_MIN_FREQ && pitch.frequency <= ANALYSIS_MAX_FREQ) {
    lastSignalAt = now;
    lastUiFrequency = pitch.frequency;
    updateTunerFromFrequency(pitch.frequency, pitch.rms);
  } else {
    if (!lastSignalAt || now - lastSignalAt > SIGNAL_STALE_MS) {
      setSignalState(false, 'Aucun signal');
      $('#heard-note-detail').innerText = lastUiFrequency ? `${lastUiFrequency.toFixed(1)} Hz` : 'En attente d’une corde…';
      $('.tuner-card').classList.remove('is-perfect', 'is-perfect-outside', 'is-low', 'is-high');
    }
  }
}

function updateTunerFromFrequency(frequency, rms) {
  const displayFrequency = smoothDisplayFrequency(frequency);
  const chromatic = getClosestChromaticNote(displayFrequency);
  const target = getClosestTargetFromTuning(displayFrequency);
  const targetCents = target.cents;
  const chromaticPerfect = Math.abs(chromatic.cents) <= PERFECT_CENTS;
  const targetPerfect = Math.abs(targetCents) <= PERFECT_CENTS;
  const outsideTuningPerfect = chromaticPerfect && !isNoteInCurrentTuning(chromatic.name);

  currentTargetIndex = target.index;
  renderTargetNotes();
  updatePlayingButtonState();
  renderChromaticWheel(chromatic);

  $('#detected-note').innerText = chromatic.name;
  $('#heard-note-detail').innerText = getHeardDetailLabel(displayFrequency, chromatic, outsideTuningPerfect, targetPerfect);

  setSignalState(true, getSignalLabel(rms));
  updateTuningState(chromatic.cents, { outsideTuningPerfect, targetPerfect, chromaticPerfect });
  updateStableHistory(outsideTuningPerfect ? chromatic.name : target.note, outsideTuningPerfect ? chromatic.cents : targetCents);
}

function getHeardDetailLabel(frequency, chromatic, outsideTuningPerfect, targetPerfect) {
  const cents = Math.round(chromatic.cents);
  if (outsideTuningPerfect || targetPerfect || Math.abs(chromatic.cents) <= PERFECT_CENTS) return `${frequency.toFixed(1)} Hz · 0¢`;
  const sign = cents > 0 ? '+' : '';
  return `${frequency.toFixed(1)} Hz · ${sign}${cents}¢`;
}

function isNoteInCurrentTuning(noteName) {
  const sanitized = sanitizeNoteName(noteName);
  return currentNotes.some((note) => sanitizeNoteName(note) === sanitized);
}



function smoothDisplayFrequency(frequency) {
  if (!Number.isFinite(frequency)) return frequency;
  if (!smoothedDisplayFrequency) {
    smoothedDisplayFrequency = frequency;
    return frequency;
  }

  const jumpInCents = Math.abs(1200 * Math.log2(frequency / smoothedDisplayFrequency));
  if (!Number.isFinite(jumpInCents) || jumpInCents > 72) {
    smoothedDisplayFrequency = frequency;
    return frequency;
  }

  const alpha = jumpInCents > 24 ? 0.36 : 0.24;
  smoothedDisplayFrequency = smoothedDisplayFrequency + (frequency - smoothedDisplayFrequency) * alpha;
  return smoothedDisplayFrequency;
}



function getSignalLabel(rms) {
  if (rms > 0.055) return 'Signal fort';
  if (rms > 0.018) return 'Signal net';
  return 'Signal léger';
}

function updateTuningState(cents, state = {}) {
  const tunerCard = $('.tuner-card');
  tunerCard.classList.remove('is-perfect', 'is-perfect-outside', 'is-low', 'is-high', 'is-ear');

  if (state.outsideTuningPerfect) {
    tunerCard.classList.add('is-perfect-outside');
  } else if (state.targetPerfect) {
    tunerCard.classList.add('is-perfect');
  } else if (cents < 0) {
    tunerCard.classList.add('is-low');
  } else {
    tunerCard.classList.add('is-high');
  }
}

function updateStableHistory(targetNote, cents) {
  if (Math.abs(cents) >= CLOSE_CENTS) {
    stableFrames = 0;
    return;
  }

  const cleanNote = stripOctave(targetNote);
  if (cleanNote === lastStableTarget) {
    stableFrames += 1;
    if (stableFrames === 6) addToHistory(cleanNote);
  } else {
    lastStableTarget = cleanNote;
    stableFrames = 1;
  }
}

function addToHistory(noteStr) {
  const historyContainer = $('#note-history');
  if (!historyContainer) return;
  if (noteHistory[0] === noteStr) return;

  noteHistory.unshift(noteStr);
  if (noteHistory.length > 5) noteHistory.pop();

  historyContainer.innerHTML = '';

  noteHistory.forEach((note, index) => {
    const pill = document.createElement('div');
    pill.className = 'history-pill';
    pill.style.opacity = `${Math.max(0.32, 1 - index * 0.17)}`;
    pill.innerText = note;
    historyContainer.appendChild(pill);
  });
}

function detectPitchYin(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i += 1) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.0028) return null;

  const minTau = Math.max(2, Math.floor(sampleRate / ANALYSIS_MAX_FREQ));
  const maxTau = Math.min(Math.floor(sampleRate / ANALYSIS_MIN_FREQ), Math.floor(buffer.length / 2));
  const windowSize = buffer.length - maxTau;
  const yin = new Float32Array(maxTau + 1);

  for (let tau = 1; tau <= maxTau; tau += 1) {
    let sum = 0;
    for (let i = 0; i < windowSize; i += 1) {
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

  if (tauEstimate === -1) {
    let bestTau = -1;
    let bestValue = 1;
    for (let tau = minTau; tau <= maxTau; tau += 1) {
      if (yin[tau] < bestValue) {
        bestValue = yin[tau];
        bestTau = tau;
      }
    }
    if (bestTau === -1 || bestValue > 0.25) return null;
    tauEstimate = bestTau;
  }

  const betterTau = parabolicInterpolate(yin, tauEstimate);
  const frequency = sampleRate / betterTau;
  if (!Number.isFinite(frequency)) return null;

  return { frequency, rms, clarity: 1 - yin[tauEstimate] };
}

function parabolicInterpolate(values, index) {
  const x0 = index > 0 ? values[index - 1] : values[index];
  const x1 = values[index];
  const x2 = index + 1 < values.length ? values[index + 1] : values[index];
  const denominator = x0 + x2 - 2 * x1;
  if (denominator === 0) return index;
  return index + (x0 - x2) / (2 * denominator);
}

function getClosestTargetFromTuning(frequency) {
  let best = null;

  currentFreqs.forEach((targetFreq, index) => {
    const cents = 1200 * Math.log2(frequency / targetFreq);
    const distance = Math.abs(cents);

    if (!best || distance < best.distance) {
      best = {
        index,
        note: currentNotes[index],
        frequency: targetFreq,
        cents,
        distance
      };
    }
  });

  return best;
}

function getClosestChromaticNote(frequency) {
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const h = 12 * Math.log2(frequency / C0);
  const rounded = Math.round(h);
  const octave = Math.floor(rounded / 12);
  const noteIndex = (rounded % 12 + 120) % 12;
  const expectedFrequency = C0 * Math.pow(2, rounded / 12);
  const cents = 1200 * Math.log2(frequency / expectedFrequency);
  const midi = (octave + 1) * 12 + noteIndex;

  return {
    name: NOTE_NAMES[noteIndex] + octave,
    frequency: expectedFrequency,
    cents,
    midi,
    noteIndex,
    octave
  };
}

function renderChromaticWheel(chromatic) {
  const wheel = $('#chromatic-wheel');
  if (!wheel) return;
  ensureChromaticWheelMarkup(wheel);
  ensureWheelAnimator(wheel);

  if (!chromatic || !Number.isFinite(chromatic.noteIndex)) {
    const idleRotation = getWheelTargetRotation(0, { idle: true });
    applyWheelRotation(wheel, idleRotation, { immediate: true });
    setNearestChromaticTick(wheel, null);
    wheel.classList.add('is-idle');
    return;
  }

  wheel.classList.remove('is-idle');
  const cents = Number.isFinite(chromatic.cents) ? chromatic.cents : 0;
  const targetRotation = getWheelTargetRotation(chromatic.noteIndex, { cents });
  applyWheelRotation(wheel, targetRotation, { cents });
  setNearestChromaticTick(wheel, chromatic.noteIndex);
}

function ensureWheelAnimator(wheel) {
  if (chromaticWheelQuickTo && chromaticWheelTweenElement === wheel) return;

  chromaticWheelTweenElement = wheel;
  chromaticWheelQuickTo = (value) => animateWheelRotation(wheel, value);
}

function applyWheelRotation(wheel, targetRotation, { cents = null, immediate = false } = {}) {
  const normalizedTarget = normalizeWheelRotation(chromaticWheelRotationDeg, targetRotation);
  chromaticWheelRotationDeg = normalizedTarget;

  const nearPerfect = Number.isFinite(cents) && Math.abs(cents) <= PERFECT_CENTS;
  const value = `${normalizedTarget.toFixed(3)}deg`;

  if (immediate || nearPerfect || !chromaticWheelQuickTo) {
    cancelWheelAnimation();
    wheel.style.setProperty('--wheel-rotation', value);
    return;
  }

  chromaticWheelQuickTo(value);
}

function animateWheelRotation(wheel, value) {
  const target = parseFloat(value);
  if (!Number.isFinite(target)) return;

  cancelWheelAnimation();

  const start = readWheelRotation(wheel);
  const startAt = performance.now();
  const duration = 115;

  const tick = (now) => {
    const progress = Math.min(1, (now - startAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + ((target - start) * eased);
    wheel.style.setProperty('--wheel-rotation', `${current.toFixed(3)}deg`);

    if (progress < 1) {
      chromaticWheelTween = requestAnimationFrame(tick);
      return;
    }

    chromaticWheelTween = null;
    wheel.style.setProperty('--wheel-rotation', `${target.toFixed(3)}deg`);
  };

  chromaticWheelTween = requestAnimationFrame(tick);
}

function cancelWheelAnimation() {
  if (!chromaticWheelTween) return;
  cancelAnimationFrame(chromaticWheelTween);
  chromaticWheelTween = null;
}

function readWheelRotation(wheel) {
  const inlineValue = wheel.style.getPropertyValue('--wheel-rotation');
  const parsed = parseFloat(inlineValue);
  return Number.isFinite(parsed) ? parsed : chromaticWheelRotationDeg;
}

function getWheelTargetRotation(noteIndex, { idle = false, cents = 0 } = {}) {
  if (idle) return normalizeWheelRotation(chromaticWheelRotationDeg, 0);
  const pitchClass = ((noteIndex + (cents / 100)) % 12 + 12) % 12;
  return -pitchClass * 30;
}

function ensureChromaticWheelMarkup(wheel) {
  if (chromaticWheelInitialized && wheel.children.length === NOTE_NAMES.length) return;
  wheel.innerHTML = NOTE_NAMES.map((noteName, noteIndex) => {
    const angle = noteIndex * 30;
    return `
      <span class="chromatic-tick" data-note-index="${noteIndex}" style="--note-angle:${angle}deg;">
        <span class="chromatic-tick__label" data-label="${noteName}">${noteName}</span>
      </span>
    `;
  }).join('');
  chromaticWheelInitialized = true;
  lastNearestNoteIndex = null;
}

function setNearestChromaticTick(wheel, noteIndex) {
  if (noteIndex === lastNearestNoteIndex) return;
  wheel.querySelectorAll('.chromatic-tick').forEach((tick) => {
    tick.classList.toggle('is-nearest', Number(tick.dataset.noteIndex) === noteIndex);
  });
  lastNearestNoteIndex = noteIndex;
}

function normalizeWheelRotation(currentRotation, desiredRotation) {
  if (!Number.isFinite(currentRotation)) return desiredRotation;
  let adjusted = desiredRotation;

  while (adjusted - currentRotation > 180) adjusted -= 360;
  while (adjusted - currentRotation < -180) adjusted += 360;

  return adjusted;
}

function frequencyFromNoteName(noteName) {
  const sanitized = sanitizeNoteName(noteName);
  const match = sanitized.match(/^([A-G]#?)(-?\d)$/);
  if (!match) return 440;

  const noteIndex = NOTE_NAMES.indexOf(match[1]);
  const octave = Number.parseInt(match[2], 10);
  const midi = (octave + 1) * 12 + noteIndex;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function sanitizeNoteName(noteName) {
  const text = String(noteName || '').trim().toUpperCase().replace('♯', '#').replace('♭', 'B');
  const flatMap = { DB: 'C#', EB: 'D#', GB: 'F#', AB: 'G#', BB: 'A#' };
  const match = text.match(/^([A-G](?:#|B)?)(-?\d)$/);
  if (!match) return 'A4';

  const note = flatMap[match[1]] || match[1];
  const octave = Math.max(CUSTOM_NOTE_MIN_OCTAVE, Math.min(CUSTOM_NOTE_MAX_OCTAVE, Number.parseInt(match[2], 10)));
  if (!NOTE_NAMES.includes(note)) return 'A4';
  return `${note}${octave}`;
}

function stripOctave(note) {
  return note.replace(/[0-9-]/g, '');
}



function bindUiFeedback() {
  document.addEventListener('click', (event) => {
    const control = event.target.closest('button');
    if (!control) return;

    if (control.classList.contains('string-card')) return;

    const danger = control.id === 'delete-custom' || control.dataset.action === 'delete';
    const confirm = ['save-custom'].includes(control.id) || control.dataset.action === 'duplicate' || control.dataset.action === 'rename';
    playUiFeedback(danger ? 'danger' : (confirm ? 'confirm' : 'tap'));
    pulseHaptic(danger ? 18 : 8);
  }, true);

  document.addEventListener('change', (event) => {
    if (!event.target.matches('select, input[type="checkbox"], input[type="range"]')) return;
    playUiFeedback('select');
    pulseHaptic(6);
  }, true);
}

function pulseHaptic(duration = 8) {
  if (!window.navigator?.vibrate) return;
  try { window.navigator.vibrate(duration); } catch (error) { console.debug('Haptic feedback unavailable:', error); }
}

function playUiFeedback(kind = 'tap') {
  if (document.visibilityState !== 'visible') return;

  const nowMs = performance.now();
  if (nowMs - lastUiFeedbackAt < 48) return;
  lastUiFeedbackAt = nowMs;
  suppressAnalysisUntil = nowMs + 150;

  initAudioContext().then(() => {
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const profiles = {
      tap: {
        noiseGain: 0.018,
        toneGain: 0.010,
        freq: 690,
        end: 430,
        duration: 0.045,
        filter: 1650,
        noiseFilter: 1850,
        type: 'triangle'
      },
      select: {
        noiseGain: 0.014,
        toneGain: 0.009,
        freq: 420,
        end: 520,
        duration: 0.038,
        filter: 1350,
        noiseFilter: 1450,
        type: 'triangle'
      },
      confirm: {
        noiseGain: 0.015,
        toneGain: 0.014,
        freq: 520,
        end: 780,
        duration: 0.066,
        filter: 1900,
        noiseFilter: 2200,
        type: 'sine'
      },
      danger: {
        noiseGain: 0.020,
        toneGain: 0.012,
        freq: 240,
        end: 155,
        duration: 0.070,
        filter: 900,
        noiseFilter: 820,
        type: 'triangle'
      }
    };
    const profile = profiles[kind] || profiles.tap;
    const gainScale = referenceToneActive ? 0.42 : 1;

    const master = audioContext.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(gainScale, now + 0.004);
    master.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);
    master.connect(audioContext.destination);

    const oscillator = audioContext.createOscillator();
    const toneGain = audioContext.createGain();
    const toneFilter = audioContext.createBiquadFilter();

    oscillator.type = profile.type;
    oscillator.frequency.setValueAtTime(profile.freq, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(70, profile.end), now + profile.duration);
    toneFilter.type = 'lowpass';
    toneFilter.frequency.setValueAtTime(profile.filter, now);
    toneFilter.Q.setValueAtTime(0.65, now);
    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.exponentialRampToValueAtTime(profile.toneGain, now + 0.005);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration * 0.78);

    oscillator.connect(toneFilter);
    toneFilter.connect(toneGain);
    toneGain.connect(master);

    const noiseBuffer = audioContext.createBuffer(1, Math.max(1, Math.floor(audioContext.sampleRate * profile.duration)), audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < noiseData.length; i += 1) {
      // Brown-ish noise: softer, closer to wood/felt than digital white noise.
      last = (last * 0.72) + ((Math.random() * 2 - 1) * 0.28);
      noiseData[i] = last;
    }

    const noise = audioContext.createBufferSource();
    const noiseGain = audioContext.createGain();
    const noiseFilter = audioContext.createBiquadFilter();
    noise.buffer = noiseBuffer;
    noiseFilter.type = kind === 'danger' ? 'bandpass' : 'highpass';
    noiseFilter.frequency.setValueAtTime(profile.noiseFilter, now);
    noiseFilter.Q.setValueAtTime(kind === 'confirm' ? 1.1 : 0.8, now);
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(profile.noiseGain, now + 0.003);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration * 0.58);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);

    oscillator.start(now);
    noise.start(now);
    oscillator.stop(now + profile.duration + 0.018);
    noise.stop(now + profile.duration + 0.012);

    window.setTimeout(() => {
      [oscillator, toneFilter, toneGain, noise, noiseFilter, noiseGain, master].forEach((node) => {
        try { node.disconnect(); } catch (error) { console.debug('SFX node disconnected:', error); }
      });
    }, Math.ceil((profile.duration + 0.05) * 1000));
  }).catch(() => {});
}

// Header auto-hide: fade brand out when user scrolls away from top, restore at top.
(function initHeaderScroll() {
  const SCROLL_THRESHOLD = 52;
  const header = document.querySelector('.app-header');
  if (!header) return;

  function updateHeader() {
    const atTop = (window.scrollY || document.documentElement.scrollTop) < SCROLL_THRESHOLD;
    header.classList.toggle('is-scrolled', !atTop);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}());
