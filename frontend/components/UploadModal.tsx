'use client';

import { useState, FormEvent } from 'react';
import { uploadSong, ApiError } from '@/lib/api';
import { notifications } from '@mantine/notifications';
import {
  Modal,
  TextInput,
  Button,
  FileInput,
  Progress,
  Alert,
  Stack,
  Text,
} from '@mantine/core';
import { IconUpload, IconAlertCircle, IconCheck } from '@tabler/icons-react';

interface UploadModalProps {
  opened: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export default function UploadModal({
  opened,
  onClose,
  onUploadSuccess,
}: UploadModalProps) {
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

  const handleFileChange = (selectedFile: File | null) => {
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
  };

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

      notifications.show({
        title: 'Success',
        message: `"${title.trim()}" uploaded successfully`,
        color: 'green',
      });

      // Call success callback to refresh library
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      // Handle errors
      if (err instanceof ApiError) {
        if (err.code === 'DUPLICATE_SONG') {
          const errorMsg = 'This song has already been uploaded. Duplicate detected based on audio fingerprint.';
          setError(errorMsg);
          notifications.show({
            title: 'Duplicate Song',
            message: errorMsg,
            color: 'orange',
          });
        } else {
          const errorMsg = err.message || 'Failed to upload song. Please try again.';
          setError(errorMsg);
          notifications.show({
            title: 'Upload Failed',
            message: errorMsg,
            color: 'red',
          });
        }
      } else {
        const errorMsg = 'An unexpected error occurred. Please try again.';
        setError(errorMsg);
        notifications.show({
          title: 'Error',
          message: errorMsg,
          color: 'red',
        });
      }
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setTitle('');
      setArtist('');
      setFile(null);
      setError(null);
      setSuccess(false);
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text 
          fw={700} 
          size="lg"
          style={{
            background: 'linear-gradient(135deg, #011f4b 0%, #2c3e50 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Upload Song
        </Text>
      }
      size="md"
      centered
      closeOnClickOutside={!isUploading}
      closeOnEscape={!isUploading}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* File Input */}
          <FileInput
            label="Audio File"
            placeholder="Select audio file"
            accept="audio/*"
            value={file}
            onChange={handleFileChange}
            disabled={isUploading}
            leftSection={<IconUpload size={18} />}
            required
            size="md"
            description={
              file
                ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
                : 'MP3, WAV, OGG, FLAC, AAC, M4A'
            }
          />

          {/* Title Input */}
          <TextInput
            label="Song Title"
            placeholder="Enter song title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
            required
            size="md"
          />

          {/* Artist Input */}
          <TextInput
            label="Artist"
            placeholder="Enter artist name"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            disabled={isUploading}
            required
            size="md"
          />

          {/* Upload Progress */}
          {isUploading && (
            <Stack gap="xs">
              <Text size="sm" c="dimmed" fw={500}>
                Uploading... {uploadProgress}%
              </Text>
              <Progress 
                value={uploadProgress} 
                animated 
                color="blue"
                size="md"
                radius="md"
              />
            </Stack>
          )}

          {/* Error Message */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={18} />}
              title="Error"
              color="red"
              variant="light"
              radius="md"
            >
              {error}
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert
              icon={<IconCheck size={18} />}
              title="Success"
              color="green"
              variant="light"
              radius="md"
            >
              Song uploaded successfully!
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isUploading || !file}
            loading={isUploading}
            fullWidth
            leftSection={<IconUpload size={18} />}
            variant="gradient"
            gradient={{ from: 'deepBlue.7', to: 'slate.7', deg: 135 }}
            size="md"
            radius="md"
          >
            {isUploading ? 'Uploading...' : 'Upload Song'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
