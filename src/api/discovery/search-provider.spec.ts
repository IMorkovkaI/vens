import { afterEach, describe, expect, it, vi } from 'vitest';
import { DiscoverySearchRequest, SearchProviderId } from './discovery.models';
import {
  SearchApiSearchProvider,
  SearchDiscoveryService,
  SearchProvider,
  TavilySearchProvider,
} from './search-provider';

const originalSearchProvider = process.env['SEARCH_PROVIDER'];
const originalSearchFallbackProvider = process.env['SEARCH_FALLBACK_PROVIDER'];
const originalSearchApiKey = process.env['SEARCH_API_KEY'];
const originalTavilyApiKey = process.env['TAVILY_API_KEY'];

describe('SearchDiscoveryService', () => {
  afterEach(() => {
    restoreEnvValue('SEARCH_PROVIDER', originalSearchProvider);
    restoreEnvValue('SEARCH_FALLBACK_PROVIDER', originalSearchFallbackProvider);
    restoreEnvValue('SEARCH_API_KEY', originalSearchApiKey);
    restoreEnvValue('TAVILY_API_KEY', originalTavilyApiKey);
    vi.unstubAllGlobals();
  });

  it('uses SearchApi when selected and configured', async () => {
    process.env['SEARCH_PROVIDER'] = 'searchapi';
    process.env['SEARCH_FALLBACK_PROVIDER'] = '';
    const searchapi = createProvider('searchapi', true);
    const tavily = createProvider('tavily', true);
    const service = new SearchDiscoveryService({ searchapi, tavily });

    const results = await service.search({ query: 'biotech companies' });

    expect(results[0]?.provider).toBe('searchapi');
    expect(searchapi.search).toHaveBeenCalledOnce();
    expect(tavily.search).not.toHaveBeenCalled();
  });

  it('uses Tavily fallback when SearchApi is quota-limited', async () => {
    process.env['SEARCH_PROVIDER'] = 'searchapi';
    process.env['SEARCH_FALLBACK_PROVIDER'] = 'tavily';
    const searchapi = createProvider('searchapi', true, new Error('SearchApi request limit reached.'));
    const tavily = createProvider('tavily', true);
    const service = new SearchDiscoveryService({
      searchapi,
      tavily,
    });

    const results = await service.search({ query: 'drug companies' });

    expect(results[0]?.provider).toBe('tavily');
    expect(searchapi.search).toHaveBeenCalledOnce();
    expect(tavily.search).toHaveBeenCalledOnce();
  });

  it('returns a clear setup error when no configured provider is available', async () => {
    process.env['SEARCH_PROVIDER'] = 'searchapi';
    process.env['SEARCH_FALLBACK_PROVIDER'] = 'tavily';
    const service = new SearchDiscoveryService({
      searchapi: createProvider('searchapi', false),
      tavily: createProvider('tavily', false),
    });

    await expect(service.search({ query: 'marketing agencies' })).rejects.toThrow(
      'SearchApi requires SEARCH_API_KEY.',
    );
  });

  it('can be disabled through SEARCH_PROVIDER', async () => {
    process.env['SEARCH_PROVIDER'] = 'disabled';
    const service = new SearchDiscoveryService({
      searchapi: createProvider('searchapi', true),
      tavily: createProvider('tavily', true),
    });

    await expect(service.search({ query: 'marketing agencies' })).rejects.toThrow(
      'Search discovery is disabled.',
    );
  });

  it('sanitizes SearchApi provider error bodies', async () => {
    process.env['SEARCH_API_KEY'] = 'test-search-key';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => createErrorResponse(500, 'upstream secret body SEARCH_API_KEY')),
    );
    const provider = new SearchApiSearchProvider();

    await expect(provider.search({ query: 'biotech companies' })).rejects.toThrow(
      'SearchApi search failed with HTTP 500.',
    );
    await expect(provider.search({ query: 'biotech companies' })).rejects.not.toThrow(
      'upstream secret body',
    );
  });

  it('sanitizes Tavily provider error bodies', async () => {
    process.env['TAVILY_API_KEY'] = 'test-tavily-key';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => createErrorResponse(429, 'quota details with test-tavily-key')),
    );
    const provider = new TavilySearchProvider();

    await expect(provider.search({ query: 'biotech companies' })).rejects.toThrow(
      'Tavily search failed with HTTP 429. Provider quota or rate limit may be reached.',
    );
    await expect(provider.search({ query: 'biotech companies' })).rejects.not.toThrow(
      'test-tavily-key',
    );
  });
});

function createProvider(
  id: SearchProviderId,
  configured: boolean,
  error?: Error,
): SearchProvider {
  return {
    id,
    isConfigured: () => configured,
    search: vi.fn(async (request: DiscoverySearchRequest) => {
      if (error) {
        throw error;
      }

      return [
        {
          url: `https://${id}.example.com`,
          title: `${id} result`,
          snippet: 'Search result snippet.',
          provider: id,
          query: request.query,
        },
      ];
    }),
  };
}

function restoreEnvValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function createErrorResponse(status: number, body: string): Response {
  return {
    ok: false,
    status,
    headers: new Headers({
      'content-type': 'application/json',
    }),
    text: async () => body,
    json: async () => ({}),
  } as Response;
}
