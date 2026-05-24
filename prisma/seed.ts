import '../src/api/environment/load-env';
import { PrismaClient, DashboardRole } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/api/auth/password-hasher';
import {
  SEEDED_ADMIN_EMAIL,
  resolveSeededAdminPassword,
} from '../src/api/auth/seeded-admin-config';
import { validateDashboardPassword } from '../src/app/core/auth/password-policy';
import { DIRECTORY_CATEGORIES } from '../src/app/core/company-directory/company-taxonomy';

const categories = DIRECTORY_CATEGORIES.map(({ name, slug }) => ({ name, slug }));

const companies = [
  {
    slug: 'novalens',
    name: 'NovaLens',
    description:
      'AI research assistant for market teams tracking competitors and product movement.',
    website: 'https://example.com/novalens',
    categorySlug: 'ai-tools',
    tags: ['Market research', 'Competitive intelligence', 'B2B SaaS'],
    aiSummary:
      'NovaLens appears positioned for lean strategy teams that need fast competitor briefings without building internal research operations.',
    seoDescription:
      'Explore NovaLens, an AI market research platform for competitor tracking, category insights, and business intelligence workflows.',
  },
  {
    slug: 'ledgerly',
    name: 'Ledgerly',
    description: 'Cash-flow planning and invoice intelligence for modern finance operators.',
    website: 'https://example.com/ledgerly',
    categorySlug: 'fintech',
    tags: ['Cash flow', 'Invoices', 'Finance ops'],
    aiSummary:
      'Ledgerly focuses on practical finance workflows, combining invoice visibility with forecasting signals for small and mid-market teams.',
    seoDescription:
      'Review Ledgerly, a fintech platform for cash-flow planning, invoice intelligence, and finance operations visibility.',
  },
  {
    slug: 'goldline-studio',
    name: 'Goldline Studio',
    description: 'Brand and conversion agency for seed-stage software companies.',
    website: 'https://example.com/goldline-studio',
    categorySlug: 'agencies',
    tags: ['Brand strategy', 'Web design', 'Conversion'],
    aiSummary:
      'Goldline Studio is best matched with early software teams that need credible positioning, launch pages, and conversion-focused design.',
    seoDescription:
      'Find Goldline Studio, a brand and conversion agency serving seed-stage SaaS and software startups.',
  },
  {
    slug: 'metricforge',
    name: 'MetricForge',
    description: 'Self-serve analytics workspace for product-led growth teams.',
    website: 'https://example.com/metricforge',
    categorySlug: 'analytics',
    tags: ['Product analytics', 'Dashboards', 'PLG'],
    aiSummary:
      'MetricForge emphasizes accessible product metrics and team-ready dashboards, making it useful for growth teams without dedicated data support.',
    seoDescription:
      'Compare MetricForge, a self-serve analytics workspace for product-led growth teams and business dashboards.',
  },
  {
    slug: 'signalharbor',
    name: 'SignalHarbor',
    description: 'Customer feedback analysis for support, success, and product teams.',
    website: 'https://example.com/signalharbor',
    categorySlug: 'ai-tools',
    tags: ['Feedback analysis', 'Customer success', 'Support'],
    aiSummary:
      'SignalHarbor turns messy customer feedback into themes and action areas, helping support and product teams agree on what matters.',
    seoDescription:
      'Discover SignalHarbor, an AI customer feedback analysis tool for support, success, and product teams.',
  },
  {
    slug: 'clearstack',
    name: 'ClearStack',
    description: 'Operations consultancy helping B2B teams simplify tooling and reporting.',
    website: 'https://example.com/clearstack',
    categorySlug: 'agencies',
    tags: ['Operations', 'RevOps', 'Reporting'],
    aiSummary:
      'ClearStack fits teams with tangled internal systems, especially where reporting quality and process ownership are slowing execution.',
    seoDescription:
      'Learn about ClearStack, an operations consultancy for B2B tooling, RevOps process, and reporting improvements.',
  },
];

const databaseUrl = process.env['DATABASE_URL'];
const seededAdminEmail = process.env['SEEDED_ADMIN_EMAIL']?.trim().toLowerCase() || SEEDED_ADMIN_EMAIL;
const seededAdminPassword = resolveSeededAdminPassword({
  allowDevelopmentFallback: process.env['NODE_ENV'] !== 'production',
});
const seededAdminPasswordError = validateDashboardPassword(seededAdminPassword);

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

if (seededAdminPasswordError) {
  throw new Error(`SEEDED_ADMIN_PASSWORD is invalid. ${seededAdminPasswordError}`);
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  for (const company of companies) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      update: {
        name: company.name,
        description: company.description,
        website: company.website,
        tags: company.tags,
        aiSummary: company.aiSummary,
        seoDescription: company.seoDescription,
        category: {
          connect: { slug: company.categorySlug },
        },
      },
      create: {
        slug: company.slug,
        name: company.name,
        description: company.description,
        website: company.website,
        tags: company.tags,
        aiSummary: company.aiSummary,
        seoDescription: company.seoDescription,
        category: {
          connect: { slug: company.categorySlug },
        },
      },
    });
  }

  await prisma.user.upsert({
    where: { email: seededAdminEmail },
    update: {
      passwordHash: hashPassword(seededAdminPassword),
      role: DashboardRole.ADMIN,
    },
    create: {
      email: seededAdminEmail,
      passwordHash: hashPassword(seededAdminPassword),
      role: DashboardRole.ADMIN,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
