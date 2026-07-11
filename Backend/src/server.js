import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { env } from './config/env.js';
import { getSmtpReadiness } from './config/smtp.js';
import { emailService } from './services/email.service.js';
import { logger } from './utils/logger.js';

const app = createApp();
let server;

const shutdown = async (signal) => {
  logger.info({ signal }, `Shutdown signal received: ${signal}`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  await disconnectDatabase();
  logger.info('Server shut down gracefully');
  process.exit(0);
};

const start = async () => {
  await connectDatabase();

  if (env.SYNC_DEFAULT_MEDIA) {
    const { resetBrokenMedia } = await import('./database/resetContent.js');
    await resetBrokenMedia();
    logger.info('SYNC_DEFAULT_MEDIA enabled — storefront and broken upload images were reset');
  } else if (env.NODE_ENV === 'production' && env.STORAGE_PROVIDER === 'local') {
    logger.warn(
      'STORAGE_PROVIDER=local on production uses ephemeral disk — configure Cloudinary for persistent uploads'
    );
  }

  const smtp = getSmtpReadiness();
  if (env.NODE_ENV === 'production') {
    if (!smtp.configured) {
      logger.error(
        { missing: smtp.missing },
        'SMTP is not ready for admin OTP emails — set Hostinger mailbox credentials and restart'
      );
    } else {
      const verification = await emailService.verifyConnection();
      if (verification.ok) {
        logger.info(
          { host: env.SMTP_HOST, port: smtp.port, secure: smtp.secure, from: smtp.from },
          'SMTP connection verified'
        );
      } else {
        logger.error(
          {
            err: verification.reason,
            host: env.SMTP_HOST,
            port: smtp.port,
            secure: smtp.secure,
            from: smtp.from
          },
          'SMTP verification failed — admin OTP emails will not deliver until this is fixed'
        );
      }
    }
  } else if (smtp.configured) {
    logger.info({ from: smtp.from, port: smtp.port, secure: smtp.secure }, 'SMTP configured');
  }

  server = app.listen(env.PORT, () => {
    logger.info(
      `MARHAS API server started — http://localhost:${env.PORT}${env.API_PREFIX} (${env.NODE_ENV})`
    );
  });

  server.on('error', (error) => {
    logger.error({ err: error }, 'Server error');
    process.exit(1);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  process.exit(1);
});

start().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});

export { app, start, shutdown };
