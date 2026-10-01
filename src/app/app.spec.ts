import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './core/auth/auth.service';

@Component({ template: '' })
class TestPage {}

describe('App', () => {
  const role = signal<'admin' | 'developer' | 'user' | null>(null);
  beforeEach(async () => {
    role.set(null);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: '**', component: TestPage }]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => role() !== null,
            currentUser: () => (role() ? { email: 'review@example.test', role: role() } : null),
            canManageListings: () => role() === 'admin' || role() === 'developer',
            canManageDevelopers: () => role() === 'admin',
            logout: () => role.set(null),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the public app shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Vensight');
    expect(compiled.textContent).toContain('Companies');
    expect(compiled.textContent).toContain('Sign in');
    expect(compiled.textContent).toContain('Create account');
    expect(compiled.querySelector('.workspace-sidebar')).toBeNull();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  for (const userRole of ['user', 'developer', 'admin'] as const) {
    it(`renders only the permitted workspace links for ${userRole}`, async () => {
      role.set(userRole);
      const fixture = TestBed.createComponent(App);
      await TestBed.inject(Router).navigateByUrl('/dashboard');
      await fixture.whenStable();
      fixture.detectChanges();
      const shell = fixture.nativeElement as HTMLElement;
      expect(shell.querySelector('a[href="/dashboard/discovery"]')).toBeTruthy();
      expect(Boolean(shell.querySelector('a[href="/dashboard/companies/new"]'))).toBe(
        userRole !== 'user',
      );
      expect(Boolean(shell.querySelector('a[href="/dashboard/developers"]'))).toBe(
        userRole === 'admin',
      );
      expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
        'noindex, nofollow',
      );
    });
  }

  it('closes mobile navigation on route changes', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.menu-toggle') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    await TestBed.inject(Router).navigateByUrl('/companies');
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
