// Custom hook following SRP - handles authentication logic only
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_REDIRECT_URL } from '@/lib/auth/config';

interface FormValues {
  email: string;
  password: string;
}

interface AuthError {
  code?: string;
  message?: string;
}

export function useAuthSubmit(mode: 'login' | 'register') {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectUrl = getRedirectUrl(searchParams);
  const isLogin = mode === 'login';

  const handleSubmit = async (values: FormValues) => {
    setError(null);

    try {
      if (isLogin) {
        await signIn(values.email, values.password);
      } else {
        await signUp(values.email, values.password);
      }
      router.push(redirectUrl);
    } catch (err) {
      handleAuthError(err, false, isLogin, setError);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      router.push(redirectUrl);
    } catch (err) {
      handleAuthError(err, true, isLogin, setError);
    } finally {
      setGoogleLoading(false);
    }
  };

  return {
    handleSubmit,
    handleGoogleAuth,
    error,
    loading,
    googleLoading,
  };
}

// Helper functions following SRP
function getRedirectUrl(searchParams: URLSearchParams): string {
  const redirectParam = searchParams.get('redirect');
  return (redirectParam?.startsWith('/') && !redirectParam.startsWith('//'))
    ? redirectParam
    : DEFAULT_REDIRECT_URL;
}

function handleAuthError(
  err: unknown,
  isGoogle: boolean,
  isLogin: boolean,
  setError: (error: string | null) => void
) {
  let errorMessage = `Failed to ${isLogin ? 'sign in' : 'sign up'}${isGoogle ? ' with Google' : ''}`;
  
  if (isGoogle) {
    const error = err as AuthError;
    if (error.code) {
      errorMessage = error.message || errorMessage;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }
  } else if (err instanceof Error) {
    errorMessage = err.message;
  }

  if (isLogin) {
    notifications.show({
      color: 'red',
      title: isGoogle ? 'Google Sign In Failed' : 'Sign In Failed',
      message: errorMessage,
    });
  } else {
    setError(errorMessage);
  }
}