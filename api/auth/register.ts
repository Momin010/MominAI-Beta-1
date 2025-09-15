import { NextApiRequest, NextApiResponse } from 'next';
import { createUser, generateJWT } from '../../lib/auth';
import { createRateLimit } from '../../lib/rateLimit';

// Rate limiting for registration - strict limits to prevent spam
const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3 // 3 registration attempts per hour per IP
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

    // Enhanced password validation
    if (sanitizedPassword.length < 8) {
      return res.status(400).json({
        error: 'Password too short',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(sanitizedPassword);
    const hasLowerCase = /[a-z]/.test(sanitizedPassword);
    const hasNumbers = /\d/.test(sanitizedPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(sanitizedPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        error: 'Password too weak',
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    const user = await createUser(sanitizedEmail, sanitizedPassword);

    if (!user) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Generate JWT token
    const token = generateJWT({
      userId: user.id,
      email: user.email,
      type: 'session'
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create user account'
    });
  }
}