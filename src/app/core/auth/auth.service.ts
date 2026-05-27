import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Observable, catchError, delay, map, of, tap } from 'rxjs';
import { ApiDataResponse } from '../api/api-response.models';
import {
  AuthResult,
  AuthSession,
  CreateDeveloperCredentials,
  DashboardUser,
  LoginCredentials,
  RegisterCredentials,
  StoredAccount,
} from './auth.models';
import {
  getDashboardPasswordPolicyMessage,
  validateDashboardPassword,
} from './password-policy';

const SESSION_STORAGE_KEY = 'vensight.dashboard.session';
const ACCOUNTS_STORAGE_KEY = 'vensight.dashboard.accounts';
const LEGACY_SEEDED_ADMIN_EMAIL = 'imarkovychi@gmail.com';
const LOCAL_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const ACTIVE_HOSTED_FRONTEND_HOSTS = new Set(['vensight-phi.vercel.app']);

export function isHostedFrontendHostname(hostname: string): boolean {
  const normalizedHostname = hostname.trim().toLowerCase();

  return (
    ACTIVE_HOSTED_FRONTEND_HOSTS.has(normalizedHostname) ||
    normalizedHostname.endsWith('.vercel.app')
  );
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly accountsState = signal<StoredAccount[]>(this.restoreAccounts());
  private readonly sessionState = signal<AuthSession | null>(this.restoreSession());

  readonly currentUser = computed(() => this.sessionState()?.user ?? null);
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly canUseContributorTools = computed(() => this.sessionState() !== null);
  readonly canManageListings = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'developer';
  });
  readonly canManageDevelopers = computed(() => this.currentUser()?.role === 'admin');

  constructor() {
    this.refreshPersistedSession();
  }

  login(credentials: LoginCredentials): Observable<AuthResult> {
    if (!this.isBrowser) {
      return this.loginLocally(credentials);
    }

    return this.http.post<ApiDataResponse<AuthSession>>('/api/auth/login', credentials, {
      withCredentials: true,
    }).pipe(
      tap((response) => {
        this.sessionState.set(response.data);
        this.persistSession(response.data);
      }),
      map(() => ({ success: true })),
      catchError((error: HttpErrorResponse) =>
        error.status === 0 && !this.isHostedFrontend()
          ? this.loginLocally(credentials)
          : of({ success: false, error: this.getApiError(error, 'Sign in failed.') }),
      ),
      delay(250),
    );
  }

  register(credentials: RegisterCredentials): Observable<AuthResult> {
    if (!this.isBrowser) {
      return this.registerLocally(credentials);
    }

    return this.http.post<ApiDataResponse<DashboardUser>>('/api/auth/register', credentials, {
      withCredentials: true,
    }).pipe(
      map(() => ({ success: true })),
      catchError((error: HttpErrorResponse) =>
        error.status === 0 && !this.isHostedFrontend()
          ? this.registerLocally(credentials)
          : of({ success: false, error: this.getApiError(error, 'Registration failed.') }),
      ),
      delay(250),
    );
  }

  createDeveloper(credentials: CreateDeveloperCredentials): Observable<AuthResult> {
    if (!this.canManageDevelopers()) {
      return of({
        success: false,
        error: 'Only admins can add developers.',
      }).pipe(delay(250));
    }

    if (!this.isBrowser) {
      return this.createDeveloperLocally(credentials);
    }

    return this.http
      .post<ApiDataResponse<DashboardUser>>('/api/auth/developers', credentials, {
        headers: this.createApiAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        map(() => ({ success: true })),
        catchError((error: HttpErrorResponse) =>
          error.status === 0 && !this.isHostedFrontend()
            ? this.createDeveloperLocally(credentials)
            : of({
                success: false,
                error: this.getApiError(error, 'Developer could not be added.'),
              }),
        ),
        delay(250),
      );
  }

  getDeveloperAccounts(): Observable<DashboardUser[]> {
    if (!this.isBrowser || !this.canManageDevelopers()) {
      return this.getDeveloperAccountsLocally();
    }

    return this.http
      .get<ApiDataResponse<DashboardUser[]>>('/api/auth/developers', {
        headers: this.createApiAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) =>
          error.status === 0 && !this.isHostedFrontend()
            ? this.getDeveloperAccountsLocally()
            : of([]),
        ),
        delay(120),
      );
  }

  logout(): void {
    const headers = this.createApiAuthHeaders();

    if (this.isBrowser) {
      this.http.post('/api/auth/logout', {}, { headers, withCredentials: true }).subscribe({
        error: () => undefined,
      });
    }

    this.sessionState.set(null);

    if (this.isBrowser) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  private loginLocally(credentials: LoginCredentials): Observable<AuthResult> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password.trim();

    if (!email.includes('@') || validateDashboardPassword(password)) {
      return of({
        success: false,
        error: `Use any valid email. ${getDashboardPasswordPolicyMessage()}`,
      }).pipe(delay(250));
    }

    const account = this.accountsState().find((candidate) => candidate.email === email);

    if (!account || account.password !== password) {
      return of({
        success: false,
        error: 'No matching account was found for that email and password.',
      }).pipe(delay(250));
    }

    const issuedAt = new Date();

    const session: AuthSession = {
      user: {
        email: account.email,
        role: account.role,
      },
      issuedAt: issuedAt.toISOString(),
      expiresAt: this.getLocalExpiresAt(issuedAt).toISOString(),
    };

    return of({ success: true }).pipe(
      delay(250),
      tap(() => {
        this.sessionState.set(session);
        this.persistSession(session);
      }),
    );
  }

  private registerLocally(credentials: RegisterCredentials): Observable<AuthResult> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password.trim();
    const confirmPassword = credentials.confirmPassword.trim();
    const validationError = this.validateAccountInput(email, password, confirmPassword);

    if (validationError) {
      return of({ success: false, error: validationError }).pipe(delay(250));
    }

    if (this.accountsState().some((account) => account.email === email)) {
      return of({ success: false, error: 'An account already exists for this email.' }).pipe(
        delay(250),
      );
    }

    const account: StoredAccount = {
      email,
      password,
      role: 'user',
    };

    return of({ success: true }).pipe(
      delay(250),
      tap(() => this.saveAccounts([account, ...this.accountsState()])),
    );
  }

  private createDeveloperLocally(
    credentials: CreateDeveloperCredentials,
  ): Observable<AuthResult> {
    if (!this.canManageDevelopers()) {
      return of({
        success: false,
        error: 'Only admins can add developers.',
      }).pipe(delay(250));
    }

    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password.trim();
    const validationError = this.validateAccountInput(email, password, password);

    if (validationError) {
      return of({ success: false, error: validationError }).pipe(delay(250));
    }

    if (this.accountsState().some((account) => account.email === email)) {
      return of({ success: false, error: 'An account already exists for this email.' }).pipe(
        delay(250),
      );
    }

    const account: StoredAccount = {
      email,
      password,
      role: 'developer',
    };

    return of({ success: true }).pipe(
      delay(250),
      tap(() => this.saveAccounts([account, ...this.accountsState()])),
    );
  }

  private getDeveloperAccountsLocally(): Observable<DashboardUser[]> {
    return of(
      this.accountsState()
        .filter((account) => account.role === 'developer')
        .map((account) => ({ email: account.email, role: account.role })),
    ).pipe(delay(120));
  }

  private persistSession(session: AuthSession): void {
    if (!this.isBrowser) {
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.createStoredSession(session)));
  }

  private restoreSession(): AuthSession | null {
    if (!this.isBrowser) {
      return null;
    }

    const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (!storedSession) {
      return null;
    }

    try {
      const session = JSON.parse(storedSession) as AuthSession;
      if (!session.user?.email || !session.user?.role || this.isExpiredSession(session)) {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }

      const restoredSession = this.createStoredSession(session);

      return session.token ? { ...restoredSession, token: session.token } : restoredSession;
    } catch {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  private restoreAccounts(): StoredAccount[] {
    if (!this.isBrowser) {
      return [];
    }

    const storedAccounts = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);

    if (!storedAccounts) {
      return [];
    }

    try {
      return this.sanitizeStoredAccounts(JSON.parse(storedAccounts) as StoredAccount[]);
    } catch {
      return [];
    }
  }

  private sanitizeStoredAccounts(accounts: StoredAccount[]): StoredAccount[] {
    const sanitizedAccounts = accounts.filter(
      (account) => account.email !== LEGACY_SEEDED_ADMIN_EMAIL,
    );

    if (sanitizedAccounts.length !== accounts.length) {
      this.persistAccounts(sanitizedAccounts);
    }

    return sanitizedAccounts;
  }

  private saveAccounts(accounts: StoredAccount[]): void {
    this.accountsState.set(accounts);
    this.persistAccounts(accounts);
  }

  private persistAccounts(accounts: StoredAccount[]): void {
    if (this.isBrowser) {
      window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    }
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

  createApiAuthHeaders(): HttpHeaders {
    const session = this.sessionState();
    const token = session?.token;

    if (token) {
      return new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
    }

    return new HttpHeaders();
  }

  private refreshPersistedSession(): void {
    if (!this.isBrowser) {
      return;
    }

    const session = this.sessionState();

    if (!session) {
      return;
    }

    this.http
      .post<ApiDataResponse<AuthSession>>('/api/auth/refresh', {}, {
        headers: this.createApiAuthHeaders(),
        withCredentials: true,
      })
      .subscribe({
        next: (response) => {
          this.sessionState.set(response.data);
          this.persistSession(response.data);
        },
        error: () => {
          this.sessionState.set(null);
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
        },
      });
  }

  private isExpiredSession(session: AuthSession): boolean {
    if (!session.expiresAt) {
      return !session.token;
    }

    return new Date(session.expiresAt).getTime() <= Date.now();
  }

  private createStoredSession(session: AuthSession): AuthSession {
    return {
      user: session.user,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
    };
  }

  private getLocalExpiresAt(issuedAt: Date): Date {
    return new Date(issuedAt.getTime() + LOCAL_SESSION_TTL_MS);
  }

  private getApiError(error: HttpErrorResponse, fallback: string): string {
    if (error.status === 0) {
      return 'The production API is unavailable. Confirm the Northflank backend is running and Vercel is rewriting /api requests to it.';
    }

    if (error.status === 404 && error.url?.includes('/api/')) {
      return 'The API route is not connected yet. Replace the Vercel rewrite placeholder with the Northflank backend URL.';
    }

    // API providers can return strings, objects, or nested errors; keep UI copy readable.
    return this.readErrorMessage(error.error) ?? error.message ?? fallback;
  }

  private readErrorMessage(value: unknown): string | undefined {
    if (typeof value === 'string') {
      return value.trim() || undefined;
    }

    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    const candidate =
      this.readErrorMessage(record['error']) ??
      this.readErrorMessage(record['message']) ??
      this.readErrorMessage(record['detail']);

    if (candidate) {
      return candidate;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return undefined;
    }
  }

  private isHostedFrontend(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    // Hosted frontends must use Northflank for auth instead of local browser accounts.
    return isHostedFrontendHostname(window.location.hostname);
  }
}
