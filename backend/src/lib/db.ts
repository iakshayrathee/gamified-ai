import { PrismaClient } from '@prisma/client';

// Create a function to get PrismaClient instance with proper configuration
const getPrismaClient = () => {
  // Use environment variable directly - Prisma will automatically pick up DATABASE_URL
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
};

// Export the function instead of an instantiated client
export default getPrismaClient;
