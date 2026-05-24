import { CompanyFormData } from '../../app/core/company-directory/company-directory.models';
import {
  DIRECTORY_CATEGORY_SLUGS,
  getCategoryName,
  isDirectoryCategorySlug,
} from '../../app/core/company-directory/company-taxonomy';
import { AiAnalysisResult, AiAnalysisSource } from './ai-analysis.types';

export function createCompanyProfilePrompt(seedResult: AiAnalysisResult): string {
  const source = seedResult.source;

  return [
    'You are generating a concise business directory profile for Vensight.',
    'Use extracted page evidence first. Use the deterministic seed only as a fallback when evidence is missing.',
    'Do not invent products, regulated claims, approvals, reviews, ratings, locations, or medical facts that are not supported by the evidence.',
    'If evidence is thin or unavailable, keep the profile cautious and say the site content was limited.',
    'Return valid JSON only with this shape:',
    `{ "name": string, "description": string, "categorySlug": ${JSON.stringify(
      DIRECTORY_CATEGORY_SLUGS,
    )}[number], "tags": string[], "aiSummary": string, "seoDescription": string }`,
    `Allowed categories: ${DIRECTORY_CATEGORY_SLUGS.map(
      (slug) => `${slug} (${getCategoryName(slug)})`,
    ).join(', ')}`,
    `URL: ${seedResult.url}`,
    `Hostname: ${seedResult.hostname}`,
    `Extracted page evidence: ${JSON.stringify(createPromptSourceEvidence(source))}`,
    `Seed profile: ${JSON.stringify(seedResult.formData)}`,
  ].join('\n');
}

export function parseGeneratedProfile(
  responseText: string,
  failureMessage: string,
): Partial<CompanyFormData> {
  const jsonText = extractJsonObject(responseText);

  try {
    return JSON.parse(jsonText) as Partial<CompanyFormData>;
  } catch {
    throw new Error(failureMessage);
  }
}

export function mergeGeneratedProfile(
  seedProfile: CompanyFormData,
  generatedProfile: Partial<CompanyFormData>,
): CompanyFormData {
  return {
    name: cleanText(generatedProfile.name) || seedProfile.name,
    website: seedProfile.website,
    categorySlug: cleanCategorySlug(generatedProfile.categorySlug) || seedProfile.categorySlug,
    tags: cleanTags(generatedProfile.tags, seedProfile.tags),
    description: cleanText(generatedProfile.description) || seedProfile.description,
    aiSummary: cleanText(generatedProfile.aiSummary) || seedProfile.aiSummary,
    seoDescription: cleanText(generatedProfile.seoDescription) || seedProfile.seoDescription,
  };
}

function extractJsonObject(value: string): string {
  const trimmedValue = value.trim();
  const fencedMatch = trimmedValue.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmedValue.indexOf('{');
  const lastBrace = trimmedValue.lastIndexOf('}');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmedValue.slice(firstBrace, lastBrace + 1);
  }

  return trimmedValue;
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanCategorySlug(value: unknown): string {
  const categorySlug = cleanText(value);

  return isDirectoryCategorySlug(categorySlug) ? categorySlug : '';
}

function cleanTags(value: unknown, fallbackTags: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallbackTags;
  }

  const tags = value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);

  return tags.length ? tags : fallbackTags;
}

function createPromptSourceEvidence(
  source: AiAnalysisSource | undefined,
): Record<string, unknown> {
  if (!source) {
    return {
      status: 'unavailable',
      warnings: ['No page content was extracted.'],
    };
  }

  return {
    status: source.status,
    safetyStatus: source.safetyStatus,
    title: source.title,
    metaDescription: source.metaDescription,
    headings: source.headings,
    schemaTypes: source.schemaTypes,
    schemaSummaries: source.schemaSummaries,
    reviewSignals: source.reviewSignals,
    textSnippets: source.textSnippets,
    extractedCharacters: source.extractedCharacters,
    warnings: source.warnings,
  };
}
