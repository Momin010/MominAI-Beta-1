# MominAI Backend Container Management API

A comprehensive Node.js Express server that provides Docker container management for the MominAI IDE, featuring real-time WebSocket communication, authentication, and preview proxy functionality.

## Features

### 🐳 Container Lifecycle Management
- Create new Docker containers for user sessions
- Start/stop/destroy containers with proper cleanup
- Container health monitoring and resource usage tracking
- Automatic idle timeout and session management

### 📁 File Operations
- Read/write files within containers
- Directory listing and creation
- File synchronization between host and container
- Support for large file uploads

### ⚡ Command Execution
- Execute npm install/dev commands
- Real-time terminal output streaming via WebSocket
- Interactive shell session support
- Command history and process management

### 🌐 WebSocket Communication
- Real-time terminal output streaming
- File operation status updates
- Container status notifications
- Live preview updates

### 🔗 Preview Proxy
- Proxy container ports to external URLs
- Support for preview.mominai.com/<id> routing
- SSL termination and security
- Load balancing support

### 🔐 Security & Authentication
- JWT-based user authentication
- Session-based authorization
- Rate limiting for API calls
- Container isolation and resource limits
- Security headers and CORS protection

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

#### POST /api/auth/login
Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Container Management

#### POST /api/containers
Create a new container session.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "image": "node:20-bullseye",
  "name": "my-container",
  "env": ["NODE_ENV=development"],
  "ports": [3000, 5173]
}
```

#### GET /api/containers/:sessionId
Get container session information.

#### DELETE /api/containers/:sessionId
Destroy a container session.

### File Operations

#### GET /api/containers/:sessionId/files/*
Read a file from the container.

#### PUT /api/containers/:sessionId/files/*
Write content to a file in the container.

**Request Body:**
```json
{
  "content": "file content here"
}
```

### Preview Proxy

#### GET /preview/:sessionId/*
Access container preview through proxy.

## WebSocket API

### Connection
```
ws://localhost:3001/ws?token=<jwt_token>
```

### Message Types

#### Container Commands
```json
{
  "type": "container_command",
  "payload": {
    "command": "npm install"
  }
}
```

#### File Operations
```json
{
  "type": "read_file",
  "payload": {
    "path": "/workspace/package.json"
  }
}
```

```json
{
  "type": "write_file",
  "payload": {
    "path": "/workspace/hello.txt",
    "content": "Hello World!"
  }
}
```

#### Command Execution
```json
{
  "type": "exec_command",
  "payload": {
    "command": "npm",
    "args": ["run", "dev"],
    "cwd": "/workspace"
  }
}
```

#### Preview Management
```json
{
  "type": "start_preview",
  "payload": {
    "port": 3000
  }
}
```

## Configuration

### Environment Variables

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-secret-key
PREVIEW_DOMAIN=preview.mominai.com
USER_WORKSPACE_BASE=/home/ide/users
CONTAINER_CPU_LIMIT=0.5
CONTAINER_MEMORY_LIMIT=512m
SESSION_IDLE_TIMEOUT=1800000
MAX_SESSIONS=50
```

### Docker Configuration

The server automatically detects Docker availability and switches between:
- **Docker Mode**: Full containerization with resource limits
- **Local Mode**: Local process execution (fallback)

## Health Monitoring

### GET /health
Comprehensive health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "sessions": {
    "total": 5,
    "active": 3
  },
  "containers": {
    "total": 3,
    "docker": true,
    "dockerStatus": "available",
    "details": [...]
  },
  "previews": {
    "active": 2
  },
  "config": {...},
  "system": {...}
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for specific origins
- **Security Headers**: Helmet.js protection
- **Input Validation**: Express-validator for all inputs
- **Container Isolation**: Each session runs in isolated container
- **Resource Limits**: CPU and memory limits per container

## Installation & Setup

### Prerequisites
- Node.js 18+
- Docker (optional, for container mode)
- npm or yarn

### Installation
```bash
cd server
npm install
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker Deployment
```bash
docker-compose up -d --build
```

## Architecture

### Components

1. **Express Server**: REST API endpoints
2. **WebSocket Server**: Real-time communication
3. **Docker Client**: Container management
4. **Proxy Server**: Preview functionality
5. **Session Manager**: User session handling
6. **File System**: Host-container file sync

### Data Flow

1. User authenticates via REST API
2. JWT token used for WebSocket authentication
3. Container created on session start
4. File operations sync between host and container
5. Commands executed in container with real-time output
6. Preview proxy routes external traffic to container ports

## Error Handling

The API provides comprehensive error handling:

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (access denied)
- **404**: Not Found (resource doesn't exist)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

All errors include descriptive messages and appropriate HTTP status codes.

## Monitoring & Logging

- **Health Checks**: Automatic container health monitoring
- **Resource Tracking**: CPU, memory, and network usage
- **Session Monitoring**: Active session tracking
- **Error Logging**: Comprehensive error logging
- **Performance Metrics**: Response times and throughput

## Integration with Frontend

The backend is designed to integrate seamlessly with the existing MominAI frontend:

- **Same Interface**: Provides WebContainer-compatible API
- **WebSocket Streaming**: Real-time updates for terminal and file operations
- **Authentication**: JWT tokens for secure communication
- **Preview URLs**: Direct access to running applications

## Scaling Considerations

- **Horizontal Scaling**: Stateless design supports multiple instances
- **Load Balancing**: Nginx configuration provided
- **Session Affinity**: WebSocket connections maintain session state
- **Resource Management**: Configurable limits per container
- **Database Integration**: Ready for external user/session storage

## Troubleshooting

### Common Issues

1. **Container Won't Start**: Check Docker availability and permissions
2. **WebSocket Connection Failed**: Verify JWT token and CORS settings
3. **File Sync Issues**: Check workspace directory permissions
4. **Preview Not Working**: Verify port mapping and proxy configuration
5. **High Resource Usage**: Monitor container limits and session timeouts

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm start
```

### Logs Location

- **Application Logs**: `/app/logs/` (in container)
- **Docker Logs**: `docker-compose logs -f`
- **System Logs**: `/var/log/syslog`

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure security best practices
5. Test with both Docker and local modes

## License

MIT License - see LICENSE file for details.