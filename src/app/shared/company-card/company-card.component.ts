import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Company } from '../../core/company-directory/company-directory.models';

@Component({
  selector: 'app-company-card',
  imports: [RouterLink],
  template: `
    <article>
      <div class="card-heading">
        <span class="company-initial" aria-hidden="true">{{ company().name.charAt(0) }}</span>
        <div>
          <a class="category" [routerLink]="['/categories', company().category.slug]">{{
            company().category.name
          }}</a>
          <h3>
            <a [routerLink]="['/companies', company().slug]">{{ company().name }}</a>
          </h3>
        </div>
      </div>
      <p class="description">{{ company().description }}</p>
      @if (company().aiSummary) {
        <div class="summary">
          <p class="label">Company brief</p>
          <p>{{ company().aiSummary }}</p>
        </div>
      }
      <ul aria-label="Tags">
        @for (tag of company().tags; track tag) {
          <li>{{ tag }}</li>
        }
      </ul>
      <a
        class="profile-link"
        [routerLink]="['/companies', company().slug]"
        [attr.aria-label]="'View ' + company().name + ' profile'"
      >
        View profile <span aria-hidden="true">&#8594;</span>
      </a>
    </article>
  `,
  styleUrl: './company-card.component.css',
})
export class CompanyCardComponent {
  readonly company = input.required<Company>();
}
