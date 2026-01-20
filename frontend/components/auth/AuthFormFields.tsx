// Extracted form fields component following SRP
import { PasswordInput, Stack, TextInput } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { AUTH_STYLES } from '@/lib/auth/config';

interface FormValues {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface AuthFormFieldsProps {
  readonly form: UseFormReturnType<FormValues>;
  readonly isLogin: boolean;
  readonly disabled: boolean;
}

export function AuthFormFields({ form, isLogin, disabled }: AuthFormFieldsProps) {
  return (
    <Stack gap="md" style={AUTH_STYLES.interactive}>
      <TextInput
        label="Email Address"
        placeholder="you@example.com"
        required
        disabled={disabled}
        size="md"
        styles={AUTH_STYLES.input}
        {...form.getInputProps('email')}
      />

      <PasswordInput
        label="Password"
        placeholder="••••••••"
        required
        disabled={disabled}
        size="md"
        styles={AUTH_STYLES.input}
        {...form.getInputProps('password')}
      />

      {!isLogin && (
        <PasswordInput
          label="Confirm Password"
          placeholder="••••••••"
          required
          disabled={disabled}
          size="md"
          styles={AUTH_STYLES.input}
          {...form.getInputProps('confirmPassword')}
        />
      )}
    </Stack>
  );
}