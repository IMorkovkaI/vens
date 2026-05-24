import {
  AiAnalysisProvider,
  AiAnalysisResult,
  AiAnalysisSource,
  AiProviderConfig,
} from './ai-analysis.types';
import { getCloudAiApiKey, getProviderModel } from '../environment/backend-config';
import {
  createCompanyProfilePrompt,
  mergeGeneratedProfile,
  parseGeneratedProfile,
} from './company-profile-generation';
import { MockAiAnalysisProvider } from './mock-ai-analysis.provider';

const DEFAULT_GOOGLE_MODEL = 'gemini-2.5-flash';
const DEFAULT_GOOGLE_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GOOGLE_CONFIDENCE = 0.84;

interface GoogleProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

interface GoogleGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export class GoogleAiAnalysisProvider implements AiAnalysisProvider {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly fallbackProvider = new MockAiAnalysisProvider();

  readonly config: AiProviderConfig;

  constructor(options: GoogleProviderOptions = {}) {
    this.apiKey = (
      options.apiKey ??
      getCloudAiApiKey('google')
    )?.trim();
    this.baseUrl = (options.baseUrl ?? DEFAULT_GOOGLE_BASE_URL).trim().replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.config = {
      provider: 'google',
      model: (options.model ?? getProviderModel('google') ?? DEFAULT_GOOGLE_MODEL).trim(),
      confidence: GOOGLE_CONFIDENCE,
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
      throw new Error('GOOGLE_AI_API_KEY is required for google analysis.');
    }

    const seedResult = this.fallbackProvider.analyzeUrl(normalizedUrl, source);
    const response = await this.fetchImpl(`${this.baseUrl}/models/${this.config.model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You generate JSON-only business directory profiles.' }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: createCompanyProfilePrompt(seedResult) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(this.createFailureMessage());
    }

    const payload = (await response.json()) as GoogleGenerateContentResponse;
    const responseText =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('') ?? '';
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
    return `google analysis failed. Check GOOGLE_AI_API_KEY, model ${this.config.model}, and provider limits.`;
  }
}
