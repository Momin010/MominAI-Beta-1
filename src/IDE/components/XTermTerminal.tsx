import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useVMProvider } from '../VMProviderSwitcher';
import { Icons } from './Icon';
import '@xterm/xterm/css/xterm.css';

interface XTermTerminalProps {
    terminalId?: string;
    isVisible: boolean;
    onToggle?: () => void;
}

export const XTermTerminal: React.FC<XTermTerminalProps> = ({
    terminalId = 'main-terminal',
    isVisible,
    onToggle
}) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XtermTerminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const shellProcessRef = useRef<any>(null);
    const inputWriterRef = useRef<any>(null);
    const currentLineRef = useRef<string>('');
    const cursorPositionRef = useRef<number>(0);

    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isInitialized, setIsInitialized] = useState(false);

    const {
        isConnected,
        error,
        createTerminal,
        runCommand,
        onProcessOutput,
        container
    } = useVMProvider();

    // Initialize xterm.js terminal
    const initializeTerminal = useCallback(() => {
        if (!terminalRef.current || xtermRef.current) return;

        const container = terminalRef.current;

        // Ensure container has proper dimensions before initializing
        const ensureDimensions = () => {
            const rect = container.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                // Set minimum dimensions if container has no size
                container.style.minWidth = '400px';
                container.style.minHeight = '200px';
                container.style.width = '100%';
                container.style.height = '100%';
            }
        };

        const terminal = new XtermTerminal({
            cursorBlink: true,
            cursorStyle: 'block',
            convertEol: true,
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#007acc',
                black: '#000000',
                red: '#f44747',
                green: '#6a9955',
                yellow: '#dcdcaa',
                blue: '#569cd6',
                magenta: '#c586c0',
                cyan: '#4ec9b0',
                white: '#d4d4d4',
                brightBlack: '#808080',
                brightRed: '#f44747',
                brightGreen: '#6a9955',
                brightYellow: '#dcdcaa',
                brightBlue: '#569cd6',
                brightMagenta: '#c586c0',
                brightCyan: '#4ec9b0',
                brightWhite: '#ffffff'
            },
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.2,
            allowTransparency: true,
            scrollback: 1000,
            disableStdin: false
        });

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);

        terminal.open(container);

        // Ensure container has dimensions before fitting
        ensureDimensions();

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            try {
                fitAddon.fit();
                console.log('XTerm terminal fitted successfully');
            } catch (error) {
                console.error('Error fitting terminal:', error);
                // Fallback: set explicit dimensions
                terminal.resize(80, 24);
            }
        });

        // Focus the terminal to accept input
        terminal.focus();
        terminal.attachCustomKeyEventHandler((e) => {
            try { (e as any).stopPropagation?.(); } catch {}
            return true;
        });
        console.log('XTerm terminal initialized and focused');

        xtermRef.current = terminal;
        fitAddonRef.current = fitAddon;

        // Handle window resize with error handling
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                try {
                    if (fitAddonRef.current) {
                        fitAddonRef.current.fit();
                    }
                } catch (error) {
                    console.error('Error fitting terminal on resize:', error);
                    // Fallback resize
                    if (xtermRef.current) {
                        xtermRef.current.resize(80, 24);
                    }
                }
            });
        });
        resizeObserver.observe(container);

        // Welcome message
        terminal.writeln('\x1b[1;36mWelcome to CodeCraft IDE Terminal\x1b[0m');
        terminal.writeln('\x1b[1;33mWebContainer Terminal with full emulation\x1b[0m');
        terminal.writeln('');

        // Input handling is set up after spawning the interactive shell process

        return () => {
            resizeObserver.disconnect();
            terminal.dispose();
            xtermRef.current = null;
            fitAddonRef.current = null;
        };
    }, []);
    // Execute command in WebContainer
    const executeCommand = useCallback(async (command: string) => {
        if (!command.trim()) {
            xtermRef.current?.writeln('');
            xtermRef.current?.write('$ ');
            return;
        }

        // Add to history
        setCommandHistory(prev => [...prev, command]);
        setHistoryIndex(-1);

        try {
            // Display command
            xtermRef.current?.writeln(`\x1b[1;32m${command}\x1b[0m`);

            // Execute command via WebContainer
            const processId = runCommand('sh', ['-c', command]);

            // Listen for output
            onProcessOutput(handleProcessOutput);

        } catch (error) {
            console.error('Command execution failed:', error);
            xtermRef.current?.writeln(`\x1b[1;31mError: ${error}\x1b[0m`);
        }

        // Show prompt again
        xtermRef.current?.write('$ ');
    }, [runCommand, onProcessOutput]);

    // Handle terminal data input (for manual input handling if needed)
    const handleTerminalData = useCallback((data: string) => {
        const terminal = xtermRef.current;
        if (!terminal) {
            console.log('Terminal not available for data handling');
            return;
        }

        console.log('Processing terminal data:', JSON.stringify(data));

        // Handle special characters
        if (data === '\r' || data === '\n') {
            // Enter key pressed
            const command = currentLineRef.current.trim();
            console.log('Enter pressed, executing command:', command);
            currentLineRef.current = '';
            cursorPositionRef.current = 0;
            executeCommand(command);
        } else if (data === '\x7f') {
            // Backspace
            console.log('Backspace pressed');
            if (currentLineRef.current.length > 0) {
                currentLineRef.current = currentLineRef.current.slice(0, -1);
                cursorPositionRef.current = Math.max(0, cursorPositionRef.current - 1);
                // Echo backspace
                terminal.write('\b \b');
            }
        } else if (data === '\t') {
            // Tab completion
            console.log('Tab pressed for completion');
            const currentWord = currentLineRef.current.split(' ').pop() || '';
            const completions = ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'rm', 'cp', 'mv', 'grep', 'find', 'npm', 'node', 'git'];
            const completion = completions.find(cmd => cmd.startsWith(currentWord));

            if (completion && currentWord !== completion) {
                const completionSuffix = completion.slice(currentWord.length);
                currentLineRef.current += completionSuffix;
                cursorPositionRef.current += completionSuffix.length;
                terminal.write(completionSuffix);
            }
        } else if (data === '\x1b[A') {
            // Arrow Up - command history
            console.log('Arrow Up pressed for history');
            if (commandHistory.length > 0) {
                const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                const command = commandHistory[newIndex];
                // Clear current line and write new command
                terminal.write('\r\x1b[K$ ' + command);
                currentLineRef.current = command;
                cursorPositionRef.current = command.length;
            }
        } else if (data === '\x1b[B') {
            // Arrow Down - command history
            console.log('Arrow Down pressed for history');
            if (historyIndex >= 0) {
                const newIndex = historyIndex + 1;
                if (newIndex >= commandHistory.length) {
                    setHistoryIndex(-1);
                    currentLineRef.current = '';
                    cursorPositionRef.current = 0;
                    terminal.write('\r\x1b[K$ ');
                } else {
                    setHistoryIndex(newIndex);
                    const command = commandHistory[newIndex];
                    terminal.write('\r\x1b[K$ ' + command);
                    currentLineRef.current = command;
                    cursorPositionRef.current = command.length;
                }
            }
        } else {
            // Regular character input
            console.log('Regular character input:', data);
            currentLineRef.current += data;
            cursorPositionRef.current += data.length;
            terminal.write(data);
        }
    }, [executeCommand, commandHistory, historyIndex]);

    // Handle process output from WebContainer
    const handleProcessOutput = useCallback((data: any) => {
        if (!xtermRef.current) return;

        const terminal = xtermRef.current;
        if (data.data) {
            // Write the output to terminal
            terminal.write(data.data);
        }
    }, []);



    // Initialize terminal when component mounts and WebContainer is connected
    useEffect(() => {
        if (isConnected && !isInitialized && isVisible) {
            console.log('Initializing XTerm terminal...');
            const cleanup = initializeTerminal();
            setIsInitialized(true);
            console.log('XTerm terminal initialization completed');

            return cleanup;
        }
    }, [isConnected, isInitialized, isVisible, initializeTerminal]);

    // Spawn an interactive shell and pipe I/O once terminal is ready
    useEffect(() => {
        const term = xtermRef.current;
        if (!term || !isVisible) return;
        if (!container) return;
        if (shellProcessRef.current) return;

        let disposed = false;

        const setupShell = async () => {
            try {
                // Try different shell options with fallback
                let shellCommand = 'bash';
                let shellArgs = ['--login', '-i'];

                // Check if bash is available
                try {
                    const testProcess = await container.spawn('bash', ['--version'], { cwd: '/' });
                    await testProcess.exit;
                    console.log('✅ Bash available');
                } catch (bashError) {
                    console.log('⚠️ Bash not available, trying sh');
                    shellCommand = 'sh';
                    shellArgs = ['-i'];
                }

                console.log(`🐚 Spawning shell: ${shellCommand} ${shellArgs.join(' ')}`);
                const shell = await container.spawn(shellCommand, shellArgs, {
                    cwd: '/',
                    env: {
                        ...process.env,
                        PS1: '\\u@\\h:\\w\\$ ',
                        TERM: 'xterm-256color'
                    }
                });

                shellProcessRef.current = shell;
                console.log('✅ Shell spawned successfully');

                const writer = shell.input.getWriter();
                inputWriterRef.current = writer;

                const disposeData = term.onData((data) => {
                    try { writer.write(data); } catch {}
                });

                shell.output.pipeTo(new WritableStream({
                    write(data) {
                        if (!disposed) {
                            try {
                                term.write(data);
                            } catch (writeError) {
                                console.error('❌ Error writing to terminal:', writeError);
                            }
                        }
                    }
                })).catch((err) => {
                    console.error('❌ Error piping shell output:', err);
                    if (!disposed) {
                        term.writeln(`\r\n[Output pipe error: ${err.message}]`);
                    }
                });

                shell.exit.then((code: number) => {
                    console.log(`Shell exited with code ${code}`);
                    if (!disposed) {
                        term.writeln(`\r\n[process exited with code ${code}]`);
                    }
                    try { writer.releaseLock(); } catch {}
                    inputWriterRef.current = null;
                    disposeData?.dispose?.();
                    shellProcessRef.current = null;
                }).catch((err: any) => {
                    console.error('❌ Shell process error:', err);
                    if (!disposed) {
                        term.writeln(`\r\nShell error: ${err?.message || err}`);
                    }
                    try { writer.releaseLock(); } catch {}
                    inputWriterRef.current = null;
                    disposeData?.dispose?.();
                    shellProcessRef.current = null;
                });
            } catch (err) {
                console.error('❌ Failed to spawn interactive shell:', err);
                if (!disposed) {
                    term.writeln('\x1b[1;31mFailed to start shell. Please check WebContainer connection.\x1b[0m');
                    term.writeln('\x1b[1;33mTry running commands manually or refresh the page.\x1b[0m');
                }
            }
        };

        setupShell();

        return () => {
            disposed = true;
            try { inputWriterRef.current?.releaseLock(); } catch {}
            inputWriterRef.current = null;
            if (shellProcessRef.current) {
                try { shellProcessRef.current.kill(); } catch {}
                shellProcessRef.current = null;
            }
        };
    }, [container, isVisible, isInitialized]);

    // Handle visibility changes
    useEffect(() => {
        if (!isVisible && xtermRef.current) {
            // Terminal is hidden, could pause or cleanup if needed
        }
    }, [isVisible]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="h-full flex flex-col bg-gray-900 text-gray-100">
            {/* Terminal Header */}
            <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-600">
                <div className="flex items-center gap-2">
                    <Icons.Terminal className="w-4 h-4" />
                    <span className="text-xs">WebContainer Terminal</span>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-gray-400">
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="p-1 hover:bg-gray-700 rounded"
                        title="Close Terminal"
                    >
                        <Icons.X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Terminal Content */}
            <div className="flex-1 relative">
                <div
                    ref={terminalRef}
                    className="h-full w-full cursor-text terminal-container"
                    tabIndex={0}
                    onClick={() => {
                        console.log('Terminal clicked, focusing...');
                        xtermRef.current?.focus();
                    }}
                    onFocus={() => {
                        xtermRef.current?.focus();
                    }}
                    onKeyDown={(e) => {
                        // Prevent default browser behavior for certain keys
                        if (e.ctrlKey || e.altKey || e.metaKey) {
                            e.stopPropagation();
                        }
                    }}
                />

                {/* Error Display */}
                {error && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded text-sm">
                        Error: {error}
                    </div>
                )}
            </div>

            {/* Terminal Footer */}
            <div className="p-2 bg-gray-800 border-t border-gray-600 text-xs text-gray-400">
                <div className="flex justify-between">
                    <span>WebContainer: {terminalId}</span>
                    <span>History: {commandHistory.length} commands</span>
                </div>
            </div>
        </div>
    );
};