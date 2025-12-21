import { Request, Response, NextFunction } from 'express';

// Admin users who can access logs and monitoring
const ADMIN_EMAILS = [
  'agrawalmayank200228@gmail.com'
];

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  const user = req.user;
  
  // Check if user email is in admin list
  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'You do not have permission to access this resource. Contact administrator if you believe this is an error.'
    });
  }

  next();
}

export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}