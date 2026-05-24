import { DashboardUser } from '../../app/core/auth/auth.models';

export type SearchProviderId = 'searchapi' | 'tavily';

export type DiscoveryCandidateStatus =
  | 'new'
  | 'reviewing'
  | 'accepted'
  | 'rejected'
  | 'analyzed';

export interface DiscoverySearchRequest {
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

export interface DiscoveryCandidateInput extends DiscoverySearchResult {
  status?: DiscoveryCandidateStatus;
}

export interface DiscoveryCandidateUpdate {
  status: DiscoveryCandidateStatus;
  analysisUrl?: string;
}

export interface DiscoveryRepository {
  listCandidates(): Promise<DiscoveryCandidate[]>;
  saveCandidate(
    input: DiscoveryCandidateInput,
    reviewer?: DashboardUser,
  ): Promise<DiscoveryCandidate>;
  updateCandidate(
    id: string,
    update: DiscoveryCandidateUpdate,
    reviewer?: DashboardUser,
  ): Promise<DiscoveryCandidate | undefined>;
}
