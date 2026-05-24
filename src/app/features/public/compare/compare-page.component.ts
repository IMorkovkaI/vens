import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import { CompetitorComparisonService } from '../../../core/competitor-comparison/competitor-comparison.service';
import { CompetitorComparisonResult } from '../../../core/competitor-comparison/competitor-comparison.models';
import { SeoService } from '../../../core/seo/seo.service';

@Component({
  selector: 'app-compare-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page-hero">
      <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <p class="eyebrow">AI competitor compare</p>
        <div class="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 class="text-4xl font-semibold text-slate-950">Compare companies</h1>
            <p class="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Pick two directory profiles and generate a mock AI comparison of positioning, overlap, and fit.
            </p>
          </div>
          <a routerLink="/companies" class="text-link focus-ring">
            Browse all companies
          </a>
        </div>
      </div>
    </section>

    <section class="page-visual-band visual-bg-companies">
      <div class="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        @if (isLoading()) {
          <div class="h-52 skeleton"></div>
        } @else if (hasError()) {
          <div class="status-error">
            Comparison data could not be loaded.
          </div>
        } @else if (companies().length < 2) {
          <div class="mt-6 empty-state p-10">
            <h2 class="text-lg font-semibold text-slate-950">More companies needed</h2>
            <p class="mt-2 text-sm text-slate-600">Add at least two companies before comparing competitors.</p>
          </div>
        } @else {
          <form class="grid gap-4 surface-card p-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end" (ngSubmit)="compare()">
            <label class="block">
              <span class="text-sm font-semibold text-slate-900">First company</span>
              <select class="form-input" name="leftSlug" [ngModel]="leftSlug()" (ngModelChange)="leftSlug.set($event)">
                @for (company of companies(); track company.slug) {
                  <option [value]="company.slug">{{ company.name }}</option>
                }
              </select>
            </label>

            <label class="block">
              <span class="text-sm font-semibold text-slate-900">Second company</span>
              <select class="form-input" name="rightSlug" [ngModel]="rightSlug()" (ngModelChange)="rightSlug.set($event)">
                @for (company of companies(); track company.slug) {
                  <option [value]="company.slug">{{ company.name }}</option>
                }
              </select>
            </label>

            <button
              type="submit"
              class="btn-primary focus-ring"
              [disabled]="isComparing()"
            >
              {{ isComparing() ? 'Comparing...' : 'Compare' }}
            </button>
          </form>

          @if (errorMessage()) {
            <div class="mt-5 status-error">
              {{ errorMessage() }}
            </div>
          }

          @if (!comparison()) {
            <div class="mt-6 empty-state p-10">
              <h2 class="text-xl font-semibold text-slate-950">Comparison preview</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Select two companies to generate a mock AI comparison.
              </p>
            </div>
          } @else {
            <article class="mt-6 surface-card">
              <div class="border-b border-slate-200 p-6">
                <p class="eyebrow">
                  {{ comparison()?.provider }} comparison - {{ confidenceLabel() }} confidence
                </p>
                <h2 class="mt-2 text-3xl font-semibold text-slate-950">
                  {{ comparison()?.leftCompany?.name }} vs {{ comparison()?.rightCompany?.name }}
                </h2>
                <p class="mt-3 max-w-3xl text-base leading-7 text-slate-700">
                  {{ comparison()?.summary }}
                </p>
              </div>

              <div class="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
                <div class="grid gap-5 md:grid-cols-2">
                  @for (item of comparison()?.differentiators ?? []; track item.companyName) {
                    <section class="surface-muted p-5">
                      <h3 class="text-xl font-semibold text-slate-950">{{ item.companyName }}</h3>
                      <ul class="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                        @for (point of item.points; track point) {
                          <li class="insight-quote text-sm">{{ point }}</li>
                        }
                      </ul>
                    </section>
                  }
                </div>

                <aside class="surface-muted p-5">
                  <h3 class="text-lg font-semibold text-slate-950">Decision notes</h3>
                  <dl class="mt-4 space-y-4 text-sm">
                    <div>
                      <dt class="font-semibold text-slate-900">Category relationship</dt>
                      <dd class="mt-1 text-slate-600">
                        {{ comparison()?.sharedCategory ? 'Direct category overlap' : 'Adjacent categories' }}
                      </dd>
                    </div>
                    <div>
                      <dt class="font-semibold text-slate-900">Shared tags</dt>
                      <dd class="mt-1 text-slate-600">
                        {{ sharedTagLabel() }}
                      </dd>
                    </div>
                    <div>
                      <dt class="font-semibold text-slate-900">Recommendation</dt>
                      <dd class="mt-1 text-slate-600">
                        {{ comparison()?.recommendation }}
                      </dd>
                    </div>
                    <div>
                      <dt class="font-semibold text-slate-900">Model</dt>
                      <dd class="mt-1 text-slate-600">
                        {{ comparison()?.model }}
                      </dd>
                    </div>
                  </dl>
                </aside>
              </div>
            </article>
          }
        }
      </div>
    </section>
  `,
})
export class ComparePageComponent implements OnInit {
  protected readonly companies = signal<Company[]>([]);
  protected readonly leftSlug = signal('');
  protected readonly rightSlug = signal('');
  protected readonly comparison = signal<CompetitorComparisonResult | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isComparing = signal(false);
  protected readonly hasError = signal(false);
  protected readonly errorMessage = signal('');

  constructor(
    private readonly companyDirectory: CompanyDirectoryService,
    private readonly competitorComparison: CompetitorComparisonService,
    private readonly seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.seo.apply({
      title: 'Compare companies | Vensight',
      description:
        'Compare two companies in the Vensight directory with mock AI positioning, category overlap, and differentiator analysis.',
      canonicalPath: '/compare',
      imagePath: '/image2.webp',
    });

    this.companyDirectory.getCompanies().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        this.leftSlug.set(companies[0]?.slug ?? '');
        this.rightSlug.set(companies[1]?.slug ?? '');
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  protected compare(): void {
    this.errorMessage.set('');
    this.comparison.set(null);

    if (this.leftSlug() === this.rightSlug()) {
      this.errorMessage.set('Choose two different companies to compare.');
      return;
    }

    this.isComparing.set(true);

    this.competitorComparison
      .compareCompanies({
        leftSlug: this.leftSlug(),
        rightSlug: this.rightSlug(),
      })
      .subscribe({
        next: (comparison) => {
          this.comparison.set(comparison);
          this.isComparing.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message || 'Comparison failed.');
          this.isComparing.set(false);
        },
      });
  }

  protected confidenceLabel(): string {
    const confidence = this.comparison()?.confidence;

    if (typeof confidence !== 'number') {
      return 'Pending';
    }

    return `${Math.round(confidence * 100)}%`;
  }

  protected sharedTagLabel(): string {
    const tags = this.comparison()?.overlappingTags ?? [];

    return tags.length ? tags.join(', ') : 'No direct tag overlap';
  }
}
