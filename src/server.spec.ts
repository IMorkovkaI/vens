import { describe, expect, it } from 'vitest';
import { buildRateLimitKeys } from './api/security/rate-limit-keys';
import {
  applyHtmlNoStoreCacheHeaders,
  shouldDisableHtmlCache,
} from './api/security/cache-policy';

describe('server rate limit keys', () => {
  it('tracks login attempts by IP and normalized email', () => {
    expect(
      buildRateLimitKeys(
        '203.0.113.10',
        'POST',
        '/api/auth/login',
        ' ADMIN@vensight.TEST ',
      ),
    ).toEqual([
      'ip:203.0.113.10:POST:/api/auth/login',
      'email:admin@vensight.test:POST:/api/auth/login',
    ]);
  });

  it('does not add email buckets for unrelated routes', () => {
    expect(
      buildRateLimitKeys(
        '203.0.113.10',
        'POST',
        '/api/ai/analyze',
        'admin@vensight.test',
      ),
    ).toEqual(['ip:203.0.113.10:POST:/api/ai/analyze']);
  });
});

describe('server HTML cache policy', () => {
  it('disables cache for public HTML document requests', () => {
    expect(
      shouldDisableHtmlCache({
        method: 'GET',
        path: '/',
        headers: { accept: 'text/html,application/xhtml+xml' },
      }),
    ).toBe(true);
  });

  it('disables cache for extensionless direct route loads', () => {
    expect(
      shouldDisableHtmlCache({
        method: 'HEAD',
        path: '/companies',
        headers: { accept: '*/*' },
      }),
    ).toBe(true);
  });

  it('keeps API responses out of the HTML cache policy', () => {
    expect(
      shouldDisableHtmlCache({
        method: 'GET',
        path: '/api/health',
        headers: { accept: 'application/json' },
      }),
    ).toBe(false);
  });

  it('keeps static assets cacheable by filename', () => {
    expect(
      shouldDisableHtmlCache({
        method: 'GET',
        path: '/main-GCTLU5C5.js',
        headers: { accept: '*/*' },
      }),
    ).toBe(false);
  });

  it('does not set document cache headers for non-navigation requests', () => {
    const headers = new Map<string, string>();

    applyHtmlNoStoreCacheHeaders(
      {
        method: 'POST',
        path: '/dashboard/login',
        headers: { accept: 'application/json' },
      },
      {
        setHeader: (name, value) => headers.set(name, value),
      },
    );

    expect(headers.size).toBe(0);
  });

  it('sets Vercel-compatible no-store headers for HTML documents', () => {
    const headers = new Map<string, string>();

    applyHtmlNoStoreCacheHeaders(
      {
        method: 'GET',
        path: '/',
        headers: { accept: 'text/html' },
      },
      {
        setHeader: (name, value) => headers.set(name, value),
      },
    );

    expect(headers.get('Cache-Control')).toBe('no-store, max-age=0');
    expect(headers.get('CDN-Cache-Control')).toBe('no-store');
    expect(headers.get('Vercel-CDN-Cache-Control')).toBe('no-store');
  });
});
