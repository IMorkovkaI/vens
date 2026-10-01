import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page-hero">
      <div class="auth-layout">
        <div>
          <p class="eyebrow">Contributor access</p>
          <h1 class="mt-4 text-4xl font-semibold text-slate-950">Create your Vensight account</h1>
          <p class="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Get one company discovery search and one URL analysis per day. Publishing listings
            requires developer or admin access.
          </p>
        </div>

        <form class="surface-card p-6" (ngSubmit)="submit()">
          <div class="grid gap-5">
            <label class="block">
              <span class="text-sm font-semibold text-slate-900">Email</span>
              <input
                class="form-input"
                type="email"
                required
                autocomplete="email"
                name="email"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
              />
            </label>

            <label class="block">
              <span class="text-sm font-semibold text-slate-900">Password</span>
              <input
                class="form-input"
                type="password"
                required
                autocomplete="new-password"
                name="password"
                [ngModel]="password()"
                (ngModelChange)="password.set($event)"
              />
            </label>

            <label class="block">
              <span class="text-sm font-semibold text-slate-900">Confirm password</span>
              <input
                class="form-input"
                type="password"
                required
                autocomplete="new-password"
                name="confirmPassword"
                [ngModel]="confirmPassword()"
                (ngModelChange)="confirmPassword.set($event)"
              />
            </label>
          </div>

          @if (errorMessage()) {
            <div class="mt-5 status-error" role="alert">
              {{ errorMessage() }}
            </div>
          }

          <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" class="btn-primary focus-ring" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Creating...' : 'Create account' }}
            </button>
            <a routerLink="/dashboard/login" class="return-link focus-ring"> Back to sign in </a>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class RegisterPageComponent {
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  protected submit(): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .register({
        email: this.email(),
        password: this.password(),
        confirmPassword: this.confirmPassword(),
      })
      .subscribe((result) => {
        this.isSubmitting.set(false);

        if (!result.success) {
          this.errorMessage.set(result.error ?? 'Registration failed.');
          return;
        }

        void this.router.navigateByUrl('/dashboard/login');
      });
  }
}
