import { getServerSession } from 'next-auth';
import { vi } from 'vitest';

export const TEST_TOKEN = 'test-access-token';

/**
 * Each test file must declare `vi.mock('next-auth', ...)` itself (vi.mock is hoisted
 * per file). These helpers then set what getServerSession resolves to.
 */
export function signedIn(accessToken: string = TEST_TOKEN) {
  vi.mocked(getServerSession).mockResolvedValue({
    access_token: accessToken,
    expires: '2099-01-01T00:00:00.000Z',
  });
}

export function signedOut() {
  vi.mocked(getServerSession).mockResolvedValue(null);
}

/** A session object that exists but has no access token (e.g. a broken JWT). */
export function signedInWithoutToken() {
  vi.mocked(getServerSession).mockResolvedValue({ expires: '2099-01-01T00:00:00.000Z' });
}
