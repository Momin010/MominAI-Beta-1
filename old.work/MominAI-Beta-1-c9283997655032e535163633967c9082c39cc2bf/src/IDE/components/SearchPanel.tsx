
import React, { useState } from 'react';
import type { SearchResult } from '../types';
import { Icons } from './Icon';

interface SearchPanelProps {
  performSearch: (query: string, options: { isCaseSensitive: boolean, isRegex: boolean }) => void;
  isSearching: boolean;
  searchResults: SearchResult[];
  onResultClick: (path: string) => void;
  replaceAll: (query: string, replaceWith: string, options: { isCaseSensitive: boolean; isRegex: boolean; }) => Promise<void>;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ performSearch, isSearching, searchResults, onResultClick, replaceAll }) => {
  const [query, setQuery] = useState('');
  const [replace, setReplace] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isRegex, setIsRegex] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query) {
      performSearch(query, { isCaseSensitive, isRegex });
    }
  };
  
  const handleReplaceAll = () => {
    if (!query) {
        alert("Please enter a search query first.");
        return;
    }
    if (window.confirm(`Are you sure you want to replace all occurrences of "${query}" with "${replace}" in the entire workspace?`)) {
        replaceAll(query, replace, { isCaseSensitive, isRegex });
    }
  };

  const resultsByFile = (searchResults as SearchResult[]).reduce((acc, result) => {
    if (!acc[result.path]) {
      acc[result.path] = [];
    }
    acc[result.path].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="frost text-gray-200 h-full flex flex-col bg-transparent">
      <div className="p-2 border-b border-[var(--border-color)] flex-shrink-0">
        <h2 className="text-sm font-bold uppercase tracking-wider">Search & Replace</h2>
      </div>
      <div className="p-2">
        <form onSubmit={handleSearch} className="flex flex-col space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-[var(--gray-dark)] border border-[var(--border-color)] w-full p-2 pr-10 rounded-md text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <Icons.Search className="w-5 h-5"/>
            </button>
          </div>
           <div className="relative">
            <input
              type="text"
              placeholder="Replace"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              className="bg-[var(--gray-dark)] border border-[var(--border-color)] w-full p-2 rounded-md text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <div className="flex space-x-2 justify-between items-center">
            <button 
                type="button" 
                onClick={handleReplaceAll}
                disabled={!query}
                className="bg-[var(--accent)]/80 hover:brightness-125 text-white text-xs font-semibold px-3 py-1.5 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                Replace All
            </button>
            <div className="flex space-x-2">
                <button 
                    type="button" 
                    onClick={() => setIsCaseSensitive(!isCaseSensitive)} 
                    title="Match Case"
                    className={`p-1.5 rounded-md ${isCaseSensitive ? 'bg-[var(--accent)]' : 'bg-[var(--gray-light)]'} hover:bg-[var(--gray)] transition-colors`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 15 4-8 4 8"/><path d="M4 13h6"/><path d="M15 20v-5.5a2.5 2.5 0 0 1 5 0V20"/><path d="M15 17h5"/></svg>
                </button>
                <button 
                    type="button" 
                    onClick={() => setIsRegex(!isRegex)} 
                    title="Use Regular Expression"
                    className={`p-1.5 rounded-md ${isRegex ? 'bg-[var(--accent)]' : 'bg-[var(--gray-light)]'} hover:bg-[var(--gray)] transition-colors`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M4.2 4.2a8.8 8.8 0 0 0 0 15.6A8.8 8.8 0 0 0 19.8 4.2a8.8 8.8 0 0 0-15.6 0Z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/></svg>
                </button>
            </div>
          </div>
        </form>
      </div>

      <div className="flex-grow overflow-y-auto p-1 text-sm">
        {isSearching ? (
          <p className="p-2 text-gray-400">Searching...</p>
        ) : (
          Object.entries(resultsByFile).map(([path, results]) => (
            <div key={path}>
              <h3 
                className="font-bold text-white px-2 py-1 cursor-pointer hover:bg-[var(--gray-dark)]/50 rounded-md"
                onClick={() => onResultClick(path)}
              >
                {path} ({(results as SearchResult[]).length})
              </h3>
              {(results as SearchResult[]).map((result, index) => (
                <div 
                    key={`${path}-${result.line}-${index}`} 
                    className="flex p-2 pl-4 cursor-pointer hover:bg-[var(--gray-dark)]/50 rounded-md"
                    onClick={() => onResultClick(path)}
                >
                    <span className="text-gray-500 mr-2 w-8 text-right flex-shrink-0">{result.line}:</span>
                    <p className="truncate">
                        <span className="text-gray-400">{result.preMatch}</span>
                        <span className="bg-yellow-500/30 text-yellow-200 rounded-sm px-1">{result.match}</span>
                        <span className="text-gray-400">{result.postMatch}</span>
                    </p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
