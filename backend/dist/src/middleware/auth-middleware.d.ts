import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../lib/auth';
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
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to authorize based on user roles
 */
export declare function authorize(...allowedRoles: Array<'CHILD' | 'TEACHER' | 'ADMIN'>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth-middleware.d.ts.map