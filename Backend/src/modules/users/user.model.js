import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ROLES } from '../../constants/roles.js';
import {
  auditFields,
  applySoftDelete,
  applyAuditHooks
} from '../../database/plugins/auditPlugin.js';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    device: { type: String, trim: true, default: null },
    ip: { type: String, trim: true, default: null },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null }
  },
  { _id: true, timestamps: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email cannot exceed 254 characters']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      default: null,
      select: false
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    addresses: {
      type: [addressSchema],
      default: []
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
      select: false
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: null
    },
    ...auditFields
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
userSchema.index({ role: 1, deletedAt: 1 });
userSchema.index({ name: 'text', email: 'text' });
userSchema.index({ 'refreshTokens.tokenHash': 1 });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

applySoftDelete(userSchema);
applyAuditHooks(userSchema);

userSchema.methods.comparePassword = async function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 12);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
