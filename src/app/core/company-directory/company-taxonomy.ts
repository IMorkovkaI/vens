import { Category } from './company-directory.models';

export const DIRECTORY_CATEGORIES: Category[] = [
  { id: 'cat-ai', name: 'AI Tools', slug: 'ai-tools' },
  { id: 'cat-fintech', name: 'Fintech', slug: 'fintech' },
  { id: 'cat-agency', name: 'Agencies', slug: 'agencies' },
  { id: 'cat-analytics', name: 'Analytics', slug: 'analytics' },
  { id: 'cat-healthtech', name: 'HealthTech', slug: 'healthtech' },
  { id: 'cat-biotech-pharma', name: 'Biotech & Pharma', slug: 'biotech-pharma' },
  { id: 'cat-ecommerce', name: 'E-commerce', slug: 'ecommerce' },
  { id: 'cat-cybersecurity', name: 'Cybersecurity', slug: 'cybersecurity' },
  { id: 'cat-developer-tools', name: 'Developer Tools', slug: 'developer-tools' },
  { id: 'cat-productivity', name: 'Productivity', slug: 'productivity' },
  { id: 'cat-marketing', name: 'Marketing', slug: 'marketing' },
  { id: 'cat-education', name: 'Education', slug: 'education' },
  { id: 'cat-consumer', name: 'Consumer', slug: 'consumer' },
  { id: 'cat-enterprise-software', name: 'Enterprise Software', slug: 'enterprise-software' },
  { id: 'cat-logistics', name: 'Logistics', slug: 'logistics' },
  { id: 'cat-real-estate', name: 'Real Estate', slug: 'real-estate' },
  { id: 'cat-legaltech', name: 'LegalTech', slug: 'legaltech' },
  { id: 'cat-hrtech', name: 'HRTech', slug: 'hrtech' },
  { id: 'cat-media', name: 'Media', slug: 'media' },
  { id: 'cat-other', name: 'Other', slug: 'other' },
];

export const DIRECTORY_CATEGORY_SLUGS = DIRECTORY_CATEGORIES.map(
  (category) => category.slug,
);

export function isDirectoryCategorySlug(value: string): boolean {
  return DIRECTORY_CATEGORY_SLUGS.includes(value);
}

export function getCategoryName(categorySlug: string): string {
  return (
    DIRECTORY_CATEGORIES.find((category) => category.slug === categorySlug)?.name ??
    'business'
  );
}
