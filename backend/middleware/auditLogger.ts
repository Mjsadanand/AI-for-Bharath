import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog.js';
import { AuthRequest } from './auth.js';

export const auditLogger = (module: string, action: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        await AuditLog.create({
          userId: req.user._id,
          action,
          module,
          resourceType: req.baseUrl.split('/').pop() || 'unknown',
          details: `${req.method} ${req.originalUrl}`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
    } catch (error) {
      console.error('Audit log error:', error);
    }
    next();
  };
};
