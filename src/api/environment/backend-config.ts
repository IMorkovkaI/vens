import './load-env';
import { AiProviderId } from '../ai/ai-analysis.types';

export type CloudAiProviderId = Extract<AiProviderId, 'groq' | 'openrouter' | 'google'>;

export interface AiProviderRuntimeConfig {
  provider: AiProviderId;
  model: string;
  configured: boolean;
  missingEnv: string[];
}

export interface BackendRuntimeStatus {
  database: {
    runtimeConfigured: boolean;
    directConfigured: boolean;
  };
  http: {
    allowedOrigins: string[];
    apiOnly: boolean;
  };
  session: {
    configured: boolean;
  };
  ai: {
    selectedProvider: AiProviderId;
    fallbackProviders: AiProviderId[];
    providers: Record<AiProviderId, AiProviderRuntimeConfig>;
  };
  search: {
    selectedProvider: string;
    fallbackProvider?: string;
    providers: Record<string, { configured: boolean; missingEnv: string[] }>;
  };
}

const DEFAULT_MODELS: Record<AiProviderId, string> = {
  mock: 'mock-qwen2.5-7b-profile-generator',
  ollama: 'qwen2.5:7b',
  groq: 'llama-3.1-8b-instant',
  openrouter: 'qwen/qwen-2.5-7b-instruct:free',
  google: 'gemini-2.5-flash',
};

const MODEL_ENV_NAMES: Partial<Record<AiProviderId, string>> = {
  ollama: 'OLLAMA_MODEL',
  groq: 'GROQ_MODEL',
  openrouter: 'OPENROUTER_MODEL',
  google: 'GOOGLE_MODEL',
};

const REQUIRED_ENV_NAMES: Record<AiProviderId, string[]> = {
  mock: [],
  ollama: ['OLLAMA_BASE_URL'],
  groq: ['GROQ_API_KEY'],
  openrouter: ['OPENROUTER_API_KEY'],
  google: ['GOOGLE_AI_API_KEY'],
};

export function getBackendRuntimeStatus(): BackendRuntimeStatus {
  return {
    database: {
      runtimeConfigured: hasEnvValue('DATABASE_URL'),
      directConfigured: hasEnvValue('DIRECT_URL'),
    },
    http: {
      allowedOrigins: getAllowedOrigins(),
      apiOnly: isApiOnlyMode(),
    },
    session: {
      configured: hasEnvValue('SESSION_SECRET'),
    },
    ai: {
      selectedProvider: getConfiguredAiProvider(),
      fallbackProviders: getConfiguredAiFallbackProviders(),
      providers: {
        mock: getAiProviderRuntimeConfig('mock'),
        ollama: getAiProviderRuntimeConfig('ollama'),
        groq: getAiProviderRuntimeConfig('groq'),
        openrouter: getAiProviderRuntimeConfig('openrouter'),
        google: getAiProviderRuntimeConfig('google'),
      },
    },
    search: {
      selectedProvider: getSearchProvider(),
      fallbackProvider: getSearchFallbackProvider(),
      providers: {
        searchapi: getSearchProviderRuntimeConfig('searchapi'),
        tavily: getSearchProviderRuntimeConfig('tavily'),
      },
    },
  };
}

export function getConfiguredAiProvider(): AiProviderId {
  const provider = process.env['AI_PROVIDER']?.trim().toLowerCase();

  if (isAiProviderId(provider)) {
    return provider;
  }

  return 'mock';
}

export function getConfiguredAiFallbackProviders(): AiProviderId[] {
  const primaryProvider = getConfiguredAiProvider();
  const configuredProviders = (process.env['AI_FALLBACK_PROVIDERS'] ?? '')
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter(isAiProviderId);
  const uniqueProviders = new Set<AiProviderId>();

  for (const provider of configuredProviders) {
    if (provider !== primaryProvider) {
      uniqueProviders.add(provider);
    }
  }

  return [...uniqueProviders];
}

export function getAiProviderRuntimeConfig(provider: AiProviderId): AiProviderRuntimeConfig {
  const missingEnv = getMissingEnv(provider);

  return {
    provider,
    model: getProviderModel(provider),
    configured: missingEnv.length === 0,
    missingEnv,
  };
}

export function getProviderModel(provider: AiProviderId): string {
  const modelEnvName = MODEL_ENV_NAMES[provider];
  const model = modelEnvName ? process.env[modelEnvName]?.trim() : '';

  return model || DEFAULT_MODELS[provider];
}

export function getCloudAiApiKey(provider: CloudAiProviderId): string | undefined {
  const envName = REQUIRED_ENV_NAMES[provider][0];

  return process.env[envName]?.trim() || undefined;
}

export function getAllowedOrigins(): string[] {
  return (process.env['ALLOWED_ORIGINS'] ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isApiOnlyMode(): boolean {
  return process.env['API_ONLY']?.trim().toLowerCase() === 'true';
}

function getMissingEnv(provider: AiProviderId): string[] {
  return REQUIRED_ENV_NAMES[provider].filter((envName) => !hasEnvValue(envName));
}

function hasEnvValue(envName: string): boolean {
  return Boolean(process.env[envName]?.trim());
}

function isAiProviderId(provider: string | undefined): provider is AiProviderId {
  return (
    provider === 'mock' ||
    provider === 'ollama' ||
    provider === 'groq' ||
    provider === 'openrouter' ||
    provider === 'google'
  );
}

function getSearchProvider(): string {
  const provider = process.env['SEARCH_PROVIDER']?.trim().toLowerCase();

  if (provider === 'disabled' || provider === 'off' || provider === 'none') {
    return 'disabled';
  }

  if (provider === 'tavily') {
    return provider;
  }

  return 'searchapi';
}

function getSearchFallbackProvider(): string | undefined {
  const provider = process.env['SEARCH_FALLBACK_PROVIDER']?.trim().toLowerCase();

  if (provider === 'searchapi' || provider === 'tavily') {
    return provider;
  }

  return undefined;
}

function getSearchProviderRuntimeConfig(provider: 'searchapi' | 'tavily'): {
  configured: boolean;
  missingEnv: string[];
} {
  const requiredEnv = getSearchProviderRequiredEnv(provider);
  const missingEnv = requiredEnv.filter((envName) => !hasEnvValue(envName));

  return {
    configured: missingEnv.length === 0,
    missingEnv,
  };
}

function getSearchProviderRequiredEnv(
  provider: 'searchapi' | 'tavily',
): string[] {
  if (provider === 'searchapi') {
    return ['SEARCH_API_KEY'];
  }

  return ['TAVILY_API_KEY'];
}
