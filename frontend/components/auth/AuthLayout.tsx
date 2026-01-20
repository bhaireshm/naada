'use client';

import { Box, Container, Paper, Stack, Text, Title, rgba } from '@mantine/core';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: Readonly<AuthLayoutProps>) {
  return (
    <Box
      style={(theme) => ({
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
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
            background: rgba(theme.colors.primary[0], 0.95),
            pointerEvents: 'auto',
          })}
        >
          <Stack gap="md">
            <Box>
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
                {title}
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                {subtitle}
              </Text>
            </Box>

            {children}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
