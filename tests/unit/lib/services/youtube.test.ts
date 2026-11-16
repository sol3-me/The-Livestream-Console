import { afterEach, describe, expect, it } from 'vitest';
import * as playlists from '@/lib/playlists';
import { getYouTubeService } from '@/lib/services/youtube';
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

  it('refuses fake mode until the fake service exists (Phase 1D)', () => {
    process.env.TLC_YOUTUBE_MODE = 'fake';
    expect(() => getYouTubeService()).toThrow('TLC_YOUTUBE_MODE=fake is not available yet (Phase 1D)');
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
