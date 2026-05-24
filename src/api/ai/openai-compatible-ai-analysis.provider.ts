import {
  AiAnalysisProvider,
  AiAnalysisResult,
  AiAnalysisSource,
  AiProviderConfig,
  AiProviderId,
} from './ai-analysis.types';
import {
  createCompanyProfilePrompt,
  mergeGeneratedProfile,
  parseGeneratedProfile,
} from './company-profile-generation';
import { MockAiAnalysisProvider } from './mock-ai-analysis.provider';

interface OpenAiCompatibleProviderOptions {
  provider: Extract<AiProviderId, 'groq' | 'openrouter'>;
  model: string;
  endpoint: string;
  apiKey: string | undefined;
  apiKeyEnvName: string;
  confidence: number;
  fetchImpl?: typeof fetch;
  headers?: Record<string, string>;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class OpenAiCompatibleAiAnalysisProvider implements AiAnalysisProvider {
  private readonly endpoint: string;
  private readonly apiKey: string | undefined;
  private readonly apiKeyEnvName: string;
  private readonly fetchImpl: typeof fetch;
  private readonly headers: Record<string, string>;
  private readonly fallbackProvider = new MockAiAnalysisProvider();

  readonly config: AiProviderConfig;

  constructor(options: OpenAiCompatibleProviderOptions) {
    this.endpoint = options.endpoint;
    this.apiKey = options.apiKey?.trim();
    this.apiKeyEnvName = options.apiKeyEnvName;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.headers = options.headers ?? {};
    this.config = {
      provider: options.provider,
      model: options.model.trim(),
      confidence: options.confidence,
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

    if (!this.apiKey) {
      throw new Error(`${this.apiKeyEnvName} is required for ${this.config.provider} analysis.`);
    }

    const seedResult = this.fallbackProvider.analyzeUrl(normalizedUrl, source);
    const response = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0.2,
        response_format: {
          type: 'json_object',
        },
        messages: [
          {
            role: 'system',
            content: 'You generate JSON-only business directory profiles.',
          },
          {
            role: 'user',
            content: createCompanyProfilePrompt(seedResult),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(this.createFailureMessage());
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const responseText = payload.choices?.[0]?.message?.content ?? '';
    const generatedProfile = parseGeneratedProfile(responseText, this.createFailureMessage());

    return {
      ...seedResult,
      formData: mergeGeneratedProfile(seedResult.formData, generatedProfile),
      provider: this.config.provider,
      model: this.config.model,
      confidence: this.config.confidence,
      createdAt: new Date().toISOString(),
      fromCache: false,
      source,
    };
  }

  private createFailureMessage(): string {
    return `${this.config.provider} analysis failed. Check ${this.apiKeyEnvName}, model ${this.config.model}, and provider limits.`;
  }
}
