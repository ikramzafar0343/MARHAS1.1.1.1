import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  DATABASE_NAME: z.string().default('marhas'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('MARHAS <noreply@marhas.com>'),
  APP_URL: z.string().default('http://localhost:5173'),
  UPLOAD_MAX_FILE_SIZE: z.coerce.number().default(10485760),
  UPLOAD_DIR: z.string().default('src/uploads'),
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary', 's3']).default('local'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@marhas.com'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('Marhas@Admin123'),
  SEED_ADMIN_NAME: z.string().default('MARHAS Admin')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

const normalizeOrigin = (value) => value?.replace(/\/$/, '') || '';

const configuredOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);

const derivedOrigins = [
  normalizeOrigin(env.APP_URL),
  normalizeOrigin(process.env.RENDER_EXTERNAL_URL),
  normalizeOrigin(process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : '')
].filter(Boolean);

export const corsOrigins = [...new Set([...configuredOrigins, ...derivedOrigins])];
