import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Company } from '../../core/company-directory/company-directory.models';

@Component({
  selector: 'app-company-card',
  imports: [RouterLink],
  template: `
    <article class="company-card group h-full surface-card p-5 pt-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <a [routerLink]="['/categories', company.category.slug]" class="eyebrow focus-ring rounded-sm text-xs">
            {{ company.category.name }}
          </a>
          <h3 class="mt-2 text-xl font-semibold text-slate-950">
            <a [routerLink]="['/companies', company.slug]" class="focus-ring rounded-sm">
              {{ company.name }}
            </a>
          </h3>
        </div>
        <span class="pill-outline">Profile</span>
      </div>

      <p class="mt-4 text-sm leading-6 text-slate-600">
        {{ company.description }}
      </p>

      <p class="insight-quote mt-4 text-sm leading-6">
        {{ company.aiSummary }}
      </p>

      <div class="mt-5 flex flex-wrap gap-2">
        @for (tag of company.tags.slice(0, 4); track tag) {
          <span class="pill">
            {{ tag }}
          </span>
        }
      </div>
    </article>
  `,
})
export class CompanyCardComponent {
  @Input({ required: true }) company!: Company;
}
