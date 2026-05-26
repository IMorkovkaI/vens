import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { DiscoverySearchResult } from '../../../core/discovery/discovery.models';
import { DiscoveryService } from '../../../core/discovery/discovery.service';

@Component({
  selector: 'app-discovery-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page-hero page-hero-media hero-bg-dashboard-app">
      <div class="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <a routerLink="/dashboard" class="return-link focus-ring">
          Back to dashboard
        </a>
        <p class="mt-6 eyebrow">Discovery</p>
        <h1 class="mt-3 text-4xl font-semibold text-slate-950">Find listing candidates</h1>
        <p class="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Find public company websites, inspect the source, then send the best match into AI analysis before creating a listing.
        </p>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[420px_1fr] lg:px-8">
      @if (!authService.canUseContributorTools()) {
        <div class="status-warning p-6 lg:col-span-2">
          <h2 class="text-lg font-semibold text-slate-950">Sign in required</h2>
          <p class="mt-2 text-sm leading-6 text-slate-700">
            Registered accounts can run one discovery search per day. Developers and admins can search without the daily contributor limit.
          </p>
        </div>
      } @else {
        <aside class="space-y-6">
          <form class="surface-card p-6" (ngSubmit)="search()">
            <h2 class="text-xl font-semibold text-slate-950">Find companies</h2>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              Use natural search terms. Registered accounts get one search per day; developer and admin accounts can review candidates without that limit.
            </p>
            <label class="mt-5 block">
              <span class="text-sm font-semibold text-slate-900">What are you looking for?</span>
              <input
                class="form-input"
                name="query"
                [ngModel]="query()"
                (ngModelChange)="query.set($event)"
                placeholder="biotech companies, B2B SaaS tools, legaltech startups"
              />
            </label>
            <label class="mt-4 block">
              <span class="text-sm font-semibold text-slate-900">Industry focus</span>
              <input
                class="form-input"
                name="category"
                [ngModel]="category()"
                (ngModelChange)="category.set($event)"
                placeholder="biotech pharma"
              />
            </label>
            <label class="mt-4 block">
              <span class="text-sm font-semibold text-slate-900">Market or region</span>
              <input
                class="form-input"
                name="location"
                [ngModel]="location()"
                (ngModelChange)="location.set($event)"
                placeholder="Europe"
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
              [disabled]="isSearching()"
            >
              {{ isSearching() ? 'Searching...' : 'Search companies' }}
            </button>
          </form>

          <article class="surface-card p-6">
            <h2 class="text-xl font-semibold text-slate-950">Search availability</h2>
            @if (!providerEntries().length) {
              <p class="mt-4 text-sm leading-6 text-slate-600">
                Search checks public web results from the configured discovery source. Availability appears after a search.
              </p>
            } @else {
              <div class="mt-4 space-y-3">
                @for (entry of providerEntries(); track entry.name) {
                  <div class="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white/70 p-3">
                    <span class="text-sm font-semibold text-slate-950">{{ providerLabel(entry.name) }}</span>
                    <span class="pill" [class.pill-outline]="entry.configured">
                      {{ entry.configured ? 'Available' : 'Not enabled' }}
                    </span>
                  </div>
                }
              </div>
            }
          </article>
        </aside>

        <div class="space-y-6">
          <article class="surface-card">
            <div class="border-b border-slate-200 p-5">
              <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 class="text-xl font-semibold text-slate-950">Search results</h2>
                  <p class="mt-1 text-sm text-slate-600">
                    Search never creates listings directly. Open the source when you want to verify it, or analyze the URL when it looks relevant.
                  </p>
                </div>
                <span class="pill">{{ results().length }} results</span>
              </div>
            </div>

            @if (isSearching()) {
              <div class="grid gap-4 p-5 md:grid-cols-2">
                @for (item of loadingCards; track item) {
                  <div class="h-36 skeleton"></div>
                }
              </div>
            } @else if (!hasSearched()) {
              <div class="empty-state m-5 p-10">
                <h3 class="text-lg font-semibold text-slate-950">Start with a search</h3>
                <p class="mt-2 text-sm leading-6 text-slate-600">
                  Use a specific industry, company type, or region to find better candidate websites.
                </p>
              </div>
            } @else if (!results().length) {
              <div class="empty-state m-5 p-10">
                <h3 class="text-lg font-semibold text-slate-950">No candidates found</h3>
                <p class="mt-2 text-sm leading-6 text-slate-600">
                  Try a broader query or enable a search source before testing discovery again.
                </p>
              </div>
            } @else {
              <div class="grid gap-4 p-5 md:grid-cols-2">
                @for (result of results(); track result.url) {
                  <article class="surface-card p-5">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-semibold text-slate-950">{{ result.title }}</p>
                        <p class="mt-1 break-all text-xs font-semibold text-slate-500">
                          {{ result.displayUrl || result.url }}
                        </p>
                      </div>
                      <span class="pill">{{ result.provider }}</span>
                    </div>
                    <p class="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                      {{ result.snippet || 'No snippet returned by provider.' }}
                    </p>
                    <div class="mt-5 flex flex-wrap gap-3">
                      <a [href]="result.url" target="_blank" rel="noopener noreferrer" class="btn-subtle focus-ring px-3 py-2">
                        Open source
                      </a>
                      <button
                        type="button"
                        class="btn-primary focus-ring px-3 py-2"
                        (click)="analyzeResult(result)"
                      >
                        Analyze URL
                      </button>
                    </div>
                  </article>
                }
              </div>
            }
          </article>
        </div>
      }
    </section>
  `,
})
export class DiscoveryPageComponent {
  protected readonly query = signal('');
  protected readonly category = signal('');
  protected readonly location = signal('');
  protected readonly results = signal<DiscoverySearchResult[]>([]);
  protected readonly providers = signal<Record<string, { configured: boolean }>>({});
  protected readonly isSearching = signal(false);
  protected readonly hasSearched = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly loadingCards = [1, 2, 3, 4];
  protected readonly providerEntries = computed(() =>
    Object.entries(this.providers()).map(([name, status]) => ({
      name,
      configured: status.configured,
    })),
  );

  constructor(
    protected readonly authService: AuthService,
    private readonly discoveryService: DiscoveryService,
    private readonly router: Router,
  ) {}

  protected search(): void {
    if (!this.authService.canUseContributorTools()) {
      return;
    }

    this.isSearching.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.discoveryService
      .search({
        query: this.query(),
        category: this.category(),
        location: this.location(),
        limit: 6,
      })
      .subscribe({
        next: (response) => {
          this.results.set(response.results);
          this.providers.set(response.providers);
          this.hasSearched.set(true);
          this.isSearching.set(false);
          this.successMessage.set(`Found ${response.results.length} candidate URLs.`);
        },
        error: (error: Error) => {
          this.results.set([]);
          this.hasSearched.set(true);
          this.errorMessage.set(error.message || 'Discovery search failed.');
          this.isSearching.set(false);
        },
      });
  }

  protected analyzeResult(result: DiscoverySearchResult): void {
    void this.router.navigate(['/dashboard/ai-analysis'], {
      queryParams: { url: result.url },
    });
  }

  protected providerLabel(provider: string): string {
    if (provider === 'searchapi') {
      return 'Public web search';
    }

    if (provider === 'tavily') {
      return 'Fallback web search';
    }

    return provider;
  }
}
