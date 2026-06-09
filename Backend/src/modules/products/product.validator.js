import { z } from 'zod';
import {
  paginationSchema,
  mongoIdParamSchema,
  objectIdSchema
} from '../../middlewares/validate.middleware.js';
import { FRONTEND_TO_BACKEND_CATEGORY } from '../../constants/categoryMap.js';
import {
  DISCOUNT_TYPES,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS
} from './product.model.js';

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color');

const imageSchema = z.object({
  url: z.string().trim().url('Invalid image URL'),
  alt: z.string().trim().max(200).optional().default(''),
  order: z.coerce.number().int().min(0).optional().default(0)
});

const colorSchema = z.object({
  name: z.string().trim().min(1, 'Color name is required'),
  hex: hexColorSchema
});

const variantImageSchema = z.object({
  url: z.string().trim().url('Invalid variant image URL'),
  alt: z.string().trim().max(200).optional().default('')
});

const variantSchema = z.object({
  colorName: z.string().trim().min(1, 'Variant color name is required'),
  colorHex: hexColorSchema,
  images: z.array(variantImageSchema).max(3).optional().default([])
});

const descriptionSchema = z
  .union([
    z.string().trim().min(1),
    z.object({
      intro: z.string().trim().optional().default(''),
      detail: z.string().trim().optional().default(''),
      highlights: z.array(z.string().trim()).optional().default([])
    })
  ])
  .transform((value) => {
    if (typeof value === 'string') {
      return { intro: value, detail: '', highlights: [] };
    }
    return value;
  });

const specificationsSchema = z
  .object({
    composition: z.string().trim().optional().default(''),
    care: z.string().trim().optional().default(''),
    includes: z.string().trim().optional().default('')
  })
  .optional()
  .default({});

const productBaseSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .optional(),
  sku: z.string().trim().toUpperCase().min(2).max(40).optional(),
  category: z.enum(PRODUCT_CATEGORIES, { error: 'Invalid category' }),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  originalPrice: z.coerce.number().min(0).nullable().optional(),
  discount: z.coerce.number().min(0).optional().default(0),
  discountType: z.enum(Object.values(DISCOUNT_TYPES)).optional().default(DISCOUNT_TYPES.PERCENTAGE),
  description: descriptionSchema,
  specifications: specificationsSchema,
  sizes: z.array(z.string().trim().min(1)).optional().default([]),
  colors: z.array(colorSchema).optional().default([]),
  variants: z.array(variantSchema).optional().default([]),
  images: z.array(imageSchema).optional().default([]),
  bestSeller: z
    .union([z.boolean(), z.enum(['yes', 'no'])])
    .optional()
    .transform((value) => value === true || value === 'yes'),
  stock: z.coerce.number().int().min(0).optional().default(0),
  lowStockThreshold: z.coerce.number().int().min(0).optional().default(10),
  status: z.enum(Object.values(PRODUCT_STATUS)).optional().default(PRODUCT_STATUS.DRAFT)
});

export const createProductSchema = productBaseSchema;

export const updateProductSchema = productBaseSchema.partial();

const frontendCategories = [
  ...new Set([
    ...Object.keys(FRONTEND_TO_BACKEND_CATEGORY).filter((key) => key !== 'all'),
    ...PRODUCT_CATEGORIES
  ])
];

export const productListQuerySchema = paginationSchema.extend({
  category: z.enum(frontendCategories, { error: 'Invalid category' }).optional(),
  bestSeller: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  stockStatus: z.enum(['in-stock', 'out-of-stock', 'low-stock']).optional(),
  status: z.enum(Object.values(PRODUCT_STATUS)).optional()
});

export const productSearchQuerySchema = productListQuerySchema.extend({
  q: z.string().trim().min(1, 'Search query is required')
});

export const productIdParamSchema = mongoIdParamSchema;

export const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const normalizeProductBody = (body = {}) => {
  const normalized = { ...body };

  if (typeof normalized.bestSeller === 'string') {
    normalized.bestSeller = normalized.bestSeller === 'yes' || normalized.bestSeller === 'true';
  }

  ['sizes', 'colors', 'variants', 'images', 'specifications'].forEach((field) => {
    if (typeof normalized[field] === 'string') {
      normalized[field] = parseJsonField(normalized[field], []);
    }
  });

  if (typeof normalized.description === 'string') {
    const parsed = parseJsonField(normalized.description, normalized.description);
    normalized.description =
      typeof parsed === 'string' ? { intro: parsed, detail: '', highlights: [] } : parsed;
  }

  return normalized;
};

export const productIdListSchema = z.object({
  ids: z.array(objectIdSchema).min(1).max(50)
});
