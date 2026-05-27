const HTML_CACHE_CONTROL = 'no-store, max-age=0';
const CDN_CACHE_CONTROL = 'no-store';

export interface CacheHeaderRequest {
  method: string;
  path: string;
  headers?: Record<string, string | string[] | undefined>;
}

export interface CacheHeaderResponse {
  setHeader(name: string, value: string): void;
}

export function applyHtmlNoStoreCacheHeaders(
  req: CacheHeaderRequest,
  res: CacheHeaderResponse,
): void {
  if (!shouldDisableHtmlCache(req)) {
    return;
  }

  res.setHeader('Cache-Control', HTML_CACHE_CONTROL);
  res.setHeader('CDN-Cache-Control', CDN_CACHE_CONTROL);
  res.setHeader('Vercel-CDN-Cache-Control', CDN_CACHE_CONTROL);
}

export function shouldDisableHtmlCache(req: CacheHeaderRequest): boolean {
  const method = req.method.toUpperCase();

  if (method !== 'GET' && method !== 'HEAD') {
    return false;
  }

  if (req.path.startsWith('/api/') || req.path === '/api') {
    return false;
  }

  if (isAssetPath(req.path)) {
    return false;
  }

  const acceptHeader = readHeader(req.headers, 'accept');

  return !acceptHeader || acceptHeader.includes('text/html') || acceptHeader.includes('*/*');
}

function isAssetPath(path: string): boolean {
  return /\.[a-z0-9]{2,8}$/i.test(path);
}

function readHeader(
  headers: CacheHeaderRequest['headers'],
  name: string,
): string {
  const value = headers?.[name] ?? headers?.[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value.join(',');
  }

  return value ?? '';
}
