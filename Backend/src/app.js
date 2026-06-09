import express from 'express';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { applySecurityMiddleware } from './middlewares/security.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import apiRoutes from './routes/index.js';

const FRONTEND_DIST_DIR = path.resolve(process.cwd(), 'public');
const FRONTEND_INDEX = path.join(FRONTEND_DIST_DIR, 'index.html');

const shouldServeFrontend = () =>
  env.NODE_ENV === 'production' && existsSync(FRONTEND_INDEX);

const isBackendOnlyPath = (requestPath) =>
  requestPath.startsWith(env.API_PREFIX) ||
  requestPath.startsWith('/uploads') ||
  requestPath.startsWith('/api-docs');

export const createApp = () => {
  const app = express();

  applySecurityMiddleware(app);

  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  try {
    const openapiPath = path.resolve(process.cwd(), 'swagger/openapi.json');
    const openapiDocument = JSON.parse(readFileSync(openapiPath, 'utf8'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  } catch {
    // Swagger spec optional until file is present
  }

  app.use(env.API_PREFIX, apiRoutes);

  if (shouldServeFrontend()) {
    app.use(express.static(FRONTEND_DIST_DIR));

    app.get(/^(?!\/api\/|\/uploads\/|\/api-docs).*/, (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }

      if (isBackendOnlyPath(req.path)) {
        return next();
      }

      return res.sendFile(FRONTEND_INDEX, (error) => {
        if (error) {
          next(error);
        }
      });
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;

