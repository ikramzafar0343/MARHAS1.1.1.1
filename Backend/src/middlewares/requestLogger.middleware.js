import pinoHttp from 'pino-http';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const shouldIgnore = (url = '') =>
  url.includes('/health') || url === '/&' || url.startsWith('/&?');

export const devRequestLogger = () => (req, res, next) => {
  if (shouldIgnore(req.originalUrl || req.url)) {
    next();
    return;
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Math.round(Number(process.hrtime.bigint() - start) / 1e6);
    const url = req.originalUrl || req.url;
    const line = `${req.method} ${url} ${res.statusCode} ${ms}ms`;

    if (res.statusCode >= 500) {
      logger.error(line);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn(line);
      return;
    }

    logger.info(line);
  });

  next();
};

export const productionRequestLogger = () =>
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => shouldIgnore(req.url) },
    quietReqLogger: true,
    serializers: {
      req(req) {
        return { method: req.method, url: req.originalUrl || req.url };
      },
      res(res) {
        return { statusCode: res.statusCode };
      }
    },
    customSuccessMessage(req, res) {
      const url = req.originalUrl || req.url;
      return `${req.method} ${url} ${res.statusCode}`;
    },
    customErrorMessage(req, res, err) {
      const url = req.originalUrl || req.url;
      return `${req.method} ${url} ${res.statusCode} - ${err.message}`;
    },
    customLogLevel(_req, res, err) {
      if (err || res.statusCode >= 500) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    }
  });

export const requestLogger = () =>
  env.NODE_ENV === 'development' ? devRequestLogger() : productionRequestLogger();
