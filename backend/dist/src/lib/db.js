"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Create a function to get PrismaClient instance with proper configuration
const getPrismaClient = () => {
    // Use environment variable directly - Prisma will automatically pick up DATABASE_URL
    return new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
};
// Export the function instead of an instantiated client
exports.default = getPrismaClient;
