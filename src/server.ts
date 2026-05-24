import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { apiRouter } from './api/api.routes';
import { verifySessionToken } from './api/auth/session-token';
import { getAllowedOrigins, isApiOnlyMode } from './api/environment/backend-config';
import { buildRateLimitKeys } from './api/security/rate-limit-keys';
import { registerSeoRoutes } from './api/seo/seo-routes';

const browserDistFolder = join(import.meta.dirname, '../browser');
const apiOnly = isApiOnlyMode();

const app = express();
const angularApp = apiOnly ? undefined : new AngularNodeAppEngine();

app.set('trust proxy', getTrustProxySetting());
app.use(assignRequestId);
app.use(applySecurityHeaders);
app.use('/api', applyCorsHeaders);
app.use('/api', express.json({ limit: '64kb' }));
app.use('/api', logApiRequest);
app.use('/api', applyApiRateLimit);
app.use('/api', apiRouter);
registerSeoRoutes(app);

if (apiOnly) {
  app.use((_req, res) => {
    res.status(404).json({
      error: 'This server is running in API-only mode.',
    });
  });
}

/**
 * Serve static files from /browser
 */
if (!apiOnly) {
  app.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
  );
}

/**
 * Handle all other requests by rendering the Angular application.
 */
if (angularApp) {
  app.use((req, res, next) => {
    angularApp
      .handle(req)
      .then((response) =>
        response ? writeResponseToNodeResponse(response, res) : next(),
      )
      .catch(next);
  });
}

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

function assignRequestId(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const incomingRequestId = req.header('x-request-id')?.trim();
  const requestId = incomingRequestId && incomingRequestId.length <= 128
    ? incomingRequestId
    : randomUUID();

  res.locals['requestId'] = requestId;
  res.header('X-Request-Id', requestId);
  next();
}

function logApiRequest(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (!shouldLogApiRequests()) {
    next();
    return;
  }

  const startedAt = Date.now();

  res.on('finish', () => {
    const requestLog = {
      event: 'api_request',
      requestId: readRequestId(res),
      method: req.method,
      path: req.originalUrl.split('?')[0] ?? req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: getClientIp(req),
      authRole: readSignedRequestRole(req) ?? 'anonymous',
      userAgent: req.header('user-agent')?.slice(0, 160) ?? '',
    };

    if (res.statusCode >= 500) {
      console.error(requestLog);
      return;
    }

    console.log(requestLog);
  });

  next();
}

function applyCorsHeaders(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const origin = req.header('origin');
  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin =
    origin &&
    (allowedOrigins.includes(origin) ||
      (allowedOrigins.includes('*') && process.env['NODE_ENV'] !== 'production'));

  if (isAllowedOrigin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(isAllowedOrigin || !origin ? 204 : 403);
    return;
  }

  next();
}

function applySecurityHeaders(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.header(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
    ].join('; '),
  );

  if (process.env['NODE_ENV'] === 'production' || req.secure) {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const API_RATE_LIMITS: Array<{ pattern: RegExp; maxRequests: number }> = [
  { pattern: /^\/api\/auth\/login$/, maxRequests: 12 },
  { pattern: /^\/api\/auth\/refresh$/, maxRequests: 30 },
  { pattern: /^\/api\/auth\/register$/, maxRequests: 8 },
  { pattern: /^\/api\/ai\/(?:analyze|provider-check)$/, maxRequests: 15 },
  { pattern: /^\/api\/discovery\/search$/, maxRequests: 20 },
];
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function applyApiRateLimit(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  const requestPath = req.originalUrl.split('?')[0] ?? req.path;
  const matchedLimit = API_RATE_LIMITS.find((limit) => limit.pattern.test(requestPath));

  if (!matchedLimit) {
    next();
    return;
  }

  const limitedKeys = getRateLimitKeys(req, requestPath);
  const now = Date.now();
  let retryAfterSeconds = 0;

  for (const key of limitedKeys) {
    retryAfterSeconds = Math.max(
      retryAfterSeconds,
      incrementRateLimitBucket(key, matchedLimit.maxRequests, now),
    );
  }

  if (retryAfterSeconds > 0) {
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      error: 'Too many requests. Please wait a moment and try again.',
    });
    return;
  }

  next();
}

function getRateLimitKeys(req: express.Request, requestPath: string): string[] {
  const email = typeof req.body?.email === 'string' ? req.body.email : undefined;

  return buildRateLimitKeys(getClientIp(req), req.method, requestPath, email);
}

function incrementRateLimitBucket(
  key: string,
  maxRequests: number,
  now: number,
): number {
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return 0;
  }

  bucket.count += 1;

  if (bucket.count <= maxRequests) {
    return 0;
  }

  return Math.ceil((bucket.resetAt - now) / 1000);
}

function getClientIp(req: express.Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function readRequestId(res: express.Response): string {
  return typeof res.locals['requestId'] === 'string' ? res.locals['requestId'] : 'unknown';
}

function shouldLogApiRequests(): boolean {
  const configuredValue = process.env['API_REQUEST_LOGS']?.trim().toLowerCase();

  if (configuredValue === 'true' || configuredValue === '1') {
    return true;
  }

  if (configuredValue === 'false' || configuredValue === '0') {
    return false;
  }

  return process.env['NODE_ENV'] === 'production';
}

function readSignedRequestRole(req: express.Request): string | undefined {
  const authorization = req.header('authorization');
  const [scheme, token, extra] = authorization?.split(/\s+/) ?? [];

  if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
    return undefined;
  }

  return verifySessionToken(token)?.role;
}

function getTrustProxySetting(): false | 1 {
  const configuredValue = process.env['TRUST_PROXY']?.trim().toLowerCase();

  if (configuredValue === 'true' || configuredValue === '1') {
    return 1;
  }

  if (configuredValue === 'false' || configuredValue === '0') {
    return false;
  }

  return false;
}
