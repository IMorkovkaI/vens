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
      <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <p class="eyebrow">Company listing</p>
        <div class="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 class="text-4xl font-semibold text-slate-950">Browse companies</h1>
            <p class="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Search the starter directory by company, category, summary, and tags.
            </p>
          </div>
          <a routerLink="/" class="text-link focus-ring">
            Back to home
          </a>
        </div>
      </div>
    </section>

    <section class="page-visual-band visual-bg-companies">
      <div class="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div class="grid gap-4 surface-card p-4 lg:grid-cols-[1fr_auto] lg:items-end">
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

          <div>
            <p class="text-sm font-semibold text-slate-900">Category</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                class="filter-chip focus-ring"
                [class.filter-chip-active]="!categorySlug()"
                (click)="setCategory('')"
              >
                All
              </button>
              @for (category of categories(); track category.id) {
                <button
                  type="button"
                  class="filter-chip focus-ring"
                  [class.filter-chip-active]="categorySlug() === category.slug"
                  (click)="setCategory(category.slug)"
                >
                  {{ category.name }}
                </button>
              }
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-between gap-4">
          <p class="text-sm text-slate-600">
            @if (!isLoading() && !hasError()) {
              {{ companies().length }} result{{ companies().length === 1 ? '' : 's' }}
            } @else {
              Directory results
            }
          </p>
          @if (query() || categorySlug()) {
            <button type="button" class="text-link focus-ring" (click)="clearFilters()">
              Clear filters
            </button>
          }
        </div>

        @if (isLoading()) {
          <div class="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            @for (item of loadingCards; track item) {
              <div class="h-72 skeleton"></div>
            }
          </div>
        } @else if (hasError()) {
          <div class="mt-6 status-error">
            Companies could not be loaded. Please try again.
          </div>
        } @else if (!companies().length) {
          <div class="mt-6 empty-state p-10">
            <h2 class="text-lg font-semibold text-slate-950">No companies found</h2>
            <p class="mt-2 text-sm text-slate-600">Try a different search term or category.</p>
          </div>
        } @else {
          <div class="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
