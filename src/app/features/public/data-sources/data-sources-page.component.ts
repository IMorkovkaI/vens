import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../core/seo/seo.service';

@Component({
  selector: 'app-data-sources-page',
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <p class="eyebrow">Data sources</p>
        <h1 class="mt-3 max-w-3xl text-4xl font-semibold text-slate-950">
          How Vensight finds and reviews company information
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Vensight combines public company pages, search discovery results, and AI-assisted summaries. Every imported listing should be reviewed before it becomes public.
        </p>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-3 lg:px-8">
      <article class="surface-card p-6">
        <p class="eyebrow">Discovery</p>
        <h2 class="mt-3 text-2xl font-semibold text-slate-950">Company discovery</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Dashboard discovery helps editors find public company websites from search results. A result only becomes useful after someone opens the source and chooses to analyze the page.
        </p>
      </article>
      <article class="surface-card p-6">
        <p class="eyebrow">Analysis</p>
        <h2 class="mt-3 text-2xl font-semibold text-slate-950">Public HTTPS pages</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          AI analysis extracts static content from submitted HTTPS pages, including metadata, headings, visible snippets, and schema.org signals when present.
        </p>
      </article>
      <article class="surface-card p-6">
        <p class="eyebrow">Review</p>
        <h2 class="mt-3 text-2xl font-semibold text-slate-950">Human approval</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Search results and AI-generated summaries can be incomplete. Admins and developers should verify facts before creating or updating directory listings.
        </p>
      </article>
    </section>

    <section class="section-band">
      <div class="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div class="surface-panel p-6">
          <h2 class="text-2xl font-semibold text-slate-950">Important limitations</h2>
          <div class="mt-5 grid gap-4 text-sm leading-6 text-slate-600 md:grid-cols-2">
            <p>
              Vensight does not claim ownership of third-party company information, logos, descriptions, or source website content. Public listing content should cite or link back to the company website where practical.
            </p>
            <p>
              AI summaries are generated from available evidence and may miss context. Use them as review aids, not as verified statements of fact.
            </p>
          </div>
          <div class="mt-6 flex flex-wrap gap-3">
            <a routerLink="/legal/privacy" class="btn-secondary focus-ring">Privacy</a>
            <a routerLink="/legal/terms" class="btn-subtle focus-ring">Terms</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class DataSourcesPageComponent implements OnInit {
  constructor(private readonly seo: SeoService) {}

  ngOnInit(): void {
    this.seo.apply({
      title: 'Data sources | Vensight',
      description:
        'Learn how Vensight discovers company candidates, analyzes public HTTPS pages, and reviews AI-assisted listing data.',
      canonicalPath: '/data-sources',
    });
  }
}
