import { Company } from '../../app/core/company-directory/company-directory.models';
import { CompetitorComparisonResult } from '../../app/core/competitor-comparison/competitor-comparison.models';

const COMPARISON_MODEL = 'mock-qwen2.5-7b-competitor-comparison';

export class CompetitorComparisonService {
  compareCompanies(leftCompany: Company, rightCompany: Company): CompetitorComparisonResult {
    if (leftCompany.slug === rightCompany.slug) {
      throw new Error('Choose two different companies to compare.');
    }

    const overlappingTags = leftCompany.tags.filter((tag) =>
      rightCompany.tags.some((rightTag) => rightTag.toLowerCase() === tag.toLowerCase()),
    );
    const sharedCategory = leftCompany.category.slug === rightCompany.category.slug;
    const confidence = sharedCategory ? 0.87 : 0.82;

    return {
      leftCompany,
      rightCompany,
      sharedCategory,
      overlappingTags,
      differentiators: [
        {
          companyName: leftCompany.name,
          points: this.createDifferentiators(leftCompany, rightCompany),
        },
        {
          companyName: rightCompany.name,
          points: this.createDifferentiators(rightCompany, leftCompany),
        },
      ],
      summary: this.createSummary(leftCompany, rightCompany, sharedCategory, overlappingTags),
      recommendation: this.createRecommendation(leftCompany, rightCompany, sharedCategory),
      provider: 'mock',
      model: COMPARISON_MODEL,
      confidence,
      createdAt: new Date().toISOString(),
    };
  }

  private createDifferentiators(company: Company, competitor: Company): string[] {
    const uniqueTags = company.tags.filter(
      (tag) =>
        !competitor.tags.some(
          (competitorTag) => competitorTag.toLowerCase() === tag.toLowerCase(),
        ),
    );
    const categoryPoint =
      company.category.slug === competitor.category.slug
        ? `Competes directly inside ${company.category.name}, so positioning clarity matters.`
        : `Operates from ${company.category.name}, giving it a different buying context.`;

    return [
      categoryPoint,
      uniqueTags.length
        ? `Distinct signals include ${uniqueTags.slice(0, 2).join(' and ')}.`
        : 'Most visible tags overlap, so differentiation should come from proof points and audience focus.',
      `${company.name}'s summary emphasizes ${this.firstSentence(company.aiSummary).toLowerCase()}`,
    ];
  }

  private createSummary(
    leftCompany: Company,
    rightCompany: Company,
    sharedCategory: boolean,
    overlappingTags: string[],
  ): string {
    const relationship = sharedCategory
      ? `both sit in ${leftCompany.category.name}`
      : `${leftCompany.name} sits in ${leftCompany.category.name}, while ${rightCompany.name} sits in ${rightCompany.category.name}`;
    const overlap = overlappingTags.length
      ? ` They overlap around ${overlappingTags.slice(0, 2).join(' and ')}.`
      : ' Their tag overlap is limited, which points to different buyer intent.';

    return `${leftCompany.name} and ${rightCompany.name} ${relationship}.${overlap}`;
  }

  private createRecommendation(
    leftCompany: Company,
    rightCompany: Company,
    sharedCategory: boolean,
  ): string {
    if (sharedCategory) {
      return `Compare proof, use cases, and audience fit before choosing between ${leftCompany.name} and ${rightCompany.name}.`;
    }

    return `Treat ${leftCompany.name} and ${rightCompany.name} as adjacent options unless the buyer explicitly needs both category capabilities.`;
  }

  private firstSentence(value: string): string {
    return value.split('.')[0] || value;
  }
}

export const competitorComparisonService = new CompetitorComparisonService();
