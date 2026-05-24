export interface LoginCredentials {
  email: string;
  password: string;
}

export type DashboardRole = 'user' | 'developer' | 'admin';

export interface DashboardUser {
  email: string;
  role: DashboardRole;
}

export interface AuthSession {
  user: DashboardUser;
  issuedAt: string;
  expiresAt: string;
  token?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateDeveloperCredentials {
  email: string;
  password: string;
}

export interface StoredAccount {
  email: string;
  password: string;
  role: DashboardRole;
}
