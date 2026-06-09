import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/apiResponse.js';
import { getDatabaseHealth } from '../../database/connection.js';
import { env } from '../../config/env.js';

export const getHealth = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: 'Service is healthy',
    data: {
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

export const getReadiness = asyncHandler(async (req, res) => {
  const database = getDatabaseHealth();
  const isReady = database.status === 'connected';

  return successResponse(res, {
    message: isReady ? 'Service is ready' : 'Service is not ready',
    data: {
      status: isReady ? 'ready' : 'not-ready',
      database,
      timestamp: new Date().toISOString()
    },
    statusCode: isReady ? 200 : 503
  });
});
