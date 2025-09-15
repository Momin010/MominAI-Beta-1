import { NextApiRequest, NextApiResponse } from 'next';
import { createAuthAwareRateLimit } from '../../lib/rateLimit';

// In-memory store for WebContainer server URLs
// In production, this should be stored in a database or Redis
const containerServers = new Map<string, { url: string; port: number; sessionId: string }>();

// Rate limiting for WebContainer proxy requests - authenticated users get higher limits
const proxyRateLimit = createAuthAwareRateLimit({
  authenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300 // 300 proxy requests per minute for authenticated users
  },
  unauthenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 proxy requests per minute for unauthenticated users
  }
});


// API endpoint to register a WebContainer server
export async function registerWebContainerServer(sessionId: string, url: string, port: number) {
  containerServers.set(sessionId, { url, port, sessionId });
  console.log(`✅ Registered WebContainer server for session ${sessionId}: ${url}`);
}

// API endpoint to unregister a WebContainer server
export async function unregisterWebContainerServer(sessionId: string) {
  containerServers.delete(sessionId);
  console.log(`🗑️ Unregistered WebContainer server for session ${sessionId}`);
}

// API endpoint to register a WebContainer server
export default async function handler(req: any, res: any) {
  if (req.method === 'POST' && req.url?.includes('/register')) {
    return handleRegister(req, res);
  }

  // Apply rate limiting for proxy requests
  await new Promise<void>((resolve, reject) => {
    proxyRateLimit(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const { path, sessionId } = req.query;

  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: 'Invalid path parameter' });
  }

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Invalid sessionId parameter' });
  }

  const targetPath = path.join('/');
  const serverInfo = containerServers.get(sessionId);

  if (!serverInfo) {
    return res.status(404).json({ error: 'No active server found for this session' });
  }

  // Construct the target URL for the WebContainer server
  const targetUrl = `${serverInfo.url}${targetPath ? `/${targetPath}` : ''}`;

  try {
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {},
    };

    // Copy relevant headers from the original request
    const headersToCopy = [
      'accept',
      'accept-encoding',
      'accept-language',
      'cache-control',
      'user-agent',
      'authorization',
      'content-type',
      'cookie',
      'referer',
      'x-requested-with'
    ];

    for (const header of headersToCopy) {
      if (req.headers[header]) {
        (fetchOptions.headers as any)[header] = req.headers[header];
      }
    }

    // Handle request body for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      if (typeof req.body === 'object') {
        fetchOptions.body = JSON.stringify(req.body);
      } else {
        fetchOptions.body = req.body;
      }
    }

    console.log(`🔄 Proxying ${req.method} ${req.url} -> ${targetUrl}`);

    // Make the request to the WebContainer server
    const response = await fetch(targetUrl, fetchOptions);

    // Set COEP headers to allow cross-origin embedding
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Copy response headers (excluding hop-by-hop headers)
    const hopByHopHeaders = [
      'connection',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailers',
      'transfer-encoding',
      'upgrade'
    ];

    for (const [key, value] of response.headers.entries()) {
      if (!hopByHopHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Handle different response types
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const jsonData = await response.json();
      res.status(response.status).json(jsonData);
    } else if (contentType.includes('text/')) {
      const textData = await response.text();
      res.status(response.status).send(textData);
    } else {
      // Binary data
      const arrayBuffer = await response.arrayBuffer();
      res.status(response.status).send(Buffer.from(arrayBuffer));
    }

  } catch (error) {
    console.error('❌ WebContainer proxy error:', error);
    res.status(500).json({
      error: 'Failed to proxy request to WebContainer server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleRegister(req: any, res: any) {
  try {
    const { sessionId, url, port } = req.body;

    if (!sessionId || !url || !port) {
      return res.status(400).json({ error: 'Missing required parameters: sessionId, url, port' });
    }

    containerServers.set(sessionId, { url, port, sessionId });
    console.log(`✅ Registered WebContainer server for session ${sessionId}: ${url}:${port}`);

    res.status(200).json({ success: true, message: 'Server registered successfully' });
  } catch (error) {
    console.error('❌ Failed to register server:', error);
    res.status(500).json({ error: 'Failed to register server' });
  }
}

// Export these functions for use in other parts of the application
export { containerServers };