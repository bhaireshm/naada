// Refactored AuthForm following SOLID principles and guardrails
'use client';

import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { Alert, Anchor, Button, Divider, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { AUTH_CONFIG, AUTH_STYLES } from '@/lib/auth/config';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useAuthSubmit } from '@/hooks/useAuthSubmit';
import { AuthFormFields } from './AuthFormFields';

interface AuthFormProps {
  readonly mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const form = useAuthForm(mode);
  const { handleSubmit, handleGoogleAuth, error, loading, googleLoading } = useAuthSubmit(mode);
  
  const isLogin = mode === 'login';
  const config = AUTH_CONFIG[mode];
  const isDisabled = loading || googleLoading;

  return (
    <>
      {error && !isLogin && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {error}
        </Alert>
      )}

      <GoogleSignInButton
        onClick={handleGoogleAuth}
        loading={googleLoading}
        variant={config.googleVariant}
      />

      <Divider label="OR" labelPosition="center" />

      <form onSubmit={form.onSubmit(handleSubmit)} style={AUTH_STYLES.interactive}>
        <AuthFormFields 
          form={form} 
          isLogin={isLogin} 
          disabled={isDisabled} 
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={googleLoading}
          variant="gradient"
          gradient={{ from: 'accent1.7', to: 'accent2.7', deg: 135 }}
          style={{ ...AUTH_STYLES.button, marginTop: 'var(--mantine-spacing-md)' }}
        >
          {config.submitText}
        </Button>
      </form>

      <Text c="dimmed" size="sm" ta="center">
        {config.linkText}{' '}
        <Anchor component={Link} href={config.linkHref} size="sm" c="accent1.7">
          {config.linkLabel}
        </Anchor>
      </Text>
    </>
  );
}
