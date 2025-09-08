import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRemoteVM } from '../RemoteVMProvider';
import { getWebSocketClient } from '../../services/websocketClient';
import { Icons } from './Icon';

interface WebSocketTerminalProps {
    terminalId?: string;
    isVisible: boolean;
    onToggle?: () => void;
}

export const WebSocketTerminal: React.FC<WebSocketTerminalProps> = ({
    terminalId = 'main-terminal',
    isVisible,
    onToggle
}) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isConnected, setIsConnected] = useState(false);

    const {
        createTerminal,
        onTerminalOutput,
        onProcessOutput,
        isConnected: vmConnected,
        error
    } = useRemoteVM();

    const wsClient = getWebSocketClient();

    // Handle container output
    const handleContainerOutput = useCallback((data: any) => {
        if (data.sessionId) {
            setTerminalOutput(prev => [...prev, data.data]);
        }
    }, []);

    // Handle process output
    const handleProcessOutput = useCallback((data: any) => {
        setTerminalOutput(prev => [...prev, `[${data.stream}] ${data.data}`]);
    }, []);

    // Set up message handlers
    useEffect(() => {
        wsClient.onMessage('container_output', handleContainerOutput);
        onProcessOutput(handleProcessOutput);

        // Cleanup handlers
        return () => {
            wsClient.offMessage('container_output', handleContainerOutput);
        };
    }, [wsClient, handleContainerOutput, onProcessOutput, handleProcessOutput]);

    // Initialize terminal
    useEffect(() => {
        if (vmConnected && !isConnected) {
            console.log('Creating WebSocket terminal...');
            createTerminal(terminalId);
            setIsConnected(true);
            setTerminalOutput(['Welcome to Remote VM Terminal', '$ ']);
        }
    }, [vmConnected, isConnected, createTerminal, terminalId]);

    // Handle command execution
    const executeCommand = useCallback((command: string) => {
        if (!command.trim()) return;

        // Add command to history
        setCommandHistory(prev => [...prev, command]);
        setHistoryIndex(-1);

        // Display command in terminal
        setTerminalOutput(prev => [...prev, `$ ${command}`]);

        // Execute command via WebSocket to container
        wsClient.sendContainerCommand(command);

        // Clear input
        setCurrentInput('');
    }, [wsClient]);

    // Handle keyboard input
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            executeCommand(currentInput);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setCurrentInput(commandHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex >= 0) {
                const newIndex = historyIndex + 1;
                if (newIndex >= commandHistory.length) {
                    setHistoryIndex(-1);
                    setCurrentInput('');
                } else {
                    setHistoryIndex(newIndex);
                    setCurrentInput(commandHistory[newIndex]);
                }
            }
        }
    }, [currentInput, commandHistory, historyIndex, executeCommand]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalOutput]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="h-full flex flex-col bg-black text-green-400 font-mono text-sm">
            {/* Terminal Header */}
            <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-600">
                <div className="flex items-center gap-2">
                    <Icons.Terminal className="w-4 h-4" />
                    <span className="text-xs">Remote VM Terminal</span>
                    <div className={`w-2 h-2 rounded-full ${vmConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-gray-400">
                        {vmConnected ? 'Connected' : 'Disconnected'}
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

            {/* Terminal Output */}
            <div
                ref={terminalRef}
                className="flex-1 p-2 overflow-auto bg-black"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
                {terminalOutput.map((line, index) => (
                    <div key={index} className="whitespace-pre-wrap break-all">
                        {line}
                    </div>
                ))}

                {/* Error Display */}
                {error && (
                    <div className="text-red-400 mt-2">
                        Error: {error}
                    </div>
                )}

                {/* Input Line */}
                <div className="flex items-center mt-1">
                    <span className="text-green-400 mr-2">$</span>
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-green-400"
                        placeholder="Type a command..."
                        disabled={!vmConnected}
                    />
                </div>
            </div>

            {/* Terminal Footer */}
            <div className="p-2 bg-gray-800 border-t border-gray-600 text-xs text-gray-400">
                <div className="flex justify-between">
                    <span>Remote VM: {terminalId}</span>
                    <span>Commands: {commandHistory.length}</span>
                </div>
            </div>
        </div>
    );
};