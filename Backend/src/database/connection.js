import { prisma } from './prisma.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDatabase = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      isConnected = true;
      logger.info('PostgreSQL connected via Prisma');
      return prisma;
    } catch (error) {
      retries -= 1;
      isConnected = false;
      logger.error(`PostgreSQL connection failed (${retries} retries left): ${error.message}`);
      if (retries === 0) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return prisma;
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  isConnected = false;
  logger.info('PostgreSQL disconnected');
};

export const getDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    return {
      status: 'connected',
      provider: 'postgresql',
      ready: true
    };
  } catch {
    isConnected = false;
    return {
      status: 'disconnected',
      provider: 'postgresql',
      ready: false
    };
  }
};

export { prisma, isConnected };
