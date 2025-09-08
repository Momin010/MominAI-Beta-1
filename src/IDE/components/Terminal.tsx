

import React, { useEffect, useRef } from 'react';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useWebContainer } from '../WebContainerProvider.tsx';

interface TerminalProps {
    shouldRunSetup?: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ shouldRunSetup = false }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const { webContainer } = useWebContainer();
    const isTerminalAttached = useRef(false);
    const hasRunSetup = useRef(false);

    // Background setup function that runs npm processes without UI
    const runBackgroundSetup = async (container: any) => {
        try {
            console.log('Running background setup...');

            // 1. Install dependencies
            console.log('Installing dependencies...');
            const installProcess = await container.spawn('npm', ['install']);
            const installExitCode = await installProcess.exit;
            if (installExitCode !== 0) {
                console.error('Background installation failed');
                return;
            }
            console.log('Dependencies installed successfully');

            // 2. Start dev server
            console.log('Starting dev server...');
            const devProcess = await container.spawn('npm', ['run', 'dev']);
            // Keep dev server running in background
            console.log('Dev server started in background');
        } catch (error) {
            console.error('Background setup failed:', error);
        }
    };

    useEffect(() => {
        if (!webContainer) {
            return;
        }

        // Run setup if requested and not already run
        if (shouldRunSetup && !hasRunSetup.current) {
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

            // 1. Install dependencies
            terminal.writeln('\n\x1b[1;34m> npm install\x1b[0m');
            const installProcess = await webContainer.spawn('npm', ['install']);
            installProcess.output.pipeTo(new WritableStream({
                write(data) {
                    terminal.write(data);
                }
            }));
            const installExitCode = await installProcess.exit;
            if (installExitCode !== 0) {
                terminal.writeln(`\x1b[1;31mInstallation failed with exit code ${installExitCode}\x1b[0m`);
                return;
            }
            terminal.writeln('\x1b[1;32mDependencies installed successfully.\x1b[0m');

            // 2. Start dev server
            terminal.writeln('\n\x1b[1;34m> npm run dev\x1b[0m');
            const devProcess = await webContainer.spawn('npm', ['run', 'dev']);
            devProcess.output.pipeTo(new WritableStream({
                write(data) {
                    terminal.write(data);
                }
            }));
        };

        runSetup();

        return () => {
            resizeObserver.disconnect();
            terminal.dispose();
            isTerminalAttached.current = false;
        };
    }, [webContainer, shouldRunSetup]);

    return (
        <div className="h-full w-full">
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    );
};