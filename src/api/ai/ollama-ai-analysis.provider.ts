import {
  AiAnalysisProvider,
  AiAnalysisResult,
  AiAnalysisSource,
  AiProviderConfig,
} from './ai-analysis.types';
import {
  createCompanyProfilePrompt,
  mergeGeneratedProfile,
  parseGeneratedProfile,
} from './company-profile-generation';
import { MockAiAnalysisProvider } from './mock-ai-analysis.provider';

const DEFAULT_OLLAMA_MODEL = 'qwen2.5:7b';
const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_CONFIDENCE = 0.82;

interface OllamaGenerateResponse {
  response?: string;
}

interface OllamaProviderOptions {
  baseUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

export class OllamaAiAnalysisProvider implements AiAnalysisProvider {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly fallbackProvider = new MockAiAnalysisProvider();

  readonly config: AiProviderConfig;

  constructor(options: OllamaProviderOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env['OLLAMA_BASE_URL'] ?? DEFAULT_OLLAMA_BASE_URL)
      .trim()
      .replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.config = {
      provider: 'ollama',
      model: (options.model ?? process.env['OLLAMA_MODEL'] ?? DEFAULT_OLLAMA_MODEL).trim(),
      confidence: OLLAMA_CONFIDENCE,
    };
  }

  normalizeUrl(url: string): string {
    return this.fallbackProvider.normalizeUrl(url);
  }

  async analyzeUrl(url: string, source?: AiAnalysisSource): Promise<AiAnalysisResult> {
    const normalizedUrl = this.normalizeUrl(url);

    if (!normalizedUrl) {
      throw new Error('Enter a valid company URL.');
    }

    const seedResult = this.fallbackProvider.analyzeUrl(normalizedUrl, source);
    const generatedFormData = await this.generateCompanyProfile(seedResult);

    return {
      ...seedResult,
      formData: generatedFormData,
      provider: this.config.provider,
      model: this.config.model,
      confidence: this.config.confidence,
      createdAt: new Date().toISOString(),
      fromCache: false,
      source,
    };
  }

  private async generateCompanyProfile(seedResult: AiAnalysisResult) {
    const response = await this.fetchImpl(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        stream: false,
        format: 'json',
        prompt: createCompanyProfilePrompt(seedResult),
        options: {
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(this.createFailureMessage());
    }

    const payload = (await response.json()) as OllamaGenerateResponse;
    const generatedProfile = parseGeneratedProfile(
      payload.response ?? '',
      this.createFailureMessage(),
    );

    return mergeGeneratedProfile(seedResult.formData, generatedProfile);
  }

  private createFailureMessage(): string {
    return `Ollama analysis failed. Ensure Ollama is running at ${this.baseUrl} and model ${this.config.model} is available.`;
  }
}
