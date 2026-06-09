import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserRepository } from '../modules/users/user.repository.js';
import { ADMIN_ROLES, PERMISSIONS, ROLE_HIERARCHY } from '../constants/roles.js';

const userRepository = new UserRepository();

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await userRepository.findById(decoded.sub);

    if (!user || user.deletedAt) {
      throw new AppError('User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid or expired token', 401);
  }
});

export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await userRepository.findById(decoded.sub);
    if (user && !user.deletedAt) {
      req.user = user;
    }
  } catch {
    // optional auth — ignore invalid token
  }

  next();
});

export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };

export const authorizeAdmin = authorize(...ADMIN_ROLES);

export const authorizePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const allowed = PERMISSIONS[permission] || [];

  if (!allowed.includes(req.user.role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  next();
};

export const authorizeMinRole = (minRole) => (req, res, next) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

  if (userLevel < requiredLevel) {
    throw new AppError('Insufficient permissions', 403);
  }

  next();
};

export const authorizeOwnerOrAdmin = (userIdField = 'userId') =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (ADMIN_ROLES.includes(req.user.role)) {
      return next();
    }

    const resourceUserId = req.resource?.[userIdField]?.toString();

    if (resourceUserId && resourceUserId === req.user._id.toString()) {
      return next();
    }

    throw new AppError('Access denied', 403);
  });
