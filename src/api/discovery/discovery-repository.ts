import { PrismaDiscoveryRepository } from '../database/prisma-discovery.repository';
import { hasDatabaseUrl } from '../directory/directory-repository';
import { DiscoveryRepository } from './discovery.models';
import { DiscoveryStore, discoveryStore } from './discovery-store';

let discoveryRepository: DiscoveryRepository | undefined;

export function getDiscoveryRepository(): DiscoveryRepository {
  if (discoveryRepository) {
    return discoveryRepository;
  }

  discoveryRepository = hasDatabaseUrl()
    ? new PrismaDiscoveryRepository()
    : discoveryStore;

  return discoveryRepository;
}

export function resetDiscoveryRepositoryForTests(): void {
  discoveryRepository = undefined;
}

export function createInMemoryDiscoveryRepository(
  store = new DiscoveryStore(),
): DiscoveryRepository {
  return store;
}
