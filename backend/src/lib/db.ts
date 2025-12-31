import { PrismaClient } from '@prisma/client';

// Create a function to get PrismaClient instance with proper configuration
const getPrismaClient = () => {
  const prismaOptions: any = {
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  };
  
  // Only add datasources configuration if DATABASE_URL is provided
  if (process.env.DATABASE_URL) {
    prismaOptions.datasources = {
      db: {
        url: process.env.DATABASE_URL,
      },
    };
  }
  
  return new PrismaClient(prismaOptions);
};

// Export the function instead of an instantiated client
export default getPrismaClient;
