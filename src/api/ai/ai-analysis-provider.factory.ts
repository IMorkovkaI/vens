import { AiAnalysisProvider } from './ai-analysis.types';
import {
  getAiProviderRuntimeConfig,
  getCloudAiApiKey,
  getConfiguredAiProvider,
  getProviderModel,
} from '../environment/backend-config';
import { GoogleAiAnalysisProvider } from './google-ai-analysis.provider';
import { MockAiAnalysisProvider } from './mock-ai-analysis.provider';
import { OpenAiCompatibleAiAnalysisProvider } from './openai-compatible-ai-analysis.provider';
import { OllamaAiAnalysisProvider } from './ollama-ai-analysis.provider';

export function createAiAnalysisProvider(): AiAnalysisProvider {
  const provider = getConfiguredAiProvider();

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
