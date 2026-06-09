import mongoose from 'mongoose';
import { auditFields, applySoftDelete } from '../../database/plugins/auditPlugin.js';

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email cannot exceed 254 characters']
    },
    source: {
      type: String,
      trim: true,
      default: 'footer',
      enum: ['footer', 'checkout', 'popup', 'admin', 'other']
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    unsubscribedAt: {
      type: Date,
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

newsletterSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
newsletterSchema.index({ isActive: 1, subscribedAt: -1 });
newsletterSchema.index({ source: 1, subscribedAt: -1 });

applySoftDelete(newsletterSchema);

export const NewsletterSubscriber =
  mongoose.models.NewsletterSubscriber ||
  mongoose.model('NewsletterSubscriber', newsletterSchema, 'newsletter_subscribers');
