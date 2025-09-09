export interface WebSocketMessage {
    type: string;
    payload?: any;
}

export interface TerminalData {
    terminalId: string;
    input?: string;
    data?: string;
    code?: number;
}

export interface ProcessData {
    processId: string;
    command?: string;
    args?: string[];
    stream?: 'stdout' | 'stderr';
    data?: string;
    code?: number;
}

export interface FileData {
    path: string;
    content?: string;
    items?: Array<{
        name: string;
        type: 'file' | 'directory';
        path: string;
    }>;
}

class WebSocketClient {
    private ws: WebSocket | null = null;
    private sessionId: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
    private isConnected = false;

    constructor(sessionId: string) {
        this.sessionId = sessionId;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const wsUrl = `ws://localhost:3001/session/${this.sessionId}`;
            console.log('🔌 Connecting to WebSocket:', wsUrl);

            try {
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('✅ WebSocket connected to Remote VM Bridge');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('📨 WebSocket message received:', data.type, data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('❌ Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onclose = (event) => {
                    console.log('🔌 WebSocket connection closed:', event.code, event.reason);
                    this.isConnected = false;
                    this.attemptReconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    reject(error);
                };

                // Add timeout for connection
                setTimeout(() => {
                    if (!this.isConnected) {
                        console.error('⏰ WebSocket connection timeout');
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 5000);

            } catch (error) {
                console.error('❌ WebSocket creation error:', error);
                reject(error);
            }
        });
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, delay);
    }

    private handleMessage(data: any) {
        const { type, ...payload } = data;
        const handlers = this.messageHandlers.get(type);

        if (handlers) {
            handlers.forEach(handler => handler(payload));
        }

        // Handle built-in message types
        switch (type) {
            case 'connected':
                console.log('Successfully connected to Remote VM Bridge');
                break;
            case 'error':
                console.error('Remote VM Bridge error:', payload.message);
                break;
        }
    }

    sendMessage(message: WebSocketMessage) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected');
        }
    }

    onMessage(type: string, handler: (data: any) => void) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type)!.push(handler);
    }

    offMessage(type: string, handler: (data: any) => void) {
        const handlers = this.messageHandlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.messageHandlers.clear();
    }

    isWebSocketConnected(): boolean {
        return this.isConnected;
    }

    // Container operations
    sendContainerCommand(command: string) {
        this.sendMessage({
            type: 'container_command',
            payload: { command }
        });
    }

    stopContainer() {
        this.sendMessage({
            type: 'stop_container',
            payload: {}
        });
    }

    // Process operations
    runCommand(command: string, args: string[] = [], cwd = '/tmp', env: Record<string, string> = {}) {
        const processId = `proc_${Date.now()}`;
        this.sendMessage({
            type: 'run_command',
            payload: { command, args, cwd, env, processId }
        });
        return processId;
    }

    stopProcess(processId: string) {
        this.sendMessage({
            type: 'stop_process',
            payload: { processId }
        });
    }

    // File operations
    readFile(filePath: string) {
        this.sendMessage({
            type: 'read_file',
            payload: { path: filePath }
        });
    }

    writeFile(filePath: string, content: string) {
        this.sendMessage({
            type: 'write_file',
            payload: { path: filePath, content }
        });
    }

    listDirectory(dirPath: string) {
        this.sendMessage({
            type: 'list_directory',
            payload: { path: dirPath }
        });
    }

    createDirectory(dirPath: string) {
        this.sendMessage({
            type: 'create_directory',
            payload: { path: dirPath }
        });
    }

    deleteFile(filePath: string) {
        this.sendMessage({
            type: 'delete_file',
            payload: { path: filePath }
        });
    }

    // Development server
    startDevServer(cwd = '/tmp', port = 5173) {
        this.sendMessage({
            type: 'start_dev_server',
            payload: { cwd, port }
        });
    }
}

// Singleton instance
let websocketClient: WebSocketClient | null = null;

export function getWebSocketClient(sessionId?: string): WebSocketClient {
    if (!websocketClient) {
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        websocketClient = new WebSocketClient(sessionId);
    }
    return websocketClient;
}

export function disconnectWebSocketClient() {
    if (websocketClient) {
        websocketClient.disconnect();
        websocketClient = null;
    }
}

export default WebSocketClient;