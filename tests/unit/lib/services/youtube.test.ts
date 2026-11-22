import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as playlists from '@/lib/playlists';
import { getYouTubeService } from '@/lib/services/youtube';
import { resetFakeStore } from '@/lib/services/youtube/fake/store';
import { googleYouTubeService } from '@/lib/services/youtube/google';
import * as streams from '@/lib/youtube';

const originalMode = process.env.TLC_YOUTUBE_MODE;

afterEach(() => {
  if (originalMode === undefined) delete process.env.TLC_YOUTUBE_MODE;
  else process.env.TLC_YOUTUBE_MODE = originalMode;
});

describe('getYouTubeService', () => {
  it('returns the Google service when TLC_YOUTUBE_MODE is unset', () => {
    delete process.env.TLC_YOUTUBE_MODE;
    expect(getYouTubeService()).toBe(googleYouTubeService);
  });

  it('returns the Google service when TLC_YOUTUBE_MODE is empty', () => {
    process.env.TLC_YOUTUBE_MODE = '';
    expect(getYouTubeService()).toBe(googleYouTubeService);
  });

  it('returns the Google service when TLC_YOUTUBE_MODE=google', () => {
    process.env.TLC_YOUTUBE_MODE = 'google';
    expect(getYouTubeService()).toBe(googleYouTubeService);
  });

  describe('fake mode', () => {
    beforeEach(() => {
      process.env.TLC_YOUTUBE_MODE = 'fake';
      resetFakeStore();
    });

    it('returns the in-memory fake, not the Google service', async () => {
      const yt = getYouTubeService();
      expect(yt).not.toBe(googleYouTubeService);
      const { data } = await yt.getStreams('token', 'active');
      expect(data.items?.map((b) => b.id)).toEqual(['live-1']);
    });

    it('shares one store across calls, so a write in one request is seen by the next', async () => {
      const { data } = await getYouTubeService().createStream('token', {
        title: 'Shared',
        description: '',
        scheduledStartTime: new Date(Date.now() + 3_600_000).toISOString(),
        privacyStatus: 'private',
        enableAutoStart: false,
        enableAutoStop: false,
      });
      const [found] = (await getYouTubeService().getStreamById('token', data.id!)).data.items!;
      expect(found.snippet?.title).toBe('Shared');
    });

    it('keeps the store on globalThis, so a separately bundled copy of the module sees the same state', async () => {
      await getYouTubeService().stopStreamById('token', 'live-1');
      vi.resetModules();
      const fresh = await import('@/lib/services/youtube');
      const { data } = await fresh.getYouTubeService().getStreams('token', 'active');
      expect(data.items).toEqual([]);
    });

    it('resetFakeStore restores the seeded scenario', async () => {
      await getYouTubeService().stopStreamById('token', 'live-1');
      resetFakeStore();
      const { data } = await getYouTubeService().getStreams('token', 'active');
      expect(data.items?.map((b) => b.id)).toEqual(['live-1']);
    });
  });

  it.each(['bogus', 'Google', ' google'])('rejects an unknown mode %j instead of falling back to Google', (mode) => {
    process.env.TLC_YOUTUBE_MODE = mode;
    expect(() => getYouTubeService()).toThrow(
      `Invalid TLC_YOUTUBE_MODE "${mode}". Use "google" (default) or "fake".`,
    );
  });
});

describe('googleYouTubeService', () => {
  const streamMethods = [
    'getStreams',
    'getStreamById',
    'stopStreamById',
    'editStream',
    'deleteStream',
    'createStream',
    'getLiveStreamByBroadcastId',
    'getLiveStreamsByIds',
    'getMyLiveStreams',
    'bindBroadcastToStream',
  ] as const;

  const playlistMethods = [
    'getPlaylists',
    'getPlaylistItems',
    'addToPlaylist',
    'removeFromPlaylist',
    'createPlaylist',
    'updatePlaylist',
    'deletePlaylist',
  ] as const;

  it.each(streamMethods)('%s delegates to the lib/youtube wrapper', (name) => {
    expect(googleYouTubeService[name]).toBe(streams[name]);
  });

  it.each(playlistMethods)('%s delegates to the lib/playlists wrapper', (name) => {
    expect(googleYouTubeService[name]).toBe(playlists[name]);
  });

  it('exposes exactly the stream and playlist methods', () => {
    expect(Object.keys(googleYouTubeService).sort()).toEqual([...streamMethods, ...playlistMethods].sort());
  });
});
