import { PrismaDirectoryRepository } from '../database/prisma-directory.repository';
import { DirectoryStore, InMemoryDirectoryRepository, directoryStore } from './directory-store';
import { DirectoryRepository } from './directory-repository.models';

let directoryRepository: DirectoryRepository | undefined;

export function getDirectoryRepository(): DirectoryRepository {
  if (directoryRepository) {
    return directoryRepository;
  }

  directoryRepository = hasDatabaseUrl()
    ? new PrismaDirectoryRepository()
    : new InMemoryDirectoryRepository(directoryStore);

  return directoryRepository;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env['DATABASE_URL']?.trim());
}

export function resetDirectoryRepositoryForTests(): void {
  directoryRepository = undefined;
}

export function createInMemoryDirectoryRepository(
  store = new DirectoryStore(),
): InMemoryDirectoryRepository {
  return new InMemoryDirectoryRepository(store);
}
