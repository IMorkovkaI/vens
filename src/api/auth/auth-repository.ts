import { PrismaAuthRepository } from '../database/prisma-auth.repository';
import { hasDatabaseUrl } from '../directory/directory-repository';
import { AuthRepository } from './auth-repository.models';
import { AuthStore, InMemoryAuthRepository, authStore } from './auth-store';

let authRepository: AuthRepository | undefined;

export function getAuthRepository(): AuthRepository {
  if (authRepository) {
    return authRepository;
  }

  authRepository = hasDatabaseUrl()
    ? new PrismaAuthRepository()
    : new InMemoryAuthRepository(authStore);

  return authRepository;
}

export function resetAuthRepositoryForTests(): void {
  authRepository = undefined;
}

export function createInMemoryAuthRepository(store = new AuthStore()): InMemoryAuthRepository {
  return new InMemoryAuthRepository(store);
}
