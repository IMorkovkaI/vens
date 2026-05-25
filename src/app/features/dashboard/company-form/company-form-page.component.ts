import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import {
  Category,
  Company,
  CompanyFormData,
} from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';

@Component({
  selector: 'app-company-form-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page-hero page-hero-media hero-bg-dashboard-app">
      <div class="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <a routerLink="/dashboard" class="return-link focus-ring">
          Back to dashboard
        </a>
        <p class="mt-6 eyebrow">Listing management</p>
        <h1 class="mt-3 text-4xl font-semibold text-slate-950">
          {{ mode() === 'create' ? 'Add company' : 'Edit company' }}
        </h1>
        <p class="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Manage the mock directory record. Backend persistence will replace this in-memory flow later.
        </p>
      </div>
    </section>

    <section class="mx-auto max-w-4xl px-6 py-8 lg:px-8">
      @if (!authService.canManageListings()) {
        <div class="status-warning p-6">
          <h2 class="text-lg font-semibold text-slate-950">Read-only role</h2>
          <p class="mt-2 text-sm leading-6 text-slate-700">
            Your current role can view dashboard data, but only developers and admins can manage listings.
          </p>
        </div>
      } @else if (isLoading()) {
        <div class="h-96 skeleton"></div>
      } @else if (notFound()) {
        <div class="empty-state p-8">
          <h2 class="text-lg font-semibold text-slate-950">Company not found</h2>
          <p class="mt-2 text-sm text-slate-600">This listing is not available in the mock directory.</p>
        </div>
      } @else {
        <form class="grid gap-5 surface-card p-6" (ngSubmit)="submit()">
          <label class="block">
            <span class="text-sm font-semibold text-slate-900">Name</span>
            <input class="form-input" name="name" [ngModel]="name()" (ngModelChange)="name.set($event)" />
          </label>

          <label class="block">
            <span class="text-sm font-semibold text-slate-900">Website</span>
            <input class="form-input" name="website" type="url" [ngModel]="website()" (ngModelChange)="website.set($event)" />
          </label>

          <label class="block">
            <span class="text-sm font-semibold text-slate-900">Category</span>
            <select class="form-input" name="categorySlug" [ngModel]="categorySlug()" (ngModelChange)="categorySlug.set($event)">
              @for (category of categories(); track category.id) {
                <option [value]="category.slug">{{ category.name }}</option>
              }
            </select>
          </label>

          <label class="block">
            <span class="text-sm font-semibold text-slate-900">Description</span>
            <textarea class="form-input min-h-28" name="description" [ngModel]="description()" (ngModelChange)="description.set($event)"></textarea>
          </label>

          <label class="block">
            <span class="text-sm font-semibold text-slate-900">Tags</span>
            <input class="form-input" name="tags" [ngModel]="tagsText()" (ngModelChange)="tagsText.set($event)" placeholder="Comma-separated tags" />
          </label>

          <label class="block">
            <span class="text-sm font-semibold text-slate-900">AI summary</span>
            <textarea class="form-input min-h-28" name="aiSummary" [ngModel]="aiSummary()" (ngModelChange)="aiSummary.set($event)"></textarea>
          </label>

          <label class="block">
            <span class="text-sm font-semibold text-slate-900">SEO description</span>
            <textarea class="form-input min-h-28" name="seoDescription" [ngModel]="seoDescription()" (ngModelChange)="seoDescription.set($event)"></textarea>
          </label>

          @if (errorMessage()) {
            <div class="status-error" role="alert">
              {{ errorMessage() }}
            </div>
          }

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              class="btn-primary focus-ring"
              [disabled]="isSaving()"
            >
              {{ isSaving() ? 'Saving...' : 'Save listing' }}
            </button>
            <a routerLink="/dashboard" class="text-link focus-ring">
              Cancel
            </a>
          </div>
        </form>
      }
    </section>
  `,
})
export class CompanyFormPageComponent implements OnInit {
  protected readonly mode = signal<'create' | 'edit'>('create');
  protected readonly categories = signal<Category[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly notFound = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly website = signal('');
  protected readonly categorySlug = signal('');
  protected readonly tagsText = signal('');
  protected readonly aiSummary = signal('');
  protected readonly seoDescription = signal('');

  private editingSlug = '';

  constructor(
    protected readonly authService: AuthService,
    private readonly companyDirectory: CompanyDirectoryService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.editingSlug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.mode.set(this.editingSlug ? 'edit' : 'create');

    this.companyDirectory.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.categorySlug.set(categories[0]?.slug ?? '');
        this.loadCompanyIfNeeded();
      },
      error: () => {
        this.errorMessage.set('Categories could not be loaded.');
        this.isLoading.set(false);
      },
    });
  }

  protected submit(): void {
    if (!this.authService.canManageListings()) {
      return;
    }

    const formData = this.getFormData();
    const validationError = this.validate(formData);

    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const request =
      this.mode() === 'create'
        ? this.companyDirectory.createCompany(formData)
        : this.companyDirectory.updateCompany(this.editingSlug, formData);

    request.subscribe({
      next: (company) => {
        this.isSaving.set(false);

        if (!company) {
          this.notFound.set(true);
          return;
        }

        void this.router.navigateByUrl('/dashboard');
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message || 'Listing could not be saved.');
        this.isSaving.set(false);
      },
    });
  }

  private loadCompanyIfNeeded(): void {
    if (!this.authService.canManageListings()) {
      this.isLoading.set(false);
      return;
    }

    if (this.mode() === 'create') {
      this.isLoading.set(false);
      return;
    }

    this.companyDirectory.getCompanyBySlug(this.editingSlug).subscribe({
      next: (company) => {
        if (!company) {
          this.notFound.set(true);
          this.isLoading.set(false);
          return;
        }

        this.patchForm(company);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Company could not be loaded.');
        this.isLoading.set(false);
      },
    });
  }

  private patchForm(company: Company): void {
    this.name.set(company.name);
    this.description.set(company.description);
    this.website.set(company.website);
    this.categorySlug.set(company.category.slug);
    this.tagsText.set(company.tags.join(', '));
    this.aiSummary.set(company.aiSummary);
    this.seoDescription.set(company.seoDescription);
  }

  private getFormData(): CompanyFormData {
    return {
      name: this.name(),
      description: this.description(),
      website: this.website(),
      categorySlug: this.categorySlug(),
      tags: this.tagsText()
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      aiSummary: this.aiSummary(),
      seoDescription: this.seoDescription(),
    };
  }

  private validate(formData: CompanyFormData): string {
    if (!formData.name.trim()) {
      return 'Company name is required.';
    }

    if (!this.isHttpWebsiteUrl(formData.website)) {
      return 'Website must start with http or https.';
    }

    if (!formData.description.trim()) {
      return 'Description is required.';
    }

    return '';
  }

  private isHttpWebsiteUrl(value: string): boolean {
    try {
      const parsedUrl = new URL(value.trim());

      return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
    } catch {
      return false;
    }
  }
}
