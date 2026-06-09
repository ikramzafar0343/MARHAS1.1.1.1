import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);

  const options = {
    dbName: env.DATABASE_NAME,
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority'
  };

  let retries = 5;
  while (retries > 0) {
    try {
      await mongoose.connect(env.MONGODB_URI, options);
      isConnected = true;
      logger.info(`MongoDB Atlas connected — database: ${env.DATABASE_NAME}`);
      return mongoose.connection;
    } catch (error) {
      retries -= 1;
      logger.error(`MongoDB connection failed (${retries} retries left): ${error.message}`);
      if (retries === 0) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return mongoose.connection;
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    isConnected = false;
    return;
  }
  await mongoose.connection.close();
  isConnected = false;
  logger.info('MongoDB disconnected');
};

export const getDatabaseHealth = () => ({
  status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  readyState: mongoose.connection.readyState,
  name: mongoose.connection.name
});
