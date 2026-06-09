import mongoose from 'mongoose';
import {
  auditFields,
  applySoftDelete,
  applyAuditHooks
} from '../../database/plugins/auditPlugin.js';

export const PRODUCT_CATEGORIES = [
  'new-arrivals',
  'summer',
  'ready-to-wear',
  'unstitched',
  'festive',
  'bridal'
];

export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed'
};

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 }
  },
  { _id: false }
);

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hex: { type: String, required: true, trim: true, match: /^#[0-9A-Fa-f]{6}$/ }
  },
  { _id: false }
);

const variantImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    colorName: { type: String, required: true, trim: true },
    colorHex: { type: String, required: true, trim: true, match: /^#[0-9A-Fa-f]{6}$/ },
    images: { type: [variantImageSchema], default: [] }
  },
  { _id: true }
);

const descriptionSchema = new mongoose.Schema(
  {
    intro: { type: String, trim: true, default: '' },
    detail: { type: String, trim: true, default: '' },
    highlights: { type: [String], default: [] }
  },
  { _id: false }
);

const specificationsSchema = new mongoose.Schema(
  {
    composition: { type: String, trim: true, default: '' },
    care: { type: String, trim: true, default: 'Dry clean only. Steam iron at medium temperature.' },
    includes: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: PRODUCT_CATEGORIES
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
      default: null
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      default: 0
    },
    discountType: {
      type: String,
      enum: Object.values(DISCOUNT_TYPES),
      default: DISCOUNT_TYPES.PERCENTAGE
    },
    description: {
      type: descriptionSchema,
      default: () => ({})
    },
    specifications: {
      type: specificationsSchema,
      default: () => ({})
    },
    sizes: {
      type: [String],
      default: []
    },
    colors: {
      type: [colorSchema],
      default: []
    },
    variants: {
      type: [variantSchema],
      default: []
    },
    images: {
      type: [imageSchema],
      default: []
    },
    bestSeller: {
      type: Boolean,
      default: false,
      index: true
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      min: [0, 'Low stock threshold cannot be negative'],
      default: 10
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0
    },
    reviewCount: {
      type: Number,
      min: [0, 'Review count cannot be negative'],
      default: 0
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.DRAFT,
      index: true
    },
    ...auditFields
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

productSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
productSchema.index({ sku: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
productSchema.index({ category: 1, status: 1, deletedAt: 1 });
productSchema.index({ bestSeller: 1, status: 1, deletedAt: 1 });
productSchema.index({ status: 1, stock: 1, deletedAt: 1 });
productSchema.index({ price: 1, deletedAt: 1 });
productSchema.index({ title: 'text', 'description.intro': 'text', 'description.detail': 'text' });

productSchema.virtual('inventoryStatus').get(function inventoryStatus() {
  if (this.stock <= 0) {
    return 'out-of-stock';
  }
  if (this.stock <= this.lowStockThreshold) {
    return 'low-stock';
  }
  return 'in-stock';
});

productSchema.virtual('effectivePrice').get(function effectivePrice() {
  if (!this.discount || this.discount <= 0) {
    return this.price;
  }

  if (this.discountType === DISCOUNT_TYPES.FIXED) {
    return Math.max(0, this.price - this.discount);
  }

  return Math.max(0, this.price - (this.price * this.discount) / 100);
});

applySoftDelete(productSchema);
applyAuditHooks(productSchema);

export const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);
