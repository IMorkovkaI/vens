import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AiAnalysisPageComponent } from './features/dashboard/ai-analysis/ai-analysis-page.component';
import { AnalyticsPageComponent } from './features/dashboard/analytics/analytics-page.component';
import { CompanyFormPageComponent } from './features/dashboard/company-form/company-form-page.component';
import { DashboardHomePageComponent } from './features/dashboard/dashboard-home/dashboard-home-page.component';
import { DevelopersPageComponent } from './features/dashboard/developers/developers-page.component';
import { DiscoveryPageComponent } from './features/dashboard/discovery/discovery-page.component';
import { LoginPageComponent } from './features/dashboard/login/login-page.component';
import { RegisterPageComponent } from './features/dashboard/register/register-page.component';
import { CategoryDetailPageComponent } from './features/public/category-detail/category-detail-page.component';
import { ComparePageComponent } from './features/public/compare/compare-page.component';
import { CompanyDetailPageComponent } from './features/public/company-detail/company-detail-page.component';
import { CompanyListPageComponent } from './features/public/company-list/company-list-page.component';
import { DataSourcesPageComponent } from './features/public/data-sources/data-sources-page.component';
import { HomePageComponent } from './features/public/home/home-page.component';
import { PrivacyPageComponent } from './features/public/legal/privacy-page.component';
import { TermsPageComponent } from './features/public/legal/terms-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    title: 'Vensight | AI-assisted company directory',
  },
  {
    path: 'companies',
    component: CompanyListPageComponent,
    title: 'Browse companies | Vensight',
  },
  {
    path: 'compare',
    component: ComparePageComponent,
    title: 'Compare companies | Vensight',
  },
  {
    path: 'data-sources',
    component: DataSourcesPageComponent,
    title: 'Data sources | Vensight',
  },
  {
    path: 'legal/privacy',
    component: PrivacyPageComponent,
    title: 'Privacy policy | Vensight',
  },
  {
    path: 'legal/terms',
    component: TermsPageComponent,
    title: 'Terms of use | Vensight',
  },
  {
    path: 'categories/:slug',
    component: CategoryDetailPageComponent,
    title: 'Category | Vensight',
  },
  {
    path: 'companies/:slug',
    component: CompanyDetailPageComponent,
    title: 'Company profile | Vensight',
  },
  {
    path: 'dashboard/login',
    component: LoginPageComponent,
    title: 'Dashboard sign in | Vensight',
  },
  {
    path: 'dashboard/register',
    component: RegisterPageComponent,
    title: 'Dashboard registration | Vensight',
  },
  {
    path: 'dashboard',
    component: DashboardHomePageComponent,
    canActivate: [authGuard],
    title: 'Dashboard | Vensight',
  },
  {
    path: 'dashboard/developers',
    component: DevelopersPageComponent,
    canActivate: [authGuard],
    title: 'Developers | Vensight',
  },
  {
    path: 'dashboard/ai-analysis',
    component: AiAnalysisPageComponent,
    canActivate: [authGuard],
    title: 'AI analysis | Vensight',
  },
  {
    path: 'dashboard/discovery',
    component: DiscoveryPageComponent,
    canActivate: [authGuard],
    title: 'Discovery | Vensight',
  },
  {
    path: 'dashboard/analytics',
    component: AnalyticsPageComponent,
    canActivate: [authGuard],
    title: 'Analytics | Vensight',
  },
  {
    path: 'dashboard/companies/new',
    component: CompanyFormPageComponent,
    canActivate: [authGuard],
    title: 'Add company | Vensight',
  },
  {
    path: 'dashboard/companies/:slug/edit',
    component: CompanyFormPageComponent,
    canActivate: [authGuard],
    title: 'Edit company | Vensight',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
