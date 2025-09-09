import React, { useState, useEffect, useRef } from 'react';
import { useRemoteVM } from '../RemoteVMProvider';
import { getWebSocketClient } from '../../services/websocketClient';
import { Icons } from './Icon';

interface LivePreviewProps {
    isVisible: boolean;
    onToggle?: () => void;
}

interface DevServer {
    url: string;
    port: number;
    framework: string;
    status: 'starting' | 'running' | 'stopped';
}

const LivePreview: React.FC<LivePreviewProps> = ({ isVisible, onToggle }) => {
    const [devServers, setDevServers] = useState<DevServer[]>([]);
    const [activeServer, setActiveServer] = useState<DevServer | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const { onTerminalOutput } = useRemoteVM();
    const wsClient = getWebSocketClient();

    // Detect dev server URLs from terminal output
    const detectDevServer = (output: string) => {
        const urlPatterns = [
            // Vite
            /Local:\s+(http:\/\/localhost:\d+)/i,
            /Network:\s+(http:\/\/[\d\.]+:\d+)/i,
            // React
            /Local:\s+(http:\/\/localhost:\d+)/i,
            // Next.js
            /ready\s+-\s+started\s+server\s+on\s+(http:\/\/localhost:\d+)/i,
            // Generic localhost URLs
            /(http:\/\/localhost:\d+)/g,
            /(http:\/\/127\.0\.0\.1:\d+)/g,
            /(http:\/\/[\d\.]+:\d+)/g
        ];

        for (const pattern of urlPatterns) {
            const matches = output.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const url = match.trim();
                    const portMatch = url.match(/:(\d+)/);
                    if (portMatch) {
                        const port = parseInt(portMatch[1]);
                        const framework = detectFramework(output);

                        const newServer: DevServer = {
                            url,
                            port,
                            framework,
                            status: 'running'
                        };

                        setDevServers(prev => {
                            const existing = prev.find(s => s.url === url);
                            if (!existing) {
                                console.log('🎯 Detected dev server:', newServer);
                                return [...prev, newServer];
                            }
                            return prev;
                        });

                        // Auto-select first server
                        if (!activeServer) {
                            setActiveServer(newServer);
                        }
                    }
                }
            }
        }
    };

    const detectFramework = (output: string): string => {
        if (output.includes('VITE')) return 'Vite';
        if (output.includes('React')) return 'React';
        if (output.includes('Next.js')) return 'Next.js';
        if (output.includes('Vue')) return 'Vue';
        if (output.includes('Angular')) return 'Angular';
        return 'Unknown';
    };

    // Listen for terminal output to detect dev servers
    useEffect(() => {
        const handleTerminalOutput = (data: any) => {
            console.log('🔍 LivePreview received terminal output:', data);
            if (data && data.data) {
                detectDevServer(data.data);
            } else if (typeof data === 'string') {
                detectDevServer(data);
            }
        };

        // Subscribe to terminal output from RemoteVMProvider
        if (onTerminalOutput) {
            onTerminalOutput(handleTerminalOutput);
        }

        // Also listen directly to WebSocket for container_output messages
        wsClient.onMessage('container_output', handleTerminalOutput);

        return () => {
            // Cleanup WebSocket listener
            wsClient.offMessage('container_output', handleTerminalOutput);
        };
    }, [onTerminalOutput, wsClient]);

    const handleServerSelect = (server: DevServer) => {
        setActiveServer(server);
        setIsLoading(true);

        // Reset loading after iframe loads
        setTimeout(() => setIsLoading(false), 2000);
    };

    const handleOpenInNewTab = () => {
        if (activeServer) {
            window.open(activeServer.url, '_blank');
        }
    };

    const handleRefresh = () => {
        if (iframeRef.current) {
            setIsLoading(true);
            iframeRef.current.src = iframeRef.current.src;
            setTimeout(() => setIsLoading(false), 2000);
        }
    };

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
                    {devServers.length > 1 && (
                        <select
                            value={activeServer?.url || ''}
                            onChange={(e) => {
                                const server = devServers.find(s => s.url === e.target.value);
                                if (server) handleServerSelect(server);
                            }}
                            className="text-xs px-2 py-1 border border-gray-300 rounded"
                        >
                            {devServers.map(server => (
                                <option key={server.url} value={server.url}>
                                    {server.framework} - {server.url}
                                </option>
                            ))}
                        </select>
                    )}

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
                        <iframe
                            ref={iframeRef}
                            src={activeServer.url}
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
                        <span>Previewing: {activeServer.url}</span>
                        <span>{devServers.length} server{devServers.length !== 1 ? 's' : ''} detected</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LivePreview;