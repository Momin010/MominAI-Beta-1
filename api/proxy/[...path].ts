import { createAuthAwareRateLimit } from '../../lib/rateLimit';

// Rate limiting for proxy requests - authenticated users get higher limits
const proxyRateLimit = createAuthAwareRateLimit({
  authenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200 // 200 proxy requests per minute for authenticated users
  },
  unauthenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50 // 50 proxy requests per minute for unauthenticated users
  }
});

export default async function handler(req: any, res: any) {
  // Apply rate limiting
  await new Promise<void>((resolve, reject) => {
    proxyRateLimit(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
  const { path } = req.query;

  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  // Validate path segments
  const MAX_PATH_LENGTH = 1000;
  const MAX_SEGMENT_LENGTH = 255;

  for (let i = 0; i < path.length; i++) {
    const segment = path[i];

    // Check segment type and length
    if (typeof segment !== 'string') {
      return res.status(400).json({ error: 'Invalid path segment type' });
    }

    if (segment.length > MAX_SEGMENT_LENGTH) {
      return res.status(400).json({ error: 'Path segment too long' });
    }

    // Prevent path traversal attacks
    if (segment.includes('..') || segment.includes('/') || segment.includes('\\')) {
      return res.status(400).json({ error: 'Invalid path segment' });
    }

    // Basic sanitization - remove suspicious characters
    if (/[<>'"&]/.test(segment)) {
      return res.status(400).json({ error: 'Invalid characters in path segment' });
    }
  }

  const targetPath = path.join('/');

  if (targetPath.length > MAX_PATH_LENGTH) {
    return res.status(400).json({ error: 'Path too long' });
  }

  const targetUrl = `https://w-corp-staticblitz.com/${targetPath}`;

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {},
    };

    // Copy relevant headers
    const headersToCopy = ['accept', 'accept-encoding', 'accept-language', 'cache-control', 'user-agent', 'authorization', 'content-type'];
    for (const header of headersToCopy) {
      if (req.headers[header]) {
        (fetchOptions.headers as any)[header] = req.headers[header];
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const arrayBuffer = await response.arrayBuffer();

    // Set COI headers
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Copy response headers
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'transfer-encoding', 'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    res.status(response.status).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed' });
  }
}