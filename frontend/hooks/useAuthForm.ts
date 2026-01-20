// Custom hook following SRP - handles form logic only
import { useForm } from '@mantine/form';
import { createAuthValidation } from '@/lib/auth/validation';

interface FormValues {
  email: string;
  password: string;
  confirmPassword?: string;
}

export function useAuthForm(mode: 'login' | 'register') {
  const isLogin = mode === 'login';
  
  return useForm<FormValues>({
    initialValues: {
      email: '',
      password: '',
      ...(isLogin ? {} : { confirmPassword: '' }),
    },
    validate: createAuthValidation(isLogin),
  });
}