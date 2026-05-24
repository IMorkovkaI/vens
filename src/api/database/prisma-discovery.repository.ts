import {
  DiscoveryCandidate,
  DiscoveryCandidateInput,
  DiscoveryCandidateStatus,
  DiscoveryCandidateUpdate,
  DiscoveryRepository,
} from '../discovery/discovery.models';
import { DashboardUser } from '../../app/core/auth/auth.models';
import { DiscoveryCandidateStatus as PrismaDiscoveryCandidateStatus } from '../../../generated/prisma';
import { normalizeDiscoveryUrl } from '../discovery/discovery-helpers';
import { getPrismaClient } from './prisma.client';

type PrismaDiscoveryCandidate = {
  id: string;
  url: string;
  title: string;
  snippet: string;
  provider: string;
  query: string;
  status: string;
  analysisUrl: string | null;
  reviewerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaDiscoveryRepository implements DiscoveryRepository {
  private readonly prisma = getPrismaClient();

  async listCandidates(): Promise<DiscoveryCandidate[]> {
    const candidates = await this.prisma.discoveryCandidate.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return candidates.map((candidate) => this.mapCandidate(candidate));
  }

  async saveCandidate(
    input: DiscoveryCandidateInput,
    reviewer?: DashboardUser,
  ): Promise<DiscoveryCandidate> {
    const url = normalizeDiscoveryUrl(input.url);
    const candidate = await this.prisma.discoveryCandidate.upsert({
      where: { url },
      update: {
        title: input.title.trim() || url,
        snippet: input.snippet.trim(),
        provider: input.provider,
        query: input.query.trim(),
        reviewerEmail: reviewer?.email,
      },
      create: {
        url,
        title: input.title.trim() || url,
        snippet: input.snippet.trim(),
        provider: input.provider,
        query: input.query.trim(),
        status: toPrismaStatus(input.status ?? 'new'),
        reviewerEmail: reviewer?.email,
      },
    });

    return this.mapCandidate(candidate);
  }

  async updateCandidate(
    id: string,
    update: DiscoveryCandidateUpdate,
    reviewer?: DashboardUser,
  ): Promise<DiscoveryCandidate | undefined> {
    const existingCandidate = await this.prisma.discoveryCandidate.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingCandidate) {
      return undefined;
    }

    const candidate = await this.prisma.discoveryCandidate.update({
      where: { id },
      data: {
        status: toPrismaStatus(update.status),
        analysisUrl: update.analysisUrl?.trim() || undefined,
        reviewerEmail: reviewer?.email,
      },
    });

    return this.mapCandidate(candidate);
  }

  private mapCandidate(candidate: PrismaDiscoveryCandidate): DiscoveryCandidate {
    return {
      id: candidate.id,
      url: candidate.url,
      title: candidate.title,
      snippet: candidate.snippet,
      provider: candidate.provider,
      query: candidate.query,
      status: fromPrismaStatus(candidate.status),
      analysisUrl: candidate.analysisUrl ?? undefined,
      reviewerEmail: candidate.reviewerEmail ?? undefined,
      createdAt: candidate.createdAt.toISOString(),
      updatedAt: candidate.updatedAt.toISOString(),
    };
  }
}

function toPrismaStatus(status: DiscoveryCandidateStatus): PrismaDiscoveryCandidateStatus {
  return status.toUpperCase() as PrismaDiscoveryCandidateStatus;
}

function fromPrismaStatus(status: string): DiscoveryCandidateStatus {
  return status.toLowerCase() as DiscoveryCandidateStatus;
}
