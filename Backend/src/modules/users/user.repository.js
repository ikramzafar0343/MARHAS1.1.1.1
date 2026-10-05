import { randomUUID } from 'crypto';
import { prisma } from '../../database/prisma.js';
import { toEntity, softDeleteFilter } from '../../database/mapper.js';
import { AppError } from '../../utils/AppError.js';

const mapUser = (row, { includeWishlist = true } = {}) => {
  if (!row) return null;
  const entity = toEntity(row);
  const wishlist = includeWishlist
    ? (row.wishlistItems || []).map((item) => item.productId)
    : undefined;

  return {
    ...entity,
    wishlist: wishlist ?? entity.wishlist ?? [],
    addresses: Array.isArray(entity.addresses) ? entity.addresses : [],
    refreshTokens: Array.isArray(entity.refreshTokens) ? entity.refreshTokens : []
  };
};

const withWishlist = {
  wishlistItems: true
};

export class UserRepository {
  constructor(client = prisma) {
    this.db = client;
  }

  async create(data, options = {}) {
    const { wishlist, ...rest } = data;
    const user = await this.db.user.create({
      data: {
        ...rest,
        email: data.email.toLowerCase().trim(),
        updatedBy: options.updatedBy ?? data.updatedBy ?? null,
        createdBy: options.updatedBy ?? data.createdBy ?? null
      },
      include: withWishlist
    });
    return mapUser(user);
  }

  async findById(id, options = {}) {
    const user = await this.db.user.findFirst({
      where: { id, ...softDeleteFilter(options.includeDeleted) },
      include: withWishlist
    });
    return mapUser(user);
  }

  async findByEmail(email, options = {}) {
    const user = await this.db.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        ...softDeleteFilter(options.includeDeleted)
      },
      include: withWishlist
    });
    return mapUser(user);
  }

  async findByVerificationToken(token) {
    const user = await this.db.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
        deletedAt: null
      },
      include: withWishlist
    });
    return mapUser(user);
  }

  async findByResetToken(token) {
    const user = await this.db.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
        deletedAt: null
      },
      include: withWishlist
    });
    return mapUser(user);
  }

  async findByRefreshTokenHash(tokenHash) {
    const users = await this.db.user.findMany({
      where: { deletedAt: null },
      include: withWishlist
    });

    const now = Date.now();
    const match = users.find((user) =>
      (user.refreshTokens || []).some(
        (entry) =>
          entry.tokenHash === tokenHash &&
          !entry.revokedAt &&
          new Date(entry.expiresAt).getTime() > now
      )
    );

    return mapUser(match || null);
  }

  async findPaginated({ page = 1, limit = 20, filter = {}, sort = { createdAt: 'desc' } } = {}) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (safePage - 1) * safeLimit;
    const where = { deletedAt: null, ...filter };

    const orderBy = Object.entries(sort).map(([key, value]) => ({
      [key]: value === 1 || value === 'asc' ? 'asc' : 'desc'
    }));

    const [docs, total] = await Promise.all([
      this.db.user.findMany({
        where,
        orderBy,
        skip,
        take: safeLimit,
        include: withWishlist
      }),
      this.db.user.count({ where })
    ]);

    return {
      docs: docs.map((doc) => mapUser(doc)),
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
    if (options.updatedBy) update.updatedBy = options.updatedBy;
    if (update.email) update.email = update.email.toLowerCase().trim();

    try {
      const user = await this.db.user.update({
        where: { id },
        data: update,
        include: withWishlist
      });
      return mapUser(user);
    } catch {
      return null;
    }
  }

  async updatePassword(id, passwordHash, updatedBy = null) {
    return this.updateById(
      id,
      {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      },
      { updatedBy }
    );
  }

  async markEmailVerified(id, updatedBy = null) {
    return this.updateById(
      id,
      {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      },
      { updatedBy }
    );
  }

  async setVerificationToken(id, token, expiresAt) {
    return this.updateById(id, {
      emailVerificationToken: token,
      emailVerificationExpires: expiresAt
    });
  }

  async setPasswordResetToken(id, token, expiresAt) {
    return this.updateById(id, {
      passwordResetToken: token,
      passwordResetExpires: expiresAt
    });
  }

  async setAdminLoginOtp(id, { challengeId, otpHash, expiresAt }) {
    return this.updateById(id, {
      adminLoginChallengeId: challengeId,
      adminLoginOtpHash: otpHash,
      adminLoginOtpExpires: expiresAt
    });
  }

  async findByAdminLoginChallenge(challengeId) {
    const user = await this.db.user.findFirst({
      where: {
        adminLoginChallengeId: challengeId,
        adminLoginOtpExpires: { gt: new Date() },
        deletedAt: null
      },
      include: withWishlist
    });
    return mapUser(user);
  }

  async clearAdminLoginOtp(id) {
    return this.updateById(id, {
      adminLoginChallengeId: null,
      adminLoginOtpHash: null,
      adminLoginOtpExpires: null
    });
  }

  async addRefreshToken(id, tokenEntry) {
    const user = await this.db.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) return null;
    const refreshTokens = [...(user.refreshTokens || []), tokenEntry];
    return this.updateById(id, { refreshTokens });
  }

  async revokeRefreshToken(id, tokenHash) {
    const user = await this.db.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) return null;
    const refreshTokens = (user.refreshTokens || []).map((entry) =>
      entry.tokenHash === tokenHash ? { ...entry, revokedAt: new Date().toISOString() } : entry
    );
    return this.updateById(id, { refreshTokens });
  }

  async revokeAllRefreshTokens(id) {
    const user = await this.db.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) return null;
    const revokedAt = new Date().toISOString();
    const refreshTokens = (user.refreshTokens || []).map((entry) =>
      entry.revokedAt ? entry : { ...entry, revokedAt }
    );
    return this.updateById(id, { refreshTokens });
  }

  async pruneExpiredRefreshTokens(id) {
    const user = await this.db.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) return null;
    const now = Date.now();
    const refreshTokens = (user.refreshTokens || []).filter(
      (entry) => new Date(entry.expiresAt).getTime() >= now
    );
    return this.updateById(id, { refreshTokens });
  }

  async addToWishlist(userId, productId) {
    await this.db.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {}
    });
    return this.findById(userId);
  }

  async removeFromWishlist(userId, productId) {
    await this.db.wishlistItem.deleteMany({ where: { userId, productId } });
    return this.findById(userId);
  }

  async addAddress(userId, address) {
    const user = await this.db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) return null;

    let addresses = Array.isArray(user.addresses) ? [...user.addresses] : [];
    if (address.isDefault) {
      addresses = addresses.map((entry) => ({ ...entry, isDefault: false }));
    }

    addresses.push({
      ...address,
      _id: address._id || randomUUID(),
      id: address.id || address._id || randomUUID()
    });

    return this.updateById(userId, { addresses });
  }

  async updateAddress(userId, addressId, updates) {
    const user = await this.db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) return null;

    let addresses = Array.isArray(user.addresses) ? [...user.addresses] : [];
    const index = addresses.findIndex(
      (entry) => entry._id === addressId || entry.id === addressId
    );
    if (index < 0) return null;

    if (updates.isDefault) {
      addresses = addresses.map((entry, i) => ({
        ...entry,
        isDefault: i === index
      }));
    }

    addresses[index] = { ...addresses[index], ...updates };
    return this.updateById(userId, { addresses });
  }

  async removeAddress(userId, addressId) {
    const user = await this.db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) return null;
    const addresses = (user.addresses || []).filter(
      (entry) => entry._id !== addressId && entry.id !== addressId
    );
    return this.updateById(userId, { addresses });
  }

  async softDeleteById(id, updatedBy = null) {
    return this.updateById(id, { deletedAt: new Date() }, { updatedBy });
  }

  async restoreById(id, updatedBy = null) {
    return this.updateById(id, { deletedAt: null }, { updatedBy });
  }

  async emailExists(email, excludeId = null) {
    const count = await this.db.user.count({
      where: {
        email: email.toLowerCase().trim(),
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });
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
