'use client';

import { Loader } from '@mantine/core';
import { Suspense } from 'react';
import { AuthForm } from './AuthForm';
import { AuthLayout } from './AuthLayout';
import { AUTH_CONFIG } from '@/lib/auth/config';

interface AuthPageProps {
  readonly mode: 'login' | 'register';
}

function AuthPageContent({ mode }: AuthPageProps) {
  const config = AUTH_CONFIG[mode];

  return (
    <AuthLayout title={config.title} subtitle={config.subtitle}>
      <AuthForm mode={mode} />
    </AuthLayout>
  );
}

export function AuthPage({ mode }: AuthPageProps) {
  return (
    <Suspense fallback={<Loader />}>
      <AuthPageContent mode={mode} />
    </Suspense>
  );
}
