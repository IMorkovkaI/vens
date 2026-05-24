import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { AiAnalysisSource } from './ai-analysis.types';

const MAX_HTML_BYTES = 512_000;
const MAX_SNIPPET_TEXT = 5_000;
const FETCH_TIMEOUT_MS = 6_000;
const MAX_REDIRECTS = 5;

export class AnalysisUrlValidationError extends Error {
  constructor(
    message: string,
    readonly safetyStatus: AiAnalysisSource['safetyStatus'],
    readonly normalizedUrl = '',
  ) {
    super(message);
  }
}

interface ExtractPageContentOptions {
  fetchImpl?: typeof fetch;
  resolveHostname?: (hostname: string) => Promise<string[]>;
  timeoutMs?: number;
}

interface JsonLdSummary {
  types: string[];
  summaries: string[];
  reviews: string[];
}

export async function extractPageContent(
  rawUrl: string,
  options: ExtractPageContentOptions = {},
): Promise<AiAnalysisSource> {
  const normalizedUrl = normalizeHttpsAnalysisUrl(rawUrl);
  const parsedUrl = new URL(normalizedUrl);
  const warnings: string[] = [];

  try {
    await assertPublicHostname(parsedUrl.hostname, options.resolveHostname);
  } catch (error) {
    if (error instanceof AnalysisUrlValidationError) {
      throw error;
    }

    warnings.push('Page host could not be verified before fetching.');

    return createUnavailableSource(normalizedUrl, 'fetch-failed', warnings);
  }

  try {
    const response = await fetchWithValidatedRedirects(
      normalizedUrl,
      options.fetchImpl ?? fetch,
      options.resolveHostname,
      options.timeoutMs ?? FETCH_TIMEOUT_MS,
    );
    const contentType = response.headers.get('content-type') ?? '';
    const contentLength = Number(response.headers.get('content-length') ?? 0);

    if (!response.ok) {
      warnings.push(`Page returned HTTP ${response.status}.`);
      return createUnavailableSource(normalizedUrl, 'fetch-failed', warnings);
    }

    if (contentLength > MAX_HTML_BYTES) {
      warnings.push('Page is too large for safe static extraction.');
      return createUnavailableSource(normalizedUrl, 'fetch-failed', warnings);
    }

    if (contentType && !contentType.toLowerCase().includes('html')) {
      warnings.push('Page did not return HTML content.');
      return createUnavailableSource(normalizedUrl, 'fetch-failed', warnings);
    }

    const html = await readResponseTextWithLimit(response, MAX_HTML_BYTES);
    const extracted = extractStaticSignals(html);
    const textSnippets = createTextSnippets(extracted.visibleText);
    const source: AiAnalysisSource = {
      contentAware: true,
      status: textSnippets.length || extracted.title ? 'extracted' : 'unavailable',
      safetyStatus: 'https',
      url: normalizedUrl,
      finalUrl: response.url || normalizedUrl,
      title: extracted.title,
      metaDescription: extracted.metaDescription,
      headings: extracted.headings,
      textSnippets,
      schemaTypes: extracted.jsonLd.types,
      schemaSummaries: extracted.jsonLd.summaries,
      reviewSignals: extracted.jsonLd.reviews,
      extractedCharacters: textSnippets.join(' ').length,
      warnings,
    };

    if (html.length >= MAX_HTML_BYTES) {
      source.warnings.push('Page content was truncated before extraction.');
    }

    if (source.status === 'unavailable') {
      source.warnings.push('No useful static content was found.');
    }

    return source;
  } catch (error) {
    if (error instanceof AnalysisUrlValidationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Page could not be fetched.';

    warnings.push(message);
    return createUnavailableSource(normalizedUrl, 'fetch-failed', warnings);
  }
}

export function normalizeHttpsAnalysisUrl(rawUrl: string): string {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    throw new AnalysisUrlValidationError('Enter a valid company URL.', 'unsafe');
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(withProtocol);
  } catch {
    throw new AnalysisUrlValidationError('Enter a valid company URL.', 'unsafe');
  }

  if (parsedUrl.protocol === 'http:') {
    parsedUrl.hash = '';
    parsedUrl.search = '';

    throw new AnalysisUrlValidationError(
      'Use an HTTPS URL so Vensight can analyze the page safely.',
      'http-warning',
      parsedUrl.toString().replace(/\/$/, ''),
    );
  }

  if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname.includes('.')) {
    throw new AnalysisUrlValidationError('Enter a valid HTTPS company URL.', 'unsafe');
  }

  assertSafeHostnameShape(parsedUrl.hostname);
  parsedUrl.hash = '';
  parsedUrl.search = '';

  return parsedUrl.toString().replace(/\/$/, '');
}

async function assertPublicHostname(
  hostname: string,
  resolveHostname = defaultResolveHostname,
): Promise<void> {
  assertSafeHostnameShape(hostname);

  const literalIp = isIP(hostname);

  if (literalIp && isPrivateAddress(hostname)) {
    throw new AnalysisUrlValidationError('Enter a public HTTPS company URL.', 'unsafe');
  }

  if (literalIp) {
    return;
  }

  const addresses = await resolveHostname(hostname);

  if (!addresses.length || addresses.some(isPrivateAddress)) {
    throw new AnalysisUrlValidationError('Enter a public HTTPS company URL.', 'unsafe');
  }
}

function assertSafeHostnameShape(hostname: string): void {
  const normalizedHostname = hostname.toLowerCase();

  if (
    normalizedHostname === 'localhost' ||
    normalizedHostname.endsWith('.localhost') ||
    normalizedHostname.endsWith('.local') ||
    normalizedHostname.endsWith('.internal') ||
    normalizedHostname.endsWith('.test')
  ) {
    throw new AnalysisUrlValidationError('Enter a public HTTPS company URL.', 'unsafe');
  }
}

async function defaultResolveHostname(hostname: string): Promise<string[]> {
  const addresses = await lookup(hostname, { all: true, verbatim: false });

  return addresses.map((address) => address.address);
}

function isPrivateAddress(address: string): boolean {
  if (address.includes(':')) {
    const normalized = address.toLowerCase();

    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
    );
  }

  const octets = address.split('.').map(Number);

  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) {
    return true;
  }

  const [first = 0, second = 0] = octets;

  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first === 0
  );
}

async function fetchWithValidatedRedirects(
  url: string,
  fetchImpl: typeof fetch,
  resolveHostname: ExtractPageContentOptions['resolveHostname'],
  timeoutMs: number,
): Promise<Response> {
  let currentUrl = url;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const parsedUrl = new URL(currentUrl);
    await assertPublicHostname(parsedUrl.hostname, resolveHostname);

    const response = await fetchWithTimeout(currentUrl, fetchImpl, timeoutMs);

    if (!isRedirectResponse(response.status)) {
      return response;
    }

    const location = response.headers.get('location');

    if (!location) {
      return response;
    }

    currentUrl = normalizeHttpsAnalysisUrl(new URL(location, currentUrl).toString());
  }

  throw new Error('Page redirected too many times.');
}

async function fetchWithTimeout(
  url: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'VensightBot/0.1 (+https://vensight.local)',
      },
      redirect: 'manual',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseTextWithLimit(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    const text = await response.text();

    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new Error('Page is too large for safe static extraction.');
    }

    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    receivedBytes += value.byteLength;

    if (receivedBytes > maxBytes) {
      await reader.cancel();
      throw new Error('Page is too large for safe static extraction.');
    }

    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());

  return chunks.join('');
}

function isRedirectResponse(status: number): boolean {
  return status >= 300 && status < 400;
}

function createUnavailableSource(
  url: string,
  safetyStatus: AiAnalysisSource['safetyStatus'],
  warnings: string[],
): AiAnalysisSource {
  return {
    contentAware: true,
    status: 'unavailable',
    safetyStatus,
    url,
    headings: [],
    textSnippets: [],
    schemaTypes: [],
    schemaSummaries: [],
    reviewSignals: [],
    extractedCharacters: 0,
    warnings,
  };
}

function extractStaticSignals(html: string): {
  title?: string;
  metaDescription?: string;
  headings: string[];
  visibleText: string;
  jsonLd: JsonLdSummary;
} {
  return {
    title: cleanText(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i)),
    metaDescription: readMetaContent(html, 'description'),
    headings: extractHeadings(html),
    visibleText: extractVisibleText(html),
    jsonLd: extractJsonLd(html),
  };
}

function readMetaContent(html: string, name: string): string | undefined {
  const escapedName = escapeRegExp(name);
  const patterns = [
    new RegExp(
      `<meta[^>]+name=["']${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+property=["']og:${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escapedName}["'][^>]*>`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${escapedName}["'][^>]*>`,
      'i',
    ),
  ];

  for (const pattern of patterns) {
    const value = cleanText(firstMatch(html, pattern));

    if (value) {
      return value;
    }
  }

  return undefined;
}

function extractHeadings(html: string): string[] {
  return unique(
    [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
      .map((match) => cleanText(stripTags(match[1] ?? '')))
      .filter(Boolean),
  ).slice(0, 12);
}

function extractVisibleText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  return cleanText(stripTags(withoutScripts));
}

function createTextSnippets(visibleText: string): string[] {
  const sentences = visibleText
    .split(/(?<=[.!?])\s+|\n+/)
    .map(cleanText)
    .filter((sentence) => sentence.length >= 40 && sentence.length <= 420);
  const snippets = unique(sentences).slice(0, 12);
  const joinedSnippets: string[] = [];
  let totalLength = 0;

  for (const snippet of snippets) {
    if (totalLength + snippet.length > MAX_SNIPPET_TEXT) {
      break;
    }

    joinedSnippets.push(snippet);
    totalLength += snippet.length;
  }

  return joinedSnippets;
}

function extractJsonLd(html: string): JsonLdSummary {
  const summaries: string[] = [];
  const reviews: string[] = [];
  const types: string[] = [];

  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const rawJson = decodeHtml(match[1] ?? '').trim();

    try {
      collectJsonLd(JSON.parse(rawJson), types, summaries, reviews);
    } catch {
      // Ignore invalid embedded schema blocks.
    }
  }

  return {
    types: unique(types).slice(0, 10),
    summaries: unique(summaries).slice(0, 12),
    reviews: unique(reviews).slice(0, 8),
  };
}

function collectJsonLd(
  value: unknown,
  types: string[],
  summaries: string[],
  reviews: string[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonLd(item, types, summaries, reviews));
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  const record = value as Record<string, unknown>;

  if (Array.isArray(record['@graph'])) {
    record['@graph'].forEach((item) => collectJsonLd(item, types, summaries, reviews));
  }

  const typeValues = Array.isArray(record['@type']) ? record['@type'] : [record['@type']];
  const cleanTypes = typeValues.filter((type): type is string => typeof type === 'string');
  types.push(...cleanTypes);

  const name = cleanValue(record['name']);
  const description = cleanValue(record['description']);
  const industry = cleanValue(record['industry']);
  const medicalSpecialty = cleanValue(record['medicalSpecialty']);

  if (name || description || industry || medicalSpecialty) {
    summaries.push(
      [
        cleanTypes.length ? `type=${cleanTypes.join('/')}` : '',
        name ? `name=${name}` : '',
        industry ? `industry=${industry}` : '',
        medicalSpecialty ? `medicalSpecialty=${medicalSpecialty}` : '',
        description ? `description=${description}` : '',
      ]
        .filter(Boolean)
        .join('; '),
    );
  }

  collectReviewSignals(record, reviews);

  for (const nestedKey of ['brand', 'manufacturer', 'offers', 'review', 'aggregateRating']) {
    collectJsonLd(record[nestedKey], types, summaries, reviews);
  }
}

function collectReviewSignals(record: Record<string, unknown>, reviews: string[]): void {
  const rating = record['aggregateRating'];

  if (rating && typeof rating === 'object') {
    const ratingRecord = rating as Record<string, unknown>;
    const ratingValue = cleanValue(ratingRecord['ratingValue']);
    const reviewCount = cleanValue(ratingRecord['reviewCount'] ?? ratingRecord['ratingCount']);

    if (ratingValue || reviewCount) {
      reviews.push(
        `aggregateRating=${ratingValue || 'unknown'} reviewCount=${reviewCount || 'unknown'}`,
      );
    }
  }

  const review = record['review'];
  const reviewItems = Array.isArray(review) ? review : [review];

  for (const item of reviewItems) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const reviewRecord = item as Record<string, unknown>;
    const body = cleanValue(reviewRecord['reviewBody']);
    const author =
      typeof reviewRecord['author'] === 'object'
        ? cleanValue((reviewRecord['author'] as Record<string, unknown>)['name'])
        : cleanValue(reviewRecord['author']);

    if (body) {
      reviews.push([author ? `author=${author}` : '', `review=${body}`].filter(Boolean).join('; '));
    }
  }
}

function cleanValue(value: unknown): string {
  if (typeof value === 'number') {
    return String(value);
  }

  return typeof value === 'string' ? cleanText(value).slice(0, 300) : '';
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' '));
}

function cleanText(value: string | undefined): string {
  return decodeHtml(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function firstMatch(value: string, pattern: RegExp): string | undefined {
  return value.match(pattern)?.[1];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
