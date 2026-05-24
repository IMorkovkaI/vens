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
