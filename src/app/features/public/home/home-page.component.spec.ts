import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import {
  MOCK_CATEGORIES,
  MOCK_COMPANIES,
} from '../../../core/company-directory/company-directory.mock-data';
import { Company } from '../../../core/company-directory/company-directory.models';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  const authenticated = signal(false);
  let directory: jasmine.SpyObj<CompanyDirectoryService>;

  beforeEach(async () => {
    authenticated.set(false);
    directory = jasmine.createSpyObj('CompanyDirectoryService', ['getCompanies', 'getCategories']);
    directory.getCompanies.and.returnValue(of(MOCK_COMPANIES));
    directory.getCategories.and.returnValue(of(MOCK_CATEGORIES));
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        { provide: CompanyDirectoryService, useValue: directory },
        { provide: AuthService, useValue: { isAuthenticated: authenticated } },
      ],
    }).compileComponents();
  });

  it('shows four profiles but derives counts from the full directory and enables indexing', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('app-company-card').length).toBe(4);
    expect(element.querySelector('.directory-summary')?.textContent).toContain(
      String(MOCK_COMPANIES.length),
    );
    expect(element.querySelectorAll('.category-list li').length).toBe(MOCK_CATEGORIES.length);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index, follow',
    );
  });

  it('replaces account creation with contributor tools when authenticated', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    authenticated.set(true);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('a[href="/dashboard/register"]')).toBeNull();
    expect(element.querySelector('a[href="/dashboard/discovery"]')).not.toBeNull();
    expect(element.querySelector('a[href="/dashboard/ai-analysis"]')).not.toBeNull();
  });

  it('shows loading, then an error, and recovers to an empty directory on retry', () => {
    const pending = new Subject<Company[]>();
    directory.getCompanies.and.returnValues(pending, of([]));
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    pending.error(new Error('Unavailable'));
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    fixture.detectChanges();
    expect(element.textContent).toContain('No company profiles are available yet.');
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('does not show partial counts if categories fail', () => {
    directory.getCategories.and.returnValue(throwError(() => new Error('Unavailable')));
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.directory-summary').textContent).toContain(
      'Directory unavailable',
    );
  });

  it('trims search text and preserves the directory query contract', async () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '  market research  ';
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { cancelable: true }));
    expect(navigate).toHaveBeenCalledWith(['/companies'], {
      queryParams: { q: 'market research' },
    });
  });
});
