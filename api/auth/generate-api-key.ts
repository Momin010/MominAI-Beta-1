import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateNextRequest, generateAPIKey, getAPIKeysForUser } from '../../lib/auth';
import { createAuthAwareRateLimit } from '../../lib/rateLimit';

// Rate limiting for API key operations - authenticated users get higher limits
const apiKeyRateLimit = createAuthAwareRateLimit({
  authenticated: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10 // 10 API key operations per hour for authenticated users
  },
  unauthenticated: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 0 // No operations allowed for unauthenticated users
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply rate limiting
  await new Promise<void>((resolve, reject) => {
    apiKeyRateLimit(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
  try {
    // Authenticate the user
    const authResult = authenticateNextRequest(req);
    if (!authResult) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const user = authResult.user;

    if (req.method === 'POST') {
      // Generate new API key
      const { name = 'API Key' } = req.body;
      const apiKey = generateAPIKey(user.id, name);

      // Get updated list of API keys
      const apiKeys = getAPIKeysForUser(user.id);

      res.status(201).json({
        message: 'API key generated successfully',
        apiKey, // This is the plain key - user should save it now
        keys: apiKeys
      });
    } else if (req.method === 'GET') {
      // List API keys
      const apiKeys = getAPIKeysForUser(user.id);

      res.status(200).json({
        apiKeys
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('API key operation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process API key request'
    });
  }
}