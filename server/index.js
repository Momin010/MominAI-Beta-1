const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for sessions (in production, use Redis/database)
const sessions = new Map();
const terminals = new Map();
const processes = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    const sessionId = req.url.split('/').pop();
    console.log(`New WebSocket connection for session: ${sessionId}`);

    // Store connection
    sessions.set(sessionId, {
        ws,
        terminals: new Map(),
        processes: new Map(),
        files: new Map()
    });

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            await handleMessage(sessionId, data);
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
        }
    });

    ws.on('close', () => {
        console.log(`WebSocket connection closed for session: ${sessionId}`);
        cleanupSession(sessionId);
    });

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connected',
        sessionId,
        message: 'Connected to Remote VM Bridge'
    }));
});

// Message handler
async function handleMessage(sessionId, data) {
    const session = sessions.get(sessionId);
    if (!session) return;

    const { type, payload } = data;

    switch (type) {
        case 'create_terminal':
            await createTerminal(sessionId, payload);
            break;

        case 'terminal_input':
            await handleTerminalInput(sessionId, payload);
            break;

        case 'run_command':
            await runCommand(sessionId, payload);
            break;

        case 'read_file':
            await readFile(sessionId, payload);
            break;

        case 'write_file':
            await writeFile(sessionId, payload);
            break;

        case 'list_directory':
            await listDirectory(sessionId, payload);
            break;

        case 'create_directory':
            await createDirectory(sessionId, payload);
            break;

        case 'delete_file':
            await deleteFile(sessionId, payload);
            break;

        case 'start_dev_server':
            await startDevServer(sessionId, payload);
            break;

        case 'stop_process':
            await stopProcess(sessionId, payload);
            break;

        default:
            console.log(`Unknown message type: ${type}`);
    }
}

// Terminal management
async function createTerminal(sessionId, payload) {
    const session = sessions.get(sessionId);
    const terminalId = payload.terminalId || `term_${Date.now()}`;

    try {
        // Create PTY process
        const pty = spawn('bash', [], {
            cwd: '/tmp',
            env: { ...process.env, PS1: '$ ' }
        });

        // Store terminal
        session.terminals.set(terminalId, {
            pty,
            id: terminalId
        });

        // Handle PTY output
        pty.stdout.on('data', (data) => {
            session.ws.send(JSON.stringify({
                type: 'terminal_output',
                terminalId,
                data: data.toString()
            }));
        });

        pty.stderr.on('data', (data) => {
            session.ws.send(JSON.stringify({
                type: 'terminal_output',
                terminalId,
                data: data.toString()
            }));
        });

        pty.on('exit', (code) => {
            session.ws.send(JSON.stringify({
                type: 'terminal_exit',
                terminalId,
                code
            }));
            session.terminals.delete(terminalId);
        });

        // Send success response
        session.ws.send(JSON.stringify({
            type: 'terminal_created',
            terminalId
        }));

    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to create terminal: ${error.message}`
        }));
    }
}

async function handleTerminalInput(sessionId, payload) {
    const session = sessions.get(sessionId);
    const { terminalId, input } = payload;
    const terminal = session.terminals.get(terminalId);

    if (terminal) {
        terminal.pty.stdin.write(input);
    }
}

// Command execution
async function runCommand(sessionId, payload) {
    const session = sessions.get(sessionId);
    const { command, args = [], cwd = '/tmp', env = {} } = payload;
    const processId = `proc_${Date.now()}`;

    try {
        const proc = spawn(command, args, {
            cwd,
            env: { ...process.env, ...env },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Store process
        session.processes.set(processId, {
            proc,
            id: processId,
            command,
            args
        });

        // Handle output
        proc.stdout.on('data', (data) => {
            session.ws.send(JSON.stringify({
                type: 'process_output',
                processId,
                stream: 'stdout',
                data: data.toString()
            }));
        });

        proc.stderr.on('data', (data) => {
            session.ws.send(JSON.stringify({
                type: 'process_output',
                processId,
                stream: 'stderr',
                data: data.toString()
            }));
        });

        proc.on('exit', (code) => {
            session.ws.send(JSON.stringify({
                type: 'process_exit',
                processId,
                code
            }));
            session.processes.delete(processId);
        });

        // Send success response
        session.ws.send(JSON.stringify({
            type: 'process_started',
            processId,
            command,
            args
        }));

    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to run command: ${error.message}`
        }));
    }
}

// File operations
async function readFile(sessionId, payload) {
    const session = sessions.get(sessionId);
    const { path: filePath } = payload;

    try {
        const content = await fs.readFile(filePath, 'utf8');
        session.ws.send(JSON.stringify({
            type: 'file_content',
            path: filePath,
            content
        }));
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to read file: ${error.message}`
        }));
    }
}

async function writeFile(sessionId, payload) {
    const session = sessions.get(sessionId);
    const { path: filePath, content } = payload;

    try {
        await fs.writeFile(filePath, content, 'utf8');
        session.ws.send(JSON.stringify({
            type: 'file_written',
            path: filePath
        }));
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to write file: ${error.message}`
        }));
    }
}

async function listDirectory(sessionId, payload) {
    const session = sessions.get(sessionId);
    const { path: dirPath } = payload;

    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const result = items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file',
            path: path.join(dirPath, item.name)
        }));

        session.ws.send(JSON.stringify({
            type: 'directory_listing',
            path: dirPath,
            items: result
        }));
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to list directory: ${error.message}`
        }));
    }
}

async function createDirectory(sessionId, payload) {
    const session = sessions.get(sessionId);
    const { path: dirPath } = payload;

    try {
        await fs.mkdir(dirPath, { recursive: true });
        session.ws.send(JSON.stringify({
            type: 'directory_created',
            path: dirPath
        }));
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to create directory: ${error.message}`
        }));
    }
}

async function deleteFile(sessionId, payload) {
    const session = sessions.get(sessionId);
    const { path: filePath } = payload;

    try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            await fs.rmdir(filePath, { recursive: true });
        } else {
            await fs.unlink(filePath);
        }

        session.ws.send(JSON.stringify({
            type: 'file_deleted',
            path: filePath
        }));
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to delete: ${error.message}`
        }));
    }
}

// Development server management
async function startDevServer(sessionId, payload) {
    const session = sessions.get(sessionId);
    const { cwd = '/tmp', port = 5173 } = payload;

    // Check if package.json exists
    try {
        await fs.access(path.join(cwd, 'package.json'));
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: 'No package.json found. Please initialize a Node.js project first.'
        }));
        return;
    }

    // Install dependencies if node_modules doesn't exist
    try {
        await fs.access(path.join(cwd, 'node_modules'));
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'dev_server_status',
            status: 'installing',
            message: 'Installing dependencies...'
        }));

        await runCommand(sessionId, {
            command: 'npm',
            args: ['install'],
            cwd
        });
    }

    // Start dev server
    session.ws.send(JSON.stringify({
        type: 'dev_server_status',
        status: 'starting',
        message: 'Starting development server...'
    }));

    await runCommand(sessionId, {
        command: 'npm',
        args: ['run', 'dev', '--', '--host', '0.0.0.0', '--port', port.toString()],
        cwd,
        env: { PORT: port.toString() }
    });
}

async function stopProcess(sessionId, payload) {
    const session = sessions.get(sessionId);
    const { processId } = payload;
    const process = session.processes.get(processId);

    if (process) {
        try {
            process.proc.kill();
            session.processes.delete(processId);
            session.ws.send(JSON.stringify({
                type: 'process_stopped',
                processId
            }));
        } catch (error) {
            session.ws.send(JSON.stringify({
                type: 'error',
                message: `Failed to stop process: ${error.message}`
            }));
        }
    }
}

// Cleanup function
function cleanupSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return;

    // Kill all terminals
    session.terminals.forEach(terminal => {
        try {
            terminal.pty.kill();
        } catch (error) {
            console.log('Error killing terminal:', error);
        }
    });

    // Kill all processes
    session.processes.forEach(process => {
        try {
            process.proc.kill();
        } catch (error) {
            console.log('Error killing process:', error);
        }
    });

    // Remove session
    sessions.delete(sessionId);
}

// HTTP routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', sessions: sessions.size });
});

app.get('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (session) {
        res.json({
            sessionId,
            terminals: Array.from(session.terminals.keys()),
            processes: Array.from(session.processes.keys()),
            connected: true
        });
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Remote VM Bridge Server running on port ${PORT}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
});

module.exports = app;