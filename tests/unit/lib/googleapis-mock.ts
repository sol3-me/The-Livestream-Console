import { vi } from 'vitest';

/**
 * Shared fake of the `googleapis` surface used by lib/youtube.ts and lib/playlists.ts.
 * Use with: vi.mock('googleapis', () => googleapisModule);
 * (import { yt, oauth, googleapisModule } via vi.hoisted in the test file).
 */
export function createGoogleapisMock() {
  const yt = {
    liveBroadcasts: { list: vi.fn(), transition: vi.fn(), update: vi.fn(), delete: vi.fn(), insert: vi.fn(), bind: vi.fn() },
    liveStreams: { list: vi.fn() },
    playlists: { list: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
    playlistItems: { list: vi.fn(), insert: vi.fn(), delete: vi.fn() },
  };
  const oauth = { ctor: vi.fn(), setCredentials: vi.fn() };
  const youtubeFactory = vi.fn(() => yt);

  class OAuth2 {
    constructor(...args: unknown[]) {
      oauth.ctor(...args);
    }
    setCredentials(c: unknown) {
      oauth.setCredentials(c);
    }
  }

  return { yt, oauth, youtubeFactory, module: { google: { auth: { OAuth2 }, youtube: youtubeFactory } } };
}
