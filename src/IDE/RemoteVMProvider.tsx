import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getWebSocketClient, disconnectWebSocketClient } from '../services/websocketClient';

interface RemoteVMContextType {
    isConnected: boolean;
    serverUrl: string | null;
    error: string | null;
    terminals: Map<string, any>;
    processes: Map<string, any>;
    connect: () => Promise<void>;
    disconnect: () => void;
    createTerminal: (terminalId: string) => void;
    runCommand: (command: string, args?: string[], cwd?: string, env?: Record<string, string>) => string;
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

export const RemoteVMProvider: React.FC<RemoteVMProviderProps> = ({
    children,
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [terminals] = useState(new Map());
    const [processes] = useState(new Map());

    const wsClient = getWebSocketClient(sessionId);

    // Message handlers
    const handleTerminalOutput = useCallback((data: any) => {
        console.log('Terminal output:', data);
        // Update terminal state if needed
    }, []);

    const handleProcessOutput = useCallback((data: any) => {
        console.log('Process output:', data);
        // Update process state if needed
    }, []);

    const handleFileContent = useCallback((data: any) => {
        console.log('File content:', data);
        // Handle file content updates
    }, []);

    const handleDirectoryListing = useCallback((data: any) => {
        console.log('Directory listing:', data);
        // Handle directory listing updates
    }, []);

    const handleError = useCallback((data: any) => {
        console.error('Remote VM error:', data.message);
        setError(data.message);
    }, []);

    const handleConnected = useCallback((data: any) => {
        console.log('Connected to Remote VM:', data.sessionId);
        setIsConnected(true);
        setError(null);
        // Set up the correct backend server URL
        setServerUrl('http://localhost:3001');
    }, []);

    // Set up message handlers
    useEffect(() => {
        wsClient.onMessage('terminal_output', handleTerminalOutput);
        wsClient.onMessage('process_output', handleProcessOutput);
        wsClient.onMessage('file_content', handleFileContent);
        wsClient.onMessage('directory_listing', handleDirectoryListing);
        wsClient.onMessage('error', handleError);
        wsClient.onMessage('connected', handleConnected);

        return () => {
            wsClient.offMessage('terminal_output', handleTerminalOutput);
            wsClient.offMessage('process_output', handleProcessOutput);
            wsClient.offMessage('file_content', handleFileContent);
            wsClient.offMessage('directory_listing', handleDirectoryListing);
            wsClient.offMessage('error', handleError);
            wsClient.offMessage('connected', handleConnected);
        };
    }, [wsClient, handleTerminalOutput, handleProcessOutput, handleFileContent, handleDirectoryListing, handleError, handleConnected]);

    // Auto-connect on mount
    useEffect(() => {
        const autoConnect = async () => {
            try {
                await connect();
            } catch (error) {
                console.error('Auto-connect failed:', error);
                // Set a fallback state so the app doesn't get stuck in loading
                setError('Failed to connect to backend server. Please check if the server is running on port 3001.');
                setIsConnected(false);
                setServerUrl(null);
            }
        };

        // Add a small delay to ensure backend is ready
        const timer = setTimeout(autoConnect, 1000);

        return () => clearTimeout(timer);
    }, []); // Remove connect from dependencies to avoid hoisting issues

    const connect = useCallback(async () => {
        try {
            setError(null);
            console.log('🔌 Attempting to connect to Remote VM...');
            await wsClient.connect();
            console.log('✅ Successfully connected to Remote VM');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Remote VM';
            console.error('❌ Remote VM connection failed:', errorMessage);
            setError(errorMessage);
            throw error;
        }
    }, [wsClient]);

    const disconnect = useCallback(() => {
        disconnectWebSocketClient();
        setIsConnected(false);
        setServerUrl(null);
        setError(null);
    }, []);

    const createTerminal = useCallback((terminalId: string) => {
        // Terminal is automatically created when container starts
        console.log(`Terminal ${terminalId} ready (container-based)`);
    }, []);

    const runCommand = useCallback((command: string, args: string[] = [], cwd = '/tmp', env: Record<string, string> = {}) => {
        return wsClient.runCommand(command, args, cwd, env);
    }, [wsClient]);

    const stopProcess = useCallback((processId: string) => {
        wsClient.stopProcess(processId);
    }, [wsClient]);

    const readFile = useCallback((path: string) => {
        wsClient.readFile(path);
    }, [wsClient]);

    const writeFile = useCallback((path: string, content: string) => {
        wsClient.writeFile(path, content);
    }, [wsClient]);

    const listDirectory = useCallback((path: string) => {
        wsClient.listDirectory(path);
    }, [wsClient]);

    const createDirectory = useCallback((path: string) => {
        wsClient.createDirectory(path);
    }, [wsClient]);

    const deleteFile = useCallback((path: string) => {
        wsClient.deleteFile(path);
    }, [wsClient]);

    const startDevServer = useCallback((cwd = '/tmp', port = 5173) => {
        wsClient.startDevServer(cwd, port);
    }, [wsClient]);

    const value: RemoteVMContextType = {
        isConnected,
        serverUrl,
        error,
        terminals,
        processes,
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
        onTerminalOutput: (callback) => wsClient.onMessage('terminal_output', callback),
        onProcessOutput: (callback) => wsClient.onMessage('process_output', callback),
        onFileContent: (callback) => wsClient.onMessage('file_content', callback),
        onDirectoryListing: (callback) => wsClient.onMessage('directory_listing', callback),
    };

    return (
        <RemoteVMContext.Provider value={value}>
            {children}
        </RemoteVMContext.Provider>
    );
};