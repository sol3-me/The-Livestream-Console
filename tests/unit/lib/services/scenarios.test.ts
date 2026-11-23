import { afterEach, describe, expect, it } from 'vitest';
import { createFakeStore } from '@/lib/services/youtube/fake/scenario';
import { DEFAULT_SCENARIO, isScenarioName, SCENARIO_NAMES, SCENARIOS } from '@/lib/services/youtube/fake/scenarios';
import { createFakeYouTubeService } from '@/lib/services/youtube/fake/service';
import { getFakeStore, resetFakeStore } from '@/lib/services/youtube/fake/store';
import type { YouTubeService } from '@/lib/services/youtube/types';

const NOW = new Date('2026-12-01T12:00:00.000Z');
const TOKEN = 'any-token';

function serviceFor(name: (typeof SCENARIO_NAMES)[number]) {
  const store = createFakeStore(SCENARIOS[name], NOW);
  return createFakeYouTubeService(() => store, () => NOW);
}

async function counts(yt: YouTubeService) {
  const [active, upcoming, completed, keys, playlists] = await Promise.all([
    yt.getStreams(TOKEN, 'active', 50),
    yt.getStreams(TOKEN, 'upcoming', 50),
    yt.getStreams(TOKEN, 'completed', 50),
    yt.getMyLiveStreams(TOKEN),
    yt.getPlaylists(TOKEN),
  ]);
  return {
    active: active.data.items?.length,
    upcoming: upcoming.data.items?.length,
    completed: completed.data.items?.length,
    keys: keys.length,
    playlists: playlists.data.items?.length,
  };
}

afterEach(() => resetFakeStore());

describe('named scenarios', () => {
  it.each(SCENARIO_NAMES)('%s loads without broken references', (name) => {
    expect(() => createFakeStore(SCENARIOS[name], NOW)).not.toThrow();
  });

  it('mixed is the default', () => {
    expect(DEFAULT_SCENARIO).toBe('mixed');
  });

  it('mixed has a bit of everything', async () => {
    expect(await counts(serviceFor('mixed'))).toEqual({ active: 1, upcoming: 2, completed: 2, keys: 2, playlists: 3 });
  });

  it('empty has no streams, keys or playlists', async () => {
    expect(await counts(serviceFor('empty'))).toEqual({ active: 0, upcoming: 0, completed: 0, keys: 0, playlists: 0 });
  });

  it('one-live has exactly one live stream bound to a key, and nothing else scheduled', async () => {
    const yt = serviceFor('one-live');
    expect(await counts(yt)).toMatchObject({ active: 1, upcoming: 0, completed: 0 });
    const [live] = (await yt.getStreams(TOKEN, 'active')).data.items!;
    expect(live.status?.lifeCycleStatus).toBe('live');
    expect(live.contentDetails?.boundStreamId).toBeTruthy();
  });

  it('upcoming-only has upcoming streams but nothing live or completed', async () => {
    const result = await counts(serviceFor('upcoming-only'));
    expect(result).toMatchObject({ active: 0, completed: 0 });
    expect(result.upcoming).toBeGreaterThan(0);
  });

  it('only api-error declares a failure', () => {
    const failing = SCENARIO_NAMES.filter((name) => SCENARIOS[name].failWith);
    expect(failing).toEqual(['api-error']);
  });
});

describe('api-error scenario', () => {
  const calls: [keyof YouTubeService, (yt: YouTubeService) => Promise<unknown>][] = [
    ['getStreams', (yt) => yt.getStreams(TOKEN)],
    ['getStreamById', (yt) => yt.getStreamById(TOKEN, 'x')],
    ['stopStreamById', (yt) => yt.stopStreamById(TOKEN, 'x')],
    ['editStream', (yt) => yt.editStream(TOKEN, { id: 'x' })],
    ['deleteStream', (yt) => yt.deleteStream(TOKEN, 'x')],
    ['createStream', (yt) => yt.createStream(TOKEN, { title: 'T', description: '', scheduledStartTime: '2099-01-01T00:00:00Z', privacyStatus: 'private', enableAutoStart: false, enableAutoStop: false })],
    ['getLiveStreamByBroadcastId', (yt) => yt.getLiveStreamByBroadcastId(TOKEN, 'x')],
    ['getLiveStreamsByIds', (yt) => yt.getLiveStreamsByIds(TOKEN, ['x'])],
    ['getMyLiveStreams', (yt) => yt.getMyLiveStreams(TOKEN)],
    ['bindBroadcastToStream', (yt) => yt.bindBroadcastToStream(TOKEN, 'x', 'y')],
    ['getPlaylists', (yt) => yt.getPlaylists(TOKEN)],
    ['getPlaylistItems', (yt) => yt.getPlaylistItems(TOKEN, 'x')],
    ['addToPlaylist', (yt) => yt.addToPlaylist(TOKEN, 'x', 'y')],
    ['removeFromPlaylist', (yt) => yt.removeFromPlaylist(TOKEN, 'x')],
    ['createPlaylist', (yt) => yt.createPlaylist(TOKEN, { title: 'T', description: '', privacyStatus: 'private' })],
    ['updatePlaylist', (yt) => yt.updatePlaylist(TOKEN, 'x', { title: 'T', description: '', privacyStatus: 'private' })],
    ['deletePlaylist', (yt) => yt.deletePlaylist(TOKEN, 'x')],
  ];

  it('covers every service method', () => {
    expect(calls.map(([name]) => name).sort()).toEqual(Object.keys(serviceFor('mixed')).sort());
  });

  it.each(calls)('%s rejects with YouTube quotaExceeded (403)', async (_name, call) => {
    await expect(call(serviceFor('api-error'))).rejects.toMatchObject({
      code: 403,
      errors: [{ domain: 'youtube.quota', reason: 'quotaExceeded', message: expect.stringContaining('quota') }],
    });
  });
});

describe('isScenarioName', () => {
  it.each(SCENARIO_NAMES)('accepts %s', (name) => {
    expect(isScenarioName(name)).toBe(true);
  });

  it.each(['nope', '', undefined, 42, 'toString'])('rejects %j', (value) => {
    expect(isScenarioName(value)).toBe(false);
  });
});

describe('resetFakeStore', () => {
  it('switches the shared store to the named scenario', async () => {
    resetFakeStore('empty');
    expect(getFakeStore().broadcasts).toEqual([]);
    resetFakeStore('one-live');
    expect(getFakeStore().broadcasts.map((b) => b.status?.lifeCycleStatus)).toEqual(['live']);
  });

  it('defaults to mixed', () => {
    resetFakeStore('empty');
    resetFakeStore();
    expect(getFakeStore().broadcasts).toHaveLength(5);
  });
});
