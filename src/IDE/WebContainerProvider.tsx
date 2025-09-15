import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';
import { registerWebContainerServer, unregisterWebContainerServer } from '../../api/webcontainer-proxy/[...path]';
import fileSystemSync from './services/fileSystemSync';

interface DevServer {
    url: string;
    port: number;
    framework: string;
    status: 'starting' | 'running' | 'stopped';
    proxyUrl?: string;
}

interface RemoteVMContextType {
    isConnected: boolean;
    serverUrl: string | null;
    error: string | null;
    container: WebContainer | null;
    terminals: Map<string, any>;
    processes: Map<string, any>;
    devServers: DevServer[];
    connect: () => Promise<void>;
    disconnect: () => void;
    createTerminal: (terminalId: string) => void;
    runCommand: (command: string, args?: string[], cwd?: string, env?: Record<string, string>) => Promise<string>;
    stopProcess: (processId: string) => void;
    readFile: (path: string) => void;
    writeFile: (path: string, content: string) => void;
    listDirectory: (path: string) => void;
    createDirectory: (path: string) => void;
    deleteFile: (path: string) => void;
    startDevServer: (cwd?: string, port?: number) => void;
    onTerminalOutput: (callback: (data: any) => void) => void;
    onProcessOutput: (callback: (data: any) => void) => void;
    onFileContent: (callback: (data: any) => void) => void;
    onDirectoryListing: (callback: (data: any) => void) => void;
}

const RemoteVMContext = createContext<RemoteVMContextType | undefined>(undefined);

export const useRemoteVM = () => {
    const context = useContext(RemoteVMContext);
    if (!context) {
        throw new Error('useRemoteVM must be used within a RemoteVMProvider');
    }
    return context;
};

interface RemoteVMProviderProps {
    children: ReactNode;
    sessionId?: string;
}

// Global WebContainer singleton to prevent multiple instances
let globalWebContainer: WebContainer | null = null;
let globalContainerPromise: Promise<WebContainer> | null = null;

export const WebContainerProvider: React.FC<RemoteVMProviderProps> = ({
    children,
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [terminals] = useState(new Map());
    const [processes] = useState(new Map());
    const [container, setContainer] = useState<WebContainer | null>(null);
    const [devServers, setDevServers] = useState<DevServer[]>([]);

    // Callback arrays
    const [terminalOutputCallbacks] = useState<Array<(data: any) => void>>([]);
    const [processOutputCallbacks] = useState<Array<(data: any) => void>>([]);
    const [fileContentCallbacks] = useState<Array<(data: any) => void>>([]);
    const [directoryListingCallbacks] = useState<Array<(data: any) => void>>([]);

    const connect = useCallback(async () => {
        try {
            setError(null);
            console.log('🔌 Getting WebContainer instance...');
            
            // Check if we already have a global instance
            if (globalWebContainer) {
                console.log('♻️ Reusing existing WebContainer instance');
                setContainer(globalWebContainer);
                // Ensure file system sync has the WebContainer instance
                fileSystemSync.setWebContainer(globalWebContainer);
                try {
                    await fileSystemSync.syncToWebContainer();
                } catch (error) {
                    console.error('Failed to sync to WebContainer:', error);
                }
                setIsConnected(true);
                setServerUrl(null);
                return;
            }
            
            // Check if we're already booting
            if (globalContainerPromise) {
                console.log('⏳ Waiting for existing WebContainer boot...');
                const webContainer = await globalContainerPromise;
                setContainer(webContainer);
                // Ensure file system sync has the WebContainer instance
                fileSystemSync.setWebContainer(webContainer);
                try {
                    await fileSystemSync.syncToWebContainer();
                } catch (error) {
                    console.error('Failed to sync to WebContainer:', error);
                }
                setIsConnected(true);
                setServerUrl(null);
                return;
            }
            
            // Boot new instance
            console.log('🚀 Booting new WebContainer instance...');
            globalContainerPromise = WebContainer.boot();
            const webContainer = await globalContainerPromise;
            
            globalWebContainer = webContainer;
            setContainer(webContainer);
            // Initialize file system sync with WebContainer instance
            fileSystemSync.setWebContainer(webContainer);
            try {
                await fileSystemSync.syncToWebContainer();
            } catch (error) {
                console.error('Failed to sync to WebContainer:', error);
            }
            setIsConnected(true);
            setServerUrl(null);
            console.log('✅ WebContainer booted successfully');
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to boot WebContainer';
            console.error('❌ WebContainer boot failed:', errorMessage);
            globalContainerPromise = null; // Reset on failure
            setError(errorMessage);
            throw error;
        }
    }, []);

    const disconnect = useCallback(() => {
        // Don't destroy the global instance, just disconnect this provider
        setContainer(null);
        setIsConnected(false);
        setServerUrl(null);
        setError(null);
        terminals.clear();
        processes.clear();

        // Unregister all dev servers
        devServers.forEach(server => {
            unregisterWebContainerServer(sessionId);
        });
        setDevServers([]);
    }, [terminals, processes, devServers, sessionId]);

    const createTerminal = useCallback((terminalId: string) => {
        if (!container) return;
        // For WebContainer, we can spawn a shell process
        const shellProcess = container.spawn('sh', [], { cwd: '/' });
        terminals.set(terminalId, shellProcess);
        console.log(`Terminal ${terminalId} created`);
    }, [container, terminals]);

    const runCommand = useCallback(async (command: string, args: string[] = [], cwd = '/', env: Record<string, string> = {}) => {
        if (!container) throw new Error('WebContainer not connected');

        const processId = `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const process = await container.spawn(command, args, { cwd, env });

        processes.set(processId, process);

        // Listen to output
        process.output.pipeTo(new WritableStream({
            write(data) {
                processOutputCallbacks.forEach(callback => callback({ processId, data }));
            }
        }));

        return processId;
    }, [container, processes, processOutputCallbacks]);

    const stopProcess = useCallback((processId: string) => {
        const process = processes.get(processId);
        if (process) {
            process.kill();
            processes.delete(processId);
        }
    }, [processes]);

    const readFile = useCallback(async (path: string) => {
        if (!container) return;
        try {
            const content = await container.fs.readFile(path, 'utf8');
            fileContentCallbacks.forEach(callback => callback({ path, content }));
        } catch (error) {
            console.error('Error reading file:', error);
        }
    }, [container, fileContentCallbacks]);

    const writeFile = useCallback(async (path: string, content: string) => {
        if (!container) return;
        try {
            await container.fs.writeFile(path, content);
        } catch (error) {
            console.error('Error writing file:', error);
        }
    }, [container]);

    const listDirectory = useCallback(async (path: string) => {
        if (!container) return;
        try {
            const files = await container.fs.readdir(path);
            directoryListingCallbacks.forEach(callback => callback({ path, files }));
        } catch (error) {
            console.error('Error listing directory:', error);
        }
    }, [container, directoryListingCallbacks]);

    const createDirectory = useCallback(async (path: string) => {
        if (!container) return;
        try {
            await container.fs.mkdir(path, { recursive: true });
        } catch (error) {
            console.error('Error creating directory:', error);
        }
    }, [container]);

    const deleteFile = useCallback(async (path: string) => {
        if (!container) return;
        try {
            await container.fs.rm(path, { recursive: true });
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }, [container]);

    // Detect dev server from terminal output
    const detectDevServer = useCallback((output: string) => {
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
                                // Register with proxy
                                registerServerWithProxy(newServer);
                                return [...prev, newServer];
                            }
                            return prev;
                        });
                    }
                }
            }
        }
    }, []);

    const detectFramework = (output: string): string => {
        if (output.includes('VITE')) return 'Vite';
        if (output.includes('React')) return 'React';
        if (output.includes('Next.js')) return 'Next.js';
        if (output.includes('Vue')) return 'Vue';
        if (output.includes('Angular')) return 'Angular';
        return 'Unknown';
    };

    const registerServerWithProxy = useCallback(async (server: DevServer) => {
        if (!container) return;

        try {
            // For WebContainer, the server is automatically exposed
            // We'll use the detected server URL as the base and create a proxy mapping
            const proxyUrl = `/api/webcontainer-proxy/${sessionId}`;

            // Register with the proxy API - we'll pass the detected server info
            await fetch('/api/webcontainer-proxy/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    url: server.url,
                    port: server.port
                })
            });

            // Update the server with proxy URL
            setDevServers(prev => prev.map(s =>
                s.url === server.url
                    ? { ...s, proxyUrl: `${proxyUrl}` }
                    : s
            ));

            console.log('✅ Registered server with proxy:', server.url, '->', proxyUrl);
        } catch (error) {
            console.error('❌ Failed to register server with proxy:', error);
        }
    }, [container, sessionId]);

    const startDevServer = useCallback(async (cwd = '/', port = 5173) => {
        if (!container) return;
        // Run npm run dev in the container
        await runCommand('npm', ['run', 'dev'], cwd, { PORT: port.toString() });
    }, [container, runCommand]);

    const onTerminalOutput = useCallback((callback: (data: any) => void) => {
        terminalOutputCallbacks.push(callback);
    }, [terminalOutputCallbacks]);

    const onProcessOutput = useCallback((callback: (data: any) => void) => {
        processOutputCallbacks.push(callback);
    }, [processOutputCallbacks]);

    const onFileContent = useCallback((callback: (data: any) => void) => {
        fileContentCallbacks.push(callback);
    }, [fileContentCallbacks]);

    const onDirectoryListing = useCallback((callback: (data: any) => void) => {
        directoryListingCallbacks.push(callback);
    }, [directoryListingCallbacks]);

    // Auto-connect on mount
    useEffect(() => {
        const autoConnect = async () => {
            try {
                console.log('🚀 Starting WebContainer auto-connect...');
                await connect();
                console.log('✅ WebContainer auto-connected successfully');
            } catch (error) {
                console.error('❌ Auto-connect failed:', error);
                setError('Failed to boot WebContainer');
                setIsConnected(false);
            }
        };

        const timer = setTimeout(autoConnect, 1000);
        return () => clearTimeout(timer);
    }, [connect]);

    // Listen for process output to detect dev servers
    useEffect(() => {
        const handleProcessOutput = (data: any) => {
            console.log('🔍 WebContainer process output:', data);
            if (data && data.data) {
                detectDevServer(data.data);
            } else if (typeof data === 'string') {
                detectDevServer(data);
            }
        };

        // Subscribe to process output
        onProcessOutput(handleProcessOutput);

        return () => {
            // Cleanup will be handled by the callback cleanup
        };
    }, [onProcessOutput, detectDevServer]);

    const value: RemoteVMContextType = {
        isConnected,
        serverUrl,
        error,
        container,
        terminals,
        processes,
        devServers,
        connect,
        disconnect,
        createTerminal,
        runCommand,
        stopProcess,
        readFile,
        writeFile,
        listDirectory,
        createDirectory,
        deleteFile,
        startDevServer,
        onTerminalOutput,
        onProcessOutput,
        onFileContent,
        onDirectoryListing,
    };

    return (
        <RemoteVMContext.Provider value={value}>
            {children}
        </RemoteVMContext.Provider>
    );
};
