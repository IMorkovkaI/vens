import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import { CompetitorComparisonService } from '../../../core/competitor-comparison/competitor-comparison.service';
import { CompetitorComparisonResult } from '../../../core/competitor-comparison/competitor-comparison.models';
import { SeoService } from '../../../core/seo/seo.service';
import { ComparePageComponent } from './compare-page.component';

describe('ComparePageComponent', () => {
  const companies: Company[] = [
    {
      id: 'cmp-novalens',
      slug: 'novalens',
      name: 'NovaLens',
      description: 'AI research assistant for market teams.',
      website: 'https://example.com/novalens',
      category: { id: 'cat-ai', name: 'AI Tools', slug: 'ai-tools' },
      tags: ['Market research', 'AI'],
      aiSummary: 'NovaLens summarizes competitor movement.',
      seoDescription: 'Explore NovaLens in Vensight.',
    },
    {
      id: 'cmp-signalharbor',
      slug: 'signalharbor',
      name: 'SignalHarbor',
      description: 'Customer feedback analysis for product teams.',
      website: 'https://example.com/signalharbor',
      category: { id: 'cat-ai', name: 'AI Tools', slug: 'ai-tools' },
      tags: ['Feedback analysis', 'AI'],
      aiSummary: 'SignalHarbor turns feedback into themes.',
      seoDescription: 'Discover SignalHarbor in Vensight.',
    },
  ];
  const comparison: CompetitorComparisonResult = {
    leftCompany: companies[0],
    rightCompany: companies[1],
    sharedCategory: true,
    overlappingTags: ['AI'],
    differentiators: [
      {
        companyName: 'NovaLens',
        points: ['Competes directly inside AI Tools.'],
      },
      {
        companyName: 'SignalHarbor',
        points: ['Distinct signals include Feedback analysis.'],
      },
    ],
    summary: 'NovaLens and SignalHarbor both sit in AI Tools.',
    recommendation: 'Compare proof, use cases, and audience fit.',
    provider: 'mock',
    model: 'mock-qwen2.5-7b-competitor-comparison',
    confidence: 0.87,
    createdAt: '2026-05-12T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: CompanyDirectoryService,
          useValue: {
            getCompanies: () => of(companies),
          },
        },
        {
          provide: CompetitorComparisonService,
          useValue: {
            compareCompanies: () => of(comparison),
          },
        },
        {
          provide: SeoService,
          useValue: {
            apply: () => undefined,
          },
        },
      ],
    }).compileComponents();
  });

  it('should compare two companies and render AI-assisted insights', async () => {
    const fixture = TestBed.createComponent(ComparePageComponent);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compareButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Compare'),
    ) as HTMLButtonElement;
    compareButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('NovaLens vs SignalHarbor');
    expect(text).toContain('87% confidence');
    expect(text).toContain('Decision notes');
    expect(text).toContain('Vensight comparison engine');
    const panels = fixture.nativeElement.querySelectorAll(
      '.comparison-company',
    ) as NodeListOf<HTMLElement>;
    expect(panels.length).toBe(2);
    panels.forEach((panel, index) => {
      expect(panel.querySelector('.eyebrow')?.textContent).toContain(`Company ${index + 1}`);
      const heading = panel.querySelector('h3');
      expect(heading?.textContent).toContain(companies[index].name);
      expect(panel.getAttribute('aria-labelledby')).toBe(heading?.id ?? null);
      expect(panel.querySelectorAll('li').length).toBe(1);
      expect(panel.textContent).not.toContain('Decision notes');
    });
  });
});
