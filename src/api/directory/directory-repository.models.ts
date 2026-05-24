import { DirectoryAnalytics } from '../../app/core/analytics/dashboard-analytics.models';
import {
  Category,
  Company,
  CompanyFormData,
  CompanySearchFilters,
} from '../../app/core/company-directory/company-directory.models';

export interface DirectoryRepository {
  listCategories(): Promise<Category[]>;
  listCompanies(filters?: CompanySearchFilters): Promise<Company[]>;
  listCompaniesByCategory(categorySlug: string): Promise<Company[]>;
  findCompanyBySlug(slug: string): Promise<Company | undefined>;
  getDirectoryAnalytics(): Promise<DirectoryAnalytics>;
  createCompany(formData: CompanyFormData): Promise<Company>;
  updateCompany(slug: string, formData: CompanyFormData): Promise<Company | undefined>;
}
