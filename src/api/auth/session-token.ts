import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { AuthSession, DashboardRole, DashboardUser } from '../../app/core/auth/auth.models';

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const TOKEN_HEADER = {
  alg: 'HS256',
  typ: 'JWT',
};

interface SessionTokenPayload extends DashboardUser {
  issuedAt: string;
  expiresAt: string;
}

export function attachSessionToken(session: AuthSession): AuthSession {
  return {
    ...session,
    expiresAt: session.expiresAt || getSessionExpiresAt(session.issuedAt).toISOString(),
    token: signSessionToken(session.user, session.issuedAt),
  };
}

export function signSessionToken(
  user: DashboardUser,
  issuedAt = new Date().toISOString(),
): string {
  const payload: SessionTokenPayload = {
    ...user,
    issuedAt,
    expiresAt: getSessionExpiresAt(issuedAt).toISOString(),
  };
  const encodedHeader = encodeJson(TOKEN_HEADER);
  const encodedPayload = encodeJson(payload);
  const signature = sign(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getSessionExpiresAt(issuedAt: string | Date = new Date()): Date {
  return new Date(new Date(issuedAt).getTime() + SESSION_TTL_MS);
}

export function verifySessionToken(token: string): DashboardUser | undefined {
  const [encodedHeader, encodedPayload, signature, extra] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature || extra) {
    return undefined;
  }

  if (!isValidSignature(`${encodedHeader}.${encodedPayload}`, signature)) {
    return undefined;
  }

  try {
    const header = decodeJson<Record<string, unknown>>(encodedHeader);
    const payload = decodeJson<SessionTokenPayload>(encodedPayload);

    if (header['alg'] !== TOKEN_HEADER.alg || header['typ'] !== TOKEN_HEADER.typ) {
      return undefined;
    }

    if (!payload.email.includes('@') || !isDashboardRole(payload.role)) {
      return undefined;
    }

    if (new Date(payload.expiresAt).getTime() <= Date.now()) {
      return undefined;
    }

    return {
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return undefined;
  }
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function decodeJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function sign(value: string): string {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function isValidSignature(value: string, signature: string): boolean {
  const expectedSignature = Buffer.from(sign(value), 'base64url');
  const actualSignature = Buffer.from(signature, 'base64url');

  return (
    expectedSignature.length === actualSignature.length &&
    timingSafeEqual(expectedSignature, actualSignature)
  );
}

function getSessionSecret(): string {
  const configuredSecret = process.env['SESSION_SECRET']?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('SESSION_SECRET is required in production.');
  }

  return 'vensight-local-session-secret';
}

function isDashboardRole(value: unknown): value is DashboardRole {
  return value === 'user' || value === 'developer' || value === 'admin';
}
