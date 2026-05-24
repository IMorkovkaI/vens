export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  description: string;
  website: string;
  category: Category;
  tags: string[];
  aiSummary: string;
  seoDescription: string;
}

export interface CompanySearchFilters {
  query: string;
  categorySlug: string;
}

export interface CompanyFormData {
  name: string;
  description: string;
  website: string;
  categorySlug: string;
  tags: string[];
  aiSummary: string;
  seoDescription: string;
}
