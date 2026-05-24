import { Express, Request, Response } from 'express';
import { getDirectoryRepository } from '../directory/directory-repository';
import { buildRobotsTxt, buildSitemapXml, getPublicBaseUrl } from './seo-assets';

export function registerSeoRoutes(app: Express): void {
  app.get('/robots.txt', (req, res) => {
    const baseUrl = getPublicBaseUrl(getRequestBaseUrl(req));

    res.type('text/plain').send(buildRobotsTxt(baseUrl));
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const repository = getDirectoryRepository();
      const [companies, categories] = await Promise.all([
        repository.listCompanies(),
        repository.listCategories(),
      ]);
      const baseUrl = getPublicBaseUrl(getRequestBaseUrl(req));

      res.type('application/xml').send(buildSitemapXml(baseUrl, companies, categories));
    } catch {
      res.status(500).type('text/plain').send('Unable to generate sitemap.');
    }
  });
}

function getRequestBaseUrl(req: Request): string {
  const forwardedProtocol = String(req.header('x-forwarded-proto') ?? '').split(',')[0]?.trim();
  const protocol = forwardedProtocol || req.protocol;
  const host = req.header('x-forwarded-host') ?? req.header('host') ?? 'localhost:4000';

  return `${protocol}://${host}`;
}
