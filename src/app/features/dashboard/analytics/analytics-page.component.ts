import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardAnalyticsService } from '../../../core/analytics/dashboard-analytics.service';
import { DirectoryAnalytics } from '../../../core/analytics/dashboard-analytics.models';

@Component({
  selector: 'app-analytics-page',
  imports: [RouterLink],
  template: `
    <section class="page-hero page-hero-media hero-bg-dashboard-app">
      <div class="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <a routerLink="/dashboard" class="return-link focus-ring">
          Back to dashboard
        </a>
        <p class="mt-6 eyebrow">Analytics</p>
        <h1 class="mt-3 text-4xl font-semibold text-slate-950">Directory performance</h1>
        <p class="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Lightweight metrics from the current mock directory data. Advanced analytics stay out of this MVP slice.
        </p>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      @if (isLoading()) {
        <div class="grid gap-4 md:grid-cols-4">
          @for (item of loadingCards; track item) {
            <div class="h-32 skeleton"></div>
          }
        </div>
      } @else if (hasError()) {
        <div class="status-error" role="alert">
          Analytics could not be loaded.
        </div>
      } @else {
        <div class="grid gap-4 md:grid-cols-4">
          <article class="metric-card">
            <p class="text-sm font-medium text-slate-500">Listings</p>
            <p class="mt-2 text-3xl font-semibold text-slate-950">{{ analytics()?.listingCount ?? 0 }}</p>
          </article>
          <article class="metric-card">
            <p class="text-sm font-medium text-slate-500">AI coverage</p>
            <p class="mt-2 text-3xl font-semibold text-slate-950">{{ analytics()?.aiCoverage ?? 0 }}%</p>
          </article>
          <article class="metric-card">
            <p class="text-sm font-medium text-slate-500">SEO readiness</p>
            <p class="mt-2 text-3xl font-semibold text-slate-950">{{ analytics()?.seoReadiness ?? 0 }}%</p>
          </article>
          <article class="metric-card">
            <p class="text-sm font-medium text-slate-500">Categories</p>
            <p class="mt-2 text-3xl font-semibold text-slate-950">{{ analytics()?.categoryCount ?? 0 }}</p>
          </article>
        </div>

        <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <article class="surface-card">
            <div class="border-b border-slate-200 p-5">
              <h2 class="text-xl font-semibold text-slate-950">Category distribution</h2>
              <p class="mt-1 text-sm text-slate-600">How the current listings are spread across public category pages.</p>
            </div>

            @if (!analytics()?.categoryMetrics?.length) {
              <div class="p-8 text-center text-sm text-slate-600">No category data available.</div>
            } @else {
              <div class="divide-y divide-slate-200">
                @for (metric of analytics()?.categoryMetrics ?? []; track metric.name) {
                  <div class="grid gap-3 p-5 sm:grid-cols-[180px_1fr_80px] sm:items-center">
                    <p class="font-semibold text-slate-950">{{ metric.name }}</p>
                    <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div class="progress-fill" [style.width.%]="metric.percentage"></div>
                    </div>
                    <p class="text-sm font-semibold text-slate-700">{{ metric.count }} listing{{ metric.count === 1 ? '' : 's' }}</p>
                  </div>
                }
              </div>
            }
          </article>

          <aside class="surface-card insight-panel p-5">
            <h2 class="text-xl font-semibold text-slate-950">Content quality</h2>
            <dl class="mt-5 space-y-5">
              <div>
                <dt class="text-sm font-medium text-slate-500">Listings with AI summaries</dt>
                <dd class="mt-1 text-2xl font-semibold text-slate-950">{{ analytics()?.aiSummaryCount ?? 0 }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-slate-500">Listings with SEO descriptions</dt>
                <dd class="mt-1 text-2xl font-semibold text-slate-950">{{ analytics()?.seoDescriptionCount ?? 0 }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-slate-500">Average tags per listing</dt>
                <dd class="mt-1 text-2xl font-semibold text-slate-950">{{ analytics()?.averageTags ?? '0.0' }}</dd>
              </div>
            </dl>
          </aside>
        </div>
      }
    </section>
  `,
})
export class AnalyticsPageComponent implements OnInit {
  protected readonly analytics = signal<DirectoryAnalytics | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly loadingCards = [1, 2, 3, 4];

  constructor(private readonly dashboardAnalytics: DashboardAnalyticsService) {}

  ngOnInit(): void {
    this.dashboardAnalytics.getDirectoryAnalytics().subscribe({
      next: (analytics) => {
        this.analytics.set(analytics);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }
}
