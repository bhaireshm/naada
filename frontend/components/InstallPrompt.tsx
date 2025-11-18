'use client';

import { useState, useEffect } from 'react';
import { Button, Paper, Text, Group, CloseButton } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { isStandalone } from '@/lib/sw/register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Install Prompt Component
 * Shows a custom prompt to install the PWA
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) {
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`[Install] User response: ${outcome}`);

    // Clear the prompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    // Store the outcome
    if (outcome === 'dismissed') {
      localStorage.setItem('install-prompt-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Paper
      shadow="lg"
      p="md"
      radius="md"
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: 400,
        width: 'calc(100% - 40px)',
      }}
    >
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={600}>
          Install Music Player
        </Text>
        <CloseButton onClick={handleDismiss} size="sm" />
      </Group>

      <Text size="sm" c="dimmed" mb="md">
        Install this app on your device for quick access and offline playback.
      </Text>

      <Button
        fullWidth
        leftSection={<IconDownload size={18} />}
        onClick={handleInstall}
        variant="filled"
      >
        Install App
      </Button>
    </Paper>
  );
}
