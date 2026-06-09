import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const parseDurationMs = (value) => {
  const match = String(value).trim().match(/^(\d+)([smhdw])$/i);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  return amount * multipliers[unit];
};

export class TokenService {
  constructor(options = {}) {
    this.accessSecret = options.accessSecret ?? env.JWT_ACCESS_SECRET;
    this.refreshSecret = options.refreshSecret ?? env.JWT_REFRESH_SECRET;
    this.accessExpiresIn = options.accessExpiresIn ?? env.JWT_ACCESS_EXPIRES_IN;
    this.refreshExpiresIn = options.refreshExpiresIn ?? env.JWT_REFRESH_EXPIRES_IN;
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateOpaqueToken() {
    return crypto.randomBytes(48).toString('hex');
  }

  signAccessToken(payload) {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
      algorithm: 'HS256'
    });
  }

  signRefreshToken(payload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
      algorithm: 'HS256'
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessSecret, { algorithms: ['HS256'] });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Access token expired', 401);
      }
      throw new AppError('Invalid access token', 401);
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, { algorithms: ['HS256'] });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token expired', 401);
      }
      throw new AppError('Invalid refresh token', 401);
    }
  }

  buildTokenPayload(user) {
    return {
      sub: user._id?.toString?.() ?? user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
  }

  generateTokenPair(user) {
    const payload = this.buildTokenPayload(user);
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken({ ...payload, jti: crypto.randomUUID() });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiresIn
    };
  }

  getRefreshTokenExpiryDate() {
    return new Date(Date.now() + parseDurationMs(this.refreshExpiresIn));
  }

  buildRefreshTokenEntry(refreshToken, { device = null, ip = null } = {}) {
    return {
      tokenHash: this.hashToken(refreshToken),
      device,
      ip,
      expiresAt: this.getRefreshTokenExpiryDate(),
      revokedAt: null
    };
  }

  async rotateRefreshToken(user, oldRefreshToken, userRepository, context = {}) {
    const decoded = this.verifyRefreshToken(oldRefreshToken);
    const oldHash = this.hashToken(oldRefreshToken);

    const storedUser = await userRepository.findByRefreshTokenHash(oldHash);
    if (!storedUser || storedUser._id.toString() !== decoded.sub) {
      throw new AppError('Refresh token not found or revoked', 401);
    }

    await userRepository.revokeRefreshToken(storedUser._id, oldHash);

    const tokens = this.generateTokenPair(storedUser);
    const entry = this.buildRefreshTokenEntry(tokens.refreshToken, context);
    await userRepository.addRefreshToken(storedUser._id, entry);
    await userRepository.pruneExpiredRefreshTokens(storedUser._id);

    return tokens;
  }

  decodeAccessToken(token) {
    return jwt.decode(token);
  }
}

export const tokenService = new TokenService();
