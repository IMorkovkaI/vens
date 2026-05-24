import { DirectoryAnalytics } from '../../app/core/analytics/dashboard-analytics.models';
import {
  Company,
  CompanySearchFilters,
} from '../../app/core/company-directory/company-directory.models';

export function filterCompanies(
  companies: Company[],
  filters: CompanySearchFilters = { query: '', categorySlug: '' },
): Company[] {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const categorySlug = filters.categorySlug.trim();

  return companies.filter((company) => {
    const matchesCategory = !categorySlug || company.category.slug === categorySlug;
    const matchesQuery =
      !normalizedQuery ||
      [
        company.name,
        company.description,
        company.category.name,
        company.aiSummary,
        ...company.tags,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}

export function createUniqueSlug(name: string, existingSlugs: Iterable<string>): string {
  const baseSlug = createBaseSlug(name);
  const existingSlugSet = new Set(existingSlugs);

  if (!existingSlugSet.has(baseSlug)) {
    return baseSlug;
  }

  let index = 2;
  let candidateSlug = `${baseSlug}-${index}`;

  while (existingSlugSet.has(candidateSlug)) {
    index += 1;
    candidateSlug = `${baseSlug}-${index}`;
  }

  return candidateSlug;
}

export function getDirectoryAnalytics(companies: Company[]): DirectoryAnalytics {
  const listingCount = companies.length;
  const aiSummaryCount = companies.filter((company) => company.aiSummary.trim()).length;
  const seoDescriptionCount = companies.filter((company) =>
    company.seoDescription.trim(),
  ).length;
  const categoryMetrics = getCategoryMetrics(companies);

  return {
    listingCount,
    aiSummaryCount,
    seoDescriptionCount,
    aiCoverage: percentage(aiSummaryCount, listingCount),
    seoReadiness: percentage(seoDescriptionCount, listingCount),
    categoryCount: categoryMetrics.length,
    averageTags: averageTags(companies),
    categoryMetrics,
  };
}

function createBaseSlug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'company'
  );
}

function getCategoryMetrics(companies: Company[]) {
  const total = companies.length;
  const counts = new Map<string, number>();

  for (const company of companies) {
    counts.set(company.category.name, (counts.get(company.category.name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

function averageTags(companies: Company[]): string {
  if (!companies.length) {
    return '0.0';
  }

  const tagCount = companies.reduce((total, company) => total + company.tags.length, 0);

  return (tagCount / companies.length).toFixed(1);
}

function percentage(count: number, total: number): number {
  if (!total) {
    return 0;
  }

  return Math.round((count / total) * 100);
}
