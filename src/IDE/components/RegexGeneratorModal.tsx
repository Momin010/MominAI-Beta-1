
import React, { useState, useEffect } from 'react';
import type { Notification } from '../types';
import { generateRegex } from '../services/aiService';

interface RegexGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
}

const RegexGeneratorModal: React.FC<RegexGeneratorModalProps> = ({ isOpen, onClose, addNotification }) => {
  const [description, setDescription] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setResult('');
      setIsGenerating(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    setIsGenerating(true);
    setResult('');
    try {
      const regex = await generateRegex(description);
      setResult(regex);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      addNotification({ message, type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    addNotification({ type: 'success', message: 'Regex copied to clipboard!' });
    onClose();
  }

  return (
    <div className="frost fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-[var(--background-secondary)] text-white rounded-lg shadow-2xl w-full max-w-lg p-6 border border-[var(--border-color)] animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Generate Regular Expression</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Describe the pattern you want to match:</label>
            <input
              ref={inputRef} type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., a valid email address"
              className="w-full bg-[var(--gray-dark)] border border-[var(--border-color)] p-2 rounded-md text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors" required
            />
          </div>
          <button type="submit" disabled={isGenerating} className="w-full px-4 py-2 rounded-md bg-[var(--accent)] hover:brightness-125 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-wait">
            {isGenerating ? 'Generating...' : 'Generate Regex'}
          </button>
        </form>

        {result && (
            <div className="mt-6">
                <h3 className="text-md font-semibold mb-2">Generated Regex:</h3>
                <div className="flex items-center space-x-2 bg-[var(--gray-dark)]/50 p-3 rounded-lg font-mono text-green-400 border border-[var(--border-color)]">
                    <span className="flex-grow break-all">{result}</span>
                     <button onClick={handleCopy} className="text-sm bg-[var(--gray-light)] hover:bg-[var(--gray)] rounded-lg px-3 py-1.5 transition-colors text-white font-semibold">
                        Copy
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default RegexGeneratorModal;
