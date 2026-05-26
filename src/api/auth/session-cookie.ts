import { Request, Response } from 'express';

export const SESSION_COOKIE_NAME = 'vensight_session';

export function setSessionCookie(
  req: Request,
  res: Response,
  token: string | undefined,
  expiresAt: string,
): void {
  if (!token) {
    return;
  }

  res.setHeader(
    'Set-Cookie',
    serializeSessionCookie(token, {
      expiresAt,
      secure: isSecureRequest(req),
    }),
  );
}

export function clearSessionCookie(req: Request, res: Response): void {
  res.setHeader(
    'Set-Cookie',
    serializeSessionCookie('', {
      expiresAt: 'Thu, 01 Jan 1970 00:00:00 GMT',
      maxAge: 0,
      secure: isSecureRequest(req),
    }),
  );
}

export function readSessionCookie(req: Request): string | undefined {
  const cookieHeader = req.header('cookie');

  if (!cookieHeader) {
    return undefined;
  }

  for (const cookiePart of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = cookiePart.trim().split('=');

    if (rawName !== SESSION_COOKIE_NAME) {
      continue;
    }

    const rawValue = rawValueParts.join('=');

    if (!rawValue) {
      return undefined;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function serializeSessionCookie(
  value: string,
  options: { expiresAt: string; secure: boolean; maxAge?: number },
): string {
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${new Date(options.expiresAt).toUTCString()}`,
  ];

  if (typeof options.maxAge === 'number') {
    cookieParts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.secure) {
    cookieParts.push('Secure');
  }

  return cookieParts.join('; ');
}

function isSecureRequest(req: Request): boolean {
  return process.env['NODE_ENV'] === 'production' || req.secure || req.header('x-forwarded-proto') === 'https';
}
