import { useEffect, useRef } from 'react';
import { KeyboardShortcut, matchesShortcut, isInputField } from '@/lib/keyboardShortcuts';

/**
 * Custom hook for registering keyboard shortcuts
 * 
 * @param shortcut - The keyboard shortcut configuration
 * @param callback - Function to call when shortcut is triggered
 * @param enabled - Whether the shortcut is enabled (default: true)
 */
export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  callback: () => void,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (isInputField(document.activeElement)) {
        return;
      }

      // Check if event matches the shortcut
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        callbackRef.current();
      }
    };

    // Register event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcut, enabled]);
}

/**
 * Hook for registering multiple keyboard shortcuts
 * 
 * @param shortcuts - Array of shortcut configurations with callbacks
 * @param enabled - Whether the shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{ shortcut: KeyboardShortcut; callback: () => void }>,
  enabled: boolean = true
) {
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when they change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (isInputField(document.activeElement)) {
        return;
      }

      // Check each shortcut
      for (const { shortcut, callback } of shortcutsRef.current) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          callback();
          break; // Only trigger first matching shortcut
        }
      }
    };

    // Register event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}
