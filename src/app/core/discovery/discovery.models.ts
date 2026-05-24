export type DiscoveryCandidateStatus =
  | 'new'
  | 'reviewing'
  | 'accepted'
  | 'rejected'
  | 'analyzed';

export type SearchProviderId = 'searchapi' | 'tavily';

export interface DiscoverySearchForm {
  query: string;
  category?: string;
  location?: string;
  limit?: number;
}

export interface DiscoverySearchResult {
  url: string;
  title: string;
  snippet: string;
  provider: SearchProviderId;
  query: string;
  displayUrl?: string;
}

export interface DiscoverySearchResponse {
  results: DiscoverySearchResult[];
  providers: Record<string, { configured: boolean }>;
}

export interface DiscoveryCandidate {
  id: string;
  url: string;
  title: string;
  snippet: string;
  provider: SearchProviderId | string;
  query: string;
  status: DiscoveryCandidateStatus;
  analysisUrl?: string;
  reviewerEmail?: string;
  createdAt: string;
  updatedAt: string;
}
