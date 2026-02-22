import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import rateLimit from 'express-rate-limit';

// Extend session interface to include custom properties
declare module 'express-session' {
  interface SessionData {
    ip?: string;
    loginTime?: number;
    lastActivity?: number;
  }
}

// Rate limiting configurations
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased limit for development assets
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for development assets (Vite hot reload, static files)
    const path = req.path;
    return path.startsWith('/src/') ||
      path.startsWith('/@') ||
      path.startsWith('/node_modules/') ||
      path.endsWith('.tsx') ||
      path.endsWith('.ts') ||
      path.endsWith('.css') ||
      path.endsWith('.js') ||
      path.endsWith('.mjs') ||
      path.includes('/@vite/') ||
      path.includes('/@react-refresh') ||
      path.includes('/@fs/');
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 API requests per minute
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: '1 minute'
  },
  handler: (req, res) => {
    logger.warn(`API rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id
    });
    res.status(429).json({
      error: 'API rate limit exceeded, please try again later.',
      retryAfter: '1 minute'
    });
  }
});

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://generativelanguage.googleapis.com https://api.stripe.com; " +
    "frame-ancestors 'none';"
  );

  // Strict Transport Security (HTTPS only)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
}

// Input validation middleware
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // Check for SQL injection patterns
  const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b|[';]|--|\|)/gi;

  // Check for XSS patterns
  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlInjectionPattern.test(value) || xssPattern.test(value);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  // Check request body
  if (req.body && checkValue(req.body)) {
    logger.warn('Malicious input detected in request body', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      body: req.body
    });
    return res.status(400).json({
      error: 'Invalid input detected. Please check your data and try again.'
    });
  }

  // Check query parameters
  if (req.query && checkValue(req.query)) {
    logger.warn('Malicious input detected in query parameters', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      query: req.query
    });
    return res.status(400).json({
      error: 'Invalid query parameters detected. Please check your request and try again.'
    });
  }

  next();
}

// Request logging for security monitoring
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./g, // Path traversal
    /%2e%2e/gi, // Encoded path traversal
    /\/proc\//gi, // System file access
    /\/etc\//gi, // System config access
    /\x00/g, // Null bytes
  ];

  const isSuspicious = suspiciousPatterns.some(pattern =>
    pattern.test(req.url) ||
    pattern.test(JSON.stringify(req.body)) ||
    pattern.test(JSON.stringify(req.query))
  );

  if (isSuspicious) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      body: req.body,
      query: req.query,
      userId: (req as any).user?.id
    });
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log failed authentication attempts
    if (req.path.includes('/auth') && res.statusCode >= 400) {
      logger.warn('Failed authentication attempt', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        body: req.body
      });
    }

    // Log unauthorized access attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.warn('Unauthorized access attempt', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id
      });
    }
  });

  next();
}

// CORS configuration
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:5002',
    'https://prometix.tech',
    'https://www.prometix.tech',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
}

// Session security middleware
export function sessionSecurity(req: Request, res: Response, next: NextFunction) {
  // Check for session hijacking attempts
  if (req.session && (req as any).user) {
    const currentIP = req.ip;
    const sessionIP = req.session.ip;

    // Store IP on first request
    if (!sessionIP) {
      req.session.ip = currentIP;
    }
    // Check for IP mismatch (potential session hijacking)
    else if (sessionIP !== currentIP) {
      logger.warn('Potential session hijacking detected', {
        sessionIP,
        currentIP,
        userId: (req as any).user?.id,
        userAgent: req.get('User-Agent')
      });

      // Destroy session and require re-authentication
      req.session.destroy((err) => {
        if (err) {
          logger.error('Error destroying suspicious session', { error: err });
        }
      });

      return res.status(401).json({
        error: 'Session security violation detected. Please log in again.',
        code: 'SESSION_HIJACK_DETECTED'
      });
    }
  }

  next();
}

// API key validation middleware (for future API access)
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key in the X-API-Key header'
    });
  }

  // TODO: Implement API key validation logic
  // For now, we'll skip API key validation as it's not implemented yet
  next();
}