import { AppError } from '../utils/AppError.js';
import { errorResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const notFoundHandler = (req, res) =>
  errorResponse(res, { message: `Route ${req.originalUrl} not found`, statusCode: 404 });

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
  }

  if (!err.isOperational) {
    if (process.env.NODE_ENV === 'test') {
      console.error('[test-error]', err.message, err.stack?.split('\n').slice(0, 3).join('\n'));
    }
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  }

  return errorResponse(res, {
    message,
    errors: err.errors || [],
    statusCode
  });
};

export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
