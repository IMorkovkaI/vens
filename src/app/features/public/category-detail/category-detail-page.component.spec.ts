import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Category, Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import { CategoryDetailPageComponent } from './category-detail-page.component';

describe('CategoryDetailPageComponent', () => {
  const category: Category = { id: 'cat-ai', name: 'AI Tools', slug: 'ai-tools' };
  const company: Company = {
    id: 'cmp-novalens',
    slug: 'novalens',
    name: 'NovaLens',
    description: 'AI research assistant for market teams.',
    website: 'https://example.com/novalens',
    category,
    tags: ['Market research'],
    aiSummary: 'NovaLens summarizes competitor movement.',
    seoDescription: 'Explore NovaLens in the Vensight directory.',
  };

  it('should render category page companies', async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'ai-tools' })),
          },
        },
        {
          provide: CompanyDirectoryService,
          useValue: {
            getCategoryBySlug: () => of(category),
            getCompaniesByCategory: () => of([company]),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CategoryDetailPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('AI Tools');
    expect(fixture.nativeElement.textContent).toContain('NovaLens');
    expect(fixture.nativeElement.textContent).toContain('1 profile');
  });

  it('should render a not-found state for unknown categories', async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'unknown' })),
          },
        },
        {
          provide: CompanyDirectoryService,
          useValue: {
            getCategoryBySlug: () => of(undefined),
            getCompaniesByCategory: () => of([]),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CategoryDetailPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Category not found');
  });
});
