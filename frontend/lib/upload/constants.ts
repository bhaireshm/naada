// Extracted upload constants following DRY principle
export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
] as const;

export const UPLOAD_VALIDATION_MESSAGES = {
  noFile: 'Please select an audio file to upload.',
  noTitle: 'Please enter a song title.',
  noArtist: 'Please enter an artist name.',
  invalidType: 'Invalid file type. Please upload an audio file (MP3, WAV, OGG, FLAC, AAC, M4A).',
  duplicate: 'This song has already been uploaded. Duplicate detected based on audio fingerprint.',
  uploadFailed: 'Failed to upload song. Please try again.',
  unexpectedError: 'An unexpected error occurred. Please try again.',
} as const;