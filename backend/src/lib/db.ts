import { PrismaClient } from '@prisma/client';

// Create a function to get PrismaClient instance with proper configuration
const getPrismaClient = () => {
  // Use PrismaClient without any configuration - it will automatically
  // pick up DATABASE_URL from environment variables
  return new PrismaClient();
};

// Export the function instead of an instantiated client
export default getPrismaClient;
