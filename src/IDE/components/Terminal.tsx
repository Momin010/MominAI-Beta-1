

import React, { useEffect, useRef } from 'react';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useVMProvider } from '../VMProviderSwitcher.tsx';

interface TerminalProps {
    shouldRunSetup?: boolean;
}

// Global state to prevent multiple background processes
let globalBackgroundProcess: any = null;
let isBackgroundSetupRunning = false;
let backgroundProcessCount = 0;

export const Terminal: React.FC<TerminalProps> = ({ shouldRunSetup = false }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XtermTerminal | null>(null);
    const { isConnected, container, runCommand, onProcessOutput } = useVMProvider();
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

        const maxRetries = 3;
        let currentAttempt = 0;

        while (currentAttempt < maxRetries) {
            try {
                console.log(`Starting background setup (attempt ${backgroundProcessCount}, retry ${currentAttempt + 1}/${maxRetries})...`);

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

                // 1. Check if package.json exists
                try {
                    await container.fs.readFile('/package.json', 'utf8');
                    console.log('✅ package.json found');
                } catch (error) {
                    console.warn('⚠️ package.json not found, skipping npm install');
                    isBackgroundSetupRunning = false;
                    return;
                }

                // 2. Install dependencies with timeout and error handling
                console.log('📦 Installing dependencies...');
                const installProcess = await container.spawn('npm', ['install', '--no-audit', '--no-fund'], {
                    cwd: '/',
                    env: {
                        NODE_OPTIONS: '--max-old-space-size=256',
                        npm_config_cache: '/tmp/.npm'
                    }
                });

                // Set timeout for installation
                const installTimeout = setTimeout(() => {
                    console.warn('⏰ Installation timeout, killing process...');
                    try {
                        installProcess.kill();
                    } catch (e) {
                        console.log('Could not kill install process');
                    }
                }, 180000); // 3 minute timeout

                const installExitCode = await installProcess.exit;
                clearTimeout(installTimeout);

                if (installExitCode !== 0) {
                    throw new Error(`Installation failed with exit code ${installExitCode}`);
                }
                console.log('✅ Dependencies installed successfully');

                // Small delay to prevent memory pressure
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 3. Check if dev script exists
                try {
                    const packageJson = JSON.parse(await container.fs.readFile('/package.json', 'utf8'));
                    if (!packageJson.scripts || !packageJson.scripts.dev) {
                        console.warn('⚠️ No dev script found in package.json, skipping dev server start');
                        isBackgroundSetupRunning = false;
                        return;
                    }
                } catch (error) {
                    console.warn('⚠️ Could not parse package.json, skipping dev server start');
                    isBackgroundSetupRunning = false;
                    return;
                }

                // 4. Start dev server with memory limits
                console.log('🚀 Starting dev server...');
                const devProcess = await container.spawn('npm', ['run', 'dev'], {
                    cwd: '/',
                    env: {
                        NODE_OPTIONS: '--max-old-space-size=256',
                        PORT: '5173',
                        HOST: '0.0.0.0'
                    }
                });

                // Store reference for cleanup
                globalBackgroundProcess = devProcess;

                // Monitor process health
                devProcess.exit.then((code: number) => {
                    console.log(`Dev server exited with code ${code}`);
                    globalBackgroundProcess = null;
                    isBackgroundSetupRunning = false;
                }).catch((error: any) => {
                    console.error('Dev server error:', error);
                    globalBackgroundProcess = null;
                    isBackgroundSetupRunning = false;
                });

                console.log('✅ Dev server started successfully in background');
                return; // Success, exit retry loop

            } catch (error) {
                currentAttempt++;
                console.error(`❌ Background setup attempt ${currentAttempt} failed:`, error);

                if (currentAttempt < maxRetries) {
                    const delay = Math.min(5000 * Math.pow(2, currentAttempt - 1), 30000); // Exponential backoff
                    console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('❌ All retry attempts exhausted');

                    // Try alternative installation method
                    try {
                        console.log('🔄 Attempting alternative installation method...');
                        const altInstallProcess = await container.spawn('npm', ['ci', '--only=production'], {
                            cwd: '/',
                            env: { NODE_OPTIONS: '--max-old-space-size=128' }
                        });

                        const altExitCode = await altInstallProcess.exit;
                        if (altExitCode === 0) {
                            console.log('✅ Alternative installation succeeded');
                        } else {
                            console.error('❌ Alternative installation also failed');
                        }
                    } catch (altError) {
                        console.error('❌ Alternative installation failed:', altError);
                    }
                }
            }
        }

        isBackgroundSetupRunning = false;
    };

    useEffect(() => {
        if (!isConnected || !container) {
            return;
        }

        // Run background setup if requested
        if (shouldRunSetup && !hasRunSetup.current) {
            hasRunSetup.current = true;
            runBackgroundSetup(container);
        }

        // Only attach terminal UI if visible and not already attached
        if (!terminalRef.current || isTerminalAttached.current) {
            return;
        }

        isTerminalAttached.current = true;

        const terminalContainer = terminalRef.current;

        // Ensure container has proper dimensions before initializing
        const ensureDimensions = () => {
            const rect = terminalContainer.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                // Set minimum dimensions if container has no size
                terminalContainer.style.minWidth = '400px';
                terminalContainer.style.minHeight = '200px';
                terminalContainer.style.width = '100%';
                terminalContainer.style.height = '100%';
            }
        };

        const terminal = new XtermTerminal({
            cursorBlink: true,
            convertEol: true,
            disableStdin: false,
            theme: { background: 'transparent', foreground: '#e5e5e5', cursor: 'var(--accent-primary)' },
            fontFamily: 'monospace', fontSize: 14,
            allowTransparency: true,
            scrollback: 1000,
        });

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(terminalContainer);

        // Ensure container has dimensions before fitting
        ensureDimensions();

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            try {
                fitAddon.fit();
            } catch (error) {
                console.error('Error fitting terminal:', error);
                // Fallback: set explicit dimensions
                terminal.resize(80, 24);
            }
        });

        // Focus the terminal to accept input
        terminal.focus();

        // Scroll to bottom on initial focus
        setTimeout(() => {
            try {
                terminal.scrollToBottom();
            } catch (e) {
                if (terminal.buffer && terminal.buffer.active) {
                    terminal.scrollToLine(terminal.buffer.active.length - 1);
                }
            }
        }, 100);

        xtermRef.current = terminal;

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                try {
                    if (fitAddon) {
                        fitAddon.fit();
                    }
                } catch (error) {
                    console.error('❌ Error fitting terminal on resize:', error);
                    // Fallback resize
                    if (xtermRef.current) {
                        xtermRef.current.resize(80, 24);
                    }
                }
            });
        });
        resizeObserver.observe(terminalContainer);

        // Add click handler to focus terminal
        const handleTerminalClick = () => {
            terminal.focus();
        };

        terminalRef.current.addEventListener('click', handleTerminalClick);

        // Prevent default browser shortcuts that might interfere
        terminal.attachCustomKeyEventHandler((e) => {
            // Allow Ctrl+C, Ctrl+V, etc. but prevent browser shortcuts
            if (e.ctrlKey && (e.key === 't' || e.key === 'w' || e.key === 'n')) {
                return false; // Let browser handle these
            }
            return true; // Handle in terminal
        });

        // Spawn shell process and connect to terminal
        const setupShell = async () => {
            try {
                // Try bash first, fallback to sh if not available
                let shellCommand = 'bash';
                let shellArgs = ['--login', '-i'];

                // Try to spawn bash, fallback to sh if not available
                try {
                    const testProcess = await container.spawn('bash', ['--version'], { cwd: '/' });
                    await testProcess.exit;
                } catch {
                    // Bash not available, use sh with interactive options
                    shellCommand = 'sh';
                    shellArgs = ['-i'];
                }

                const shellProcess = await container.spawn(shellCommand, shellArgs, {
                    cwd: '/',
                    env: {
                        ...process.env,
                        PS1: '\\u@\\h:\\w\\$ ',
                        TERM: 'xterm-256color'
                    }
                });

                // Pipe output from process to terminal
                shellProcess.output.pipeTo(new WritableStream({
                    write(data) {
                        terminal.write(data);
                        // Auto-scroll to bottom when new content is written
                        setTimeout(() => {
                            try {
                                terminal.scrollToBottom();
                            } catch (e) {
                                // Fallback: try to scroll using buffer
                                if (terminal.buffer && terminal.buffer.active) {
                                    terminal.scrollToLine(terminal.buffer.active.length - 1);
                                }
                            }
                        }, 10);
                    }
                }));

                // Get writer for input
                let inputWriter = shellProcess.input.getWriter();

                // Send input from terminal to process
                terminal.onData((data) => {
                    try {
                        inputWriter.write(data);
                        // Auto-scroll to bottom after user input
                        setTimeout(() => {
                            try {
                                terminal.scrollToBottom();
                            } catch (e) {
                                // Fallback scroll
                                if (terminal.buffer && terminal.buffer.active) {
                                    terminal.scrollToLine(terminal.buffer.active.length - 1);
                                }
                            }
                        }, 10);
                    } catch (error) {
                        console.error('Failed to write to shell input:', error);
                        // Try to re-establish connection if writer is locked
                        if (error.message.includes('lock')) {
                            try {
                                inputWriter.releaseLock();
                                const newWriter = shellProcess.input.getWriter();
                                newWriter.write(data);
                                inputWriter = newWriter;
                            } catch (retryError) {
                                console.error('Failed to re-establish input writer:', retryError);
                            }
                        }
                    }
                });

                // Handle process exit
                shellProcess.exit.then((code) => {
                    terminal.writeln(`\r\nShell exited with code ${code}`);
                    try {
                        inputWriter.releaseLock();
                    } catch (e) {
                        console.log('Could not release input writer lock');
                    }
                }).catch((error) => {
                    console.error('Shell process error:', error);
                    terminal.writeln(`\r\nShell error: ${error.message}`);
                    try {
                        inputWriter.releaseLock();
                    } catch (e) {
                        console.log('Could not release input writer lock');
                    }
                });

                // Store the process and writer for cleanup
                localProcessRef.current = { process: shellProcess, inputWriter };

                // Welcome message
                terminal.writeln('\x1b[1;36mWelcome to CodeCraft IDE!\x1b[0m');
                terminal.writeln('\x1b[1;33mWebContainer interactive shell is ready.\x1b[0m');
                terminal.writeln('Type commands to interact with the container.');
                terminal.writeln('');

            } catch (error) {
                console.error('Failed to spawn shell:', error);
                terminal.writeln('\x1b[1;31mFailed to start shell. Please check WebContainer connection.\x1b[0m');
            }
        };

        setupShell();

        return () => {
            resizeObserver.disconnect();
            if (terminalRef.current) {
                terminalRef.current.removeEventListener('click', handleTerminalClick);
            }
            terminal.dispose();
            xtermRef.current = null;
            isTerminalAttached.current = false;

            // Cleanup shell process
            if (localProcessRef.current) {
                try {
                    localProcessRef.current.process.kill();
                    localProcessRef.current.inputWriter.releaseLock();
                } catch (e) {
                    console.log('Could not kill shell process on cleanup');
                }
                localProcessRef.current = null;
            }
        };
    }, [isConnected, container, shouldRunSetup]);

    return (
        <div className="h-full w-full">
            <div
                ref={terminalRef}
                className="h-full w-full cursor-text focus:outline-none"
                tabIndex={0}
                onClick={() => {
                    if (xtermRef.current) {
                        xtermRef.current.focus();
                        // Scroll to bottom on click
                        setTimeout(() => {
                            try {
                                xtermRef.current?.scrollToBottom();
                            } catch (e) {
                                if (xtermRef.current?.buffer?.active) {
                                    xtermRef.current.scrollToLine(xtermRef.current.buffer.active.length - 1);
                                }
                            }
                        }, 10);
                    }
                }}
                onFocus={() => {
                    if (xtermRef.current) {
                        xtermRef.current.focus();
                        // Scroll to bottom on focus
                        setTimeout(() => {
                            try {
                                xtermRef.current?.scrollToBottom();
                            } catch (e) {
                                if (xtermRef.current?.buffer?.active) {
                                    xtermRef.current.scrollToLine(xtermRef.current.buffer.active.length - 1);
                                }
                            }
                        }, 10);
                    }
                }}
                onKeyDown={(e) => {
                    // Ensure terminal maintains focus
                    if (xtermRef.current) {
                        xtermRef.current.focus();
                    }
                }}
            />
        </div>
    );
};