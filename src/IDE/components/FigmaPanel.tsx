
import React, { useState, useEffect } from 'react';
import { useNotifications } from '../App';
import { useAI } from '../contexts/AIContext';
import { generateCodeFromFigma } from '../services/aiService';
import { Icons } from './Icon';

const FigmaPanel: React.FC = () => {
    const { addNotification } = useNotifications();
    const { createNode, openFile } = useAI();
    const [figmaUrl, setFigmaUrl] = useState('');
    const [figmaToken, setFigmaToken] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const savedToken = localStorage.getItem('figmaToken');
        if (savedToken) {
            setFigmaToken(savedToken);
        }
    }, []);

    const handleImport = async () => {
        if (!figmaUrl || !figmaToken) {
            addNotification({ type: 'warning', message: 'Figma URL and Access Token are required.' });
            return;
        }
        setIsLoading(true);
        try {
            const generatedCode = await generateCodeFromFigma(figmaUrl, figmaToken, prompt);
            const path = '/figma-imports/import.html';
            createNode(path, 'file', generatedCode);
            addNotification({ type: 'success', message: `Figma design imported to ${path}` });
            openFile(path);
        } catch (error) {
            if (error instanceof Error) addNotification({ type: 'error', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTokenChange = (token: string) => {
        setFigmaToken(token);
        localStorage.setItem('figmaToken', token);
    };

    return (
        <div className="frost text-gray-200 h-full flex flex-col bg-transparent">
            <div className="p-2 border-b border-[var(--border-color)] flex-shrink-0">
                <h2 className="text-sm font-bold uppercase tracking-wider">Figma Import</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Figma File URL</label>
                    <input
                        type="url"
                        value={figmaUrl}
                        onChange={(e) => setFigmaUrl(e.target.value)}
                        placeholder="https://www.figma.com/file/..."
                        className="w-full bg-[var(--gray-dark)] border border-[var(--border-color)] p-2 rounded-md text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Figma Access Token</label>
                    <input
                        type="password"
                        value={figmaToken}
                        onChange={(e) => handleTokenChange(e.target.value)}
                        placeholder="Your personal access token"
                        className="w-full bg-[var(--gray-dark)] border border-[var(--border-color)] p-2 rounded-md text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                    />
                     <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent)] hover:underline mt-1">
                        How to get a token?
                    </a>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Prompt / Hint</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'focus on the login form, make it responsive'"
                        className="w-full bg-[var(--gray-dark)] border border-[var(--border-color)] p-2 rounded-md text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors resize-y"
                        rows={3}
                    />
                </div>
                <button
                    onClick={handleImport}
                    disabled={isLoading || !figmaUrl || !figmaToken}
                    className="w-full bg-[var(--accent)]/80 hover:brightness-125 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? 'Importing...' : 'Import with AI'}
                </button>
            </div>
        </div>
    );
};

export default FigmaPanel;
