import { getDeployStore, getStore } from '@netlify/blobs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createAiLookup } = require('../../server/ai-lookup');
const {
  DEFAULT_SEED_ROWS,
  searchRows,
  seedRows,
  upsertRow
} = require('../../server/tuning-store');

const STORE_NAME = 'peach-global-tunings';
const ROWS_KEY = 'rows';

export default async (req, context) => {
  if (req.method === 'OPTIONS') return emptyResponse(204);
  if (req.method !== 'GET') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const url = new URL(req.url);
  const query = String(url.searchParams.get('query') || '').trim();
  if (query.length < 2) return jsonResponse({ error: 'query_too_short' }, 400);

  const rateLimit = checkRateLimit(context);
  if (!rateLimit.allowed) {
    return jsonResponse({
      error: 'rate_limited',
      retryAfterSeconds: Math.ceil(rateLimit.retryAfterMs / 1000)
    }, 429);
  }

  const store = getBlobStore(context);
  const rows = await readRows(store);
  const existing = searchRows(rows, query);
  if (existing.length) return jsonResponse({ source: 'global', results: existing });

  const lookupAi = createAiLookup({
    mode: env('PEACH_AI_MODE'),
    openaiApiKey: env('OPENAI_API_KEY'),
    openaiModel: env('OPENAI_MODEL')
  });
  const generated = await lookupAi(query);
  const result = upsertRow(rows, generated);
  if (!result) return jsonResponse({ error: 'invalid_generated_tuning' }, 502);

  await store.setJSON(ROWS_KEY, result.rows);
  return jsonResponse({ source: 'ai', results: [result.publicRow] });
};

export const config = {
  path: '/api/tunings/search'
};

async function readRows(store) {
  const rows = await store.get(ROWS_KEY, { type: 'json' });
  if (Array.isArray(rows)) return rows;
  const seeded = seedRows(DEFAULT_SEED_ROWS);
  await store.setJSON(ROWS_KEY, seeded);
  return seeded;
}

function getBlobStore(context) {
  const deployContext = globalThis.Netlify?.context?.deploy?.context || context?.deploy?.context || '';
  if (deployContext === 'production') return getStore(STORE_NAME, { consistency: 'strong' });
  return getDeployStore(STORE_NAME, { consistency: 'strong' });
}

function env(name) {
  return globalThis.Netlify?.env?.get(name) || '';
}

function checkRateLimit(context) {
  const limit = Number(env('PEACH_RATE_LIMIT') || 60);
  const windowMs = Number(env('PEACH_RATE_LIMIT_WINDOW_MS') || 60_000);
  const ip = context?.ip || 'unknown';
  const key = `peach-rate-limit:${ip}`;
  const now = Date.now();
  const state = globalThis[key] || { count: 0, resetAt: now + windowMs };

  if (now > state.resetAt) {
    state.count = 0;
    state.resetAt = now + windowMs;
  }

  state.count += 1;
  globalThis[key] = state;

  return {
    allowed: state.count <= limit,
    retryAfterMs: Math.max(0, state.resetAt - now)
  };
}

function emptyResponse(status) {
  return new Response(null, { status, headers: corsHeaders() });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store'
  };
}
