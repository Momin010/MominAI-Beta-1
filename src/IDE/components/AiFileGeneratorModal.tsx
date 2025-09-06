
import React, { useState, useEffect } from 'react';
import type { Notification } from '../types';

interface AiFileGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (basePath: string, filename: string, prompt: string) => Promise<void>;
  basePath: string;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
}

const AiFileGeneratorModal: React.FC<AiFileGeneratorModalProps> = ({ isOpen, onClose, onSubmit, basePath, addNotification }) => {
  const [filename, setFilename] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setFilename('');
        setPrompt('');
        setIsGenerating(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);


  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename || !prompt) {
      addNotification({ message: 'Filename and prompt are required.', type: 'warning' });
      return;
    }
    
    setIsGenerating(true);
    try {
      await onSubmit(basePath, filename, prompt);
      onClose(); // Close on success
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      addNotification({ message, type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="frost fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--background-secondary)] text-white rounded-lg shadow-2xl w-full max-w-lg p-6 border border-[var(--border-color)] animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">New File with AI</h2>
        <p className="text-sm text-[var(--gray)] mb-2">Generating file in: <span className="font-mono bg-[var(--gray-dark)] px-1 py-0.5 rounded">{basePath === '' ? '/' : basePath}</span></p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="filename" className="block text-sm font-medium text-gray-300 mb-1">
              Filename
            </label>
            <input
              ref={inputRef}
              type="text"
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g., component.tsx or utils.py"
              className="w-full bg-[var(--gray-dark)] border border-[var(--border-color)] p-2 rounded-md text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
              What should this file do?
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'A React counter component with increment and decrement buttons' or 'A Python function to download a file from a URL'"
              className="w-full bg-[var(--gray-dark)] border border-[var(--border-color)] p-2 rounded-md text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all resize-y"
              rows={4}
              required
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 rounded-md bg-[var(--gray-light)] hover:bg-[var(--gray)] text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-4 py-2 rounded-md bg-[var(--accent)] hover:brightness-125 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              {isGenerating ? 'Generating...' : 'Generate File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiFileGeneratorModal;
