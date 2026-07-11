import { env } from './env.js';

const PLACEHOLDER_PASSWORD_PATTERNS = [
  /^CHANGE_ME/i,
  /^REPLACE_WITH/i,
  /^your[_-]?password/i,
  /^\s*$/
];

export const isPlaceholderSmtpPassword = (value) =>
  !value || PLACEHOLDER_PASSWORD_PATTERNS.some((pattern) => pattern.test(value));

export const resolveSmtpPort = () => env.SMTP_PORT || 587;

export const resolveSmtpSecure = () => {
  const port = resolveSmtpPort();

  if (port === 465) {
    return true;
  }

  return Boolean(env.SMTP_SECURE);
};

export const resolveEmailFrom = () => {
  const smtpUser = env.SMTP_USER?.trim();
  const configured = env.EMAIL_FROM?.trim();

  if (!smtpUser) {
    return configured || 'MARHAS <noreply@marhas.com>';
  }

  if (configured && configured.includes(smtpUser)) {
    return configured;
  }

  if (configured) {
    const displayNameMatch = configured.match(/^(.+?)\s*<[^>]+>$/);
    const displayName = displayNameMatch ? displayNameMatch[1].trim() : 'MARHAS';
    return `${displayName} <${smtpUser}>`;
  }

  return `MARHAS <${smtpUser}>`;
};

export const buildSmtpTransportOptions = () => {
  if (!env.SMTP_HOST) {
    return null;
  }

  const port = resolveSmtpPort();
  const secure = resolveSmtpSecure();

  const options = {
    host: env.SMTP_HOST,
    port,
    secure,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: env.NODE_ENV === 'production'
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000
  };

  if (port === 587 && !secure) {
    options.requireTLS = true;
  }

  return options;
};

export const getSmtpReadiness = () => {
  const missing = [];

  if (!env.SMTP_HOST) {
    missing.push('SMTP_HOST');
  }

  if (!env.SMTP_USER) {
    missing.push('SMTP_USER');
  }

  if (!env.SMTP_PASS) {
    missing.push('SMTP_PASS');
  } else if (isPlaceholderSmtpPassword(env.SMTP_PASS)) {
    missing.push('SMTP_PASS (placeholder value)');
  }

  return {
    configured: missing.length === 0,
    missing,
    from: resolveEmailFrom(),
    port: resolveSmtpPort(),
    secure: resolveSmtpSecure()
  };
};
