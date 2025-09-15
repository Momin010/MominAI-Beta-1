import { NextApiRequest, NextApiResponse } from 'next';
import { createAuthAwareRateLimit } from '../../lib/rateLimit';

// In-memory store for WebContainer server URLs
// In production, this should be stored in a database or Redis
const containerServers = new Map<string, { url: string; port: number; sessionId: string }>();

// Rate limiting for WebContainer registration - requires authentication
const registerRateLimit = createAuthAwareRateLimit({
  authenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // 10 registrations per minute for authenticated users
  },
  unauthenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 0 // No registrations allowed for unauthenticated users
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply rate limiting
  await new Promise<void>((resolve, reject) => {
    registerRateLimit(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

// Export for use in other parts of the application
export { containerServers };