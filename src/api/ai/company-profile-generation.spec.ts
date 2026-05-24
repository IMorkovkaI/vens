import { describe, expect, it } from 'vitest';
import { CompanyFormData } from '../../app/core/company-directory/company-directory.models';
import { createCompanyProfilePrompt, mergeGeneratedProfile } from './company-profile-generation';
import { AiAnalysisResult } from './ai-analysis.types';

describe('company profile generation prompt', () => {
  const seedFormData: CompanyFormData = {
    name: 'Acme',
    website: 'https://acme.example',
    categorySlug: 'other',
    tags: ['Business'],
    description: 'Seed description.',
    aiSummary: 'Seed summary.',
    seoDescription: 'Seed SEO.',
  };
  const seedResult: AiAnalysisResult = {
    url: 'https://acme.example',
    hostname: 'acme.example',
    formData: seedFormData,
    createdAt: '2026-05-24T00:00:00.000Z',
    fromCache: false,
    provider: 'mock',
    model: 'mock',
    confidence: 0.85,
    source: {
      contentAware: true,
      status: 'extracted',
      safetyStatus: 'https',
      url: 'https://acme.example',
      title: 'Acme Pharma',
      metaDescription: 'Acme develops oncology medicines.',
      headings: ['Drug development'],
      textSnippets: ['Acme develops oncology medicines for clinical research teams.'],
      schemaTypes: ['Organization'],
      schemaSummaries: ['type=Organization; name=Acme Pharma; industry=Pharmaceuticals'],
      reviewSignals: ['aggregateRating=4.7 reviewCount=128'],
      extractedCharacters: 63,
      warnings: [],
    },
  };

  it('includes extracted page evidence and broad categories in the prompt', () => {
    const prompt = createCompanyProfilePrompt(seedResult);

    expect(prompt).toContain('Use extracted page evidence first');
    expect(prompt).toContain('Acme develops oncology medicines');
    expect(prompt).toContain('biotech-pharma');
    expect(prompt).toContain('aggregateRating=4.7');
  });

  it('accepts broad taxonomy category slugs from generated profiles', () => {
    const profile = mergeGeneratedProfile(seedFormData, {
      categorySlug: 'biotech-pharma',
      tags: ['Drug development'],
    });

    expect(profile.categorySlug).toBe('biotech-pharma');
    expect(profile.tags).toEqual(['Drug development']);
  });
});
