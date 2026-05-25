import { afterEach, describe, expect, it } from 'vitest';
import { PrismaDirectoryRepository } from '../database/prisma-directory.repository';
import { InMemoryDirectoryRepository } from './directory-store';
import {
  createInMemoryDirectoryRepository,
  getDirectoryRepository,
  hasDatabaseUrl,
  resetDirectoryRepositoryForTests,
} from './directory-repository';
import { CompanyFormData } from '../../app/core/company-directory/company-directory.models';
import { COMPANY_FIXTURES } from '../../app/core/company-directory/company-directory.fixtures';
import { DIRECTORY_CATEGORIES } from '../../app/core/company-directory/company-taxonomy';

const originalDatabaseUrl = process.env['DATABASE_URL'];

describe('directory repository selection', () => {
  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env['DATABASE_URL'];
    } else {
      process.env['DATABASE_URL'] = originalDatabaseUrl;
    }

    resetDirectoryRepositoryForTests();
  });

  it('uses the in-memory repository when DATABASE_URL is absent', () => {
    delete process.env['DATABASE_URL'];

    expect(hasDatabaseUrl()).toBe(false);
    expect(getDirectoryRepository()).toBeInstanceOf(InMemoryDirectoryRepository);
  });

  it('uses the Prisma repository when DATABASE_URL is configured', () => {
    process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/vensight';

    expect(hasDatabaseUrl()).toBe(true);
    expect(getDirectoryRepository()).toBeInstanceOf(PrismaDirectoryRepository);
  });
});

describe('in-memory directory repository contract', () => {
  const formData: CompanyFormData = {
    name: 'NovaLens',
    website: 'https://example.com/new-novalens',
    categorySlug: 'ai-tools',
    tags: ['AI analysis', 'Research'],
    description: 'Updated company description for repository tests.',
    aiSummary: 'Repository test summary.',
    seoDescription: 'Repository test SEO description.',
  };

  it('lists categories and seeded companies', async () => {
    const repository = createInMemoryDirectoryRepository();

    await expect(repository.listCategories()).resolves.toContainEqual({
      id: 'cat-ai',
      name: 'AI Tools',
      slug: 'ai-tools',
    });
    await expect(repository.listCompanies()).resolves.toHaveLength(
      COMPANY_FIXTURES.length,
    );
  });

  it('filters companies by query text and category slug', async () => {
    const repository = createInMemoryDirectoryRepository();
    const companies = await repository.listCompanies({
      query: 'customer feedback',
      categorySlug: 'ai-tools',
    });

    expect(companies.map((company) => company.slug)).toEqual(['signalharbor']);
  });

  it('finds one company by slug', async () => {
    const repository = createInMemoryDirectoryRepository();

    await expect(repository.findCompanyBySlug('novalens')).resolves.toMatchObject({
      name: 'NovaLens',
      category: {
        slug: 'ai-tools',
      },
    });
  });

  it('creates companies with unique slugs', async () => {
    const repository = createInMemoryDirectoryRepository();
    const company = await repository.createCompany(formData);

    expect(company.slug).toBe('novalens-2');
    await expect(repository.findCompanyBySlug('novalens-2')).resolves.toMatchObject({
      name: 'NovaLens',
    });
  });

  it('updates an existing company without changing its slug', async () => {
    const repository = createInMemoryDirectoryRepository();
    const updatedCompany = await repository.updateCompany('novalens', {
      ...formData,
      name: 'NovaLens Updated',
      tags: ['Updated', 'AI'],
    });

    expect(updatedCompany).toMatchObject({
      slug: 'novalens',
      name: 'NovaLens Updated',
      tags: ['Updated', 'AI'],
    });
  });

  it('computes directory analytics from repository data', async () => {
    const repository = createInMemoryDirectoryRepository();
    const analytics = await repository.getDirectoryAnalytics();
    const firstCategorySlug = DIRECTORY_CATEGORIES[0].slug;
    const firstCategoryFixtureCount = COMPANY_FIXTURES.filter(
      (company) => company.categorySlug === firstCategorySlug,
    ).length;
    const firstCategoryPercentage = Math.round(
      (firstCategoryFixtureCount / COMPANY_FIXTURES.length) * 100,
    );

    expect(analytics).toMatchObject({
      listingCount: COMPANY_FIXTURES.length,
      aiSummaryCount: COMPANY_FIXTURES.length,
      seoDescriptionCount: COMPANY_FIXTURES.length,
      aiCoverage: 100,
      seoReadiness: 100,
      categoryCount: DIRECTORY_CATEGORIES.length,
    });
    expect(analytics.categoryMetrics[0]).toMatchObject({
      count: firstCategoryFixtureCount,
      percentage: firstCategoryPercentage,
    });
  });
});
