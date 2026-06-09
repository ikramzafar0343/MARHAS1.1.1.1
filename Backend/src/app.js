import express from 'express';
import path from 'path';
import { readFileSync } from 'fs';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { applySecurityMiddleware } from './middlewares/security.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import apiRoutes from './routes/index.js';

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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;

