import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../../core/seo/seo.service';

@Component({
  selector: 'app-privacy-page',
  template: `
    <section class="page-hero">
      <div class="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <p class="eyebrow">Legal</p>
        <h1 class="mt-3 text-4xl font-semibold text-slate-950">Privacy policy</h1>
        <p class="mt-4 text-base leading-7 text-slate-600">
          This MVP policy explains the data Vensight handles during directory browsing, dashboard access, search discovery, and AI analysis.
        </p>
      </div>
    </section>

    <section class="mx-auto max-w-4xl px-6 py-8 lg:px-8">
      <article class="surface-card p-6 text-sm leading-7 text-slate-600">
        <h2 class="text-2xl font-semibold text-slate-950">What we collect</h2>
        <p class="mt-3">
          Vensight may store dashboard account details, session metadata, company listing data, discovery candidates, submitted company URLs, extracted public page evidence, and generated AI analysis results.
        </p>
        <h2 class="mt-8 text-2xl font-semibold text-slate-950">How data is used</h2>
        <p class="mt-3">
          Data is used to authenticate dashboard users, review candidate companies, generate listing drafts, maintain directory pages, and improve operational visibility.
        </p>
        <h2 class="mt-8 text-2xl font-semibold text-slate-950">Third-party providers</h2>
        <p class="mt-3">
          Search and AI providers may process submitted queries or URLs when enabled by backend configuration. API keys are kept server-side and are not exposed to browser responses.
        </p>
        <h2 class="mt-8 text-2xl font-semibold text-slate-950">Production note</h2>
        <p class="mt-3">
          This page is a practical MVP baseline and should be reviewed before launch with the final hosting, provider, analytics, and retention choices.
        </p>
      </article>
    </section>
  `,
})
export class PrivacyPageComponent implements OnInit {
  constructor(private readonly seo: SeoService) {}

  ngOnInit(): void {
    this.seo.apply({
      title: 'Privacy policy | Vensight',
      description:
        'Privacy baseline for Vensight dashboard accounts, discovery candidates, company URLs, and AI-assisted analysis data.',
      canonicalPath: '/legal/privacy',
    });
  }
}
