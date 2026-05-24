import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Observable, catchError, delay, map, of, throwError } from 'rxjs';
import { ApiDataResponse } from '../api/api-response.models';
import { AuthService } from '../auth/auth.service';
import {
  DiscoveryCandidate,
  DiscoveryCandidateStatus,
  DiscoverySearchForm,
  DiscoverySearchResponse,
  DiscoverySearchResult,
} from './discovery.models';

const DISCOVERY_STORAGE_KEY = 'vensight.discovery.candidates';

@Injectable({
  providedIn: 'root',
})
export class DiscoveryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly localCandidates = signal<DiscoveryCandidate[]>(this.restoreCandidates());

  search(form: DiscoverySearchForm): Observable<DiscoverySearchResponse> {
    const query = form.query.trim();

    if (query.length < 2) {
      return throwError(() => new Error('Search query must be at least 2 characters.'));
    }

    if (!this.isBrowser) {
      return throwError(() => new Error('Discovery search requires the backend API.'));
    }

    return this.http
      .post<ApiDataResponse<DiscoverySearchResponse>>('/api/discovery/search', form, {
        headers: this.authService.createApiAuthHeaders(),
      })
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(this.getApiError(error, 'Discovery search failed.'))),
        ),
        delay(180),
      );
  }

  listCandidates(): Observable<DiscoveryCandidate[]> {
    if (!this.isBrowser) {
      return of(this.localCandidates()).pipe(delay(120));
    }

    return this.http
      .get<ApiDataResponse<DiscoveryCandidate[]>>('/api/discovery/candidates', {
        headers: this.authService.createApiAuthHeaders(),
      })
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) =>
          error.status === 0 ? of(this.localCandidates()) : of([]),
        ),
        delay(120),
      );
  }

  saveCandidate(result: DiscoverySearchResult): Observable<DiscoveryCandidate> {
    if (!this.isBrowser) {
      return this.saveCandidateLocally(result);
    }

    return this.http
      .post<ApiDataResponse<DiscoveryCandidate>>('/api/discovery/candidates', result, {
        headers: this.authService.createApiAuthHeaders(),
      })
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) =>
          error.status === 0
            ? this.saveCandidateLocally(result)
            : throwError(() =>
                new Error(this.getApiError(error, 'Discovery candidate could not be saved.')),
              ),
        ),
        delay(120),
      );
  }

  updateCandidate(
    candidate: DiscoveryCandidate,
    status: DiscoveryCandidateStatus,
    analysisUrl?: string,
  ): Observable<DiscoveryCandidate> {
    if (!this.isBrowser) {
      return this.updateCandidateLocally(candidate, status, analysisUrl);
    }

    return this.http
      .patch<ApiDataResponse<DiscoveryCandidate>>(
        `/api/discovery/candidates/${candidate.id}`,
        { status, analysisUrl },
        {
          headers: this.authService.createApiAuthHeaders(),
        },
      )
      .pipe(
        map((response) => response.data),
        catchError((error: HttpErrorResponse) =>
          error.status === 0
            ? this.updateCandidateLocally(candidate, status, analysisUrl)
            : throwError(() =>
                new Error(this.getApiError(error, 'Discovery candidate could not be updated.')),
              ),
        ),
        delay(120),
      );
  }

  private saveCandidateLocally(result: DiscoverySearchResult): Observable<DiscoveryCandidate> {
    const existingCandidate = this.localCandidates().find(
      (candidate) => candidate.url === result.url,
    );
    const now = new Date().toISOString();
    const candidate: DiscoveryCandidate = existingCandidate
      ? {
          ...existingCandidate,
          title: result.title,
          snippet: result.snippet,
          provider: result.provider,
          query: result.query,
          updatedAt: now,
        }
      : {
          id: `local-${Date.now()}`,
          url: result.url,
          title: result.title,
          snippet: result.snippet,
          provider: result.provider,
          query: result.query,
          status: 'new',
          createdAt: now,
          updatedAt: now,
        };

    this.persistCandidates([
      candidate,
      ...this.localCandidates().filter((entry) => entry.id !== candidate.id),
    ]);

    return of(candidate).pipe(delay(120));
  }

  private updateCandidateLocally(
    candidate: DiscoveryCandidate,
    status: DiscoveryCandidateStatus,
    analysisUrl?: string,
  ): Observable<DiscoveryCandidate> {
    const updatedCandidate: DiscoveryCandidate = {
      ...candidate,
      status,
      analysisUrl: analysisUrl || candidate.analysisUrl,
      updatedAt: new Date().toISOString(),
    };

    this.persistCandidates(
      this.localCandidates().map((entry) =>
        entry.id === updatedCandidate.id ? updatedCandidate : entry,
      ),
    );

    return of(updatedCandidate).pipe(delay(120));
  }

  private restoreCandidates(): DiscoveryCandidate[] {
    if (!this.isBrowser) {
      return [];
    }

    try {
      return JSON.parse(
        window.localStorage.getItem(DISCOVERY_STORAGE_KEY) ?? '[]',
      ) as DiscoveryCandidate[];
    } catch {
      window.localStorage.removeItem(DISCOVERY_STORAGE_KEY);
      return [];
    }
  }

  private persistCandidates(candidates: DiscoveryCandidate[]): void {
    this.localCandidates.set(candidates);

    if (this.isBrowser) {
      window.localStorage.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(candidates));
    }
  }

  private getApiError(error: HttpErrorResponse, fallback: string): string {
    const apiError = error.error as { error?: string } | undefined;

    return apiError?.error ?? fallback;
  }
}
