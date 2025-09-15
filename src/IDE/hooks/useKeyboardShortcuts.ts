import { useEffect, useCallback } from 'react';
import { keyboardShortcuts, KeyboardShortcut } from '../services/keyboardShortcuts';

export const useKeyboardShortcuts = () => {
  // Initialize keyboard shortcuts on mount
  useEffect(() => {
    keyboardShortcuts.initialize();

    return () => {
      keyboardShortcuts.cleanup();
    };
  }, []);

  // Register a custom shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    keyboardShortcuts.register(shortcut);
  }, []);

  // Unregister a shortcut
  const unregisterShortcut = useCallback((id: string) => {
    keyboardShortcuts.unregister(id);
  }, []);

  // Get all shortcuts
  const getAllShortcuts = useCallback(() => {
    return keyboardShortcuts.getAllShortcuts();
  }, []);

  // Get shortcuts by category
  const getShortcutsByCategory = useCallback((category: string) => {
    return keyboardShortcuts.getShortcutsByCategory(category);
  }, []);

  // Get shortcuts formatted for display
  const getShortcutsForDisplay = useCallback(() => {
    return keyboardShortcuts.getShortcutsForDisplay();
  }, []);

  // Listen for keyboard shortcut events
  const onShortcut = useCallback((actionId: string, callback: () => void) => {
    const handler = (event: CustomEvent) => {
      if (event.detail.actionId === actionId) {
        callback();
      }
    };

    window.addEventListener('keyboard-shortcut', handler as EventListener);

    return () => {
      window.removeEventListener('keyboard-shortcut', handler as EventListener);
    };
  }, []);

  return {
    registerShortcut,
    unregisterShortcut,
    getAllShortcuts,
    getShortcutsByCategory,
    getShortcutsForDisplay,
    onShortcut
  };
};