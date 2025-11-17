'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Burger,
  Button,
  Drawer,
  Group,
  Menu,
  ActionIcon,
  Text,
  NavLink,
  useMantineTheme,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconUser,
  IconLogout,
  IconMusic,
  IconPlaylist,
  IconVinyl,
  IconSettings,
  IconHeart,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import SearchInput from '@/components/SearchInput';

/**
 * Navigation component with links to main pages and user authentication display
 * Shows current user email and logout button when authenticated
 * Includes responsive mobile menu with Burger and Drawer
 */
export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const theme = useMantineTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
      closeDrawer();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <div
        style={{
          height: '100%',
          background: `linear-gradient(135deg, ${theme.colors.accent1[7]} 0%, ${theme.colors.tertiary[6]} 100%)`,
          boxShadow: theme.shadows.lg,
          position: 'relative',
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
        
        <Group h="100%" px={theme.spacing.md} justify="space-between" style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo and Burger Menu */}
          <Group gap={theme.spacing.md}>
            {user && (
              <Burger
                opened={drawerOpened}
                onClick={toggleDrawer}
                hiddenFrom="md"
                size="md"
                color={theme.colors.primary[0]}
              />
            )}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Group gap={theme.spacing.sm}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: theme.radius.lg,
                    padding: theme.spacing.sm,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconVinyl size={28} color={theme.colors.primary[0]} />
                </div>
                <div>
                  <Text 
                    size="xl" 
                    fw={700}
                    c={theme.colors.primary[0]}
                    style={{
                      letterSpacing: '0.5px',
                      lineHeight: 1,
                    }}
                  >
                    Music Player
                  </Text>
                  <Text 
                    size="xs" 
                    c={theme.colors.primary[2]} 
                    style={{ 
                      lineHeight: 1, 
                      marginTop: theme.spacing.xs 
                    }}
                  >
                    Your Personal Library
                  </Text>
                </div>
              </Group>
            </Link>
          </Group>

          {/* Search and Desktop Navigation Links */}
          {user && (
            <Group gap={theme.spacing.md} visibleFrom="md" style={{ flex: 1, maxWidth: 800 }}>
              <div style={{ flex: 1, maxWidth: 400 }}>
                <SearchInput />
              </div>
              <Group gap={theme.spacing.xs}>
                <Button
                  variant="subtle"
                  leftSection={<IconMusic size={18} />}
                  onClick={() => router.push('/library')}
                  size="md"
                  radius="md"
                  styles={{
                    root: {
                      color: theme.colors.primary[0],
                      fontWeight: 500,
                      transition: 'all 150ms ease',
                      position: 'relative',
                      borderBottom: isActive('/library') 
                        ? `2px solid ${theme.colors.primary[0]}` 
                        : '2px solid transparent',
                      borderRadius: isActive('/library') 
                        ? `${theme.radius.md} ${theme.radius.md} 0 0` 
                        : theme.radius.md,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      },
                    },
                  }}
                >
                  Library
                </Button>
                <Button
                  variant="subtle"
                  leftSection={<IconHeart size={18} />}
                  onClick={() => router.push('/favorites')}
                  size="md"
                  radius="md"
                  styles={{
                    root: {
                      color: theme.colors.primary[0],
                      fontWeight: 500,
                      transition: 'all 150ms ease',
                      position: 'relative',
                      borderBottom: isActive('/favorites') 
                        ? `2px solid ${theme.colors.primary[0]}` 
                        : '2px solid transparent',
                      borderRadius: isActive('/favorites') 
                        ? `${theme.radius.md} ${theme.radius.md} 0 0` 
                        : theme.radius.md,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      },
                    },
                  }}
                >
                  Favorites
                </Button>
                <Button
                  variant="subtle"
                  leftSection={<IconPlaylist size={18} />}
                  onClick={() => router.push('/playlists')}
                  size="md"
                  radius="md"
                  styles={{
                    root: {
                      color: theme.colors.primary[0],
                      fontWeight: 500,
                      transition: 'all 150ms ease',
                      position: 'relative',
                      borderBottom: isActive('/playlists') 
                        ? `2px solid ${theme.colors.primary[0]}` 
                        : '2px solid transparent',
                      borderRadius: isActive('/playlists') 
                        ? `${theme.radius.md} ${theme.radius.md} 0 0` 
                        : theme.radius.md,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      },
                    },
                  }}
                >
                  Playlists
                </Button>
              </Group>
            </Group>
          )}

          {/* Right Side: User Menu or Auth Buttons */}
          <Group gap={theme.spacing.xs}>
            {user ? (
              <Menu shadow="sm" width={180} position="bottom-end" offset={4}>
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    size={40}
                    radius="md"
                    aria-label="User menu"
                    styles={{
                      root: {
                        color: theme.colors.primary[0],
                        transition: 'all 150ms ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        },
                      },
                    }}
                  >
                    <IconUser size={18} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown p={theme.spacing.xs}>
                  <Menu.Label style={{ fontSize: '11px', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}>
                    {user.email}
                  </Menu.Label>
                  <Menu.Divider my={theme.spacing.xs} />
                  <Menu.Item
                    leftSection={<IconSettings size={14} />}
                    onClick={() => router.push('/settings')}
                    style={{ fontSize: '13px', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                  >
                    Settings
                  </Menu.Item>
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={14} />}
                    onClick={handleSignOut}
                    style={{ fontSize: '13px', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Group gap={theme.spacing.xs}>
                <Button 
                  variant="subtle" 
                  onClick={() => router.push('/login')}
                  size="sm"
                  radius="md"
                  styles={{
                    root: {
                      color: theme.colors.primary[0],
                      fontWeight: 500,
                      transition: 'all 150ms ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      },
                    },
                  }}
                >
                  Login
                </Button>
                <Button 
                  variant="white"
                  onClick={() => router.push('/register')}
                  size="sm"
                  radius="md"
                  styles={{
                    root: {
                      background: theme.colors.primary[0],
                      color: theme.colors.accent1[7],
                      fontWeight: 600,
                      transition: 'all 150ms ease',
                      '&:hover': {
                        background: theme.colors.primary[1],
                        boxShadow: theme.shadows.sm,
                      },
                    },
                  }}
                >
                  Sign Up
                </Button>
              </Group>
            )}
          </Group>
        </Group>
      </div>

      {/* Mobile Drawer Navigation */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="xs"
        padding="md"
        title={
          <Group gap={theme.spacing.sm}>
            <div
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accent1[7]} 0%, ${theme.colors.tertiary[6]} 100%)`,
                borderRadius: theme.radius.md,
                padding: theme.spacing.xs,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconVinyl size={20} color={theme.colors.primary[0]} />
            </div>
            <Text fw={700}>Menu</Text>
          </Group>
        }
        hiddenFrom="md"
      >
        <NavLink
          label="Library"
          description="Browse your music"
          leftSection={<IconMusic size={20} />}
          active={isActive('/library')}
          onClick={() => {
            router.push('/library');
            closeDrawer();
          }}
          style={{
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing.sm,
          }}
        />
        <NavLink
          label="Favorites"
          description="Liked songs"
          leftSection={<IconHeart size={20} />}
          active={isActive('/favorites')}
          onClick={() => {
            router.push('/favorites');
            closeDrawer();
          }}
          style={{
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing.sm,
          }}
        />
        <NavLink
          label="Playlists"
          description="Your collections"
          leftSection={<IconPlaylist size={20} />}
          active={isActive('/playlists')}
          onClick={() => {
            router.push('/playlists');
            closeDrawer();
          }}
          style={{
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing.sm,
          }}
        />
        <Divider my={theme.spacing.md} />
        {user && (
          <>
            <NavLink
              label="Settings"
              description="Preferences"
              leftSection={<IconSettings size={20} />}
              onClick={() => {
                router.push('/settings');
                closeDrawer();
              }}
              style={{
                borderRadius: theme.radius.md,
                marginBottom: theme.spacing.sm,
              }}
            />
            <NavLink
              label="Logout"
              description="Sign out"
              leftSection={<IconLogout size={20} />}
              onClick={handleSignOut}
              color="red"
              style={{
                borderRadius: theme.radius.md,
              }}
            />
          </>
        )}
      </Drawer>
    </>
  );
}
