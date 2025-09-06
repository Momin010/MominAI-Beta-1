
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCommandPalette } from '../hooks/useCommandPalette';
import type { Command } from '../types';

const CommandPalette: React.FC = () => {
  const { isOpen, setIsOpen, commands } = useCommandPalette();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    if (!searchTerm) return commands;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(lowerCaseSearch) ||
      cmd.category?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm, commands]);
  
  const groupedCommands = useMemo(() => {
      const groups: Record<string, Command[]> = {};
      filteredCommands.forEach(cmd => {
          const category = cmd.category || 'General';
          if (!groups[category]) {
              groups[category] = [];
          }
          groups[category].push(cmd);
      });
      return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredCommands]);

  const flatCommandList = useMemo(() => groupedCommands.flatMap(([, cmds]) => cmds), [groupedCommands]);

  useEffect(() => {
    if (activeIndex >= flatCommandList.length) {
      setActiveIndex(Math.max(0, flatCommandList.length - 1));
    }
  }, [flatCommandList, activeIndex]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % flatCommandList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + flatCommandList.length) % flatCommandList.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = flatCommandList[activeIndex];
      if (command) {
        command.action();
        setIsOpen(false);
      }
    }
  };
  
  const handleCommandClick = (command: Command) => {
    command.action();
    setIsOpen(false);
  };


  if (!isOpen) return null;

  return (
    <div
      className="frost fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 pt-20"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-[var(--background-secondary)]/90 backdrop-blur-lg text-white rounded-lg shadow-2xl w-full max-w-2xl border border-[var(--border-color)] animate-fade-in-up"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-2 border-b border-[var(--border-color)]">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setActiveIndex(0);
            }}
            className="w-full bg-transparent p-2 text-base outline-none placeholder:text-[var(--gray)]"
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {groupedCommands.length > 0 ? (
             groupedCommands.map(([category, cmds], groupIndex) => (
                 <div key={category} className="p-2">
                    {groupIndex > 0 && <div className="border-b border-[var(--border-color)] my-1"></div>}
                     <h3 className="text-xs font-bold uppercase text-[var(--gray)] px-3 py-1">{category}</h3>
                     <ul>
                         {cmds.map((cmd) => {
                            const isSelected = flatCommandList[activeIndex]?.id === cmd.id;
                            return (
                                <li
                                  key={cmd.id}
                                  onClick={() => handleCommandClick(cmd)}
                                  className={`p-3 rounded-md cursor-pointer flex items-center justify-between text-sm transition-colors ${
                                    isSelected ? 'bg-[var(--accent)] text-white' : 'hover:bg-white-10'
                                  }`}
                                >
                                  <span>{cmd.label}</span>
                                </li>
                            );
                         })}
                     </ul>
                 </div>
             ))
          ) : (
            <p className="p-4 text-center text-gray-400">No commands found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
