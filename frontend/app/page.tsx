'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Text,
  Stack,
  Center,
  Loader,
} from '@mantine/core';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect authenticated users to library, unauthenticated to login
  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/library');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  return (
    <Center style={{ minHeight: '100vh' }}>
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text c="dimmed">Loading...</Text>
      </Stack>
    </Center>
  );
}
