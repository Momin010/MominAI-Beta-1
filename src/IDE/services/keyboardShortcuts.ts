/**
 * Keyboard Shortcuts Service
 * Manages keyboard shortcuts and their actions throughout the IDE
 */

export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac, Windows key on Windows
  action: () => void;
  description: string;
  category: string;
  when?: string; // Context when the shortcut is active
}

export class KeyboardShortcutsService {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.setupDefaultShortcuts();
  }

  // Register a new keyboard shortcut
  register(shortcut: KeyboardShortcut): void {
    const key = this.normalizeKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  // Unregister a keyboard shortcut
  unregister(id: string): void {
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (shortcut.id === id) {
        this.shortcuts.delete(key);
        break;
      }
    }
  }

  // Get all registered shortcuts
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  // Get shortcuts by category
  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter(s => s.category === category);
  }

  // Initialize keyboard event listeners
  initialize(target: HTMLElement | Window = window): void {
    if (this.keydownHandler) {
      target.removeEventListener('keydown', this.keydownHandler);
    }

    this.keydownHandler = (event: KeyboardEvent) => {
      this.handleKeyDown(event);
    };

    target.addEventListener('keydown', this.keydownHandler);
  }

  // Cleanup event listeners
  cleanup(target: HTMLElement | Window = window): void {
    if (this.keydownHandler) {
      target.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  // Handle keyboard events
  private handleKeyDown(event: KeyboardEvent): void {
    // Skip if typing in an input/textarea
    if (this.isTypingInInput(event.target as HTMLElement)) {
      return;
    }

    const key = this.normalizeKeyFromEvent(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      // Check context if specified
      if (shortcut.when && !this.checkContext(shortcut.when)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
    }
  }

  // Check if currently typing in an input element
  private isTypingInInput(target: HTMLElement): boolean {
    const tagName = target.tagName.toLowerCase();
    const contentEditable = target.contentEditable === 'true';
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';

    return isInput || contentEditable;
  }

  // Check if shortcut context is active
  private checkContext(context: string): boolean {
    // Simple context checking - can be expanded
    switch (context) {
      case 'editor':
        return document.activeElement?.closest('.monaco-editor') !== null;
      case 'terminal':
        return document.activeElement?.closest('[data-terminal]') !== null;
      case 'command-palette':
        return document.querySelector('[data-command-palette]') !== null;
      default:
        return true;
    }
  }

  // Normalize shortcut key for storage
  private normalizeKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.meta) parts.push('meta');

    parts.push(shortcut.key.toLowerCase());

    return parts.join('+');
  }

  // Normalize key from keyboard event
  private normalizeKeyFromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');

    parts.push(event.key.toLowerCase());

    return parts.join('+');
  }

  // Setup default shortcuts
  private setupDefaultShortcuts(): void {
    // File operations
    this.register({
      id: 'file.save',
      key: 's',
      ctrl: true,
      action: () => this.triggerAction('file.save'),
      description: 'Save current file',
      category: 'File'
    });

    this.register({
      id: 'file.new',
      key: 'n',
      ctrl: true,
      action: () => this.triggerAction('file.new'),
      description: 'Create new file',
      category: 'File'
    });

    // Editor operations
    this.register({
      id: 'editor.format',
      key: 'f',
      shift: true,
      alt: true,
      action: () => this.triggerAction('editor.format'),
      description: 'Format document',
      category: 'Editor',
      when: 'editor'
    });

    this.register({
      id: 'editor.comment',
      key: '/',
      ctrl: true,
      action: () => this.triggerAction('editor.comment'),
      description: 'Toggle line comment',
      category: 'Editor',
      when: 'editor'
    });

    this.register({
      id: 'editor.find',
      key: 'f',
      ctrl: true,
      action: () => this.triggerAction('editor.find'),
      description: 'Find in file',
      category: 'Editor',
      when: 'editor'
    });

    this.register({
      id: 'editor.replace',
      key: 'h',
      ctrl: true,
      action: () => this.triggerAction('editor.replace'),
      description: 'Find and replace',
      category: 'Editor',
      when: 'editor'
    });

    // Navigation
    this.register({
      id: 'navigation.command-palette',
      key: 'p',
      shift: true,
      ctrl: true,
      action: () => this.triggerAction('navigation.command-palette'),
      description: 'Open command palette',
      category: 'Navigation'
    });

    this.register({
      id: 'navigation.file-explorer',
      key: 'e',
      ctrl: true,
      action: () => this.triggerAction('navigation.file-explorer'),
      description: 'Focus file explorer',
      category: 'Navigation'
    });

    this.register({
      id: 'navigation.terminal',
      key: '`',
      ctrl: true,
      action: () => this.triggerAction('navigation.terminal'),
      description: 'Toggle terminal',
      category: 'Navigation'
    });

    // View operations
    this.register({
      id: 'view.preview',
      key: 'p',
      ctrl: true,
      action: () => this.triggerAction('view.preview'),
      description: 'Toggle live preview',
      category: 'View'
    });

    this.register({
      id: 'view.zen-mode',
      key: 'z',
      ctrl: true,
      shift: true,
      action: () => this.triggerAction('view.zen-mode'),
      description: 'Toggle zen mode',
      category: 'View'
    });

    // AI operations
    this.register({
      id: 'ai.explain',
      key: 'i',
      ctrl: true,
      shift: true,
      action: () => this.triggerAction('ai.explain'),
      description: 'AI: Explain selection',
      category: 'AI',
      when: 'editor'
    });

    this.register({
      id: 'ai.refactor',
      key: 'r',
      ctrl: true,
      shift: true,
      action: () => this.triggerAction('ai.refactor'),
      description: 'AI: Refactor selection',
      category: 'AI',
      when: 'editor'
    });

    // Development operations
    this.register({
      id: 'dev.run',
      key: 'b',
      ctrl: true,
      action: () => this.triggerAction('dev.run'),
      description: 'Run build/dev command',
      category: 'Development'
    });

    this.register({
      id: 'dev.test',
      key: 't',
      ctrl: true,
      action: () => this.triggerAction('dev.test'),
      description: 'Run tests',
      category: 'Development'
    });
  }

  // Trigger action by ID (to be overridden by components)
  private triggerAction(actionId: string): void {
    // Dispatch custom event that components can listen to
    const event = new CustomEvent('keyboard-shortcut', {
      detail: { actionId }
    });
    window.dispatchEvent(event);
  }

  // Get formatted shortcut display string
  static formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta) parts.push('Cmd');

    parts.push(shortcut.key.toUpperCase());

    return parts.join('+');
  }

  // Get shortcuts for display in help/command palette
  getShortcutsForDisplay(): Array<{
    category: string;
    shortcuts: Array<{
      id: string;
      description: string;
      shortcut: string;
    }>;
  }> {
    const categories: Record<string, Array<{
      id: string;
      description: string;
      shortcut: string;
    }>> = {};

    for (const shortcut of this.shortcuts.values()) {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = [];
      }

      categories[shortcut.category].push({
        id: shortcut.id,
        description: shortcut.description,
        shortcut: KeyboardShortcutsService.formatShortcut(shortcut)
      });
    }

    return Object.entries(categories).map(([category, shortcuts]) => ({
      category,
      shortcuts
    }));
  }
}

// Singleton instance
export const keyboardShortcuts = new KeyboardShortcutsService();