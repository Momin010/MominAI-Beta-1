import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { WebContainerProvider, useRemoteVM as useWebContainerVM } from './WebContainerProvider';
import { RemoteVMProvider, useRemoteVM as useRemoteVM } from './RemoteVMProvider';

interface DevServer {
    url: string;
    port: number;
    framework: string;
    status: 'starting' | 'running' | 'stopped';
    proxyUrl?: string;
}

interface VMProviderContextType {
    isConnected: boolean;
    serverUrl: string | null;
    error: string | null;
    container: any;
    terminals: Map<string, any>;
    processes: Map<string, any>;
    devServers: DevServer[];
    connect: () => Promise<void>;
    disconnect: () => void;
    createTerminal: (terminalId: string) => void;
    runCommand: (command: string, args?: string[], cwd?: string, env?: Record<string, string>) => Promise<string> | string;
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
    provider: 'webcontainer' | 'remote';
}

const VMProviderContext = createContext<VMProviderContextType | undefined>(undefined);

export const useVMProvider = () => {
    const context = useContext(VMProviderContext);
    if (!context) {
        throw new Error('useVMProvider must be used within a VMProviderSwitcher');
    }
    return context;
};

interface VMProviderSwitcherProps {
    children: ReactNode;
    sessionId?: string;
}

export const VMProviderSwitcher: React.FC<VMProviderSwitcherProps> = ({
    children,
    sessionId
}) => {
    const { isPremium } = useSubscription();

    if (isPremium) {
        return (
            <RemoteVMProvider sessionId={sessionId}>
                <VMProviderWrapper provider="remote">
                    {children}
                </VMProviderWrapper>
            </RemoteVMProvider>
        );
    }

    return (
        <WebContainerProvider sessionId={sessionId}>
            <VMProviderWrapper provider="webcontainer">
                {children}
            </VMProviderWrapper>
        </WebContainerProvider>
    );
};

interface VMProviderWrapperProps {
    children: ReactNode;
    provider: 'webcontainer' | 'remote';
}

const VMProviderWrapper: React.FC<VMProviderWrapperProps> = ({ children, provider }) => {
    let vmContext;

    try {
        // Try to use the appropriate VM context based on provider
        vmContext = provider === 'remote' ? useRemoteVM() : useWebContainerVM();
    } catch (error) {
        // Fallback if context is not available
        console.warn('VM context not available:', error);
        return <>{children}</>;
    }

    // Create unified interface
    const unifiedContext: VMProviderContextType = useMemo(() => ({
        ...vmContext,
        provider,
        // Ensure runCommand returns consistent type - always Promise<string>
        runCommand: async (...args) => {
            const result = vmContext.runCommand(...args);
            // For WebContainer, runCommand is async and returns Promise<string>
            // For RemoteVM, runCommand is sync and returns string
            return result instanceof Promise ? result : Promise.resolve(result);
        }
    }), [vmContext, provider]);

    return (
        <VMProviderContext.Provider value={unifiedContext}>
            {children}
        </VMProviderContext.Provider>
    );
};

// Export the context for use in components that need the unified interface
export { VMProviderContext };