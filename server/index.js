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

// Configuration
const CONFIG = {
    USER_WORKSPACE_BASE: '/home/ide/users',
    CONTAINER_IMAGE: 'node:20-bullseye',
    CONTAINER_CPU_LIMIT: '0.5',
    CONTAINER_MEMORY_LIMIT: '512m',
    SESSION_IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_SESSIONS: 50, // Limit concurrent sessions
    DOCKER_NETWORK: 'ide-network'
};

// In-memory storage for sessions and containers
const sessions = new Map(); // sessionId -> session data
const containers = new Map(); // sessionId -> container process
const sessionTimers = new Map(); // sessionId -> idle timeout timer

// Ensure user workspace directory exists
async function ensureWorkspaceDirectory(sessionId) {
    const userWorkspace = path.join(CONFIG.USER_WORKSPACE_BASE, sessionId);
    try {
        await fs.access(userWorkspace);
    } catch (error) {
        await fs.mkdir(userWorkspace, { recursive: true });
        console.log(`Created workspace for session: ${sessionId}`);
    }
    return userWorkspace;
}

// WebSocket connection handler
wss.on('connection', async (ws, req) => {
    const sessionId = req.url.split('/').pop();
    console.log(`New WebSocket connection for session: ${sessionId}`);

    // Check session limit
    if (sessions.size >= CONFIG.MAX_SESSIONS) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Server at capacity. Please try again later.'
        }));
        ws.close();
        return;
    }

    // Create or get existing session
    let session = sessions.get(sessionId);
    if (!session) {
        session = {
            ws,
            sessionId,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
            container: null,
            workspacePath: null
        };
        sessions.set(sessionId, session);

        // Create workspace directory
        session.workspacePath = await ensureWorkspaceDirectory(sessionId);

        // Start container for this session
        await startContainerForSession(sessionId);
    } else {
        // Update existing session with new WebSocket
        session.ws = ws;
        session.lastActivity = Date.now();
    }

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            session.lastActivity = Date.now();
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
        // Don't cleanup immediately - keep container running for reconnection
        // Cleanup will happen on idle timeout
    });

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connected',
        sessionId,
        message: 'Connected to Docker VM Bridge',
        workspacePath: session.workspacePath
    }));
});

// Docker container management
async function startContainerForSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return;

    const containerName = `ide_session_${sessionId}`;
    const workspacePath = session.workspacePath;

    console.log(`Starting Docker container for session: ${sessionId}`);

    try {
        // Check if container already exists
        const existingContainer = containers.get(sessionId);
        if (existingContainer) {
            console.log(`Container already exists for session: ${sessionId}`);
            return;
        }

        // Start new Docker container
        const containerProcess = spawn('docker', [
            'run',
            '--rm',
            '-i',
            '--name', containerName,
            '-v', `${workspacePath}:/workspace`,
            '--cpus', CONFIG.CONTAINER_CPU_LIMIT,
            '--memory', CONFIG.CONTAINER_MEMORY_LIMIT,
            '--network', CONFIG.DOCKER_NETWORK,
            '--workdir', '/workspace',
            '-e', 'PS1=$ ',
            CONFIG.CONTAINER_IMAGE,
            'bash'
        ], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Store container reference
        containers.set(sessionId, {
            process: containerProcess,
            name: containerName,
            startedAt: Date.now()
        });

        // Handle container output
        containerProcess.stdout.on('data', (data) => {
            const session = sessions.get(sessionId);
            if (session && session.ws && session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(JSON.stringify({
                    type: 'container_output',
                    sessionId,
                    data: data.toString()
                }));
            }
        });

        containerProcess.stderr.on('data', (data) => {
            const session = sessions.get(sessionId);
            if (session && session.ws && session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(JSON.stringify({
                    type: 'container_output',
                    sessionId,
                    data: data.toString()
                }));
            }
        });

        containerProcess.on('exit', (code) => {
            console.log(`Container ${containerName} exited with code: ${code}`);
            containers.delete(sessionId);

            const session = sessions.get(sessionId);
            if (session && session.ws && session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(JSON.stringify({
                    type: 'container_exit',
                    sessionId,
                    code
                }));
            }
        });

        containerProcess.on('error', (error) => {
            console.error(`Container ${containerName} error:`, error);
            containers.delete(sessionId);
        });

        // Set up idle timeout
        setupIdleTimeout(sessionId);

        console.log(`Docker container started: ${containerName}`);

    } catch (error) {
        console.error(`Failed to start container for session ${sessionId}:`, error);
        const session = sessions.get(sessionId);
        if (session && session.ws) {
            session.ws.send(JSON.stringify({
                type: 'error',
                message: `Failed to start container: ${error.message}`
            }));
        }
    }
}

// Idle timeout management
function setupIdleTimeout(sessionId) {
    // Clear existing timer
    const existingTimer = sessionTimers.get(sessionId);
    if (existingTimer) {
        clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
        console.log(`Session ${sessionId} idle timeout - cleaning up`);
        await cleanupSession(sessionId);
    }, CONFIG.SESSION_IDLE_TIMEOUT);

    sessionTimers.set(sessionId, timer);
}

// Message handler
async function handleMessage(sessionId, data) {
    const session = sessions.get(sessionId);
    if (!session) return;

    const { type, payload } = data;

    switch (type) {
        case 'container_command':
            await handleContainerCommand(sessionId, payload);
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

        case 'stop_container':
            await stopContainer(sessionId);
            break;

        default:
            console.log(`Unknown message type: ${type}`);
    }
}

// Container command handling
async function handleContainerCommand(sessionId, payload) {
    const { command } = payload;
    const container = containers.get(sessionId);

    if (!container) {
        const session = sessions.get(sessionId);
        if (session && session.ws) {
            session.ws.send(JSON.stringify({
                type: 'error',
                message: 'Container not available for session'
            }));
        }
        return;
    }

    try {
        // Send command to container
        container.process.stdin.write(command + '\n');
    } catch (error) {
        console.error(`Failed to send command to container ${sessionId}:`, error);
        const session = sessions.get(sessionId);
        if (session && session.ws) {
            session.ws.send(JSON.stringify({
                type: 'error',
                message: `Failed to execute command: ${error.message}`
            }));
        }
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

// File operations (work with host file system, mapped to container)
async function readFile(sessionId, payload) {
    const session = sessions.get(sessionId);
    if (!session) return;

    const { path: filePath } = payload;

    try {
        // Convert container path to host path
        const hostPath = path.join(session.workspacePath, filePath.replace(/^\/workspace/, ''));
        const content = await fs.readFile(hostPath, 'utf8');

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
    if (!session) return;

    const { path: filePath, content } = payload;

    try {
        // Convert container path to host path
        const hostPath = path.join(session.workspacePath, filePath.replace(/^\/workspace/, ''));
        await fs.writeFile(hostPath, content, 'utf8');

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
    if (!session) return;

    const { path: dirPath } = payload;

    try {
        // Convert container path to host path
        const hostPath = path.join(session.workspacePath, dirPath.replace(/^\/workspace/, ''));
        const items = await fs.readdir(hostPath, { withFileTypes: true });

        const result = items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file',
            path: path.posix.join(dirPath, item.name)
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
    if (!session) return;

    const { path: dirPath } = payload;

    try {
        // Convert container path to host path
        const hostPath = path.join(session.workspacePath, dirPath.replace(/^\/workspace/, ''));
        await fs.mkdir(hostPath, { recursive: true });

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
    if (!session) return;

    const { path: filePath } = payload;

    try {
        // Convert container path to host path
        const hostPath = path.join(session.workspacePath, filePath.replace(/^\/workspace/, ''));
        const stat = await fs.stat(hostPath);

        if (stat.isDirectory()) {
            await fs.rmdir(hostPath, { recursive: true });
        } else {
            await fs.unlink(hostPath);
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
    if (!session) return;

    const { cwd = '/workspace', port = 5173 } = payload;
    const container = containers.get(sessionId);

    if (!container) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: 'Container not available'
        }));
        return;
    }

    // Check if package.json exists in container workspace
    try {
        const packageJsonPath = path.join(session.workspacePath, 'package.json');
        await fs.access(packageJsonPath);
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: 'No package.json found. Please create a Node.js project first.'
        }));
        return;
    }

    // Install dependencies if node_modules doesn't exist
    try {
        const nodeModulesPath = path.join(session.workspacePath, 'node_modules');
        await fs.access(nodeModulesPath);
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'dev_server_status',
            status: 'installing',
            message: 'Installing dependencies...'
        }));

        // Send npm install command to container
        container.process.stdin.write('npm install\n');
    }

    // Start dev server
    session.ws.send(JSON.stringify({
        type: 'dev_server_status',
        status: 'starting',
        message: 'Starting development server...'
    }));

    // Send dev server command to container
    const devCommand = `npm run dev -- --host 0.0.0.0 --port ${port}`;
    container.process.stdin.write(devCommand + '\n');
}

async function stopContainer(sessionId) {
    const container = containers.get(sessionId);
    const session = sessions.get(sessionId);

    if (container) {
        try {
            // Kill the container using docker CLI
            const killProcess = spawn('docker', ['kill', container.name]);

            killProcess.on('exit', (code) => {
                console.log(`Container ${container.name} killed with code: ${code}`);
                containers.delete(sessionId);

                if (session && session.ws) {
                    session.ws.send(JSON.stringify({
                        type: 'container_stopped',
                        sessionId
                    }));
                }
            });

        } catch (error) {
            console.error(`Failed to stop container ${sessionId}:`, error);
            if (session && session.ws) {
                session.ws.send(JSON.stringify({
                    type: 'error',
                    message: `Failed to stop container: ${error.message}`
                }));
            }
        }
    }
}

// Cleanup function
async function cleanupSession(sessionId) {
    console.log(`Cleaning up session: ${sessionId}`);

    // Stop and remove container
    const container = containers.get(sessionId);
    if (container) {
        try {
            // Kill the container
            const killProcess = spawn('docker', ['kill', container.name]);

            await new Promise((resolve) => {
                killProcess.on('exit', resolve);
            });

            console.log(`Container ${container.name} killed`);
        } catch (error) {
            console.error(`Error killing container ${container.name}:`, error);
        }

        containers.delete(sessionId);
    }

    // Clear idle timeout
    const timer = sessionTimers.get(sessionId);
    if (timer) {
        clearTimeout(timer);
        sessionTimers.delete(sessionId);
    }

    // Remove session
    sessions.delete(sessionId);

    console.log(`Session ${sessionId} cleanup complete`);
}

// HTTP routes
app.get('/health', async (req, res) => {
    try {
        // Check Docker availability
        const dockerCheck = spawn('docker', ['version']);
        let dockerAvailable = false;

        await new Promise((resolve) => {
            dockerCheck.on('exit', (code) => {
                dockerAvailable = code === 0;
                resolve();
            });
            dockerCheck.on('error', () => resolve());
        });

        res.json({
            status: 'ok',
            sessions: sessions.size,
            containers: containers.size,
            docker: dockerAvailable,
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.get('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    const container = containers.get(sessionId);

    if (session) {
        res.json({
            sessionId,
            connected: true,
            container: container ? {
                name: container.name,
                startedAt: container.startedAt
            } : null,
            workspacePath: session.workspacePath,
            lastActivity: session.lastActivity,
            connectedAt: session.connectedAt
        });
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

// Initialize Docker network
async function initializeDocker() {
    try {
        console.log('🔧 Initializing Docker environment...');

        // Create Docker network if it doesn't exist
        const networkCheck = spawn('docker', ['network', 'ls', '--format', '{{.Name}}']);

        let networks = '';
        networkCheck.stdout.on('data', (data) => {
            networks += data.toString();
        });

        await new Promise((resolve) => {
            networkCheck.on('exit', (code) => {
                if (code === 0 && !networks.includes(CONFIG.DOCKER_NETWORK)) {
                    console.log(`Creating Docker network: ${CONFIG.DOCKER_NETWORK}`);
                    const createNetwork = spawn('docker', ['network', 'create', CONFIG.DOCKER_NETWORK]);
                    createNetwork.on('exit', () => resolve());
                } else {
                    resolve();
                }
            });
        });

        // Ensure workspace base directory exists
        try {
            await fs.access(CONFIG.USER_WORKSPACE_BASE);
        } catch (error) {
            await fs.mkdir(CONFIG.USER_WORKSPACE_BASE, { recursive: true });
            console.log(`Created workspace base directory: ${CONFIG.USER_WORKSPACE_BASE}`);
        }

        console.log('✅ Docker environment initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Docker environment:', error);
    }
}

// Graceful shutdown
async function gracefulShutdown() {
    console.log('🛑 Received shutdown signal, cleaning up...');

    // Stop all containers
    for (const [sessionId, container] of containers) {
        try {
            console.log(`Stopping container for session: ${sessionId}`);
            spawn('docker', ['kill', container.name]);
        } catch (error) {
            console.error(`Error stopping container ${container.name}:`, error);
        }
    }

    // Clear all timers
    for (const timer of sessionTimers.values()) {
        clearTimeout(timer);
    }

    // Close WebSocket server
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
}

// Start server
const PORT = process.env.PORT || 3001;

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

server.listen(PORT, async () => {
    console.log(`🚀 Docker VM Bridge Server running on port ${PORT}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`🐳 Docker Network: ${CONFIG.DOCKER_NETWORK}`);
    console.log(`📁 Workspace Base: ${CONFIG.USER_WORKSPACE_BASE}`);
    console.log(`⏱️  Session Timeout: ${CONFIG.SESSION_IDLE_TIMEOUT / 1000 / 60} minutes`);
    console.log(`👥 Max Sessions: ${CONFIG.MAX_SESSIONS}`);

    await initializeDocker();
});

module.exports = app;