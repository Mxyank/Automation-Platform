import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

// Extend User interface to include role
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      credits: number;
      role?: string;
    }
  }
}

// Enhanced authentication middleware with detailed logging
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      logger.warn('Unauthenticated access attempt', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user object exists
    if (!req.user) {
      logger.warn('Missing user object in authenticated request', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        sessionID: req.sessionID,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ 
        error: 'Invalid session',
        message: 'Your session is invalid. Please log in again.',
        code: 'INVALID_SESSION'
      });
    }

    // Log successful authentication
    logger.info('Authenticated request', {
      userId: req.user.id,
      username: req.user.username,
      method: req.method,
      path: req.path,
      ip: req.ip,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip,
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({
      error: 'Authentication system error',
      message: 'Please try again later',
      code: 'AUTH_SYSTEM_ERROR'
    });
  }
}

// Role-based access control
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role || 'user'; // Default to 'user' role
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Role-based access denied', {
        userId: req.user.id,
        username: req.user.username,
        userRole,
        requiredRoles: allowedRoles,
        method: req.method,
        path: req.path,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    logger.info('Role-based access granted', {
      userId: req.user.id,
      username: req.user.username,
      userRole,
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    next();
  };
}

// Resource ownership validation
export function requireOwnership(getResourceUserId: (req: Request) => Promise<number | null>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const resourceUserId = await getResourceUserId(req);
      
      if (resourceUserId === null) {
        logger.warn('Resource not found for ownership check', {
          userId: req.user.id,
          method: req.method,
          path: req.path,
          params: req.params,
          timestamp: new Date().toISOString()
        });
        
        return res.status(404).json({
          error: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      if (resourceUserId !== req.user.id) {
        logger.warn('Resource ownership violation', {
          userId: req.user.id,
          resourceUserId,
          method: req.method,
          path: req.path,
          params: req.params,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
        
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own resources',
          code: 'OWNERSHIP_VIOLATION'
        });
      }

      logger.info('Resource ownership validated', {
        userId: req.user.id,
        resourceUserId,
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      });

      next();
    } catch (error) {
      logger.error('Ownership validation error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      
      return res.status(500).json({
        error: 'Access validation error',
        message: 'Please try again later',
        code: 'VALIDATION_ERROR'
      });
    }
  };
}

// Credit validation middleware
export function requireCredits(minimumCredits: number = 1) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userCredits = req.user.credits || 0;
    
    if (userCredits < minimumCredits) {
      logger.info('Insufficient credits for operation', {
        userId: req.user.id,
        username: req.user.username,
        userCredits,
        requiredCredits: minimumCredits,
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      
      return res.status(402).json({
        error: 'Insufficient credits',
        message: `This operation requires ${minimumCredits} credits. You have ${userCredits} credits.`,
        userCredits,
        requiredCredits: minimumCredits,
        code: 'INSUFFICIENT_CREDITS'
      });
    }

    next();
  };
}

// Feature usage validation
export function requireFeatureAccess(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // TODO: Implement feature access checking logic
      // This could check user subscription, feature flags, etc.
      
      logger.info('Feature access granted', {
        userId: req.user.id,
        feature,
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      });

      next();
    } catch (error) {
      logger.error('Feature access validation error', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id,
        feature,
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      
      return res.status(500).json({
        error: 'Feature access validation error',
        message: 'Please try again later',
        code: 'FEATURE_ACCESS_ERROR'
      });
    }
  };
}

// Session timeout validation
export function validateSessionTimeout(timeoutMinutes: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.session) {
      return next();
    }

    const now = Date.now();
    const sessionStart = req.session.loginTime || now;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    if (now - sessionStart > timeoutMs) {
      logger.info('Session timeout detected', {
        userId: req.user.id,
        sessionStart: new Date(sessionStart).toISOString(),
        timeoutMinutes,
        timestamp: new Date().toISOString()
      });

      req.session.destroy((err) => {
        if (err) {
          logger.error('Error destroying timed out session', { error: err });
        }
      });

      return res.status(401).json({
        error: 'Session expired',
        message: 'Your session has expired. Please log in again.',
        code: 'SESSION_EXPIRED'
      });
    }

    // Update session activity
    req.session.lastActivity = now;
    next();
  };
}