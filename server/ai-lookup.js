const { normalizeTuningRow, slugify } = require('./tuning-utils');

const OPENAI_TUNING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'artist', 'version', 'role', 'tuningName', 'notes', 'confidence'],
  properties: {
    title: { type: 'string' },
    artist: { type: 'string' },
    version: { type: 'string' },
    role: { type: 'string' },
    tuningName: { type: 'string' },
    notes: {
      type: 'array',
      items: { type: 'string' }
    },
    confidence: {
      type: 'string',
      enum: ['confirmed', 'likely', 'ai-unverified', 'unknown']
    }
  }
};

function createAiLookup(options = {}) {
  const mode = options.mode || (options.openaiApiKey || process.env.OPENAI_API_KEY ? 'openai' : 'mock');
  if (mode === 'openai') return createOpenAiLookup(options);
  return createMockAiLookup();
}

function createMockAiLookup() {
  return async function mockAiLookup(query) {
    const title = String(query || 'Morceau inconnu').trim().replace(/\s+/g, ' ').slice(0, 80);
    return normalizeTuningRow({
      id: `ai-${slugify(title)}`,
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
    });
  };
}

function createOpenAiLookup(options = {}) {
  const apiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
  const model = options.openaiModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!apiKey) throw new Error('OPENAI_API_KEY is required for OpenAI tuning lookup');

  return async function openAiLookup(query) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        instructions: [
          'You identify guitar tunings for a requested song/version.',
          'Return only the most likely six-string guitar tuning.',
          'Use scientific pitch notation from low string to high string.',
          'If uncertain, provide the common/likely tuning and set confidence to ai-unverified.'
        ].join(' '),
        input: `Song/version requested by the user: ${query}`,
        text: {
          format: {
            type: 'json_schema',
            name: 'peach_tuning_lookup',
            strict: true,
            schema: OPENAI_TUNING_SCHEMA
          }
        }
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`OpenAI tuning lookup failed: ${response.status} ${body.slice(0, 200)}`);
    }

    const payload = await response.json();
    const content = extractResponseText(payload);
    const parsed = JSON.parse(content);
    return normalizeTuningRow({
      ...parsed,
      id: `ai-${slugify(`${parsed.title} ${parsed.artist} ${parsed.version}`)}`,
      displayName: parsed.artist ? `${parsed.title} — ${parsed.artist}` : parsed.title,
      source: 'ai-generated',
      generated: true,
      persisted: true
    });
  };
}

function extractResponseText(payload) {
  if (typeof payload.output_text === 'string') return payload.output_text;
  const content = payload.output
    ?.flatMap((item) => item.content || [])
    ?.find((item) => typeof item.text === 'string');
  if (content?.text) return content.text;
  throw new Error('OpenAI response did not include output text');
}

module.exports = {
  createAiLookup,
  createMockAiLookup,
  createOpenAiLookup
};
