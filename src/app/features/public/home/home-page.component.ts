import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Category, Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import { SeoService } from '../../../core/seo/seo.service';
import { CompanyCardComponent } from '../../../shared/company-card/company-card.component';

@Component({
  selector: 'app-home-page',
  imports: [FormsModule, RouterLink, CompanyCardComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent {
  protected readonly auth = inject(AuthService);
  private readonly directory = inject(CompanyDirectoryService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly query = signal('');
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly companies = signal<Company[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly featured = computed(() => this.companies().slice(0, 4));
  protected readonly categoryCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const company of this.companies()) {
      counts.set(company.category.slug, (counts.get(company.category.slug) ?? 0) + 1);
    }
    return counts;
  });

  constructor() {
    inject(SeoService).apply({
      title: 'Vensight | AI-assisted company directory',
      description:
        'Find companies, tools, and agencies by category, with AI-assisted company summaries.',
      canonicalPath: '/',
    });
    this.loadDirectory();
  }

  protected loadDirectory(): void {
    this.state.set('loading');
    // Keep counts and profiles on the same completed snapshot, including retries.
    forkJoin({
      companies: this.directory.getCompanies(),
      categories: this.directory.getCategories(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ companies, categories }) => {
          this.companies.set(companies);
          this.categories.set(categories);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected search(): void {
    const q = this.query().trim();
    void this.router.navigate(['/companies'], { queryParams: q ? { q } : undefined });
  }
}
