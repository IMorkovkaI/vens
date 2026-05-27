import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompanyDirectoryService } from './company-directory.service';

describe('CompanyDirectoryService', () => {
  let service: CompanyDirectoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: PLATFORM_ID,
          useValue: 'server',
        },
      ],
    });
    service = TestBed.inject(CompanyDirectoryService);
  });

  it('should list launch companies', async () => {
    const companies = await firstValueFrom(service.getCompanies());
    const resultCount = companies.length;

    expect(resultCount).toBeGreaterThan(0);
  });

  it('should include at least one company for every category', async () => {
    const [categories, companies] = await Promise.all([
      firstValueFrom(service.getCategories()),
      firstValueFrom(service.getCompanies()),
    ]);
    const companyCountsByCategory = new Map<string, number>();

    for (const company of companies) {
      const categorySlug = company.category.slug;
      companyCountsByCategory.set(
        categorySlug,
        (companyCountsByCategory.get(categorySlug) ?? 0) + 1,
      );
    }

    expect(
      categories.every((category) => (companyCountsByCategory.get(category.slug) ?? 0) >= 1),
    ).toBe(true);
  });

  it('should not show example.com websites in launch fixtures', async () => {
    const companies = await firstValueFrom(service.getCompanies());

    expect(companies.every((company) => !company.website.includes('example.com'))).toBe(true);
  });

  it('should filter companies by category and search text', async () => {
    const companies = await firstValueFrom(
      service.searchCompanies({ query: 'feedback', categorySlug: 'ai-tools' }),
    );
    const names = companies.map((company) => company.name);

    expect(names).toEqual(['SignalHarbor']);
  });

  it('should return an empty state for unmatched filters', async () => {
    const companies = await firstValueFrom(
      service.searchCompanies({ query: 'no matching business', categorySlug: '' }),
    );
    const resultCount = companies.length;

    expect(resultCount).toBe(0);
  });

  it('should look up company detail data by slug', async () => {
    const company = await firstValueFrom(service.getCompanyBySlug('novalens'));
    const companyName = company?.name ?? '';

    expect(companyName).toBe('NovaLens');
  });

  it('should look up category data and companies by category', async () => {
    const category = await firstValueFrom(service.getCategoryBySlug('ai-tools'));
    const companies = await firstValueFrom(service.getCompaniesByCategory('ai-tools'));

    expect(category?.name).toBe('AI Tools');
    expect(companies.map((company) => company.name)).toContain('NovaLens');
    expect(companies.every((company) => company.category.slug === 'ai-tools')).toBe(true);
  });

  it('should return similar companies from local data', async () => {
    const company = await firstValueFrom(service.getCompanyBySlug('novalens'));

    expect(company).toBeTruthy();

    const similarCompanies = await firstValueFrom(service.getSimilarCompanies(company!));
    const similarNames = similarCompanies.map((similarCompany) => similarCompany.name);

    expect(similarNames).toContain('SignalHarbor');
  });

  it('should create a company in the in-memory directory', async () => {
    const company = await firstValueFrom(
      service.createCompany({
        name: 'Test Listing',
        description: 'A temporary company used to verify dashboard management.',
        website: 'https://example.com/test-listing',
        categorySlug: 'analytics',
        tags: ['Testing', 'Dashboard'],
        aiSummary: 'Test Listing is used for management flow validation.',
        seoDescription: 'Review Test Listing in the Vensight directory.',
      }),
    );
    const lookup = await firstValueFrom(service.getCompanyBySlug(company.slug));

    expect(company.slug).toBe('test-listing');
    expect(lookup?.name).toBe('Test Listing');
  });

  it('should update a company in the in-memory directory', async () => {
    const company = await firstValueFrom(
      service.updateCompany('novalens', {
        name: 'NovaLens Updated',
        description: 'Updated AI research assistant profile.',
        website: 'https://www.novalens.co',
        categorySlug: 'ai-tools',
        tags: ['Market research'],
        aiSummary: 'Updated AI summary.',
        seoDescription: 'Updated SEO description.',
      }),
    );
    const lookup = await firstValueFrom(service.getCompanyBySlug('novalens'));

    expect(company?.name).toBe('NovaLens Updated');
    expect(lookup?.name).toBe('NovaLens Updated');
  });
});
