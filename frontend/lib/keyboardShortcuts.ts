/**
 * Keyboard shortcuts configuration and utilities
 */

export type ShortcutCategory = 'playback' | 'navigation' | 'general';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean; // Cmd on Mac
  description: string;
  category: ShortcutCategory;
}

export interface ShortcutConfig {
  [id: string]: KeyboardShortcut;
}

/**
 * Centralized keyboard shortcuts configuration
 */
export const KEYBOARD_SHORTCUTS: ShortcutConfig = {
  // Playback controls
  playPause: {
    key: ' ', // Space
    description: 'Play/Pause',
    category: 'playback',
  },
  nextSong: {
    key: 'ArrowRight',
    description: 'Next song',
    category: 'playback',
  },
  previousSong: {
    key: 'ArrowLeft',
    description: 'Previous song',
    category: 'playback',
  },
  volumeUp: {
    key: 'ArrowUp',
    description: 'Volume up',
    category: 'playback',
  },
  volumeDown: {
    key: 'ArrowDown',
    description: 'Volume down',
    category: 'playback',
  },
  mute: {
    key: 'm',
    description: 'Mute/Unmute',
    category: 'playback',
  },
  shuffle: {
    key: 's',
    description: 'Toggle shuffle',
    category: 'playback',
  },
  repeat: {
    key: 'r',
    description: 'Cycle repeat mode',
    category: 'playback',
  },
  speedUp: {
    key: ']',
    description: 'Increase speed',
    category: 'playback',
  },
  speedDown: {
    key: '[',
    description: 'Decrease speed',
    category: 'playback',
  },
  showQueue: {
    key: 'q',
    description: 'Show queue',
    category: 'playback',
  },

  // Navigation
  goHome: {
    key: 'h',
    ctrl: true,
    meta: true,
    description: 'Go to home',
    category: 'navigation',
  },
  goLibrary: {
    key: 'l',
    ctrl: true,
    meta: true,
    description: 'Go to library',
    category: 'navigation',
  },
  goPlaylists: {
    key: 'p',
    ctrl: true,
    meta: true,
    description: 'Go to playlists',
    category: 'navigation',
  },
  focusSearch: {
    key: 's',
    ctrl: true,
    meta: true,
    description: 'Focus search',
    category: 'navigation',
  },

  // General
  closeModal: {
    key: 'Escape',
    description: 'Close modal/dialog',
    category: 'general',
  },
  showHelp: {
    key: '/',
    ctrl: true,
    meta: true,
    description: 'Show keyboard shortcuts',
    category: 'general',
  },
};

/**
 * Detect if user is on Mac
 */
export function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

/**
 * Format a keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const mac = isMac();

  // Add modifier keys
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(mac ? '⌘' : 'Ctrl');
  }
  if (shortcut.alt) {
    parts.push(mac ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push(mac ? '⇧' : 'Shift');
  }

  // Add main key
  let key = shortcut.key;
  
  // Format special keys
  switch (key) {
    case ' ':
      key = 'Space';
      break;
    case 'ArrowUp':
      key = '↑';
      break;
    case 'ArrowDown':
      key = '↓';
      break;
    case 'ArrowLeft':
      key = '←';
      break;
    case 'ArrowRight':
      key = '→';
      break;
    case 'Escape':
      key = 'Esc';
      break;
    default:
      key = key.toUpperCase();
  }

  parts.push(key);

  return parts.join(mac ? '' : '+');
}

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  const mac = isMac();

  // Check main key
  if (event.key !== shortcut.key) {
    return false;
  }

  // Check modifiers
  const ctrlOrMeta = mac ? event.metaKey : event.ctrlKey;
  const expectedCtrlOrMeta = shortcut.ctrl || shortcut.meta;

  if (!!expectedCtrlOrMeta !== ctrlOrMeta) {
    return false;
  }

  if (!!shortcut.alt !== event.altKey) {
    return false;
  }

  if (!!shortcut.shift !== event.shiftKey) {
    return false;
  }

  return true;
}

/**
 * Check if the active element is an input field
 */
export function isInputField(element: Element | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isContentEditable = (element as HTMLElement).isContentEditable;

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isContentEditable
  );
}

/**
 * Get all shortcuts by category
 */
export function getShortcutsByCategory(): Record<ShortcutCategory, Array<{ id: string; shortcut: KeyboardShortcut }>> {
  const result: Record<ShortcutCategory, Array<{ id: string; shortcut: KeyboardShortcut }>> = {
    playback: [],
    navigation: [],
    general: [],
  };

  Object.entries(KEYBOARD_SHORTCUTS).forEach(([id, shortcut]) => {
    result[shortcut.category].push({ id, shortcut });
  });

  return result;
}
