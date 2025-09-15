import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, generateJWT } from '../../lib/auth';
import { createRateLimit, rateLimiters } from '../../lib/rateLimit';

// Rate limiting for authentication endpoints - strict limits to prevent brute force
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 login attempts per 15 minutes per IP
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply rate limiting
  await new Promise<void>((resolve, reject) => {
    authRateLimit(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // Basic input sanitization
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /Function\s*\(/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitizedEmail) || pattern.test(sanitizedPassword)) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Input contains potentially harmful content'
        });
      }
    }

    // Length limits
    if (sanitizedEmail.length > 254) {
      return res.status(400).json({
        error: 'Email too long',
        message: 'Email address must be less than 254 characters'
      });
    }

    if (sanitizedPassword.length > 128) {
      return res.status(400).json({
        error: 'Password too long',
        message: 'Password must be less than 128 characters'
      });
    }

    const user = await authenticateUser(sanitizedEmail, sanitizedPassword);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateJWT({
      userId: user.id,
      email: user.email,
      type: 'session'
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        apiKeys: user.apiKeys.length
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate user'
    });
  }
}