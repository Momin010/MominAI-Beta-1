import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVMProvider } from '../VMProviderSwitcher';
import { getWebSocketClient } from '../../services/websocketClient';
import { useFileSystem } from '../hooks/useFileSystem';
import { Icons } from './Icon';

interface LivePreviewProps {
    isVisible: boolean;
    onToggle?: () => void;
    automationState?: {
        isInstalling: boolean;
        isStartingDev: boolean;
        installProgress: number;
        devProgress: number;
        currentStep: string;
        error: string | null;
    };
}

interface DevServer {
    url: string;
    port: number;
    framework: string;
    status: 'starting' | 'running' | 'stopped';
    proxyUrl?: string;
}

const LivePreview: React.FC<LivePreviewProps> = ({ isVisible, onToggle, automationState }) => {
    const [activeServer, setActiveServer] = useState<DevServer | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { devServers, onTerminalOutput } = useVMProvider();
    const { fs } = useFileSystem();
    const wsClient = getWebSocketClient();

    // Only use WebContainer-managed dev servers
    const allServers = React.useMemo(() => {
        return devServers;
    }, [devServers]);

    // Update active server when servers change
    useEffect(() => {
        if (allServers.length > 0 && !activeServer) {
            setActiveServer(allServers[0]);
        } else if (allServers.length === 0) {
            setActiveServer(null);
        }
    }, [allServers, activeServer]);

    const handleServerSelect = (server: DevServer) => {
        setActiveServer(server);
        setIsLoading(true);

        // Reset loading after iframe loads
        setTimeout(() => setIsLoading(false), 2000);
    };

    // Update active server when selection changes
    useEffect(() => {
        if (activeServer && !allServers.find(s => s.url === activeServer.url)) {
            // Active server is no longer available, select first available
            if (allServers.length > 0) {
                setActiveServer(allServers[0]);
            } else {
                setActiveServer(null);
            }
        }
    }, [allServers, activeServer]);

    const handleOpenInNewTab = () => {
        if (activeServer) {
            window.open(activeServer.url, '_blank');
        }
    };

    const handleRefresh = useCallback(() => {
        if (iframeRef.current) {
            setIsLoading(true);
            iframeRef.current.src = iframeRef.current.src;
            setLastRefreshTime(new Date());
            setTimeout(() => setIsLoading(false), 2000);
        }
    }, []);

    // Auto-refresh functionality
    const debouncedRefresh = useCallback(() => {
        if (!autoRefreshEnabled || !activeServer) return;

        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        refreshTimeoutRef.current = setTimeout(() => {
            console.log('Auto-refreshing preview due to file changes');
            handleRefresh();
        }, 1500); // Debounce auto-refresh by 1.5 seconds
    }, [autoRefreshEnabled, activeServer, handleRefresh]);

    // Monitor file system changes for auto-refresh
    useEffect(() => {
        if (!fs || !autoRefreshEnabled) return;

        // This is a simplified approach - in a real implementation,
        // you'd want to listen to specific file change events
        const checkForChanges = () => {
            // Trigger auto-refresh when file system changes are detected
            debouncedRefresh();
        };

        // For now, we'll use a polling approach (could be improved with WebSocket events)
        const interval = setInterval(checkForChanges, 2000);

        return () => {
            clearInterval(interval);
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [fs, autoRefreshEnabled, debouncedRefresh]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                    <Icons.Eye className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Live Preview</span>

                    {activeServer && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                {activeServer.framework}
                            </div>
                            <span className="text-xs text-gray-500">Port {activeServer.port}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {allServers.length > 1 && (
                        <select
                            value={activeServer?.url || ''}
                            onChange={(e) => {
                                const server = allServers.find(s => s.url === e.target.value);
                                if (server) handleServerSelect(server);
                            }}
                            className="text-xs px-2 py-1 border border-gray-300 rounded"
                        >
                            {allServers.map(server => (
                                <option key={server.url} value={server.url}>
                                    {server.framework} - {server.url}
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                        className={`p-1.5 rounded ${autoRefreshEnabled ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200 text-gray-600'}`}
                        title={autoRefreshEnabled ? 'Disable Auto-Refresh' : 'Enable Auto-Refresh'}
                    >
                        <Icons.Settings className={`w-4 h-4 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={handleRefresh}
                        className="p-1.5 hover:bg-gray-200 rounded"
                        title="Refresh Preview"
                    >
                        <Icons.Settings className="w-4 h-4 text-gray-600" />
                    </button>

                    <button
                        onClick={handleOpenInNewTab}
                        disabled={!activeServer}
                        className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-50"
                        title="Open in New Tab"
                    >
                        <Icons.ExternalLink className="w-4 h-4 text-gray-600" />
                    </button>

                    {onToggle && (
                        <button
                            onClick={onToggle}
                            className="p-1.5 hover:bg-gray-200 rounded"
                            title="Close Preview"
                        >
                            <Icons.X className="w-4 h-4 text-gray-600" />
                        </button>
                    )}
                </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 relative">
                {activeServer ? (
                    <>
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm text-gray-600">Loading preview...</span>
                                </div>
                            </div>
                        )}

                        {/* Automation Progress Overlay */}
                        {(automationState?.isInstalling || automationState?.isStartingDev) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm z-20">
                                <div className="bg-white/90 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
                                    <div className="text-center">
                                        {/* Fun animated icons */}
                                        <div className="mb-6 relative">
                                            {automationState.isInstalling ? (
                                                <div className="flex justify-center space-x-2">
                                                    <div className="w-8 h-8 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                                    <div className="w-8 h-8 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-8 h-8 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full animate-pulse flex items-center justify-center">
                                                        <Icons.Play className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                                            {automationState.isInstalling ? 'Installing Dependencies' : 'Starting Dev Server'}
                                        </h3>

                                        <p className="text-gray-600 mb-6 text-sm">
                                            {automationState.currentStep}
                                        </p>

                                        {/* Progress bars */}
                                        <div className="space-y-3">
                                            {automationState.isInstalling && (
                                                <div>
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>Installing packages</span>
                                                        <span>{automationState.installProgress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                                                            style={{ width: `${automationState.installProgress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}

                                            {automationState.isStartingDev && (
                                                <div>
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>Starting server</span>
                                                        <span>{automationState.devProgress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-pink-400 to-orange-500 h-2 rounded-full transition-all duration-500 ease-out"
                                                            style={{ width: `${automationState.devProgress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Fun loading dots */}
                                        <div className="mt-6 flex justify-center space-x-1">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>

                                        {automationState.error && (
                                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-red-700 text-sm">{automationState.error}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <iframe
                            ref={iframeRef}
                            src={activeServer.proxyUrl || activeServer.url}
                            className="w-full h-full border-none"
                            onLoad={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                            title={`Live Preview - ${activeServer.framework}`}
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Icons.Eye className="w-12 h-12 mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">No Live Preview</h3>
                        <p className="text-sm text-center max-w-md">
                            Start a development server in the terminal (e.g., `npm run dev`) to see your application preview here.
                        </p>
                        <div className="mt-4 text-xs text-gray-400">
                            Supported frameworks: Vite, React, Next.js, Vue, Angular
                        </div>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            {activeServer && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                    <div className="flex justify-between items-center">
                        <span>Previewing: {activeServer.proxyUrl || activeServer.url}</span>
                        <div className="flex items-center gap-2">
                            {activeServer.proxyUrl && (
                                <span className="text-green-600">✓ Proxied</span>
                            )}
                            {lastRefreshTime && (
                                <span className="text-blue-600">
                                    Last refresh: {lastRefreshTime.toLocaleTimeString()}
                                </span>
                            )}
                            <span>{allServers.length} MominAI server{allServers.length !== 1 ? 's' : ''} running</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LivePreview;