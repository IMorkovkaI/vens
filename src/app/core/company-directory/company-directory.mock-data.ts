import { Category, Company } from './company-directory.models';
import { DIRECTORY_CATEGORIES } from './company-taxonomy';

export const MOCK_CATEGORIES: Category[] = DIRECTORY_CATEGORIES;

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'cmp-novalens',
    slug: 'novalens',
    name: 'NovaLens',
    description: 'AI research assistant for market teams tracking competitors and product movement.',
    website: 'https://example.com/novalens',
    category: MOCK_CATEGORIES[0],
    tags: ['Market research', 'Competitive intelligence', 'B2B SaaS'],
    aiSummary:
      'NovaLens appears positioned for lean strategy teams that need fast competitor briefings without building internal research operations.',
    seoDescription:
      'Explore NovaLens, an AI market research platform for competitor tracking, category insights, and business intelligence workflows.',
  },
  {
    id: 'cmp-ledgerly',
    slug: 'ledgerly',
    name: 'Ledgerly',
    description: 'Cash-flow planning and invoice intelligence for modern finance operators.',
    website: 'https://example.com/ledgerly',
    category: MOCK_CATEGORIES[1],
    tags: ['Cash flow', 'Invoices', 'Finance ops'],
    aiSummary:
      'Ledgerly focuses on practical finance workflows, combining invoice visibility with forecasting signals for small and mid-market teams.',
    seoDescription:
      'Review Ledgerly, a fintech platform for cash-flow planning, invoice intelligence, and finance operations visibility.',
  },
  {
    id: 'cmp-goldline-studio',
    slug: 'goldline-studio',
    name: 'Goldline Studio',
    description: 'Brand and conversion agency for seed-stage software companies.',
    website: 'https://example.com/goldline-studio',
    category: MOCK_CATEGORIES[2],
    tags: ['Brand strategy', 'Web design', 'Conversion'],
    aiSummary:
      'Goldline Studio is best matched with early software teams that need credible positioning, launch pages, and conversion-focused design.',
    seoDescription:
      'Find Goldline Studio, a brand and conversion agency serving seed-stage SaaS and software startups.',
  },
  {
    id: 'cmp-metricforge',
    slug: 'metricforge',
    name: 'MetricForge',
    description: 'Self-serve analytics workspace for product-led growth teams.',
    website: 'https://example.com/metricforge',
    category: MOCK_CATEGORIES[3],
    tags: ['Product analytics', 'Dashboards', 'PLG'],
    aiSummary:
      'MetricForge emphasizes accessible product metrics and team-ready dashboards, making it useful for growth teams without dedicated data support.',
    seoDescription:
      'Compare MetricForge, a self-serve analytics workspace for product-led growth teams and business dashboards.',
  },
  {
    id: 'cmp-signalharbor',
    slug: 'signalharbor',
    name: 'SignalHarbor',
    description: 'Customer feedback analysis for support, success, and product teams.',
    website: 'https://example.com/signalharbor',
    category: MOCK_CATEGORIES[0],
    tags: ['Feedback analysis', 'Customer success', 'Support'],
    aiSummary:
      'SignalHarbor turns messy customer feedback into themes and action areas, helping support and product teams agree on what matters.',
    seoDescription:
      'Discover SignalHarbor, an AI customer feedback analysis tool for support, success, and product teams.',
  },
  {
    id: 'cmp-clearstack',
    slug: 'clearstack',
    name: 'ClearStack',
    description: 'Operations consultancy helping B2B teams simplify tooling and reporting.',
    website: 'https://example.com/clearstack',
    category: MOCK_CATEGORIES[2],
    tags: ['Operations', 'RevOps', 'Reporting'],
    aiSummary:
      'ClearStack fits teams with tangled internal systems, especially where reporting quality and process ownership are slowing execution.',
    seoDescription:
      'Learn about ClearStack, an operations consultancy for B2B tooling, RevOps process, and reporting improvements.',
  },
];
