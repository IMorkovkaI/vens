import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Category, Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: CompanyDirectoryService,
          useValue: {
            getCompanies: () => of([company]),
            getCategories: () => of([category]),
          },
        },
      ],
    }).compileComponents();
  });

  it('should render the Vensight public homepage content', () => {
    const fixture = TestBed.createComponent(HomePageComponent);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Premium company intelligence directory');
    expect(compiled.textContent).toContain('Vensight index');
    expect(compiled.textContent).toContain('Featured companies');
    expect(compiled.textContent).toContain('NovaLens');
  });
});
