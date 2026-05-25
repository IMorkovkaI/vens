import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    window.localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: PLATFORM_ID,
          useValue: 'server',
        },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should reject invalid mock credentials', async () => {
    const result = await firstValueFrom(
      service.login({
        email: 'admin',
        password: 'short',
      }),
    );

    expect(result.success).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should create and clear a mock dashboard session', async () => {
    await firstValueFrom(
      service.register({
        email: 'viewer@vensight.local',
        password: 'StrongUserPass2026',
        confirmPassword: 'StrongUserPass2026',
      }),
    );

    const result = await firstValueFrom(
      service.login({
        email: 'VIEWER@Vensight.LOCAL',
        password: 'StrongUserPass2026',
      }),
    );

    expect(result.success).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('viewer@vensight.local');
    expect(service.currentUser()?.role).toBe('user');
    expect(service.canManageListings()).toBe(false);
    expect(service.canManageDevelopers()).toBe(false);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should keep user role read-only', async () => {
    await firstValueFrom(
      service.register({
        email: 'viewer@vensight.local',
        password: 'StrongUserPass2026',
        confirmPassword: 'StrongUserPass2026',
      }),
    );

    const result = await firstValueFrom(
      service.login({
        email: 'viewer@vensight.local',
        password: 'StrongUserPass2026',
      }),
    );

    expect(result.success).toBe(true);
    expect(service.currentUser()?.role).toBe('user');
    expect(service.canManageListings()).toBe(false);
    expect(service.canManageDevelopers()).toBe(false);
  });

  it('should reject local developer creation for non-admin accounts', async () => {
    const result = await firstValueFrom(
      service.createDeveloper({
        email: 'dev@vensight.local',
        password: 'StrongDevPass2026',
      }),
    );
    const developers = await firstValueFrom(service.getDeveloperAccounts());

    expect(result.success).toBe(false);
    expect(developers).toEqual([]);
  });

  it('should discard expired browser sessions during restore', () => {
    TestBed.resetTestingModule();
    window.localStorage.setItem(
      'vensight.dashboard.session',
      JSON.stringify({
        user: {
          email: 'viewer@vensight.local',
          role: 'user',
        },
        issuedAt: '2020-01-01T00:00:00.000Z',
        expiresAt: '2020-01-08T00:00:00.000Z',
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PLATFORM_ID,
          useValue: 'browser',
        },
      ],
    });

    const browserService = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    expect(browserService.isAuthenticated()).toBe(false);
    expect(window.localStorage.getItem('vensight.dashboard.session')).toBeNull();
    httpMock.verify();
  });

  it('should refresh persisted browser API sessions on startup', () => {
    TestBed.resetTestingModule();
    window.localStorage.setItem(
      'vensight.dashboard.session',
      JSON.stringify({
        user: {
          email: 'admin@vensight.local',
          role: 'admin',
        },
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        token: 'old-token',
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PLATFORM_ID,
          useValue: 'browser',
        },
      ],
    });

    const browserService = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);
    const request = httpMock.expectOne('/api/auth/refresh');

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer old-token');
    request.flush({
      data: {
        user: {
          email: 'admin@vensight.local',
          role: 'admin',
        },
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        token: 'new-token',
      },
    });

    expect(browserService.isAuthenticated()).toBe(true);
    expect(browserService.createApiAuthHeaders().get('Authorization')).toBe(
      'Bearer new-token',
    );
    httpMock.verify();
  });

  it('should normalize object-shaped browser API login errors', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PLATFORM_ID,
          useValue: 'browser',
        },
      ],
    });

    const browserService = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);
    const resultPromise = firstValueFrom(
      browserService.login({
        email: 'admin@vensight.local',
        password: 'StrongAdminPass2026',
      }),
    );
    const request = httpMock.expectOne('/api/auth/login');

    request.flush(
      {
        error: {
          message: 'Invalid email or password.',
        },
      },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    const result = await resultPromise;

    expect(result).toEqual({
      success: false,
      error: 'Invalid email or password.',
    });
    httpMock.verify();
  });
});
