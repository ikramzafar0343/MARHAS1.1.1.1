import { z } from 'zod';
import {
  paginationSchema,
  mongoIdParamSchema,
  orderNumberParamSchema,
  objectIdSchema
} from '../../middlewares/validate.middleware.js';
import { ORDER_STATUS, PAYMENT_METHODS } from '../../constants/orderStatus.js';

const checkoutItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  size: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional()
    .nullable()
});

export const checkoutSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(7, 'Phone number is required').max(20),
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  address: z.string().trim().min(5, 'Address is required').max(300),
  city: z.string().trim().min(2, 'City is required').max(100),
  postalCode: z.string().trim().min(3, 'Postal code is required').max(20),
  paymentMethod: z.enum(Object.values(PAYMENT_METHODS)).default(PAYMENT_METHODS.COD),
  items: z.array(checkoutItemSchema).min(1, 'Order must contain at least one item'),
  notes: z.string().trim().max(500).optional().nullable()
});

export const myOrdersQuerySchema = paginationSchema.extend({
  status: z.enum([...Object.values(ORDER_STATUS), 'all']).optional()
});

export const adminOrdersQuerySchema = paginationSchema.extend({
  status: z.enum([...Object.values(ORDER_STATUS), 'all']).optional(),
  email: z.string().trim().email().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional()
});

export const updateOrderSchema = z
  .object({
    customer: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(7).max(20).optional(),
    shipping: z
      .object({
        address: z.string().trim().min(5).max(300),
        city: z.string().trim().min(2).max(100),
        postalCode: z.string().trim().min(3).max(20)
      })
      .optional(),
    paymentMethod: z.enum(Object.values(PAYMENT_METHODS)).optional(),
    notes: z.string().trim().max(500).nullable().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required'
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum(Object.values(ORDER_STATUS))
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable()
});

export const orderIdParamSchema = mongoIdParamSchema;
export const orderNumberParam = orderNumberParamSchema;
