import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { ApiDataResponse } from '../api/api-response.models';
import { Company } from '../company-directory/company-directory.models';
import { CompanyDirectoryService } from '../company-directory/company-directory.service';
import {
  CompetitorComparisonRequest,
  CompetitorComparisonResult,
} from './competitor-comparison.models';

@Injectable({
  providedIn: 'root',
})
export class CompetitorComparisonService {
  private readonly http = inject(HttpClient);
  private readonly companyDirectory = inject(CompanyDirectoryService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  compareCompanies(
    request: CompetitorComparisonRequest,
  ): Observable<CompetitorComparisonResult> {
    if (request.leftSlug === request.rightSlug) {
      return throwError(() => new Error('Choose two different companies to compare.'));
    }

    if (!this.isBrowser) {
      return this.compareLocally(request);
    }

    return this.http
      .post<ApiDataResponse<CompetitorComparisonResult>>('/api/ai/compare', request)
      .pipe(
        map((response) => response.data),
        catchError(() => this.compareLocally(request)),
      );
  }

  private compareLocally(
    request: CompetitorComparisonRequest,
  ): Observable<CompetitorComparisonResult> {
    return this.companyDirectory.getCompanies().pipe(
      map((companies) => {
        const leftCompany = companies.find((company) => company.slug === request.leftSlug);
        const rightCompany = companies.find((company) => company.slug === request.rightSlug);

        if (!leftCompany || !rightCompany) {
          throw new Error('Both companies must exist before comparison.');
        }

        return this.createMockComparison(leftCompany, rightCompany);
      }),
    );
  }

  private createMockComparison(
    leftCompany: Company,
    rightCompany: Company,
  ): CompetitorComparisonResult {
    const overlappingTags = leftCompany.tags.filter((tag) =>
      rightCompany.tags.some((rightTag) => rightTag.toLowerCase() === tag.toLowerCase()),
    );
    const sharedCategory = leftCompany.category.slug === rightCompany.category.slug;

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
      recommendation: sharedCategory
        ? `Compare proof, use cases, and audience fit before choosing between ${leftCompany.name} and ${rightCompany.name}.`
        : `Treat ${leftCompany.name} and ${rightCompany.name} as adjacent options unless the buyer explicitly needs both category capabilities.`,
      provider: 'mock',
      model: 'mock-qwen2.5-7b-competitor-comparison',
      confidence: sharedCategory ? 0.87 : 0.82,
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

    return [
      company.category.slug === competitor.category.slug
        ? `Competes directly inside ${company.category.name}, so positioning clarity matters.`
        : `Operates from ${company.category.name}, giving it a different buying context.`,
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

  private firstSentence(value: string): string {
    return value.split('.')[0] || value;
  }
}
