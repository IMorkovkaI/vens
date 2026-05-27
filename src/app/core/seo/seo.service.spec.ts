import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';

type TestProcess = { env: Record<string, string | undefined> };

describe('SeoService', () => {
  const testProcess = getTestProcess();
  const originalPublicSiteUrl = testProcess.env['PUBLIC_SITE_URL'];
  const originalVercelProductionUrl = testProcess.env['VERCEL_PROJECT_PRODUCTION_URL'];
  const originalVercelUrl = testProcess.env['VERCEL_URL'];

  afterEach(() => {
    restoreEnvValue('PUBLIC_SITE_URL', originalPublicSiteUrl);
    restoreEnvValue('VERCEL_PROJECT_PRODUCTION_URL', originalVercelProductionUrl);
    restoreEnvValue('VERCEL_URL', originalVercelUrl);
  });

  it('uses PUBLIC_SITE_URL for canonical and Open Graph URLs during SSR', () => {
    testProcess.env['PUBLIC_SITE_URL'] = 'https://vensight.example';
    const service = createService();

    service.apply({
      title: 'Vensight',
      description: 'Company intelligence directory.',
      canonicalPath: '/companies',
    });

    const document = TestBed.inject(DOCUMENT);
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');

    expect(canonical?.getAttribute('href')).toBe('https://vensight.example/companies');
    expect(ogUrl?.getAttribute('content')).toBe('https://vensight.example/companies');
  });

  it('falls back away from localhost when deployment env is missing', () => {
    delete testProcess.env['PUBLIC_SITE_URL'];
    delete testProcess.env['VERCEL_PROJECT_PRODUCTION_URL'];
    delete testProcess.env['VERCEL_URL'];
    const service = createService();

    service.apply({
      title: 'Vensight',
      description: 'Company intelligence directory.',
      canonicalPath: '/',
    });

    const document = TestBed.inject(DOCUMENT);
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    expect(canonical?.getAttribute('href')).toBe('https://vensight-phi.vercel.app/');
  });
});

function createService(): SeoService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [Meta, Title],
  });

  return TestBed.inject(SeoService);
}

function getTestProcess(): TestProcess {
  const globalWithProcess = globalThis as { process?: TestProcess };

  globalWithProcess.process ??= { env: {} };
  globalWithProcess.process.env ??= {};

  return globalWithProcess.process;
}

function restoreEnvValue(name: string, value: string | undefined): void {
  const testProcess = getTestProcess();

  if (value === undefined) {
    delete testProcess.env[name];
    return;
  }

  testProcess.env[name] = value;
}
