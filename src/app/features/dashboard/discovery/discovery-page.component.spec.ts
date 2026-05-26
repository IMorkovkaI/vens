import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../../core/auth/auth.service';
import { DiscoverySearchResponse } from '../../../core/discovery/discovery.models';
import { DiscoveryService } from '../../../core/discovery/discovery.service';
import { DiscoveryPageComponent } from './discovery-page.component';

describe('DiscoveryPageComponent', () => {
  const searchResponse: DiscoverySearchResponse = {
    providers: {
      searchapi: { configured: true },
      tavily: { configured: false },
    },
    results: [
      {
        url: 'https://candidate.example.com',
        title: 'Candidate Company',
        snippet: 'Candidate search result snippet.',
        provider: 'searchapi',
        query: 'biotech companies',
        displayUrl: 'candidate.example.com',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscoveryPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            canUseContributorTools: () => true,
            canManageListings: () => true,
          },
        },
        {
          provide: DiscoveryService,
          useValue: {
            search: () => of(searchResponse),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders search results with source and analysis actions', async () => {
    const fixture = TestBed.createComponent(DiscoveryPageComponent);

    fixture.detectChanges();
    search(fixture.nativeElement);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Candidate Company');
    expect(fixture.nativeElement.textContent).toContain('Public web search');
    expect(fixture.nativeElement.textContent).toContain('Open source');
    expect(fixture.nativeElement.textContent).toContain('Analyze URL');
  });

  it('routes selected results into AI analysis', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(DiscoveryPageComponent);

    fixture.detectChanges();
    search(fixture.nativeElement);
    await fixture.whenStable();
    fixture.detectChanges();

    const analyzeButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find(
      (button: HTMLButtonElement) => button.textContent?.includes('Analyze URL'),
    ) as HTMLButtonElement;
    analyzeButton.click();
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard/ai-analysis'], {
      queryParams: { url: 'https://candidate.example.com' },
    });
  });
});

function search(nativeElement: HTMLElement): void {
  const input = nativeElement.querySelector('input[name="query"]') as HTMLInputElement;
  input.value = 'biotech companies';
  input.dispatchEvent(new Event('input'));

  const searchButton = Array.from(
    nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
  ).find(
    (button: HTMLButtonElement) => button.textContent?.includes('Search companies'),
  ) as HTMLButtonElement;
  searchButton.click();
}
