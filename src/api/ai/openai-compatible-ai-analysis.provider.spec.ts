import { describe, expect, it, vi } from 'vitest';
import { AiAnalysisSource } from './ai-analysis.types';
import { OpenAiCompatibleAiAnalysisProvider } from './openai-compatible-ai-analysis.provider';

describe('OpenAI-compatible AI analysis provider', () => {
  const source: AiAnalysisSource = {
    contentAware: true,
    status: 'extracted',
    safetyStatus: 'https',
    url: 'https://groq-labs.example/path',
    title: 'Groq Labs Healthcare AI',
    metaDescription: 'Groq Labs supports clinical and pharmaceutical AI analysis.',
    headings: ['Clinical AI analysis'],
    textSnippets: ['Groq Labs supports clinical and pharmaceutical AI analysis workflows.'],
    schemaTypes: ['Organization'],
    schemaSummaries: ['type=Organization; name=Groq Labs'],
    reviewSignals: [],
    extractedCharacters: 67,
    warnings: [],
  };

  it('generates a profile through a chat completions API', async () => {
    const fetchMock = vi.fn(async () =>
      createJsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: 'Groq Labs',
                description: 'Groq Labs helps teams generate cloud AI profiles.',
                categorySlug: 'ai-tools',
                tags: ['Cloud AI', 'Profile generation'],
                aiSummary: 'Groq Labs is positioned around fast cloud AI analysis.',
                seoDescription: 'Explore Groq Labs on Vensight.',
              }),
            },
          },
        ],
      }),
    );
    const fetchImpl = fetchMock as unknown as typeof fetch;
    const provider = new OpenAiCompatibleAiAnalysisProvider({
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: 'test-key',
      apiKeyEnvName: 'GROQ_API_KEY',
      confidence: 0.83,
      fetchImpl,
    });

    const result = await provider.analyzeUrl('groq-labs.example/path?utm=1', source);
    const requestBody = JSON.parse(
      ((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body as string,
    ) as { messages: Array<{ content: string }> };

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
    expect(requestBody.messages[1]?.content).toContain('Extracted page evidence');
    expect(requestBody.messages[1]?.content).toContain('pharmaceutical AI analysis');
    expect(result).toMatchObject({
      url: 'https://groq-labs.example/path',
      hostname: 'groq-labs.example',
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      confidence: 0.83,
      formData: {
        name: 'Groq Labs',
        website: 'https://groq-labs.example/path',
        tags: ['Cloud AI', 'Profile generation'],
      },
      source: {
        status: 'extracted',
        safetyStatus: 'https',
      },
    });
  });

  it('rejects missing API keys before making a provider request', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const provider = new OpenAiCompatibleAiAnalysisProvider({
      provider: 'openrouter',
      model: 'qwen/qwen-2.5-7b-instruct:free',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: '',
      apiKeyEnvName: 'OPENROUTER_API_KEY',
      confidence: 0.83,
      fetchImpl,
    });

    await expect(provider.analyzeUrl('missing-key.example')).rejects.toThrow(
      'OPENROUTER_API_KEY is required for openrouter analysis.',
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

function createJsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}
