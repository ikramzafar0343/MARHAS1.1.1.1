import mongoose from 'mongoose';

const restockSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Restock quantity must be at least 1']
    },
    note: {
      type: String,
      trim: true,
      default: null,
      maxlength: [500, 'Note cannot exceed 500 characters']
    },
    previousStock: {
      type: Number,
      required: true,
      min: [0, 'Previous stock cannot be negative']
    },
    newStock: {
      type: Number,
      required: true,
      min: [0, 'New stock cannot be negative']
    },
    createdBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

restockSchema.index({ productId: 1, createdAt: -1 });
restockSchema.index({ sku: 1, createdAt: -1 });
restockSchema.index({ createdBy: 1, createdAt: -1 });
restockSchema.index({ createdAt: -1 });

export const RestockEvent =
  mongoose.models.RestockEvent || mongoose.model('RestockEvent', restockSchema, 'restock_events');
