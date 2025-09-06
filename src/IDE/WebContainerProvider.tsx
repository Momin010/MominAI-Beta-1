
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
    const isBooted = useRef(false);

    useEffect(() => {
        const boot = async () => {
            if (isBooted.current) return;
            isBooted.current = true;

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
                setError(err instanceof Error ? err.message : String(err));
                setIsLoading(false);
            }
        };

        boot();
    }, []);
    
    const runCommand = async (command: string, args: string[]) => {
        if (!webContainer) return;
        const process = await webContainer.spawn(command, args);
        // This is a simplified version. A real implementation would pipe output to the terminal.
        const result = await process.exit;
        if (result !== 0) {
            console.error(`Command "${command} ${args.join(' ')}" failed.`);
        }
    };

    const value = {
        webContainer,
        isLoading,
        serverUrl,
        error,
        fs: webContainer?.fs || null,
        runCommand,
    };

    return (
        <WebContainerContext.Provider value={value}>
            {children}
        </WebContainerContext.Provider>
    );
};
