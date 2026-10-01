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
      <div class="site-container directory-intro">
        <p class="eyebrow">AI competitor compare</p>
        <div class="directory-title-row">
          <div>
            <h1>Compare companies</h1>
            <p class="directory-intro-copy">
              Pick two directory profiles and generate an AI-assisted comparison of positioning,
              overlap, and fit.
            </p>
          </div>
          <a routerLink="/companies" class="return-link focus-ring"> Browse all companies </a>
        </div>
      </div>
    </section>

    <section class="page-content">
      <div class="site-container py-8">
        @if (isLoading()) {
          <div class="h-52 skeleton"></div>
        } @else if (hasError()) {
          <div class="status-error" role="alert">Comparison data could not be loaded.</div>
        } @else if (companies().length < 2) {
          <div class="mt-6 empty-state p-10">
            <h2 class="text-lg font-semibold text-slate-950">More companies needed</h2>
            <p class="mt-2 text-sm text-slate-600">
              Add at least two companies before comparing competitors.
            </p>
          </div>
        } @else {
          <form class="comparison-controls" (ngSubmit)="compare()">
            <label class="block">
              <span class="text-sm font-semibold text-slate-900">First company</span>
              <select
                class="form-input"
                name="leftSlug"
                [ngModel]="leftSlug()"
                (ngModelChange)="leftSlug.set($event)"
              >
                @for (company of companies(); track company.slug) {
                  <option [value]="company.slug">{{ company.name }}</option>
                }
              </select>
            </label>

            <label class="block">
              <span class="text-sm font-semibold text-slate-900">Second company</span>
              <select
                class="form-input"
                name="rightSlug"
                [ngModel]="rightSlug()"
                (ngModelChange)="rightSlug.set($event)"
              >
                @for (company of companies(); track company.slug) {
                  <option [value]="company.slug">{{ company.name }}</option>
                }
              </select>
            </label>

            <button type="submit" class="btn-primary focus-ring" [disabled]="isComparing()">
              {{ isComparing() ? 'Comparing...' : 'Compare' }}
            </button>
          </form>

          @if (errorMessage()) {
            <div class="mt-5 status-error" role="alert">
              {{ errorMessage() }}
            </div>
          }

          @if (!comparison()) {
            <div class="mt-6 empty-state p-10">
              <h2 class="text-xl font-semibold text-slate-950">Comparison preview</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Select two companies to generate an AI-assisted comparison.
              </p>
            </div>
          } @else {
            <article class="comparison-result mt-6">
              <div class="comparison-summary">
                <p class="eyebrow">{{ providerLabel() }} - {{ confidenceLabel() }} confidence</p>
                <h2 class="mt-2 text-2xl font-semibold text-slate-950">
                  {{ comparison()?.leftCompany?.name }} vs {{ comparison()?.rightCompany?.name }}
                </h2>
                <p class="mt-3 max-w-3xl text-base leading-7 text-slate-700">
                  {{ comparison()?.summary }}
                </p>
              </div>

              <div class="comparison-companies">
                @for (
                  item of comparison()?.differentiators ?? [];
                  track item.companyName;
                  let index = $index
                ) {
                  <section
                    class="surface-card comparison-company"
                    [attr.aria-labelledby]="'comparison-company-' + index"
                  >
                    <header class="comparison-company-heading">
                      <span class="company-monogram" aria-hidden="true">{{
                        item.companyName.charAt(0)
                      }}</span>
                      <div>
                        <p class="eyebrow">Company {{ index + 1 }}</p>
                        <h3
                          [id]="'comparison-company-' + index"
                          class="font-semibold text-slate-950"
                        >
                          {{ item.companyName }}
                        </h3>
                      </div>
                    </header>
                    <ul class="comparison-points text-sm leading-6 text-slate-700">
                      @for (point of item.points; track point) {
                        <li class="insight-quote text-sm">{{ point }}</li>
                      }
                    </ul>
                  </section>
                }
              </div>

              <aside class="comparison-notes" aria-labelledby="comparison-notes-title">
                <h3 id="comparison-notes-title" class="text-lg font-semibold text-slate-950">
                  Decision notes
                </h3>
                <dl class="comparison-notes-grid text-sm">
                  <div>
                    <dt class="font-semibold text-slate-900">Category relationship</dt>
                    <dd class="mt-1 text-slate-600">
                      {{
                        comparison()?.sharedCategory
                          ? 'Direct category overlap'
                          : 'Adjacent categories'
                      }}
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
                      {{ modelLabel() }}
                    </dd>
                  </div>
                </dl>
              </aside>
            </article>
          }
        }
      </div>
    </section>
  `,
  styleUrl: './compare-page.component.css',
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
        'Compare two companies in the Vensight directory with AI-assisted positioning, category overlap, and differentiator analysis.',
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

  protected providerLabel(): string {
    return this.comparison()?.provider === 'mock'
      ? 'AI-assisted comparison'
      : `${this.comparison()?.provider} comparison`;
  }

  protected modelLabel(): string {
    return this.comparison()?.provider === 'mock'
      ? 'Vensight comparison engine'
      : (this.comparison()?.model ?? 'Pending');
  }
}
