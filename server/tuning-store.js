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
    const clean = normalizeSearchTerm(query);
    if (!clean) return [];
    const terms = clean.split(' ').filter(Boolean);

    return readRows()
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
        const score = (exact ? 20 : 0) + matchedTerms * 4 + (row.generated ? 0 : 2);
        return { row, score };
      })
      .filter((item) => item.score > 0 && (terms.length < 2 || item.score >= 8))
      .sort((a, b) => b.score - a.score || a.row.displayName.localeCompare(b.row.displayName))
      .slice(0, limit)
      .map((item) => toPublicTuning(item.row));
  }

  function upsert(input) {
    const row = normalizeTuningRow(input);
    if (!row) return null;

    const rows = readRows();
    const index = rows.findIndex((item) => item.canonicalKey === row.canonicalKey || item.id === row.id);
    const now = new Date().toISOString();

    if (index === -1) {
      rows.unshift({ ...row, createdAt: row.createdAt || now, updatedAt: now, persisted: true });
    } else {
      rows[index] = {
        ...rows[index],
        ...row,
        id: rows[index].id,
        canonicalKey: rows[index].canonicalKey,
        createdAt: rows[index].createdAt,
        updatedAt: now,
        persisted: true
      };
    }

    writeRows(rows);
    return toPublicTuning(index === -1 ? rows[0] : rows[index]);
  }

  return {
    path: dbPath,
    readRows,
    search,
    upsert
  };
}

module.exports = {
  DEFAULT_SEED_ROWS,
  createJsonTuningStore
};
