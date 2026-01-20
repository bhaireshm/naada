'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
import { UploadQueueManager, UploadFile, UploadQueueStats } from '@/lib/upload/uploadQueue';
import { uploadFileWithRetry } from '@/lib/upload/uploadWorker';
import { saveUploadState } from '@/lib/upload/uploadPersistence';
import { validateFiles, extractMetadataFromFilename } from '@/lib/upload/fileValidation';
import { notifications } from '@mantine/notifications';

interface UploadContextType {
    files: UploadFile[];
    isUploading: boolean;
    isPaused: boolean;
    stats: UploadQueueStats;
    addFiles: (files: File[]) => void;
    removeFile: (id: string) => void;
    retryFile: (id: string) => void;
    retryAllFailed: () => void;
    updateFileMetadata: (id: string, metadata: { title?: string; artist?: string; album?: string }) => void;
    startUpload: () => void;
    pauseUpload: () => void;
    resumeUpload: () => void;
    clearCompleted: () => void;
    clearAll: () => void;
}

const UploadContext = createContext<UploadContextType | null>(null);

export function useUpload() {
    const context = useContext(UploadContext);
    if (!context) {
        throw new Error('useUpload must be used within an UploadProvider');
    }
    return context;
}

export function UploadProvider({ children }: { children: ReactNode }) {
    const [queueManager] = useState(() => new UploadQueueManager(10)); // Increased concurrency as per user pref
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const uploadingRef = useRef(false);

    // Subscribe to queue changes
    useEffect(() => {
        const unsubscribe = queueManager.subscribe((state) => {
            setFiles(state.files);
            setIsPaused(state.isPaused);
            saveUploadState(state.files);
        });
        return unsubscribe;
    }, [queueManager]);

    // Process queue loop
    const processQueue = useCallback(async () => {
        if (uploadingRef.current) return;
        uploadingRef.current = true;
        setIsUploading(true);

        while (true) {
            const nextFile = queueManager.getNextFile();

            if (!nextFile) {
                if (queueManager.isComplete()) {
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 100));
                continue;
            }

            queueManager.updateFileStatus(nextFile.id, 'uploading');
            queueManager.incrementActiveUploads();

            // Fire and forget - handled by callbacks
            uploadFileWithRetry({
                file: nextFile.file,
                title: nextFile.title,
                artist: nextFile.artist,
                album: nextFile.album,
                onProgress: (progress) => {
                    queueManager.updateFileProgress(nextFile.id, progress);
                },
            })
                .then((result) => {
                    if (result.success) {
                        queueManager.updateFileStatus(nextFile.id, 'complete');
                    } else {
                        queueManager.updateFileStatus(nextFile.id, 'failed', result.error);
                    }
                })
                .finally(() => {
                    queueManager.decrementActiveUploads();
                });
        }

        uploadingRef.current = false;
        setIsUploading(false);

        // Notifications handled by the Page or Global listener if needed
        // For now, we just keep state updated
    }, [queueManager]);

    // Auto-start if pending and not uploading
    useEffect(() => {
        const stats = queueManager.getStats();
        if (stats.pending > 0 && !isUploading && !uploadingRef.current && !isPaused) {
            const timer = setTimeout(() => {
                processQueue();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [files.length, isPaused, isUploading, processQueue, queueManager]);

    const addFiles = useCallback((newFiles: File[]) => {
        const { valid, invalid } = validateFiles(newFiles);

        if (invalid.length > 0) {
            // We can notify about invalid files here or let the UI handle it via a return value if we changed the signature
            // For now, let's just show a notification for invalid ones
            notifications.show({
                title: 'Some files were rejected',
                message: `${invalid.length} files were invalid. Check format and size.`,
                color: 'red',
            });
        }

        if (valid.length > 0) {
            const uploadFiles: UploadFile[] = valid.map((file) => {
                const metadata = extractMetadataFromFilename(file.name);
                return {
                    id: `${file.name}-${Date.now()}-${Math.random()}`,
                    file,
                    title: metadata.title,
                    artist: metadata.artist,
                    album: metadata.album,
                    status: 'pending' as const,
                    progress: 0,
                };
            });
            queueManager.addFiles(uploadFiles);
        }
    }, [queueManager]);

    const removeFile = useCallback((id: string) => {
        queueManager.removeFile(id);
    }, [queueManager]);

    const retryFile = useCallback((id: string) => {
        queueManager.retryFile(id);
        processQueue();
    }, [queueManager, processQueue]);

    const retryAllFailed = useCallback(() => {
        queueManager.retryAll();
        processQueue();
    }, [queueManager, processQueue]);

    const updateFileMetadata = useCallback((id: string, metadata: { title?: string; artist?: string; album?: string }) => {
        queueManager.updateFileMetadata(id, metadata);
    }, [queueManager]);

    const startUpload = useCallback(() => {
        processQueue();
    }, [processQueue]);

    const pauseUpload = useCallback(() => {
        queueManager.pause();
    }, [queueManager]);

    const resumeUpload = useCallback(() => {
        queueManager.resume();
        processQueue();
    }, [queueManager, processQueue]);

    const clearCompleted = useCallback(() => {
        // Custom logic to remove only 'complete' files
        // queueManager doesn't have clearCompleted, so we iterate
        const completedIds = files.filter(f => f.status === 'complete').map(f => f.id);
        completedIds.forEach(id => queueManager.removeFile(id));
    }, [files, queueManager]);

    const clearAll = useCallback(() => {
        queueManager.clear();
    }, [queueManager]);

    const value = useMemo(() => ({
        files,
        isUploading,
        isPaused,
        stats: queueManager.getStats(),
        addFiles,
        removeFile,
        retryFile,
        retryAllFailed,
        updateFileMetadata,
        startUpload,
        pauseUpload,
        resumeUpload,
        clearCompleted,
        clearAll
    }), [
        files,
        isUploading,
        isPaused,
        queueManager,
        addFiles,
        removeFile,
        retryFile,
        retryAllFailed,
        updateFileMetadata,
        startUpload,
        pauseUpload,
        resumeUpload,
        clearCompleted,
        clearAll
    ]);

    return (
        <UploadContext.Provider value={value}>
            {children}
        </UploadContext.Provider>
    );
}
