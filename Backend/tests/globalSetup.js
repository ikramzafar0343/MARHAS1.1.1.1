import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export default async function globalSetup() {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.DATABASE_NAME = 'marhas-test';
  global.__MONGO_SERVER__ = mongoServer;
}
