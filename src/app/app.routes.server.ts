import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'companies',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'compare',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'categories/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'companies/:slug',
    renderMode: RenderMode.Server,
  },
  {
    path: 'dashboard/login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'dashboard/register',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard/developers',
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard/ai-analysis',
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard/analytics',
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard/companies/new',
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard/companies/:slug/edit',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
