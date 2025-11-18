'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Container, Paper, Title, Text, TextInput, PasswordInput, Button, Alert, Anchor, Stack, Box, Divider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { signUpWithGoogle } from '@/lib/firebase';
import { getUserProfile } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
      confirmPassword: (value: string, values: { password: string }) => 
        value === values.password ? null : 'Passwords do not match',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);

    try {
      await signUp(values.email, values.password);
      router.push('/library');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setError(errorMessage);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await signUpWithGoogle();
      
      // Try to get/create user profile on backend
      try {
        await getUserProfile();
      } catch {
        // Profile might not exist yet, that's okay
        console.log('Profile will be created on first API call');
      }

      // Redirect to library
      router.push('/library');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up with Google';
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Box
      style={(theme) => ({
        height: '100vh',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--mantine-spacing-md)',
      })}
    >
      <Container size={420} w="100%">
        <Paper 
          shadow="xl" 
          p={30} 
          radius="md"
          style={(theme) => ({
            background: `rgba(${parseInt(theme.colors.primary[0].slice(1, 3), 16)}, ${parseInt(theme.colors.primary[0].slice(3, 5), 16)}, ${parseInt(theme.colors.primary[0].slice(5, 7), 16)}, 0.95)`,
            backdropFilter: 'blur(10px)',
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
                Create Account
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Sign up to start building your music library
              </Text>
            </div>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {error}
              </Alert>
            )}

            <GoogleSignInButton
              onClick={handleGoogleSignUp}
              loading={googleLoading}
              variant="signup"
            />

            <Divider label="OR" labelPosition="center" />

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Email Address"
                  placeholder="you@example.com"
                  required
                  disabled={loading || googleLoading}
                  size="md"
                  {...form.getInputProps('email')}
                />

                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  required
                  disabled={loading || googleLoading}
                  size="md"
                  {...form.getInputProps('password')}
                />

                <PasswordInput
                  label="Confirm Password"
                  placeholder="••••••••"
                  required
                  disabled={loading || googleLoading}
                  size="md"
                  {...form.getInputProps('confirmPassword')}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={googleLoading}
                  variant="gradient"
                  gradient={{ from: 'accent1.7', to: 'accent2.7', deg: 135 }}
                >
                  Sign Up
                </Button>
              </Stack>
            </form>

            <Text c="dimmed" size="sm" ta="center">
              Already have an account?{' '}
              <Anchor component={Link} href="/login" size="sm" c="accent1.7">
                Sign in
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
