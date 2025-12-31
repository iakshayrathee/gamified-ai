import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../lib/auth';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

/**
 * Middleware to authenticate requests using JWT
 */
export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        // Get token from cookie or Authorization header
        const token =
            req.cookies?.token ||
            req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }

        // Attach user to request
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
}

/**
 * Middleware to authorize based on user roles
 */
export function authorize(...allowedRoles: Array<'CHILD' | 'TEACHER' | 'ADMIN'>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Access forbidden',
                message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`
            });
            return;
        }

        next();
    };
}
