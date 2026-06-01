const fs = require('fs');
const path = require('path');
const { normalizeSearchTerm, normalizeTuningRow, toPublicTuning } = require('./tuning-utils');

const DEFAULT_SEED_ROWS = [
  {
    id: 'global-black-hole-sun-soundgarden-studio',
    title: 'Black Hole Sun',
    artist: 'Soundgarden',
    displayName: 'Black Hole Sun — Soundgarden',
    version: 'Version studio',
    role: 'Guitare',
    tuningName: 'Drop D',
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    confidence: 'confirmed',
    source: 'global-database',
    generated: false,
    persisted: true,
    aliases: ['black hole sun', 'soundgarden', 'chris cornell']
  }
];

function createJsonTuningStore({ filePath, seedRows = DEFAULT_SEED_ROWS } = {}) {
  const dbPath = filePath || path.resolve(process.cwd(), '.peach-global-tunings.json');

  function ensureDirectory() {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  function readRows() {
    ensureDirectory();
    if (!fs.existsSync(dbPath)) {
      const initialRows = seedRows.map((row) => normalizeTuningRow(row)).filter(Boolean);
      writeRows(initialRows);
      return initialRows;
    }

    const raw = fs.readFileSync(dbPath, 'utf8');
    const parsed = raw.trim() ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((row) => normalizeTuningRow(row)).filter(Boolean) : [];
  }

  function writeRows(rows) {
    ensureDirectory();
    const tmpPath = `${dbPath}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, `${JSON.stringify(rows, null, 2)}\n`);
    fs.renameSync(tmpPath, dbPath);
  }

  function search(query, { limit = 4 } = {}) {
    return searchRows(readRows(), query, { limit });
  }

  function upsert(input) {
    const rows = readRows();
    const result = upsertRow(rows, input);
    if (!result) return null;
    writeRows(result.rows);
    return result.publicRow;
  }

  return {
    path: dbPath,
    readRows,
    search,
    upsert
  };
}

function normalizeRows(rows = []) {
  return Array.isArray(rows) ? rows.map((row) => normalizeTuningRow(row)).filter(Boolean) : [];
}

function seedRows(rows = DEFAULT_SEED_ROWS) {
  return normalizeRows(rows);
}

function searchRows(rows, query, { limit = 4 } = {}) {
  const clean = normalizeSearchTerm(query);
  if (!clean) return [];
  const terms = clean.split(' ').filter(Boolean);

  return normalizeRows(rows)
    .map((row) => {
      const haystack = normalizeSearchTerm([
        row.title,
        row.artist,
        row.displayName,
        row.version,
        row.role,
        row.tuningName,
        row.notes.join(' '),
        ...(row.aliases || [])
      ].join(' '));
      const exact = haystack.includes(clean);
      const matchedTerms = terms.filter((term) => haystack.includes(term)).length;
      const fullTermMatch = terms.length < 2 || matchedTerms === terms.length;
      const score = (exact ? 20 : 0) + (fullTermMatch ? matchedTerms * 4 : 0) + (row.generated ? 0 : 2);
      return { row, score };
    })
    .filter((item) => item.score > 0 && (terms.length < 2 || item.score >= terms.length * 4))
    .sort((a, b) => b.score - a.score || a.row.displayName.localeCompare(b.row.displayName))
    .slice(0, limit)
    .map((item) => toPublicTuning(item.row));
}

function upsertRow(rows, input) {
  const row = normalizeTuningRow(input);
  if (!row) return null;

  const nextRows = normalizeRows(rows);
  const index = nextRows.findIndex((item) => item.canonicalKey === row.canonicalKey || item.id === row.id);
  const now = new Date().toISOString();

  if (index === -1) {
    nextRows.unshift({ ...row, createdAt: row.createdAt || now, updatedAt: now, persisted: true });
    return { rows: nextRows, publicRow: toPublicTuning(nextRows[0]) };
  }

  nextRows[index] = {
    ...nextRows[index],
    ...row,
    id: nextRows[index].id,
    canonicalKey: nextRows[index].canonicalKey,
    createdAt: nextRows[index].createdAt,
    updatedAt: now,
    persisted: true
  };

  return { rows: nextRows, publicRow: toPublicTuning(nextRows[index]) };
}

module.exports = {
  DEFAULT_SEED_ROWS,
  createJsonTuningStore,
  normalizeRows,
  searchRows,
  seedRows,
  upsertRow
};
