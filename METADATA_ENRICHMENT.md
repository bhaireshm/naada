# Metadata Enrichment Service

This service allows you to fetch high-quality metadata from online sources (MusicBrainz & Cover Art Archive) to enrich your local music library.

## Features

- **Auto-Correction**: Fixes typos in Title and Artist names.
- **Album Info**: Fetches official Album name and Release Year.
- **Cover Art**: Downloads high-resolution album art.
- **Genres**: Adds popular tags/genres from MusicBrainz.

## API Endpoint

### Enrich a Song

**POST** `/songs/:id/enrich`

**Headers:**
- `Authorization`: `Bearer <token>`

**Body (Optional):**
```json
{
  "forceUpdate": true
}
```
* `forceUpdate`: If `true`, overwrites existing metadata even if it's already present. Default is `false` (only fills missing fields).

**Response:**
```json
{
  "message": "Metadata enriched successfully",
  "enrichedFields": {
    "title": "Billie Jean",
    "artist": "Michael Jackson",
    "album": "Thriller",
    "year": "1982",
    "genres": ["pop", "funk", "soul"],
    "coverArtUrl": "http://coverartarchive.org/release/..."
  },
  "song": { ...updated song object... }
}
```

## How to Use

### 1. Enrich a Single Song (Curl)

```bash
curl -X POST http://localhost:3001/songs/YOUR_SONG_ID/enrich \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"forceUpdate": false}'
```

### 2. Enrich via Browser Console

```javascript
const songId = "YOUR_SONG_ID";
fetch(`http://localhost:3001/songs/${songId}/enrich`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ forceUpdate: false })
})
.then(res => res.json())
.then(data => console.log('Enrichment Result:', data));
```

## Implementation Details

- **Source**: MusicBrainz API (Free, Open Source)
- **Rate Limiting**: The service respects MusicBrainz's rate limits.
- **Matching**: Uses strict Title + Artist matching to ensure accuracy.
