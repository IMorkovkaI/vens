import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const HASH_PREFIX = 'scrypt:v1';
const LEGACY_MOCK_PREFIX = 'mock:v1:';
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH);

  return `${HASH_PREFIX}:${salt.toString('base64url')}:${hash.toString('base64url')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (storedHash.startsWith(LEGACY_MOCK_PREFIX)) {
    return storedHash.slice(LEGACY_MOCK_PREFIX.length) === password;
  }

  const [algorithm, version, encodedSalt, encodedHash] = storedHash.split(':');

  if (`${algorithm}:${version}` !== HASH_PREFIX || !encodedSalt || !encodedHash) {
    return false;
  }

  const salt = Buffer.from(encodedSalt, 'base64url');
  const expectedHash = Buffer.from(encodedHash, 'base64url');
  const actualHash = scryptSync(password, salt, expectedHash.length);

  return (
    actualHash.length === expectedHash.length &&
    timingSafeEqual(actualHash, expectedHash)
  );
}
