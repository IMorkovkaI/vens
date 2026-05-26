import {
  AiAnalysisProvider,
  AiAnalysisResult,
  AiAnalysisSource,
} from './ai-analysis.types';
import {
  getAiProviderRuntimeConfig,
  getConfiguredAiFallbackProviders,
  getCloudAiApiKey,
  getConfiguredAiProvider,
  getProviderModel,
} from '../environment/backend-config';
import { GoogleAiAnalysisProvider } from './google-ai-analysis.provider';
import { MockAiAnalysisProvider } from './mock-ai-analysis.provider';
import { OpenAiCompatibleAiAnalysisProvider } from './openai-compatible-ai-analysis.provider';
import { OllamaAiAnalysisProvider } from './ollama-ai-analysis.provider';

export function createAiAnalysisProvider(): AiAnalysisProvider {
  const primaryProviderId = getConfiguredAiProvider();
  const fallbackProviderIds = getConfiguredAiFallbackProviders();
  const primaryProvider = createAiAnalysisProviderById(primaryProviderId);
  const fallbackProviders = fallbackProviderIds.map(createAiAnalysisProviderById);

  if (!fallbackProviders.length) {
    return primaryProvider;
  }

  return new FallbackAiAnalysisProvider(primaryProvider, fallbackProviders);
}

function createAiAnalysisProviderById(provider: ReturnType<typeof getConfiguredAiProvider>): AiAnalysisProvider {
  switch (provider) {
    case 'ollama':
      return new OllamaAiAnalysisProvider();
    case 'groq':
      return new OpenAiCompatibleAiAnalysisProvider({
        provider: 'groq',
        model: getProviderModel('groq'),
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: getCloudAiApiKey('groq'),
        apiKeyEnvName: getAiProviderRuntimeConfig('groq').missingEnv[0] ?? 'GROQ_API_KEY',
        confidence: 0.83,
      });
    case 'openrouter':
      return new OpenAiCompatibleAiAnalysisProvider({
        provider: 'openrouter',
        model: getProviderModel('openrouter'),
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: getCloudAiApiKey('openrouter'),
        apiKeyEnvName:
          getAiProviderRuntimeConfig('openrouter').missingEnv[0] ?? 'OPENROUTER_API_KEY',
        confidence: 0.83,
        headers: {
          'HTTP-Referer': 'https://vensight.local',
          'X-Title': 'Vensight',
        },
      });
    case 'google':
      return new GoogleAiAnalysisProvider();
    default:
      return new MockAiAnalysisProvider();
  }
}

class FallbackAiAnalysisProvider implements AiAnalysisProvider {
  readonly config;

  constructor(
    private readonly primaryProvider: AiAnalysisProvider,
    private readonly fallbackProviders: AiAnalysisProvider[],
  ) {
    this.config = primaryProvider.config;
  }

  normalizeUrl(url: string): string {
    return this.primaryProvider.normalizeUrl(url);
  }

  async analyzeUrl(
    url: string,
    source?: AiAnalysisSource,
  ): Promise<AiAnalysisResult> {
    const providers = [this.primaryProvider, ...this.fallbackProviders];
    let lastError: unknown;

    for (const provider of providers) {
      try {
        return await provider.analyzeUrl(url, source);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('AI analysis failed for every configured provider.');
  }
}
