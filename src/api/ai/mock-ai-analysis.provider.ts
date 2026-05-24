import { CompanyFormData } from '../../app/core/company-directory/company-directory.models';
import {
  DIRECTORY_CATEGORY_SLUGS,
} from '../../app/core/company-directory/company-taxonomy';
import {
  AiAnalysisProvider,
  AiAnalysisResult,
  AiAnalysisSource,
  AiProviderConfig,
} from './ai-analysis.types';

const DEFAULT_MOCK_CONFIDENCE = 0.85;

export class MockAiAnalysisProvider implements AiAnalysisProvider {
  readonly config: AiProviderConfig = {
    provider: 'mock',
    model: 'mock-qwen2.5-7b-profile-generator',
    confidence: DEFAULT_MOCK_CONFIDENCE,
  };

  analyzeUrl(url: string, source?: AiAnalysisSource): AiAnalysisResult {
    const normalizedUrl = this.normalizeUrl(url);

    if (!normalizedUrl) {
      throw new Error('Enter a valid company URL.');
    }

    const parsedUrl = new URL(normalizedUrl);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    const brandName = source?.title
      ? this.cleanBrandName(source.title)
      : this.createBrandName(hostname);
    const categorySlug = this.pickCategory(hostname, source);
    const tags = this.pickTags(categorySlug, hostname);
    const evidenceSummary = this.createEvidenceSummary(source, brandName, categorySlug, tags);
    const formData: CompanyFormData = {
      name: brandName,
      website: normalizedUrl,
      categorySlug,
      tags,
      description: evidenceSummary.description,
      aiSummary: evidenceSummary.aiSummary,
      seoDescription: `Explore ${brandName}, a ${this.describeCategory(
        categorySlug,
      )} company analyzed by Vensight for category, positioning, tags, and SEO-ready business context.`,
    };

    return {
      url: normalizedUrl,
      hostname,
      formData,
      createdAt: new Date().toISOString(),
      fromCache: false,
      provider: this.config.provider,
      model: this.config.model,
      confidence: this.config.confidence,
      source,
    };
  }

  normalizeUrl(url: string): string {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return '';
    }

    const withProtocol = /^https?:\/\//i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    try {
      const parsedUrl = new URL(withProtocol);

      if (!parsedUrl.hostname.includes('.')) {
        return '';
      }

      parsedUrl.hash = '';
      parsedUrl.search = '';

      return parsedUrl.toString().replace(/\/$/, '');
    } catch {
      return '';
    }
  }

  private createBrandName(hostname: string): string {
    const baseName = hostname.split('.')[0] || 'company';

    return baseName
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ');
  }

  private cleanBrandName(title: string): string {
    return (
      title
        .split(/[|–-]/)[0]
        ?.trim()
        .replace(/\s+/g, ' ')
        .slice(0, 80) || 'Company'
    );
  }

  private pickCategory(hostname: string, source?: AiAnalysisSource): string {
    const evidence = [
      hostname,
      source?.title ?? '',
      source?.metaDescription ?? '',
      ...(source?.headings ?? []),
      ...(source?.textSnippets ?? []),
      ...(source?.schemaSummaries ?? []),
    ]
      .join(' ')
      .toLowerCase();
    const keywordCategory = this.pickKeywordCategory(evidence);

    if (keywordCategory) {
      return keywordCategory;
    }

    const categorySlugs = DIRECTORY_CATEGORY_SLUGS;
    const score = this.score(hostname);

    return categorySlugs[score % categorySlugs.length];
  }

  private pickKeywordCategory(evidence: string): string {
    const keywordMap: Array<[string, string[]]> = [
      ['biotech-pharma', ['pharma', 'pharmaceutical', 'drug', 'medicine', 'clinical trial', 'biotech']],
      ['healthtech', ['healthcare', 'medical', 'patient', 'clinic', 'therapy']],
      ['ecommerce', ['ecommerce', 'commerce', 'shop', 'retail', 'checkout']],
      ['cybersecurity', ['security', 'cyber', 'threat', 'risk management']],
      ['developer-tools', ['developer', 'api', 'sdk', 'infrastructure']],
      ['productivity', ['productivity', 'workflow', 'collaboration']],
      ['marketing', ['marketing', 'campaign', 'brand', 'seo']],
      ['education', ['education', 'learning', 'student', 'course']],
      ['legaltech', ['legal', 'contract', 'compliance']],
      ['hrtech', ['hr', 'hiring', 'recruiting', 'employee']],
      ['logistics', ['logistics', 'shipping', 'supply chain']],
      ['real-estate', ['real estate', 'property', 'housing']],
      ['media', ['media', 'publishing', 'content']],
      ['fintech', ['finance', 'payment', 'banking', 'invoice']],
      ['analytics', ['analytics', 'dashboard', 'metrics', 'reporting']],
      ['agencies', ['agency', 'studio', 'consultancy']],
      ['ai-tools', ['artificial intelligence', 'machine learning', 'ai ']],
    ];

    return keywordMap.find(([, keywords]) => keywords.some((keyword) => evidence.includes(keyword)))?.[0] ?? '';
  }

  private pickTags(categorySlug: string, hostname: string): string[] {
    const tagMap: Record<string, string[]> = {
      'ai-tools': ['AI analysis', 'Automation', 'Business intelligence'],
      fintech: ['Financial operations', 'Forecasting', 'Risk insights'],
      agencies: ['Positioning', 'Conversion', 'Growth strategy'],
      analytics: ['Dashboards', 'Product metrics', 'Reporting'],
      healthtech: ['Healthcare', 'Patient experience', 'Care operations'],
      'biotech-pharma': ['Pharmaceuticals', 'Clinical research', 'Drug development'],
      ecommerce: ['Online retail', 'Checkout', 'Merchandising'],
      cybersecurity: ['Security operations', 'Threat intelligence', 'Risk'],
      'developer-tools': ['APIs', 'Developer workflow', 'Infrastructure'],
      productivity: ['Collaboration', 'Workflow', 'Team operations'],
      marketing: ['Campaigns', 'Brand growth', 'SEO'],
      education: ['Learning', 'Courses', 'Student experience'],
      consumer: ['Consumer services', 'Digital experience', 'Lifestyle'],
      'enterprise-software': ['Enterprise software', 'Operations', 'Workflow'],
      logistics: ['Supply chain', 'Shipping', 'Operations'],
      'real-estate': ['Property', 'Listings', 'Housing'],
      legaltech: ['Legal operations', 'Contracts', 'Compliance'],
      hrtech: ['Hiring', 'People operations', 'Employee experience'],
      media: ['Publishing', 'Audience', 'Content'],
      other: ['Business operations', 'Positioning', 'Market context'],
    };
    const tags = tagMap[categorySlug] ?? tagMap['ai-tools'];

    if (hostname.includes('data')) {
      return ['Data enrichment', ...tags.slice(0, 2)];
    }

    return tags;
  }

  private describeCategory(categorySlug: string): string {
    const labels: Record<string, string> = {
      'ai-tools': 'AI tools',
      fintech: 'fintech',
      agencies: 'agency',
      analytics: 'analytics',
      healthtech: 'healthtech',
      'biotech-pharma': 'biotech and pharma',
      ecommerce: 'e-commerce',
      cybersecurity: 'cybersecurity',
      'developer-tools': 'developer tools',
      productivity: 'productivity',
      marketing: 'marketing',
      education: 'education',
      consumer: 'consumer',
      'enterprise-software': 'enterprise software',
      logistics: 'logistics',
      'real-estate': 'real estate',
      legaltech: 'legaltech',
      hrtech: 'HR technology',
      media: 'media',
      other: 'business',
    };

    return labels[categorySlug] ?? 'business software';
  }

  private createEvidenceSummary(
    source: AiAnalysisSource | undefined,
    brandName: string,
    categorySlug: string,
    tags: string[],
  ): Pick<CompanyFormData, 'description' | 'aiSummary'> {
    const sourceText =
      source?.metaDescription ||
      source?.textSnippets[0] ||
      source?.schemaSummaries[0] ||
      '';

    if (source?.status === 'extracted' && sourceText) {
      return {
        description: sourceText.slice(0, 220),
        aiSummary: `${brandName} appears positioned as a ${this.describeCategory(
          categorySlug,
        )} company based on extracted page signals including ${tags
          .slice(0, 2)
          .join(' and ')
          .toLowerCase()}.`,
      };
    }

    return {
      description: `${brandName} helps business teams understand market signals, customer needs, and operational priorities from a single web presence.`,
      aiSummary: `${brandName} appears positioned as a ${this.describeCategory(
        categorySlug,
      )} company with messaging that points toward ${tags[0].toLowerCase()} and ${tags[1].toLowerCase()} workflows. Page content was limited during analysis.`,
    };
  }

  private score(value: string): number {
    return value.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  }
}
