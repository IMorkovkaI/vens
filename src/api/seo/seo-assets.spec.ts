import { describe, expect, it } from 'vitest';
import { buildRobotsTxt, buildSitemapXml, getPublicBaseUrl } from './seo-assets';
import { Category, Company } from '../../app/core/company-directory/company-directory.models';

describe('SEO assets', () => {
  it('uses PUBLIC_SITE_URL when configured', () => {
    const originalPublicSiteUrl = process.env['PUBLIC_SITE_URL'];
    process.env['PUBLIC_SITE_URL'] = 'https://vensight.example/some/path?x=1';

    expect(getPublicBaseUrl('http://localhost:4000')).toBe('https://vensight.example');

    if (originalPublicSiteUrl === undefined) {
      delete process.env['PUBLIC_SITE_URL'];
    } else {
      process.env['PUBLIC_SITE_URL'] = originalPublicSiteUrl;
    }
  });

  it('falls back to the Vercel production URL instead of localhost', () => {
    const originalPublicSiteUrl = process.env['PUBLIC_SITE_URL'];
    const originalVercelProductionUrl = process.env['VERCEL_PROJECT_PRODUCTION_URL'];
    const originalVercelUrl = process.env['VERCEL_URL'];
    delete process.env['PUBLIC_SITE_URL'];
    delete process.env['VERCEL_PROJECT_PRODUCTION_URL'];
    delete process.env['VERCEL_URL'];

    expect(getPublicBaseUrl('http://localhost:34753')).toBe('https://vensight-phi.vercel.app');

    restoreEnvValue('PUBLIC_SITE_URL', originalPublicSiteUrl);
    restoreEnvValue('VERCEL_PROJECT_PRODUCTION_URL', originalVercelProductionUrl);
    restoreEnvValue('VERCEL_URL', originalVercelUrl);
  });

  it('uses Vercel deployment URL env vars when PUBLIC_SITE_URL is not set', () => {
    const originalPublicSiteUrl = process.env['PUBLIC_SITE_URL'];
    const originalVercelProductionUrl = process.env['VERCEL_PROJECT_PRODUCTION_URL'];
    delete process.env['PUBLIC_SITE_URL'];
    process.env['VERCEL_PROJECT_PRODUCTION_URL'] = 'vensight.example';

    expect(getPublicBaseUrl('http://localhost:4000')).toBe('https://vensight.example');

    restoreEnvValue('PUBLIC_SITE_URL', originalPublicSiteUrl);
    restoreEnvValue('VERCEL_PROJECT_PRODUCTION_URL', originalVercelProductionUrl);
  });

  it('builds a crawlable robots policy with private routes blocked', () => {
    const robots = buildRobotsTxt('https://vensight.example');

    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /dashboard');
    expect(robots).toContain('Disallow: /api');
    expect(robots).toContain('Sitemap: https://vensight.example/sitemap.xml');
  });

  it('builds sitemap entries for public routes, categories, and companies', () => {
    const categories: Category[] = [{ id: 'cat-ai', name: 'AI Tools', slug: 'ai-tools' }];
    const companies: Company[] = [
      {
        id: 'cmp-one',
        slug: 'example-company',
        name: 'Example Company',
        description: 'Example company profile.',
        website: 'https://example.com',
        category: categories[0],
        tags: ['AI'],
        aiSummary: 'Example summary.',
        seoDescription: 'Example SEO description.',
      },
    ];

    const sitemap = buildSitemapXml(
      'https://vensight.example',
      companies,
      categories,
      new Date('2026-05-24T00:00:00.000Z'),
    );

    expect(sitemap).toContain('<loc>https://vensight.example/</loc>');
    expect(sitemap).toContain('<loc>https://vensight.example/data-sources</loc>');
    expect(sitemap).toContain('<loc>https://vensight.example/legal/privacy</loc>');
    expect(sitemap).toContain('<loc>https://vensight.example/legal/terms</loc>');
    expect(sitemap).toContain('<loc>https://vensight.example/categories/ai-tools</loc>');
    expect(sitemap).toContain('<loc>https://vensight.example/companies/example-company</loc>');
    expect(sitemap).toContain('<lastmod>2026-05-24</lastmod>');
  });
});

function restoreEnvValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
