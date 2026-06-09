import { z } from 'zod';

export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    if (source === 'query' || source === 'params') {
      Object.assign(req[source], result.data);
    } else {
      req[source] = result.data;
    }

    return next();
  };

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional()
});

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

export const mongoIdParamSchema = z.object({
  id: objectIdSchema
});

export const orderNumberParamSchema = z.object({
  orderNumber: z.string().min(1)
});
