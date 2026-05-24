import { CompanyFormData } from '../../app/core/company-directory/company-directory.models';

export type AiProviderId = 'mock' | 'ollama' | 'groq' | 'openrouter' | 'google';

export interface AiProviderConfig {
  provider: AiProviderId;
  model: string;
  confidence: number;
}

export interface AiAnalysisResult {
  url: string;
  hostname: string;
  formData: CompanyFormData;
  createdAt: string;
  fromCache: boolean;
  provider: AiProviderId;
  model: string;
  confidence: number;
  source?: AiAnalysisSource;
}

export type AiAnalysisSourceStatus = 'extracted' | 'unavailable';

export interface AiAnalysisSource {
  contentAware: true;
  status: AiAnalysisSourceStatus;
  safetyStatus: 'https' | 'http-warning' | 'unsafe' | 'fetch-failed';
  url: string;
  finalUrl?: string;
  title?: string;
  metaDescription?: string;
  headings: string[];
  textSnippets: string[];
  schemaTypes: string[];
  schemaSummaries: string[];
  reviewSignals: string[];
  extractedCharacters: number;
  warnings: string[];
}

export interface AiProviderCheckResult {
  success: boolean;
  provider: AiProviderId;
  model: string;
  normalizedUrl: string;
  durationMs: number;
  fromCache: boolean;
  hostname?: string;
  confidence?: number;
  createdAt?: string;
  source?: AiAnalysisSource;
  error?: string;
  profilePreview?: Pick<
    CompanyFormData,
    'name' | 'description' | 'categorySlug' | 'tags' | 'aiSummary' | 'seoDescription'
  >;
}

export interface AiAnalysisProvider {
  readonly config: AiProviderConfig;
  analyzeUrl(
    url: string,
    source?: AiAnalysisSource,
  ): AiAnalysisResult | Promise<AiAnalysisResult>;
  normalizeUrl(url: string): string;
}
