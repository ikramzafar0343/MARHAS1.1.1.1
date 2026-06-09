import { User } from './user.model.js';
import { AppError } from '../../utils/AppError.js';

export class UserRepository {
  constructor(model = User) {
    this.model = model;
  }

  async create(data, options = {}) {
    const user = new this.model(data);
    if (options.updatedBy) {
      user.updatedBy = options.updatedBy;
    }
    return user.save();
  }

  async findById(id, options = {}) {
    let query = this.model.findById(id);

    if (options.includePassword) {
      query = query.select('+passwordHash');
    }
    if (options.includeRefreshTokens) {
      query = query.select('+refreshTokens');
    }
    if (options.includeVerification) {
      query = query.select('+emailVerificationToken +emailVerificationExpires');
    }
    if (options.includeReset) {
      query = query.select('+passwordResetToken +passwordResetExpires');
    }
    if (options.includeDeleted) {
      query = query.setOptions({ includeDeleted: true });
    }

    return query.exec();
  }

  async findByEmail(email, options = {}) {
    let query = this.model.findOne({ email: email.toLowerCase().trim() });

    if (options.includePassword) {
      query = query.select('+passwordHash');
    }
    if (options.includeRefreshTokens) {
      query = query.select('+refreshTokens');
    }
    if (options.includeVerification) {
      query = query.select('+emailVerificationToken +emailVerificationExpires');
    }
    if (options.includeReset) {
      query = query.select('+passwordResetToken +passwordResetExpires');
    }
    if (options.includeDeleted) {
      query = query.setOptions({ includeDeleted: true });
    }

    return query.exec();
  }

  async findByVerificationToken(token) {
    return this.model
      .findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      })
      .select('+emailVerificationToken +emailVerificationExpires')
      .exec();
  }

  async findByResetToken(token) {
    return this.model
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() }
      })
      .select('+passwordResetToken +passwordResetExpires +passwordHash')
      .exec();
  }

  async findByRefreshTokenHash(tokenHash) {
    return this.model
      .findOne({
        'refreshTokens.tokenHash': tokenHash,
        'refreshTokens.revokedAt': null,
        'refreshTokens.expiresAt': { $gt: new Date() }
      })
      .select('+refreshTokens')
      .exec();
  }

  async findPaginated({ page = 1, limit = 20, filter = {}, sort = { createdAt: -1 } } = {}) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;

    const [docs, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(safeLimit).lean(),
      this.model.countDocuments(filter)
    ]);

    return {
      docs,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 0,
        hasNext: safePage * safeLimit < total,
        hasPrev: safePage > 1
      }
    };
  }

  async updateById(id, data, options = {}) {
    const update = { ...data };
    if (options.updatedBy) {
      update.updatedBy = options.updatedBy;
    }

    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  async updatePassword(id, passwordHash, updatedBy = null) {
    const update = {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null
    };
    if (updatedBy) {
      update.updatedBy = updatedBy;
    }

    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  async markEmailVerified(id, updatedBy = null) {
    const update = {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    };
    if (updatedBy) {
      update.updatedBy = updatedBy;
    }

    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  async setVerificationToken(id, token, expiresAt) {
    return this.model
      .findByIdAndUpdate(
        id,
        { emailVerificationToken: token, emailVerificationExpires: expiresAt },
        { new: true, runValidators: true }
      )
      .exec();
  }

  async setPasswordResetToken(id, token, expiresAt) {
    return this.model
      .findByIdAndUpdate(
        id,
        { passwordResetToken: token, passwordResetExpires: expiresAt },
        { new: true, runValidators: true }
      )
      .exec();
  }

  async addRefreshToken(id, tokenEntry) {
    return this.model
      .findByIdAndUpdate(
        id,
        { $push: { refreshTokens: tokenEntry } },
        { new: true, runValidators: true }
      )
      .select('+refreshTokens')
      .exec();
  }

  async revokeRefreshToken(id, tokenHash) {
    return this.model
      .findOneAndUpdate(
        { _id: id, 'refreshTokens.tokenHash': tokenHash },
        { $set: { 'refreshTokens.$.revokedAt': new Date() } },
        { new: true }
      )
      .select('+refreshTokens')
      .exec();
  }

  async revokeAllRefreshTokens(id) {
    const user = await this.model.findById(id).select('+refreshTokens').exec();
    if (!user) {
      return null;
    }

    const revokedAt = new Date();
    user.refreshTokens.forEach((entry) => {
      if (!entry.revokedAt) {
        entry.revokedAt = revokedAt;
      }
    });

    return user.save();
  }

  async pruneExpiredRefreshTokens(id) {
    return this.model
      .findByIdAndUpdate(
        id,
        { $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } } },
        { new: true }
      )
      .select('+refreshTokens')
      .exec();
  }

  async addToWishlist(userId, productId) {
    return this.model
      .findByIdAndUpdate(
        userId,
        { $addToSet: { wishlist: productId } },
        { new: true, runValidators: true }
      )
      .exec();
  }

  async removeFromWishlist(userId, productId) {
    return this.model
      .findByIdAndUpdate(
        userId,
        { $pull: { wishlist: productId } },
        { new: true, runValidators: true }
      )
      .exec();
  }

  async addAddress(userId, address) {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }

    if (address.isDefault) {
      user.addresses.forEach((entry) => {
        entry.isDefault = false;
      });
    }

    user.addresses.push(address);
    return user.save();
  }

  async updateAddress(userId, addressId, updates) {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return null;
    }

    if (updates.isDefault) {
      user.addresses.forEach((entry) => {
        entry.isDefault = entry._id.toString() === addressId.toString();
      });
    }

    Object.assign(address, updates);
    return user.save();
  }

  async removeAddress(userId, addressId) {
    return this.model
      .findByIdAndUpdate(
        userId,
        { $pull: { addresses: { _id: addressId } } },
        { new: true, runValidators: true }
      )
      .exec();
  }

  async softDeleteById(id, updatedBy = null) {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }
    return user.softDelete(updatedBy);
  }

  async restoreById(id, updatedBy = null) {
    const user = await this.model
      .findById(id)
      .setOptions({ includeDeleted: true })
      .exec();
    if (!user) {
      return null;
    }
    return user.restore(updatedBy);
  }

  async emailExists(email, excludeId = null) {
    const filter = { email: email.toLowerCase().trim() };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const count = await this.model.countDocuments(filter);
    return count > 0;
  }

  async assertExists(id) {
    const user = await this.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}

export const userRepository = new UserRepository();
