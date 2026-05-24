import { Company } from '../company-directory/company-directory.models';

export interface CompetitorComparisonRequest {
  leftSlug: string;
  rightSlug: string;
}

export interface CompanyDifferentiator {
  companyName: string;
  points: string[];
}

export interface CompetitorComparisonResult {
  leftCompany: Company;
  rightCompany: Company;
  sharedCategory: boolean;
  overlappingTags: string[];
  differentiators: CompanyDifferentiator[];
  summary: string;
  recommendation: string;
  provider: 'mock' | 'ollama' | 'groq' | 'openrouter' | 'google';
  model: string;
  confidence: number;
  createdAt: string;
}
