import { describe, expect, it, vi } from 'vitest';
import { AiAnalysisSource } from './ai-analysis.types';
import { OllamaAiAnalysisProvider } from './ollama-ai-analysis.provider';

describe('Ollama AI analysis provider', () => {
  const source: AiAnalysisSource = {
    contentAware: true,
    status: 'extracted',
    safetyStatus: 'https',
    url: 'https://ollama-labs.example/path',
    title: 'Ollama Labs Oncology AI',
    metaDescription: 'Ollama Labs supports oncology AI analysis.',
    headings: ['Oncology AI'],
    textSnippets: ['Ollama Labs supports oncology AI analysis for research teams.'],
    schemaTypes: ['Organization'],
    schemaSummaries: ['type=Organization; name=Ollama Labs'],
    reviewSignals: [],
    extractedCharacters: 61,
    warnings: [],
  };

  it('generates a company profile through Ollama JSON output', async () => {
    const fetchMock = vi.fn(async () =>
      createJsonResponse({
        response: JSON.stringify({
          name: 'Ollama Labs',
          description: 'Ollama Labs helps teams test local AI profile generation.',
          categorySlug: 'ai-tools',
          tags: ['Local AI', 'Directory automation'],
          aiSummary: 'Ollama Labs is positioned around local AI analysis workflows.',
          seoDescription: 'Explore Ollama Labs, a local AI tooling company on Vensight.',
        }),
      }),
    );
    const fetchImpl = fetchMock as unknown as typeof fetch;
    const provider = new OllamaAiAnalysisProvider({
      baseUrl: 'http://ollama.test',
      model: 'qwen2.5:7b',
      fetchImpl,
    });

    const result = await provider.analyzeUrl('ollama-labs.example/path?utm=source', source);
    const requestBody = JSON.parse(
      ((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body as string,
    ) as { prompt: string };

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://ollama.test/api/generate',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(requestBody.prompt).toContain('Extracted page evidence');
    expect(requestBody.prompt).toContain('oncology AI analysis');
    expect(result).toMatchObject({
      url: 'https://ollama-labs.example/path',
      hostname: 'ollama-labs.example',
      provider: 'ollama',
      model: 'qwen2.5:7b',
      confidence: 0.82,
      fromCache: false,
      formData: {
        name: 'Ollama Labs',
        website: 'https://ollama-labs.example/path',
        categorySlug: 'ai-tools',
        tags: ['Local AI', 'Directory automation'],
      },
      source: {
        status: 'extracted',
        safetyStatus: 'https',
      },
    });
  });

  it('uses deterministic seed fields when optional Ollama fields are missing', async () => {
    const fetchImpl = vi.fn(async () =>
      createJsonResponse({
        response: JSON.stringify({
          name: 'Partial Profile',
          tags: [],
        }),
      }),
    ) as unknown as typeof fetch;
    const provider = new OllamaAiAnalysisProvider({
      fetchImpl,
    });

    const result = await provider.analyzeUrl('partial-profile.example');

    expect(result.formData.name).toBe('Partial Profile');
    expect(result.formData.website).toBe('https://partial-profile.example');
    expect(result.formData.description).toContain('Partial Profile');
    expect(result.formData.tags.length).toBeGreaterThan(0);
  });

  it('returns a setup-focused error when Ollama is unavailable', async () => {
    const fetchImpl = vi.fn(async () => createJsonResponse({}, false)) as unknown as typeof fetch;
    const provider = new OllamaAiAnalysisProvider({
      baseUrl: 'http://ollama.test',
      model: 'qwen2.5:7b',
      fetchImpl,
    });

    await expect(provider.analyzeUrl('unavailable.example')).rejects.toThrow(
      'Ollama analysis failed. Ensure Ollama is running at http://ollama.test and model qwen2.5:7b is available.',
    );
  });
});

function createJsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}
