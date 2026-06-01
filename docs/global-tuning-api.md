# Peach Global Tuning API

Peach remains a static PWA on GitHub Pages. Shared tuning search therefore needs a backend API because browsers cannot safely write to a global database from a static site.

The app calls the global API only when the embedded song tuning library has no match. The backend owns the expensive and sensitive work:

1. Search the shared tuning database.
2. If no trusted match exists, perform the AI lookup.
3. Validate and normalize the six-string tuning.
4. Persist the generated result in the shared database.
5. Return the stored result so future users avoid the AI lookup.

## Frontend Configuration

By default, the production GitHub Pages build does not call a global API.

For development or a future backend deployment, set either:

```js
window.PEACH_GLOBAL_TUNING_API_URL = 'https://example.com/api/tunings/search';
```

or store the endpoint in local storage:

```js
localStorage.setItem('peach-global-tuning-api-url-v1', 'http://localhost:4274/api/tunings/search');
```

## Request

```http
GET /api/tunings/search?query=iris%20goo%20goo%20dolls
Accept: application/json
```

## Response

```json
{
  "source": "global",
  "results": [
    {
      "id": "iris-goo-goo-dolls-studio",
      "title": "Iris",
      "artist": "The Goo Goo Dolls",
      "displayName": "Iris — The Goo Goo Dolls",
      "version": "Version studio",
      "role": "Guitare principale",
      "tuningName": "BDDDDD",
      "notes": ["B1", "D3", "D3", "D3", "D4", "D4"],
      "freqs": [61.74, 146.83, 146.83, 146.83, 293.66, 293.66],
      "confidence": "confirmed",
      "source": "global-database",
      "generated": false,
      "persisted": true
    }
  ]
}
```

When the backend falls back to AI, it should return the persisted generated row:

```json
{
  "source": "ai",
  "results": [
    {
      "id": "rare-song-artist-studio",
      "title": "Rare Song",
      "artist": "Artist",
      "displayName": "Rare Song — Artist",
      "version": "Version demandée",
      "role": "Guitare",
      "tuningName": "Open D",
      "notes": ["D2", "A2", "D3", "F#3", "A3", "D4"],
      "confidence": "ai-unverified",
      "source": "ai-generated",
      "generated": true,
      "persisted": true
    }
  ]
}
```

## Backend Requirements

- Never expose AI provider keys to the browser.
- Rate-limit requests by IP/session.
- Normalize song title, artist, version, instrument, notes and frequencies before inserting.
- Store a canonical search key to prevent duplicates for the same song/version/instrument.
- Keep `generated` and `confidence` fields so UI and moderation can distinguish AI suggestions from confirmed data.
- Allow later human correction without losing original source metadata.

## Local Backend MVP

The repository includes a plain Node.js backend MVP:

- `server/tuning-api.js` - HTTP API and optional static file serving.
- `server/tuning-store.js` - JSON-backed persistent tuning store.
- `server/ai-lookup.js` - mock AI lookup plus optional OpenAI adapter.
- `server/start.js` - production entrypoint.
- `dev/global-tuning-api-mock.js` - local dev launcher.
- `tests/global-tuning-api.test.js` - regression test for global search, AI fallback and persistence.

Start the local backend:

```sh
node dev/global-tuning-api-mock.js
```

By default it runs on `http://localhost:4274`, serves the static app, and persists generated rows to `.tmp/global-tunings-dev.json`.

Configure the frontend once in DevTools:

```js
localStorage.setItem('peach-global-tuning-api-url-v1', '/api/tunings/search')
```

Then:

- Search `Black Hole Sun` to verify a seeded global database hit.
- Search any unknown song to trigger the mock AI fallback.
- Search the same unknown song again to verify the result is now served from the global store.

Run the backend test:

```sh
node --test tests/global-tuning-api.test.js
```

## Optional OpenAI Mode

The backend can use the OpenAI adapter instead of mock mode:

```sh
PEACH_AI_MODE=openai \
OPENAI_API_KEY=... \
OPENAI_MODEL=gpt-4o-mini \
node dev/global-tuning-api-mock.js
```

The API key stays server-side. The browser only calls Peach's `/api/tunings/search` endpoint.

The OpenAI adapter uses the Responses API with Structured Outputs (`text.format` with `type: "json_schema"`), following OpenAI's Structured Outputs documentation:

```text
https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses
```

The returned payload is still validated by Peach before it is inserted, including the requirement that exactly six notes are present.

## Deployable Runtime

The backend can be deployed as a plain Node process or container.

```sh
npm start
```

or:

```sh
docker build -t peach-global-tuning-api .
docker run -p 8080:8080 -v peach-tunings:/data peach-global-tuning-api
```

Healthcheck:

```http
GET /api/health
```

Runtime config:

```http
GET /config.js
```

When the backend serves the static app, `/config.js` is generated from `PEACH_PUBLIC_GLOBAL_TUNING_API_URL` and defaults to `/api/tunings/search`.

When the app stays on GitHub Pages, edit the static `config.js` or set `window.PEACH_GLOBAL_TUNING_API_URL` before `app.js` loads.
