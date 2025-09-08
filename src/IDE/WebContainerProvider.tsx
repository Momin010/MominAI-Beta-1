
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';
import type { WebContainer as WebContainerType } from '@webcontainer/api';
import { files as defaultFiles } from './defaultFiles.ts';

interface WebContainerContextType {
    webContainer: WebContainerType | null;
    isLoading: boolean;
    serverUrl: string | null;
    error: string | null;
    fs: WebContainerType['fs'] | null;
    runCommand: (command: string, args: string[]) => Promise<void>;
    isCrossOriginIsolated: boolean;
    memoryUsage: { used: number; total: number; percentage: number } | null;
    restartContainer: () => Promise<void>;
}

const WebContainerContext = createContext<WebContainerContextType | undefined>(undefined);

export const useWebContainer = () => {
    const context = useContext(WebContainerContext);
    if (!context) {
        throw new Error('useWebContainer must be used within a WebContainerProvider');
    }
    return context;
};

export const WebContainerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [webContainer, setWebContainer] = useState<WebContainerType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [memoryUsage, setMemoryUsage] = useState<{ used: number; total: number; percentage: number } | null>(null);
    const isBooted = useRef(false);
    const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Memory monitoring function
    const updateMemoryUsage = useCallback(() => {
        if (typeof performance !== 'undefined' && (performance as any).memory) {
            const memInfo = (performance as any).memory;
            const used = memInfo.usedJSHeapSize;
            const total = memInfo.totalJSHeapSize;
            const percentage = (used / total) * 100;

            setMemoryUsage({ used, total, percentage });

            // Warn if memory usage is high
            if (percentage > 80) {
                console.warn(`High memory usage: ${percentage.toFixed(1)}%`);
            }
        }
    }, []);

    // Restart container function
    const restartContainer = useCallback(async () => {
        console.log('Restarting WebContainer...');

        // Clear any existing restart timeout
        if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
        }

        // Kill existing container
        if (webContainer) {
            try {
                // Attempt to teardown existing container
                setWebContainer(null);
                setServerUrl(null);
                setError(null);
            } catch (e) {
                console.log('Error during container teardown:', e);
            }
        }

        // Reset boot flag to allow re-initialization
        isBooted.current = false;

        // Small delay before restart
        setTimeout(() => {
            setIsLoading(true);
            setError(null);
            // The useEffect will automatically restart the container
        }, 1000);
    }, [webContainer]);

    useEffect(() => {
        const boot = async () => {
            if (isBooted.current) return;
            isBooted.current = true;

            // Check for cross-origin isolation requirements
            const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
            const isIsolated = self.crossOriginIsolated;

            console.log("SharedArrayBuffer available:", hasSharedArrayBuffer);
            console.log("Cross-origin isolated:", isIsolated);

            if (!hasSharedArrayBuffer || !isIsolated) {
                const errorMsg = "WebContainer requires cross-origin isolation. Please ensure your browser supports SharedArrayBuffer and the page is served with proper COEP/COOP headers.";
                console.error(errorMsg);
                setError(errorMsg);
                setIsLoading(false);
                return;
            }

            try {
                console.log("Booting WebContainer...");
                const wc = await WebContainer.boot();
                setWebContainer(wc);

                console.log("Mounting default files...");
                await wc.mount(defaultFiles);

                wc.on('server-ready', (port, url) => {
                    console.log(`Server ready at ${url}`);
                    setServerUrl(url);
                });

                wc.on('error', (err) => {
                    console.error("WebContainer Error:", err);
                    setError(err.message);
                });

                // UI is ready to be shown, setup will continue in the terminal
                setIsLoading(false);

            } catch (err) {
                console.error("Failed to initialize WebContainer:", err);
                let errorMsg = err instanceof Error ? err.message : String(err);

                if (err instanceof Error && err.name === 'DataCloneError') {
                    errorMsg = "DataCloneError: Cross-origin isolation may not be properly configured. Please check that COEP and COOP headers are set correctly.";
                }

                setError(errorMsg);
                setIsLoading(false);
            }
        };

        boot();

        // Start memory monitoring
        const memoryInterval = setInterval(updateMemoryUsage, 5000); // Check every 5 seconds

        return () => {
            clearInterval(memoryInterval);
            if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current);
            }
        };
    }, [updateMemoryUsage]);
    

    const runCommand = async (command: string, args: string[]) => {
        if (!webContainer) return;

        try {
            const process = await webContainer.spawn(command, args, {
                cwd: '/',
                env: { NODE_OPTIONS: '--max-old-space-size=256' }
            });

            // Monitor memory after command execution
            const result = await process.exit;
            updateMemoryUsage();

            if (result !== 0) {
                console.error(`Command "${command} ${args.join(' ')}" failed with exit code ${result}`);
            }
        } catch (error) {
            console.error(`Failed to run command "${command} ${args.join(' ')}":`, error);
            updateMemoryUsage();
        }
    };

    const value = {
        webContainer,
        isLoading,
        serverUrl,
        error,
        fs: webContainer?.fs || null,
        runCommand,
        isCrossOriginIsolated: typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated,
        memoryUsage,
        restartContainer,
    };

    return (
        <WebContainerContext.Provider value={value}>
            {children}
        </WebContainerContext.Provider>
    );
};
