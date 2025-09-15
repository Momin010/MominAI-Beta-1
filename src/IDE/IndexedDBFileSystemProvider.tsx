import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import fileSystemSync from './services/fileSystemSync';

interface IndexedDBFileSystemContextType {
    isConnected: boolean;
    error: string | null;
    terminals: Map<string, any>;
    processes: Map<string, any>;
    connect: () => Promise<void>;
    disconnect: () => void;
    createTerminal: (terminalId: string) => void;
    runCommand: (command: string, args?: string[], cwd?: string, env?: Record<string, string>) => string;
    stopProcess: (processId: string) => void;
    readFile: (path: string) => Promise<string | null>;
    writeFile: (path: string, content: string) => Promise<void>;
    listDirectory: (path: string) => Promise<string[]>;
    createDirectory: (path: string) => Promise<void>;
    deleteFile: (path: string) => Promise<void>;
    startDevServer: (cwd?: string, port?: number) => void;
    onTerminalOutput: (callback: (data: any) => void) => void;
    onProcessOutput: (callback: (data: any) => void) => void;
    onFileContent: (callback: (data: any) => void) => void;
    onDirectoryListing: (callback: (data: any) => void) => void;
    forceSync: () => Promise<void>;
    getSyncStatus: () => { isSyncing: boolean; webContainerAvailable: boolean };
}

const IndexedDBFileSystemContext = createContext<IndexedDBFileSystemContextType | undefined>(undefined);

export const useIndexedDBFileSystem = () => {
    const context = useContext(IndexedDBFileSystemContext);
    if (!context) {
        throw new Error('useIndexedDBFileSystem must be used within an IndexedDBFileSystemProvider');
    }
    return context;
};

interface IndexedDBFileSystemProviderProps {
    children: ReactNode;
    sessionId?: string;
}

export const IndexedDBFileSystemProvider: React.FC<IndexedDBFileSystemProviderProps> = ({
    children,
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [terminals] = useState(new Map());
    const [processes] = useState(new Map());

    // Callback arrays
    const [terminalOutputCallbacks] = useState<Array<(data: any) => void>>([]);
    const [processOutputCallbacks] = useState<Array<(data: any) => void>>([]);
    const [fileContentCallbacks] = useState<Array<(data: any) => void>>([]);
    const [directoryListingCallbacks] = useState<Array<(data: any) => void>>([]);

    const connect = useCallback(async () => {
        try {
            setError(null);
            console.log('🔌 Connecting to IndexedDB File System...');

            // Initialize IndexedDB (this happens automatically in the service)
            setIsConnected(true);
            console.log('✅ IndexedDB File System connected successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect to IndexedDB File System';
            console.error('❌ IndexedDB File System connection failed:', errorMessage);
            setError(errorMessage);
            throw error;
        }
    }, []);

    const disconnect = useCallback(() => {
        setIsConnected(false);
        setError(null);
        terminals.clear();
        processes.clear();
        console.log('🔌 Disconnected from IndexedDB File System');
    }, [terminals, processes]);

    const createTerminal = useCallback((terminalId: string) => {
        // For IndexedDB, we simulate a terminal (no actual shell)
        terminals.set(terminalId, { id: terminalId, type: 'simulated' });
        console.log(`Terminal ${terminalId} created (simulated)`);
    }, [terminals]);

    const runCommand = useCallback((command: string, args: string[] = [], cwd = '/', env: Record<string, string> = {}) => {
        // Simulate command execution
        const processId = `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const simulatedProcess = {
            id: processId,
            command,
            args,
            cwd,
            env,
            output: `Simulated execution: ${command} ${args.join(' ')}`
        };

        processes.set(processId, simulatedProcess);

        // Simulate output
        setTimeout(() => {
            processOutputCallbacks.forEach(callback =>
                callback({ processId, data: simulatedProcess.output })
            );
        }, 100);

        return processId;
    }, [processes, processOutputCallbacks]);

    const stopProcess = useCallback((processId: string) => {
        const process = processes.get(processId);
        if (process) {
            processes.delete(processId);
            console.log(`Process ${processId} stopped`);
        }
    }, [processes]);

    const readFile = useCallback(async (path: string) => {
        try {
            const content = await fileSystemSync.readFile(path);
            if (content !== null) {
                fileContentCallbacks.forEach(callback => callback({ path, content }));
            }
            return content;
        } catch (error) {
            console.error('Error reading file:', error);
            return null;
        }
    }, [fileContentCallbacks]);

    const writeFile = useCallback(async (path: string, content: string) => {
        try {
            // First try to read the file to see if it exists
            const existingContent = await fileSystemSync.readFile(path);

            if (existingContent === null) {
                // File doesn't exist, create it
                await fileSystemSync.createFile(path, content);
            } else {
                // File exists, update it
                await fileSystemSync.updateFile(path, content);
            }
        } catch (error) {
            console.error('Error writing file:', error);
        }
    }, []);

    const listDirectory = useCallback(async (path: string) => {
        try {
            const files = await fileSystemSync.listDirectory(path);
            directoryListingCallbacks.forEach(callback => callback({ path, files }));
            return files;
        } catch (error) {
            console.error('Error listing directory:', error);
            return [];
        }
    }, [directoryListingCallbacks]);

    const createDirectory = useCallback(async (path: string) => {
        try {
            await fileSystemSync.createDirectory(path);
        } catch (error) {
            console.error('Error creating directory:', error);
        }
    }, []);

    const deleteFile = useCallback(async (path: string) => {
        try {
            await fileSystemSync.deleteFile(path);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }, []);

    const startDevServer = useCallback((cwd = '/', port = 5173) => {
        // Simulate dev server start
        console.log(`Simulated dev server started on port ${port} in ${cwd}`);
        // In a real implementation, this would start a dev server
    }, []);

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

    const forceSync = useCallback(async () => {
        await fileSystemSync.forceSync();
    }, []);

    const getSyncStatus = useCallback(() => {
        return fileSystemSync.getSyncStatus();
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        const autoConnect = async () => {
            try {
                await connect();
            } catch (error) {
                console.error('Auto-connect failed:', error);
                setError('Failed to connect to IndexedDB File System');
                setIsConnected(false);
            }
        };

        const timer = setTimeout(autoConnect, 100);
        return () => clearTimeout(timer);
    }, [connect]);

    const value: IndexedDBFileSystemContextType = {
        isConnected,
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
        onTerminalOutput,
        onProcessOutput,
        onFileContent,
        onDirectoryListing,
        forceSync,
        getSyncStatus,
    };

    return (
        <IndexedDBFileSystemContext.Provider value={value}>
            {children}
        </IndexedDBFileSystemContext.Provider>
    );
};