import { afterEach, describe, expect, it } from 'vitest';
import { PrismaDiscoveryRepository } from '../database/prisma-discovery.repository';
import {
  createInMemoryDiscoveryRepository,
  getDiscoveryRepository,
  resetDiscoveryRepositoryForTests,
} from './discovery-repository';

const originalDatabaseUrl = process.env['DATABASE_URL'];

describe('discovery repository selection', () => {
  afterEach(() => {
    restoreEnvValue('DATABASE_URL', originalDatabaseUrl);
    resetDiscoveryRepositoryForTests();
  });

  it('uses the in-memory repository when DATABASE_URL is absent', () => {
    delete process.env['DATABASE_URL'];

    expect(getDiscoveryRepository()).not.toBeInstanceOf(PrismaDiscoveryRepository);
  });

  it('uses the Prisma repository when DATABASE_URL is configured', () => {
    process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/vensight';

    expect(getDiscoveryRepository()).toBeInstanceOf(PrismaDiscoveryRepository);
  });
});

describe('in-memory discovery repository contract', () => {
  it('saves, deduplicates, lists, and updates candidates', async () => {
    const repository = createInMemoryDiscoveryRepository();
    const firstCandidate = await repository.saveCandidate(
      {
        url: 'https://example.com',
        title: 'Example',
        snippet: 'First snippet.',
        provider: 'searchapi',
        query: 'example query',
      },
      { email: 'admin@vensight.local', role: 'admin' },
    );
    const duplicateCandidate = await repository.saveCandidate({
      url: 'https://example.com/',
      title: 'Example Updated',
      snippet: 'Updated snippet.',
      provider: 'tavily',
      query: 'updated query',
    });

    expect(duplicateCandidate.id).toBe(firstCandidate.id);
    expect(duplicateCandidate.status).toBe('new');
    expect(duplicateCandidate.title).toBe('Example Updated');

    const updatedCandidate = await repository.updateCandidate(
      firstCandidate.id,
      {
        status: 'accepted',
        analysisUrl: 'https://example.com',
      },
      { email: 'developer@vensight.local', role: 'developer' },
    );

    expect(updatedCandidate).toMatchObject({
      id: firstCandidate.id,
      status: 'accepted',
      analysisUrl: 'https://example.com',
      reviewerEmail: 'developer@vensight.local',
    });
    expect(await repository.listCandidates()).toHaveLength(1);
  });
});

function restoreEnvValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
