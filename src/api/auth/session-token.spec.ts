import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DashboardUser } from '../../app/core/auth/auth.models';
import { readRequestUser } from './auth-request';
import { attachSessionToken, signSessionToken, verifySessionToken } from './session-token';

const adminUser: DashboardUser = {
  email: 'imarkovychi@gmail.com',
  role: 'admin',
};
const originalDatabaseUrl = process.env['DATABASE_URL'];

beforeEach(() => {
  delete process.env['DATABASE_URL'];
});

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env['DATABASE_URL'];
  } else {
    process.env['DATABASE_URL'] = originalDatabaseUrl;
  }
});

describe('session tokens', () => {
  it('attaches a signed bearer token to API auth sessions', () => {
    const session = attachSessionToken({
      user: adminUser,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    expect(session.token).toBeTruthy();
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(verifySessionToken(session.token ?? '')).toEqual(adminUser);
  });

  it('rejects tampered tokens', () => {
    const token = signSessionToken(adminUser);
    const [header, payload, signature] = token.split('.');
    const replacement = payload?.startsWith('a') ? 'b' : 'a';
    const tamperedPayload = payload?.replace(/^./, replacement);
    const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

    expect(verifySessionToken(tamperedToken)).toBeUndefined();
  });

  it('rejects expired tokens', () => {
    const token = signSessionToken(adminUser, '2020-01-01T00:00:00.000Z');

    expect(verifySessionToken(token)).toBeUndefined();
  });
});

describe('request auth reader', () => {
  it('reads dashboard users from bearer tokens', async () => {
    const token = signSessionToken(adminUser);

    await expect(readRequestUser(createRequest(`Bearer ${token}`))).resolves.toEqual(
      adminUser,
    );
  });

  it('ignores unsigned local identity headers', async () => {
    const encodedUser = Buffer.from(JSON.stringify(adminUser), 'utf8').toString('base64url');

    await expect(readRequestUser(createRequest(undefined, encodedUser))).resolves.toBeUndefined();
  });
});

function createRequest(authorization?: string, legacyUser?: string) {
  return {
    header(name: string): string | undefined {
      if (name.toLowerCase() === 'authorization') {
        return authorization;
      }

      if (name.toLowerCase() === 'x-vensight-user') {
        return legacyUser;
      }

      return undefined;
    },
  } as Parameters<typeof readRequestUser>[0];
}
