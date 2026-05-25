import '../src/api/environment/load-env';
import { PrismaClient, DashboardRole } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/api/auth/password-hasher';
import {
  SEEDED_ADMIN_EMAIL,
  resolveSeededAdminPassword,
} from '../src/api/auth/seeded-admin-config';
import { COMPANY_FIXTURES } from '../src/app/core/company-directory/company-directory.fixtures';
import { validateDashboardPassword } from '../src/app/core/auth/password-policy';
import { DIRECTORY_CATEGORIES } from '../src/app/core/company-directory/company-taxonomy';

const categories = DIRECTORY_CATEGORIES.map(({ name, slug }) => ({ name, slug }));
const companies = COMPANY_FIXTURES;

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
