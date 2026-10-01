import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { SeoService } from './core/seo/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  protected readonly menuOpen = signal(false);
  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split(/[?#]/)[0]),
    ),
    { initialValue: this.router.url.split(/[?#]/)[0] },
  );
  protected readonly isWorkspace = computed(
    () =>
      this.path().startsWith('/dashboard') &&
      !['/dashboard/login', '/dashboard/register'].includes(this.path()),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.menuOpen.set(false);
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        // Private screens must not inherit public canonical metadata on client navigation.
        if (path.startsWith('/dashboard')) {
          this.seo.apply({
            title: 'Workspace | Vensight',
            description: 'Vensight account and company workspace.',
            canonicalPath: path,
            noIndex: true,
          });
        }
      });
  }

  protected closeMenu(button?: HTMLButtonElement): void {
    this.menuOpen.set(false);
    button?.focus();
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/dashboard/login');
  }
}
