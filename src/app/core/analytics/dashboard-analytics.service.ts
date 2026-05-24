import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { ApiDataResponse } from '../api/api-response.models';
import { CompanyDirectoryService } from '../company-directory/company-directory.service';
import { Company } from '../company-directory/company-directory.models';
import { DirectoryAnalytics } from './dashboard-analytics.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly companyDirectory = inject(CompanyDirectoryService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  getDirectoryAnalytics(): Observable<DirectoryAnalytics> {
    if (!this.isBrowser) {
      return this.getLocalAnalytics();
    }

    return this.http.get<ApiDataResponse<DirectoryAnalytics>>('/api/analytics/directory').pipe(
      map((response) => response.data),
      catchError(() => this.getLocalAnalytics()),
    );
  }

  private getLocalAnalytics(): Observable<DirectoryAnalytics> {
    return this.companyDirectory.getCompanies().pipe(
      map((companies) => this.createAnalytics(companies)),
    );
  }

  private createAnalytics(companies: Company[]): DirectoryAnalytics {
    const listingCount = companies.length;
    const aiSummaryCount = companies.filter((company) => company.aiSummary.trim()).length;
    const seoDescriptionCount = companies.filter((company) =>
      company.seoDescription.trim(),
    ).length;
    const categoryMetrics = this.createCategoryMetrics(companies);

    return {
      listingCount,
      aiSummaryCount,
      seoDescriptionCount,
      aiCoverage: this.percentage(aiSummaryCount, listingCount),
      seoReadiness: this.percentage(seoDescriptionCount, listingCount),
      categoryCount: categoryMetrics.length,
      averageTags: this.averageTags(companies),
      categoryMetrics,
    };
  }

  private createCategoryMetrics(companies: Company[]) {
    const total = companies.length;
    const counts = new Map<string, number>();

    for (const company of companies) {
      counts.set(company.category.name, (counts.get(company.category.name) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([name, count]) => ({
        name,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
      }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  }

  private averageTags(companies: Company[]): string {
    if (!companies.length) {
      return '0.0';
    }

    const tagCount = companies.reduce((total, company) => total + company.tags.length, 0);

    return (tagCount / companies.length).toFixed(1);
  }

  private percentage(count: number, total: number): number {
    if (!total) {
      return 0;
    }

    return Math.round((count / total) * 100);
  }
}
