import { NextRequest, NextResponse } from 'next/server';
import { authenticateNextRequest } from './lib/auth';

// CORS Configuration
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const allowedHeaders = [
  'Content-Type',
  'Authorization',
  'X-API-Key',
  'Accept',
  'Accept-Language',
  'User-Agent',
  'Cache-Control',
  'X-Requested-With'
];

// Define protected routes
const protectedRoutes = [
  '/api/generate',
  '/api/webcontainer-proxy',
  '/api/proxy'
];

// Define public routes that don't need authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register'
];

// Define routes that need authentication but allow specific methods
const conditionalRoutes = [
  { path: '/api/auth/generate-api-key', methods: ['GET', 'POST'] }
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const origin = request.headers.get('origin');

  // CORS Handling
  const response = NextResponse.next();

  // Check if origin is allowed
  const isOriginAllowed = !origin || allowedOrigins.includes(origin);

  if (isOriginAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));

    // Only allow credentials for specific origins, not '*'
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';");

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Check conditional routes
  const conditionalRoute = conditionalRoutes.find(route => pathname.startsWith(route.path));
  const isConditionalRoute = conditionalRoute && conditionalRoute.methods.includes(method);

  // If it's not a protected route, or it's a public route, or it's a conditional route, allow access
  if (!isProtectedRoute || isPublicRoute || isConditionalRoute) {
    return response;
  }

  // For protected routes, check authentication
  const authResult = authenticateNextRequest(request);

  if (!authResult) {
    // Return 401 Unauthorized with CORS and security headers
    const errorResponse = NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Authentication required. Please provide a valid JWT token in Authorization header or API key in x-api-key header.'
      },
      {
        status: 401,
        headers: response.headers
      }
    );

    // Add security headers to error response
    errorResponse.headers.set('X-Content-Type-Options', 'nosniff');
    errorResponse.headers.set('X-Frame-Options', 'DENY');
    errorResponse.headers.set('X-XSS-Protection', '1; mode=block');
    errorResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    errorResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    errorResponse.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';");

    return errorResponse;
  }

  // Add user info to headers for the API route to use
  response.headers.set('x-user-id', authResult.user.id);
  response.headers.set('x-auth-type', authResult.type);

  return response;
}

export const config = {
  matcher: [
    '/api/:path*'
  ]
};