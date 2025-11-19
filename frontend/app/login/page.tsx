'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Container, Paper, Title, Text, TextInput, PasswordInput, Button, Alert, Anchor, Stack, Box, Divider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { signInWithGoogle } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => (value.length > 0 ? null : 'Password is required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);

    try {
      await signIn(values.email, values.password);
      router.push('/library');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      router.push('/library');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Box
      style={(theme) => ({
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100())`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--mantine-spacing-md)',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
      })}
    >
      <Container size={420} w="100%" style={{ pointerEvents: 'auto' }}>
        <Paper 
          shadow="xl" 
          p={30} 
          radius="md"
          style={(theme) => ({
            background: `rgba(${parseInt(theme.colors.primary[0].slice(1, 3), 16)}, ${parseInt(theme.colors.primary[0].slice(3, 5), 16)}, ${parseInt(theme.colors.primary[0].slice(5, 7), 16)}, 0.95)`,
            pointerEvents: 'auto',
          })}
        >
          <Stack gap="md">
            <div>
              <Title 
                order={1} 
                ta="center" 
                mb={8}
                style={(theme) => ({
                  backgroundImage: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.accent2[7]} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                })}
              >
                Welcome Back
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Sign in to your music library
              </Text>
            </div>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {error}
              </Alert>
            )}

            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              loading={googleLoading}
              variant="signin"
            />

            <Divider label="OR" labelPosition="center" />

            <form onSubmit={form.onSubmit(handleSubmit)} style={{ pointerEvents: 'auto' }}>
              <Stack gap="md" style={{ pointerEvents: 'auto' }}>
                <TextInput
                  label="Email Address"
                  placeholder="you@example.com"
                  required
                  disabled={loading || googleLoading}
                  size="md"
                  styles={{ input: { pointerEvents: 'auto', touchAction: 'manipulation' } }}
                  {...form.getInputProps('email')}
                />

                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  required
                  disabled={loading || googleLoading}
                  size="md"
                  styles={{ input: { pointerEvents: 'auto', touchAction: 'manipulation' } }}
                  {...form.getInputProps('password')}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={googleLoading}
                  variant="gradient"
                  gradient={{ from: 'accent1.7', to: 'accent2.7', deg: 135 }}
                  style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                >
                  Sign In
                </Button>
              </Stack>
            </form>

            <Text c="dimmed" size="sm" ta="center">
              Don&apos;t have an account?{' '}
              <Anchor component={Link} href="/register" size="sm" c="accent1.7">
                Sign up
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
