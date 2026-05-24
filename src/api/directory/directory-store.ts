import {
  Category,
  Company,
  CompanyFormData,
  CompanySearchFilters,
} from '../../app/core/company-directory/company-directory.models';
import {
  MOCK_CATEGORIES,
  MOCK_COMPANIES,
} from '../../app/core/company-directory/company-directory.mock-data';
import { DirectoryAnalytics } from '../../app/core/analytics/dashboard-analytics.models';
import {
  createUniqueSlug,
  filterCompanies,
  getDirectoryAnalytics,
} from './directory-helpers';
import { DirectoryRepository } from './directory-repository.models';

export class DirectoryStore {
  private companies = [...MOCK_COMPANIES];

  listCategories(): Category[] {
    return MOCK_CATEGORIES;
  }

  listCompanies(filters: CompanySearchFilters = { query: '', categorySlug: '' }): Company[] {
    return filterCompanies(this.companies, filters);
  }

  listCompaniesByCategory(categorySlug: string): Company[] {
    return this.listCompanies({ query: '', categorySlug });
  }

  findCompanyBySlug(slug: string): Company | undefined {
    return this.companies.find((company) => company.slug === slug);
  }

  getDirectoryAnalytics(): DirectoryAnalytics {
    return getDirectoryAnalytics(this.companies);
  }

  createCompany(formData: CompanyFormData): Company {
    const company = this.buildCompany(formData, this.createUniqueSlug(formData.name));

    this.companies = [company, ...this.companies];

    return company;
  }

  updateCompany(slug: string, formData: CompanyFormData): Company | undefined {
    const existingCompany = this.findCompanyBySlug(slug);

    if (!existingCompany) {
      return undefined;
    }

    const updatedCompany = this.buildCompany(formData, existingCompany.slug, existingCompany.id);

    this.companies = this.companies.map((company) =>
      company.slug === slug ? updatedCompany : company,
    );

    return updatedCompany;
  }

  private buildCompany(
    formData: CompanyFormData,
    slug: string,
    id = `cmp-${slug}`,
  ): Company {
    return {
      id,
      slug,
      name: formData.name.trim(),
      description: formData.description.trim(),
      website: formData.website.trim(),
      category: this.findCategory(formData.categorySlug),
      tags: formData.tags.map((tag) => tag.trim()).filter(Boolean),
      aiSummary: formData.aiSummary.trim(),
      seoDescription: formData.seoDescription.trim(),
    };
  }

  private findCategory(categorySlug: string): Category {
    return (
      MOCK_CATEGORIES.find((category) => category.slug === categorySlug) ??
      MOCK_CATEGORIES[0]
    );
  }

  private createUniqueSlug(name: string): string {
    return createUniqueSlug(
      name,
      this.companies.map((company) => company.slug),
    );
  }
}

export class InMemoryDirectoryRepository implements DirectoryRepository {
  constructor(private readonly store = new DirectoryStore()) {}

  async listCategories(): Promise<Category[]> {
    return this.store.listCategories();
  }

  async listCompanies(
    filters: CompanySearchFilters = { query: '', categorySlug: '' },
  ): Promise<Company[]> {
    return this.store.listCompanies(filters);
  }

  async listCompaniesByCategory(categorySlug: string): Promise<Company[]> {
    return this.store.listCompaniesByCategory(categorySlug);
  }

  async findCompanyBySlug(slug: string): Promise<Company | undefined> {
    return this.store.findCompanyBySlug(slug);
  }

  async getDirectoryAnalytics(): Promise<DirectoryAnalytics> {
    return this.store.getDirectoryAnalytics();
  }

  async createCompany(formData: CompanyFormData): Promise<Company> {
    return this.store.createCompany(formData);
  }

  async updateCompany(
    slug: string,
    formData: CompanyFormData,
  ): Promise<Company | undefined> {
    return this.store.updateCompany(slug, formData);
  }
}

export const directoryStore = new DirectoryStore();
