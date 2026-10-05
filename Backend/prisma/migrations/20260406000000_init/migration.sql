-- CreateSchema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER');
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed');
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE "PaymentMethod" AS ENUM ('cod', 'online');
CREATE TYPE "StorageProvider" AS ENUM ('local', 'cloudinary', 's3');
CREATE TYPE "NewsletterSource" AS ENUM ('footer', 'checkout', 'popup', 'admin', 'other');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "adminLoginChallengeId" TEXT,
    "adminLoginOtpHash" TEXT,
    "adminLoginOtpExpires" TIMESTAMP(3),
    "addresses" JSONB NOT NULL DEFAULT '[]',
    "refreshTokens" JSONB NOT NULL DEFAULT '[]',
    "lastLoginAt" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "originalPrice" DECIMAL(12,2),
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountType" "DiscountType" NOT NULL DEFAULT 'percentage',
    "description" JSONB NOT NULL DEFAULT '{"intro":"","detail":"","highlights":[]}',
    "specifications" JSONB NOT NULL DEFAULT '{"composition":"","care":"","includes":""}',
    "returnPolicy" VARCHAR(2000) NOT NULL DEFAULT '',
    "sizes" JSONB NOT NULL DEFAULT '[]',
    "colors" JSONB NOT NULL DEFAULT '[]',
    "variants" JSONB NOT NULL DEFAULT '[]',
    "images" JSONB NOT NULL DEFAULT '[]',
    "bestSeller" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "searchVector" tsvector,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderNumber" TEXT NOT NULL,
    "userId" UUID,
    "customer" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "shipping" JSONB NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'cod',
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "shippingFee" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(8,4) NOT NULL,
    "taxLabel" TEXT NOT NULL DEFAULT 'GST',
    "total" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "colorHex" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "imageUrl" TEXT,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storefront_contents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL DEFAULT 'default',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "navigation" JSONB NOT NULL DEFAULT '[]',
    "heroSlides" JSONB NOT NULL DEFAULT '[]',
    "showcase" JSONB NOT NULL DEFAULT '{}',
    "collectionHeroes" JSONB NOT NULL DEFAULT '{}',
    "shopTheLook" JSONB NOT NULL DEFAULT '{}',
    "footerSocial" JSONB NOT NULL DEFAULT '{}',
    "authPages" JSONB NOT NULL DEFAULT '{}',
    "commerceSettings" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "storefront_contents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "storageProvider" "StorageProvider" NOT NULL DEFAULT 'local',
    "storageKey" TEXT,
    "folder" TEXT NOT NULL DEFAULT 'general',
    "uploadedBy" TEXT,
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "newsletter_subscribers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "source" "NewsletterSource" NOT NULL DEFAULT 'footer',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "restock_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" VARCHAR(500),
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "restock_events_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "restock_events" ADD CONSTRAINT "restock_events_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Partial unique indexes (soft-delete aware)
CREATE UNIQUE INDEX "users_email_active_unique" ON "users" ("email") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "products_slug_active_unique" ON "products" ("slug") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "products_sku_active_unique" ON "products" ("sku") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "orders_orderNumber_active_unique" ON "orders" ("orderNumber") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "storefront_key_active_unique" ON "storefront_contents" ("key") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "newsletter_email_active_unique" ON "newsletter_subscribers" ("email") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "wishlist_items_userId_productId_key" ON "wishlist_items"("userId", "productId");

-- Hot-path indexes
CREATE INDEX "users_role_deletedAt_idx" ON "users"("role", "deletedAt");
CREATE INDEX "users_emailVerificationToken_idx" ON "users"("emailVerificationToken");
CREATE INDEX "users_passwordResetToken_idx" ON "users"("passwordResetToken");
CREATE INDEX "products_category_status_deletedAt_idx" ON "products"("category", "status", "deletedAt");
CREATE INDEX "products_bestSeller_status_deletedAt_idx" ON "products"("bestSeller", "status", "deletedAt");
CREATE INDEX "products_status_stock_deletedAt_idx" ON "products"("status", "stock", "deletedAt");
CREATE INDEX "products_price_deletedAt_idx" ON "products"("price", "deletedAt");
CREATE INDEX "wishlist_items_productId_idx" ON "wishlist_items"("productId");
CREATE INDEX "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");
CREATE INDEX "orders_email_createdAt_idx" ON "orders"("email", "createdAt");
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");
CREATE INDEX "storefront_contents_isPublished_idx" ON "storefront_contents"("isPublished");
CREATE INDEX "media_assets_folder_idx" ON "media_assets"("folder");
CREATE INDEX "media_assets_uploadedBy_idx" ON "media_assets"("uploadedBy");
CREATE INDEX "media_assets_mimeType_idx" ON "media_assets"("mimeType");
CREATE INDEX "newsletter_subscribers_isActive_idx" ON "newsletter_subscribers"("isActive");
CREATE INDEX "restock_events_productId_idx" ON "restock_events"("productId");
CREATE INDEX "restock_events_createdAt_idx" ON "restock_events"("createdAt");

-- Full-text search (tsvector + GIN) — official PostgreSQL text search
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description->>'intro', '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description->>'detail', '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.sku, '')), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description, sku ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

UPDATE products SET "searchVector" =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description->>'intro', '')), 'B') ||
  setweight(to_tsvector('english', coalesce(description->>'detail', '')), 'C') ||
  setweight(to_tsvector('english', coalesce(sku, '')), 'A');

CREATE INDEX products_search_vector_gin ON products USING GIN ("searchVector");
