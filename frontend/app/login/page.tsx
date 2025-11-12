'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Container, Paper, Title, Text, TextInput, PasswordInput, Button, Alert, Anchor, Stack, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Box
      style={(theme) => ({
        minHeight: '100vh',
        background: theme.other?.gradient || 'linear-gradient(135deg, #011f4b 0%, #2c3e50 100%)',
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
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Stack gap="md">
            <div>
              <Title 
                order={1} 
                ta="center" 
                mb={8}
                style={{
                  background: 'linear-gradient(135deg, #011f4b 0%, #2c3e50 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Welcome Back
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Sign in to your music library
              </Text>
            </div>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Email Address"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  size="md"
                  styles={{
                    input: {
                      backgroundColor: 'white',
                      color: '#000',
                      '&::placeholder': {
                        color: '#adb5bd',
                      },
                    },
                  }}
                  {...form.getInputProps('email')}
                />

                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  size="md"
                  styles={{
                    input: {
                      backgroundColor: 'white',
                      color: '#000',
                      '&::placeholder': {
                        color: '#adb5bd',
                      },
                    },
                  }}
                  {...form.getInputProps('password')}
                />

                {error && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  variant="gradient"
                  gradient={{ from: 'deepBlue.7', to: 'slate.7', deg: 135 }}
                >
                  Sign In
                </Button>
              </Stack>
            </form>

            <Text c="dimmed" size="sm" ta="center">
              Don&apos;t have an account?{' '}
              <Anchor component={Link} href="/register" size="sm" c="deepBlue.7">
                Sign up
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
