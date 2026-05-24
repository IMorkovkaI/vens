import {
  Category,
  Company,
  CompanyFormData,
  CompanySearchFilters,
} from '../../app/core/company-directory/company-directory.models';
import { DIRECTORY_CATEGORIES } from '../../app/core/company-directory/company-taxonomy';
import { DirectoryAnalytics } from '../../app/core/analytics/dashboard-analytics.models';
import {
  createUniqueSlug,
  filterCompanies,
  getDirectoryAnalytics,
} from '../directory/directory-helpers';
import { DirectoryRepository } from '../directory/directory-repository.models';
import { getPrismaClient } from './prisma.client';

type CompanyWithCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  website: string;
  tags: string[];
  aiSummary: string;
  seoDescription: string;
  category: Category;
};

export class PrismaDirectoryRepository implements DirectoryRepository {
  private readonly prisma = getPrismaClient();

  async listCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }

  async listCompanies(filters: CompanySearchFilters): Promise<Company[]> {
    const categorySlug = filters.categorySlug.trim();

    const companies = await this.prisma.company.findMany({
      where: {
        ...(categorySlug
          ? {
              category: {
                slug: categorySlug,
              },
            }
          : {}),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return filterCompanies(
      companies.map((company) => this.mapCompany(company)),
      filters,
    );
  }

  async listCompaniesByCategory(categorySlug: string): Promise<Company[]> {
    return this.listCompanies({ query: '', categorySlug });
  }

  async findCompanyBySlug(slug: string): Promise<Company | undefined> {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return company ? this.mapCompany(company) : undefined;
  }

  async getDirectoryAnalytics(): Promise<DirectoryAnalytics> {
    const companies = await this.listCompanies({ query: '', categorySlug: '' });

    return getDirectoryAnalytics(companies);
  }

  async createCompany(formData: CompanyFormData): Promise<Company> {
    const existingCompanies = await this.prisma.company.findMany({
      select: { slug: true },
    });
    const slug = createUniqueSlug(
      formData.name,
      existingCompanies.map((company) => company.slug),
    );
    const categorySlug = await this.resolveCategorySlug(formData.categorySlug);
    const company = await this.prisma.company.create({
      data: {
        slug,
        name: formData.name.trim(),
        description: formData.description.trim(),
        website: formData.website.trim(),
        tags: formData.tags.map((tag) => tag.trim()).filter(Boolean),
        aiSummary: formData.aiSummary.trim(),
        seoDescription: formData.seoDescription.trim(),
        category: {
          connect: { slug: categorySlug },
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return this.mapCompany(company);
  }

  async updateCompany(slug: string, formData: CompanyFormData): Promise<Company | undefined> {
    const existingCompany = await this.findCompanyBySlug(slug);

    if (!existingCompany) {
      return undefined;
    }

    const categorySlug = await this.resolveCategorySlug(formData.categorySlug);
    const company = await this.prisma.company.update({
      where: { slug },
      data: {
        name: formData.name.trim(),
        description: formData.description.trim(),
        website: formData.website.trim(),
        tags: formData.tags.map((tag) => tag.trim()).filter(Boolean),
        aiSummary: formData.aiSummary.trim(),
        seoDescription: formData.seoDescription.trim(),
        category: {
          connect: { slug: categorySlug },
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return this.mapCompany(company);
  }

  private mapCompany(company: CompanyWithCategory): Company {
    return {
      id: company.id,
      slug: company.slug,
      name: company.name,
      description: company.description,
      website: company.website,
      category: company.category,
      tags: company.tags,
      aiSummary: company.aiSummary,
      seoDescription: company.seoDescription,
    };
  }

  private async resolveCategorySlug(categorySlug: string): Promise<string> {
    const requestedCategory = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { slug: true },
    });

    if (requestedCategory) {
      return requestedCategory.slug;
    }

    const taxonomyCategory = DIRECTORY_CATEGORIES.find(
      (category) => category.slug === categorySlug,
    );

    if (taxonomyCategory) {
      const createdCategory = await this.prisma.category.upsert({
        where: { slug: taxonomyCategory.slug },
        update: { name: taxonomyCategory.name },
        create: {
          name: taxonomyCategory.name,
          slug: taxonomyCategory.slug,
        },
        select: { slug: true },
      });

      return createdCategory.slug;
    }

    const firstCategory = await this.prisma.category.findFirst({
      orderBy: { name: 'asc' },
      select: { slug: true },
    });

    if (!firstCategory) {
      throw new Error('At least one category is required before saving companies.');
    }

    return firstCategory.slug;
  }
}
