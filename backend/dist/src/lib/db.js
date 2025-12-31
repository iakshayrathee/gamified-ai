"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Create a function to get PrismaClient instance
const getPrismaClient = () => {
    return new client_1.PrismaClient();
};
// Export the function instead of an instantiated client
exports.default = getPrismaClient;
