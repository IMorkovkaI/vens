import { describe, expect, it, vi } from 'vitest';
import { AiAnalysisSource } from './ai-analysis.types';
import { GoogleAiAnalysisProvider } from './google-ai-analysis.provider';

describe('Google AI analysis provider', () => {
  const source: AiAnalysisSource = {
    contentAware: true,
    status: 'extracted',
    safetyStatus: 'https',
    url: 'https://gemini-labs.example',
    title: 'Gemini Labs Pharma Intelligence',
    metaDescription: 'Gemini Labs supports pharmaceutical market intelligence.',
    headings: ['Pharma intelligence'],
    textSnippets: ['Gemini Labs supports pharmaceutical market intelligence teams.'],
    schemaTypes: ['Organization'],
    schemaSummaries: ['type=Organization; name=Gemini Labs'],
    reviewSignals: [],
    extractedCharacters: 60,
    warnings: [],
  };

  it('generates a profile through Gemini generateContent', async () => {
    const fetchMock = vi.fn(async () =>
      createJsonResponse({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    name: 'Gemini Labs',
                    description: 'Gemini Labs helps teams generate Google AI profiles.',
                    categorySlug: 'ai-tools',
                    tags: ['Gemini', 'Business profiles'],
                    aiSummary: 'Gemini Labs is positioned around Google AI analysis.',
                    seoDescription: 'Explore Gemini Labs on Vensight.',
                  }),
                },
              ],
            },
          },
        ],
      }),
    );
    const fetchImpl = fetchMock as unknown as typeof fetch;
    const provider = new GoogleAiAnalysisProvider({
      apiKey: 'test-google-key',
      baseUrl: 'https://google.test/v1beta',
      model: 'gemini-2.5-flash',
      fetchImpl,
    });

    const result = await provider.analyzeUrl('gemini-labs.example', source);
    const requestBody = JSON.parse(
      ((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body as string,
    ) as { contents: Array<{ parts: Array<{ text: string }> }> };

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://google.test/v1beta/models/gemini-2.5-flash:generateContent',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-goog-api-key': 'test-google-key',
        }),
      }),
    );
    expect(requestBody.contents[0]?.parts[0]?.text).toContain('Extracted page evidence');
    expect(requestBody.contents[0]?.parts[0]?.text).toContain('pharmaceutical market');
    expect(result).toMatchObject({
      url: 'https://gemini-labs.example',
      hostname: 'gemini-labs.example',
      provider: 'google',
      model: 'gemini-2.5-flash',
      confidence: 0.84,
      formData: {
        name: 'Gemini Labs',
        website: 'https://gemini-labs.example',
        tags: ['Gemini', 'Business profiles'],
      },
      source: {
        status: 'extracted',
        safetyStatus: 'https',
      },
    });
  });

  it('rejects missing API keys before making a provider request', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const provider = new GoogleAiAnalysisProvider({
      apiKey: '',
      fetchImpl,
    });

    await expect(provider.analyzeUrl('missing-google-key.example')).rejects.toThrow(
      'GOOGLE_AI_API_KEY is required for google analysis.',
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
