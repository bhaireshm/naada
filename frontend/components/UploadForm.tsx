'use client';

import { useState, FormEvent } from 'react';
import { uploadSong, ApiError } from '@/lib/api';
import { Stack, TextInput, FileInput, Button, Progress, Alert, Text } from '@mantine/core';
import { IconUpload, IconCheck, IconAlertCircle } from '@tabler/icons-react';

interface UploadFormProps {
  onUploadSuccess?: () => void;
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Supported audio MIME types
  const SUPPORTED_AUDIO_TYPES = [
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
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate form
    if (!file) {
      setError('Please select an audio file to upload.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a song title.');
      return;
    }

    if (!artist.trim()) {
      setError('Please enter an artist name.');
      return;
    }

    // Start upload
    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadSong(file, title.trim(), artist.trim(), (progress) => {
        setUploadProgress(Math.round(progress));
      });

      // Upload successful
      setSuccess(true);
      setTitle('');
      setArtist('');
      setFile(null);
      setUploadProgress(0);

      // Call success callback to refresh library
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      // Handle errors
      if (err instanceof ApiError) {
        if (err.code === 'DUPLICATE_SONG') {
          setError(
            'This song has already been uploaded. Duplicate detected based on audio fingerprint.'
          );
        } else {
          setError(err.message || 'Failed to upload song. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {/* File Input */}
        <FileInput
          label="Audio File *"
          placeholder="Select audio file"
          accept="audio/*"
          value={file}
          onChange={(selectedFile) => {
            setError(null);
            setSuccess(false);

            if (!selectedFile) {
              setFile(null);
              return;
            }

            // Validate file type
            if (!SUPPORTED_AUDIO_TYPES.includes(selectedFile.type)) {
              setError(
                'Invalid file type. Please upload an audio file (MP3, WAV, OGG, FLAC, AAC, M4A).'
              );
              setFile(null);
              return;
            }

            setFile(selectedFile);
          }}
          disabled={isUploading}
          leftSection={<IconUpload size={16} />}
          description={
            file
              ? `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
              : undefined
          }
        />

        {/* Title Input */}
        <TextInput
          label="Song Title *"
          placeholder="Enter song title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isUploading}
          required
        />

        {/* Artist Input */}
        <TextInput
          label="Artist *"
          placeholder="Enter artist name"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          disabled={isUploading}
          required
        />

        {/* Upload Progress Bar */}
        {isUploading && (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Uploading... {uploadProgress}%
            </Text>
            <Progress value={uploadProgress} animated />
          </Stack>
        )}

        {/* Error Message */}
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {/* Success Message */}
        {success && (
          <Alert icon={<IconCheck size={16} />} title="Success" color="green">
            Song uploaded successfully!
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isUploading || !file}
          fullWidth
          leftSection={isUploading ? undefined : <IconUpload size={16} />}
          loading={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Song'}
        </Button>
      </Stack>
    </form>
  );
}
