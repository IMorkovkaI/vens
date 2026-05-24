import './environment/load-env';
import { Request, Response, Router } from 'express';
import { ApiAiAnalysisService, apiAiAnalysisService } from './ai/ai-analysis.service';
import { competitorComparisonService } from './ai/competitor-comparison.service';
import { getAuthRepository } from './auth/auth-repository';
import { readRequestUser } from './auth/auth-request';
import { DashboardRole } from '../app/core/auth/auth.models';
import { getBackendRuntimeStatus } from './environment/backend-config';
import { getDirectoryRepository } from './directory/directory-repository';
import {
  normalizeStatus,
  validateDiscoverySearchRequest,
} from './discovery/discovery-helpers';
import { getDiscoveryRepository } from './discovery/discovery-repository';
import {
  DiscoveryCandidateInput,
  DiscoveryCandidateUpdate,
  SearchProviderId,
} from './discovery/discovery.models';
import {
  SearchDiscoveryService,
  searchDiscoveryService,
} from './discovery/search-provider';

export const apiRouter = Router();

type ApiAiAnalysisServiceContract = Pick<
  ApiAiAnalysisService,
  'analyzeUrl' | 'checkSelectedProvider' | 'getProviderConfig' | 'getRecentAnalyses'
>;
type SearchDiscoveryServiceContract = Pick<
  SearchDiscoveryService,
  'search' | 'getProviderStatus'
>;

let activeAiAnalysisService: ApiAiAnalysisServiceContract = apiAiAnalysisService;
let activeSearchDiscoveryService: SearchDiscoveryServiceContract = searchDiscoveryService;
let productionErrorModeForTests: boolean | undefined;

export function setApiAiAnalysisServiceForTests(
  service: ApiAiAnalysisServiceContract,
): void {
  activeAiAnalysisService = service;
}

export function resetApiAiAnalysisServiceForTests(): void {
  activeAiAnalysisService = apiAiAnalysisService;
}

export function setSearchDiscoveryServiceForTests(
  service: SearchDiscoveryServiceContract,
): void {
  activeSearchDiscoveryService = service;
}

export function resetSearchDiscoveryServiceForTests(): void {
  activeSearchDiscoveryService = searchDiscoveryService;
}

export function setProductionErrorModeForTests(value: boolean): void {
  productionErrorModeForTests = value;
}

export function resetProductionErrorModeForTests(): void {
  productionErrorModeForTests = undefined;
}

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'vensight-api',
    checkedAt: new Date().toISOString(),
  });
});

apiRouter.get('/config/runtime', async (req, res) => {
  const authorizationError = await authorizeDashboardRole(req, ['admin']);

  if (authorizationError) {
    res.status(403).json({
      error: authorizationError,
    });
    return;
  }

  res.json({
    data: getBackendRuntimeStatus(),
  });
});

apiRouter.post('/ai/analyze', async (req, res) => {
  const authorizationError = await authorizeDashboardRole(req, ['admin', 'developer']);

  if (authorizationError) {
    res.status(403).json({
      error: authorizationError,
    });
    return;
  }

  try {
    const result = await activeAiAnalysisService.analyzeUrl(String(req.body?.url ?? ''));

    res.json({
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed.';
    const statusCode = isUrlValidationError(message) ? 400 : 500;

    res.status(statusCode).json({
      ...createErrorResponse(res, error, statusCode, 'Analysis failed.'),
    });
  }
});

apiRouter.post('/ai/provider-check', async (req, res) => {
  const authorizationError = await authorizeDashboardRole(req, ['admin', 'developer']);

  if (authorizationError) {
    res.status(403).json({
      error: authorizationError,
    });
    return;
  }

  const result = await activeAiAnalysisService.checkSelectedProvider(String(req.body?.url ?? ''));

  if (result.success) {
    res.json({
      data: result,
    });
    return;
  }

  res.status(getProviderCheckStatusCode(result)).json({
    data: result,
    error: result.error,
  });
});

apiRouter.get('/ai/analyses', async (req, res) => {
  const authorizationError = await authorizeDashboardRole(req, ['admin', 'developer']);

  if (authorizationError) {
    res.status(403).json({
      error: authorizationError,
    });
    return;
  }

  try {
    const limit = parsePositiveInteger(req.query['limit'], 10);
    const data = await activeAiAnalysisService.getRecentAnalyses(limit);

    res.json({ data });
  } catch (error) {
    respondWithApiError(res, error, 500, 'Recent analyses could not be loaded.');
  }
});

apiRouter.post('/discovery/search', async (req, res) => {
  const user = await readRequestUser(req);
  const authorizationError = authorizeDashboardUser(user, ['admin', 'developer']);

  if (authorizationError) {
    res.status(403).json({
      error: authorizationError,
    });
    return;
  }

  try {
    const request = validateDiscoverySearchRequest(req.body);
    const results = await activeSearchDiscoveryService.search(request);

    res.json({
      data: {
        results,
        providers: activeSearchDiscoveryService.getProviderStatus(),
      },
    });
  } catch (error) {
    respondWithApiError(res, error, 400, 'Discovery search failed.');
  }
});

apiRouter.get('/discovery/candidates', async (req, res) => {
  const user = await readRequestUser(req);
  const authorizationError = authorizeDashboardUser(user, ['admin', 'developer']);

  if (authorizationError) {
    res.status(403).json({
      error: authorizationError,
    });
    return;
  }

  try {
    const candidates = await getDiscoveryRepository().listCandidates();

    res.json({
      data: candidates,
    });
  } catch (error) {
    respondWithApiError(res, error, 500, 'Discovery candidates could not be loaded.');
  }
});

apiRouter.post('/discovery/candidates', async (req, res) => {
  const user = await readRequestUser(req);
  const authorizationError = authorizeDashboardUser(user, ['admin', 'developer']);

  if (authorizationError) {
    res.status(403).json({
      error: authorizationError,
    });
    return;
  }

  try {
    const candidate = await getDiscoveryRepository().saveCandidate(
      validateDiscoveryCandidateInput(req.body),
      user,
    );

    res.status(201).json({
      data: candidate,
    });
  } catch (error) {
    respondWithApiError(res, error, 400, 'Discovery candidate could not be saved.');
  }
});

apiRouter.patch('/discovery/candidates/:id', async (req, res) => {
  const user = await readRequestUser(req);
  const authorizationError = authorizeDashboardUser(user, ['admin', 'developer']);

  if (authorizationError) {
    res.status(403).json({
      error: authorizationError,
    });
    return;
  }

  try {
    const candidate = await getDiscoveryRepository().updateCandidate(
      req.params['id'],
      validateDiscoveryCandidateUpdate(req.body),
      user,
    );

    if (!candidate) {
      res.status(404).json({
        error: 'Discovery candidate not found.',
      });
      return;
    }

    res.json({
      data: candidate,
    });
  } catch (error) {
    respondWithApiError(res, error, 400, 'Discovery candidate could not be updated.');
  }
});

apiRouter.post('/ai/compare', async (req, res) => {
  const leftSlug = String(req.body?.leftSlug ?? '').trim();
  const rightSlug = String(req.body?.rightSlug ?? '').trim();

  if (leftSlug === rightSlug) {
    res.status(400).json({
      error: 'Choose two different companies to compare.',
    });
    return;
  }

  try {
    const directoryRepository = getDirectoryRepository();
    const [leftCompany, rightCompany] = await Promise.all([
      directoryRepository.findCompanyBySlug(leftSlug),
      directoryRepository.findCompanyBySlug(rightSlug),
    ]);

    if (!leftCompany || !rightCompany) {
      res.status(404).json({
        error: 'Both companies must exist before comparison.',
      });
      return;
    }

    const result = competitorComparisonService.compareCompanies(leftCompany, rightCompany);

    res.json({
      data: result,
    });
  } catch (error) {
    respondWithApiError(res, error, 500, 'Comparison failed.');
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const session = await getAuthRepository().login(req.body);

    res.json({
      data: session,
    });
  } catch (error) {
    respondWithAuthError(res, error);
  }
});

apiRouter.post('/auth/logout', async (req, res) => {
  try {
    await getAuthRepository().logout(readBearerToken(req));

    res.json({
      data: {
        success: true,
      },
    });
  } catch (error) {
    respondWithAuthError(res, error, 400);
  }
});

apiRouter.post('/auth/refresh', async (req, res) => {
  try {
    const session = await getAuthRepository().refresh(readBearerToken(req));

    res.json({
      data: session,
    });
  } catch (error) {
    respondWithAuthError(res, error, 403);
  }
});

apiRouter.post('/auth/register', async (req, res) => {
  try {
    const user = await getAuthRepository().register(req.body);

    res.status(201).json({
      data: user,
    });
  } catch (error) {
    respondWithAuthError(res, error);
  }
});

apiRouter.get('/auth/developers', async (req, res) => {
  try {
    const developers = await getAuthRepository().listDevelopers(await readRequestUser(req));

    res.json({
      data: developers,
    });
  } catch (error) {
    respondWithAuthError(res, error, 403);
  }
});

apiRouter.post('/auth/developers', async (req, res) => {
  try {
    const developer = await getAuthRepository().createDeveloper(
      req.body,
      await readRequestUser(req),
    );

    res.status(201).json({
      data: developer,
    });
  } catch (error) {
    respondWithAuthError(res, error, 403);
  }
});

apiRouter.get('/analytics/directory', async (_req, res) => {
  try {
    const data = await getDirectoryRepository().getDirectoryAnalytics();

    res.json({ data });
  } catch (error) {
    respondWithApiError(res, error);
  }
});

apiRouter.get('/categories', async (_req, res) => {
  try {
    const data = await getDirectoryRepository().listCategories();

    res.json({ data });
  } catch (error) {
    respondWithApiError(res, error);
  }
});

apiRouter.get('/categories/:slug/companies', async (req, res) => {
  try {
    const data = await getDirectoryRepository().listCompaniesByCategory(req.params['slug']);

    res.json({ data });
  } catch (error) {
    respondWithApiError(res, error);
  }
});

apiRouter.get('/companies', async (req, res) => {
  try {
    const data = await getDirectoryRepository().listCompanies({
      query: String(req.query['q'] ?? ''),
      categorySlug: String(req.query['category'] ?? ''),
    });

    res.json({ data });
  } catch (error) {
    respondWithApiError(res, error);
  }
});

apiRouter.post('/companies', async (req, res) => {
  const authorizationError = await authorizeDashboardRole(req, ['admin', 'developer']);

  if (authorizationError) {
    res.status(403).json({
      error: authorizationError,
    });
    return;
  }

  const validationError = validateCompanyFormData(req.body);

  if (validationError) {
    res.status(400).json({
      error: validationError,
    });
    return;
  }

  try {
    const company = await getDirectoryRepository().createCompany(req.body);

    res.status(201).json({
      data: company,
    });
  } catch (error) {
    respondWithApiError(res, error);
  }
});

apiRouter.get('/companies/:slug', async (req, res) => {
  try {
    const company = await getDirectoryRepository().findCompanyBySlug(req.params['slug']);

    if (!company) {
      res.status(404).json({
        error: 'Company not found',
      });
      return;
    }

    res.json({
      data: company,
    });
  } catch (error) {
    respondWithApiError(res, error);
  }
});

apiRouter.patch('/companies/:slug', async (req, res) => {
  const authorizationError = await authorizeDashboardRole(req, ['admin', 'developer']);

  if (authorizationError) {
    res.status(403).json({
      error: authorizationError,
    });
    return;
  }

  const validationError = validateCompanyFormData(req.body);

  if (validationError) {
    res.status(400).json({
      error: validationError,
    });
    return;
  }

  try {
    const company = await getDirectoryRepository().updateCompany(req.params['slug'], req.body);

    if (!company) {
      res.status(404).json({
        error: 'Company not found',
      });
      return;
    }

    res.json({
      data: company,
    });
  } catch (error) {
    respondWithApiError(res, error);
  }
});

function validateCompanyFormData(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return 'Company data is required.';
  }

  const formData = value as Record<string, unknown>;
  const requiredTextFields = [
    'name',
    'description',
    'website',
    'categorySlug',
    'aiSummary',
    'seoDescription',
  ];
  const missingField = requiredTextFields.find(
    (field) => typeof formData[field] !== 'string' || !formData[field].trim(),
  );

  if (missingField) {
    return `${missingField} is required.`;
  }

  if (!isHttpWebsiteUrl(String(formData['website'] ?? ''))) {
    return 'Website must start with http or https.';
  }

  if (!Array.isArray(formData['tags'])) {
    return 'Tags must be an array.';
  }

  return '';
}

function isHttpWebsiteUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value.trim());

    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
  } catch {
    return false;
  }
}

async function authorizeDashboardRole(
  req: Request,
  allowedRoles: DashboardRole[],
): Promise<string> {
  const user = await readRequestUser(req);

  return authorizeDashboardUser(user, allowedRoles);
}

function authorizeDashboardUser(
  user: Awaited<ReturnType<typeof readRequestUser>>,
  allowedRoles: DashboardRole[],
): string {
  if (!user) {
    return 'Sign in is required.';
  }

  if (!allowedRoles.includes(user.role)) {
    return 'Developer or admin access is required.';
  }

  return '';
}

function validateDiscoveryCandidateInput(value: unknown): DiscoveryCandidateInput {
  if (!value || typeof value !== 'object') {
    throw new Error('Discovery candidate data is required.');
  }

  const body = value as Record<string, unknown>;
  const provider = String(body['provider'] ?? '').trim() as SearchProviderId;

  if (provider !== 'searchapi' && provider !== 'tavily') {
    throw new Error('Discovery candidate provider is required.');
  }

  return {
    url: String(body['url'] ?? ''),
    title: String(body['title'] ?? ''),
    snippet: String(body['snippet'] ?? ''),
    provider,
    query: String(body['query'] ?? ''),
    displayUrl: String(body['displayUrl'] ?? '') || undefined,
    status: body['status'] ? normalizeStatus(body['status']) : undefined,
  };
}

function validateDiscoveryCandidateUpdate(value: unknown): DiscoveryCandidateUpdate {
  if (!value || typeof value !== 'object') {
    throw new Error('Discovery candidate update is required.');
  }

  const body = value as Record<string, unknown>;

  return {
    status: normalizeStatus(body['status']),
    analysisUrl: String(body['analysisUrl'] ?? '').trim() || undefined,
  };
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.min(parsedValue, 50);
}

function readBearerToken(req: Request): string | undefined {
  const authorization = req.header('authorization');
  const [scheme, token, extra] = authorization?.split(/\s+/) ?? [];

  if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
    return undefined;
  }

  return token;
}

function getProviderCheckStatusCode(result: {
  error?: string;
  source?: { safetyStatus: string };
}): number {
  if (
    result.source?.safetyStatus === 'http-warning' ||
    result.source?.safetyStatus === 'unsafe' ||
    isUrlValidationError(result.error ?? '')
  ) {
    return 400;
  }

  return 502;
}

function isUrlValidationError(message: string): boolean {
  return [
    'Enter a valid company URL.',
    'Enter a valid HTTPS company URL.',
    'Enter a public HTTPS company URL.',
    'Use an HTTPS URL so Vensight can analyze the page safely.',
  ].includes(message);
}

function respondWithAuthError(
  res: Response,
  error: unknown,
  statusCode = 400,
): void {
  res.status(statusCode).json(
    createErrorResponse(res, error, statusCode, 'Authentication failed.', {
      allowKnownClientErrors: true,
    }),
  );
}

function respondWithApiError(
  res: Response,
  error: unknown,
  statusCode = 500,
  fallbackMessage = 'Directory request failed.',
): void {
  res.status(statusCode).json(createErrorResponse(res, error, statusCode, fallbackMessage));
}

function createErrorResponse(
  res: Response,
  error: unknown,
  statusCode: number,
  fallbackMessage: string,
  options: { allowKnownClientErrors?: boolean } = {},
): { error: string; requestId?: string } {
  const requestId = readRequestId(res);
  const response: { error: string; requestId?: string } = {
    error: getPublicErrorMessage(error, statusCode, fallbackMessage, requestId, options),
  };

  if (requestId && isProductionErrorMode()) {
    response.requestId = requestId;
  }

  return response;
}

function getPublicErrorMessage(
  error: unknown,
  statusCode: number,
  fallbackMessage: string,
  requestId: string,
  options: { allowKnownClientErrors?: boolean } = {},
): string {
  const message = error instanceof Error ? error.message : fallbackMessage;

  if (!isProductionErrorMode()) {
    return message;
  }

  logInternalApiError(error, requestId);

  if (statusCode < 500 && (options.allowKnownClientErrors || isKnownSafeClientError(message))) {
    return message;
  }

  return fallbackMessage;
}

function isKnownSafeClientError(message: string): boolean {
  return (
    isUrlValidationError(message) ||
    [
      'Discovery search query is required.',
      'Discovery candidate data is required.',
      'Discovery candidate provider is required.',
      'Discovery candidate update is required.',
      'Company data is required.',
      'Website must start with http or https.',
      'Tags must be an array.',
    ].includes(message) ||
    / is required\.$/.test(message)
  );
}

function logInternalApiError(error: unknown, requestId = ''): void {
  if (error instanceof Error) {
    console.error('[api-error]', {
      requestId,
      name: error.name,
      message: sanitizeLogMessage(error.message),
    });
    return;
  }

  console.error('[api-error]', {
    requestId,
    message: sanitizeLogMessage(String(error)),
  });
}

function sanitizeLogMessage(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted-database-url]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\b(?:sk|gsk|sk-or-v1)_[A-Za-z0-9_-]+/g, '[redacted-api-key]');
}

function isProductionErrorMode(): boolean {
  return productionErrorModeForTests ?? process.env['NODE_ENV'] === 'production';
}

function readRequestId(res: Response): string {
  return typeof res.locals['requestId'] === 'string' ? res.locals['requestId'] : '';
}
