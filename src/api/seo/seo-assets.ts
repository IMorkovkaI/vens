import { Category, Company } from '../../app/core/company-directory/company-directory.models';

export function getPublicBaseUrl(requestBaseUrl: string): string {
  const configuredUrl = process.env['PUBLIC_SITE_URL']?.trim();
  const candidate = configuredUrl || requestBaseUrl;

  try {
    const url = new URL(candidate);
    url.hash = '';
    url.search = '';
    url.pathname = '';

    return url.toString().replace(/\/$/, '');
  } catch {
    return 'http://localhost:4000';
  }
}

export function buildRobotsTxt(baseUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /dashboard',
    'Disallow: /api',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

export function buildSitemapXml(
  baseUrl: string,
  companies: Company[],
  categories: Category[],
  lastModified = new Date(),
): string {
  const lastmod = lastModified.toISOString().slice(0, 10);
  const routes = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/companies', priority: '0.9', changefreq: 'daily' },
    { path: '/compare', priority: '0.7', changefreq: 'weekly' },
    { path: '/data-sources', priority: '0.6', changefreq: 'monthly' },
    { path: '/legal/privacy', priority: '0.4', changefreq: 'yearly' },
    { path: '/legal/terms', priority: '0.4', changefreq: 'yearly' },
    ...categories.map((category) => ({
      path: `/categories/${category.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
    })),
    ...companies.map((company) => ({
      path: `/companies/${company.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
    })),
  ];

  const urls = routes
    .map(
      (route) => `  <url>
    <loc>${escapeXml(`${baseUrl}${route.path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
