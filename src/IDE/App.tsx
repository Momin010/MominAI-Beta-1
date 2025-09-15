




import React, { useState, useCallback, useRef, createContext, useContext, ReactNode, useEffect } from 'react';

// Providers & Hooks
import { IndexedDBFileSystemProvider, useIndexedDBFileSystem } from './IndexedDBFileSystemProvider.tsx';
import { VMProviderSwitcher } from './VMProviderSwitcher.tsx';
import { useFileSystem } from './hooks/useFileSystem.ts';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useLocalStorageState } from '../hooks/useLocalStorageState.ts';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { CommandPaletteProvider, useCommandPalette } from './hooks/useCommandPalette.ts';
import { allPlugins } from './plugins';
import { AIProvider } from './contexts/AIContext.tsx';
import { generateCodeForFile } from './services/aiService.ts';
import { getAllFiles } from './utils/fsUtils.ts';
import { useNotifications } from './hooks/useNotifications.ts';
import { useTerminalAutomation } from './hooks/useTerminalAutomation.ts';

// UI Components
import Loader from './components/Loader.tsx';
import { AutomatedSetupPanel } from './components/AutomatedSetupPanel.tsx';
import EditorPane from './components/EditorPane.tsx';
import FileExplorer from './components/FileExplorer.tsx';
import TitleBar from './components/TitleBar.tsx';
import CommandPalette from './components/CommandPalette.tsx';
import AiDiffViewModal from './components/AiDiffViewModal.tsx';
import AiFileGeneratorModal from './components/AiFileGeneratorModal.tsx';
import AIAssistant from './components/AIAssistant.tsx';
import LivePreview from './components/LivePreview.tsx';
import AutonomousDevelopmentPanel from './components/AutonomousDevelopmentPanel.tsx';

// New Modular Components
import IDELayout from './components/IDELayout.tsx';
import Toolbar from './components/Toolbar.tsx';
import EditorPanel from './components/EditorPanel.tsx';
import TerminalPanel from './components/TerminalPanel.tsx';
import NotificationSystem from './components/NotificationSystem.tsx';

import type { BottomPanelView, FileAction, Diagnostic, ConsoleMessage, DependencyReport, StoryboardComponent, SearchResult, FileSystemNode } from './types.ts';
import { Icons } from './components/Icon.tsx';
import { analyzeCode } from './services/languageService.ts';



interface IDEWorkspaceProps {
    onLogout: () => void;
    onClose?: () => void;
}

const IDEWorkspace: React.FC<IDEWorkspaceProps> = ({ onLogout, onClose }) => {
    const { isConnected, error, forceSync, getSyncStatus } = useIndexedDBFileSystem();
    const { fs, isLoading: isFsLoading, updateNode, createNode, deleteNode, renameNode, moveNode } = useFileSystem();
    const { registerCommand } = useCommandPalette();
    const { state: automationState, triggerAutomation } = useTerminalAutomation();
    
    // UI State with Persistence
    const [openFiles, setOpenFiles] = useLocalStorageState<string[]>('ide-openFiles', ['/src/App.jsx']);
    const [activeTab, setActiveTab] = useLocalStorageState<string | null>('ide-activeTab', '/src/App.jsx');
    const [activeView, setActiveView] = useLocalStorageState('ide-activeView', 'explorer');
    const [activeBottomTab, setActiveBottomTab] = useLocalStorageState<BottomPanelView>('ide-activeBottomTab', 'terminal');
    const [panelVisibility, setPanelVisibility] = useLocalStorageState('ide-panelVisibility', { activityBar: true, left: true, right: true, bottom: true });
    const [isZenMode, setIsZenMode] = useLocalStorageState('ide-isZenMode', false);

    // Original AI-focused layout state with Persistence
    const [showPreview, setShowPreview] = useLocalStorageState('ide-showPreview', true);
    const [fileTreeCollapsed, setFileTreeCollapsed] = useLocalStorageState('ide-fileTreeCollapsed', false);
    const [terminalVisible, setTerminalVisible] = useLocalStorageState('ide-terminalVisible', true);
    const [showAutonomousPanel, setShowAutonomousPanel] = useLocalStorageState('ide-showAutonomousPanel', false);
    
    // Feature State with Persistence
    const [diagnostics, setDiagnostics] = useLocalStorageState<Diagnostic[]>('ide-diagnostics', []);
    const [consoleMessages, setConsoleMessages] = useLocalStorageState<ConsoleMessage[]>('ide-consoleMessages', []);
    const [dependencyReport, setDependencyReport] = useLocalStorageState<DependencyReport | null>('ide-dependencyReport', null);
    const [storyboardComponents, setStoryboardComponents] = useLocalStorageState<StoryboardComponent[]>('ide-storyboardComponents', []);
    const [diffModalState, setDiffModalState] = useLocalStorageState('ide-diffModalState', { isOpen: false, actions: [], originalFiles: [] });
    const [searchResults, setSearchResults] = useLocalStorageState<SearchResult[]>('ide-searchResults', []);
    const [isSearching, setIsSearching] = useLocalStorageState('ide-isSearching', false);
    const [isFileGeneratorOpen, setIsFileGeneratorOpen] = useLocalStorageState('ide-isFileGeneratorOpen', false);
    const [fileGenBasePath, setFileGenBasePath] = useLocalStorageState('ide-fileGenBasePath', '/');
    const { addNotification } = useNotifications();
    
    // Config State
    const [githubToken, setGithubToken] = useLocalStorageState<string | null>('githubToken', null);

    const previewIframeRef = useRef<HTMLIFrameElement>(null);
    const [previewKey, setPreviewKey] = useLocalStorageState('ide-previewKey', 0);

    const refreshPreview = useCallback(() => {
        // Instead of reloading the entire iframe, try to refresh the content
        if (previewIframeRef.current && previewIframeRef.current.contentWindow) {
            try {
                // Try to reload just the iframe content without full page reload
                previewIframeRef.current.contentWindow.location.reload();
            } catch (error) {
                // Fallback to key-based reload if cross-origin issues
                console.log('Using fallback preview refresh');
                setPreviewKey(prev => prev + 1);
            }
        } else {
            // Fallback for when iframe isn't ready
            setPreviewKey(prev => prev + 1);
        }
    }, []);

     const getFileContent = useCallback((path: string | null): string => {
        if (!path || !fs) return '';
        const parts = path.split('/').filter(p => p);
        let node: FileSystemNode = fs;
        for (const part of parts) {
            if (node.type === 'directory' && node.children[part]) {
                node = node.children[part];
            } else {
                return ''; // Not found
            }
        }
        return node.type === 'file' ? node.content : '';
    }, [fs]);
    
    const runDiagnostics = useCallback((path: string | null) => {
        if (!path) {
            setDiagnostics([]);
            return;
        }
        const content = getFileContent(path);
        const language = path.split('.').pop() || '';
        const newDiagnostics = analyzeCode(content, language);
        setDiagnostics(newDiagnostics);
    }, [getFileContent]);
    

    const handleFileSelect = useCallback((path: string, line?: number) => {
        if (!openFiles.includes(path)) {
            setOpenFiles(prev => [...prev, path]);
        }
        setActiveTab(path);
        runDiagnostics(path);
    }, [openFiles, runDiagnostics]);

    const handleTabClose = useCallback((path: string) => {
        setOpenFiles(prev => {
            const newOpenFiles = prev.filter(p => p !== path);
            if (activeTab === path) {
                const newActiveTab = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null;
                setActiveTab(newActiveTab);
                runDiagnostics(newActiveTab);
            }
            return newOpenFiles;
        });
    }, [activeTab, runDiagnostics]);

    const handleContentChange = useCallback((path: string, content: string) => {
        updateNode(path, content);
        runDiagnostics(path);
    }, [updateNode, runDiagnostics]);

    const performSearch = useCallback((query: string, options: { isCaseSensitive: boolean; isRegex: boolean }) => {
        if (!fs || !query) {
          setSearchResults([]);
          return;
        }
        setIsSearching(true);
        const newResults: SearchResult[] = [];
        const allFiles = getAllFiles(fs, "/");
        
        try {
            const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options.isCaseSensitive ? 'g' : 'gi');
            
            for (const file of allFiles) {
                const lines = file.content.split('\n');
                lines.forEach((line, lineIndex) => {
                    let match;
                    while ((match = regex.exec(line)) !== null) {
                        newResults.push({
                            path: file.path,
                            line: lineIndex + 1,
                            content: line,
                            preMatch: line.substring(0, match.index),
                            match: match[0],
                            postMatch: line.substring(match.index + match[0].length),
                        });
                    }
                });
            }
        } catch (e) {
            addNotification({type: 'error', message: 'Invalid Search Query'});
        }

        setSearchResults(newResults);
        setIsSearching(false);
    }, [fs, addNotification]);

    const replaceAll = useCallback(async (query: string, replaceWith: string, options: { isCaseSensitive: boolean; isRegex: boolean; }) => {
        if (!fs || !query) return;

        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options.isCaseSensitive ? 'g' : 'gi');
        const allFiles = getAllFiles(fs, "/");
        let changesMade = 0;

        for (const file of allFiles) {
            if (regex.test(file.content)) {
                const newContent = file.content.replace(regex, replaceWith);
                if (file.content !== newContent) {
                    await updateNode(file.path, newContent);
                    changesMade++;
                }
            }
        }
        addNotification({type: 'success', message: `Replaced all occurrences in ${changesMade} files.`});
        setSearchResults([]);
    }, [fs, updateNode, addNotification]);

    const openAiFileGenerator = (path: string) => {
        setFileGenBasePath(path || '/');
        setIsFileGeneratorOpen(true);
    };

    const handleAiFileSubmit = async (basePath: string, filename: string, prompt: string) => {
        const fullPath = basePath === '/' ? `/${filename}` : `${basePath}/${filename}`;
        addNotification({ type: 'info', message: `Generating ${filename} with AI...` });
        try {
            const content = await generateCodeForFile(prompt, filename);
            await createNode(fullPath, 'file', content);
            addNotification({ type: 'success', message: `${filename} created successfully!` });
            handleFileSelect(fullPath);
            // Refresh preview after AI file generation
            refreshPreview();
        } catch (e) {
            if (e instanceof Error) addNotification({ type: 'error', message: e.message });
            throw e; // re-throw to keep modal open on error
        }
    };
    
    useEffect(() => {
        runDiagnostics(activeTab);
    }, [activeTab, runDiagnostics]);

    const togglePanel = (panel: 'activityBar' | 'left' | 'right' | 'bottom') => {
        setPanelVisibility(prev => ({ ...prev, [panel]: !prev[panel] }));
    };

    const toggleZenMode = useCallback(() => {
        setIsZenMode(prev => !prev);
    }, []);

    // Register zen mode command
    useEffect(() => {
        registerCommand({
            id: 'zen-mode.toggle',
            label: 'Toggle Zen Mode',
            category: 'View',
            action: toggleZenMode
        });
        
        // Register autonomous development command
        registerCommand({
            id: 'autonomous.toggle',
            label: 'Toggle AI Autonomous Developer',
            category: 'AI',
            action: () => setShowAutonomousPanel(!showAutonomousPanel)
        });
        
        registerCommand({
            id: 'autonomous.build-feature',
            label: 'Build Feature with AI',
            category: 'AI',
            action: () => {
                setShowAutonomousPanel(true);
                setTerminalVisible(false);
            }
        });
    }, [registerCommand, toggleZenMode, showAutonomousPanel]);

    if (!isConnected || isFsLoading) {
        return <Loader />;
    }

    if (error) {
        const isCrossOriginError = error.includes('cross-origin') || error.includes('SharedArrayBuffer') || error.includes('COEP') || error.includes('COOP');
        const isConnectionError = error.includes('connect') || error.includes('backend') || error.includes('server');

        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-red-900/80 text-white p-4">
                <h2 className="text-2xl font-bold mb-4">
                    {isConnectionError ? 'Backend Connection Failed' : 'Environment Setup Required'}
                </h2>
                {isConnectionError ? (
                    <div className="text-center mb-4 max-w-2xl">
                        <p className="mb-4">Could not connect to the backend server. Please ensure:</p>
                        <ul className="text-left list-disc list-inside space-y-2 bg-black/60 p-4 rounded-lg">
                            <li>The backend server is running on port 3001</li>
                            <li>You can access http://localhost:3001/health</li>
                            <li>No firewall is blocking the connection</li>
                            <li>The backend process hasn't crashed</li>
                        </ul>
                        <p className="mt-4 text-sm text-gray-300">
                            Check the backend terminal for error messages and restart if needed.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
                        >
                            Retry Connection
                        </button>
                    </div>
                ) : isCrossOriginError ? (
                    <div className="text-center mb-4 max-w-2xl">
                        <p className="mb-4">This IDE requires cross-origin isolation to run securely. Please ensure:</p>
                        <ul className="text-left list-disc list-inside space-y-2 bg-black/30 p-4 rounded-lg">
                            <li>Your browser supports SharedArrayBuffer (Chrome 88+, Firefox 79+, Edge 88+)</li>
                            <li>The page is served with proper security headers</li>
                            <li>No other tabs from different origins are open</li>
                        </ul>
                        <p className="mt-4 text-sm text-gray-300">
                            Try refreshing the page or opening it in a new browser window.
                        </p>
                    </div>
                ) : (
                    <div className="text-center mb-4">
                        <p>Could not initialize the development environment.</p>
                    </div>
                )}
                <details className="bg-black/70 p-4 rounded-lg text-sm max-w-2xl">
                    <summary className="cursor-pointer">Technical Details</summary>
                    <pre className="mt-2 overflow-auto">{error}</pre>
                </details>
            </div>
        );
    }
    
    return (
        <AIProvider
            activeFile={activeTab}
            getOpenFileContent={() => getFileContent(activeTab)}
            createNode={createNode}
            updateNode={handleContentChange}
            getNode={(path) => null} // simplified
            openFile={handleFileSelect}
            fs={fs}
            setDiffModalState={setDiffModalState}
            refreshPreview={refreshPreview}
            onAICompletion={triggerAutomation}
        >
            <IDELayout
                isZenMode={isZenMode}
                toggleZenMode={toggleZenMode}
                onLogout={onLogout}
                onClose={onClose}
                panelVisibility={panelVisibility}
                onTogglePanel={togglePanel}
            >
                <CommandPalette />
                <AiDiffViewModal {...diffModalState} onClose={() => setDiffModalState(prev => ({ ...prev, isOpen: false }))} />
                <AiFileGeneratorModal
                    isOpen={isFileGeneratorOpen}
                    onClose={() => setIsFileGeneratorOpen(false)}
                    onSubmit={handleAiFileSubmit}
                    basePath={fileGenBasePath}
                    addNotification={addNotification}
                />

                {!isZenMode && <TitleBar onTogglePanel={togglePanel} panelVisibility={panelVisibility} onLogout={onLogout} onClose={onClose} isCrossOriginIsolated={true} />}

                {/* Original AI-Focused Layout */}
                <div className="flex-grow flex min-h-0 gap-2">
                    {/* AI Chat Panel (1/3) */}
                    <div className="w-1/3 glass-light overflow-hidden rounded-xl">
                        <div className="h-full flex flex-col">
                            <div className="p-3 border-b border-white/15 glass-light rounded-t-xl">
                                <h3 className="text-sm font-semibold text-white drop-shadow-lg flex items-center gap-2">
                                    <Icons.Bot className="w-4 h-4" />
                                    AI Assistant
                                </h3>
                            </div>
                            <div className="flex-grow">
                                <AIAssistant />
                            </div>
                        </div>
                    </div>

                    {/* Code Editor Panel (2/3) */}
                    <div className="w-2/3 glass-light overflow-hidden flex flex-col rounded-xl">
                        <Toolbar
                            fileTreeCollapsed={fileTreeCollapsed}
                            onToggleFileTree={() => setFileTreeCollapsed(!fileTreeCollapsed)}
                            showPreview={showPreview}
                            onTogglePreview={() => setShowPreview(!showPreview)}
                            terminalVisible={terminalVisible}
                            onToggleTerminal={() => setTerminalVisible(!terminalVisible)}
                            showAutonomousPanel={showAutonomousPanel}
                            onToggleAutonomousPanel={() => setShowAutonomousPanel(!showAutonomousPanel)}
                        />

                        <div className="flex-1 flex">
                            {/* File Explorer (within 2/3 panel) */}
                            {!fileTreeCollapsed && (
                                <div className="w-64 border-r border-white/15">
                                    <FileExplorer
                                        fs={fs!}
                                        onFileSelect={handleFileSelect}
                                        createNode={createNode}
                                        deleteNode={deleteNode}
                                        renameNode={renameNode}
                                        moveNode={moveNode}
                                        openAiFileGenerator={openAiFileGenerator}
                                    />
                                </div>
                            )}

                            {/* Editor/Preview Area */}
                            <div className="flex-1 flex flex-col">
                                <div className="flex-1">
                                    {showPreview ? (
                                        <LivePreview
                                            isVisible={showPreview}
                                            onToggle={() => setShowPreview(false)}
                                            automationState={automationState}
                                        />
                                    ) : (
                                        <EditorPane
                                            openFiles={openFiles}
                                            activeTab={activeTab}
                                            onTabSelect={setActiveTab}
                                            onTabClose={handleTabClose}
                                            fileContent={getFileContent(activeTab)}
                                            onContentChange={handleContentChange}
                                            diagnostics={diagnostics}
                                            editorActions={[]}
                                            breakpoints={[]}
                                            onBreakpointsChange={() => {}}
                                            pluginViews={{}}
                                        />
                                    )}
                                </div>

                                {/* Terminal or Autonomous Development Panel */}
                                {terminalVisible && !showAutonomousPanel && (
                                    <div className="h-64 border-t border-white/15">
                                        <AutomatedSetupPanel isVisible={terminalVisible} />
                                    </div>
                                )}
                                
                                {/* Autonomous Development Panel */}
                                {showAutonomousPanel && (
                                    <div className="h-64 border-t border-white/15">
                                        <AutonomousDevelopmentPanel
                                            isVisible={showAutonomousPanel}
                                            onToggle={() => setShowAutonomousPanel(false)}
                                            onFileGenerated={(path, content) => {
                                                handleFileSelect(path);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Zen Mode Fullscreen Editor */}
                {isZenMode && (
                    <EditorPane
                        openFiles={openFiles}
                        activeTab={activeTab}
                        onTabSelect={setActiveTab}
                        onTabClose={handleTabClose}
                        fileContent={getFileContent(activeTab)}
                        onContentChange={handleContentChange}
                        editorActions={[]} diagnostics={diagnostics} breakpoints={[]}
                        onBreakpointsChange={() => {}} pluginViews={{}}
                    />
                )}
            </IDELayout>
        </AIProvider>
    );
};

interface AppProps {
    onLogout: () => void;
    onClose?: () => void;
}

const App: React.FC<AppProps> = ({ onLogout, onClose }) => {
    return (
        <ThemeProvider>
            <CommandPaletteProvider>
                <NotificationSystem>
                    <IndexedDBFileSystemProvider>
                        <VMProviderSwitcher>
                            <IDEWorkspace onLogout={onLogout} onClose={onClose} />
                        </VMProviderSwitcher>
                    </IndexedDBFileSystemProvider>
                </NotificationSystem>
            </CommandPaletteProvider>
        </ThemeProvider>
    );
};

export default App;