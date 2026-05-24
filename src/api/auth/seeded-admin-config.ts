import { StoredAccount } from '../../app/core/auth/auth.models';
import { validateDashboardPassword } from '../../app/core/auth/password-policy';

export const SEEDED_ADMIN_EMAIL = 'imarkovychi@gmail.com';
export const DEVELOPMENT_SEEDED_ADMIN_PASSWORD = 'ChangeThisLocalAdmin2026';

export function createSeededAdminAccount(options: { allowDevelopmentFallback: boolean }): StoredAccount {
  const password = resolveSeededAdminPassword(options);
  const validationError = validateDashboardPassword(password);

  if (validationError) {
    throw new Error(`SEEDED_ADMIN_PASSWORD is invalid. ${validationError}`);
  }

  return {
    email: (process.env['SEEDED_ADMIN_EMAIL']?.trim() || SEEDED_ADMIN_EMAIL).toLowerCase(),
    password,
    role: 'admin',
  };
}

export function resolveSeededAdminPassword(options: {
  allowDevelopmentFallback: boolean;
}): string {
  const configuredPassword = process.env['SEEDED_ADMIN_PASSWORD']?.trim();

  if (configuredPassword) {
    return configuredPassword;
  }

  if (options.allowDevelopmentFallback) {
    return DEVELOPMENT_SEEDED_ADMIN_PASSWORD;
  }

  throw new Error('SEEDED_ADMIN_PASSWORD is required for production seeding or production in-memory auth.');
}
