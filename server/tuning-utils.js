const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_ALIASES = {
  DB: 'C#',
  EB: 'D#',
  GB: 'F#',
  AB: 'G#',
  BB: 'A#'
};

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

function slugify(value) {
  return normalizeSearchTerm(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || 'unknown';
}

function sanitizeNoteName(value) {
  const raw = String(value || '').trim().replace('♭', 'b').replace('♯', '#');
  const match = raw.match(/^([A-Ga-g])([#bB]?)(-?\d)$/);
  if (!match) return null;

  const base = match[1].toUpperCase();
  const accidental = match[2] ? match[2].replace('b', 'B').toUpperCase() : '';
  const octave = Number.parseInt(match[3], 10);
  const note = NOTE_ALIASES[`${base}${accidental}`] || `${base}${accidental}`;
  if (!NOTE_NAMES.includes(note) || !Number.isFinite(octave) || octave < 0 || octave > 8) return null;
  return `${note}${octave}`;
}

function midiFromNoteName(noteName) {
  const sanitized = sanitizeNoteName(noteName);
  if (!sanitized) return null;
  const match = sanitized.match(/^([A-G]#?)(-?\d)$/);
  const noteIndex = NOTE_NAMES.indexOf(match[1]);
  const octave = Number.parseInt(match[2], 10);
  return (octave + 1) * 12 + noteIndex;
}

function frequencyFromNoteName(noteName) {
  const midi = midiFromNoteName(noteName);
  if (midi === null) return null;
  return Number((440 * Math.pow(2, (midi - 69) / 12)).toFixed(2));
}

function stripOctave(noteName) {
  return String(noteName || '').replace(/[0-9-]/g, '');
}

function normalizeNotes(notes) {
  if (!Array.isArray(notes) || notes.length !== 6) return null;
  const normalized = notes.map(sanitizeNoteName);
  return normalized.every(Boolean) ? normalized : null;
}

function normalizeFreqs(freqs, notes) {
  if (Array.isArray(freqs) && freqs.length === 6) {
    const normalized = freqs.map((freq) => Number(Number(freq).toFixed(2)));
    if (normalized.every((freq) => Number.isFinite(freq) && freq > 20 && freq < 2000)) return normalized;
  }
  return notes.map(frequencyFromNoteName);
}

function buildDisplayName(title, artist) {
  return artist ? `${title} — ${artist}` : title;
}

function buildCanonicalKey(item) {
  return [
    item.title,
    item.artist,
    item.version || 'version demandee',
    item.role || 'guitare'
  ].map(normalizeSearchTerm).join('|');
}

function normalizeTuningRow(input, defaults = {}) {
  const notes = normalizeNotes(input?.notes);
  if (!notes) return null;

  const title = String(input.title || input.songTitle || input.displayName || defaults.title || 'Morceau inconnu')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 90);
  const artist = String(input.artist || defaults.artist || 'Artiste inconnu')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 90);
  const version = String(input.version || defaults.version || 'Version demandée')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80);
  const role = String(input.role || input.instrument || defaults.role || 'Guitare')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80);
  const tuningName = String(input.tuningName || input.tuning || notes.map(stripOctave).join(' '))
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 50);
  const displayName = String(input.displayName || buildDisplayName(title, artist))
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 120);
  const generated = Boolean(input.generated || input.aiGenerated || defaults.generated);
  const source = String(input.source || defaults.source || (generated ? 'ai-generated' : 'global-database'));

  const row = {
    id: String(input.id || `${generated ? 'ai' : 'global'}-${slugify(displayName)}-${slugify(version)}`).slice(0, 120),
    canonicalKey: String(input.canonicalKey || buildCanonicalKey({ title, artist, version, role })),
    title,
    artist,
    displayName,
    version,
    role,
    tuningName,
    notes,
    freqs: normalizeFreqs(input.freqs, notes),
    aliases: Array.isArray(input.aliases) ? input.aliases.map(String).slice(0, 12) : [],
    confidence: String(input.confidence || (generated ? 'ai-unverified' : 'confirmed')).slice(0, 40),
    source,
    generated,
    persisted: input.persisted !== false,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString()
  };

  return row;
}

function toPublicTuning(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    displayName: row.displayName,
    version: row.version,
    role: row.role,
    tuningName: row.tuningName,
    notes: row.notes,
    freqs: row.freqs,
    aliases: row.aliases || [],
    confidence: row.confidence,
    source: row.source,
    generated: Boolean(row.generated),
    persisted: row.persisted !== false
  };
}

module.exports = {
  buildCanonicalKey,
  frequencyFromNoteName,
  normalizeSearchTerm,
  normalizeTuningRow,
  slugify,
  stripOctave,
  toPublicTuning
};
