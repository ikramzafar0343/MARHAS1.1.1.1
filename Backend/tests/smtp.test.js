import { afterEach, describe, expect, jest, test } from '@jest/globals';

describe('smtp config', () => {
  const originalEnv = { ...process.env };

  const loadSmtpConfig = async () => {
    jest.resetModules();
    return import('../src/config/smtp.js');
  };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  test('treats placeholder SMTP passwords as not ready', async () => {
    const { isPlaceholderSmtpPassword } = await loadSmtpConfig();

    expect(isPlaceholderSmtpPassword('CHANGE_ME_EMAIL_PASSWORD')).toBe(true);
    expect(isPlaceholderSmtpPassword('REPLACE_WITH_SUPPORT_MAILBOX_PASSWORD')).toBe(true);
    expect(isPlaceholderSmtpPassword('mailbox-secret')).toBe(false);
  });

  test('forces secure transport on port 465 even when SMTP_SECURE is false', async () => {
    process.env.SMTP_HOST = 'smtp.hostinger.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'support@marhas.pk';
    process.env.SMTP_PASS = 'mailbox-secret';

    const { resolveSmtpSecure, buildSmtpTransportOptions } = await loadSmtpConfig();

    expect(resolveSmtpSecure()).toBe(true);
    expect(buildSmtpTransportOptions()).toMatchObject({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true
    });
  });

  test('aligns EMAIL_FROM with authenticated SMTP user for Hostinger', async () => {
    process.env.SMTP_USER = 'support@marhas.pk';
    process.env.EMAIL_FROM = 'MARHAS <noreply@marhas.com>';

    const { resolveEmailFrom } = await loadSmtpConfig();

    expect(resolveEmailFrom()).toBe('MARHAS <support@marhas.pk>');
  });

  test('keeps configured from address when it already matches SMTP user', async () => {
    process.env.SMTP_USER = 'support@marhas.pk';
    process.env.EMAIL_FROM = 'MARHAS <support@marhas.pk>';

    const { resolveEmailFrom } = await loadSmtpConfig();

    expect(resolveEmailFrom()).toBe('MARHAS <support@marhas.pk>');
  });

  test('reports placeholder SMTP password as missing', async () => {
    process.env.SMTP_HOST = 'smtp.hostinger.com';
    process.env.SMTP_USER = 'support@marhas.pk';
    process.env.SMTP_PASS = 'CHANGE_ME_EMAIL_PASSWORD';

    const { getSmtpReadiness } = await loadSmtpConfig();

    expect(getSmtpReadiness()).toMatchObject({
      configured: false,
      missing: ['SMTP_PASS (placeholder value)']
    });
  });
});
