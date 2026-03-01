import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Not authorized, no token' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Not authorized for this action' });
      return;
    }
    next();
  };
};

/**
 * Middleware that blocks access for users who haven't completed their profile.
 * Google OAuth users must select a role and complete their profile first.
 * Allows access to profile-completion routes themselves.
 */
export const requireCompleteProfile = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && !req.user.isProfileComplete) {
    res.status(403).json({
      success: false,
      message: 'Please complete your profile before accessing this resource',
      code: 'PROFILE_INCOMPLETE',
      isProfileComplete: false,
    });
    return;
  }
  next();
};
