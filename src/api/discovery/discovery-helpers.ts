import {
  DiscoveryCandidateStatus,
  DiscoverySearchRequest,
  SearchProviderId,
} from './discovery.models';

export const DISCOVERY_STATUSES: DiscoveryCandidateStatus[] = [
  'new',
  'reviewing',
  'accepted',
  'rejected',
  'analyzed',
];

export function validateDiscoverySearchRequest(value: unknown): DiscoverySearchRequest {
  if (!value || typeof value !== 'object') {
    throw new Error('Search query is required.');
  }

  const body = value as Record<string, unknown>;
  const query = String(body['query'] ?? '').trim();

  if (query.length < 2) {
    throw new Error('Search query must be at least 2 characters.');
  }

  return {
    query,
    category: String(body['category'] ?? '').trim(),
    location: String(body['location'] ?? '').trim(),
    limit: parseLimit(body['limit']),
  };
}

export function buildDiscoveryQuery(request: DiscoverySearchRequest): string {
  return [request.query, request.category, request.location]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
}

export function normalizeDiscoveryUrl(url: string): string {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    throw new Error('Candidate URL is required.');
  }

  const parsedUrl = new URL(trimmedUrl);

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Candidate URL must use HTTPS.');
  }

  parsedUrl.hash = '';

  return parsedUrl.toString().replace(/\/$/, '');
}

export function normalizeStatus(value: unknown): DiscoveryCandidateStatus {
  const status = String(value ?? '').trim().toLowerCase() as DiscoveryCandidateStatus;

  if (!DISCOVERY_STATUSES.includes(status)) {
    throw new Error('Use a valid discovery candidate status.');
  }

  return status;
}

export function getConfiguredSearchProvider(): SearchProviderId {
  const provider = process.env['SEARCH_PROVIDER']?.trim().toLowerCase();

  if (provider === 'tavily') {
    return provider;
  }

  return 'searchapi';
}

export function isSearchDiscoveryDisabled(): boolean {
  const provider = process.env['SEARCH_PROVIDER']?.trim().toLowerCase();

  return provider === 'disabled' || provider === 'off' || provider === 'none';
}

export function getConfiguredSearchFallbackProvider(): SearchProviderId | undefined {
  const provider = process.env['SEARCH_FALLBACK_PROVIDER']?.trim().toLowerCase();

  if (provider === 'searchapi' || provider === 'tavily') {
    return provider;
  }

  return undefined;
}

export function parseLimit(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 5;
  }

  return Math.min(parsed, 10);
}

export function toProviderSetupError(provider: SearchProviderId): string {
  if (provider === 'searchapi') {
    return 'SearchApi requires SEARCH_API_KEY.';
  }

  return 'Tavily search requires TAVILY_API_KEY.';
}
