import { Category, Company } from '../../app/core/company-directory/company-directory.models';

export function getPublicBaseUrl(requestBaseUrl: string): string {
  const configuredUrl = getConfiguredPublicSiteUrl();
  const candidate =
    configuredUrl || (isLocalhostUrl(requestBaseUrl) ? getProductionFallbackUrl() : requestBaseUrl);

  try {
    const url = new URL(candidate);
    url.hash = '';
    url.search = '';
    url.pathname = '';

    return url.toString().replace(/\/$/, '');
  } catch {
    return getProductionFallbackUrl();
  }
}

export function getConfiguredPublicSiteUrl(): string {
  const explicitUrl = process.env['PUBLIC_SITE_URL']?.trim();

  if (explicitUrl) {
    return explicitUrl;
  }

  const vercelUrl =
    process.env['VERCEL_PROJECT_PRODUCTION_URL']?.trim() ||
    process.env['VERCEL_URL']?.trim();

  if (!vercelUrl) {
    return '';
  }

  return /^https?:\/\//i.test(vercelUrl) ? vercelUrl : `https://${vercelUrl}`;
}

function getProductionFallbackUrl(): string {
  return 'https://vensight-phi.vercel.app';
}

function isLocalhostUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();

    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return true;
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
