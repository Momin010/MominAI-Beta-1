import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { getInlineCodeSuggestion } from '../services/aiService';
import { useAI } from '../contexts/AIContext';
import { useTheme } from '../contexts/ThemeContext';
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
  const { performEditorAction } = useAI();
  const { theme } = useTheme();

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const onBreakpointsChangeRef = useRef(onBreakpointsChange);
  useEffect(() => { onBreakpointsChangeRef.current = onBreakpointsChange; }, [onBreakpointsChange]);

  const performEditorActionRef = useRef(performEditorAction);
  useEffect(() => { performEditorActionRef.current = performEditorAction; }, [performEditorAction]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

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
    };
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
    <Editor
      height="100%"
      defaultLanguage="javascript"
      value={value}
      onChange={onChange}
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
      }}
    />
  );
};

export default MonacoEditor;
