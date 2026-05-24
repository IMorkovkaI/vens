export const DASHBOARD_PASSWORD_MIN_LENGTH = 12;

export function getDashboardPasswordPolicyMessage(): string {
  return `Password must be at least ${DASHBOARD_PASSWORD_MIN_LENGTH} characters and include uppercase, lowercase, and a number.`;
}

export function validateDashboardPassword(password: string): string {
  if (password.length < DASHBOARD_PASSWORD_MIN_LENGTH) {
    return getDashboardPasswordPolicyMessage();
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return getDashboardPasswordPolicyMessage();
  }

  return '';
}
