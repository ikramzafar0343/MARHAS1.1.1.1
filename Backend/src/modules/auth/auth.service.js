import { User } from '../users/user.model.js';
import { UserRepository } from '../users/user.repository.js';
import { ADMIN_ROLES, ROLES } from '../../constants/roles.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import { emailService } from '../../services/email.service.js';
import { tokenService } from '../../services/token.service.js';

export const REFRESH_COOKIE_NAME = 'marhas_refresh_token';

const parseDurationMs = (value) => {
  const match = String(value).trim().match(/^(\d+)([smhdw])$/i);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = parseInt(match[1], 10);
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  return amount * multipliers[match[2].toLowerCase()];
};

export const toAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl || null,
  isEmailVerified: user.isEmailVerified,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt
});

export const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
    path: '/'
  });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
};

const getRequestContext = (req) => ({
  device: req.headers['user-agent'] || null,
  ip: req.ip || req.socket?.remoteAddress || null
});

export class AuthService {
  constructor(userRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  async issueAuthResponse(user, req, res) {
    const tokens = tokenService.generateTokenPair(user);
    const entry = tokenService.buildRefreshTokenEntry(tokens.refreshToken, getRequestContext(req));

    await this.userRepository.addRefreshToken(user._id, entry);
    await this.userRepository.pruneExpiredRefreshTokens(user._id);
    setRefreshCookie(res, tokens.refreshToken);

    return {
      user: toAuthUser(user),
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn
    };
  }

  async register(data, req, res) {
    const email = data.email.toLowerCase().trim();

    if (await this.userRepository.emailExists(email)) {
      throw new AppError('Email is already registered', 409);
    }

    const passwordHash = await User.hashPassword(data.password);
    const verificationToken = emailService.generateToken();

    const user = await this.userRepository.create({
      name: data.name.trim(),
      email,
      passwordHash,
      role: ROLES.CUSTOMER,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: emailService.getVerificationExpiry()
    });

    try {
      await emailService.sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: verificationToken
      });
    } catch (error) {
      logger.warn({ err: error.message, email: user.email }, 'Verification email failed');
    }

    return this.issueAuthResponse(user, req, res);
  }

  async login(data, req, res, { adminOnly = false } = {}) {
    const user = await this.userRepository.findByEmail(data.email, { includePassword: true });

    if (!user || user.deletedAt) {
      throw new AppError('Invalid email or password', 401);
    }

    if (adminOnly && !ADMIN_ROLES.includes(user.role)) {
      throw new AppError('Admin access required', 403);
    }

    const isValid = await user.comparePassword(data.password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    await this.userRepository.updateById(user._id, { lastLoginAt: new Date() });
    user.lastLoginAt = new Date();

    return this.issueAuthResponse(user, req, res);
  }

  async logout(req, res) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (refreshToken && req.user) {
      const tokenHash = tokenService.hashToken(refreshToken);
      await this.userRepository.revokeRefreshToken(req.user._id, tokenHash);
    }

    clearRefreshCookie(res);
    return { loggedOut: true };
  }

  async refresh(req, res) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      throw new AppError('Refresh token required', 401);
    }

    const tokens = await tokenService.rotateRefreshToken(
      null,
      refreshToken,
      this.userRepository,
      getRequestContext(req)
    );

    setRefreshCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn
    };
  }

  async forgotPassword({ email }) {
    const user = await this.userRepository.findByEmail(email);

    if (user && !user.deletedAt) {
      const token = emailService.generateToken();
      await this.userRepository.setPasswordResetToken(
        user._id,
        token,
        emailService.getResetExpiry()
      );
      await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token
      });
    }

    return {
      message:
        'If an account exists for that email, a password reset link has been sent'
    };
  }

  async resetPassword({ token, password }) {
    const user = await this.userRepository.findByResetToken(token);

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const passwordHash = await User.hashPassword(password);
    await this.userRepository.updatePassword(user._id, passwordHash);
    await this.userRepository.revokeAllRefreshTokens(user._id);

    if (!user.isEmailVerified) {
      await this.userRepository.markEmailVerified(user._id);
    }

    await emailService.sendWelcomeEmail({ to: user.email, name: user.name });

    return { passwordReset: true };
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await this.userRepository.findById(userId, { includePassword: true });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const passwordHash = await User.hashPassword(newPassword);
    await this.userRepository.updatePassword(userId, passwordHash, userId);
    await this.userRepository.revokeAllRefreshTokens(userId);

    return { passwordChanged: true };
  }

  async verifyEmail(token) {
    const user = await this.userRepository.findByVerificationToken(token);

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    if (user.isEmailVerified) {
      return { user: toAuthUser(user), alreadyVerified: true };
    }

    const verified = await this.userRepository.markEmailVerified(user._id);
    await emailService.sendWelcomeEmail({ to: verified.email, name: verified.name });

    return { user: toAuthUser(verified), alreadyVerified: false };
  }

  async resendVerification(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    const token = emailService.generateToken();
    await this.userRepository.setVerificationToken(
      user._id,
      token,
      emailService.getVerificationExpiry()
    );
    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      token
    });

    return { verificationSent: true };
  }

  async getMe(userId) {
    const user = await this.userRepository.assertExists(userId);
    return toAuthUser(user);
  }

  async uploadAvatar(userId, file) {
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    const user = await this.userRepository.updateById(userId, { avatarUrl });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return toAuthUser(user);
  }

  async getSessions(userId) {
    const user = await this.userRepository.findById(userId, { includeRefreshTokens: true });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const now = new Date();

    return (user.refreshTokens || [])
      .filter((session) => !session.revokedAt && session.expiresAt > now)
      .map((session) => ({
        id: session._id,
        device: session.device,
        ip: session.ip,
        expiresAt: session.expiresAt,
        createdAt: session._id?.getTimestamp?.() ?? null
      }))
      .sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt));
  }

  async revokeSession(userId, sessionId) {
    const user = await this.userRepository.findById(userId, { includeRefreshTokens: true });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const session = user.refreshTokens?.id(sessionId);
    if (!session || session.revokedAt) {
      throw new AppError('Session not found', 404);
    }

    await this.userRepository.revokeRefreshToken(userId, session.tokenHash);
    return { revoked: true };
  }

  async revokeAllSessions(userId) {
    await this.userRepository.assertExists(userId);
    await this.userRepository.revokeAllRefreshTokens(userId);
    return { revokedAll: true };
  }
}

export const authService = new AuthService();
