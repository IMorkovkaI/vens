import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Category, Company } from '../../../core/company-directory/company-directory.models';
import { CompanyDirectoryService } from '../../../core/company-directory/company-directory.service';
import { DashboardHomePageComponent } from './dashboard-home-page.component';

describe('DashboardHomePageComponent', () => {
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
      imports: [DashboardHomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({ email: 'admin@vensight.local', role: 'admin' }),
            canManageListings: () => true,
            canManageDevelopers: () => true,
            logout: () => undefined,
          },
        },
        {
          provide: CompanyDirectoryService,
          useValue: {
            getCompanies: () => of([company]),
          },
        },
      ],
    }).compileComponents();
  });

  it('should render dashboard company metrics', () => {
    const fixture = TestBed.createComponent(DashboardHomePageComponent);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Directory workspace');
    expect(compiled.textContent).toContain('admin@vensight.local');
    expect(compiled.textContent).toContain('Assigned role: admin');
    expect(compiled.textContent).toContain('NovaLens');
    expect(compiled.textContent).toContain('Analytics');
    expect(compiled.textContent).toContain('Discovery');
    expect(compiled.textContent).toContain('AI Analysis');
    expect(compiled.textContent).toContain('Edit listing');
    expect(compiled.textContent).toContain('Developers');
  });
});
