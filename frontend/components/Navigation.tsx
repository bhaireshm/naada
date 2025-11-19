'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Burger,
  Button,
  Drawer,
  Group,
  Menu,
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
  IconCompass,
  IconCloudOff,
  IconDisc,
  IconMicrophone,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import SearchInput from '@/components/SearchInput';
import UserAvatar from '@/components/UserAvatar';
import { OfflineIndicator } from '@/components/OfflineIndicator';

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
          background: `linear-gradient(135deg, ${theme.colors.accent1[7]} 0%, ${theme.colors.tertiary[6]} 100())`,
          boxShadow: theme.shadows.lg,
          position: 'relative',
          zIndex: 1000,
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
        
        <Group h="100%" px={theme.spacing.md} justify="space-between" align="center" style={{ position: 'relative', zIndex: 1001 }} wrap="nowrap">
          {/* Logo and Burger Menu */}
          <Group gap={theme.spacing.md} align="center" wrap="nowrap">
            {user && (
              <Burger
                opened={drawerOpened}
                onClick={toggleDrawer}
                hiddenFrom="md"
                size="md"
                color={theme.colors.primary[0]}
                style={{
                  cursor: 'pointer',
                  zIndex: 1002,
                }}
              />
            )}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Group gap={theme.spacing.sm} align="center" wrap="nowrap">
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: theme.radius.lg,
                    padding: theme.spacing.sm,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconVinyl size={28} color={theme.colors.primary[0]} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Text 
                    size="xl" 
                    fw={700}
                    c={theme.colors.primary[0]}
                    style={{
                      letterSpacing: '0.5px',
                      lineHeight: 1.2,
                    }}
                  >
                    Naada
                  </Text>
                  <Text 
                    size="xs" 
                    c={theme.colors.primary[2]} 
                    style={{ 
                      lineHeight: 1.2, 
                      marginTop: 2,
                    }}
                  >
                    Your music, refined.
                  </Text>
                </div>
              </Group>
            </Link>
          </Group>

          {/* Search and Desktop Navigation Links */}
          {user && (
            <Group gap={theme.spacing.sm} visibleFrom="md" style={{ flex: 1, justifyContent: 'space-between' }}>
              <Group gap={theme.spacing.xs} style={{ flex: '0 0 auto' }}>
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
                  size="sm"
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
                  size="sm"
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
                <Button
                  variant="subtle"
                  leftSection={<IconDisc size={18} />}
                  onClick={() => router.push('/albums')}
                  size="sm"
                  radius="md"
                  styles={{
                    root: {
                      color: theme.colors.primary[0],
                      fontWeight: 500,
                      transition: 'all 150ms ease',
                      position: 'relative',
                      borderBottom: isActive('/albums') 
                        ? `2px solid ${theme.colors.primary[0]}` 
                        : '2px solid transparent',
                      borderRadius: isActive('/albums') 
                        ? `${theme.radius.md} ${theme.radius.md} 0 0` 
                        : theme.radius.md,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      },
                    },
                  }}
                >
                  Albums
                </Button>
                <Button
                  variant="subtle"
                  leftSection={<IconMicrophone size={18} />}
                  onClick={() => router.push('/artists')}
                  size="sm"
                  radius="md"
                  styles={{
                    root: {
                      color: theme.colors.primary[0],
                      fontWeight: 500,
                      transition: 'all 150ms ease',
                      position: 'relative',
                      borderBottom: isActive('/artists') 
                        ? `2px solid ${theme.colors.primary[0]}` 
                        : '2px solid transparent',
                      borderRadius: isActive('/artists') 
                        ? `${theme.radius.md} ${theme.radius.md} 0 0` 
                        : theme.radius.md,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      },
                    },
                  }}
                >
                  Artists
                </Button>
                <Button
                  variant="subtle"
                  leftSection={<IconCompass size={18} />}
                  onClick={() => router.push('/discover')}
                  size="sm"
                  radius="md"
                  styles={{
                    root: {
                      color: theme.colors.primary[0],
                      fontWeight: 500,
                      transition: 'all 150ms ease',
                      position: 'relative',
                      borderBottom: isActive('/discover') 
                        ? `2px solid ${theme.colors.primary[0]}` 
                        : '2px solid transparent',
                      borderRadius: isActive('/discover') 
                        ? `${theme.radius.md} ${theme.radius.md} 0 0` 
                        : theme.radius.md,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      },
                    },
                  }}
                >
                  Discover
                </Button>
              </Group>
              <div style={{ flex: '0 0 auto', maxWidth: 350, minWidth: 200 }}>
                <SearchInput />
              </div>
            </Group>
          )}

          {/* Right Side: Offline Indicator, User Menu or Auth Buttons */}
          <Group gap={theme.spacing.xs}>
            {user && <OfflineIndicator />}
            {user ? (
              <Menu shadow="sm" width={180} position="bottom-end" offset={4} zIndex={1050}>
                <Menu.Target>
                  <div
                    style={{
                      cursor: 'pointer',
                      transition: 'transform 150ms ease',
                      position: 'relative',
                      zIndex: 1002,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <UserAvatar
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
                    style={{ fontSize: '13px', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                  >
                    Profile
                  </Menu.Item>
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
          <Group gap={theme.spacing.sm} align="center">
            <div
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accent1[7]} 0%, ${theme.colors.tertiary[6]} 100())`,
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
        zIndex={1100}
        overlayProps={{ opacity: 0.5, blur: 4 }}
        styles={{
          content: {
            pointerEvents: 'auto',
          },
          body: {
            pointerEvents: 'auto',
          },
        }}
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
            cursor: 'pointer',
            pointerEvents: 'auto',
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
            cursor: 'pointer',
            pointerEvents: 'auto',
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
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        />
        <NavLink
          label="Albums"
          description="Browse by album"
          leftSection={<IconDisc size={20} />}
          active={isActive('/albums')}
          onClick={() => {
            router.push('/albums');
            closeDrawer();
          }}
          style={{
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing.sm,
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        />
        <NavLink
          label="Artists"
          description="Browse by artist"
          leftSection={<IconMicrophone size={20} />}
          active={isActive('/artists')}
          onClick={() => {
            router.push('/artists');
            closeDrawer();
          }}
          style={{
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing.sm,
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        />
        <NavLink
          label="Discover"
          description="Explore public playlists"
          leftSection={<IconCompass size={20} />}
          active={isActive('/discover')}
          onClick={() => {
            router.push('/discover');
            closeDrawer();
          }}
          style={{
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing.sm,
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        />
        <NavLink
          label="Offline"
          description="Manage offline songs"
          leftSection={<IconCloudOff size={20} />}
          active={isActive('/offline')}
          onClick={() => {
            router.push('/offline');
            closeDrawer();
          }}
          style={{
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing.sm,
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        />
        <Divider my={theme.spacing.md} />
        {user && (
          <>
            <NavLink
              label="Profile"
              description="Your profile"
              leftSection={<IconUser size={20} />}
              onClick={() => {
                router.push('/profile');
                closeDrawer();
              }}
              style={{
                borderRadius: theme.radius.md,
                marginBottom: theme.spacing.sm,
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            />
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
                cursor: 'pointer',
                pointerEvents: 'auto',
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
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            />
          </>
        )}
      </Drawer>
    </>
  );
}
