import {
  AuthSession,
  CreateDeveloperCredentials,
  DashboardUser,
  LoginCredentials,
  RegisterCredentials,
} from '../../app/core/auth/auth.models';

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  refresh(token: string | undefined): Promise<AuthSession>;
  logout(token: string | undefined): Promise<void>;
  register(credentials: RegisterCredentials): Promise<DashboardUser>;
  createDeveloper(
    credentials: CreateDeveloperCredentials,
    currentUser: DashboardUser | undefined,
  ): Promise<DashboardUser>;
  listDevelopers(currentUser: DashboardUser | undefined): Promise<DashboardUser[]>;
}
