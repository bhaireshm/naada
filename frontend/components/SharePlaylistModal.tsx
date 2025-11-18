'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  SegmentedControl,
  Button,
  Group,
  Text,
  TextInput,
  ActionIcon,
  Box,
  useMantineTheme,
} from '@mantine/core';
import { IconCopy, IconCheck, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  updatePlaylistVisibility,
  addCollaborator,
  removeCollaborator,
  getShareLink,
  Playlist,
} from '@/lib/api';

interface SharePlaylistModalProps {
  opened: boolean;
  onClose: () => void;
  playlist: Playlist;
  onUpdate: (playlist: Playlist) => void;
}

export default function SharePlaylistModal({
  opened,
  onClose,
  playlist,
  onUpdate,
}: SharePlaylistModalProps) {
  const theme = useMantineTheme();
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>(
    playlist.visibility
  );
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVisibility(playlist.visibility);
  }, [playlist.visibility]);

  useEffect(() => {
    if (opened && (visibility === 'shared' || visibility === 'public')) {
      fetchShareLink();
    }
  }, [opened, visibility]);

  const fetchShareLink = async () => {
    try {
      const link = await getShareLink(playlist.id);
      setShareLink(link);
    } catch (error) {
      console.error('Error fetching share link:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedPlaylist = await updatePlaylistVisibility(playlist.id, visibility);
      onUpdate(updatedPlaylist);
      
      notifications.show({
        title: 'Success',
        message: 'Playlist visibility updated',
        color: 'green',
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating visibility:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update playlist visibility',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!collaboratorInput.trim()) return;

    setLoading(true);
    try {
      const updatedPlaylist = await addCollaborator(playlist.id, collaboratorInput.trim());
      onUpdate(updatedPlaylist);
      setCollaboratorInput('');
      
      notifications.show({
        title: 'Success',
        message: 'Collaborator added',
        color: 'green',
      });
    } catch (error) {
      console.error('Error adding collaborator:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to add collaborator',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    setLoading(true);
    try {
      await removeCollaborator(playlist.id, collaboratorId);
      const updatedPlaylist = {
        ...playlist,
        collaborators: playlist.collaborators.filter((id) => id !== collaboratorId),
      };
      onUpdate(updatedPlaylist);
      
      notifications.show({
        title: 'Success',
        message: 'Collaborator removed',
        color: 'green',
      });
    } catch (error) {
      console.error('Error removing collaborator:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to remove collaborator',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    notifications.show({
      title: 'Copied',
      message: 'Share link copied to clipboard',
      color: 'green',
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} size="md">
          Share Playlist
        </Text>
      }
      centered
      size="md"
    >
      <Stack gap="md">
        {/* Visibility Control */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Visibility
          </Text>
          <SegmentedControl
            value={visibility}
            onChange={(value) => setVisibility(value as any)}
            data={[
              { label: 'Private', value: 'private' },
              { label: 'Shared', value: 'shared' },
              { label: 'Public', value: 'public' },
            ]}
            fullWidth
          />
          <Text size="xs" c="dimmed" mt="xs">
            {visibility === 'private' && 'Only you can see this playlist'}
            {visibility === 'shared' && 'Only collaborators can see this playlist'}
            {visibility === 'public' && 'Everyone can see this playlist'}
          </Text>
        </Box>

        {/* Share Link */}
        {(visibility === 'shared' || visibility === 'public') && shareLink && (
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Share Link
            </Text>
            <Group gap="xs">
              <TextInput
                value={shareLink}
                readOnly
                style={{ flex: 1 }}
                size="md"
              />
              <ActionIcon
                variant="light"
                color="accent1"
                size="lg"
                onClick={handleCopyLink}
              >
                {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
              </ActionIcon>
            </Group>
          </Box>
        )}

        {/* Collaborators */}
        {visibility === 'shared' && (
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Collaborators
            </Text>
            <Group gap="xs" mb="xs">
              <TextInput
                placeholder="Enter user ID or email"
                value={collaboratorInput}
                onChange={(e) => setCollaboratorInput(e.target.value)}
                style={{ flex: 1 }}
                size="md"
              />
              <Button
                onClick={handleAddCollaborator}
                disabled={!collaboratorInput.trim() || loading}
                size="md"
              >
                Add
              </Button>
            </Group>
            
            {playlist.collaborators.length > 0 && (
              <Stack gap="xs">
                {playlist.collaborators.map((collaboratorId) => (
                  <Group key={collaboratorId} justify="space-between">
                    <Text size="sm">{collaboratorId}</Text>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(collaboratorId)}
                      disabled={loading}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Actions */}
        <Group justify="flex-end" gap="xs">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            variant="gradient"
            gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
