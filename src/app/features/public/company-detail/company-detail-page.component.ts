import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import { SeoService } from '../../../core/seo/seo.service';
import { CompanyCardComponent } from '../../../shared/company-card/company-card.component';

@Component({
  selector: 'app-company-detail-page',
  imports: [CompanyCardComponent, RouterLink],
  template: `
    @if (isLoading()) {
      <section class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div class="h-96 skeleton"></div>
      </section>
    } @else if (hasError()) {
      <section class="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
        <div class="status-error p-8" role="alert">This company profile could not be loaded.</div>
      </section>
    } @else if (!company()) {
      <section class="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
        <p class="eyebrow">Profile not found</p>
        <h1 class="mt-4 text-3xl font-semibold text-slate-950">We could not find that company.</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The directory may not have this profile yet, or the link may have changed.
        </p>
        <a routerLink="/companies" class="mt-6 btn-primary focus-ring"> Browse companies </a>
      </section>
    } @else {
      <section class="page-hero">
        <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <a routerLink="/companies" class="return-link focus-ring"> Back to companies </a>
          <div class="mt-6 profile-hero-grid">
            <div class="grid gap-6 sm:grid-cols-[auto_1fr]">
              <div class="company-monogram" aria-hidden="true">
                {{ companyInitials() }}
              </div>
              <div>
                <p class="eyebrow">
                  {{ company()?.category?.name }}
                </p>
                <h1 class="mt-3 text-4xl font-semibold text-slate-950 sm:text-5xl">
                  {{ company()?.name }}
                </h1>
                <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                  {{ company()?.description }}
                </p>
                <div class="mt-5 flex flex-wrap gap-2">
                  <span class="pill-outline">{{ company()?.category?.name }}</span>
                  @for (tag of (company()?.tags ?? []).slice(0, 3); track tag) {
                    <span class="pill">{{ tag }}</span>
                  }
                </div>
                <div class="mt-6 flex flex-wrap gap-3">
                  <a
                    [href]="company()?.website"
                    target="_blank"
                    rel="noopener"
                    class="btn-primary focus-ring"
                  >
                    Visit website
                  </a>
                  <a routerLink="/compare" class="btn-secondary focus-ring"> Compare company </a>
                </div>
              </div>
            </div>
          </div>
          <nav class="profile-tabs mt-6" aria-label="Company sections">
            <a [routerLink]="[]" fragment="overview">Overview</a>
            <a [routerLink]="[]" fragment="summary">Company summary</a>
            <a [routerLink]="[]" fragment="similar">Similar companies</a>
            <a [routerLink]="[]" fragment="description">Search description</a>
          </nav>
        </div>
      </section>

      <section class="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px] lg:px-8">
        <div class="space-y-6">
          <article id="overview" class="content-section">
            <h2 class="text-xl font-semibold text-slate-950">Company overview</h2>
            <dl class="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div class="data-row">
                <dt class="font-semibold text-slate-500">Website</dt>
                <dd class="mt-1">
                  <a
                    [href]="company()?.website"
                    target="_blank"
                    rel="noopener"
                    class="font-semibold text-link focus-ring"
                  >
                    {{ domainLabel() }}
                  </a>
                </dd>
              </div>
              <div class="data-row">
                <dt class="font-semibold text-slate-500">Category</dt>
                <dd class="mt-1 font-semibold text-slate-950">{{ company()?.category?.name }}</dd>
              </div>
              <div class="data-row">
                <dt class="font-semibold text-slate-500">Tags</dt>
                <dd class="mt-1 font-semibold text-slate-950">
                  {{ company()?.tags?.length ?? 0 }}
                </dd>
              </div>
              <div class="data-row">
                <dt class="font-semibold text-slate-500">Profile content</dt>
                <dd class="mt-1 font-semibold text-slate-950">Company summary</dd>
              </div>
            </dl>
          </article>

          <article id="summary" class="content-section">
            <h2 class="text-xl font-semibold text-slate-950">Company summary</h2>
            <p class="insight-quote mt-4 text-base leading-8">
              {{ company()?.aiSummary }}
            </p>
          </article>

          <article id="description" class="content-section">
            <h2 class="text-xl font-semibold text-slate-950">Search description</h2>
            <p class="mt-4 text-base leading-8 text-slate-700">
              {{ company()?.seoDescription }}
            </p>
          </article>
        </div>

        <aside class="space-y-6">
          <div class="content-section">
            <h2 class="text-sm font-semibold  text-slate-500">Tags</h2>
            <div class="mt-4 flex flex-wrap gap-2">
              @for (tag of company()?.tags ?? []; track tag) {
                <span class="pill">
                  {{ tag }}
                </span>
              }
            </div>
          </div>
        </aside>
      </section>

      <section id="similar" class="section-band">
        <div class="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <h2 class="text-2xl font-semibold text-slate-950">Similar companies</h2>
          @if (!similarCompanies().length) {
            <p class="mt-4 text-sm text-slate-600">No similar companies are available yet.</p>
          } @else {
            <div class="mt-6 grid gap-5 md:grid-cols-3">
              @for (similarCompany of similarCompanies(); track similarCompany.id) {
                <app-company-card [company]="similarCompany" />
              }
            </div>
          }
        </div>
      </section>
    }
  `,
})
export class CompanyDetailPageComponent implements OnInit, OnDestroy {
  protected readonly company = signal<Company | undefined>(undefined);
  protected readonly similarCompanies = signal<Company[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly companyDirectory: CompanyDirectoryService,
    private readonly seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.isLoading.set(true);
          this.hasError.set(false);
          this.similarCompanies.set([]);
          return this.companyDirectory.getCompanyBySlug(params.get('slug') ?? '');
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (company) => {
          this.company.set(company);
          this.isLoading.set(false);

          if (company) {
            this.applyCompanySeo(company);
            this.companyDirectory.getSimilarCompanies(company).subscribe({
              next: (companies) => this.similarCompanies.set(companies),
              error: () => this.similarCompanies.set([]),
            });
          } else {
            this.seo.apply({
              title: 'Company not found | Vensight',
              description:
                'The requested Vensight company profile could not be found. Browse the directory to discover available companies.',
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

  protected companyInitials(): string {
    return (
      this.company()
        ?.name.split(/\s+/)
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'V'
    );
  }

  protected domainLabel(): string {
    const website = this.company()?.website;

    if (!website) {
      return 'Website unavailable';
    }

    try {
      return new URL(website).hostname.replace(/^www\./, '');
    } catch {
      return website;
    }
  }

  private applyCompanySeo(company: Company): void {
    this.seo.apply({
      title: `${company.name} | Vensight company profile`,
      description: company.seoDescription || company.description,
      canonicalPath: `/companies/${company.slug}`,
      imagePath: '/image2.webp',
      type: 'article',
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
