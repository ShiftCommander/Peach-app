const http = require('http');
const fs = require('fs');
const path = require('path');
const { createAiLookup } = require('./ai-lookup');
const { createJsonTuningStore } = require('./tuning-store');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function createTuningApiServer(options = {}) {
  const root = options.root || path.resolve(__dirname, '..');
  const store = options.store || createJsonTuningStore({ filePath: options.dbPath });
  const lookupAi = options.lookupAi || createAiLookup({
    ...options,
    mode: options.aiMode || options.mode
  });
  const enableStatic = options.enableStatic !== false;
  const publicApiUrl = options.publicApiUrl || process.env.PEACH_PUBLIC_GLOBAL_TUNING_API_URL || '/api/tunings/search';
  const rateLimit = createRateLimit({
    limit: Number(options.rateLimit || process.env.PEACH_RATE_LIMIT || 60),
    windowMs: Number(options.rateLimitWindowMs || process.env.PEACH_RATE_LIMIT_WINDOW_MS || 60_000)
  });

  async function handleApi(request, response) {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const query = String(url.searchParams.get('query') || '').trim();

    if (request.method !== 'GET') {
      sendJson(response, 405, { error: 'method_not_allowed' });
      return;
    }

    const limitState = rateLimit(request);
    if (!limitState.allowed) {
      sendJson(response, 429, {
        error: 'rate_limited',
        retryAfterSeconds: Math.ceil(limitState.retryAfterMs / 1000)
      });
      return;
    }

    if (query.length < 2) {
      sendJson(response, 400, { error: 'query_too_short' });
      return;
    }

    const existing = store.search(query);
    if (existing.length) {
      sendJson(response, 200, { source: 'global', results: existing });
      return;
    }

    const generated = await lookupAi(query);
    const persisted = store.upsert(generated);
    sendJson(response, 200, { source: 'ai', results: [persisted] });
  }

  function handleStatic(request, response) {
    if (!enableStatic) {
      sendJson(response, 404, { error: 'not_found' });
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);
    const requestedPath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.resolve(root, `.${requestedPath}`);

    if (!filePath.startsWith(root)) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
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
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      response.end(data);
    });
  }

  const server = http.createServer((request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders());
      response.end();
      return;
    }

    if (request.url.startsWith('/api/health')) {
      sendJson(response, 200, { ok: true, service: 'peach-global-tuning-api' });
      return;
    }

    if (request.url.startsWith('/api/tunings/search')) {
      handleApi(request, response).catch((error) => {
        console.error(error);
        sendJson(response, 500, { error: 'tuning_lookup_failed' });
      });
      return;
    }

    if (request.url.startsWith('/config.js')) {
      sendJavaScript(response, buildRuntimeConfig(publicApiUrl));
      return;
    }

    handleStatic(request, response);
  });

  return { server, store };
}

function createRateLimit({ limit, windowMs }) {
  const hits = new Map();
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 60;
  const safeWindowMs = Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000;

  return function checkRateLimit(request) {
    const ip = request.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || request.socket.remoteAddress
      || 'unknown';
    const now = Date.now();
    const state = hits.get(ip) || { count: 0, resetAt: now + safeWindowMs };

    if (now > state.resetAt) {
      state.count = 0;
      state.resetAt = now + safeWindowMs;
    }

    state.count += 1;
    hits.set(ip, state);

    return {
      allowed: state.count <= safeLimit,
      retryAfterMs: Math.max(0, state.resetAt - now)
    };
  };
}

function buildRuntimeConfig(publicApiUrl) {
  const safeUrl = JSON.stringify(String(publicApiUrl || ''));
  return [
    'window.PEACH_CONFIG = window.PEACH_CONFIG || {};',
    `window.PEACH_CONFIG.globalTuningApiUrl = ${safeUrl};`,
    'window.PEACH_GLOBAL_TUNING_API_URL = window.PEACH_GLOBAL_TUNING_API_URL || window.PEACH_CONFIG.globalTuningApiUrl || "";'
  ].join('\n');
}

function sendJavaScript(response, body) {
  response.writeHead(200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(`${body}\n`);
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store'
  };
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    ...corsHeaders(),
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(JSON.stringify(body));
}

module.exports = {
  buildRuntimeConfig,
  createTuningApiServer
};
