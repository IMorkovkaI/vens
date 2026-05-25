import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { Category, Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import { SeoService } from '../../../core/seo/seo.service';
import { CompanyCardComponent } from '../../../shared/company-card/company-card.component';

@Component({
  selector: 'app-category-detail-page',
  imports: [CompanyCardComponent, RouterLink],
  template: `
    @if (isLoading()) {
      <section class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div class="h-80 skeleton"></div>
      </section>
    } @else if (hasError()) {
      <section class="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
        <div class="status-error p-8" role="alert">
          Category data could not be loaded.
        </div>
      </section>
    } @else if (!category()) {
      <section class="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
        <p class="eyebrow">Category not found</p>
        <h1 class="mt-4 text-3xl font-semibold text-slate-950">We could not find that category.</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The category may not exist yet, or the link may have changed.
        </p>
        <a routerLink="/companies" class="mt-6 btn-primary focus-ring">
          Browse companies
        </a>
      </section>
    } @else {
      <section class="page-hero page-hero-media hero-bg-companies">
        <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div class="category-hero-grid">
            <div>
              <a routerLink="/" class="return-link focus-ring">
                Back to home
              </a>
              <p class="mt-6 eyebrow">Category index</p>
              <h1 class="mt-3 text-4xl font-semibold text-slate-950">{{ category()?.name }}</h1>
              <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Explore {{ category()?.name }} companies with AI summaries, tags, SEO descriptions, and business context tuned for fast comparison.
              </p>
              <div class="mt-6 flex flex-wrap gap-3">
                <a [routerLink]="['/companies']" [queryParams]="{ category: category()?.slug }" class="btn-secondary focus-ring">
                  Filter full listing
                </a>
                <a routerLink="/companies" class="btn-subtle focus-ring">
                  Browse all companies
                </a>
              </div>
            </div>
            <aside class="category-flow-panel">
              <p class="text-xs font-bold uppercase text-slate-500">Category snapshot</p>
              <p class="mt-3 text-5xl font-semibold text-slate-950">{{ companies().length }}</p>
              <p class="mt-1 text-sm font-semibold text-slate-600">
                compan{{ companies().length === 1 ? 'y' : 'ies' }} indexed
              </p>
              <dl class="mt-5 grid gap-3">
                <div class="data-row">
                  <dt class="text-xs font-semibold uppercase text-slate-500">Mode</dt>
                  <dd class="mt-1 text-sm font-semibold text-slate-950">Mock cached</dd>
                </div>
                <div class="data-row">
                  <dt class="text-xs font-semibold uppercase text-slate-500">Path</dt>
                  <dd class="mt-1 text-sm font-semibold text-slate-950">Category to profile</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section class="category-results-section">
        <div class="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 class="text-2xl font-semibold text-slate-950">Companies in {{ category()?.name }}</h2>
            <p class="mt-2 text-sm text-slate-600">
              {{ companies().length }} profile{{ companies().length === 1 ? '' : 's' }} ready to scan in this category.
            </p>
          </div>
          <a [routerLink]="['/companies']" [queryParams]="{ category: category()?.slug }" class="text-link focus-ring">
            Open filtered directory
          </a>
        </div>

        @if (!companies().length) {
          <div class="mt-6 empty-state p-10">
            <h3 class="text-lg font-semibold text-slate-950">No companies yet</h3>
            <p class="mt-2 text-sm text-slate-600">This category is ready for new listings.</p>
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
    }
  `,
})
export class CategoryDetailPageComponent implements OnInit, OnDestroy {
  protected readonly category = signal<Category | undefined>(undefined);
  protected readonly companies = signal<Company[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly companyDirectory: CompanyDirectoryService,
    private readonly seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params.get('slug') ?? '';
      this.loadCategory(slug);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategory(slug: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    forkJoin({
      category: this.companyDirectory.getCategoryBySlug(slug),
      companies: this.companyDirectory.getCompaniesByCategory(slug),
    }).subscribe({
      next: ({ category, companies }) => {
        this.category.set(category);
        this.companies.set(category ? companies : []);
        this.isLoading.set(false);

        if (category) {
          this.applyCategorySeo(category, companies.length);
        } else {
          this.seo.apply({
            title: 'Category not found | Vensight',
            description:
              'The requested Vensight category could not be found. Browse companies by available categories.',
            canonicalPath: '/companies',
            noIndex: true,
          });
        }
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  private applyCategorySeo(category: Category, companyCount: number): void {
    this.seo.apply({
      title: `${category.name} companies | Vensight`,
      description: `Explore ${companyCount} ${category.name} compan${
        companyCount === 1 ? 'y' : 'ies'
      } with AI summaries, SEO descriptions, tags, and business context in Vensight.`,
      canonicalPath: `/categories/${category.slug}`,
      imagePath: '/image2.webp',
    });
  }
}
