'use client';

import { useEffect, useState } from 'react';
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
  useMantineColorScheme,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSun,
  IconMoon,
  IconUser,
  IconLogout,
  IconMusic,
  IconPlaylist,
  IconVinyl,
  IconSettings,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { GRADIENTS, BACKGROUNDS, COLORS } from '@/lib/theme-constants';

/**
 * Navigation component with links to main pages and user authentication display
 * Shows current user email and logout button when authenticated
 * Includes responsive mobile menu with Burger and Drawer
 * Includes dark mode toggle button
 */
export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          background: GRADIENTS.primary,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
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
            background: GRADIENTS.headerOverlay,
            pointerEvents: 'none',
          }}
        />
        
        <Group h="100%" px="md" justify="space-between" style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo and Burger Menu */}
          <Group gap="md">
            {user && (
              <Burger
                opened={drawerOpened}
                onClick={toggleDrawer}
                hiddenFrom="md"
                size="md"
                color="white"
              />
            )}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Group gap="sm">
                <div
                  style={{
                    ...BACKGROUNDS.frostedGlass,
                    borderRadius: '12px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconVinyl size={28} color="white" />
                </div>
                <div>
                  <Text 
                    size="xl" 
                    fw={700}
                    c="white"
                    style={{
                      letterSpacing: '0.5px',
                      lineHeight: 1,
                    }}
                  >
                    Music Player
                  </Text>
                  <Text size="xs" c="silver.4" style={{ lineHeight: 1, marginTop: 2 }}>
                    Your Personal Library
                  </Text>
                </div>
              </Group>
            </Link>
          </Group>

          {/* Desktop Navigation Links */}
          {user && (
            <Group gap="xs" visibleFrom="md">
              <Button
                variant="subtle"
                leftSection={<IconMusic size={18} />}
                onClick={() => router.push('/library')}
                size="md"
                radius="md"
                styles={{
                  root: {
                    color: 'white',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    borderBottom: isActive('/library') ? '2px solid white' : '2px solid transparent',
                    borderRadius: isActive('/library') ? '8px 8px 0 0' : '8px',
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
                leftSection={<IconPlaylist size={18} />}
                onClick={() => router.push('/playlists')}
                size="md"
                radius="md"
                styles={{
                  root: {
                    color: 'white',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    borderBottom: isActive('/playlists') ? '2px solid white' : '2px solid transparent',
                    borderRadius: isActive('/playlists') ? '8px 8px 0 0' : '8px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    },
                  },
                }}
              >
                Playlists
              </Button>
            </Group>
          )}

          {/* Right Side: Dark Mode Toggle and User Menu */}
          <Group gap="xs">
            {/* Dark Mode Toggle */}
            <ActionIcon
              onClick={() => toggleColorScheme()}
              variant="subtle"
              size={40}
              radius="md"
              aria-label="Toggle color scheme"
              color="gray"
              styles={{
                root: {
                  color: 'white',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'rotate(180deg)',
                  },
                },
              }}
            >
              {mounted && (colorScheme === 'dark' ? (
                <IconSun size={18} />
              ) : (
                <IconMoon size={18} />
              ))}
            </ActionIcon>

            {/* User Menu or Auth Buttons */}
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
                        color: 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        },
                      },
                    }}
                  >
                    <IconUser size={18} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown p={4}>
                  <Menu.Label style={{ fontSize: '11px', padding: '4px 8px' }}>
                    {user.email}
                  </Menu.Label>
                  <Menu.Divider my={4} />
                  <Menu.Item
                    leftSection={<IconSettings size={14} />}
                    onClick={() => router.push('/settings')}
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                  >
                    Settings
                  </Menu.Item>
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={14} />}
                    onClick={handleSignOut}
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Group gap="xs">
                <Button 
                  variant="subtle" 
                  onClick={() => router.push('/login')}
                  size="sm"
                  radius="md"
                  styles={{
                    root: {
                      color: 'white',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
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
                      background: 'white',
                      color: COLORS.deepBlue.primary,
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 2px 8px rgba(255, 255, 255, 0.3)',
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
          <Group gap="sm">
            <div
              style={{
                background: GRADIENTS.primary,
                borderRadius: '8px',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconVinyl size={20} color="white" />
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
            borderRadius: '8px',
            marginBottom: '8px',
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
            borderRadius: '8px',
            marginBottom: '8px',
          }}
        />
        <Divider my="md" />
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
                borderRadius: '8px',
                marginBottom: '8px',
              }}
            />
            <NavLink
              label="Logout"
              description="Sign out"
              leftSection={<IconLogout size={20} />}
              onClick={handleSignOut}
              color="red"
              style={{
                borderRadius: '8px',
              }}
            />
          </>
        )}
      </Drawer>
    </>
  );
}
