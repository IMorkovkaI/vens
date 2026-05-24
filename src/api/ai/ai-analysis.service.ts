import { getAiAnalysisCacheRepository } from './ai-analysis-cache.repository';
import { createAiAnalysisProvider } from './ai-analysis-provider.factory';
import { AiAnalysisResult, AiProviderCheckResult } from './ai-analysis.types';
import {
  AnalysisUrlValidationError,
  extractPageContent,
  normalizeHttpsAnalysisUrl,
} from './page-content-extractor';

export class ApiAiAnalysisService {
  private readonly provider = createAiAnalysisProvider();

  constructor(
    private readonly extractContent: typeof extractPageContent = extractPageContent,
  ) {}

  async analyzeUrl(url: string): Promise<AiAnalysisResult> {
    const normalizedUrl = this.normalizeAnalysisUrl(url);

    if (!normalizedUrl) {
      throw new Error('Enter a valid company URL.');
    }

    const cacheRepository = getAiAnalysisCacheRepository();
    const cachedResult = await cacheRepository.getByUrl(normalizedUrl);

    if (cachedResult?.source?.contentAware) {
      return {
        ...cachedResult,
        fromCache: true,
      };
    }

    const source = await this.extractContent(normalizedUrl);
    const result = await this.provider.analyzeUrl(normalizedUrl, source);

    return cacheRepository.save(result);
  }

  async getRecentAnalyses(limit?: number): Promise<AiAnalysisResult[]> {
    return getAiAnalysisCacheRepository().listRecent(limit);
  }

  async checkSelectedProvider(url: string): Promise<AiProviderCheckResult> {
    const startedAt = Date.now();
    const providerConfig = this.provider.config;
    let normalizedUrl = '';

    try {
      normalizedUrl = this.normalizeAnalysisUrl(url);
    } catch (error) {
      const validationError = this.toAnalysisUrlValidationError(error);

      return {
        success: false,
        provider: providerConfig.provider,
        model: providerConfig.model,
        normalizedUrl: validationError?.normalizedUrl ?? '',
        durationMs: this.getDurationMs(startedAt),
        fromCache: false,
        source: validationError
          ? {
              contentAware: true,
              status: 'unavailable',
              safetyStatus: validationError.safetyStatus,
              url: validationError.normalizedUrl,
              headings: [],
              textSnippets: [],
              schemaTypes: [],
              schemaSummaries: [],
              reviewSignals: [],
              extractedCharacters: 0,
              warnings: [validationError.message],
            }
          : undefined,
        error: validationError?.message ?? 'Enter a valid company URL.',
      };
    }

    try {
      const result = await this.analyzeUrl(normalizedUrl);

      return {
        success: true,
        provider: result.provider,
        model: result.model,
        normalizedUrl: result.url,
        hostname: result.hostname,
        durationMs: this.getDurationMs(startedAt),
        fromCache: result.fromCache,
        confidence: result.confidence,
        createdAt: result.createdAt,
        source: result.source,
        profilePreview: {
          name: result.formData.name,
          description: result.formData.description,
          categorySlug: result.formData.categorySlug,
          tags: result.formData.tags,
          aiSummary: result.formData.aiSummary,
          seoDescription: result.formData.seoDescription,
        },
      };
    } catch (error) {
      return {
        success: false,
        provider: providerConfig.provider,
        model: providerConfig.model,
        normalizedUrl,
        hostname: this.readHostname(normalizedUrl),
        durationMs: this.getDurationMs(startedAt),
        fromCache: false,
        source: error instanceof AnalysisUrlValidationError
          ? {
              contentAware: true,
              status: 'unavailable',
              safetyStatus: error.safetyStatus,
              url: error.normalizedUrl,
              headings: [],
              textSnippets: [],
              schemaTypes: [],
              schemaSummaries: [],
              reviewSignals: [],
              extractedCharacters: 0,
              warnings: [error.message],
            }
          : undefined,
        error: error instanceof Error ? error.message : 'AI provider check failed.',
      };
    }
  }

  getProviderConfig() {
    return this.provider.config;
  }

  private getDurationMs(startedAt: number): number {
    return Math.max(Date.now() - startedAt, 0);
  }

  private readHostname(url: string): string | undefined {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return undefined;
    }
  }

  private normalizeAnalysisUrl(url: string): string {
    return normalizeHttpsAnalysisUrl(url);
  }

  private toAnalysisUrlValidationError(error: unknown): AnalysisUrlValidationError | undefined {
    return error instanceof AnalysisUrlValidationError ? error : undefined;
  }
}

export const apiAiAnalysisService = new ApiAiAnalysisService();
