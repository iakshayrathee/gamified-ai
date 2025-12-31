import { PrismaClient } from '@prisma/client';

// Create a function to get PrismaClient instance with proper configuration
const getPrismaClient = () => {
  // Use environment variable directly - Prisma will automatically pick up DATABASE_URL
  // Use simpler log configuration to avoid validation errors
  return new PrismaClient({
    log: ['error'], // Only log errors in all environments
  });
};

// Export the function instead of an instantiated client
export default getPrismaClient;
