import { PrismaClient } from '@prisma/client';

const getPrismaClient = () => {
  return new PrismaClient({
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'colorless',
    log: [], // empty array avoids logging
     adapter: 'binary',
  });
};

export default getPrismaClient;
