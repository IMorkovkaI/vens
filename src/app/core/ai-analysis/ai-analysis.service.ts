import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Observable, catchError, delay, map, of, tap, throwError } from 'rxjs';
import { ApiDataResponse } from '../api/api-response.models';
import { AuthService } from '../auth/auth.service';
import {
  DIRECTORY_CATEGORY_SLUGS,
  getCategoryName,
} from '../company-directory/company-taxonomy';
import { CompanyFormData } from '../company-directory/company-directory.models';
import { AiAnalysisResult, AiProviderCheckResult } from './ai-analysis.models';

const ANALYSIS_STORAGE_KEY = 'vensight.ai.analysis.cache';

@Injectable({
  providedIn: 'root',
})
export class AiAnalysisService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly cacheState = signal<Record<string, AiAnalysisResult>>(this.restoreCache());

  analyzeUrl(url: string): Observable<AiAnalysisResult> {
    const safeLinkWarning = this.getSafeLinkWarning(url);

    if (safeLinkWarning) {
      return throwError(() => new Error(safeLinkWarning));
    }

    const normalizedUrl = this.normalizeUrl(url);

    if (!normalizedUrl) {
      return throwError(() => new Error('Enter a valid company URL.')).pipe(delay(220));
    }

    const cachedAnalysis = this.cacheState()[normalizedUrl];

    if (cachedAnalysis) {
      return of({
        ...cachedAnalysis,
        fromCache: true,
      }).pipe(delay(180));
    }

    if (!this.isBrowser) {
      const result = this.createMockAnalysis(normalizedUrl);
      this.saveResult(result);

      return of(result).pipe(delay(420));
    }

    return this.http
      .post<ApiDataResponse<AiAnalysisResult>>('/api/ai/analyze', {
        url: normalizedUrl,
      }, {
        headers: this.authService.createApiAuthHeaders(),
      })
      .pipe(
        map((response) => response.data),
        tap((result) => this.saveResult(result)),
        catchError((error: HttpErrorResponse) => {
          if (error.status !== 0) {
            return throwError(() => new Error(this.getApiError(error, 'Analysis failed.')));
          }

          const result = this.createMockAnalysis(normalizedUrl);
          this.saveResult(result);

          return of(result);
        }),
        delay(420),
      );
  }

  getCachedAnalysis(url: string): AiAnalysisResult | undefined {
    const normalizedUrl = this.normalizeUrl(url);

    if (!normalizedUrl) {
      return undefined;
    }

    return this.cacheState()[normalizedUrl];
  }

  checkSelectedProvider(url: string): Observable<AiProviderCheckResult> {
    const safeLinkWarning = this.getSafeLinkWarning(url);

    if (safeLinkWarning) {
      return throwError(() => new Error(safeLinkWarning)).pipe(delay(180));
    }

    const normalizedUrl = this.normalizeUrl(url);

    if (!normalizedUrl) {
      return throwError(() => new Error('Enter a valid company URL.')).pipe(delay(180));
    }

    if (!this.isBrowser) {
      return throwError(() => new Error('Provider diagnostics require the backend API.')).pipe(
        delay(180),
      );
    }

    return this.http
      .post<ApiDataResponse<AiProviderCheckResult>>('/api/ai/provider-check', {
        url: normalizedUrl,
      }, {
        headers: this.authService.createApiAuthHeaders(),
      })
      .pipe(
        map((response) => response.data),
        tap((result) => {
          if (result.success && result.profilePreview) {
            this.saveResult(this.createAnalysisFromProviderCheck(result));
          }
        }),
        catchError((error: HttpErrorResponse) => {
          const apiBody = error.error as
            | { data?: AiProviderCheckResult; error?: string }
            | undefined;

          if (apiBody?.data) {
            return of(apiBody.data);
          }

          return throwError(() =>
            new Error(this.getApiError(error, 'Provider diagnostics failed.')),
          );
        }),
        delay(220),
      );
  }

  getRecentAnalyses(): Observable<AiAnalysisResult[]> {
    if (this.isBrowser) {
      return this.http
        .get<ApiDataResponse<AiAnalysisResult[]>>('/api/ai/analyses?limit=10', {
          headers: this.authService.createApiAuthHeaders(),
        })
        .pipe(
          map((response) => response.data),
          tap((analyses) => analyses.forEach((analysis) => this.saveResult(analysis))),
          catchError((error: HttpErrorResponse) =>
            error.status === 0 ? this.getRecentAnalysesLocally() : of([]),
          ),
          delay(120),
        );
    }

    return this.getRecentAnalysesLocally();
  }

  private getRecentAnalysesLocally(): Observable<AiAnalysisResult[]> {
    const analyses = Object.values(this.cacheState()).sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

    return of(analyses).pipe(delay(120));
  }

  private createMockAnalysis(url: string): AiAnalysisResult {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    const brandName = this.createBrandName(hostname);
    const categorySlug = this.pickCategory(hostname);
    const tags = this.pickTags(categorySlug, hostname);
    const formData: CompanyFormData = {
      name: brandName,
      website: url,
      categorySlug,
      tags,
      description: `${brandName} helps business teams understand market signals, customer needs, and operational priorities from a single web presence.`,
      aiSummary: `${brandName} appears positioned as a ${this.describeCategory(
        categorySlug,
      )} company with messaging that points toward ${tags[0].toLowerCase()} and ${tags[1].toLowerCase()} workflows.`,
      seoDescription: `Explore ${brandName}, a ${this.describeCategory(
        categorySlug,
      )} company analyzed by Vensight for category, positioning, tags, and SEO-ready business context.`,
    };

    return {
      url,
      hostname,
      formData,
      createdAt: new Date().toISOString(),
      fromCache: false,
      provider: 'mock',
      model: 'mock-qwen2.5-7b-profile-generator',
      confidence: 0.85,
    };
  }

  private createAnalysisFromProviderCheck(result: AiProviderCheckResult): AiAnalysisResult {
    const preview = result.profilePreview;

    if (!preview || !result.hostname || typeof result.confidence !== 'number') {
      throw new Error('Provider diagnostics returned an incomplete analysis preview.');
    }

    return {
      url: result.normalizedUrl,
      hostname: result.hostname,
      formData: {
        name: preview.name,
        website: result.normalizedUrl,
        categorySlug: preview.categorySlug,
        tags: preview.tags,
        description: preview.description,
        aiSummary: preview.aiSummary,
        seoDescription: preview.seoDescription,
      },
      createdAt: result.createdAt ?? new Date().toISOString(),
      fromCache: result.fromCache,
      provider: result.provider,
      model: result.model,
      confidence: result.confidence,
      source: result.source,
    };
  }

  private saveResult(result: AiAnalysisResult): void {
    const cachedResult = {
      ...result,
      fromCache: false,
    };
    const cache = {
      ...this.cacheState(),
      [result.url]: cachedResult,
    };

    this.cacheState.set(cache);

    if (this.isBrowser) {
      window.localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(cache));
    }
  }

  private restoreCache(): Record<string, AiAnalysisResult> {
    if (!this.isBrowser) {
      return {};
    }

    const storedCache = window.localStorage.getItem(ANALYSIS_STORAGE_KEY);

    if (!storedCache) {
      return {};
    }

    try {
      return JSON.parse(storedCache) as Record<string, AiAnalysisResult>;
    } catch {
      window.localStorage.removeItem(ANALYSIS_STORAGE_KEY);
      return {};
    }
  }

  private normalizeUrl(url: string): string {
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

  private getSafeLinkWarning(url: string): string {
    return /^http:\/\//i.test(url.trim())
      ? 'Use an HTTPS URL so Vensight can analyze the page safely.'
      : '';
  }

  private createBrandName(hostname: string): string {
    const baseName = hostname.split('.')[0] || 'company';

    return baseName
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ');
  }

  private pickCategory(hostname: string): string {
    const score = this.score(hostname);

    return DIRECTORY_CATEGORY_SLUGS[score % DIRECTORY_CATEGORY_SLUGS.length];
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
    return getCategoryName(categorySlug).toLowerCase();
  }

  private score(value: string): number {
    return value.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  }

  private getApiError(error: HttpErrorResponse, fallback: string): string {
    const apiError = error.error as { error?: string } | undefined;

    return apiError?.error ?? fallback;
  }
}
