import express from 'express';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardRole } from '../app/core/auth/auth.models';
import { AiAnalysisResult, AiProviderCheckResult } from './ai/ai-analysis.types';

const originalDatabaseUrl = process.env['DATABASE_URL'];
const originalAiProvider = process.env['AI_PROVIDER'];
const originalOpenRouterApiKey = process.env['OPENROUTER_API_KEY'];
const originalSessionSecret = process.env['SESSION_SECRET'];

describe('API AI provider check route', () => {
  let server: Server | undefined;

  afterEach(async () => {
    await closeServer(server);
    server = undefined;
    restoreEnvironment();
    vi.resetModules();
  });

  it('keeps public health output minimal', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;

    const response = await fetch(`${harness.baseUrl}/api/health`);
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body['status']).toBe('ok');
    expect(body['service']).toBe('vensight-api');
    expect(typeof body['checkedAt']).toBe('string');
    expect(body).not.toHaveProperty('runtime');
    expect(body).not.toHaveProperty('ai');
    expect(body).not.toHaveProperty('directory');
    expect(body).not.toHaveProperty('auth');
    expect(body).not.toHaveProperty('aiCache');
  });

  it('rejects unauthenticated requests', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;

    const response = await fetch(`${harness.baseUrl}/api/ai/provider-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'route-provider-check.example' }),
    });
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(403);
    expect(body.error).toBe('Sign in is required.');
  });

  it('rejects dashboard users who cannot manage listings', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;

    const response = await postProviderCheck(harness, 'user', 'route-provider-check.example');
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(403);
    expect(body.error).toBe('Developer or admin access is required.');
  });

  it('returns safe selected-provider metadata for admin users', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;

    const response = await postProviderCheck(harness, 'admin', 'route-provider-check.example');
    const body = (await response.json()) as ProviderCheckResponse;
    const serializedBody = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      success: true,
      provider: 'mock',
      model: 'mock-qwen2.5-7b-profile-generator',
      normalizedUrl: 'https://route-provider-check.example',
      hostname: 'route-provider-check.example',
      fromCache: false,
      source: {
        status: 'extracted',
        safetyStatus: 'https',
      },
      profilePreview: {
        name: 'Route Provider Check',
      },
    });
    expect(body.data).not.toHaveProperty('formData');
    expect(serializedBody).not.toContain('SESSION_SECRET');
    expect(serializedBody).not.toContain('API_KEY');
  });

  it('reports provider errors without creating listings or exposing secrets', async () => {
    const harness = await createApiHarness({
      aiProvider: 'openrouter',
      openRouterApiKey: '',
    });
    server = harness.server;

    const response = await postProviderCheck(harness, 'developer', 'missing-key-route.example');
    const body = (await response.json()) as ProviderCheckResponse & ApiErrorResponse;
    const serializedBody = JSON.stringify(body);

    expect(response.status).toBe(502);
    expect(body.data).toMatchObject({
      success: false,
      provider: 'openrouter',
      model: 'qwen/qwen-2.5-7b-instruct:free',
      normalizedUrl: 'https://missing-key-route.example',
      hostname: 'missing-key-route.example',
      fromCache: false,
      error: 'OPENROUTER_API_KEY is required for openrouter analysis.',
    });
    expect(body.error).toBe('OPENROUTER_API_KEY is required for openrouter analysis.');
    expect(body.data).not.toHaveProperty('profilePreview');
    expect(serializedBody).not.toContain('sk-');
  });

  it('returns a safe-link warning for plain HTTP URLs', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;

    const response = await postProviderCheck(harness, 'admin', 'http://route-provider-check.example');
    const body = (await response.json()) as ProviderCheckResponse & ApiErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error).toBe('Use an HTTPS URL so Vensight can analyze the page safely.');
    expect(body.data).toMatchObject({
      success: false,
      normalizedUrl: 'http://route-provider-check.example',
      source: {
        safetyStatus: 'http-warning',
      },
    });
  });

  it('logs out bearer sessions idempotently', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;
    const token = harness.signSessionToken({
      email: 'admin@vensight.test',
      role: 'admin',
    });

    const response = await fetch(`${harness.baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = (await response.json()) as { data?: { success?: boolean } };

    expect(response.status).toBe(200);
    expect(body.data?.success).toBe(true);
  });

  it('refreshes valid bearer sessions without exposing secrets', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;
    const token = harness.signSessionToken({
      email: 'admin@vensight.test',
      role: 'admin',
    });

    const response = await fetch(`${harness.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = (await response.json()) as AuthSessionResponse;
    const serializedBody = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.data.user).toEqual({
      email: 'admin@vensight.test',
      role: 'admin',
    });
    expect(body.data.token).toBeUndefined();
    expect(typeof body.data.expiresAt).toBe('string');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=Lax');
    expect(new Date(body.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(serializedBody).not.toContain('SESSION_SECRET');
  });

  it('rejects expired bearer session refreshes', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;
    const token = harness.signSessionToken(
      {
        email: 'admin@vensight.test',
        role: 'admin',
      },
      '2020-01-01T00:00:00.000Z',
    );

    const response = await fetch(`${harness.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(403);
    expect(body.error).toBe('Sign in is required.');
  });

  it('rejects unauthenticated discovery searches', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;

    const response = await fetch(`${harness.baseUrl}/api/discovery/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'biotech companies' }),
    });
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(403);
    expect(body.error).toBe('Sign in is required.');
  });

  it('lets registered users run one discovery search per day', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;

    const response = await postDiscoverySearch(harness, 'user', 'biotech companies');
    const body = (await response.json()) as DiscoverySearchApiResponse;

    expect(response.status).toBe(200);
    expect(body.data.results[0]).toMatchObject({
      url: 'https://candidate.example.com',
      provider: 'searchapi',
    });

    const secondResponse = await postDiscoverySearch(harness, 'user', 'fintech companies');
    const secondBody = (await secondResponse.json()) as ApiErrorResponse;

    expect(secondResponse.status).toBe(429);
    expect(secondBody.error).toBe('Registered accounts can run one discovery search per day.');
  });

  it('lets registered users run one AI URL analysis per day', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;

    const response = await postAiAnalyze(harness, 'user', 'daily-analysis.example');
    const body = (await response.json()) as { data: AiAnalysisResult };

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      url: 'https://daily-analysis.example',
      provider: 'mock',
    });

    const secondResponse = await postAiAnalyze(harness, 'user', 'second-analysis.example');
    const secondBody = (await secondResponse.json()) as ApiErrorResponse;

    expect(secondResponse.status).toBe(429);
    expect(secondBody.error).toBe('Registered accounts can run one AI URL analysis per day.');
  });

  it('lets developers search and save discovery candidates without creating listings', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;

    const searchResponse = await postDiscoverySearch(harness, 'developer', 'biotech companies');
    const searchBody = (await searchResponse.json()) as DiscoverySearchApiResponse;

    expect(searchResponse.status).toBe(200);
    expect(searchBody.data.results[0]).toMatchObject({
      url: 'https://candidate.example.com',
      provider: 'searchapi',
    });

    const candidateResponse = await postDiscoveryCandidate(
      harness,
      'developer',
      searchBody.data.results[0],
    );
    const candidateBody = (await candidateResponse.json()) as DiscoveryCandidateApiResponse;

    expect(candidateResponse.status).toBe(201);
    expect(candidateBody.data).toMatchObject({
      url: 'https://candidate.example.com',
      status: 'new',
    });

    const companyResponse = await fetch(`${harness.baseUrl}/api/companies/candidate`);

    expect(companyResponse.status).toBe(404);
  });

  it('updates discovery candidate review status', async () => {
    const harness = await createApiHarness({ aiProvider: 'mock' });
    server = harness.server;
    const searchResponse = await postDiscoverySearch(harness, 'admin', 'fintech companies');
    const searchBody = (await searchResponse.json()) as DiscoverySearchApiResponse;
    const candidateResponse = await postDiscoveryCandidate(
      harness,
      'admin',
      searchBody.data.results[0],
    );
    const candidateBody = (await candidateResponse.json()) as DiscoveryCandidateApiResponse;

    const updateResponse = await patchDiscoveryCandidate(
      harness,
      'admin',
      candidateBody.data.id,
      'accepted',
    );
    const updateBody = (await updateResponse.json()) as DiscoveryCandidateApiResponse;

    expect(updateResponse.status).toBe(200);
    expect(updateBody.data.status).toBe('accepted');
  });

  it('sanitizes internal API errors in production responses', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const harness = await createApiHarness({
      aiProvider: 'mock',
      searchError: new Error(
        'Invalid `this.prisma.discoveryCandidate.upsert()` invocation: table public.DiscoveryCandidate does not exist.',
      ),
    });
    server = harness.server;
    harness.setProductionErrorModeForTests(true);

    const response = await postDiscoverySearch(harness, 'developer', 'biotech companies');
    const body = (await response.json()) as ApiErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error).toBe('Discovery search failed.');
    expect(body.error).not.toContain('DiscoveryCandidate');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

interface ApiHarness {
  baseUrl: string;
  server: Server;
  signSessionToken: typeof import('./auth/session-token').signSessionToken;
  setProductionErrorModeForTests: typeof import('./api.routes').setProductionErrorModeForTests;
}

interface ApiErrorResponse {
  error?: string;
}

interface ProviderCheckResponse {
  data: Record<string, unknown>;
}

interface DiscoverySearchApiResponse {
      data: {
        results: Array<{
      url: string;
      title: string;
      snippet: string;
      provider: 'searchapi' | 'tavily';
      query: string;
    }>;
  };
}

interface DiscoveryCandidateApiResponse {
  data: {
    id: string;
    url: string;
    status: string;
  };
}

interface AuthSessionResponse {
  data: {
    user: {
      email: string;
      role: DashboardRole;
    };
    issuedAt: string;
    expiresAt: string;
    token?: string;
  };
}

async function createApiHarness(options: {
  aiProvider: 'mock' | 'openrouter';
  openRouterApiKey?: string;
  searchError?: Error;
}): Promise<ApiHarness> {
  vi.resetModules();
  process.env['DATABASE_URL'] = '';
  process.env['SESSION_SECRET'] = 'test-session-secret';
  process.env['AI_PROVIDER'] = options.aiProvider;
  process.env['OPENROUTER_API_KEY'] = options.openRouterApiKey ?? '';
  const [
    {
      apiRouter,
      setApiAiAnalysisServiceForTests,
      setProductionErrorModeForTests,
      setSearchDiscoveryServiceForTests,
    },
    { signSessionToken },
  ] = await Promise.all([import('./api.routes'), import('./auth/session-token')]);
  setApiAiAnalysisServiceForTests(createFakeAiAnalysisService(options));
  setSearchDiscoveryServiceForTests(createFakeSearchDiscoveryService(options.searchError));
  const app = express();

  app.use(express.json());
  app.use('/api', apiRouter);

  const server = await listen(app);
  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    server,
    signSessionToken,
    setProductionErrorModeForTests,
  };
}

async function postDiscoverySearch(
  harness: ApiHarness,
  role: DashboardRole,
  query: string,
): Promise<Response> {
  const token = harness.signSessionToken({
    email: `${role}@vensight.test`,
    role,
  });

  return fetch(`${harness.baseUrl}/api/discovery/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
}

async function postAiAnalyze(
  harness: ApiHarness,
  role: DashboardRole,
  url: string,
): Promise<Response> {
  const token = harness.signSessionToken({
    email: `${role}@vensight.test`,
    role,
  });

  return fetch(`${harness.baseUrl}/api/ai/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
}

async function postDiscoveryCandidate(
  harness: ApiHarness,
  role: DashboardRole,
  candidate: DiscoverySearchApiResponse['data']['results'][number],
): Promise<Response> {
  const token = harness.signSessionToken({
    email: `${role}@vensight.test`,
    role,
  });

  return fetch(`${harness.baseUrl}/api/discovery/candidates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(candidate),
  });
}

async function patchDiscoveryCandidate(
  harness: ApiHarness,
  role: DashboardRole,
  id: string,
  status: string,
): Promise<Response> {
  const token = harness.signSessionToken({
    email: `${role}@vensight.test`,
    role,
  });

  return fetch(`${harness.baseUrl}/api/discovery/candidates/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
}

function createFakeSearchDiscoveryService(error?: Error) {
  return {
    getProviderStatus: () => ({
      searchapi: { configured: true },
      tavily: { configured: false },
    }),
    search: async (request: { query: string }) => {
      if (error) {
        throw error;
      }

      return [
        {
          url: 'https://candidate.example.com',
          title: 'Candidate',
          snippet: 'Candidate search result.',
          provider: 'searchapi' as const,
          query: request.query,
          displayUrl: 'candidate.example.com',
        },
      ];
    },
  };
}

function createFakeAiAnalysisService(options: {
  aiProvider: 'mock' | 'openrouter';
  openRouterApiKey?: string;
}) {
  return {
    getProviderConfig: () => ({
      provider: options.aiProvider,
      model:
        options.aiProvider === 'mock'
          ? 'mock-qwen2.5-7b-profile-generator'
          : 'qwen/qwen-2.5-7b-instruct:free',
      confidence: options.aiProvider === 'mock' ? 0.85 : 0.83,
    }),
    getRecentAnalyses: async () => [],
    analyzeUrl: async (url: string) => {
      const normalizedUrl = url.startsWith('https://') ? url : `https://${url}`;
      const hostname = new URL(normalizedUrl).hostname;

      return {
        url: normalizedUrl,
        hostname,
        formData: {
          name: titleCase(hostname.split('.')[0]?.replace(/-/g, ' ') ?? 'Example'),
          website: normalizedUrl,
          categorySlug: 'ai-tools',
          tags: ['AI analysis'],
          description: 'Generated route analysis.',
          aiSummary: 'Generated route analysis summary.',
          seoDescription: 'Generated route analysis SEO description.',
        },
        createdAt: '2026-05-26T00:00:00.000Z',
        fromCache: false,
        provider: 'mock',
        model: 'mock-qwen2.5-7b-profile-generator',
        confidence: 0.85,
      } satisfies AiAnalysisResult;
    },
    checkSelectedProvider: async (url: string) => {
      if (url.startsWith('http://')) {
        return {
          success: false,
          provider: options.aiProvider,
          model: 'mock-qwen2.5-7b-profile-generator',
          normalizedUrl: url,
          durationMs: 1,
          fromCache: false,
          source: {
            contentAware: true,
            status: 'unavailable',
            safetyStatus: 'http-warning',
            url,
            headings: [],
            textSnippets: [],
            schemaTypes: [],
            schemaSummaries: [],
            reviewSignals: [],
            extractedCharacters: 0,
            warnings: ['Use an HTTPS URL so Vensight can analyze the page safely.'],
          },
          error: 'Use an HTTPS URL so Vensight can analyze the page safely.',
        } satisfies AiProviderCheckResult;
      }

      const normalizedUrl = url.startsWith('https://') ? url : `https://${url}`;
      const hostname = new URL(normalizedUrl).hostname;

      if (options.aiProvider === 'openrouter' && !options.openRouterApiKey) {
        return {
          success: false,
          provider: 'openrouter',
          model: 'qwen/qwen-2.5-7b-instruct:free',
          normalizedUrl,
          hostname,
          durationMs: 1,
          fromCache: false,
          error: 'OPENROUTER_API_KEY is required for openrouter analysis.',
        } satisfies AiProviderCheckResult;
      }

      return {
        success: true,
        provider: 'mock',
        model: 'mock-qwen2.5-7b-profile-generator',
        normalizedUrl,
        hostname,
        durationMs: 1,
        fromCache: false,
        confidence: 0.85,
        createdAt: '2026-05-24T00:00:00.000Z',
        source: {
          contentAware: true,
          status: 'extracted',
          safetyStatus: 'https',
          url: normalizedUrl,
          title: titleCase(hostname.split('.')[0]?.replace(/-/g, ' ') ?? ''),
          metaDescription: 'Route provider check page content.',
          headings: ['Route provider check'],
          textSnippets: ['Route provider check page content for AI analysis.'],
          schemaTypes: ['Organization'],
          schemaSummaries: ['type=Organization; name=Route Provider Check'],
          reviewSignals: [],
          extractedCharacters: 51,
          warnings: [],
        },
        profilePreview: {
          name: 'Route Provider Check',
          description: 'Route provider check page content.',
          categorySlug: 'ai-tools',
          tags: ['AI analysis'],
          aiSummary: 'Route provider check page content for AI analysis.',
          seoDescription: 'Explore Route Provider Check on Vensight.',
        },
      } satisfies AiProviderCheckResult;
    },
  };
}

async function postProviderCheck(
  harness: ApiHarness,
  role: DashboardRole,
  url: string,
): Promise<Response> {
  const token = harness.signSessionToken({
    email: `${role}@vensight.test`,
    role,
  });

  return fetch(`${harness.baseUrl}/api/ai/provider-check`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
}

function listen(app: express.Express): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => resolve(server));

    server.once('error', reject);
  });
}

function closeServer(server: Server | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server?.listening) {
      resolve();
      return;
    }

    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function restoreEnvironment(): void {
  restoreEnvValue('DATABASE_URL', originalDatabaseUrl);
  restoreEnvValue('AI_PROVIDER', originalAiProvider);
  restoreEnvValue('OPENROUTER_API_KEY', originalOpenRouterApiKey);
  restoreEnvValue('SESSION_SECRET', originalSessionSecret);
}

function restoreEnvValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function titleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
