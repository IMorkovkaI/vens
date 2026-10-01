import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Category, Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import { SeoService } from '../../../core/seo/seo.service';
import { CompanyCardComponent } from '../../../shared/company-card/company-card.component';

@Component({
  selector: 'app-company-list-page',
  imports: [CompanyCardComponent, FormsModule, RouterLink],
  template: `
    <section class="page-hero">
      <div class="site-container directory-intro">
        <p class="eyebrow">Company listing</p>
        <div class="directory-title-row">
          <div>
            <h1>Browse companies</h1>
            <p class="directory-intro-copy">
              Search the seeded demo directory by company, category, summary, and tags.
            </p>
          </div>
          <a routerLink="/" class="return-link focus-ring"> Back to home </a>
        </div>
      </div>
    </section>

    <section class="page-content">
      <div class="site-container py-8">
        <div class="directory-search-panel">
          <div class="directory-search-row">
            <label class="block">
              <span class="text-sm font-semibold text-slate-900">Search</span>
              <input
                class="form-input"
                type="search"
                [ngModel]="query()"
                (ngModelChange)="onQueryChange($event)"
                placeholder="Search companies, tags, or summaries"
              />
            </label>

            <label class="block">
              <span class="text-sm font-semibold text-slate-900">Category</span>
              <select
                class="form-input"
                [ngModel]="categorySlug()"
                (ngModelChange)="setCategory($event)"
              >
                <option value="">All categories</option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.slug">{{ category.name }}</option>
                }
              </select>
            </label>
          </div>

          <div class="directory-search-meta">
            <p class="text-sm font-semibold text-slate-600">
              @if (!isLoading() && !hasError()) {
                {{ companies().length }} result{{ companies().length === 1 ? '' : 's' }} matched
              } @else {
                Directory results
              }
            </p>
            @if (query() || categorySlug()) {
              <button type="button" class="btn-subtle focus-ring" (click)="clearFilters()">
                Clear filters
              </button>
            }
          </div>
        </div>

        @if (isLoading()) {
          <div class="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            @for (item of loadingCards; track item) {
              <div class="h-72 skeleton"></div>
            }
          </div>
        } @else if (hasError()) {
          <div class="mt-6 status-error" role="alert">
            Companies could not be loaded. Please try again.
          </div>
        } @else if (!companies().length) {
          <div class="mt-6 empty-state p-10">
            <h2 class="text-lg font-semibold text-slate-950">No companies found</h2>
            <p class="mt-2 text-sm text-slate-600">
              Try a broader term, clear the category filter, or search for workflows like analytics,
              security, or operations.
            </p>
            <button type="button" class="btn-secondary focus-ring mt-5" (click)="clearFilters()">
              Reset search
            </button>
          </div>
        } @else {
          <div class="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            @for (company of companies(); track company.id) {
              <app-company-card [company]="company" />
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class CompanyListPageComponent implements OnInit, OnDestroy {
  protected readonly categories = signal<Category[]>([]);
  protected readonly companies = signal<Company[]>([]);
  protected readonly query = signal('');
  protected readonly categorySlug = signal('');
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly loadingCards = [1, 2, 3, 4, 5, 6];

  private readonly searchInput$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly companyDirectory: CompanyDirectoryService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.seo.apply({
      title: 'Browse companies | Vensight',
      description:
        'Search and filter the Vensight company directory by category, tags, AI summaries, and business positioning.',
      canonicalPath: '/companies',
      imagePath: '/image2.webp',
    });

    this.companyDirectory.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });

    this.searchInput$
      .pipe(debounceTime(180), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.query.set(query);
        this.updateQueryParams();
        this.loadCompanies();
      });

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.query.set(params.get('q') ?? '');
      this.categorySlug.set(params.get('category') ?? '');
      this.loadCompanies();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onQueryChange(value: string): void {
    this.searchInput$.next(value);
  }

  protected setCategory(categorySlug: string): void {
    this.categorySlug.set(categorySlug);
    this.updateQueryParams();
    this.loadCompanies();
  }

  protected clearFilters(): void {
    this.query.set('');
    this.categorySlug.set('');
    this.updateQueryParams();
    this.loadCompanies();
  }

  private loadCompanies(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.companyDirectory
      .searchCompanies({
        query: this.query(),
        categorySlug: this.categorySlug(),
      })
      .subscribe({
        next: (companies) => {
          this.companies.set(companies);
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  private updateQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.query() || null,
        category: this.categorySlug() || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
