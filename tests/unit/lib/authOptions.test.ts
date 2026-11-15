import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Account, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { authOptions } from '@/lib/authOptions';

const jwt = (args: { token: JWT; account?: Partial<Account> | null }) =>
  authOptions.callbacks!.jwt!({ token: args.token, account: (args.account ?? null) as Account | null } as never);

const NOW = new Date('2026-11-15T12:00:00Z');
const nowSec = Math.floor(NOW.getTime() / 1000);

describe('authOptions', () => {
  it('requests YouTube scope with offline access and forced consent', () => {
    const google = authOptions.providers[0] as unknown as { options: { authorization: { params: Record<string, string> } } };
    expect(google.options.authorization.params).toEqual({
      scope: 'openid email profile https://www.googleapis.com/auth/youtube',
      access_type: 'offline',
      prompt: 'consent',
    });
  });

  it('uses JWT sessions and the custom /login page', () => {
    expect(authOptions.session?.strategy).toBe('jwt');
    expect(authOptions.pages?.signIn).toBe('/login');
  });
});

describe('jwt callback', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('GOOGLE_CLIENT_ID', 'cid');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'csecret');
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('stores provider tokens on first sign-in', async () => {
    const out = await jwt({
      token: { name: 'n' },
      account: { access_token: 'at', refresh_token: 'rt', expires_at: nowSec + 3600 },
    });
    expect(out).toEqual({ name: 'n', access_token: 'at', refresh_token: 'rt', expires_at: nowSec + 3600 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the token untouched while it is still valid', async () => {
    const token = { access_token: 'at', refresh_token: 'rt', expires_at: nowSec + 60 };
    expect(await jwt({ token })).toBe(token);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes an expired token against Google', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ access_token: 'new-at', expires_in: 3600 }), { status: 200 }));
    const out = await jwt({ token: { access_token: 'old', refresh_token: 'rt', expires_at: nowSec - 1, error: 'stale' } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(init.method).toBe('POST');
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      client_id: 'cid',
      client_secret: 'csecret',
      grant_type: 'refresh_token',
      refresh_token: 'rt',
    });
    expect(out).toEqual({ access_token: 'new-at', refresh_token: 'rt', expires_at: nowSec + 3600, error: undefined });
  });

  it('adopts a rotated refresh token when Google returns one', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'a', expires_in: 10, refresh_token: 'rt2' }), { status: 200 }),
    );
    const out = await jwt({ token: { refresh_token: 'rt', expires_at: nowSec - 1 } });
    expect(out.refresh_token).toBe('rt2');
  });

  it('flags RefreshAccessTokenError when Google rejects the refresh', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }));
    const token = { access_token: 'old', refresh_token: 'rt', expires_at: nowSec - 1 };
    expect(await jwt({ token })).toEqual({ ...token, error: 'RefreshAccessTokenError' });
  });

  it('flags RefreshAccessTokenError when the refresh request throws', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const out = await jwt({ token: { refresh_token: 'rt', expires_at: nowSec - 1 } });
    expect(out.error).toBe('RefreshAccessTokenError');
  });
});

describe('session callback', () => {
  const session = (token: JWT) =>
    authOptions.callbacks!.session!({ session: { expires: 'x' } as Session, token } as never) as Promise<Session>;

  it('exposes the access token on the session', async () => {
    expect(await session({ access_token: 'at' })).toEqual({ expires: 'x', access_token: 'at' });
  });

  it('exposes a token error on the session', async () => {
    expect((await session({ access_token: 'at', error: 'RefreshAccessTokenError' })).error).toBe('RefreshAccessTokenError');
  });
});
