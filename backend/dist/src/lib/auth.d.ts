export interface JWTPayload {
    userId: string;
    role: 'CHILD' | 'TEACHER' | 'ADMIN';
    email: string;
}
/**
 * Generate JWT access token
 */
export declare function generateToken(payload: JWTPayload): string;
/**
 * Generate JWT refresh token (longer expiration)
 */
export declare function generateRefreshToken(payload: JWTPayload): string;
/**
 * Verify and decode JWT token
 */
export declare function verifyToken(token: string): JWTPayload | null;
/**
 * Hash password using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compare password with hash
 */
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
//# sourceMappingURL=auth.d.ts.map