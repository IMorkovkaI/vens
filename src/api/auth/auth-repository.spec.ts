import { afterEach, describe, expect, it } from 'vitest';
import { PrismaAuthRepository } from '../database/prisma-auth.repository';
import {
  createInMemoryAuthRepository,
  getAuthRepository,
  resetAuthRepositoryForTests,
} from './auth-repository';
import { InMemoryAuthRepository } from './auth-store';
import { hashPassword, verifyPassword } from './password-hasher';
import { DEVELOPMENT_SEEDED_ADMIN_PASSWORD } from './seeded-admin-config';
import { validateDashboardPassword } from '../../app/core/auth/password-policy';

const originalDatabaseUrl = process.env['DATABASE_URL'];
const originalSeededAdminPassword = process.env['SEEDED_ADMIN_PASSWORD'];

describe('auth repository selection', () => {
  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env['DATABASE_URL'];
    } else {
      process.env['DATABASE_URL'] = originalDatabaseUrl;
    }

    resetAuthRepositoryForTests();
  });

  it('uses the in-memory auth repository when DATABASE_URL is absent', () => {
    delete process.env['DATABASE_URL'];

    expect(getAuthRepository()).toBeInstanceOf(InMemoryAuthRepository);
  });

  it('uses the Prisma auth repository when DATABASE_URL is configured', () => {
    process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/vensight';

    expect(getAuthRepository()).toBeInstanceOf(PrismaAuthRepository);
  });
});

describe('password hashing', () => {
  it('verifies scrypt hashes and rejects the wrong password', () => {
    const passwordHash = hashPassword(DEVELOPMENT_SEEDED_ADMIN_PASSWORD);

    expect(passwordHash).toMatch(/^scrypt:v1:/);
    expect(verifyPassword(DEVELOPMENT_SEEDED_ADMIN_PASSWORD, passwordHash)).toBe(true);
    expect(verifyPassword('wrong-password', passwordHash)).toBe(false);
  });

  it('keeps legacy mock hashes readable for transition safety', () => {
    expect(verifyPassword('vensight-admin', 'mock:v1:vensight-admin')).toBe(true);
    expect(verifyPassword('wrong-password', 'mock:v1:vensight-admin')).toBe(false);
  });
});

describe('dashboard password policy', () => {
  it('requires uppercase, lowercase, and a number', () => {
    expect(validateDashboardPassword('lowercasepass2026')).toContain('uppercase');
    expect(validateDashboardPassword('UPPERCASEPASS2026')).toContain('lowercase');
    expect(validateDashboardPassword('StrongPassword')).toContain('number');
    expect(validateDashboardPassword('StrongUserPass2026')).toBe('');
  });
});

describe('in-memory auth repository contract', () => {
  afterEach(() => {
    restoreEnvValue('SEEDED_ADMIN_PASSWORD', originalSeededAdminPassword);
  });

  it('logs in the seeded admin', async () => {
    process.env['SEEDED_ADMIN_PASSWORD'] = DEVELOPMENT_SEEDED_ADMIN_PASSWORD;
    const repository = createInMemoryAuthRepository();
    const session = await repository.login({
      email: 'imarkovychi@gmail.com',
      password: DEVELOPMENT_SEEDED_ADMIN_PASSWORD,
    });

    expect(session.user).toEqual({
      email: 'imarkovychi@gmail.com',
      role: 'admin',
    });
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('refreshes signed in-memory sessions', async () => {
    process.env['SEEDED_ADMIN_PASSWORD'] = DEVELOPMENT_SEEDED_ADMIN_PASSWORD;
    const repository = createInMemoryAuthRepository();
    const session = await repository.login({
      email: 'imarkovychi@gmail.com',
      password: DEVELOPMENT_SEEDED_ADMIN_PASSWORD,
    });
    const refreshedSession = await repository.refresh(session.token);

    expect(refreshedSession.user).toEqual(session.user);
    expect(refreshedSession.token).toBeTruthy();
    expect(new Date(refreshedSession.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects missing in-memory session refreshes', async () => {
    const repository = createInMemoryAuthRepository();

    await expect(repository.refresh(undefined)).rejects.toThrow('Sign in is required.');
  });

  it('accepts logout as an idempotent operation in memory mode', async () => {
    process.env['SEEDED_ADMIN_PASSWORD'] = DEVELOPMENT_SEEDED_ADMIN_PASSWORD;
    const repository = createInMemoryAuthRepository();
    const session = await repository.login({
      email: 'imarkovychi@gmail.com',
      password: DEVELOPMENT_SEEDED_ADMIN_PASSWORD,
    });

    await expect(repository.logout(session.token)).resolves.toBeUndefined();
    await expect(repository.logout(undefined)).resolves.toBeUndefined();
  });

  it('registers users and creates developers for admins', async () => {
    process.env['SEEDED_ADMIN_PASSWORD'] = DEVELOPMENT_SEEDED_ADMIN_PASSWORD;
    const repository = createInMemoryAuthRepository();
    const user = await repository.register({
      email: 'user@example.com',
      password: 'StrongUserPass2026',
      confirmPassword: 'StrongUserPass2026',
    });
    const developer = await repository.createDeveloper(
      {
        email: 'dev@example.com',
        password: 'StrongDevPass2026',
      },
      {
        email: 'imarkovychi@gmail.com',
        role: 'admin',
      },
    );
    const developers = await repository.listDevelopers({
      email: 'imarkovychi@gmail.com',
      role: 'admin',
    });

    expect(user).toEqual({
      email: 'user@example.com',
      role: 'user',
    });
    expect(developer).toEqual({
      email: 'dev@example.com',
      role: 'developer',
    });
    expect(developers).toEqual([developer]);
  });
});

function restoreEnvValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
