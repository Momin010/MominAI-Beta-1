

import React, { useEffect, useRef } from 'react';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useWebContainer } from '../WebContainerProvider.tsx';

export const Terminal: React.FC = () => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const { webContainer } = useWebContainer();
    const isTerminalAttached = useRef(false);

    useEffect(() => {
        if (!webContainer || isTerminalAttached.current || !terminalRef.current) {
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
    }, [webContainer]);

    return (
        <div className="h-full w-full">
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    );
};