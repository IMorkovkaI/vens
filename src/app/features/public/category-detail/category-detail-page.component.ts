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
        <div class="status-error p-8">
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
          <a routerLink="/" class="text-link focus-ring">
            Back to home
          </a>
          <p class="mt-6 eyebrow">Category</p>
          <div class="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 class="text-4xl font-semibold text-slate-950">{{ category()?.name }}</h1>
              <p class="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Explore {{ category()?.name }} companies with AI summaries, SEO descriptions, and business context.
              </p>
            </div>
            <a [routerLink]="['/companies']" [queryParams]="{ category: category()?.slug }" class="btn-secondary focus-ring">
              Filter listing
            </a>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div class="flex items-end justify-between gap-4">
          <div>
            <h2 class="text-2xl font-semibold text-slate-950">Companies in {{ category()?.name }}</h2>
            <p class="mt-2 text-sm text-slate-600">
              {{ companies().length }} result{{ companies().length === 1 ? '' : 's' }}
            </p>
          </div>
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
