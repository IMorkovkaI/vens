import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardUser } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-developers-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page-hero page-hero-media hero-bg-dashboard-app">
      <div class="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <a routerLink="/dashboard" class="text-link focus-ring">
          Back to dashboard
        </a>
        <p class="mt-6 eyebrow">Admin tools</p>
        <h1 class="mt-3 text-4xl font-semibold text-slate-950">Developers</h1>
        <p class="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Admins can create developer accounts that are allowed to manage directory listings.
        </p>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[420px_1fr] lg:px-8">
      @if (!authService.canManageDevelopers()) {
        <div class="status-warning p-6 lg:col-span-2">
          <h2 class="text-lg font-semibold text-slate-950">Admin access required</h2>
          <p class="mt-2 text-sm leading-6 text-slate-700">Only admin accounts can add developers.</p>
        </div>
      } @else {
        <form class="surface-card p-6" (ngSubmit)="submit()">
          <h2 class="text-xl font-semibold text-slate-950">Add developer</h2>
          <div class="mt-5 grid gap-5">
            <label class="block">
              <span class="text-sm font-semibold text-slate-900">Email</span>
              <input class="form-input" type="email" name="email" [ngModel]="email()" (ngModelChange)="email.set($event)" />
            </label>
            <label class="block">
              <span class="text-sm font-semibold text-slate-900">Temporary password</span>
              <input class="form-input" type="password" name="password" [ngModel]="password()" (ngModelChange)="password.set($event)" />
            </label>
          </div>

          @if (message()) {
            <div class="mt-5 status-success">
              {{ message() }}
            </div>
          }

          @if (errorMessage()) {
            <div class="mt-5 status-error">
              {{ errorMessage() }}
            </div>
          }

          <button
            type="submit"
            class="mt-6 btn-primary focus-ring"
            [disabled]="isSubmitting()"
          >
            {{ isSubmitting() ? 'Adding...' : 'Add developer' }}
          </button>
        </form>

        <div class="surface-card">
          <div class="border-b border-slate-200 p-5">
            <h2 class="text-xl font-semibold text-slate-950">Developer accounts</h2>
          </div>
          @if (isLoading()) {
            <div class="p-5 text-sm text-slate-600">Loading developers...</div>
          } @else if (!developers().length) {
            <div class="p-8 text-center text-sm text-slate-600">No developers have been added yet.</div>
          } @else {
            <div class="divide-y divide-slate-200">
              @for (developer of developers(); track developer.email) {
                <div class="p-5">
                  <p class="font-semibold text-slate-950">{{ developer.email }}</p>
                  <p class="mt-1 text-sm text-slate-600">{{ developer.role }} access</p>
                </div>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class DevelopersPageComponent implements OnInit {
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly developers = signal<DashboardUser[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly message = signal('');
  protected readonly errorMessage = signal('');

  constructor(protected readonly authService: AuthService) {}

  ngOnInit(): void {
    this.loadDevelopers();
  }

  protected submit(): void {
    this.isSubmitting.set(true);
    this.message.set('');
    this.errorMessage.set('');

    this.authService
      .createDeveloper({
        email: this.email(),
        password: this.password(),
      })
      .subscribe((result) => {
        this.isSubmitting.set(false);

        if (!result.success) {
          this.errorMessage.set(result.error ?? 'Developer could not be added.');
          return;
        }

        this.email.set('');
        this.password.set('');
        this.message.set('Developer account created.');
        this.loadDevelopers();
      });
  }

  private loadDevelopers(): void {
    this.isLoading.set(true);

    this.authService.getDeveloperAccounts().subscribe((developers) => {
      this.developers.set(developers);
      this.isLoading.set(false);
    });
  }
}
