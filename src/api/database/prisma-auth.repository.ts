import { DashboardRole as PrismaDashboardRole } from '../../../generated/prisma';
import {
  AuthSession,
  CreateDeveloperCredentials,
  DashboardRole,
  DashboardUser,
  LoginCredentials,
  RegisterCredentials,
} from '../../app/core/auth/auth.models';
import {
  getDashboardPasswordPolicyMessage,
  validateDashboardPassword,
} from '../../app/core/auth/password-policy';
import { AuthRepository } from '../auth/auth-repository.models';
import { hashPassword, verifyPassword } from '../auth/password-hasher';
import {
  getSessionExpiresAt,
  hashSessionToken,
  signSessionToken,
  verifySessionToken,
} from '../auth/session-token';
import { getPrismaClient } from './prisma.client';

export class PrismaAuthRepository implements AuthRepository {
  private readonly prisma = getPrismaClient();

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password.trim();

    this.assertValidAccountInput(email, password, password);

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new Error('No matching account was found for that email and password.');
    }

    const sessionUser = this.mapUser(user);
    const issuedAt = new Date();
    const token = signSessionToken(sessionUser, issuedAt.toISOString());

    await this.prisma.session.create({
      data: {
        tokenHash: hashSessionToken(token),
        userId: user.id,
        issuedAt,
        expiresAt: getSessionExpiresAt(issuedAt),
      },
    });

    return {
      user: sessionUser,
      issuedAt: issuedAt.toISOString(),
      expiresAt: getSessionExpiresAt(issuedAt).toISOString(),
      token,
    };
  }

  async refresh(token: string | undefined): Promise<AuthSession> {
    const trimmedToken = token?.trim();
    const tokenUser = trimmedToken ? verifySessionToken(trimmedToken) : undefined;

    if (!trimmedToken || !tokenUser) {
      throw new Error('Sign in is required.');
    }

    const existingSession = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(trimmedToken) },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        userId: true,
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    if (
      !existingSession ||
      existingSession.revokedAt ||
      existingSession.expiresAt.getTime() <= Date.now()
    ) {
      throw new Error('Sign in is required.');
    }

    const sessionUser = this.mapUser(existingSession.user);

    if (sessionUser.email !== tokenUser.email || sessionUser.role !== tokenUser.role) {
      throw new Error('Sign in is required.');
    }

    const issuedAt = new Date();
    const expiresAt = getSessionExpiresAt(issuedAt);
    const refreshedToken = signSessionToken(sessionUser, issuedAt.toISOString());

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: existingSession.id },
        data: { revokedAt: issuedAt },
      }),
      this.prisma.session.create({
        data: {
          tokenHash: hashSessionToken(refreshedToken),
          userId: existingSession.userId,
          issuedAt,
          expiresAt,
        },
      }),
    ]);

    return {
      user: sessionUser,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      token: refreshedToken,
    };
  }

  async logout(token: string | undefined): Promise<void> {
    const trimmedToken = token?.trim();

    if (!trimmedToken) {
      return;
    }

    await this.prisma.session.updateMany({
      where: {
        tokenHash: hashSessionToken(trimmedToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async register(credentials: RegisterCredentials): Promise<DashboardUser> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password.trim();
    const confirmPassword = credentials.confirmPassword.trim();

    this.assertValidAccountInput(email, password, confirmPassword);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new Error('An account already exists for this email.');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        role: PrismaDashboardRole.USER,
      },
      select: {
        email: true,
        role: true,
      },
    });

    return this.mapUser(user);
  }

  async createDeveloper(
    credentials: CreateDeveloperCredentials,
    currentUser: DashboardUser | undefined,
  ): Promise<DashboardUser> {
    if (currentUser?.role !== 'admin') {
      throw new Error('Only admins can add developers.');
    }

    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password.trim();

    this.assertValidAccountInput(email, password, password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new Error('An account already exists for this email.');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        role: PrismaDashboardRole.DEVELOPER,
      },
      select: {
        email: true,
        role: true,
      },
    });

    return this.mapUser(user);
  }

  async listDevelopers(currentUser: DashboardUser | undefined): Promise<DashboardUser[]> {
    if (currentUser?.role !== 'admin') {
      throw new Error('Only admins can view developers.');
    }

    const developers = await this.prisma.user.findMany({
      where: { role: PrismaDashboardRole.DEVELOPER },
      orderBy: { email: 'asc' },
      select: {
        email: true,
        role: true,
      },
    });

    return developers.map((user) => this.mapUser(user));
  }

  private assertValidAccountInput(
    email: string,
    password: string,
    confirmPassword: string,
  ): void {
    if (!email.includes('@')) {
      throw new Error('Use a valid email address.');
    }

    const passwordError = validateDashboardPassword(password);

    if (passwordError) {
      throw new Error(passwordError);
    }

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }
  }

  private mapUser(user: { email: string; role: PrismaDashboardRole }): DashboardUser {
    return {
      email: user.email,
      role: user.role.toLowerCase() as DashboardRole,
    };
  }
}
