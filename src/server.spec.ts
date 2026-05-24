import { describe, expect, it } from 'vitest';
import { buildRateLimitKeys } from './api/security/rate-limit-keys';

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
