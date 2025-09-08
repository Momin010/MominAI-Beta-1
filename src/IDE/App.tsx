




import React, { useState, useCallback, useRef, createContext, useContext, ReactNode, useEffect } from 'react';

// Providers & Hooks
import { WebContainerProvider, useWebContainer } from './WebContainerProvider.tsx';
import { useFileSystem } from './hooks/useFileSystem.ts';
import { useLocalStorageState } from '../hooks/useLocalStorageState.ts';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { CommandPaletteProvider, useCommandPalette } from './hooks/useCommandPalette.ts';
import { allPlugins } from './plugins';
import { AIProvider } from './contexts/AIContext.tsx';
import { generateCodeForFile } from './services/aiService.ts';
import { getAllFiles } from './utils/fsUtils.ts';


// UI Components
import Loader from './components/Loader.tsx';
import ResizablePanels from './components/ResizablePanels.tsx';
import { Terminal } from './components/Terminal.tsx';
import EditorPane from './components/EditorPane.tsx';
import ActivityBar from './components/ActivityBar.tsx';
import SideBar from './components/SideBar.tsx';
import FileExplorer from './components/FileExplorer.tsx';
import TitleBar from './components/TitleBar.tsx';
import PreviewContainer from './components/PreviewContainer.tsx';
import TabbedPanel from './components/TabbedPanel.tsx';
import CommandPalette from './components/CommandPalette.tsx';
import AiDiffViewModal from './components/AiDiffViewModal.tsx';
import AiFileGeneratorModal from './components/AiFileGeneratorModal.tsx';
import AIAssistant from './components/AIAssistant.tsx';

// Panel Components
import SearchPanel from './components/SearchPanel.tsx';
import SourceControlPanel from './components/SourceControlPanel.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import ProblemsPanel from './components/ProblemsPanel.tsx';
import DebugConsolePanel from './components/DebugConsolePanel.tsx';
import DependencyPanel from './components/DependencyPanel.tsx';
import StoryboardPanel from './components/StoryboardPanel.tsx';
import FigmaPanel from './components/FigmaPanel.tsx';
import ImageToCodePanel from './components/ImageToCodePanel.tsx';


import type { Notification, BottomPanelView, FileAction, Diagnostic, ConsoleMessage, DependencyReport, StoryboardComponent, SearchResult, FileSystemNode } from './types.ts';
import { Icons } from './components/Icon.tsx';
import { analyzeCode } from './services/languageService.ts';


// --- NOTIFICATION SYSTEM ---
const NotificationContext = createContext<{ addNotification: (notification: Omit<Notification, 'id'>) => void; } | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};

const NotificationItem: React.FC<{ notification: Notification; onDismiss: () => void }> = ({ notification, onDismiss }) => {
    const colorClasses = {
        info: 'bg-blue-500/80',
        success: 'bg-green-500/80',
        warning: 'bg-yellow-500/80',
        error: 'bg-red-500/80',
    };
    return (
        <div className={`flex items-center justify-between w-full max-w-sm p-3 text-white rounded-lg shadow-lg ${colorClasses[notification.type]} backdrop-blur-md animate-fade-in-up`}>
            <p className="text-sm">{notification.message}</p>
            <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white-20">
                <Icons.X className="w-4 h-4" />
            </button>
        </div>
    );
};

const NotificationContainer: React.FC<{ notifications: Notification[]; removeNotification: (id: string) => void }> = ({ notifications, removeNotification }) => (
    <div className="fixed bottom-16 right-4 z-[9999] flex flex-col items-end space-y-2">
        {notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onDismiss={() => removeNotification(n.id)} />
        ))}
    </div>
);

const NotificationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(current => current.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(current => [...current, { ...notification, id }]);
        const duration = notification.duration || 5000;
        setTimeout(() => removeNotification(id), duration);
    }, [removeNotification]);

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
        </NotificationContext.Provider>
    );
};

interface IDEWorkspaceProps {
    onLogout: () => void;
    onClose?: () => void;
}

const IDEWorkspace: React.FC<IDEWorkspaceProps> = ({ onLogout, onClose }) => {
    const { isLoading: isWcLoading, error, serverUrl, isCrossOriginIsolated } = useWebContainer();
    const { fs, isLoading: isFsLoading, updateNode, createNode, deleteNode, renameNode, moveNode } = useFileSystem();
    const { registerCommand } = useCommandPalette();
    
    // UI State
    const [openFiles, setOpenFiles] = useState<string[]>(['/src/App.jsx']);
    const [activeTab, setActiveTab] = useState<string | null>('/src/App.jsx');
    const [activeView, setActiveView] = useState('explorer');
    const [activeBottomTab, setActiveBottomTab] = useState<BottomPanelView>('terminal');
    const [panelVisibility, setPanelVisibility] = useState({ activityBar: true, left: true, right: true, bottom: true });
    const [isZenMode, setIsZenMode] = useState(false);

    // New AI-focused layout state
    const [showPreview, setShowPreview] = useState(false);
    const [fileTreeCollapsed, setFileTreeCollapsed] = useState(false);
    const [terminalVisible, setTerminalVisible] = useState(false);
    
    // Feature State
    const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
    const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
    const [dependencyReport, setDependencyReport] = useState<DependencyReport | null>(null);
    const [storyboardComponents, setStoryboardComponents] = useState<StoryboardComponent[]>([]);
    const [diffModalState, setDiffModalState] = useState<{ isOpen: boolean; actions: FileAction[], originalFiles: { path: string, content: string }[], messageIndex?: number }>({ isOpen: false, actions: [], originalFiles: [] });
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFileGeneratorOpen, setIsFileGeneratorOpen] = useState(false);
    const [fileGenBasePath, setFileGenBasePath] = useState('/');
    const { addNotification } = useNotifications();
    
    // Config State
    const [githubToken, setGithubToken] = useLocalStorageState<string | null>('githubToken', null);

    const previewIframeRef = useRef<HTMLIFrameElement>(null);
    const [previewKey, setPreviewKey] = useState(0);

    const refreshPreview = useCallback(() => {
        setPreviewKey(prev => prev + 1);
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
    }, [registerCommand, toggleZenMode]);

    if (isWcLoading || isFsLoading) {
        return <Loader />;
    }

    if (error) {
        const isCrossOriginError = error.includes('cross-origin') || error.includes('SharedArrayBuffer') || error.includes('COEP') || error.includes('COOP');

        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-red-900/50 text-white p-4">
                <h2 className="text-2xl font-bold mb-4">Environment Setup Required</h2>
                {isCrossOriginError ? (
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
                <details className="bg-black/50 p-4 rounded-lg text-sm max-w-2xl">
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
        >
            <div className="w-full h-full bg-transparent flex flex-col p-2 gap-2">
                 <CommandPalette />
                 <AiDiffViewModal {...diffModalState} onClose={() => setDiffModalState(prev => ({ ...prev, isOpen: false }))} />
                 <AiFileGeneratorModal
                    isOpen={isFileGeneratorOpen}
                    onClose={() => setIsFileGeneratorOpen(false)}
                    onSubmit={handleAiFileSubmit}
                    basePath={fileGenBasePath}
                    addNotification={addNotification}
                />

                {!isZenMode && <TitleBar onTogglePanel={togglePanel} panelVisibility={panelVisibility} onLogout={onLogout} onClose={onClose} isCrossOriginIsolated={isCrossOriginIsolated} />}

                {/* New AI-focused layout */}
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
                        {/* Toolbar */}
                        <div className="p-2 border-b border-white/15 glass-light flex items-center justify-between rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setFileTreeCollapsed(!fileTreeCollapsed)}
                                    className="p-1.5 rounded hover:bg-white-10 transition-colors"
                                    title={fileTreeCollapsed ? "Show File Tree" : "Hide File Tree"}
                                >
                                    <Icons.Folder className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={`p-1.5 rounded transition-colors ${showPreview ? 'bg-[var(--accent)]' : 'hover:bg-white-10'}`}
                                    title={showPreview ? "Show Code Editor" : "Show Preview"}
                                >
                                    <Icons.Eye className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setTerminalVisible(!terminalVisible)}
                                    className={`p-1.5 rounded transition-colors ${terminalVisible ? 'bg-[var(--accent)]' : 'hover:bg-white-10'}`}
                                    title={terminalVisible ? "Hide Terminal" : "Show Terminal"}
                                >
                                    <Icons.Terminal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-grow flex min-h-0">
                            {/* File Tree (Collapsible) */}
                            {!fileTreeCollapsed && (
                                <div className="w-64 border-r border-white/15 glass-overlay rounded-l-xl">
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
                            <div className="flex-grow flex flex-col">
                                {showPreview ? (
                                    <PreviewContainer
                                        isVisible={true} title="Live Preview" onClose={() => setShowPreview(false)}
                                        previewContext={null} iframeRef={previewIframeRef}
                                        onToggleInspector={()=>{}} isInspectorActive={false}
                                    >
                                       <iframe key={previewKey} src={serverUrl || ''} className="w-full h-full rounded-b-lg border-none bg-white" />
                                    </PreviewContainer>
                                ) : (
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

                                {/* Terminal (Toggleable) */}
                                {terminalVisible && (
                                    <div className="h-64 border-t border-white/15 glass-overlay rounded-b-xl">
                                        <Terminal />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Zen Mode Fullscreen Editor */}
                {isZenMode && (
                    <div className="fixed inset-0 z-[10000] glass-overlay">
                        <div className="absolute top-4 right-4 z-[10001]">
                            <button
                                onClick={toggleZenMode}
                                className="p-2 glass-strong text-white rounded hover:bg-white/10 transition-colors"
                                title="Exit Zen Mode"
                            >
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="w-full h-full pt-16">
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
                        </div>
                    </div>
                )}
            </div>
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
                <NotificationProvider>
                    <WebContainerProvider>
                        <IDEWorkspace onLogout={onLogout} onClose={onClose} />
                    </WebContainerProvider>
                </NotificationProvider>
            </CommandPaletteProvider>
        </ThemeProvider>
    );
};

export default App;