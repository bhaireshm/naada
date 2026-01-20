'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserProfile, UserProfile } from '@/lib/api';
import {
  Burger,
  Button,
  Group,
  Menu,
  Text,
  Box,
  useMantineTheme,
} from '@mantine/core';
import {
  IconUser,
  IconLogout,
  IconVinyl,
  IconSettings,
  IconCloudOff,
  IconLogin,
  IconUserPlus,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import SearchInput from '@/components/SearchInput';
import UserAvatar from '@/components/UserAvatar';
import { OfflineIndicator } from '@/components/OfflineIndicator';

interface NavigationProps {
  opened: boolean;
  toggle: () => void;
}

export default function Navigation({ opened, toggle }: NavigationProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const theme = useMantineTheme();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      getUserProfile()
        .then(setUserProfile)
        .catch((err) => console.error('Failed to fetch user profile:', err));
    } else if (userProfile) {
      setTimeout(() => setUserProfile(null), 0);
    }
  }, [user, userProfile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserProfile(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <div
      style={{
        height: '100%',
        background: `linear-gradient(135deg, ${theme.colors.accent1[7]} 0%, ${theme.colors.tertiary[6]} 100%)`,
        boxShadow: theme.shadows.sm,
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Decorative overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
          pointerEvents: 'none',
        }}
      />

      <Group h="100%" px={{ base: 'xs', sm: 'md' }} justify="space-between" align="center" style={{ position: 'relative', zIndex: 101 }} wrap="nowrap">
        {/* Logo and Burger Menu */}
        <Group gap="xs" align="center" wrap="nowrap">
          {user && (
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              color={theme.colors.primary[0]}
            />
          )}

          {/* Logo - Only visible on mobile or if sidebar is hidden */}
          <Link href={user ? '/library' : '/'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Group gap={theme.spacing.sm} align="center" wrap="nowrap" visibleFrom="xs">
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: theme.radius.lg,
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconVinyl size={20} color={theme.colors.primary[0]} />
              </div>
              <Text
                size="lg"
                fw={700}
                c={theme.colors.primary[0]}
                style={{ letterSpacing: '0.5px' }}
                title='Naada'
              >
                ನಾದ
              </Text>
            </Group>
            {/* Mobile Logo (Icon only) */}
            <div style={{ display: 'flex', alignItems: 'center' }} className="mantine-hidden-from-xs">
              <IconVinyl size={24} color={theme.colors.primary[0]} />
            </div>
          </Link>
        </Group>

        {/* Search Bar */}
        {user && (
          <Box style={{ flex: 1, maxWidth: 400 }} mx={{ base: 'xs', sm: 'md' }}>
            <SearchInput />
          </Box>
        )}

        {/* Right Side: Offline Indicator, User Menu or Auth Buttons */}
        <Group gap={theme.spacing.xs} wrap="nowrap" style={{ flexShrink: 0 }}>
          {user && <OfflineIndicator />}
          {user ? (
            <Menu shadow="sm" width={180} position="bottom-end" offset={4} zIndex={1050}>
              <Menu.Target>
                <div
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 150ms ease',
                    position: 'relative',
                    zIndex: 102,
                  }}
                >
                  <UserAvatar
                    avatarUrl={userProfile?.avatarUrl || user.photoURL || undefined}
                    displayName={userProfile?.displayName || user.displayName || undefined}
                    email={user.email || undefined}
                    size="md"
                  />
                </div>
              </Menu.Target>

              <Menu.Dropdown p={theme.spacing.xs}>
                <Menu.Label style={{ fontSize: '11px', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}>
                  {user.email}
                </Menu.Label>
                <Menu.Divider my={theme.spacing.xs} />
                <Menu.Item
                  leftSection={<IconUser size={14} />}
                  onClick={() => router.push('/profile')}
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconSettings size={14} />}
                  onClick={() => router.push('/settings')}
                >
                  Settings
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconCloudOff size={14} />}
                  onClick={() => router.push('/offline')}
                >
                  Offline
                </Menu.Item>
                <Menu.Divider my={theme.spacing.xs} />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  onClick={handleSignOut}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Group gap="xs" wrap="nowrap" align="center">
              <Button
                variant="subtle"
                onClick={() => router.push('/login')}
                size="sm"
                hiddenFrom="sm"
                px={8}
              >
                <IconLogin size={20} />
              </Button>
              <Button
                variant="subtle"
                onClick={() => router.push('/login')}
                size="sm"
                visibleFrom="sm"
              >
                Login
              </Button>

              <Button
                variant="white"
                onClick={() => router.push('/register')}
                size="sm"
                hiddenFrom="sm"
                px={8}
                style={{ color: theme.colors.accent1[7] }}
              >
                <IconUserPlus size={20} />
              </Button>
              <Button
                variant="white"
                onClick={() => router.push('/register')}
                size="sm"
                visibleFrom="sm"
                style={{ color: theme.colors.accent1[7] }}
              >
                Sign Up
              </Button>
            </Group>
          )}
        </Group>
      </Group>
    </div>
  );
}
