import { afterEach, describe, expect, it } from 'vitest';
import { PrismaAiAnalysisCacheRepository } from '../database/prisma-ai-analysis-cache.repository';
import { ApiAiAnalysisService } from './ai-analysis.service';
import {
  getAiAnalysisCacheRepository,
  InMemoryAiAnalysisCacheRepository,
  resetAiAnalysisCacheRepositoryForTests,
} from './ai-analysis-cache.repository';
import { AiAnalysisResult, AiAnalysisSource } from './ai-analysis.types';

const originalDatabaseUrl = process.env['DATABASE_URL'];
const originalAiProvider = process.env['AI_PROVIDER'];
const originalOpenRouterApiKey = process.env['OPENROUTER_API_KEY'];

const analysisResult: AiAnalysisResult = {
  url: 'https://example.com',
  hostname: 'example.com',
  formData: {
    name: 'Example',
    website: 'https://example.com',
    categorySlug: 'ai-tools',
    tags: ['AI analysis', 'Automation'],
    description: 'Example company description.',
    aiSummary: 'Example AI summary.',
    seoDescription: 'Example SEO description.',
  },
  createdAt: '2026-05-13T12:00:00.000Z',
  fromCache: false,
  provider: 'mock',
  model: 'mock-qwen2.5-7b-profile-generator',
  confidence: 0.85,
};
const extractedSource: AiAnalysisSource = {
  contentAware: true,
  status: 'extracted',
  safetyStatus: 'https',
  url: 'https://cache-test.example/path',
  title: 'Cache Test Drug Discovery Platform',
  metaDescription: 'Cache Test develops clinical research software for drug companies.',
  headings: ['Clinical research intelligence'],
  textSnippets: ['Cache Test develops clinical research software for drug companies.'],
  schemaTypes: ['Organization'],
  schemaSummaries: ['type=Organization; name=Cache Test'],
  reviewSignals: [],
  extractedCharacters: 68,
  warnings: [],
};
const createSource = async (url: string): Promise<AiAnalysisSource> => ({
  ...extractedSource,
  url,
  title: titleCase(new URL(url).hostname.split('.')[0]?.replace(/-/g, ' ') ?? 'Example'),
});

describe('AI analysis cache repository selection', () => {
  afterEach(() => {
    restoreDatabaseUrl();
    resetAiAnalysisCacheRepositoryForTests();
  });

  it('uses the in-memory cache repository when DATABASE_URL is absent', () => {
    delete process.env['DATABASE_URL'];

    expect(getAiAnalysisCacheRepository()).toBeInstanceOf(InMemoryAiAnalysisCacheRepository);
  });

  it('uses the Prisma cache repository when DATABASE_URL is configured', () => {
    process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/vensight';

    expect(getAiAnalysisCacheRepository()).toBeInstanceOf(PrismaAiAnalysisCacheRepository);
  });
});

describe('in-memory AI analysis cache repository contract', () => {
  it('saves and returns cached analysis results by normalized URL', async () => {
    const repository = new InMemoryAiAnalysisCacheRepository();

    await expect(repository.getByUrl(analysisResult.url)).resolves.toBeUndefined();
    await expect(repository.save({ ...analysisResult, fromCache: true })).resolves.toMatchObject({
      url: analysisResult.url,
      fromCache: false,
    });
    await expect(repository.getByUrl(analysisResult.url)).resolves.toMatchObject({
      formData: analysisResult.formData,
      fromCache: false,
    });
  });

  it('lists recent cached analysis results newest first', async () => {
    const repository = new InMemoryAiAnalysisCacheRepository();

    await repository.save({
      ...analysisResult,
      url: 'https://older.example.com',
      hostname: 'older.example.com',
      createdAt: '2026-05-13T10:00:00.000Z',
    });
    await repository.save({
      ...analysisResult,
      url: 'https://newer.example.com',
      hostname: 'newer.example.com',
      createdAt: '2026-05-13T12:00:00.000Z',
    });

    const recentAnalyses = await repository.listRecent(1);

    expect(recentAnalyses).toEqual([
      expect.objectContaining({
        url: 'https://newer.example.com',
        fromCache: true,
      }),
    ]);
  });
});

describe('API AI analysis service cache behavior', () => {
  afterEach(() => {
    restoreDatabaseUrl();
    resetAiAnalysisCacheRepositoryForTests();
  });

  it('normalizes URLs, generates deterministic mock output, and reuses cached results', async () => {
    delete process.env['DATABASE_URL'];
    process.env['AI_PROVIDER'] = 'mock';
    const service = new ApiAiAnalysisService(createSource);

    const firstResult = await service.analyzeUrl(' cache-test.example/path?utm=source ');
    const secondResult = await service.analyzeUrl('https://cache-test.example/path');

    expect(firstResult.url).toBe('https://cache-test.example/path');
    expect(firstResult.fromCache).toBe(false);
    expect(firstResult.formData.name).toBe('Cache Test');
    expect(firstResult.source?.status).toBe('extracted');
    expect(firstResult.formData.categorySlug).toBe('biotech-pharma');
    expect(secondResult).toMatchObject({
      url: firstResult.url,
      hostname: firstResult.hostname,
      formData: firstResult.formData,
      fromCache: true,
    });
  });

  it('rejects invalid URLs before touching the cache', async () => {
    delete process.env['DATABASE_URL'];
    process.env['AI_PROVIDER'] = 'mock';
    const service = new ApiAiAnalysisService();

    await expect(service.analyzeUrl('localhost')).rejects.toThrow(
      'Enter a valid HTTPS company URL.',
    );
  });

  it('rejects plain HTTP URLs before touching the cache or provider', async () => {
    delete process.env['DATABASE_URL'];
    process.env['AI_PROVIDER'] = 'mock';
    const service = new ApiAiAnalysisService();

    await expect(service.analyzeUrl('http://example.com')).rejects.toThrow(
      'Use an HTTPS URL so Vensight can analyze the page safely.',
    );
  });

  it('returns recent analyses from the selected cache repository', async () => {
    delete process.env['DATABASE_URL'];
    process.env['AI_PROVIDER'] = 'mock';
    const service = new ApiAiAnalysisService(createSource);

    await service.analyzeUrl('older-service-cache.example');
    await service.analyzeUrl('newer-service-cache.example');

    const recentAnalyses = await service.getRecentAnalyses(2);

    expect(recentAnalyses.map((analysis) => analysis.formData.name)).toEqual(
      expect.arrayContaining(['Newer Service Cache', 'Older Service Cache']),
    );
    expect(recentAnalyses.every((analysis) => analysis.fromCache)).toBe(true);
  });

  it('checks the selected provider without creating a listing payload response', async () => {
    delete process.env['DATABASE_URL'];
    process.env['AI_PROVIDER'] = 'mock';
    const service = new ApiAiAnalysisService(createSource);

    const result = await service.checkSelectedProvider(' provider-check.example/path?utm=source ');

    expect(result).toMatchObject({
      success: true,
      provider: 'mock',
      model: 'mock-qwen2.5-7b-profile-generator',
      normalizedUrl: 'https://provider-check.example/path',
      hostname: 'provider-check.example',
      fromCache: false,
      confidence: 0.85,
      source: {
        status: 'extracted',
        safetyStatus: 'https',
      },
      profilePreview: {
        name: 'Provider Check',
        categorySlug: expect.any(String),
        tags: expect.any(Array),
      },
    });
    expect(result).not.toHaveProperty('formData');
  });

  it('returns selected provider check errors without throwing', async () => {
    delete process.env['DATABASE_URL'];
    process.env['AI_PROVIDER'] = 'openrouter';
    process.env['OPENROUTER_API_KEY'] = '';
    const service = new ApiAiAnalysisService(createSource);

    const result = await service.checkSelectedProvider('missing-provider-key.example');

    expect(result).toMatchObject({
      success: false,
      provider: 'openrouter',
      model: 'qwen/qwen-2.5-7b-instruct:free',
      normalizedUrl: 'https://missing-provider-key.example',
      hostname: 'missing-provider-key.example',
      fromCache: false,
      error: 'OPENROUTER_API_KEY is required for openrouter analysis.',
    });
  });
});

function restoreDatabaseUrl(): void {
  if (originalDatabaseUrl === undefined) {
    delete process.env['DATABASE_URL'];
  } else {
    process.env['DATABASE_URL'] = originalDatabaseUrl;
  }

  restoreAiProvider();
}

function restoreAiProvider(): void {
  if (originalAiProvider === undefined) {
    delete process.env['AI_PROVIDER'];
  } else {
    process.env['AI_PROVIDER'] = originalAiProvider;
  }

  if (originalOpenRouterApiKey === undefined) {
    delete process.env['OPENROUTER_API_KEY'];
  } else {
    process.env['OPENROUTER_API_KEY'] = originalOpenRouterApiKey;
  }
}

function titleCase(value: string): string {
  return value
    .split(' ')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
