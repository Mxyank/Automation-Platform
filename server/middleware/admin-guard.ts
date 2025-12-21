import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

// Admin email addresses - only these users can access admin features
const ADMIN_EMAILS = [
  'agrawalmayank200228@gmail.com'
];

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    logger.warn('Unauthenticated admin access attempt', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }

  const userEmail = req.user!.email;
  
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    logger.warn('Unauthorized admin access attempt', {
      userId: req.user!.id,
      email: userEmail,
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Administrative privileges required'
    });
  }

  logger.info('Admin access granted', {
    userId: req.user!.id,
    email: userEmail,
    ip: req.ip,
    path: req.path
  });

  next();
}

export function isAdmin(userEmail: string): boolean {
  return ADMIN_EMAILS.includes(userEmail);
}

export { ADMIN_EMAILS };