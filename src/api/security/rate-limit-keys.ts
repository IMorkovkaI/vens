export function buildRateLimitKeys(
  clientIp: string,
  method: string,
  requestPath: string,
  email?: string,
): string[] {
  const keys = [`ip:${clientIp}:${method}:${requestPath}`];
  const normalizedEmail = email?.trim().toLowerCase();

  if (method === 'POST' && requestPath === '/api/auth/login' && normalizedEmail) {
    keys.push(`email:${normalizedEmail}:${method}:${requestPath}`);
  }

  return keys;
}
