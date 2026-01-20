// Extracted upload form logic following SRP
import { useState, FormEvent } from 'react';
import { uploadSong, ApiError } from '@/lib/api';
import { SUPPORTED_AUDIO_TYPES, UPLOAD_VALIDATION_MESSAGES } from '@/lib/upload/constants';

interface UseUploadFormProps {
  onUploadSuccess?: () => void;
}

export function useUploadForm({ onUploadSuccess }: UseUploadFormProps = {}) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = (): string | null => {
    if (!file) return UPLOAD_VALIDATION_MESSAGES.noFile;
    if (!title.trim()) return UPLOAD_VALIDATION_MESSAGES.noTitle;
    if (!artist.trim()) return UPLOAD_VALIDATION_MESSAGES.noArtist;
    return null;
  };

  const validateFile = (selectedFile: File): string | null => {
    if (!SUPPORTED_AUDIO_TYPES.includes(selectedFile.type as any)) {
      return UPLOAD_VALIDATION_MESSAGES.invalidType;
    }
    return null;
  };

  const handleFileChange = (selectedFile: File | null) => {
    setError(null);
    setSuccess(false);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setFile(null);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadSong(file!, title.trim(), artist.trim(), (progress) => {
        setUploadProgress(Math.round(progress));
      });

      setSuccess(true);
      resetForm();
      onUploadSuccess?.();
    } catch (err) {
      handleUploadError(err);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.code === 'DUPLICATE_SONG') {
        setError(UPLOAD_VALIDATION_MESSAGES.duplicate);
      } else {
        setError(err.message || UPLOAD_VALIDATION_MESSAGES.uploadFailed);
      }
    } else {
      setError(UPLOAD_VALIDATION_MESSAGES.unexpectedError);
    }
  };

  return {
    // State
    title,
    artist,
    file,
    uploadProgress,
    isUploading,
    error,
    success,
    
    // Actions
    setTitle,
    setArtist,
    handleFileChange,
    handleSubmit,
    resetForm,
  };
}