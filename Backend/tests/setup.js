import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';

beforeAll(async () => {
  await connectDatabase();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await disconnectDatabase();
});
