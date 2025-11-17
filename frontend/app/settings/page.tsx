'use client';

import { Container, Title, Text, Stack, Box } from '@mantine/core';
import ProtectedRoute from '@/components/ProtectedRoute';

function SettingsPageContent() {
  return (
    <Box pb={90}>
      <Container size="lg" py="xl">
        {/* Page Header */}
        <Stack gap="xs" mb="xl">
          <Title order={1}>Settings</Title>
          <Text c="dimmed" size="sm">
            Customize your music player experience
          </Text>
        </Stack>

        {/* Placeholder for future settings */}
        <Text c="dimmed" ta="center" py="xl">
          Settings will be available here
        </Text>
      </Container>
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
