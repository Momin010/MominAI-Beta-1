

import React, { useEffect, useRef } from 'react';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useWebContainer } from '../WebContainerProvider.tsx';

interface TerminalProps {
    shouldRunSetup?: boolean;
}

// Global state to prevent multiple background processes
let globalBackgroundProcess: any = null;
let isBackgroundSetupRunning = false;
let backgroundProcessCount = 0;

export const Terminal: React.FC<TerminalProps> = ({ shouldRunSetup = false }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const { webContainer } = useWebContainer();
    const isTerminalAttached = useRef(false);
    const hasRunSetup = useRef(false);
    const localProcessRef = useRef<any>(null);

    // Background setup function with singleton pattern and memory management
    const runBackgroundSetup = async (container: any) => {
        // Prevent multiple simultaneous setups
        if (isBackgroundSetupRunning) {
            console.log('Background setup already running, skipping...');
            return;
        }

        // Clean up any existing background process
        if (globalBackgroundProcess) {
            try {
                globalBackgroundProcess.kill();
            } catch (e) {
                console.log('Could not kill existing background process');
            }
            globalBackgroundProcess = null;
        }

        isBackgroundSetupRunning = true;
        backgroundProcessCount++;

        try {
            console.log(`Starting background setup (attempt ${backgroundProcessCount})...`);

            // Memory check before starting
            if (typeof performance !== 'undefined' && (performance as any).memory) {
                const memInfo = (performance as any).memory;
                const usedPercent = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
                console.log(`Memory usage: ${usedPercent.toFixed(1)}%`);

                if (usedPercent > 80) {
                    console.warn('High memory usage detected, attempting cleanup...');
                    // Force garbage collection if available
                    if (typeof gc !== 'undefined') {
                        gc();
                    }
                }
            }

            // 1. Install dependencies with timeout and error handling
            console.log('Installing dependencies...');
            const installProcess = await container.spawn('npm', ['install'], {
                cwd: '/',
                env: { NODE_OPTIONS: '--max-old-space-size=256' } // Limit memory usage
            });

            // Set timeout for installation
            const installTimeout = setTimeout(() => {
                console.warn('Installation timeout, killing process...');
                try {
                    installProcess.kill();
                } catch (e) {
                    console.log('Could not kill install process');
                }
            }, 120000); // 2 minute timeout

            const installExitCode = await installProcess.exit;
            clearTimeout(installTimeout);

            if (installExitCode !== 0) {
                console.error(`Background installation failed with code ${installExitCode}`);
                return;
            }
            console.log('Dependencies installed successfully');

            // Small delay to prevent memory pressure
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 2. Start dev server with memory limits
            console.log('Starting dev server...');
            const devProcess = await container.spawn('npm', ['run', 'dev'], {
                cwd: '/',
                env: {
                    NODE_OPTIONS: '--max-old-space-size=256',
                    PORT: '5173'
                }
            });

            // Store reference for cleanup
            globalBackgroundProcess = devProcess;
            localProcessRef.current = devProcess;

            // Monitor process health
            devProcess.exit.then((code: number) => {
                console.log(`Dev server exited with code ${code}`);
                globalBackgroundProcess = null;
                localProcessRef.current = null;
                isBackgroundSetupRunning = false;
            }).catch((error: any) => {
                console.error('Dev server error:', error);
                globalBackgroundProcess = null;
                localProcessRef.current = null;
                isBackgroundSetupRunning = false;
            });

            console.log('Dev server started successfully in background');

        } catch (error) {
            console.error('Background setup failed:', error);
            isBackgroundSetupRunning = false;

            // If it's a memory error, wait longer before retry
            if (error instanceof Error && error.message.includes('out of memory')) {
                console.log('Memory error detected, waiting 5 seconds before potential retry...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } finally {
            isBackgroundSetupRunning = false;
        }
    };

    useEffect(() => {
        if (!webContainer) {
            return;
        }

        // Run background setup if requested (only once per session)
        if (shouldRunSetup && !hasRunSetup.current && !isBackgroundSetupRunning) {
            hasRunSetup.current = true;
            runBackgroundSetup(webContainer);
        }

        // Only attach terminal UI if visible and not already attached
        if (!terminalRef.current || isTerminalAttached.current) {
            return;
        }

        isTerminalAttached.current = true;
        const terminal = new XtermTerminal({
            cursorBlink: true,
            convertEol: true,
            theme: { background: 'transparent', foreground: '#e5e5e5', cursor: 'var(--accent-primary)' },
            fontFamily: 'monospace', fontSize: 14,
        });
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(terminalRef.current);
        fitAddon.fit();

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => fitAddon.fit());
        });
        resizeObserver.observe(terminalRef.current);

        const runSetup = async () => {
            terminal.writeln('Welcome to CodeCraft IDE!');
            terminal.writeln('--------------------------');
            terminal.writeln('\x1b[1;33mStarting environment setup...\x1b[0m');

            // Check if background process is already running
            if (isBackgroundSetupRunning) {
                terminal.writeln('\x1b[1;33mBackground setup already running...\x1b[0m');
                return;
            }

            // 1. Install dependencies
            terminal.writeln('\n\x1b[1;34m> npm install\x1b[0m');
            const installProcess = await webContainer.spawn('npm', ['install'], {
                cwd: '/',
                env: { NODE_OPTIONS: '--max-old-space-size=256' }
            });

            const installTimeout = setTimeout(() => {
                terminal.writeln('\x1b[1;33mInstallation timeout, killing process...\x1b[0m');
                try {
                    installProcess.kill();
                } catch (e) {
                    console.log('Could not kill install process');
                }
            }, 120000);

            installProcess.output.pipeTo(new WritableStream({
                write(data) {
                    terminal.write(data);
                }
            }));

            const installExitCode = await installProcess.exit;
            clearTimeout(installTimeout);

            if (installExitCode !== 0) {
                terminal.writeln(`\x1b[1;31mInstallation failed with exit code ${installExitCode}\x1b[0m`);
                return;
            }
            terminal.writeln('\x1b[1;32mDependencies installed successfully.\x1b[0m');

            // 2. Start dev server
            terminal.writeln('\n\x1b[1;34m> npm run dev\x1b[0m');
            const devProcess = await webContainer.spawn('npm', ['run', 'dev'], {
                cwd: '/',
                env: {
                    NODE_OPTIONS: '--max-old-space-size=256',
                    PORT: '5173'
                }
            });

            devProcess.output.pipeTo(new WritableStream({
                write(data) {
                    terminal.write(data);
                }
            }));

            // Store reference for cleanup
            localProcessRef.current = devProcess;
        };

        runSetup();

        return () => {
            resizeObserver.disconnect();
            terminal.dispose();
            isTerminalAttached.current = false;

            // Cleanup local process reference
            if (localProcessRef.current) {
                try {
                    localProcessRef.current.kill();
                } catch (e) {
                    console.log('Could not kill local process on cleanup');
                }
                localProcessRef.current = null;
            }
        };
    }, [webContainer, shouldRunSetup]);

    return (
        <div className="h-full w-full">
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    );
};