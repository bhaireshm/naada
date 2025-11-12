'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  SimpleGrid,
  Stack,
  Group,
  Center,
  Loader,
  ThemeIcon,
  Box,
} from '@mantine/core';
import {
  IconUpload,
  IconPlaylist,
  IconMusic,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect authenticated users to library
  useEffect(() => {
    if (!loading && user) {
      router.push('/library');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading...</Text>
        </Stack>
      </Center>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <Box
      style={(theme) => ({
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.other?.gradient || 'linear-gradient(135deg, #011f4b 0%, #2c3e50 100%)',
        padding: 'var(--mantine-spacing-md)',
      })}
    >
      <Container size="lg">
        <Stack align="center" gap="xl">
          <Stack align="center" gap="md">
            <Title
              order={1}
              size="3.5rem"
              ta="center"
              c="white"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              }}
            >
              Welcome to Music Player
            </Title>
            <Text size="xl" c="silver.4" ta="center" maw={600}>
              Upload, organize, and stream your music collection from anywhere
            </Text>
          </Stack>

          <Card
            shadow="xl"
            padding="xl"
            radius="lg"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Stack gap="xl">
              <SimpleGrid
                cols={{ base: 1, sm: 3 }}
                spacing="lg"
              >
                <Card 
                  padding="lg" 
                  radius="md" 
                  style={{
                    background: 'linear-gradient(135deg, #0056e6 0%, #34495e 100%)',
                    border: 'none',
                    color: 'white',
                  }}
                >
                  <Stack align="center" gap="md">
                    <ThemeIcon
                      size={64}
                      radius="xl"
                      variant="white"
                      color="deepBlue"
                    >
                      <IconUpload size={32} />
                    </ThemeIcon>
                    <Title order={3} size="h4" ta="center" c="white">
                      Upload Your Music
                    </Title>
                    <Text size="sm" c="silver.4" ta="center">
                      Upload your favorite songs with automatic duplicate detection
                    </Text>
                  </Stack>
                </Card>

                <Card 
                  padding="lg" 
                  radius="md"
                  style={{
                    background: 'linear-gradient(135deg, #1a75ff 0%, #7f8c8d 100%)',
                    border: 'none',
                    color: 'white',
                  }}
                >
                  <Stack align="center" gap="md">
                    <ThemeIcon
                      size={64}
                      radius="xl"
                      variant="white"
                      color="deepBlue"
                    >
                      <IconPlaylist size={32} />
                    </ThemeIcon>
                    <Title order={3} size="h4" ta="center" c="white">
                      Create Playlists
                    </Title>
                    <Text size="sm" c="silver.4" ta="center">
                      Organize your music into custom playlists
                    </Text>
                  </Stack>
                </Card>

                <Card 
                  padding="lg" 
                  radius="md"
                  style={{
                    background: 'linear-gradient(135deg, #011f4b 0%, #2c3e50 100%)',
                    border: 'none',
                    color: 'white',
                  }}
                >
                  <Stack align="center" gap="md">
                    <ThemeIcon
                      size={64}
                      radius="xl"
                      variant="white"
                      color="slate"
                    >
                      <IconMusic size={32} />
                    </ThemeIcon>
                    <Title order={3} size="h4" ta="center" c="white">
                      Stream Anywhere
                    </Title>
                    <Text size="sm" c="silver.4" ta="center">
                      Listen to your music from any device
                    </Text>
                  </Stack>
                </Card>
              </SimpleGrid>

              <Group justify="center" gap="md">
                <Button
                  component={Link}
                  href="/register"
                  size="lg"
                  radius="md"
                  color="deepBlue"
                  variant="gradient"
                  gradient={{ from: 'deepBlue.7', to: 'slate.7', deg: 135 }}
                >
                  Get Started
                </Button>
                <Button
                  component={Link}
                  href="/login"
                  size="lg"
                  radius="md"
                  variant="outline"
                  color="deepBlue"
                >
                  Sign In
                </Button>
              </Group>
            </Stack>
          </Card>

          <Text size="sm" c="silver.4">
            Secure authentication powered by Firebase
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
