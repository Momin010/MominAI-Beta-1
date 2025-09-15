import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { getInlineCodeSuggestion } from '../services/aiService';
import { useAI } from '../contexts/AIContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import type { Diagnostic } from '../types';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  path: string;
  diagnostics: Diagnostic[];
  breakpoints: number[];
  onBreakpointsChange: (path: string, newBreakpoints: number[]) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ value, onChange, path, diagnostics, breakpoints, onBreakpointsChange }) => {
  const editorRef = useRef<any>(null);
  const suggestionTimeout = useRef<number | null>(null);
  const decorations = useRef<string[]>([]);
  const autoSaveTimeout = useRef<number | null>(null);
  const { performEditorAction } = useAI();
  const { theme } = useTheme();
  const { addNotification } = useNotifications();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const onBreakpointsChangeRef = useRef(onBreakpointsChange);
  useEffect(() => { onBreakpointsChangeRef.current = onBreakpointsChange; }, [onBreakpointsChange]);

  const performEditorActionRef = useRef(performEditorAction);
  useEffect(() => { performEditorActionRef.current = performEditorAction; }, [performEditorAction]);

  // Auto-save functionality
  const autoSave = useCallback((content: string) => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = window.setTimeout(() => {
      try {
        onChangeRef.current(content);
        setHasUnsavedChanges(false);
        // Optional: Show subtle save indicator
        console.log(`Auto-saved ${path}`);
      } catch (error) {
        console.error('Auto-save failed:', error);
        addNotification({ type: 'error', message: 'Auto-save failed' });
      }
    }, 1000); // Auto-save after 1 second of inactivity
  }, [path, addNotification]);

  // Handle content changes with auto-save
  const handleContentChange = useCallback((newValue: string | undefined) => {
    const content = newValue || '';
    setHasUnsavedChanges(true);
    autoSave(content);
  }, [autoSave]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    console.log('[Monaco Debug] handleEditorDidMount called');
    console.log('[Monaco Debug] Monaco object:', monaco);
    console.log('[Monaco Debug] Monaco loader:', monaco?.loader);

    // Check for AMD loader errors
    if (typeof (window as any).define !== 'function') {
      console.error('[Monaco Debug] AMD loader (define) is not available globally!');
    }
    if (typeof (window as any).require !== 'function') {
      console.error('[Monaco Debug] AMD loader (require) is not available globally!');
    }

    try {
      editorRef.current = editor;
      console.log('[Monaco Debug] Editor reference set');

      // Define theme
      monaco.editor.defineTheme('glass-theme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'c586c0', fontStyle: 'bold' },
          { token: 'string', foreground: 'ce9178' },
          { token: 'number', foreground: 'b5cea8' },
          { token: 'type', foreground: '4ec9b0' },
          { token: 'delimiter', foreground: 'd4d4d4' },
          { token: 'tag', foreground: '569cd6' },
          { token: 'attribute.name', foreground: '9cdcfe' },
          { token: 'attribute.value', foreground: 'ce9178' },
        ],
        colors: {
          'editor.background': '#00000000',
          'editor.foreground': '#d4d4d4',
          'editorGutter.background': '#00000000',
          'editorLineNumber.foreground': '#858585',
          'editorLineNumber.activeForeground': '#c6c6c6',
          'editorCursor.foreground': '#ffffff',
          'editor.selectionBackground': 'rgba(79, 70, 229, 0.3)',
          'editorWidget.background': '#25252c',
          'minimap.background': '#00000000',
          'editorHoverWidget.background': 'var(--background-secondary)',
          'editorHoverWidget.border': 'var(--border-color)',
        }
      });
      console.log('[Monaco Debug] Theme defined');

      // Add keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        // Manual save
        if (autoSaveTimeout.current) {
          clearTimeout(autoSaveTimeout.current);
          autoSaveTimeout.current = null;
        }
        const content = editor.getValue();
        onChangeRef.current(content);
        setHasUnsavedChanges(false);
        addNotification({ type: 'success', message: 'File saved manually' });
      });

      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
        // Format document
        editor.getAction('editor.action.formatDocument').run();
      });

      // Add actions
      editor.addAction({
        id: 'ai-explain-code',
        label: 'AI: Explain Selection',
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        precondition: 'editorHasSelection',
        run: (ed: any) => {
          const sel = ed.getSelection();
          if (sel) {
            const txt = ed.getModel().getValueInRange(sel);
            performEditorActionRef.current('explain', txt, ed.getModel().uri.path);
          }
        }
      });
      editor.addAction({
        id: 'ai-refactor-code',
        label: 'AI: Refactor Selection',
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.6,
        precondition: 'editorHasSelection',
        run: (ed: any) => {
          const sel = ed.getSelection();
          if (sel) {
            const txt = ed.getModel().getValueInRange(sel);
            performEditorActionRef.current('refactor', txt, ed.getModel().uri.path);
          }
        }
      });
      editor.addAction({
        id: 'ai-find-bugs',
        label: 'AI: Find Bugs in Selection',
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.7,
        precondition: 'editorHasSelection',
        run: (ed: any) => {
          const sel = ed.getSelection();
          if (sel) {
            const txt = ed.getModel().getValueInRange(sel);
            performEditorActionRef.current('find_bugs', txt, ed.getModel().uri.path);
          }
        }
      });

      // Handle breakpoints
      editor.onMouseDown((event: any) => {
        if (event.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
          const modelPath = editor.getModel()?.uri.path;
          if (modelPath) {
            const lineNumber = event.target.position.lineNumber;
            const currentBreakpoints = editor.getModel().getLineDecorations(lineNumber).some((d: any) => d.options.glyphMarginClassName === 'monaco-breakpoint')
              ? breakpoints.filter(b => b !== lineNumber)
              : [...breakpoints, lineNumber].sort((a, b) => a - b);
            onBreakpointsChangeRef.current(modelPath, currentBreakpoints);
          }
        }
      });

      // Register inline completions
      monaco.languages.registerInlineCompletionsProvider({ pattern: '**/*' }, {
        async provideInlineCompletions(model: any, position: any, context: any, token: any) {
          if (suggestionTimeout.current) { clearTimeout(suggestionTimeout.current); }
          return new Promise(resolve => {
            suggestionTimeout.current = window.setTimeout(async () => {
              if (token.isCancellationRequested) { resolve({ items: [] }); return; }
              const textBefore = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
              try {
                const suggestion = await getInlineCodeSuggestion(textBefore);
                if (token.isCancellationRequested || !suggestion) { resolve({ items: [] }); return; }
                resolve({ items: [{ insertText: suggestion }] });
              } catch (e) { console.error("Code suggestion error:", e); resolve({ items: [] }); }
            }, 500);
          });
        },
        freeInlineCompletions() {}
      });

      // Resize observer
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => editor.layout());
      });
      resizeObserver.observe(editor.getDomNode());

      // Cleanup on unmount
      return () => {
        resizeObserver.disconnect();
        if (suggestionTimeout.current) { clearTimeout(suggestionTimeout.current); }
        if (autoSaveTimeout.current) { clearTimeout(autoSaveTimeout.current); }
      };
      console.log('[Monaco Debug] handleEditorDidMount completed successfully');
    } catch (error) {
      console.error('[Monaco Debug] Error in handleEditorDidMount:', error);
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const monaco = (window as any).monaco;
      if (monaco) {
        monaco.editor.setTheme('glass-theme');
      }
    }
  }, [theme]);

  useEffect(() => {
    if (editorRef.current && path) {
      const monaco = (window as any).monaco;
      if (monaco) {
        const uri = monaco.Uri.parse(path);
        let model = monaco.editor.getModel(uri);
        if (!model) {
          model = monaco.editor.createModel(value, undefined, uri);
        } else if (model.getValue() !== value) {
          model.setValue(value);
        }
        if (editorRef.current.getModel() !== model) {
          editorRef.current.setModel(model);
        }
      }
    }
  }, [path, value]);

  useEffect(() => {
    if (editorRef.current && (window as any).monaco && editorRef.current.getModel()?.uri.path === path) {
      const monaco = (window as any).monaco;
      const newDecorations = breakpoints.map(lineNumber => ({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: { isWholeLine: false, glyphMarginClassName: 'monaco-breakpoint' }
      }));
      decorations.current = editorRef.current.deltaDecorations(decorations.current, newDecorations);
    } else {
      decorations.current = editorRef.current?.deltaDecorations(decorations.current, []) || [];
    }
  }, [breakpoints, path]);

  useEffect(() => {
    if ((window as any).monaco && path) {
      const monaco = (window as any).monaco;
      const model = monaco.editor.getModel(monaco.Uri.parse(path));
      if (model) {
        const markers = diagnostics.map(d => ({
          startLineNumber: d.line,
          startColumn: d.startCol,
          endLineNumber: d.line,
          endColumn: d.endCol,
          message: d.message,
          severity: monaco.MarkerSeverity[d.severity.charAt(0).toUpperCase() + d.severity.slice(1)],
          source: d.source,
        }));
        monaco.editor.setModelMarkers(model, 'owner', markers);
      }
    }
  }, [diagnostics, path]);

  return (
    <div className="relative h-full">
      {hasUnsavedChanges && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
          Unsaved changes
        </div>
      )}
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={value}
        onChange={handleContentChange}
        onMount={handleEditorDidMount}
        theme="glass-theme"
        options={{
          automaticLayout: false,
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          inlineSuggest: { enabled: true },
          contextmenu: true,
          glyphMargin: true,
          padding: { top: 10 },
          formatOnType: true,
        }}
        // Configure Monaco to use local ESM build and workers
        beforeMount={(monaco) => {
          console.log('[Monaco Debug] beforeMount called, configuring Monaco environment');
          try {
            // Configure Monaco to use local paths for workers
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
              noLib: true,
              allowNonTsExtensions: true,
            });
            console.log('[Monaco Debug] Compiler options set');

            // Configure Monaco to use local worker files and prevent CDN loading
            console.log(`[Monaco Debug] Global AMD loader check:`);
            console.log(`[Monaco Debug] - window.define:`, typeof (window as any).define);
            console.log(`[Monaco Debug] - window.require:`, typeof (window as any).require);
            console.log(`[Monaco Debug] - Monaco loader:`, typeof (window as any).monaco?.loader);

            try {
              (window as any).MonacoEnvironment = {
                baseUrl: '/monaco-editor'
              };
            } catch (error) {
              console.error('[Monaco Debug] Error configuring MonacoEnvironment:', error);
            }
            console.log('[Monaco Debug] MonacoEnvironment configured with local ESM build');
          } catch (error) {
            console.error('[Monaco Debug] Error in beforeMount:', error);
          }
        }}
      />
    </div>
  );
};

export default MonacoEditor;
