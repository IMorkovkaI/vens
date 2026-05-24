import { afterEach, describe, expect, it } from 'vitest';
import {
  getAiProviderRuntimeConfig,
  getAllowedOrigins,
  getBackendRuntimeStatus,
  getCloudAiApiKey,
  getConfiguredAiProvider,
  isApiOnlyMode,
  getProviderModel,
} from './backend-config';

const originalEnv = { ...process.env };

describe('backend runtime config', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('defaults to mock provider without exposing secret values', () => {
    delete process.env['AI_PROVIDER'];
    process.env['GROQ_API_KEY'] = 'secret-groq-key';

    const status = getBackendRuntimeStatus();

    expect(getConfiguredAiProvider()).toBe('mock');
    expect(status.ai.selectedProvider).toBe('mock');
    expect(JSON.stringify(status)).not.toContain('secret-groq-key');
  });

  it('reports cloud provider missing env names without reading secrets in routes', () => {
    process.env['AI_PROVIDER'] = 'groq';
    delete process.env['GROQ_API_KEY'];

    expect(getConfiguredAiProvider()).toBe('groq');
    expect(getAiProviderRuntimeConfig('groq')).toMatchObject({
      provider: 'groq',
      configured: false,
      missingEnv: ['GROQ_API_KEY'],
    });
  });

  it('centralizes cloud API key and model lookup for providers', () => {
    process.env['OPENROUTER_API_KEY'] = 'openrouter-secret';
    process.env['OPENROUTER_MODEL'] = 'custom/openrouter-model';

    expect(getCloudAiApiKey('openrouter')).toBe('openrouter-secret');
    expect(getProviderModel('openrouter')).toBe('custom/openrouter-model');
    expect(getAiProviderRuntimeConfig('openrouter')).toMatchObject({
      configured: true,
      missingEnv: [],
      model: 'custom/openrouter-model',
    });
  });

  it('parses allowed API origins from deployment env without secrets', () => {
    process.env['ALLOWED_ORIGINS'] =
      'https://vensight.vercel.app, https://app.vensight.com';

    expect(getAllowedOrigins()).toEqual([
      'https://vensight.vercel.app',
      'https://app.vensight.com',
    ]);
    expect(getBackendRuntimeStatus().http.allowedOrigins).toEqual([
      'https://vensight.vercel.app',
      'https://app.vensight.com',
    ]);
  });

  it('reports API-only backend mode for split deployments', () => {
    process.env['API_ONLY'] = 'true';

    expect(isApiOnlyMode()).toBe(true);
    expect(getBackendRuntimeStatus().http.apiOnly).toBe(true);
  });
});
