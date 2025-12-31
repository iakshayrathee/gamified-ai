"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Create a function to get PrismaClient instance with proper configuration
const getPrismaClient = () => {
    // Base configuration
    const config = {
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    };
    // Only add datasources configuration if DATABASE_URL is provided
    if (process.env.DATABASE_URL) {
        config.datasources = {
            db: {
                url: process.env.DATABASE_URL,
            },
        };
    }
    return new client_1.PrismaClient(config);
};
// Export the function instead of an instantiated client
exports.default = getPrismaClient;
