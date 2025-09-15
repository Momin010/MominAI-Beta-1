const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const httpProxy = require('http-proxy');
const Docker = require('dockerode');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const MonitoringService = require('./monitoring');
const PaymentService = require('./payment');
const UsageTrackingService = require('./usageTracking');
const PerformanceOptimizer = require('./performanceOptimizer');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize services
const monitoring = new MonitoringService();
const paymentService = new PaymentService();
const usageTracking = new UsageTrackingService();
const performanceOptimizer = new PerformanceOptimizer();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: ['http://localhost:12000', 'http://127.0.0.1:12000', 'http://localhost:5173', 'https://preview.mominai.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increase limit for file uploads
app.use(express.urlencoded({ extended: true }));

// Performance optimization middleware
app.use(performanceOptimizer.trackResponseTime());

// Monitoring middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const success = res.statusCode >= 200 && res.statusCode < 400;
        const rateLimited = res.statusCode === 429;
        
        monitoring.recordRequest(success, rateLimited);
    });
    
    next();
});

// Enhanced Rate limiting with multiple tiers
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many authentication attempts, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

// Premium user rate limiting (higher limits)
const premiumLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit premium users to 500 requests per windowMs
    message: {
        error: 'Rate limit exceeded for premium users.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit exceeded for premium users.',
            retryAfter: '15 minutes'
        });
    }
});

// Apply rate limiting
app.use('/api/auth/', authLimiter);
app.use('/api/', generalLimiter);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, CONFIG.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        req.isPremium = user.subscription === 'premium' || user.subscription === 'team' || user.subscription === 'enterprise';
        next();
    });
};

// Premium user middleware
const requirePremium = (req, res, next) => {
    if (!req.isPremium) {
        return res.status(403).json({ 
            error: 'Premium subscription required',
            upgradeUrl: '/upgrade',
            features: ['Docker containers', 'Remote development', 'Advanced debugging']
        });
    }
    next();
};

// Apply premium rate limiting for premium endpoints
const applyPremiumRateLimit = (req, res, next) => {
    if (req.isPremium) {
        return premiumLimiter(req, res, next);
    }
    next();
};

// Session-based authentication for WebSocket connections
const authenticateSession = (req, res, next) => {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    if (!sessionId) {
        return res.status(401).json({ error: 'Session ID required' });
    }

    const session = sessions.get(sessionId);
    if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
    }

    req.session = session;
    next();
};

// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' wss: ws: https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';");
    next();
});

// Configuration
const CONFIG = {
    USER_WORKSPACE_BASE: process.platform === 'win32' ? './user-workspaces' : '/home/ide/users',
    CONTAINER_IMAGE: 'node:20-bullseye',
    CONTAINER_CPU_LIMIT: '0.5',
    CONTAINER_MEMORY_LIMIT: '512m',
    SESSION_IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_SESSIONS: 50, // Limit concurrent sessions
    DOCKER_NETWORK: 'ide-network',
    USE_DOCKER: false, // Set to true for production, false for local development
    JWT_SECRET: process.env.JWT_SECRET || 'mominai-jwt-secret-key',
    PREVIEW_DOMAIN: process.env.PREVIEW_DOMAIN || 'preview.mominai.com',
    API_PORT: process.env.PORT || 3001
};

// Initialize Docker client
const docker = new Docker();

// Initialize proxy server for preview functionality
const proxy = httpProxy.createProxyServer({
    ws: true,
    changeOrigin: true
});

// In-memory user store (in production, use a database)
const users = new Map();
const activePreviews = new Map(); // sessionId -> { port, containerId }

// In-memory storage for sessions and containers
const sessions = new Map(); // sessionId -> session data
const containers = new Map(); // sessionId -> container process
const sessionTimers = new Map(); // sessionId -> idle timeout timer

// Docker availability detection
async function checkDockerAvailability() {
    return new Promise((resolve) => {
        const dockerCheck = spawn('docker', ['version'], { stdio: 'pipe' });
        dockerCheck.on('exit', (code) => {
            CONFIG.USE_DOCKER = code === 0;
            console.log(`Docker ${CONFIG.USE_DOCKER ? 'available' : 'not available'}`);
            resolve(CONFIG.USE_DOCKER);
        });
        dockerCheck.on('error', () => {
            CONFIG.USE_DOCKER = false;
            console.log('Docker not available - using local mode');
            resolve(false);
        });
    });
}

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
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.pathname.split('/').pop();
    const token = url.searchParams.get('token');

    console.log(`New WebSocket connection for session: ${sessionId}`);

    // Authenticate WebSocket connection
    if (!token) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Authentication token required'
        }));
        ws.close();
        return;
    }

    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
        console.log(`Authenticated user: ${decoded.email}`);
    } catch (error) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid authentication token'
        }));
        ws.close();
        return;
    }

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
            workspacePath: null,
            userId: null // Will be set from token
        };
        sessions.set(sessionId, session);

        // Create workspace directory
        session.workspacePath = await ensureWorkspaceDirectory(sessionId);

        // Start process/container for this session
        await startProcessForSession(sessionId);
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
        message: `Connected to ${CONFIG.USE_DOCKER ? 'Docker VM Bridge' : 'Local Development Bridge'}`,
        workspacePath: session.workspacePath,
        mode: CONFIG.USE_DOCKER ? 'docker' : 'local'
    }));
});

// Process/container management (Docker or Local)
async function startProcessForSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return;

    const workspacePath = session.workspacePath;

    console.log(`${CONFIG.USE_DOCKER ? 'Starting Docker container' : 'Starting local process'} for session: ${sessionId}`);

    try {
        // Check if process already exists
        const existingProcess = containers.get(sessionId);
        if (existingProcess) {
            console.log(`Process already exists for session: ${sessionId}`);
            return;
        }

        let processInstance;

        if (CONFIG.USE_DOCKER) {
            // Docker mode
            const containerName = `ide_session_${sessionId}`;
            processInstance = spawn('docker', [
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
        } else {
            // Local mode (fallback)
            console.log(`Starting local process for session: ${sessionId}`);
            console.log(`Workspace path: ${workspacePath}`);
            console.log(`Platform: ${process.platform}`);

            let shell, shellArgs;

            if (process.platform === 'win32') {
                // Use cmd.exe as primary shell on Windows (without /c so it stays open)
                shell = 'cmd.exe';
                shellArgs = [];
                console.log(`Using cmd.exe on Windows (interactive mode)`);
            } else {
                shell = 'bash';
                shellArgs = [];
                console.log(`Using bash on Unix-like system`);
            }

            console.log(`Using shell: ${shell} with args: ${JSON.stringify(shellArgs)}`);

            try {
                // Ensure npm is available in PATH
                const nodeBinPath = path.join(process.cwd(), 'node-v22.18.0-win-x64');
                const updatedEnv = {
                    ...process.env,
                    PATH: `${nodeBinPath};${process.env.PATH}`,
                    PS1: '$ '
                };
    
                processInstance = spawn(shell, shellArgs, {
                    cwd: workspacePath,
                    env: updatedEnv,
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                console.log(`Process spawned with PID: ${processInstance.pid}`);
            } catch (spawnError) {
                console.error(`Failed to spawn ${shell}:`, spawnError);

                // Final fallback: try cmd.exe directly
                if (process.platform === 'win32') {
                    console.log(`Trying cmd.exe as final fallback...`);
                    processInstance = spawn('cmd.exe', [], {
                        cwd: workspacePath,
                        env: { ...process.env },
                        stdio: ['pipe', 'pipe', 'pipe']
                    });
                    console.log(`cmd.exe process spawned with PID: ${processInstance.pid}`);
                } else {
                    throw spawnError;
                }
            }
        }

        // Store process reference
        containers.set(sessionId, {
            process: processInstance,
            name: CONFIG.USE_DOCKER ? `ide_session_${sessionId}` : `local_process_${sessionId}`,
            startedAt: Date.now()
        });

        // Handle process output
        processInstance.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`📝 STDOUT from ${containers.get(sessionId)?.name}:`, output);
            const session = sessions.get(sessionId);
            if (session && session.ws && session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(JSON.stringify({
                    type: 'container_output',
                    sessionId,
                    data: output
                }));
            }
        });

        processInstance.stderr.on('data', (data) => {
            const output = data.toString();
            console.log(`📝 STDERR from ${containers.get(sessionId)?.name}:`, output);
            const session = sessions.get(sessionId);
            if (session && session.ws && session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(JSON.stringify({
                    type: 'container_output',
                    sessionId,
                    data: output
                }));
            }
        });

        processInstance.on('exit', (code) => {
            console.log(`${CONFIG.USE_DOCKER ? 'Container' : 'Process'} ${containers.get(sessionId)?.name} exited with code: ${code}`);

            // Don't delete the container immediately - keep it for potential restart
            // Only delete if it's a clean exit (code 0) or error exit
            if (code !== 0) {
                console.log(`Process exited with error code ${code}, keeping container for potential restart`);
            }

            const session = sessions.get(sessionId);
            if (session && session.ws && session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(JSON.stringify({
                    type: 'container_exit',
                    sessionId,
                    code
                }));

                // If process exited with error, try to restart it
                if (code !== 0) {
                    console.log(`Attempting to restart process for session: ${sessionId}`);
                    setTimeout(() => {
                        startProcessForSession(sessionId);
                    }, 1000); // Wait 1 second before restart
                }
            }
        });

        processInstance.on('error', (error) => {
            console.error(`${CONFIG.USE_DOCKER ? 'Container' : 'Process'} error:`, error);
            containers.delete(sessionId);

            // Send error to client
            const session = sessions.get(sessionId);
            if (session && session.ws && session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(JSON.stringify({
                    type: 'error',
                    message: `Failed to start ${CONFIG.USE_DOCKER ? 'container' : 'process'}: ${error.message}`
                }));
            }
        });

        // Set up idle timeout
        setupIdleTimeout(sessionId);

        console.log(`${CONFIG.USE_DOCKER ? 'Docker container' : 'Local process'} started: ${containers.get(sessionId)?.name}`);

    } catch (error) {
        console.error(`Failed to start ${CONFIG.USE_DOCKER ? 'container' : 'process'} for session ${sessionId}:`, error);
        const session = sessions.get(sessionId);
        if (session && session.ws) {
            session.ws.send(JSON.stringify({
                type: 'error',
                message: `Failed to start ${CONFIG.USE_DOCKER ? 'container' : 'process'}: ${error.message}`
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
    console.log(`📨 Received WebSocket message for session ${sessionId}:`, data);
    const session = sessions.get(sessionId);
    if (!session) {
        console.error(`❌ Session ${sessionId} not found`);
        return;
    }

    const { type, payload } = data;
    console.log(`🔄 Processing message type: ${type}`);

    switch (type) {
        case 'container_command':
            console.log(`🚀 Handling container command`);
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

        case 'get_container_status':
            await getContainerStatus(sessionId);
            break;

        case 'restart_container':
            await restartContainer(sessionId);
            break;

        case 'exec_command':
            await execCommand(sessionId, payload);
            break;

        case 'start_preview':
            await startPreview(sessionId, payload);
            break;

        case 'stop_preview':
            await stopPreview(sessionId);
            break;

        default:
            console.log(`❓ Unknown message type: ${type}`);
    }
}

// Container command handling
async function handleContainerCommand(sessionId, payload) {
    console.log(`🔧 Received container command for session ${sessionId}:`, payload);
    const { command } = payload;
    const container = containers.get(sessionId);

    if (!container) {
        console.error(`❌ Container not found for session ${sessionId}`);
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
        console.log(`📤 Sending command to container: ${command}`);
        // Send command to container
        container.process.stdin.write(command + '\n');
        console.log(`✅ Command sent successfully`);
    } catch (error) {
        console.error(`❌ Failed to send command to container ${sessionId}:`, error);
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
    const processInfo = containers.get(sessionId);
    const session = sessions.get(sessionId);

    if (processInfo) {
        try {
            if (CONFIG.USE_DOCKER) {
                // Kill Docker container
                const killProcess = spawn('docker', ['kill', processInfo.name]);

                killProcess.on('exit', (code) => {
                    console.log(`Container ${processInfo.name} killed with code: ${code}`);
                    containers.delete(sessionId);

                    if (session && session.ws) {
                        session.ws.send(JSON.stringify({
                            type: 'container_stopped',
                            sessionId
                        }));
                    }
                });
            } else {
                // Kill local process
                processInfo.process.kill();
                console.log(`Local process ${processInfo.name} killed`);
                containers.delete(sessionId);

                if (session && session.ws) {
                    session.ws.send(JSON.stringify({
                        type: 'container_stopped',
                        sessionId
                    }));
                }
            }

        } catch (error) {
            console.error(`Failed to stop ${CONFIG.USE_DOCKER ? 'container' : 'process'} ${sessionId}:`, error);
            if (session && session.ws) {
                session.ws.send(JSON.stringify({
                    type: 'error',
                    message: `Failed to stop ${CONFIG.USE_DOCKER ? 'container' : 'process'}: ${error.message}`
                }));
            }
        }
    }
}

// New WebSocket handler functions
async function getContainerStatus(sessionId) {
    const session = sessions.get(sessionId);
    const container = containers.get(sessionId);

    if (!session || !session.ws) return;

    try {
        let status = 'stopped';
        let containerInfo = null;

        if (CONFIG.USE_DOCKER && container) {
            const dockerContainer = docker.getContainer(container.name);
            const info = await dockerContainer.inspect();
            status = info.State.Status;
            containerInfo = {
                id: info.Id,
                name: info.Name,
                image: info.Config.Image,
                status: info.State.Status,
                ports: info.NetworkSettings.Ports,
                created: info.Created
            };
        } else if (container) {
            status = 'running';
            containerInfo = {
                name: container.name,
                startedAt: container.startedAt
            };
        }

        session.ws.send(JSON.stringify({
            type: 'container_status',
            sessionId,
            status,
            container: containerInfo
        }));
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to get container status'
        }));
    }
}

async function restartContainer(sessionId) {
    const session = sessions.get(sessionId);
    if (!session || !session.ws) return;

    try {
        // Stop current container
        await stopContainer(sessionId);

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Start new container
        await startProcessForSession(sessionId);

        session.ws.send(JSON.stringify({
            type: 'container_restarted',
            sessionId
        }));
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to restart container'
        }));
    }
}

async function execCommand(sessionId, payload) {
    const session = sessions.get(sessionId);
    if (!session || !session.ws) return;

    const { command, args = [], cwd = '/workspace' } = payload;

    try {
        if (CONFIG.USE_DOCKER) {
            const container = containers.get(sessionId);
            if (!container) {
                throw new Error('Container not available');
            }

            const dockerContainer = docker.getContainer(container.name);
            const exec = await dockerContainer.exec({
                Cmd: [command, ...args],
                WorkingDir: cwd,
                AttachStdout: true,
                AttachStderr: true
            });

            const stream = await exec.start();
            const execId = `exec_${Date.now()}`;

            stream.on('data', (chunk) => {
                session.ws.send(JSON.stringify({
                    type: 'exec_output',
                    execId,
                    data: chunk.toString()
                }));
            });

            stream.on('end', () => {
                session.ws.send(JSON.stringify({
                    type: 'exec_end',
                    execId
                }));
            });
        } else {
            // Local execution
            const proc = spawn(command, args, { cwd: session.workspacePath });
            const execId = `exec_${Date.now()}`;

            proc.stdout.on('data', (data) => {
                session.ws.send(JSON.stringify({
                    type: 'exec_output',
                    execId,
                    data: data.toString()
                }));
            });

            proc.stderr.on('data', (data) => {
                session.ws.send(JSON.stringify({
                    type: 'exec_output',
                    execId,
                    data: data.toString()
                }));
            });

            proc.on('exit', (code) => {
                session.ws.send(JSON.stringify({
                    type: 'exec_end',
                    execId,
                    code
                }));
            });
        }
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to execute command: ${error.message}`
        }));
    }
}

async function startPreview(sessionId, payload) {
    const session = sessions.get(sessionId);
    if (!session || !session.ws) return;

    const { port = 3000 } = payload;

    try {
        if (CONFIG.USE_DOCKER) {
            const container = containers.get(sessionId);
            if (!container) {
                throw new Error('Container not available');
            }

            const dockerContainer = docker.getContainer(container.name);

            // Get container info to check if port is exposed
            const info = await dockerContainer.inspect();

            // Expose port if not already exposed
            if (!info.NetworkSettings.Ports[`${port}/tcp`]) {
                // Note: In a real implementation, you'd need to recreate the container with port mapping
                // For now, we'll assume the port is already mapped
            }

            activePreviews.set(sessionId, {
                port,
                containerId: container.name,
                startedAt: Date.now()
            });

            session.ws.send(JSON.stringify({
                type: 'preview_started',
                sessionId,
                port,
                url: `https://${CONFIG.PREVIEW_DOMAIN}/${sessionId}`
            }));
        } else {
            // For local development, just mark as active
            activePreviews.set(sessionId, {
                port,
                startedAt: Date.now()
            });

            session.ws.send(JSON.stringify({
                type: 'preview_started',
                sessionId,
                port,
                url: `http://localhost:${port}`
            }));
        }
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: `Failed to start preview: ${error.message}`
        }));
    }
}

async function stopPreview(sessionId) {
    const session = sessions.get(sessionId);
    if (!session || !session.ws) return;

    try {
        activePreviews.delete(sessionId);

        session.ws.send(JSON.stringify({
            type: 'preview_stopped',
            sessionId
        }));
    } catch (error) {
        session.ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to stop preview'
        }));
    }
}

// Cleanup function
async function cleanupSession(sessionId) {
    console.log(`Cleaning up session: ${sessionId}`);

    // Stop and remove process/container
    const processInfo = containers.get(sessionId);
    if (processInfo) {
        try {
            if (CONFIG.USE_DOCKER) {
                // Kill Docker container
                const killProcess = spawn('docker', ['kill', processInfo.name]);

                await new Promise((resolve) => {
                    killProcess.on('exit', (code) => {
                        console.log(`Container ${processInfo.name} killed with code: ${code}`);
                        resolve();
                    });
                });
            } else {
                // Kill local process
                processInfo.process.kill();
                console.log(`Local process ${processInfo.name} killed`);
            }

        } catch (error) {
            console.error(`Error killing ${CONFIG.USE_DOCKER ? 'container' : 'process'} ${processInfo.name}:`, error);
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

// Authentication routes
// Enhanced input validation middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize all string inputs
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str
            .replace(/[<>\"'&]/g, (match) => {
                const entities = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                };
                return entities[match];
            })
            .trim()
            .substring(0, 1000); // Limit length
    };

    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        });
    }

    next();
};

app.post('/api/auth/register', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .isLength({ max: 254 })
        .custom((value) => {
            // Check for suspicious patterns
            if (value.includes('..') || value.includes('//')) {
                throw new Error('Invalid email format');
            }
            return true;
        }),
    body('password')
        .isLength({ min: 8, max: 128 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number, and special character'),
    body('username')
        .isLength({ min: 3, max: 30 })
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username must contain only letters, numbers, underscores, and hyphens'),
    sanitizeInput
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, username } = req.body;

        // Check if user already exists
        if (users.has(email)) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: Date.now().toString(),
            email,
            username,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            sessions: []
        };

        users.set(email, user);

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            CONFIG.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: user.id, email: user.email, username: user.username }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .isLength({ max: 254 })
        .custom((value) => {
            if (value.includes('..') || value.includes('//')) {
                throw new Error('Invalid email format');
            }
            return true;
        }),
    body('password')
        .exists()
        .isLength({ min: 1, max: 128 }),
    sanitizeInput
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        const user = users.get(email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            CONFIG.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, username: user.username }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Container management endpoints
app.post('/api/containers', authenticateToken, async (req, res) => {
    try {
        const { image = CONFIG.CONTAINER_IMAGE, name, env = [], ports = [] } = req.body;
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create workspace directory
        const workspacePath = await ensureWorkspaceDirectory(sessionId);

        let container;
        if (CONFIG.USE_DOCKER) {
            // Create Docker container
            container = await docker.createContainer({
                Image: image,
                name: name || `ide_session_${sessionId}`,
                Env: env,
                HostConfig: {
                    Binds: [`${workspacePath}:/workspace`],
                    CpuQuota: parseFloat(CONFIG.CONTAINER_CPU_LIMIT) * 100000,
                    Memory: parseInt(CONFIG.CONTAINER_MEMORY_LIMIT.replace('m', '')) * 1024 * 1024,
                    NetworkMode: CONFIG.DOCKER_NETWORK
                },
                WorkingDir: '/workspace',
                Tty: true,
                OpenStdin: true,
                StdinOnce: false
            });

            // Start container
            await container.start();
        }

        // Create session
        const session = {
            id: sessionId,
            userId: req.user.id,
            containerId: container ? container.id : null,
            workspacePath,
            createdAt: new Date().toISOString(),
            status: 'running'
        };

        sessions.set(sessionId, session);

        res.status(201).json({
            sessionId,
            containerId: container ? container.id : null,
            workspacePath,
            status: 'running'
        });
    } catch (error) {
        console.error('Container creation error:', error);
        res.status(500).json({ error: 'Failed to create container' });
    }
});

app.get('/api/containers/:sessionId', authenticateToken, (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    res.json(session);
});

app.delete('/api/containers/:sessionId', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = sessions.get(sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Stop and remove container
        if (CONFIG.USE_DOCKER && session.containerId) {
            try {
                const container = docker.getContainer(session.containerId);
                await container.stop({ t: 10 });
                await container.remove();
            } catch (error) {
                console.error('Error stopping container:', error);
            }
        }

        // Clean up session
        sessions.delete(sessionId);
        await cleanupSession(sessionId);

        res.json({ message: 'Container destroyed successfully' });
    } catch (error) {
        console.error('Container destruction error:', error);
        res.status(500).json({ error: 'Failed to destroy container' });
    }
});

// File operations endpoints
app.get('/api/containers/:sessionId/files/*', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const filePath = req.params[0];
        const session = sessions.get(sessionId);

        if (!session || session.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const fullPath = path.join(session.workspacePath, filePath);
        const content = await fs.readFile(fullPath, 'utf8');

        res.json({ content });
    } catch (error) {
        res.status(404).json({ error: 'File not found' });
    }
});

app.put('/api/containers/:sessionId/files/*', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const filePath = req.params[0];
        const { content } = req.body;
        const session = sessions.get(sessionId);

        if (!session || session.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const fullPath = path.join(session.workspacePath, filePath);
        await fs.writeFile(fullPath, content, 'utf8');

        res.json({ message: 'File updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update file' });
    }
});

// Preview proxy routes
app.get('/preview/:sessionId/*', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const previewPath = req.params[0] || '';
        const session = sessions.get(sessionId);

        if (!session || session.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const preview = activePreviews.get(sessionId);
        if (!preview) {
            return res.status(404).json({ error: 'Preview not available' });
        }

        // Proxy the request to the container
        const target = `http://localhost:${preview.port}`;
        proxy.web(req, res, { target }, (error) => {
            console.error('Proxy error:', error);
            res.status(500).json({ error: 'Preview proxy error' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Preview error' });
    }
});

// HTTP routes
// Monitoring and health endpoints
app.get('/api/health', async (req, res) => {
    try {
        const healthStatus = monitoring.getHealthStatus();
        res.status(200).json({
            status: healthStatus.status,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            issues: healthStatus.issues,
            metrics: healthStatus.metrics
        });
    } catch (error) {
        res.status(500).json({ error: 'Health check failed' });
    }
});

app.get('/api/metrics', authenticateToken, async (req, res) => {
    try {
        const metrics = monitoring.getMetrics();
        res.status(200).json(metrics);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});

app.get('/api/alerts', authenticateToken, async (req, res) => {
    try {
        const alerts = monitoring.alerts.slice(-20); // Last 20 alerts
        res.status(200).json({ alerts });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get alerts' });
    }
});

app.get('/api/performance', authenticateToken, async (req, res) => {
    try {
        const performanceReport = performanceOptimizer.getPerformanceReport();
        res.status(200).json(performanceReport);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get performance data' });
    }
});

app.post('/api/performance/optimize', authenticateToken, async (req, res) => {
    try {
        // Only allow performance optimization for premium users
        if (!req.isPremium) {
            return res.status(403).json({ error: 'Performance optimization requires premium subscription' });
        }

        performanceOptimizer.optimizeMemory();
        res.status(200).json({ message: 'Performance optimization completed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to optimize performance' });
    }
});

// Subscription and usage management endpoints
app.get('/api/subscription/status', authenticateToken, async (req, res) => {
    try {
        const subscription = req.user.subscription || 'free';
        const usageStats = usageTracking.getUsageStats(req.user.id, subscription);
        
        res.status(200).json({
            subscription: subscription,
            isPremium: req.isPremium,
            features: req.isPremium ? ['docker', 'remote_dev', 'advanced_debug'] : ['webcontainer'],
            limits: req.isPremium ? { requests: 500, storage: 'unlimited' } : { requests: 100, storage: '1GB' },
            usage: usageStats
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get subscription status' });
    }
});

app.get('/api/usage/stats', authenticateToken, async (req, res) => {
    try {
        const subscription = req.user.subscription || 'free';
        const usageStats = usageTracking.getUsageStats(req.user.id, subscription);
        
        res.status(200).json({
            subscription: subscription,
            usage: usageStats
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get usage stats' });
    }
});

app.post('/api/usage/reset', authenticateToken, async (req, res) => {
    try {
        // Only allow reset for premium users or daily reset
        if (req.isPremium) {
            usageTracking.resetUsage(req.user.id);
            res.status(200).json({ message: 'Usage reset successfully' });
        } else {
            res.status(403).json({ error: 'Usage reset only available for premium users' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset usage' });
    }
});

// Payment and subscription endpoints
app.get('/api/plans', async (req, res) => {
    try {
        const plans = paymentService.getPlans();
        res.status(200).json({ plans });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get plans' });
    }
});

app.post('/api/payment/create-customer', authenticateToken, async (req, res) => {
    try {
        const result = await paymentService.createCustomer(req.user);
        
        if (result.success) {
            // Update user with customer ID (in real implementation, save to database)
            req.user.stripeCustomerId = result.customerId;
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

app.post('/api/payment/create-subscription', authenticateToken, async (req, res) => {
    try {
        const { planId } = req.body;
        const customerId = req.user.stripeCustomerId;
        
        if (!customerId) {
            return res.status(400).json({ error: 'Customer not found. Please create customer first.' });
        }

        const result = await paymentService.createSubscription(customerId, planId);
        
        if (result.success) {
            // Update user subscription (in real implementation, save to database)
            req.user.subscription = planId;
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});

app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        const result = await paymentService.handleWebhook(req.body, signature);
        
        if (result.success) {
            res.status(200).json({ received: true });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(400).json({ error: 'Webhook error' });
    }
});

// Premium feature endpoints (legacy activation code support)
app.post('/api/premium/activate', authenticateToken, async (req, res) => {
    try {
        const { activationCode } = req.body;
        
        if (activationCode === 'FREEPALESTINE1!') {
            // In a real implementation, this would update the database
            req.user.subscription = 'premium';
            monitoring.recordUserAction('upgrade', true);
            res.status(200).json({
                success: true,
                subscription: 'premium',
                message: 'Premium activated successfully'
            });
        } else {
            res.status(400).json({ error: 'Invalid activation code' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to activate premium' });
    }
});

// Container management endpoints with premium checks
app.get('/api/containers', authenticateToken, requirePremium, applyPremiumRateLimit, async (req, res) => {
    try {
        if (!CONFIG.USE_DOCKER) {
            return res.status(503).json({ error: 'Docker not available' });
        }

        const containerList = Array.from(containers.values()).map(container => ({
            id: container.name,
            name: container.name,
            status: container.status,
            created: container.created
        }));

        res.status(200).json({ containers: containerList });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list containers' });
    }
});

// File system endpoints with proper routing
app.get('/api/containers/:sessionId/files/*', authenticateToken, async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const filePath = req.params[0] || '/workspace';
        
        // Check if user owns this session
        if (req.user.userId !== sessions.get(sessionId)?.userId) {
            return res.status(403).json({ error: 'Access denied to this session' });
        }

        const containerInfo = containers.get(sessionId);
        if (!containerInfo) {
            return res.status(404).json({ error: 'Container not found' });
        }

        if (CONFIG.USE_DOCKER) {
            const container = docker.getContainer(containerInfo.name);
            const exec = await container.exec({
                Cmd: ['cat', filePath],
                AttachStdout: true,
                AttachStderr: true
            });

            const stream = await exec.start();
            let output = '';
            stream.on('data', (chunk) => {
                output += chunk.toString();
            });

            stream.on('end', () => {
                res.status(200).json({ 
                    path: filePath,
                    content: output,
                    size: output.length
                });
            });
        } else {
            // Local mode - read from local filesystem
            try {
                const fullPath = path.join(CONFIG.LOCAL_WORKSPACE_DIR, sessionId, filePath);
                const content = await fs.readFile(fullPath, 'utf8');
                res.status(200).json({ 
                    path: filePath,
                    content: content,
                    size: content.length
                });
            } catch (error) {
                res.status(404).json({ error: 'File not found' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to read file' });
    }
});

app.get('/health', async (req, res) => {
    try {
        const containerStats = [];
        let dockerStatus = 'unavailable';

        if (CONFIG.USE_DOCKER) {
            try {
                const dockerInfo = await docker.info();
                dockerStatus = 'available';

                // Get detailed container information
                for (const [sessionId, containerInfo] of containers) {
                    try {
                        const container = docker.getContainer(containerInfo.name);
                        const stats = await container.stats({ stream: false });
                        const info = await container.inspect();

                        containerStats.push({
                            sessionId,
                            name: containerInfo.name,
                            status: info.State.Status,
                            cpu: stats.cpu_stats ? ((stats.cpu_stats.cpu_usage.total_usage / stats.cpu_stats.system_cpu_usage) * 100).toFixed(2) : 0,
                            memory: stats.memory_stats ? {
                                used: stats.memory_stats.usage,
                                limit: stats.memory_stats.limit,
                                percentage: ((stats.memory_stats.usage / stats.memory_stats.limit) * 100).toFixed(2)
                            } : null,
                            network: stats.networks ? stats.networks.eth0 : null,
                            startedAt: containerInfo.startedAt
                        });
                    } catch (error) {
                        containerStats.push({
                            sessionId,
                            name: containerInfo.name,
                            status: 'error',
                            error: error.message
                        });
                    }
                }
            } catch (error) {
                dockerStatus = 'error';
            }
        }

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            sessions: {
                total: sessions.size,
                active: Array.from(sessions.values()).filter(s => s.ws && s.ws.readyState === 1).length
            },
            containers: {
                total: containers.size,
                docker: CONFIG.USE_DOCKER,
                dockerStatus,
                details: containerStats
            },
            previews: {
                active: activePreviews.size
            },
            config: {
                maxSessions: CONFIG.MAX_SESSIONS,
                containerImage: CONFIG.CONTAINER_IMAGE,
                cpuLimit: CONFIG.CONTAINER_CPU_LIMIT,
                memoryLimit: CONFIG.CONTAINER_MEMORY_LIMIT,
                idleTimeout: CONFIG.SESSION_IDLE_TIMEOUT
            },
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                memory: process.memoryUsage(),
                loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
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

    // Stop all processes/containers
    for (const [sessionId, processInfo] of containers) {
        try {
            if (CONFIG.USE_DOCKER) {
                console.log(`Stopping container for session: ${sessionId}`);
                spawn('docker', ['kill', processInfo.name]);
            } else {
                console.log(`Stopping local process for session: ${sessionId}`);
                processInfo.process.kill();
            }
        } catch (error) {
            console.error(`Error stopping ${CONFIG.USE_DOCKER ? 'container' : 'process'} ${processInfo.name}:`, error);
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
    // Check Docker availability
    await checkDockerAvailability();

    console.log(`🚀 ${CONFIG.USE_DOCKER ? 'Docker VM Bridge' : 'Local Development'} Server running on port ${PORT}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`🔧 Mode: ${CONFIG.USE_DOCKER ? 'Docker (Production)' : 'Local (Development)'}`);

    if (CONFIG.USE_DOCKER) {
        console.log(`🐳 Docker Network: ${CONFIG.DOCKER_NETWORK}`);
        await initializeDocker();
    } else {
        console.log(`💻 Local Mode: Using system processes`);
        // Ensure workspace directory exists for local mode
        try {
            await fs.access(CONFIG.USER_WORKSPACE_BASE);
        } catch (error) {
            await fs.mkdir(CONFIG.USER_WORKSPACE_BASE, { recursive: true });
            console.log(`Created workspace base directory: ${CONFIG.USER_WORKSPACE_BASE}`);
        }
    }

    console.log(`📁 Workspace Base: ${CONFIG.USER_WORKSPACE_BASE}`);
    console.log(`⏱️  Session Timeout: ${CONFIG.SESSION_IDLE_TIMEOUT / 1000 / 60} minutes`);
    console.log(`👥 Max Sessions: ${CONFIG.MAX_SESSIONS}`);
});

module.exports = app;