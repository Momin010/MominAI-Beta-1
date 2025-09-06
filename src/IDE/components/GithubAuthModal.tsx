
import React, { useState, useRef, useEffect } from 'react';

interface GithubAuthModalProps {
    onClose: () => void;
    onConnect: (token: string) => void;
}

const GithubAuthModal: React.FC<GithubAuthModalProps> = ({ onClose, onConnect }) => {
    const [token, setToken] = useState('');
    const [step, setStep] = useState(1);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (step === 2) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [step]);

    const handleAuthorize = () => {
        const githubTokenUrl = 'https://github.com/settings/tokens/new?scopes=gist&description=MominAI-IDE-Token';
        window.open(githubTokenUrl, '_blank');
        setStep(2);
    };

    const handleConnect = () => {
        if (token.trim()) {
            onConnect(token.trim());
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && step === 2) {
            handleConnect();
        }
    }

    return (
        <div
            className="frost fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--background-secondary)] text-white rounded-lg shadow-2xl w-full max-w-md p-6 border border-[var(--border-color)] animate-fade-in-up"
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {step === 1 && (
                    <>
                        <h2 className="text-xl font-bold mb-2">Authorize MominAI IDE</h2>
                        <p className="text-sm text-[var(--gray)] mb-4">
                            To connect your GitHub account, the IDE needs permission to create Gists on your behalf. This is handled securely via a Personal Access Token.
                        </p>
                        <p className="text-sm text-[var(--gray)] mb-6">
                            You'll be directed to GitHub to generate a secure token with the correct permissions.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-md bg-[var(--gray-light)] hover:bg-[var(--gray)] text-white text-sm font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAuthorize}
                                className="px-4 py-2 rounded-md bg-[var(--accent)] hover:brightness-125 text-white text-sm font-semibold transition-colors"
                            >
                                Authorize on GitHub
                            </button>
                        </div>
                    </>
                )}
                
                {step === 2 && (
                     <>
                        <h2 className="text-xl font-bold mb-2">Complete Connection</h2>
                         <p className="text-sm text-[var(--gray)] mb-4">
                           A new tab has opened. Follow these steps to complete the connection:
                        </p>
                        <ol className="text-sm text-gray-300 list-decimal list-inside space-y-2 mb-4">
                            <li>On the GitHub page, scroll down and click <strong className="text-green-400">"Generate token"</strong>.</li>
                            <li>Copy the new token (it starts with <code className="bg-[var(--gray-dark)] px-1 py-0.5 rounded text-xs">ghp_</code>).</li>
                            <li>Paste the token below and click "Connect".</li>
                        </ol>
                        
                        <div className="mb-4">
                            <label htmlFor="pat-input" className="block text-sm font-medium text-gray-300 mb-1">
                                Personal Access Token
                            </label>
                            <input
                                ref={inputRef}
                                type="password"
                                id="pat-input"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Paste your token here..."
                                className="w-full bg-[var(--gray-dark)] border border-[var(--border-color)] p-2 rounded-md text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-md bg-[var(--gray-light)] hover:bg-[var(--gray)] text-white text-sm font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConnect}
                                disabled={!token.trim()}
                                className="px-4 py-2 rounded-md bg-[var(--accent)] hover:brightness-125 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                Connect
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GithubAuthModal;
