import { z } from 'zod';

const imageAssetSchema = z.object({
  jpg: z.string().min(1),
  webp: z.string().nullable().optional(),
  blur: z.string().nullable().optional(),
  alt: z.string().optional()
});

const navigationItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  path: z.string().min(1),
  slug: z.string().min(1),
  visible: z.boolean().default(true)
});

const heroSlideSchema = z.object({
  id: z.string().min(1),
  image: z.string().min(1),
  alt: z.string().optional(),
  visible: z.boolean().default(true)
});

const showcaseCategorySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  layout: z.enum(['editorial-right', 'editorial-left', 'editorial-left-center', 'editorial-center']),
  label: z.string().nullable().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  link: z.string().min(1),
  visible: z.boolean().default(true),
  image: imageAssetSchema
});

const showcaseSchema = z.object({
  heading: z.string().min(1),
  categories: z.array(showcaseCategorySchema)
});

const collectionHeroSchema = z.object({
  titleFirst: z.string().min(1),
  titleSecond: z.string().min(1),
  objectPosition: z.string().min(1),
  visible: z.boolean().default(true),
  image: imageAssetSchema.nullable().optional()
});

const shopLookItemSchema = z.object({
  id: z.string().min(1),
  area: z.enum(['main', 'topSq', 'topLand', 'oval', 'botSq', 'botLand', 'portrait', 'circle']),
  shape: z.enum(['main', 'square', 'landscape-sm', 'oval', 'pill', 'landscape-xs', 'circle']),
  platform: z.enum(['instagram', 'pinterest', 'facebook', 'youtube']),
  mediaType: z.enum(['image', 'video']),
  image: z.string().nullable().optional(),
  video: z.string().nullable().optional(),
  link: z.string().optional(),
  visible: z.boolean().default(true)
});

const shopTheLookSchema = z.object({
  heading: z.string().min(1),
  rowSubtitle: z.string().optional(),
  items: z.array(shopLookItemSchema)
});

const footerSocialSchema = z.object({
  facebook: z.string().optional().default(''),
  twitter: z.string().optional().default(''),
  linkedin: z.string().optional().default(''),
  instagram: z.string().optional().default(''),
  pinterest: z.string().optional().default(''),
  youtube: z.string().optional().default('')
});

const authPageSchema = z.object({
  image: imageAssetSchema
});

const authPagesSchema = z.object({
  login: authPageSchema,
  register: authPageSchema,
  adminLogin: authPageSchema
});

const commerceSettingsSchema = z.object({
  currency: z.string().trim().min(1).max(8).default('PKR'),
  standardShippingFee: z.coerce.number().min(0).default(500),
  freeShippingThreshold: z.coerce.number().min(0).default(15000),
  freeShippingEnabled: z.boolean().default(true),
  taxEnabled: z.boolean().default(true),
  taxRate: z.coerce.number().min(0).max(100).default(17),
  taxLabel: z.string().trim().min(1).max(40).default('GST')
});

export const updateStorefrontSchema = z.object({
  navigation: z.array(navigationItemSchema).optional(),
  heroSlides: z.array(heroSlideSchema).optional(),
  showcase: showcaseSchema.optional(),
  collectionHeroes: z.record(z.string(), collectionHeroSchema).optional(),
  shopTheLook: shopTheLookSchema.optional(),
  footerSocial: footerSocialSchema.optional(),
  authPages: authPagesSchema.optional(),
  commerceSettings: commerceSettingsSchema.optional(),
  isPublished: z.boolean().optional()
});
