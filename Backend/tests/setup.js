import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import { prisma } from '../src/database/prisma.js';

beforeAll(async () => {
  await connectDatabase();
});

afterEach(async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "restock_events",
      "order_items",
      "orders",
      "wishlist_items",
      "products",
      "storefront_contents",
      "media_assets",
      "newsletter_subscribers",
      "users"
    RESTART IDENTITY CASCADE
  `);
});

afterAll(async () => {
  await disconnectDatabase();
});
