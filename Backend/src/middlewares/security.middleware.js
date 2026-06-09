import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { mongoSanitizeMiddleware } from './mongoSanitize.middleware.js';
import { xssSanitize } from './xss.middleware.js';
import rateLimit from 'express-rate-limit';
import { corsOrigins, env } from '../config/env.js';
import { requestLogger } from './requestLogger.middleware.js';

const normalizeOrigin = (value = '') => value.replace(/\/$/, '');

export const applySecurityMiddleware = (app) => {
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  const apiCors = cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // CORS applies to API calls only — not same-origin static assets (JS/CSS/images)
  app.use(env.API_PREFIX, apiCors);

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(mongoSanitizeMiddleware());
  app.use(xssSanitize());

  // Skip global rate limiting in local development (React StrictMode + hot reload burst easily hit 100/15min)
  if (env.NODE_ENV !== 'development') {
    app.use(
      rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many requests', errors: [] }
      })
    );
  }

  if (env.NODE_ENV !== 'test') {
    app.use(requestLogger());
  }
};
