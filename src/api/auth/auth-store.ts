import {
  AuthSession,
  CreateDeveloperCredentials,
  DashboardUser,
  LoginCredentials,
  RegisterCredentials,
  StoredAccount,
} from '../../app/core/auth/auth.models';
import {
  getDashboardPasswordPolicyMessage,
  validateDashboardPassword,
} from '../../app/core/auth/password-policy';
import { AuthRepository } from './auth-repository.models';
import { createSeededAdminAccount } from './seeded-admin-config';
import { attachSessionToken, getSessionExpiresAt, verifySessionToken } from './session-token';

export class AuthStore {
  private accounts: StoredAccount[] = [
    createSeededAdminAccount({
      allowDevelopmentFallback:
        process.env['NODE_ENV'] !== 'production' || Boolean(process.env['DATABASE_URL']),
    }),
  ];

  login(credentials: LoginCredentials): AuthSession {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password.trim();

    if (!email.includes('@') || validateDashboardPassword(password)) {
      throw new Error(`Use any valid email. ${getDashboardPasswordPolicyMessage()}`);
    }

    const account = this.accounts.find((candidate) => candidate.email === email);

    if (!account || account.password !== password) {
      throw new Error('No matching account was found for that email and password.');
    }

    const issuedAt = new Date();

    return {
      user: {
        email: account.email,
        role: account.role,
      },
      issuedAt: issuedAt.toISOString(),
      expiresAt: getSessionExpiresAt(issuedAt).toISOString(),
    };
  }

  register(credentials: RegisterCredentials): DashboardUser {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password.trim();
    const confirmPassword = credentials.confirmPassword.trim();
    const validationError = this.validateAccountInput(email, password, confirmPassword);

    if (validationError) {
      throw new Error(validationError);
    }

    if (this.accounts.some((account) => account.email === email)) {
      throw new Error('An account already exists for this email.');
    }

    const account: StoredAccount = {
      email,
      password,
      role: 'user',
    };

    this.accounts = [account, ...this.accounts];

    return {
      email: account.email,
      role: account.role,
    };
  }

  createDeveloper(
    credentials: CreateDeveloperCredentials,
    currentUser: DashboardUser | undefined,
  ): DashboardUser {
    if (currentUser?.role !== 'admin') {
      throw new Error('Only admins can add developers.');
    }

    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password.trim();
    const validationError = this.validateAccountInput(email, password, password);

    if (validationError) {
      throw new Error(validationError);
    }

    if (this.accounts.some((account) => account.email === email)) {
      throw new Error('An account already exists for this email.');
    }

    const account: StoredAccount = {
      email,
      password,
      role: 'developer',
    };

    this.accounts = [account, ...this.accounts];

    return {
      email: account.email,
      role: account.role,
    };
  }

  listDevelopers(currentUser: DashboardUser | undefined): DashboardUser[] {
    if (currentUser?.role !== 'admin') {
      throw new Error('Only admins can view developers.');
    }

    return this.accounts
      .filter((account) => account.role === 'developer')
      .map((account) => ({
        email: account.email,
        role: account.role,
      }));
  }

  private validateAccountInput(
    email: string,
    password: string,
    confirmPassword: string,
  ): string {
    if (!email.includes('@')) {
      return 'Use a valid email address.';
    }

    const passwordError = validateDashboardPassword(password);

    if (passwordError) {
      return passwordError;
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return '';
  }
}

export class InMemoryAuthRepository implements AuthRepository {
  constructor(private readonly store = new AuthStore()) {}

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    return attachSessionToken(this.store.login(credentials));
  }

  async refresh(token: string | undefined): Promise<AuthSession> {
    const user = token ? verifySessionToken(token) : undefined;

    if (!user) {
      throw new Error('Sign in is required.');
    }

    const issuedAt = new Date();

    return attachSessionToken({
      user,
      issuedAt: issuedAt.toISOString(),
      expiresAt: getSessionExpiresAt(issuedAt).toISOString(),
    });
  }

  async logout(_token: string | undefined): Promise<void> {
    return Promise.resolve();
  }

  async register(credentials: RegisterCredentials): Promise<DashboardUser> {
    return this.store.register(credentials);
  }

  async createDeveloper(
    credentials: CreateDeveloperCredentials,
    currentUser: DashboardUser | undefined,
  ): Promise<DashboardUser> {
    return this.store.createDeveloper(credentials, currentUser);
  }

  async listDevelopers(currentUser: DashboardUser | undefined): Promise<DashboardUser[]> {
    return this.store.listDevelopers(currentUser);
  }
}

export const authStore = new AuthStore();
