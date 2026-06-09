import { z } from 'zod';
import { paginationSchema, mongoIdParamSchema } from '../../middlewares/validate.middleware.js';
import { PRODUCT_CATEGORIES, PRODUCT_STATUS } from '../products/product.model.js';

export const listInventorySchema = paginationSchema.extend({
  filter: z.enum(['all', 'in-stock', 'low-stock', 'out-of-stock']).default('all'),
  status: z.enum(['all', ...Object.values(PRODUCT_STATUS)]).default('all')
});

export const updateInventorySchema = z
  .object({
    sku: z.string().min(1).max(50).optional(),
    title: z.string().min(1).max(200).optional(),
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    lowStockThreshold: z.coerce.number().int().min(0).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  });

export const updateStockSchema = z.object({
  stock: z.coerce.number().int().min(0)
});

export const restockSchema = z.object({
  quantity: z.coerce.number().int().min(1),
  note: z.string().max(500).optional()
});

export { mongoIdParamSchema };
