import { z } from 'zod';

export const subscribeSchema = z.object({
  email: z.string().email('Valid email is required'),
  source: z.enum(['footer', 'checkout', 'popup', 'admin', 'other']).default('footer')
});
