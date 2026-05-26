import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  AiAnalysisResult,
  AiProviderCheckResult,
} from '../../../core/ai-analysis/ai-analysis.models';
import { AiAnalysisService } from '../../../core/ai-analysis/ai-analysis.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import { AiAnalysisPageComponent } from './ai-analysis-page.component';

describe('AiAnalysisPageComponent', () => {
  const analysisResult: AiAnalysisResult = {
    url: 'https://example.com',
    hostname: 'example.com',
    createdAt: '2026-05-12T12:00:00.000Z',
    fromCache: false,
    provider: 'mock',
    model: 'mock-qwen2.5-7b-profile-generator',
    confidence: 0.85,
    formData: {
      name: 'Example',
      website: 'https://example.com',
      categorySlug: 'ai-tools',
      tags: ['AI analysis', 'Automation'],
      description: 'Example helps teams understand market signals.',
      aiSummary: 'Example appears positioned as an AI tools company.',
      seoDescription: 'Explore Example in Vensight.',
    },
  };
  const company: Company = {
    id: 'cmp-example',
    slug: 'example',
    name: 'Example',
    description: analysisResult.formData.description,
    website: analysisResult.formData.website,
    category: { id: 'cat-ai', name: 'AI Tools', slug: 'ai-tools' },
    tags: analysisResult.formData.tags,
    aiSummary: analysisResult.formData.aiSummary,
    seoDescription: analysisResult.formData.seoDescription,
  };
  const providerCheckResult: AiProviderCheckResult = {
    success: true,
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    normalizedUrl: 'https://example.com',
    hostname: 'example.com',
    durationMs: 480,
    fromCache: false,
    confidence: 0.83,
    createdAt: analysisResult.createdAt,
    profilePreview: {
      name: 'Example',
      description: analysisResult.formData.description,
      categorySlug: analysisResult.formData.categorySlug,
      tags: analysisResult.formData.tags,
      aiSummary: analysisResult.formData.aiSummary,
      seoDescription: analysisResult.formData.seoDescription,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiAnalysisPageComponent],
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
          provide: AiAnalysisService,
          useValue: {
            analyzeUrl: () => of(analysisResult),
            checkSelectedProvider: () => of(providerCheckResult),
            getRecentAnalyses: () => of([]),
          },
        },
        {
          provide: CompanyDirectoryService,
          useValue: {
            createCompany: () => of(company),
          },
        },
      ],
    }).compileComponents();
  });

  it('should render analysis results and create a listing', async () => {
    const fixture = TestBed.createComponent(AiAnalysisPageComponent);

    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[name="url"]') as HTMLInputElement;
    input.value = 'https://example.com';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const analyzeButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Analyze URL'),
    ) as HTMLButtonElement;
    analyzeButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Example');
    expect(fixture.nativeElement.textContent).toContain('New analysis');

    const createButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Create listing'),
    ) as HTMLButtonElement;
    createButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Created listing for Example');
  });

  it('should render provider diagnostics without creating a listing', async () => {
    const fixture = TestBed.createComponent(AiAnalysisPageComponent);

    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[name="url"]') as HTMLInputElement;
    input.value = 'https://example.com';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const providerButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Validate provider'),
    ) as HTMLButtonElement;
    providerButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Provider ready');
    expect(fixture.nativeElement.textContent).toContain('groq diagnostics');
    expect(fixture.nativeElement.textContent).toContain('llama-3.1-8b-instant');
    expect(fixture.nativeElement.textContent).not.toContain('Created listing for Example');
  });
});
