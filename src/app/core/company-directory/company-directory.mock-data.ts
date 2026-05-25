import { Category, Company } from './company-directory.models';
import { COMPANY_FIXTURES } from './company-directory.fixtures';
import { DIRECTORY_CATEGORIES } from './company-taxonomy';

export const MOCK_CATEGORIES: Category[] = DIRECTORY_CATEGORIES;

export const MOCK_COMPANIES: Company[] = COMPANY_FIXTURES.map(
  ({ categorySlug, ...company }) => ({
    ...company,
    id: `cmp-${company.slug}`,
    category:
      MOCK_CATEGORIES.find((category) => category.slug === categorySlug) ??
      MOCK_CATEGORIES[MOCK_CATEGORIES.length - 1],
  }),
);
