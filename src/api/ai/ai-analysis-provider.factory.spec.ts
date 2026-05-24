import { afterEach, describe, expect, it } from 'vitest';
import { createAiAnalysisProvider } from './ai-analysis-provider.factory';
import { GoogleAiAnalysisProvider } from './google-ai-analysis.provider';
import { MockAiAnalysisProvider } from './mock-ai-analysis.provider';
import { OpenAiCompatibleAiAnalysisProvider } from './openai-compatible-ai-analysis.provider';
import { OllamaAiAnalysisProvider } from './ollama-ai-analysis.provider';

const originalAiProvider = process.env['AI_PROVIDER'];

describe('AI analysis provider factory', () => {
  afterEach(() => {
    if (originalAiProvider === undefined) {
      delete process.env['AI_PROVIDER'];
    } else {
      process.env['AI_PROVIDER'] = originalAiProvider;
    }
  });

  it('uses the mock provider by default', () => {
    delete process.env['AI_PROVIDER'];

    expect(createAiAnalysisProvider()).toBeInstanceOf(MockAiAnalysisProvider);
  });

  it('uses the Ollama provider when configured', () => {
    process.env['AI_PROVIDER'] = 'ollama';

    expect(createAiAnalysisProvider()).toBeInstanceOf(OllamaAiAnalysisProvider);
  });

  it('uses OpenAI-compatible providers for Groq and OpenRouter', () => {
    process.env['AI_PROVIDER'] = 'groq';
    expect(createAiAnalysisProvider()).toBeInstanceOf(OpenAiCompatibleAiAnalysisProvider);

    process.env['AI_PROVIDER'] = 'openrouter';
    expect(createAiAnalysisProvider()).toBeInstanceOf(OpenAiCompatibleAiAnalysisProvider);
  });

  it('uses the Google provider when configured', () => {
    process.env['AI_PROVIDER'] = 'google';

    expect(createAiAnalysisProvider()).toBeInstanceOf(GoogleAiAnalysisProvider);
  });

  it('falls back to mock for unsupported provider names', () => {
    process.env['AI_PROVIDER'] = 'unsupported';

    expect(createAiAnalysisProvider()).toBeInstanceOf(MockAiAnalysisProvider);
  });
});
