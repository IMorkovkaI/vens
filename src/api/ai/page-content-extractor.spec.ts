import { describe, expect, it, vi } from 'vitest';
import {
  AnalysisUrlValidationError,
  extractPageContent,
  normalizeHttpsAnalysisUrl,
} from './page-content-extractor';

const fixtureHtml = `
<!doctype html>
<html>
  <head>
    <title>Acme Pharma - Oncology medicines</title>
    <meta name="description" content="Acme Pharma develops oncology medicines and clinical research programs.">
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Acme Pharma",
        "industry": "Pharmaceuticals",
        "description": "Biopharmaceutical company focused on oncology drug development.",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.7",
          "reviewCount": "128"
        }
      }
    </script>
  </head>
  <body>
    <h1>Oncology drug development</h1>
    <h2>Clinical programs</h2>
    <p>Acme Pharma researches targeted oncology therapies for hospitals and clinical partners.</p>
    <p>Its pipeline includes medicine development, clinical operations, and patient safety monitoring.</p>
  </body>
</html>
`;

describe('page content extractor', () => {
  it('normalizes HTTPS URLs and rejects HTTP URLs with a safe-link warning', () => {
    expect(normalizeHttpsAnalysisUrl('acme.example/products?utm=1#top')).toBe(
      'https://acme.example/products',
    );
    expect(() => normalizeHttpsAnalysisUrl('http://acme.example')).toThrow(
      'Use an HTTPS URL so Vensight can analyze the page safely.',
    );

    try {
      normalizeHttpsAnalysisUrl('http://acme.example');
    } catch (error) {
      expect(error).toBeInstanceOf(AnalysisUrlValidationError);
      expect((error as AnalysisUrlValidationError).safetyStatus).toBe('http-warning');
      expect((error as AnalysisUrlValidationError).normalizedUrl).toBe('http://acme.example');
    }
  });

  it('rejects localhost and private URLs before fetching', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;

    await expect(
      extractPageContent('https://localhost', {
        fetchImpl,
        resolveHostname: async () => ['127.0.0.1'],
      }),
    ).rejects.toThrow('Enter a valid HTTPS company URL.');
    await expect(
      extractPageContent('https://private.example', {
        fetchImpl,
        resolveHostname: async () => ['192.168.1.10'],
      }),
    ).rejects.toThrow('Enter a public HTTPS company URL.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects redirects to private URLs before following them', async () => {
    const fetchImpl = vi.fn(async () =>
      createRedirectResponse('https://private.example'),
    ) as unknown as typeof fetch;

    await expect(
      extractPageContent('https://public.example', {
        fetchImpl,
        resolveHostname: async (hostname) =>
          hostname === 'public.example' ? ['93.184.216.34'] : ['10.0.0.10'],
      }),
    ).rejects.toThrow('Enter a public HTTPS company URL.');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('extracts static text, metadata, schema types, and page-embedded reviews', async () => {
    const fetchImpl = vi.fn(async () => createHtmlResponse(fixtureHtml)) as unknown as typeof fetch;

    const source = await extractPageContent('https://acme.example', {
      fetchImpl,
      resolveHostname: async () => ['93.184.216.34'],
    });

    expect(source).toMatchObject({
      contentAware: true,
      status: 'extracted',
      safetyStatus: 'https',
      url: 'https://acme.example',
      title: 'Acme Pharma - Oncology medicines',
      metaDescription:
        'Acme Pharma develops oncology medicines and clinical research programs.',
      headings: ['Oncology drug development', 'Clinical programs'],
      schemaTypes: expect.arrayContaining(['Organization', 'AggregateRating']),
      reviewSignals: expect.arrayContaining(['aggregateRating=4.7 reviewCount=128']),
    });
    expect(source.textSnippets.join(' ')).toContain('targeted oncology therapies');
    expect(source.extractedCharacters).toBeGreaterThan(40);
  });

  it('returns unavailable source metadata for non-HTML responses', async () => {
    const fetchImpl = vi.fn(async () =>
      createHtmlResponse('{"ok":true}', {
        contentType: 'application/json',
      }),
    ) as unknown as typeof fetch;

    const source = await extractPageContent('https://api.example', {
      fetchImpl,
      resolveHostname: async () => ['93.184.216.34'],
    });

    expect(source).toMatchObject({
      status: 'unavailable',
      safetyStatus: 'fetch-failed',
      extractedCharacters: 0,
    });
    expect(source.warnings).toContain('Page did not return HTML content.');
  });
});

function createHtmlResponse(
  body: string,
  options: { contentType?: string; ok?: boolean } = {},
): Response {
  return {
    ok: options.ok ?? true,
    status: options.ok === false ? 500 : 200,
    url: 'https://acme.example',
    headers: new Headers({
      'content-type': options.contentType ?? 'text/html; charset=utf-8',
      'content-length': String(body.length),
    }),
    text: async () => body,
  } as Response;
}

function createRedirectResponse(location: string): Response {
  return {
    ok: false,
    status: 302,
    url: 'https://public.example',
    headers: new Headers({
      location,
      'content-type': 'text/html; charset=utf-8',
    }),
    text: async () => '',
  } as Response;
}
