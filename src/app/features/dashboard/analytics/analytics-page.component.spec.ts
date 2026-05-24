import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardAnalyticsService } from '../../../core/analytics/dashboard-analytics.service';
import { DirectoryAnalytics } from '../../../core/analytics/dashboard-analytics.models';
import { AnalyticsPageComponent } from './analytics-page.component';

describe('AnalyticsPageComponent', () => {
  const analytics: DirectoryAnalytics = {
    listingCount: 2,
    aiSummaryCount: 2,
    seoDescriptionCount: 2,
    aiCoverage: 100,
    seoReadiness: 100,
    categoryCount: 2,
    averageTags: '1.5',
    categoryMetrics: [
      { name: 'AI Tools', count: 1, percentage: 50 },
      { name: 'Agencies', count: 1, percentage: 50 },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: DashboardAnalyticsService,
          useValue: {
            getDirectoryAnalytics: () => of(analytics),
          },
        },
      ],
    }).compileComponents();
  });

  it('should render basic directory analytics', async () => {
    const fixture = TestBed.createComponent(AnalyticsPageComponent);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Directory performance');
    expect(text).toContain('AI coverage');
    expect(text).toContain('100%');
    expect(text).toContain('AI Tools');
    expect(text).toContain('Agencies');
    expect(text).toContain('1.5');
  });
});
