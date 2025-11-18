'use client';

import { useRouter } from 'next/navigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcut';
import { KEYBOARD_SHORTCUTS } from '@/lib/keyboardShortcuts';

/**
 * Component that registers global keyboard shortcuts for navigation
 */
export function GlobalKeyboardShortcuts() {
  const router = useRouter();

  useKeyboardShortcuts([
    {
      shortcut: KEYBOARD_SHORTCUTS.goHome,
      callback: () => router.push('/'),
    },
    {
      shortcut: KEYBOARD_SHORTCUTS.goLibrary,
      callback: () => router.push('/library'),
    },
    {
      shortcut: KEYBOARD_SHORTCUTS.goPlaylists,
      callback: () => router.push('/playlists'),
    },
    {
      shortcut: KEYBOARD_SHORTCUTS.focusSearch,
      callback: () => {
        // Focus the search input if it exists
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Search" i]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
    },
  ]);

  // This component doesn't render anything
  return null;
}
