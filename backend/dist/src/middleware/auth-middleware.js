"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const auth_1 = require("../lib/auth");
/**
 * Middleware to authenticate requests using JWT
 */
function authenticate(req, res, next) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies?.token ||
            req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        // Verify token
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        // Attach user to request
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
}
/**
 * Middleware to authorize based on user roles
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
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
