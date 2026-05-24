import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { ApiDataResponse } from '../api/api-response.models';
import { AuthService } from '../auth/auth.service';
import {
  Category,
  Company,
  CompanyFormData,
  CompanySearchFilters,
} from './company-directory.models';
import { MOCK_CATEGORIES, MOCK_COMPANIES } from './company-directory.mock-data';

@Injectable({
  providedIn: 'root',
})
export class CompanyDirectoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly companiesState = signal<Company[]>(MOCK_COMPANIES);

  getCategories(): Observable<Category[]> {
    if (!this.isBrowser) {
      return of(MOCK_CATEGORIES);
    }

    return this.http.get<ApiDataResponse<Category[]>>('/api/categories').pipe(
      map((response) => response.data),
      catchError(() => of(MOCK_CATEGORIES)),
    );
  }

  getCategoryBySlug(slug: string): Observable<Category | undefined> {
    return this.getCategories().pipe(
      map((categories) => categories.find((category) => category.slug === slug)),
    );
  }

  getCompanies(): Observable<Company[]> {
    if (!this.isBrowser) {
      return of(this.companiesState());
    }

    return this.http.get<ApiDataResponse<Company[]>>('/api/companies').pipe(
      map((response) => this.mergeLocalCompanies(response.data)),
      catchError(() => of(this.companiesState())),
    );
  }

  getFeaturedCompanies(): Observable<Company[]> {
    return this.getCompanies().pipe(map((companies) => companies.slice(0, 3)));
  }

  getCompanyBySlug(slug: string): Observable<Company | undefined> {
    return this.getCompanies().pipe(
      map((companies) => companies.find((company) => company.slug === slug)),
    );
  }

  getCompaniesByCategory(categorySlug: string): Observable<Company[]> {
    return this.getCompanies().pipe(
      map((companies) =>
        companies.filter((company) => company.category.slug === categorySlug),
      ),
    );
  }

  searchCompanies(filters: CompanySearchFilters): Observable<Company[]> {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return this.getCompanies().pipe(
      map((companies) =>
        companies.filter((company) => {
          const matchesCategory =
            !filters.categorySlug || company.category.slug === filters.categorySlug;
          const matchesQuery =
            !normalizedQuery ||
            [
              company.name,
              company.description,
              company.category.name,
              company.aiSummary,
              ...company.tags,
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery);

          return matchesCategory && matchesQuery;
        }),
      ),
    );
  }

  getSimilarCompanies(company: Company, limit = 3): Observable<Company[]> {
    return this.getCompanies().pipe(
      map((companies) =>
        companies
          .filter(
            (candidate) =>
              candidate.id !== company.id &&
              (candidate.category.slug === company.category.slug ||
                candidate.tags.some((tag) => company.tags.includes(tag))),
          )
          .slice(0, limit),
      ),
    );
  }

  createCompany(formData: CompanyFormData): Observable<Company> {
    if (this.isBrowser) {
      return this.http.post<ApiDataResponse<Company>>('/api/companies', formData, {
        headers: this.authService.createApiAuthHeaders(),
      }).pipe(
        map((response) => response.data),
        tap((company) => this.upsertCompanyState(company)),
        catchError((error: HttpErrorResponse) =>
          error.status === 0
            ? this.createCompanyLocally(formData)
            : throwError(() => new Error(this.getApiError(error, 'Listing could not be created.'))),
        ),
      );
    }

    return this.createCompanyLocally(formData);
  }

  updateCompany(slug: string, formData: CompanyFormData): Observable<Company | undefined> {
    if (this.isBrowser) {
      return this.http.patch<ApiDataResponse<Company>>(`/api/companies/${slug}`, formData, {
        headers: this.authService.createApiAuthHeaders(),
      }).pipe(
        map((response) => response.data),
        tap((company) => this.upsertCompanyState(company)),
        catchError((error: HttpErrorResponse) =>
          error.status === 0
            ? this.updateCompanyLocally(slug, formData)
            : throwError(() => new Error(this.getApiError(error, 'Listing could not be updated.'))),
        ),
      );
    }

    return this.updateCompanyLocally(slug, formData);
  }

  private createCompanyLocally(formData: CompanyFormData): Observable<Company> {
    const category = this.findCategory(formData.categorySlug);
    const slug = this.createUniqueSlug(formData.name);
    const company: Company = {
      id: `cmp-${slug}`,
      slug,
      name: formData.name.trim(),
      description: formData.description.trim(),
      website: formData.website.trim(),
      category,
      tags: formData.tags.map((tag) => tag.trim()).filter(Boolean),
      aiSummary: formData.aiSummary.trim(),
      seoDescription: formData.seoDescription.trim(),
    };

    this.companiesState.update((companies) => [company, ...companies]);

    return of(company);
  }

  private updateCompanyLocally(
    slug: string,
    formData: CompanyFormData,
  ): Observable<Company | undefined> {
    const existingCompany = this.companiesState().find((company) => company.slug === slug);

    if (!existingCompany) {
      return of(undefined);
    }

    const category = this.findCategory(formData.categorySlug);
    const updatedCompany: Company = {
      ...existingCompany,
      name: formData.name.trim(),
      description: formData.description.trim(),
      website: formData.website.trim(),
      category,
      tags: formData.tags.map((tag) => tag.trim()).filter(Boolean),
      aiSummary: formData.aiSummary.trim(),
      seoDescription: formData.seoDescription.trim(),
    };

    this.companiesState.update((companies) =>
      companies.map((company) => (company.slug === slug ? updatedCompany : company)),
    );

    return of(updatedCompany);
  }

  private upsertCompanyState(company: Company): void {
    const existingCompany = this.companiesState().find(
      (candidate) => candidate.slug === company.slug,
    );

    if (!existingCompany) {
      this.companiesState.update((companies) => [company, ...companies]);
      return;
    }

    this.companiesState.update((companies) =>
      companies.map((candidate) => (candidate.slug === company.slug ? company : candidate)),
    );
  }

  private findCategory(categorySlug: string): Category {
    return (
      MOCK_CATEGORIES.find((category) => category.slug === categorySlug) ??
      MOCK_CATEGORIES[0]
    );
  }

  private mergeLocalCompanies(apiCompanies: Company[]): Company[] {
    const seedCompaniesBySlug = new Map(
      MOCK_COMPANIES.map((company) => [company.slug, company]),
    );
    const mergedCompaniesBySlug = new Map(
      apiCompanies.map((company) => [company.slug, company]),
    );

    for (const localCompany of this.companiesState()) {
      const seedCompany = seedCompaniesBySlug.get(localCompany.slug);
      const isCreatedLocally = !seedCompany;
      const isEditedLocally =
        seedCompany && JSON.stringify(seedCompany) !== JSON.stringify(localCompany);

      if (isCreatedLocally || isEditedLocally) {
        mergedCompaniesBySlug.set(localCompany.slug, localCompany);
      }
    }

    return [...mergedCompaniesBySlug.values()];
  }

  private createUniqueSlug(name: string): string {
    const baseSlug =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'company';
    const existingSlugs = new Set(this.companiesState().map((company) => company.slug));

    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let index = 2;
    let candidateSlug = `${baseSlug}-${index}`;

    while (existingSlugs.has(candidateSlug)) {
      index += 1;
      candidateSlug = `${baseSlug}-${index}`;
    }

    return candidateSlug;
  }

  private getApiError(error: HttpErrorResponse, fallback: string): string {
    const apiError = error.error as { error?: string } | undefined;

    return apiError?.error ?? fallback;
  }
}
