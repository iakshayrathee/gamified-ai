"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const getPrismaClient = () => {
    return new client_1.PrismaClient({
        errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'colorless',
        log: [], // empty array avoids logging
    });
};
exports.default = getPrismaClient;
