import { Button } from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';

interface GoogleSignInButtonProps {
  onClick: () => void;
  loading?: boolean;
  variant?: 'signup' | 'signin';
}

export function GoogleSignInButton({
  onClick,
  loading = false,
  variant = 'signin'
}: GoogleSignInButtonProps) {
  const text = variant === 'signup' ? 'Sign up with Google' : 'Sign in with Google';

  return (
    <Button
      leftSection={<IconBrandGoogle size={20} />}
      onClick={onClick}
      loading={loading}
      variant="default"
      size="md"
      fullWidth
      styles={(theme) => ({
        root: {
          border: `1px solid ${theme.colors.gray[3]}`,
          '&:hover': {
            backgroundColor: theme.colors.gray[0],
          },
        },
      })}
    >
      {text}
    </Button>
  );
}
