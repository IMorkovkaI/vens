import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../../core/seo/seo.service';

@Component({
  selector: 'app-terms-page',
  template: `
    <section class="page-hero">
      <div class="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <p class="eyebrow">Legal</p>
        <h1 class="mt-3 text-4xl font-semibold text-slate-950">Terms of use</h1>
        <p class="mt-4 text-base leading-7 text-slate-600">
          Vensight is an AI-assisted business directory MVP. Listings and summaries are informational and require review before production publication.
        </p>
      </div>
    </section>

    <section class="mx-auto max-w-4xl px-6 py-8 lg:px-8">
      <article class="surface-card p-6 text-sm leading-7 text-slate-600">
        <h2 class="text-2xl font-semibold text-slate-950">Directory content</h2>
        <p class="mt-3">
          Company profiles may include public website information, search-result snippets, manually entered details, and AI-assisted summaries. Vensight does not guarantee that generated content is complete or error-free.
        </p>
        <h2 class="mt-8 text-2xl font-semibold text-slate-950">Review responsibilities</h2>
        <p class="mt-3">
          Dashboard users should verify generated descriptions, categories, tags, and SEO metadata before creating or updating public listings.
        </p>
        <h2 class="mt-8 text-2xl font-semibold text-slate-950">Provider limits</h2>
        <p class="mt-3">
          Search discovery and AI analysis depend on configured third-party or local providers. Availability, quota, response quality, and usage terms are controlled by those providers.
        </p>
        <h2 class="mt-8 text-2xl font-semibold text-slate-950">Launch note</h2>
        <p class="mt-3">
          These terms are a starter baseline for product development and should be reviewed before public launch.
        </p>
      </article>
    </section>
  `,
})
export class TermsPageComponent implements OnInit {
  constructor(private readonly seo: SeoService) {}

  ngOnInit(): void {
    this.seo.apply({
      title: 'Terms of use | Vensight',
      description:
        'Terms baseline for Vensight directory content, AI-assisted summaries, and provider-backed discovery workflows.',
      canonicalPath: '/legal/terms',
    });
  }
}
