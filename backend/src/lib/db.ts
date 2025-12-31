import { PrismaClient } from '@prisma/client';

// Create a function to get PrismaClient instance with proper configuration
const getPrismaClient = () => {
  // Base configuration
  const config: any = {
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
  
  return new PrismaClient(config);
};

// Export the function instead of an instantiated client
export default getPrismaClient;
