# Process Existing Songs with AI Metadata

This guide explains how to add AI metadata (mood, energy, aiGenres) to songs that were uploaded before the AI feature was implemented.

## Method 1: Using the API Endpoint (Recommended)

### Step 1: Check Current Status

First, check how many songs need processing:

```bash
curl -X GET http://localhost:3000/songs/ai-metadata-status \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response:**
```json
{
  "total": 50,
  "withAIMetadata": 5,
  "withoutAIMetadata": 45,
  "breakdown": {
    "withMood": 5,
    "withAIGenres": 5,
    "withEnergy": 5
  },
  "percentageComplete": 10
}
```

### Step 2: Process All Songs

Process all songs that don't have AI metadata:

```bash
curl -X POST http://localhost:3000/songs/process-ai-metadata \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"processAll": true}'
```

**Response:**
```json
{
  "message": "AI metadata processing completed",
  "total": 45,
  "processed": 43,
  "failed": 2,
  "results": [
    {
      "id": "song_id_1",
      "title": "Summer Vibes",
      "status": "success"
    },
    ...
  ]
}
```

### Step 3: Process Specific Songs

If you want to process only specific songs:

```bash
curl -X POST http://localhost:3000/songs/process-ai-metadata \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "songIds": ["song_id_1", "song_id_2", "song_id_3"]
  }'
```

## Method 2: Using Postman or Thunder Client

### 1. Check Status
- **Method:** GET
- **URL:** `http://localhost:3000/songs/ai-metadata-status`
- **Headers:** 
  - `Authorization: Bearer YOUR_AUTH_TOKEN`

### 2. Process All Songs
- **Method:** POST
- **URL:** `http://localhost:3000/songs/process-ai-metadata`
- **Headers:** 
  - `Authorization: Bearer YOUR_AUTH_TOKEN`
  - `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "processAll": true
  }
  ```

### 3. Process Specific Songs
- **Method:** POST
- **URL:** `http://localhost:3000/songs/process-ai-metadata`
- **Headers:** 
  - `Authorization: Bearer YOUR_AUTH_TOKEN`
  - `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "songIds": ["song_id_1", "song_id_2"]
  }
  ```

## Method 3: Using the Browser Console

If you're logged into the app, you can run this in the browser console:

```javascript
// Check status
fetch('http://localhost:3000/songs/ai-metadata-status', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => res.json())
.then(data => console.log('Status:', data));

// Process all songs
fetch('http://localhost:3000/songs/process-ai-metadata', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ processAll: true })
})
.then(res => res.json())
.then(data => console.log('Processing result:', data));
```

## How It Works

1. **Batch Processing**: Songs are processed in batches of 10 to avoid memory issues
2. **Non-Destructive**: Only adds AI metadata, doesn't modify existing data
3. **Resilient**: If one song fails, others continue processing
4. **Progress Tracking**: Returns detailed results for each song

## What Gets Added

For each song, the system extracts:

- **`mood`**: e.g., "energetic", "calm", "happy", "melancholic"
- **`aiGenres`**: e.g., ["Electronic", "Dance"]
- **`energy`**: 0.0 to 1.0 (0 = very calm, 1 = very energetic)

## Performance Notes

- **Processing Time**: ~1-2 seconds per song
- **Batch Size**: 10 songs at a time
- **Memory Usage**: Moderate (downloads and analyzes audio files)
- **Recommended**: Process during off-peak hours for large libraries

## Example: Processing 100 Songs

```bash
# This will take approximately 2-3 minutes
curl -X POST http://localhost:3000/songs/process-ai-metadata \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"processAll": true}'
```

## Troubleshooting

### "No songs to process"
- All your songs already have AI metadata!
- Check status with `/ai-metadata-status` endpoint

### Some songs failed
- Check the `results` array in the response
- Failed songs will have `status: "failed"` and an error message
- Common causes: corrupted files, unsupported formats

### Timeout errors
- Process songs in smaller batches
- Use `songIds` array to process specific songs

## After Processing

Once processing is complete:
1. Refresh your music library
2. Songs will now have mood, energy, and AI genres
3. You can use these for filtering and smart playlists
4. Future uploads will automatically get AI metadata

## Next Steps

Consider creating UI features to:
- Filter songs by mood
- Create energy-based playlists
- Display AI metadata in song details
- Smart recommendations based on mood/energy
