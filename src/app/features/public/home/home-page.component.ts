import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Category, Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import { SeoService } from '../../../core/seo/seo.service';
import { CompanyCardComponent } from '../../../shared/company-card/company-card.component';

@Component({
  selector: 'app-home-page',
  imports: [CompanyCardComponent, FormsModule, RouterLink],
  template: `
    <section class="page-hero page-hero-media hero-bg-home">
      <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div class="max-w-3xl">
          <p class="eyebrow">
            Business directory with AI context
          </p>
          <h1 class="mt-5 max-w-4xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            Find sharper company profiles before the next market move.
          </h1>
          <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Vensight organizes startups, agencies, and software companies into searchable profiles with mock AI summaries, categories, and SEO-ready business context.
          </p>
          <form class="hero-search mt-8" (ngSubmit)="submitSearch()">
            <label class="block">
              <span class="sr-only">Search companies</span>
              <input
                class="hero-search-field"
                type="search"
                name="homeSearch"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Search companies, AI tools, agencies, or tags"
              />
            </label>
            <button type="submit" class="btn-primary focus-ring">
              Search directory
            </button>
          </form>

          <div class="mt-4 flex flex-wrap gap-3">
            <a routerLink="/companies" class="btn-subtle focus-ring">
              Browse all
            </a>
            <a routerLink="/categories/ai-tools" class="btn-subtle focus-ring">
              View AI tools
            </a>
          </div>

          <div class="hero-kpi-grid mt-8">
            <div class="hero-kpi">
              <p class="text-2xl font-semibold text-slate-950">{{ allCompanies().length }}+</p>
              <p class="mt-1 text-xs font-semibold text-slate-500">Companies</p>
            </div>
            <div class="hero-kpi">
              <p class="text-2xl font-semibold text-slate-950">{{ categories().length }}+</p>
              <p class="mt-1 text-xs font-semibold text-slate-500">Categories</p>
            </div>
            <div class="hero-kpi">
              <p class="text-2xl font-semibold text-slate-950">{{ aiSummaryCount() }}</p>
              <p class="mt-1 text-xs font-semibold text-slate-500">AI summaries</p>
            </div>
            <div class="hero-kpi">
              <p class="text-2xl font-semibold text-slate-950">Mock</p>
              <p class="mt-1 text-xs font-semibold text-slate-500">AI provider</p>
            </div>
          </div>

          <div class="trust-row mt-8">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Built for discovery teams</p>
            <span class="brand-chip">Founders</span>
            <span class="brand-chip">Agencies</span>
            <span class="brand-chip">Analysts</span>
            <span class="brand-chip">Operators</span>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div class="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p class="eyebrow">Powered by AI</p>
          <h2 class="mt-3 text-3xl font-semibold text-slate-950">Smarter insights, better decisions.</h2>
          <p class="mt-3 max-w-xl text-base leading-7 text-slate-600">
            The analysis workflow sits below the hero so the globe stays visible while the page still shows how Vensight turns URLs into usable business context.
          </p>
        </div>

        <div class="surface-card insight-panel p-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-slate-950">AI analysis preview</p>
              <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Cached mock workflow</p>
            </div>
            <span class="pill-outline">96/100</span>
          </div>
          <div class="mt-6 rounded-md border border-slate-200 bg-white p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Analysis in progress</p>
            <div class="analysis-list mt-4">
              <div>
                <div class="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Company overview</span>
                  <span>92%</span>
                </div>
                <div class="analysis-bar mt-2"><span style="width: 92%"></span></div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Market position</span>
                  <span>86%</span>
                </div>
                <div class="analysis-bar mt-2"><span style="width: 86%"></span></div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-semibold text-slate-600">
                  <span>SEO description</span>
                  <span>94%</span>
                </div>
                <div class="analysis-bar mt-2"><span style="width: 94%"></span></div>
              </div>
            </div>
          </div>
          <dl class="mt-4 grid gap-3 sm:grid-cols-3">
            <div class="data-row">
              <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Input</dt>
              <dd class="mt-1 text-sm font-semibold text-slate-900">URL</dd>
            </div>
            <div class="data-row">
              <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Output</dt>
              <dd class="mt-1 text-sm font-semibold text-slate-900">Profile</dd>
            </div>
            <div class="data-row">
              <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</dt>
              <dd class="mt-1 text-sm font-semibold text-slate-900">Mock AI</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 class="text-2xl font-semibold text-slate-950">Featured companies</h2>
          <p class="mt-2 text-sm text-slate-600">A small starter set showing how public profiles will feel.</p>
        </div>
        <a routerLink="/companies" class="text-link focus-ring">
          See all companies
        </a>
      </div>

      @if (isLoading()) {
        <div class="mt-8 grid gap-5 md:grid-cols-3">
          @for (item of loadingCards; track item) {
            <div class="h-64 skeleton"></div>
          }
        </div>
      } @else if (hasError()) {
        <div class="mt-8 status-error">
          Featured companies could not be loaded.
        </div>
      } @else if (!featuredCompanies().length) {
        <div class="mt-8 empty-state p-8 text-sm text-slate-600">
          No featured companies are available yet.
        </div>
      } @else {
        <div class="mt-8 grid gap-5 md:grid-cols-3">
          @for (company of featuredCompanies(); track company.id) {
            <app-company-card [company]="company" />
          }
        </div>
      }
    </section>

    <section class="section-band">
      <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <h2 class="text-2xl font-semibold text-slate-950">Explore by category</h2>
        <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          @for (category of categories(); track category.id) {
            <a [routerLink]="['/categories', category.slug]" class="category-tile text-sm font-semibold focus-ring">
              <span class="category-icon" aria-hidden="true">{{ category.name.charAt(0) }}</span>
              <span class="mt-4 block">{{ category.name }}</span>
              <span class="mt-1 block text-xs font-medium text-slate-500">
                {{ categoryCompanyCount(category.slug) }} compan{{ categoryCompanyCount(category.slug) === 1 ? 'y' : 'ies' }}
              </span>
            </a>
          }
        </div>
      </div>
    </section>
  `,
})
export class HomePageComponent implements OnInit {
  protected readonly featuredCompanies = signal<Company[]>([]);
  protected readonly allCompanies = signal<Company[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly loadingCards = [1, 2, 3];

  constructor(
    private readonly companyDirectory: CompanyDirectoryService,
    private readonly router: Router,
    private readonly seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.seo.apply({
      title: 'Vensight | AI-assisted company directory',
      description:
        'Explore companies, startups, agencies, and software tools with AI-generated summaries, categories, and SEO-ready business context.',
      canonicalPath: '/',
      imagePath: '/image1.webp',
    });

    this.companyDirectory.getCompanies().subscribe({
      next: (companies) => {
        this.allCompanies.set(companies);
        this.featuredCompanies.set(companies.slice(0, 3));
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });

    this.companyDirectory.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
  }

  protected submitSearch(): void {
    const query = this.searchQuery().trim();

    void this.router.navigate(['/companies'], {
      queryParams: query ? { q: query } : undefined,
    });
  }

  protected aiSummaryCount(): number {
    return this.allCompanies().filter((company) => company.aiSummary).length;
  }

  protected categoryCompanyCount(categorySlug: string): number {
    return this.allCompanies().filter((company) => company.category.slug === categorySlug).length;
  }
}
