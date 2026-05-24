import { DashboardUser } from '../../app/core/auth/auth.models';
import {
  DiscoveryCandidate,
  DiscoveryCandidateInput,
  DiscoveryCandidateStatus,
  DiscoveryCandidateUpdate,
  DiscoveryRepository,
} from './discovery.models';
import { normalizeDiscoveryUrl } from './discovery-helpers';

export class DiscoveryStore implements DiscoveryRepository {
  private candidates: DiscoveryCandidate[] = [];

  async listCandidates(): Promise<DiscoveryCandidate[]> {
    return [...this.candidates].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    );
  }

  async saveCandidate(
    input: DiscoveryCandidateInput,
    reviewer?: DashboardUser,
  ): Promise<DiscoveryCandidate> {
    const url = normalizeDiscoveryUrl(input.url);
    const existingCandidate = this.candidates.find((candidate) => candidate.url === url);
    const now = new Date().toISOString();

    if (existingCandidate) {
      const updatedCandidate = {
        ...existingCandidate,
        title: input.title.trim() || existingCandidate.title,
        snippet: input.snippet.trim(),
        provider: input.provider,
        query: input.query.trim(),
        reviewerEmail: reviewer?.email ?? existingCandidate.reviewerEmail,
        updatedAt: now,
      };

      this.candidates = this.candidates.map((candidate) =>
        candidate.id === updatedCandidate.id ? updatedCandidate : candidate,
      );

      return updatedCandidate;
    }

    const candidate: DiscoveryCandidate = {
      id: `candidate-${Date.now()}-${this.candidates.length + 1}`,
      url,
      title: input.title.trim() || url,
      snippet: input.snippet.trim(),
      provider: input.provider,
      query: input.query.trim(),
      status: input.status ?? 'new',
      reviewerEmail: reviewer?.email,
      createdAt: now,
      updatedAt: now,
    };

    this.candidates = [candidate, ...this.candidates];

    return candidate;
  }

  async updateCandidate(
    id: string,
    update: DiscoveryCandidateUpdate,
    reviewer?: DashboardUser,
  ): Promise<DiscoveryCandidate | undefined> {
    const candidate = this.candidates.find((entry) => entry.id === id);

    if (!candidate) {
      return undefined;
    }

    const updatedCandidate: DiscoveryCandidate = {
      ...candidate,
      status: update.status,
      analysisUrl: update.analysisUrl?.trim() || candidate.analysisUrl,
      reviewerEmail: reviewer?.email ?? candidate.reviewerEmail,
      updatedAt: new Date().toISOString(),
    };

    this.candidates = this.candidates.map((entry) =>
      entry.id === id ? updatedCandidate : entry,
    );

    return updatedCandidate;
  }
}

export const discoveryStore = new DiscoveryStore();
