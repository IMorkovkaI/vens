import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page-hero page-hero-media hero-bg-dashboard-auth">
      <div class="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p class="eyebrow">Dashboard authentication</p>
          <h1 class="mt-4 text-4xl font-semibold text-slate-950">Sign in to manage the directory.</h1>
          <p class="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Roles are assigned by account. Admins can invite developers and manage protected workflows.
          </p>
        </div>

        <form class="surface-card p-6" (ngSubmit)="submit()">
          <div class="grid gap-5">
            <label class="block">
              <span class="text-sm font-semibold text-slate-900">Email</span>
              <input
                class="form-input"
                type="email"
                autocomplete="email"
                name="email"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
                placeholder="admin@vensight.local"
              />
            </label>

            <label class="block">
              <span class="text-sm font-semibold text-slate-900">Password</span>
              <input
                class="form-input"
                type="password"
                autocomplete="current-password"
                name="password"
                [ngModel]="password()"
                (ngModelChange)="password.set($event)"
                placeholder="At least 12 characters"
              />
            </label>

          </div>

          @if (errorMessage()) {
            <div class="mt-5 status-error" role="alert">
              {{ errorMessage() }}
            </div>
          }

          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              class="btn-primary focus-ring"
              [disabled]="isSubmitting()"
            >
              {{ isSubmitting() ? 'Signing in...' : 'Sign in' }}
            </button>
            <a routerLink="/dashboard/register" class="btn-secondary focus-ring">
              Create account
            </a>
          </div>

          <div class="mt-4">
            <a routerLink="/" class="return-link focus-ring">
              Return to public site
            </a>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class LoginPageComponent {
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  protected submit(): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .login({
        email: this.email(),
        password: this.password(),
      })
      .subscribe((result) => {
        this.isSubmitting.set(false);

        if (!result.success) {
          this.errorMessage.set(result.error ?? 'Sign in failed.');
          return;
        }

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
        void this.router.navigateByUrl(returnUrl);
      });
  }
}
