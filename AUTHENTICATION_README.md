# Authentication System Implementation

This document describes the authentication system implemented to secure all API endpoints.

## Overview

The system implements both JWT token-based authentication and API key authentication to support different use cases:

- **JWT Tokens**: For session-based authentication (recommended for web applications)
- **API Keys**: For programmatic access (recommended for integrations)

## Security Features

- All API endpoints are now protected except authentication endpoints
- JWT tokens expire after 24 hours
- API keys are hashed and stored securely
- Passwords are hashed using bcrypt
- Proper error handling for unauthorized requests

## API Endpoints

### Authentication Endpoints (Public)

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_123",
    "email": "user@example.com"
  },
  "token": "jwt_token_here"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "apiKeys": 0
  },
  "token": "jwt_token_here"
}
```

#### Generate API Key
```
POST /api/auth/generate-api-key
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "name": "My API Key"
}
```

Response:
```json
{
  "message": "API key generated successfully",
  "apiKey": "mk_1234567890abcdef",
  "keys": [...]
}
```

#### List API Keys
```
GET /api/auth/generate-api-key
Authorization: Bearer jwt_token_here
```

### Protected Endpoints

All other API endpoints now require authentication:

#### Using JWT Token
```
Authorization: Bearer jwt_token_here
```

#### Using API Key
```
x-api-key: mk_1234567890abcdef
```

## Protected Routes

The following routes are now protected:
- `/api/generate` - AI code generation
- `/api/webcontainer-proxy/*` - WebContainer proxy
- `/api/proxy/*` - General proxy

## Environment Variables

Add these to your `.env` file:
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
API_KEY_SECRET=your-super-secret-api-key-change-in-production
```

## Testing the System

1. Start the development server:
```bash
npm run dev
```

2. Register a new user:
```bash
curl -X POST http://localhost:12000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

3. Login to get a JWT token:
```bash
curl -X POST http://localhost:12000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

4. Use the JWT token to access protected endpoints:
```bash
curl -X POST http://localhost:12000/api/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"history":[{"role":"user","text":"Hello"}]}'
```

5. Generate an API key:
```bash
curl -X POST http://localhost:12000/api/auth/generate-api-key \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Key"}'
```

6. Use the API key to access protected endpoints:
```bash
curl -X POST http://localhost:12000/api/generate \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"history":[{"role":"user","text":"Hello"}]}'
```

## Security Notes

- JWT tokens expire after 24 hours
- API keys do not expire (consider implementing rotation)
- All authentication data is stored in memory (use database in production)
- Passwords are hashed with bcrypt (12 rounds)
- API keys are hashed before storage

## Production Considerations

1. **Database Storage**: Replace in-memory storage with a proper database
2. **Token Refresh**: Implement token refresh mechanism
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **API Key Rotation**: Implement API key expiration and rotation
5. **Audit Logging**: Log authentication attempts
6. **HTTPS Only**: Ensure all communication is over HTTPS