import { PrismaClient } from '@prisma/client';

// Create a function to get PrismaClient instance
const getPrismaClient = () => {
  return new PrismaClient();
};

// Export the function instead of an instantiated client
export default getPrismaClient;
