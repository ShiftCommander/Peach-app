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
