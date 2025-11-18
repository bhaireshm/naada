'use client';

import { useState } from 'react';
import { Card, Group, Text, Button, Modal, Stack } from '@mantine/core';
import { IconBrandGoogle, IconUnlink } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface GoogleAccountSectionProps {
  googleId?: string;
  googleEmail?: string;
  onLink: () => Promise<void>;
  onUnlink: () => Promise<void>;
  canUnlink: boolean;
}

export function GoogleAccountSection({
  googleId,
  googleEmail,
  onLink,
  onUnlink,
  canUnlink,
}: GoogleAccountSectionProps) {
  const [loading, setLoading] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const handleLink = async () => {
    setLoading(true);
    try {
      await onLink();
      notifications.show({
        title: 'Success',
        message: 'Google account linked successfully',
        color: 'green',
      });
    } catch (error) {
      let errorMessage = 'Failed to link Google account';
      
      if (error instanceof Error) {
        // Handle specific error messages
        if (error.message.includes('already linked') || error.message.includes('already in use')) {
          errorMessage = 'This Google account is already linked to another user';
        } else if (error.message.includes('email') && error.message.includes('does not match')) {
          errorMessage = error.message;
        } else if (error.message.includes('popup')) {
          errorMessage = error.message;
        } else if (error.message.includes('cancelled')) {
          // Don't show error for user cancellation
          setLoading(false);
          return;
        } else {
          errorMessage = error.message;
        }
      }
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    setLoading(true);
    try {
      await onUnlink();
      setShowUnlinkModal(false);
      notifications.show({
        title: 'Success',
        message: 'Google account disconnected successfully',
        color: 'green',
      });
    } catch (error) {
      let errorMessage = 'Failed to disconnect Google account';
      
      if (error instanceof Error) {
        // Handle specific error messages
        if (error.message.includes('password') || error.message.includes('alternative')) {
          errorMessage = 'You must have a password set before disconnecting your Google account';
        } else {
          errorMessage = error.message;
        }
      }
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card shadow="sm" padding="lg" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text fw={500} size="lg">
                Google Account
              </Text>
              <Text size="sm" c="dimmed">
                {googleId
                  ? 'Your Google account is connected'
                  : 'Connect your Google account for easier sign-in'}
              </Text>
            </div>
            <IconBrandGoogle size={32} />
          </Group>

          {googleId ? (
            <>
              <Group justify="space-between">
                <div>
                  <Text size="sm" fw={500}>
                    Connected Account
                  </Text>
                  <Text size="sm" c="dimmed">
                    {googleEmail}
                  </Text>
                </div>
                <Button
                  leftSection={<IconUnlink size={16} />}
                  onClick={() => setShowUnlinkModal(true)}
                  variant="light"
                  color="red"
                  disabled={!canUnlink || loading}
                >
                  Disconnect
                </Button>
              </Group>
              {!canUnlink && (
                <Text size="xs" c="orange">
                  You must have a password set before disconnecting your Google account.
                </Text>
              )}
            </>
          ) : (
            <Button
              leftSection={<IconBrandGoogle size={20} />}
              onClick={handleLink}
              loading={loading}
              variant="default"
              fullWidth
            >
              Connect Google Account
            </Button>
          )}
        </Stack>
      </Card>

      {/* Unlink Confirmation Modal */}
      <Modal
        opened={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
        title="Disconnect Google Account"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to disconnect your Google account? You will still be able to
            sign in with your email and password.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setShowUnlinkModal(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleUnlink} loading={loading}>
              Disconnect
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
