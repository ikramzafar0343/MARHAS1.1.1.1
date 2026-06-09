import pino from 'pino';
import pinoPretty from 'pino-pretty';
import { env } from '../config/env.js';

const prettyStream =
  env.NODE_ENV === 'development'
    ? pinoPretty({
        colorize: true,
        translateTime: 'SYS:standard',
        singleLine: true,
        ignore: 'pid,hostname'
      })
    : undefined;

export const logger = pino(
  {
    level: env.NODE_ENV === 'test' ? 'silent' : 'info',
    base: { service: 'marhas-api' }
  },
  prettyStream
);

export const auditLogger = pino(
  {
    level: 'info',
    base: { service: 'marhas-audit' }
  },
  pino.destination({ dest: 'logs/audit.log', mkdir: true, sync: false })
);

export const securityLogger = pino(
  {
    level: 'info',
    base: { service: 'marhas-security' }
  },
  pino.destination({ dest: 'logs/security.log', mkdir: true, sync: false })
);
