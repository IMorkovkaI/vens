import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AiAnalysisResult,
  AiProviderCheckResult,
} from '../../../core/ai-analysis/ai-analysis.models';
import { AiAnalysisService } from '../../../core/ai-analysis/ai-analysis.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';

@Component({
  selector: 'app-ai-analysis-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page-hero page-hero-media hero-bg-dashboard-app">
      <div class="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <a routerLink="/dashboard" class="return-link focus-ring">
          Back to dashboard
        </a>
        <p class="mt-6 eyebrow">AI analysis</p>
        <h1 class="mt-3 text-4xl font-semibold text-slate-950">Analyze a company URL</h1>
        <p class="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Generate a cached company profile from a URL, review the result, and create a listing.
        </p>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[420px_1fr] lg:px-8">
      @if (!authService.canManageListings()) {
        <div class="status-warning p-6 lg:col-span-2">
          <h2 class="text-lg font-semibold text-slate-950">Developer access required</h2>
          <p class="mt-2 text-sm leading-6 text-slate-700">
            Your role can inspect the dashboard, but only developers and admins can run AI analysis or create listings.
          </p>
        </div>
      } @else {
        <div class="space-y-6">
          <form class="surface-card p-6" (ngSubmit)="analyze()">
            <h2 class="text-xl font-semibold text-slate-950">URL input</h2>
            <label class="mt-5 block">
              <span class="text-sm font-semibold text-slate-900">Company URL</span>
              <input
                class="form-input"
                type="url"
                name="url"
                [ngModel]="url()"
                (ngModelChange)="url.set($event)"
                placeholder="https://company.com"
              />
            </label>

            @if (errorMessage()) {
              <div class="mt-5 status-error" role="alert">
                {{ errorMessage() }}
              </div>
            }

            @if (successMessage()) {
              <div class="mt-5 status-success">
                {{ successMessage() }}
              </div>
            }

            <button
              type="submit"
              class="mt-6 w-full btn-primary focus-ring"
              [disabled]="isAnalyzing()"
            >
              {{ isAnalyzing() ? 'Analyzing...' : 'Analyze URL' }}
            </button>
            <button
              type="button"
              class="mt-3 w-full btn-secondary focus-ring"
              [disabled]="isCheckingProvider()"
              (click)="checkProvider()"
            >
              {{ isCheckingProvider() ? 'Validating provider...' : 'Validate provider' }}
            </button>
          </form>

          @if (providerCheckResult()) {
            <article
              class="surface-card p-6"
              [class.status-error]="!providerCheckResult()?.success"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="eyebrow">
                    {{ providerCheckResult()?.success ? 'Provider ready' : 'Provider issue' }}
                  </p>
                  <h2 class="mt-2 text-xl font-semibold text-slate-950">
                    {{ providerCheckResult()?.provider }} diagnostics
                  </h2>
                </div>
                <span class="pill">
                  {{ providerCheckResult()?.fromCache ? 'Cached' : 'Live' }}
                </span>
              </div>

              <dl class="mt-5 grid gap-3 text-sm">
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-semibold text-slate-500">Model</dt>
                  <dd class="text-right font-semibold text-slate-950">
                    {{ providerCheckResult()?.model }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-semibold text-slate-500">URL</dt>
                  <dd class="break-all text-right font-semibold text-slate-950">
                    {{ providerCheckResult()?.normalizedUrl || 'Invalid URL' }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-semibold text-slate-500">Duration</dt>
                  <dd class="font-semibold text-slate-950">
                    {{ providerCheckResult()?.durationMs }}ms
                  </dd>
                </div>
              </dl>

              @if (providerCheckResult()?.error) {
                <p class="mt-4 text-sm leading-6 text-red-700">
                  {{ providerCheckResult()?.error }}
                </p>
              } @else if (providerCheckResult()?.profilePreview) {
                <div class="mt-5 surface-muted p-4">
                  <p class="text-sm font-semibold text-slate-950">
                    {{ providerCheckResult()?.profilePreview?.name }}
                  </p>
                  <p class="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {{ providerCheckResult()?.profilePreview?.aiSummary }}
                  </p>
                </div>
              }
            </article>
          }

          <div class="surface-card p-6">
            <h2 class="text-xl font-semibold text-slate-950">Recent analyses</h2>
            @if (isLoadingRecent()) {
              <p class="mt-4 text-sm text-slate-600">Loading cached analyses...</p>
            } @else if (!recentAnalyses().length) {
              <p class="mt-4 text-sm text-slate-600">No cached analyses yet.</p>
            } @else {
              <div class="mt-4 space-y-3">
                @for (analysis of recentAnalyses(); track analysis.url) {
                  <button
                    type="button"
                    class="category-tile w-full text-left text-sm focus-ring"
                    (click)="selectAnalysis(analysis)"
                  >
                    <span class="block font-semibold text-slate-950">{{ analysis.formData.name }}</span>
                    <span class="mt-1 block text-slate-600">{{ analysis.hostname }}</span>
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <div>
          @if (!analysisResult()) {
            <div class="empty-state p-10">
              <h2 class="text-xl font-semibold text-slate-950">Analysis preview</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Enter a company URL to generate a provider-backed profile. Results are cached by normalized URL.
              </p>
            </div>
          } @else {
            <article class="surface-card insight-panel">
              <div class="border-b border-slate-200 p-6">
                <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p class="eyebrow">
                      {{ analysisResult()?.fromCache ? 'Cached result' : 'New analysis' }}
                    </p>
                    <h2 class="mt-2 text-3xl font-semibold text-slate-950">
                      {{ analysisResult()?.formData?.name }}
                    </h2>
                    <p class="mt-2 text-sm text-slate-600">{{ analysisResult()?.url }}</p>
                  </div>
                  <button
                    type="button"
                    class="btn-primary focus-ring px-4 py-2"
                    [disabled]="isCreating() || createdCompany() !== null"
                    (click)="createListing()"
                  >
                    {{ isCreating() ? 'Creating...' : createdCompany() ? 'Listing created' : 'Create listing' }}
                  </button>
                </div>
              </div>

              <div class="grid gap-6 p-6">
                <section>
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h3>
                  <p class="mt-2 text-base leading-7 text-slate-700">
                    {{ analysisResult()?.formData?.description }}
                  </p>
                </section>

                <section>
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">AI summary</h3>
                  <p class="insight-quote mt-2 text-base leading-7">
                    {{ analysisResult()?.formData?.aiSummary }}
                  </p>
                </section>

                <section>
                  <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">SEO description</h3>
                  <p class="mt-2 text-base leading-7 text-slate-700">
                    {{ analysisResult()?.formData?.seoDescription }}
                  </p>
                </section>

                <section class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Category slug</h3>
                    <p class="mt-2 text-sm font-semibold text-slate-950">
                      {{ analysisResult()?.formData?.categorySlug }}
                    </p>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Tags</h3>
                    <div class="mt-2 flex flex-wrap gap-2">
                      @for (tag of analysisResult()?.formData?.tags ?? []; track tag) {
                        <span class="pill">
                          {{ tag }}
                        </span>
                      }
                    </div>
                  </div>
                </section>

                <section class="grid gap-4 surface-muted p-4 sm:grid-cols-3">
                  <div>
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Provider</h3>
                    <p class="mt-1 text-sm font-semibold text-slate-950">
                      {{ analysisResult()?.provider }}
                    </p>
                  </div>
                  <div>
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Model</h3>
                    <p class="mt-1 text-sm font-semibold text-slate-950">
                      {{ analysisResult()?.model }}
                    </p>
                  </div>
                  <div>
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</h3>
                    <p class="mt-1 text-sm font-semibold text-slate-950">
                      {{ confidenceLabel() }}
                    </p>
                  </div>
                </section>

                @if (analysisResult()?.source) {
                  <section class="surface-muted p-4">
                    <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Source extraction</h3>
                    <div class="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <p>
                        <span class="block font-semibold text-slate-500">Status</span>
                        <span class="mt-1 block font-semibold text-slate-950">
                          {{ analysisResult()?.source?.status }}
                        </span>
                      </p>
                      <p>
                        <span class="block font-semibold text-slate-500">Safety</span>
                        <span class="mt-1 block font-semibold text-slate-950">
                          {{ analysisResult()?.source?.safetyStatus }}
                        </span>
                      </p>
                      <p>
                        <span class="block font-semibold text-slate-500">Characters</span>
                        <span class="mt-1 block font-semibold text-slate-950">
                          {{ analysisResult()?.source?.extractedCharacters ?? 0 }}
                        </span>
                      </p>
                    </div>
                    @if (analysisResult()?.source?.title) {
                      <p class="mt-3 text-sm leading-6 text-slate-700">
                        {{ analysisResult()?.source?.title }}
                      </p>
                    }
                    @if (analysisResult()?.source?.warnings?.length) {
                      <p class="mt-3 text-sm leading-6 text-slate-600">
                        {{ analysisResult()?.source?.warnings?.join(' ') }}
                      </p>
                    }
                  </section>
                }

                @if (createdCompany()) {
                  <div class="status-success">
                    Created listing for {{ createdCompany()?.name }}.
                    <a [routerLink]="['/companies', createdCompany()?.slug]" class="font-semibold underline">
                      View public profile
                    </a>
                  </div>
                }
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class AiAnalysisPageComponent implements OnInit {
  protected readonly url = signal('');
  protected readonly analysisResult = signal<AiAnalysisResult | null>(null);
  protected readonly providerCheckResult = signal<AiProviderCheckResult | null>(null);
  protected readonly recentAnalyses = signal<AiAnalysisResult[]>([]);
  protected readonly createdCompany = signal<Company | null>(null);
  protected readonly isAnalyzing = signal(false);
  protected readonly isCheckingProvider = signal(false);
  protected readonly isCreating = signal(false);
  protected readonly isLoadingRecent = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  constructor(
    protected readonly authService: AuthService,
    private readonly aiAnalysisService: AiAnalysisService,
    private readonly companyDirectory: CompanyDirectoryService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const url = this.route.snapshot.queryParamMap.get('url');

    if (url) {
      this.url.set(url);
    }

    this.loadRecentAnalyses();
  }

  protected analyze(): void {
    if (!this.authService.canManageListings()) {
      return;
    }

    this.isAnalyzing.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.createdCompany.set(null);

    this.aiAnalysisService.analyzeUrl(this.url()).subscribe({
      next: (result) => {
        this.analysisResult.set(result);
        this.successMessage.set(
          result.fromCache ? 'Loaded a cached analysis.' : 'Generated a new AI analysis.',
        );
        this.isAnalyzing.set(false);
        this.loadRecentAnalyses();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message || 'Analysis failed.');
        this.isAnalyzing.set(false);
      },
    });
  }

  protected checkProvider(): void {
    if (!this.authService.canManageListings()) {
      return;
    }

    this.isCheckingProvider.set(true);
    this.providerCheckResult.set(null);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.aiAnalysisService.checkSelectedProvider(this.url()).subscribe({
      next: (result) => {
        this.providerCheckResult.set(result);
        this.isCheckingProvider.set(false);

        if (result.success) {
          this.successMessage.set(
            result.fromCache
              ? 'Provider check reused a cached analysis.'
              : 'Provider check completed successfully.',
          );
          this.loadRecentAnalyses();
          return;
        }

        this.errorMessage.set(result.error || 'Provider diagnostics failed.');
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message || 'Provider diagnostics failed.');
        this.isCheckingProvider.set(false);
      },
    });
  }

  protected createListing(): void {
    const analysis = this.analysisResult();

    if (!analysis || !this.authService.canManageListings()) {
      return;
    }

    this.isCreating.set(true);
    this.errorMessage.set('');

    this.companyDirectory.createCompany(analysis.formData).subscribe({
      next: (company) => {
        this.createdCompany.set(company);
        this.isCreating.set(false);
      },
      error: () => {
        this.errorMessage.set('Listing could not be created.');
        this.isCreating.set(false);
      },
    });
  }

  protected selectAnalysis(analysis: AiAnalysisResult): void {
    this.url.set(analysis.url);
    this.analysisResult.set({
      ...analysis,
      fromCache: true,
    });
    this.createdCompany.set(null);
    this.successMessage.set('Loaded a cached analysis.');
    this.errorMessage.set('');
  }

  protected confidenceLabel(): string {
    const confidence = this.analysisResult()?.confidence;

    if (typeof confidence !== 'number') {
      return 'Pending';
    }

    return `${Math.round(confidence * 100)}%`;
  }

  private loadRecentAnalyses(): void {
    this.isLoadingRecent.set(true);

    this.aiAnalysisService.getRecentAnalyses().subscribe({
      next: (analyses) => {
        this.recentAnalyses.set(analyses);
        this.isLoadingRecent.set(false);
      },
      error: () => {
        this.recentAnalyses.set([]);
        this.isLoadingRecent.set(false);
      },
    });
  }
}
