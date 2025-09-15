import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

// Import Monaco Editor workers directly
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Setup Monaco Environment
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  }
};

interface MonacoWrapperProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  className?: string;
}

const MonacoWrapper: React.FC<MonacoWrapperProps> = ({
  value,
  language,
  onChange,
  options = {},
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create editor
    editorRef.current = monaco.editor.create(containerRef.current, {
      value,
      language,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      ...options
    });

    // Listen for changes
    const subscription = editorRef.current.onDidChangeModelContent(() => {
      const currentValue = editorRef.current?.getValue() || '';
      onChange(currentValue);
    });

    return () => {
      subscription.dispose();
      editorRef.current?.dispose();
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update language when prop changes
  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setModelLanguage(editorRef.current.getModel()!, language);
    }
  }, [language]);

  return (
    <div 
      ref={containerRef} 
      className={`monaco-editor-container ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default MonacoWrapper;