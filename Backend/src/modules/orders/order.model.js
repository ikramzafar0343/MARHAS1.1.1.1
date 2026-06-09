import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_METHODS } from '../../constants/orderStatus.js';
import {
  auditFields,
  applySoftDelete,
  applyAuditHooks
} from '../../database/plugins/auditPlugin.js';

const shippingSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
    size: { type: String, trim: true, default: null },
    color: { type: String, trim: true, default: null },
    colorHex: { type: String, trim: true, default: null },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    imageUrl: { type: String, trim: true, default: null }
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    customer: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true
    },
    shipping: {
      type: shippingSchema,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.COD
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'Order must contain at least one item'
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    shippingFee: {
      type: Number,
      min: [0, 'Shipping fee cannot be negative'],
      default: 0
    },
    taxAmount: {
      type: Number,
      min: [0, 'Tax amount cannot be negative'],
      default: 0
    },
    taxRate: {
      type: Number,
      min: [0, 'Tax rate cannot be negative'],
      default: 0
    },
    taxLabel: {
      type: String,
      trim: true,
      default: 'GST'
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative']
    },
    notes: {
      type: String,
      trim: true,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null
    },
    ...auditFields
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

orderSchema.index({ orderNumber: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ email: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

applySoftDelete(orderSchema);
applyAuditHooks(orderSchema);

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
