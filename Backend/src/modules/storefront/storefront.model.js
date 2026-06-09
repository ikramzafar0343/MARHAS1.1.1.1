import mongoose from 'mongoose';
import {
  auditFields,
  applySoftDelete,
  applyAuditHooks
} from '../../database/plugins/auditPlugin.js';

const imageAssetSchema = new mongoose.Schema(
  {
    jpg: { type: String, trim: true, default: '' },
    webp: { type: String, trim: true, default: null },
    blur: { type: String, trim: true, default: null },
    alt: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const navigationItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    visible: { type: Boolean, default: true }
  },
  { _id: false }
);

const heroSlideSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: '' },
    visible: { type: Boolean, default: true }
  },
  { _id: false }
);

const showcaseCategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    layout: {
      type: String,
      enum: ['editorial-right', 'editorial-left', 'editorial-left-center', 'editorial-center'],
      default: 'editorial-center'
    },
    label: { type: String, trim: true, default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    link: { type: String, required: true, trim: true },
    visible: { type: Boolean, default: true },
    image: { type: imageAssetSchema, required: true }
  },
  { _id: false }
);

const showcaseSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true, default: 'Explore Our Collections' },
    categories: { type: [showcaseCategorySchema], default: [] }
  },
  { _id: false }
);

const collectionHeroSchema = new mongoose.Schema(
  {
    titleFirst: { type: String, trim: true, default: 'Our' },
    titleSecond: { type: String, trim: true, default: 'Collections' },
    objectPosition: { type: String, trim: true, default: 'center center' },
    visible: { type: Boolean, default: true },
    image: { type: imageAssetSchema, default: null }
  },
  { _id: false }
);

const shopLookItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    area: {
      type: String,
      enum: ['main', 'topSq', 'topLand', 'oval', 'botSq', 'botLand', 'portrait', 'circle'],
      default: 'main'
    },
    shape: {
      type: String,
      enum: ['main', 'square', 'landscape-sm', 'oval', 'pill', 'landscape-xs', 'circle'],
      default: 'main'
    },
    platform: {
      type: String,
      enum: ['instagram', 'pinterest', 'facebook', 'youtube'],
      default: 'instagram'
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    },
    image: { type: String, trim: true, default: null },
    video: { type: String, trim: true, default: null },
    link: { type: String, trim: true, default: '' },
    visible: { type: Boolean, default: true }
  },
  { _id: false }
);

const shopTheLookSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true, default: 'Shop The Look' },
    rowSubtitle: { type: String, trim: true, default: '' },
    items: { type: [shopLookItemSchema], default: [] }
  },
  { _id: false }
);

const footerSocialSchema = new mongoose.Schema(
  {
    facebook: { type: String, trim: true, default: '' },
    twitter: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    pinterest: { type: String, trim: true, default: '' },
    youtube: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const authPageSchema = new mongoose.Schema(
  {
    image: { type: imageAssetSchema, required: true }
  },
  { _id: false }
);

const authPagesSchema = new mongoose.Schema(
  {
    login: { type: authPageSchema, default: null },
    register: { type: authPageSchema, default: null },
    adminLogin: { type: authPageSchema, default: null }
  },
  { _id: false }
);

const commerceSettingsSchema = new mongoose.Schema(
  {
    currency: { type: String, trim: true, default: 'PKR' },
    standardShippingFee: { type: Number, min: 0, default: 500 },
    freeShippingThreshold: { type: Number, min: 0, default: 15000 },
    freeShippingEnabled: { type: Boolean, default: true },
    taxEnabled: { type: Boolean, default: true },
    taxRate: { type: Number, min: 0, max: 100, default: 17 },
    taxLabel: { type: String, trim: true, default: 'GST' }
  },
  { _id: false }
);

const storefrontSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: 'default'
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true
    },
    navigation: {
      type: [navigationItemSchema],
      default: []
    },
    heroSlides: {
      type: [heroSlideSchema],
      default: []
    },
    showcase: {
      type: showcaseSchema,
      default: () => ({})
    },
    collectionHeroes: {
      type: Map,
      of: collectionHeroSchema,
      default: () => new Map()
    },
    shopTheLook: {
      type: shopTheLookSchema,
      default: () => ({})
    },
    footerSocial: {
      type: footerSocialSchema,
      default: () => ({})
    },
    authPages: {
      type: authPagesSchema,
      default: () => ({})
    },
    commerceSettings: {
      type: commerceSettingsSchema,
      default: () => ({})
    },
    publishedAt: {
      type: Date,
      default: null
    },
    ...auditFields
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        if (ret.collectionHeroes instanceof Map) {
          ret.collectionHeroes = Object.fromEntries(ret.collectionHeroes);
        }
        delete ret.__v;
        return ret;
      }
    }
  }
);

storefrontSchema.index({ key: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
storefrontSchema.index({ isPublished: 1, deletedAt: 1 });

applySoftDelete(storefrontSchema);
applyAuditHooks(storefrontSchema);

export const StorefrontContent =
  mongoose.models.StorefrontContent ||
  mongoose.model('StorefrontContent', storefrontSchema, 'storefront_contents');
