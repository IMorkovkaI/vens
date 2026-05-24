import {
  buildDiscoveryQuery,
  getConfiguredSearchFallbackProvider,
  getConfiguredSearchProvider,
  isSearchDiscoveryDisabled,
  toProviderSetupError,
} from './discovery-helpers';
import {
  DiscoverySearchRequest,
  DiscoverySearchResult,
  SearchProviderId,
} from './discovery.models';

export interface SearchProvider {
  readonly id: SearchProviderId;
  search(request: DiscoverySearchRequest): Promise<DiscoverySearchResult[]>;
  isConfigured(): boolean;
}

export class SearchDiscoveryService {
  constructor(
    private readonly providers: Record<SearchProviderId, SearchProvider> = {
      searchapi: new SearchApiSearchProvider(),
      tavily: new TavilySearchProvider(),
    },
  ) {}

  getProviderStatus(): Record<SearchProviderId, { configured: boolean }> {
    return {
      searchapi: {
        configured: this.providers.searchapi.isConfigured(),
      },
      tavily: {
        configured: this.providers.tavily.isConfigured(),
      },
    };
  }

  async search(request: DiscoverySearchRequest): Promise<DiscoverySearchResult[]> {
    if (isSearchDiscoveryDisabled()) {
      throw new Error('Search discovery is disabled. Set SEARCH_PROVIDER to searchapi or tavily to enable it.');
    }

    const primaryProviderId = getConfiguredSearchProvider();
    const primaryProvider = this.providers[primaryProviderId];

    if (!primaryProvider.isConfigured()) {
      return this.searchFallbackOrThrow(primaryProviderId, request);
    }

    try {
      return await primaryProvider.search(request);
    } catch (error) {
      if (!isQuotaLikeSearchError(error)) {
        throw error;
      }

      return this.searchFallbackOrThrow(primaryProviderId, request);
    }
  }

  private async searchFallbackOrThrow(
    primaryProviderId: SearchProviderId,
    request: DiscoverySearchRequest,
  ): Promise<DiscoverySearchResult[]> {
    const fallbackProviderId = getConfiguredSearchFallbackProvider();
    const fallbackProvider =
      fallbackProviderId && fallbackProviderId !== primaryProviderId
        ? this.providers[fallbackProviderId]
        : undefined;

    if (fallbackProvider?.isConfigured()) {
      return fallbackProvider.search(request);
    }

    throw new Error(toProviderSetupError(primaryProviderId));
  }
}

export class SearchApiSearchProvider implements SearchProvider {
  readonly id = 'searchapi' as const;

  isConfigured(): boolean {
    return Boolean(getSearchApiKey());
  }

  async search(request: DiscoverySearchRequest): Promise<DiscoverySearchResult[]> {
    const apiKey = getSearchApiKey();

    if (!apiKey) {
      throw new Error(toProviderSetupError(this.id));
    }

    const query = buildDiscoveryQuery(request);
    const url = new URL('https://www.searchapi.io/api/v1/search');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('engine', getEnv('SEARCH_API_ENGINE') || 'google');
    url.searchParams.set('q', query);
    url.searchParams.set('num', String(request.limit ?? 5));

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(createSearchProviderFailureMessage('SearchApi', response.status));
    }

    const payload = (await response.json()) as SearchApiResponse;

    return (payload.organic_results ?? [])
      .map((item) => ({
        url: item.link,
        title: item.title ?? item.link,
        snippet: item.snippet ?? '',
        provider: this.id,
        query,
        displayUrl: item.displayed_link ?? getDisplayUrl(item.link),
      }))
      .filter((result) => isHttpsUrl(result.url));
  }
}

export class TavilySearchProvider implements SearchProvider {
  readonly id = 'tavily' as const;

  isConfigured(): boolean {
    return Boolean(getEnv('TAVILY_API_KEY'));
  }

  async search(request: DiscoverySearchRequest): Promise<DiscoverySearchResult[]> {
    const apiKey = getEnv('TAVILY_API_KEY');

    if (!apiKey) {
      throw new Error(toProviderSetupError(this.id));
    }

    const query = buildDiscoveryQuery(request);
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: request.limit ?? 5,
        search_depth: 'basic',
      }),
    });

    if (!response.ok) {
      throw new Error(createSearchProviderFailureMessage('Tavily', response.status));
    }

    const payload = (await response.json()) as TavilySearchResponse;

    return (payload.results ?? [])
      .map((item) => ({
        url: item.url,
        title: item.title ?? item.url,
        snippet: item.content ?? '',
        provider: this.id,
        query,
        displayUrl: getDisplayUrl(item.url),
      }))
      .filter((result) => isHttpsUrl(result.url));
  }
}

interface SearchApiResponse {
  organic_results?: Array<{
    link: string;
    title?: string;
    snippet?: string;
    displayed_link?: string;
  }>;
}

interface TavilySearchResponse {
  results?: Array<{
    url: string;
    title?: string;
    content?: string;
  }>;
}

export const searchDiscoveryService = new SearchDiscoveryService();

function getEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

function getSearchApiKey(): string {
  return getEnv('SEARCH_API_KEY') || getEnv('SEARCHAPI_API_KEY');
}

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function getDisplayUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function createSearchProviderFailureMessage(providerName: string, status: number): string {
  const quotaHint = status === 429 ? ' Provider quota or rate limit may be reached.' : '';

  return `${providerName} search failed with HTTP ${status}.${quotaHint}`;
}

function isQuotaLikeSearchError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return (
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('limit') ||
    message.includes('rate limit') ||
    message.includes('rate-limit')
  );
}
