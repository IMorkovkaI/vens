import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';

@Component({
  selector: 'app-dashboard-home-page',
  imports: [RouterLink],
  template: `
    <section class="page-hero page-hero-media hero-bg-dashboard-app">
      <div class="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 py-10 lg:flex-row lg:items-end lg:px-8">
        <div>
          <p class="eyebrow">Dashboard</p>
          <h1 class="mt-3 text-4xl font-semibold text-slate-950">Directory workspace</h1>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <p class="text-base leading-7 text-slate-600">
              Signed in as {{ authService.currentUser()?.email }}.
            </p>
            <span class="pill-outline role-pill">
              Assigned role: {{ authService.currentUser()?.role }}
            </span>
          </div>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
          <a routerLink="/dashboard/analytics" class="btn-subtle focus-ring">
            Analytics
          </a>
          @if (authService.canManageListings()) {
            <a routerLink="/dashboard/discovery" class="btn-secondary focus-ring px-4 py-2">
              Discovery
            </a>
            <a routerLink="/dashboard/ai-analysis" class="btn-secondary focus-ring px-4 py-2">
              AI Analysis
            </a>
            <a routerLink="/dashboard/companies/new" class="btn-primary focus-ring px-4 py-2">
              Add company
            </a>
          }
          @if (authService.canManageDevelopers()) {
            <a routerLink="/dashboard/developers" class="btn-subtle focus-ring">
              Developers
            </a>
          }
          <button
            type="button"
            class="btn-subtle focus-ring"
            (click)="logout()"
          >
            Sign out
          </button>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      @if (isLoading()) {
        <div class="grid gap-4 md:grid-cols-3">
          @for (item of loadingCards; track item) {
            <div class="h-32 skeleton"></div>
          }
        </div>
      } @else if (hasError()) {
        <div class="status-error" role="alert">
          Dashboard data could not be loaded.
        </div>
      } @else {
        <div class="grid gap-4 md:grid-cols-3">
          <article class="metric-card">
            <p class="text-sm font-medium text-slate-500">Companies</p>
            <p class="mt-2 text-3xl font-semibold text-slate-950">{{ companies().length }}</p>
          </article>
          <article class="metric-card">
            <p class="text-sm font-medium text-slate-500">Mock AI summaries</p>
            <p class="mt-2 text-3xl font-semibold text-slate-950">{{ aiSummaryCount() }}</p>
          </article>
          <article class="metric-card">
            <p class="text-sm font-medium text-slate-500">Categories</p>
            <p class="mt-2 text-3xl font-semibold text-slate-950">{{ categoryCount() }}</p>
          </article>
        </div>

        <div class="mt-8 surface-card">
          <div class="border-b border-slate-200 p-5">
            <h2 class="text-xl font-semibold text-slate-950">Recent company profiles</h2>
            <p class="mt-1 text-sm text-slate-600">
              @if (authService.canManageListings()) {
                Manage existing listings in the directory.
              } @else {
                Your role can inspect listings but cannot edit them.
              }
            </p>
          </div>

          @if (!companies().length) {
            <div class="p-8 text-center text-sm text-slate-600">No companies are available yet.</div>
          } @else {
            <div class="divide-y divide-slate-200">
              @for (company of companies(); track company.id) {
                <div class="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p class="font-semibold text-slate-950">{{ company.name }}</p>
                    <p class="mt-1 text-sm text-slate-600">{{ company.category.name }} - {{ company.tags.join(', ') }}</p>
                  </div>
                  <div class="flex flex-wrap gap-3">
                    <a [routerLink]="['/companies', company.slug]" class="text-link focus-ring">
                      View public profile
                    </a>
                    @if (authService.canManageListings()) {
                      <a [routerLink]="['/dashboard/companies', company.slug, 'edit']" class="text-link focus-ring">
                        Edit listing
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class DashboardHomePageComponent implements OnInit {
  protected readonly companies = signal<Company[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly loadingCards = [1, 2, 3];

  constructor(
    protected readonly authService: AuthService,
    private readonly companyDirectory: CompanyDirectoryService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.companyDirectory.getCompanies().subscribe({
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

  protected aiSummaryCount(): number {
    return this.companies().filter((company) => company.aiSummary).length;
  }

  protected categoryCount(): number {
    return new Set(this.companies().map((company) => company.category.slug)).size;
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/dashboard/login');
  }
}
