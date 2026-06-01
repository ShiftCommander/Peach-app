#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4274);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const globalRows = [
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
    persisted: true
  }
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9#' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(body));
}

function searchGlobal(query) {
  const clean = normalize(query);
  if (!clean) return [];

  return globalRows.filter((row) => {
    const haystack = normalize([
      row.title,
      row.artist,
      row.displayName,
      row.version,
      row.role,
      row.tuningName,
      row.notes.join(' ')
    ].join(' '));
    return clean.split(' ').every((term) => haystack.includes(term)) || haystack.includes(clean);
  });
}

function createAiFallback(query) {
  const clean = normalize(query);
  const id = `ai-${clean.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'unknown-song'}`;
  const existing = globalRows.find((row) => row.id === id);
  if (existing) {
    return { source: 'global', result: { ...existing, source: 'global-database', generated: false } };
  }

  const title = String(query || 'Morceau inconnu').trim().replace(/\s+/g, ' ').slice(0, 80);
  const generated = {
    id,
    title,
    artist: 'Recherche IA mock',
    displayName: `${title} — Recherche IA mock`,
    version: 'Version demandée',
    role: 'Guitare',
    tuningName: 'Open D',
    notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
    confidence: 'ai-unverified',
    source: 'ai-generated',
    generated: true,
    persisted: true
  };
  globalRows.unshift(generated);
  return { source: 'ai', result: generated };
}

function handleApi(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const query = url.searchParams.get('query') || '';
  const matches = searchGlobal(query);
  if (matches.length) {
    json(response, 200, { source: 'global', results: matches.slice(0, 4) });
    return;
  }

  const fallback = createAiFallback(query);
  json(response, 200, { source: fallback.source, results: [fallback.result] });
}

function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(root, `.${requestedPath}`);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(data);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Accept, Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    });
    response.end();
    return;
  }

  if (request.url.startsWith('/api/tunings/search')) {
    handleApi(request, response);
    return;
  }

  serveStatic(request, response);
});

server.listen(port, () => {
  console.log(`Peach mock global tuning API running at http://localhost:${port}`);
});
