import { describe, expect, it } from 'vitest';
import { Stream, type YouTubeStreamData } from '@/lib/stream';
import { formatStreams } from '@/lib/utils';
import type { CreateStreamData } from '@/lib/youtube';
import { createFakeStore, type FakeScenario, type FakeStore } from '@/lib/services/youtube/fake/scenario';
import mixed from '@/lib/services/youtube/fake/scenarios/mixed.json';
import { createFakeYouTubeService } from '@/lib/services/youtube/fake/service';

const NOW = new Date('2026-12-01T12:00:00.000Z');
const TOKEN = 'any-token';
const minutesFromNow = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString();

function setup(scenario: FakeScenario = mixed as FakeScenario) {
  const store: FakeStore = createFakeStore(scenario, NOW);
  const yt = createFakeYouTubeService(() => store, () => NOW);
  return { store, yt };
}

/** The rejection googleapis produces: HTTP status in `code`, documented reason in `errors[0]`. */
const rejectsWith = (p: Promise<unknown>, code: number, reason: string) =>
  expect(p).rejects.toMatchObject({ code, errors: [expect.objectContaining({ reason })] });

const ids = (items: { id?: string | null }[] | undefined) => (items ?? []).map((i) => i.id);

const newStream = (overrides: Partial<CreateStreamData> = {}): CreateStreamData => ({
  title: 'New Stream',
  description: 'd',
  scheduledStartTime: minutesFromNow(60),
  privacyStatus: 'unlisted',
  enableAutoStart: true,
  enableAutoStop: false,
  ...overrides,
});

describe('scenario loading (mixed.json)', () => {
  it('turns minute offsets into ISO times relative to load time', () => {
    const { store } = setup();
    const live = store.broadcasts.find((b) => b.id === 'live-1')!;
    expect(live.snippet?.scheduledStartTime).toBe(minutesFromNow(-30));
    expect(live.snippet?.actualStartTime).toBe(minutesFromNow(-25));
    const done = store.broadcasts.find((b) => b.id === 'complete-1')!;
    expect(done.snippet?.actualEndTime).toBe(minutesFromNow(-9955));
  });

  it('builds broadcasts in the API shape, including the passthrough fields the edit route needs', () => {
    const { store } = setup();
    const b = store.broadcasts.find((x) => x.id === 'upcoming-ready-1')!;
    expect(b).toMatchObject({
      kind: 'youtube#liveBroadcast',
      snippet: { title: 'Saturday Speedruns', description: 'Bound to the main key, auto-start on.' },
      status: { lifeCycleStatus: 'ready', privacyStatus: 'unlisted' },
      contentDetails: {
        boundStreamId: 'key-main',
        enableAutoStart: true,
        enableAutoStop: false,
        enableDvr: true,
        enableEmbed: true,
        recordFromStart: true,
        enableClosedCaptions: false,
        enableContentEncryption: false,
        startWithSlate: false,
        monitorStream: { enableMonitorStream: true, broadcastStreamDelayMs: 0 },
      },
    });
  });

  it('builds stream keys with their ingestion details', () => {
    const { store } = setup();
    expect(store.liveStreams.find((s) => s.id === 'key-main')).toMatchObject({
      snippet: { title: 'Main (1080p60)' },
      cdn: {
        resolution: '1080p',
        frameRate: '60fps',
        ingestionType: 'rtmp',
        ingestionInfo: {
          streamName: 'fake-main-abcd-efgh-ijkl',
          ingestionAddress: 'rtmp://a.rtmp.youtube.com/live2',
          backupIngestionAddress: 'rtmp://b.rtmp.youtube.com/live2?backup=1',
        },
      },
    });
  });

  it('builds playlist items in order with the video title', () => {
    const { store } = setup();
    const items = store.playlistItems.filter((i) => i.snippet?.playlistId === 'pl-highlights');
    expect(items.map((i) => [i.snippet?.position, i.snippet?.resourceId?.videoId, i.snippet?.title])).toEqual([
      [0, 'complete-1', "Last Week's Stream"],
      [1, 'complete-2', "Yesterday's Q&A"],
    ]);
  });

  it('rejects a scenario whose broadcast is bound to an unknown stream key', () => {
    const bad = { ...mixed, broadcasts: [{ ...mixed.broadcasts[0], boundStreamId: 'nope' }] } as FakeScenario;
    expect(() => createFakeStore(bad, NOW)).toThrow('Scenario broadcast "live-1" is bound to unknown stream key "nope"');
  });

  it('rejects a scenario whose playlist references an unknown video', () => {
    const bad = { ...mixed, playlists: [{ ...mixed.playlists[0], videoIds: ['ghost'] }] } as FakeScenario;
    expect(() => createFakeStore(bad, NOW)).toThrow('Scenario playlist "pl-highlights" references unknown video "ghost"');
  });
});

describe('getStreams', () => {
  it('upcoming returns created and ready broadcasts, soonest first', async () => {
    const { yt } = setup();
    const res = await yt.getStreams(TOKEN, 'upcoming');
    expect(ids(res.data.items)).toEqual(['upcoming-ready-1', 'upcoming-created-1']);
  });

  it('defaults to upcoming', async () => {
    const { yt } = setup();
    expect(ids((await yt.getStreams(TOKEN)).data.items)).toEqual(['upcoming-ready-1', 'upcoming-created-1']);
  });

  it('active returns live and testing broadcasts', async () => {
    const { store, yt } = setup();
    store.broadcasts.find((b) => b.id === 'upcoming-created-1')!.status!.lifeCycleStatus = 'testing';
    expect(ids((await yt.getStreams(TOKEN, 'active')).data.items)).toEqual(['live-1', 'upcoming-created-1']);
  });

  it('completed returns complete broadcasts, most recently ended first', async () => {
    const { yt } = setup();
    expect(ids((await yt.getStreams(TOKEN, 'completed')).data.items)).toEqual(['complete-2', 'complete-1']);
  });

  it('respects the limit', async () => {
    const { yt } = setup();
    expect(ids((await yt.getStreams(TOKEN, 'completed', 1)).data.items)).toEqual(['complete-2']);
  });

  it('defaults the limit to 10', async () => {
    const { store, yt } = setup();
    for (let i = 0; i < 12; i++) await yt.createStream(TOKEN, newStream({ scheduledStartTime: minutesFromNow(100 + i) }));
    expect((await yt.getStreams(TOKEN)).data.items).toHaveLength(10);
    expect(store.broadcasts.length).toBeGreaterThan(12);
  });

  it('returns copies, so callers cannot change the stored state', async () => {
    const { store, yt } = setup();
    const res = await yt.getStreams(TOKEN, 'active');
    res.data.items![0].snippet!.title = 'mutated';
    expect(store.broadcasts.find((b) => b.id === 'live-1')!.snippet!.title).toBe('Friday Night Stream');
  });

  it('formats cleanly with formatStreams, as the pages use it', async () => {
    const { yt } = setup();
    const [live] = formatStreams(await yt.getStreams(TOKEN, 'active'));
    expect(live).toMatchObject({ id: 'live-1', isLive: true, isComplete: false, privacyStatus: 'public', boundStreamId: 'key-main' });
  });
});

describe('getStreamById', () => {
  it('returns the broadcast in a one-item list', async () => {
    const { yt } = setup();
    expect(ids((await yt.getStreamById(TOKEN, 'complete-1')).data.items)).toEqual(['complete-1']);
  });

  it('returns an empty list for an unknown id (the edit route turns this into a 404)', async () => {
    const { yt } = setup();
    expect((await yt.getStreamById(TOKEN, 'nope')).data.items).toEqual([]);
  });
});

describe('createStream ("start": schedule a broadcast)', () => {
  it('creates an unbound broadcast in the created state with the requested settings', async () => {
    const { yt } = setup();
    const res = await yt.createStream(TOKEN, newStream());
    expect(res.data).toMatchObject({
      snippet: { title: 'New Stream', description: 'd', scheduledStartTime: minutesFromNow(60) },
      status: { lifeCycleStatus: 'created', privacyStatus: 'unlisted' },
      contentDetails: { enableAutoStart: true, enableAutoStop: false, enableDvr: true, recordFromStart: true },
    });
    expect(res.data.contentDetails?.boundStreamId).toBeUndefined();
    expect(res.data.id).toBeTruthy();
  });

  it('shows the new broadcast in the upcoming list', async () => {
    const { yt } = setup();
    const { data } = await yt.createStream(TOKEN, newStream());
    expect(ids((await yt.getStreams(TOKEN, 'upcoming')).data.items)).toContain(data.id);
  });

  it('gives each broadcast a unique id', async () => {
    const { yt } = setup();
    const a = await yt.createStream(TOKEN, newStream());
    const b = await yt.createStream(TOKEN, newStream());
    expect(a.data.id).not.toBe(b.data.id);
  });

  it.each([
    ['a missing title', { title: '' }, 400, 'titleRequired'],
    ['a title over 100 characters', { title: 'x'.repeat(101) }, 400, 'invalidTitle'],
    ['a missing start time', { scheduledStartTime: '' }, 400, 'scheduledStartTimeRequired'],
    ['a start time in the past', { scheduledStartTime: minutesFromNow(-1) }, 400, 'invalidScheduledStartTime'],
    ['a missing privacy status', { privacyStatus: '' }, 400, 'privacyStatusRequired'],
    ['an unknown privacy status', { privacyStatus: 'friends' }, 400, 'invalidPrivacyStatus'],
  ])('rejects %s', async (_label, override, code, reason) => {
    const { store, yt } = setup();
    const before = store.broadcasts.length;
    await rejectsWith(yt.createStream(TOKEN, newStream(override)), code, reason);
    expect(store.broadcasts).toHaveLength(before);
  });
});

describe('bindBroadcastToStream', () => {
  it('binds the stream key and moves a created broadcast to ready', async () => {
    const { yt } = setup();
    const res = await yt.bindBroadcastToStream(TOKEN, 'upcoming-created-1', 'key-backup');
    expect(res.data).toMatchObject({ contentDetails: { boundStreamId: 'key-backup' }, status: { lifeCycleStatus: 'ready' } });
    const [stored] = (await yt.getStreamById(TOKEN, 'upcoming-created-1')).data.items!;
    expect(stored.contentDetails?.boundStreamId).toBe('key-backup');
  });

  it('rebinds a ready broadcast and keeps it ready', async () => {
    const { yt } = setup();
    const res = await yt.bindBroadcastToStream(TOKEN, 'upcoming-ready-1', 'key-backup');
    expect(res.data).toMatchObject({ contentDetails: { boundStreamId: 'key-backup' }, status: { lifeCycleStatus: 'ready' } });
  });

  it('rejects an unknown broadcast', async () => {
    await rejectsWith(setup().yt.bindBroadcastToStream(TOKEN, 'nope', 'key-main'), 404, 'liveBroadcastNotFound');
  });

  it('rejects an unknown stream key', async () => {
    await rejectsWith(setup().yt.bindBroadcastToStream(TOKEN, 'upcoming-created-1', 'nope'), 404, 'liveStreamNotFound');
  });

  it('rejects binding a completed broadcast', async () => {
    await rejectsWith(setup().yt.bindBroadcastToStream(TOKEN, 'complete-1', 'key-main'), 403, 'liveBroadcastBindingNotAllowed');
  });
});

describe('stopStreamById (transition to complete)', () => {
  it('completes a live broadcast and records when it ended', async () => {
    const { yt } = setup();
    const res = await yt.stopStreamById(TOKEN, 'live-1');
    expect(res.data).toMatchObject({ status: { lifeCycleStatus: 'complete' }, snippet: { actualEndTime: NOW.toISOString() } });
    expect(ids((await yt.getStreams(TOKEN, 'active')).data.items)).toEqual([]);
    expect(ids((await yt.getStreams(TOKEN, 'completed')).data.items)[0]).toBe('live-1');
  });

  it('completes a broadcast that is testing', async () => {
    const { store, yt } = setup();
    store.broadcasts.find((b) => b.id === 'upcoming-ready-1')!.status!.lifeCycleStatus = 'testing';
    const res = await yt.stopStreamById(TOKEN, 'upcoming-ready-1');
    expect(res.data.status?.lifeCycleStatus).toBe('complete');
  });

  it('rejects stopping a broadcast that is already complete', async () => {
    await rejectsWith(setup().yt.stopStreamById(TOKEN, 'complete-1'), 403, 'redundantTransition');
  });

  it('rejects stopping a broadcast that has not started', async () => {
    const { store, yt } = setup();
    await rejectsWith(yt.stopStreamById(TOKEN, 'upcoming-ready-1'), 403, 'invalidTransition');
    expect(store.broadcasts.find((b) => b.id === 'upcoming-ready-1')!.status!.lifeCycleStatus).toBe('ready');
  });

  it('rejects an unknown broadcast', async () => {
    await rejectsWith(setup().yt.stopStreamById(TOKEN, 'nope'), 404, 'liveBroadcastNotFound');
  });
});

describe('editStream (liveBroadcasts.update)', () => {
  /** What the edit route sends: the stored broadcast merged with the form via the Stream class. */
  async function editViaRoute(yt: ReturnType<typeof setup>['yt'], id: string, form: Record<string, string>) {
    const [current] = (await yt.getStreamById(TOKEN, id)).data.items!;
    return yt.editStream(TOKEN, new Stream({ id, ...form }, current as unknown as YouTubeStreamData));
  }

  it('applies an edit made the way the edit route makes it, keeping the binding and state', async () => {
    const { yt } = setup();
    const res = await editViaRoute(yt, 'upcoming-ready-1', {
      title: 'Renamed',
      privacyStatus: 'public',
      startTime: minutesFromNow(120),
      autoStop: 'true',
    });
    expect(res.data).toMatchObject({
      id: 'upcoming-ready-1',
      snippet: { title: 'Renamed', description: 'Bound to the main key, auto-start on.', scheduledStartTime: minutesFromNow(120) },
      status: { privacyStatus: 'public', lifeCycleStatus: 'ready' },
      contentDetails: { enableAutoStart: true, enableAutoStop: true, boundStreamId: 'key-main' },
    });
    const [stored] = (await yt.getStreamById(TOKEN, 'upcoming-ready-1')).data.items!;
    expect(stored.snippet?.title).toBe('Renamed');
  });

  it('deletes fields the request leaves out, as YouTube does', async () => {
    const { yt } = setup();
    const [current] = (await yt.getStreamById(TOKEN, 'upcoming-ready-1')).data.items!;
    const res = await yt.editStream(TOKEN, {
      id: 'upcoming-ready-1',
      snippet: { title: 'Only title', scheduledStartTime: current.snippet!.scheduledStartTime },
      contentDetails: current.contentDetails,
    });
    expect(res.data.snippet?.description).toBeUndefined();
    expect(res.data.status?.privacyStatus).toBe('private');
  });

  it('allows editing a live broadcast when setup-only settings are unchanged', async () => {
    const { yt } = setup();
    const res = await editViaRoute(yt, 'live-1', { title: 'Still live' });
    expect(res.data).toMatchObject({ snippet: { title: 'Still live' }, status: { lifeCycleStatus: 'live' } });
  });

  it('rejects changing auto-start once the broadcast is live', async () => {
    const { yt } = setup();
    await rejectsWith(editViaRoute(yt, 'live-1', { autoStart: 'false' }), 403, 'enableAutoStartModificationNotAllowed');
  });

  it('rejects moving an upcoming broadcast into the past', async () => {
    const { yt } = setup();
    await rejectsWith(editViaRoute(yt, 'upcoming-ready-1', { startTime: minutesFromNow(-5) }), 400, 'invalidScheduledStartTime');
  });

  it('rejects a request without an id', async () => {
    await rejectsWith(setup().yt.editStream(TOKEN, { snippet: {} }), 400, 'idRequired');
  });

  it('rejects an unknown broadcast', async () => {
    const { yt } = setup();
    const [current] = (await yt.getStreamById(TOKEN, 'live-1')).data.items!;
    await rejectsWith(yt.editStream(TOKEN, { ...current, id: 'nope' }), 404, 'liveBroadcastNotFound');
  });

  it('rejects a request without a scheduled start time', async () => {
    const { yt } = setup();
    const [current] = (await yt.getStreamById(TOKEN, 'live-1')).data.items!;
    await rejectsWith(
      yt.editStream(TOKEN, { ...current, snippet: { ...current.snippet, scheduledStartTime: undefined } }),
      400,
      'scheduledStartTimeRequired',
    );
  });

  it('rejects a request without the monitor stream settings', async () => {
    const { yt } = setup();
    const [current] = (await yt.getStreamById(TOKEN, 'upcoming-ready-1')).data.items!;
    await rejectsWith(
      yt.editStream(TOKEN, { ...current, contentDetails: { ...current.contentDetails, monitorStream: undefined } }),
      400,
      'enableMonitorStreamRequired',
    );
  });
});

describe('deleteStream', () => {
  it('removes the broadcast and its playlist entries', async () => {
    const { store, yt } = setup();
    await yt.deleteStream(TOKEN, 'complete-1');
    expect(store.broadcasts.find((b) => b.id === 'complete-1')).toBeUndefined();
    expect(store.playlistItems.some((i) => i.snippet?.resourceId?.videoId === 'complete-1')).toBe(false);
  });

  it('rejects deleting a live broadcast', async () => {
    await rejectsWith(setup().yt.deleteStream(TOKEN, 'live-1'), 403, 'liveBroadcastDeletionNotAllowed');
  });

  it('rejects an unknown broadcast', async () => {
    await rejectsWith(setup().yt.deleteStream(TOKEN, 'nope'), 404, 'liveBroadcastNotFound');
  });
});

describe('stream keys', () => {
  it('getMyLiveStreams lists every key', async () => {
    expect(ids(await setup().yt.getMyLiveStreams(TOKEN))).toEqual(['key-main', 'key-backup']);
  });

  it('getLiveStreamsByIds returns only the requested keys', async () => {
    expect(ids(await setup().yt.getLiveStreamsByIds(TOKEN, ['key-backup', 'nope']))).toEqual(['key-backup']);
  });

  it('getLiveStreamsByIds returns nothing for no ids', async () => {
    expect(await setup().yt.getLiveStreamsByIds(TOKEN, [])).toEqual([]);
  });

  it('getLiveStreamByBroadcastId returns the bound key details', async () => {
    expect(await setup().yt.getLiveStreamByBroadcastId(TOKEN, 'live-1')).toEqual({
      streamId: 'key-main',
      streamTitle: 'Main (1080p60)',
      streamKey: 'fake-main-abcd-efgh-ijkl',
      ingestionAddress: 'rtmp://a.rtmp.youtube.com/live2',
      backupIngestionAddress: 'rtmp://b.rtmp.youtube.com/live2?backup=1',
      resolution: '1080p',
      frameRate: '60fps',
      ingestionType: 'rtmp',
    });
  });

  it.each(['upcoming-created-1', 'nope'])('getLiveStreamByBroadcastId returns null for %s', async (id) => {
    expect(await setup().yt.getLiveStreamByBroadcastId(TOKEN, id)).toBeNull();
  });
});

describe('playlists', () => {
  it('getPlaylists lists playlists with their item counts', async () => {
    const res = await setup().yt.getPlaylists(TOKEN);
    expect(res.data.items!.map((p) => [p.id, p.contentDetails?.itemCount, p.status?.privacyStatus])).toEqual([
      ['pl-highlights', 2, 'public'],
      ['pl-series', 2, 'unlisted'],
      ['pl-empty', 0, 'private'],
    ]);
  });

  it('getPlaylistItems lists a playlist in order', async () => {
    const res = await setup().yt.getPlaylistItems(TOKEN, 'pl-series');
    expect(res.data.items!.map((i) => i.snippet?.resourceId?.videoId)).toEqual(['live-1', 'complete-1']);
  });

  it('getPlaylistItems rejects an unknown playlist', async () => {
    await rejectsWith(setup().yt.getPlaylistItems(TOKEN, 'nope'), 404, 'playlistNotFound');
  });

  it('addToPlaylist appends the video at the end', async () => {
    const { yt } = setup();
    const res = await yt.addToPlaylist(TOKEN, 'pl-empty', 'complete-2');
    expect(res.data.snippet).toMatchObject({ playlistId: 'pl-empty', position: 0, resourceId: { kind: 'youtube#video', videoId: 'complete-2' } });
    expect((await yt.getPlaylists(TOKEN)).data.items!.find((p) => p.id === 'pl-empty')!.contentDetails?.itemCount).toBe(1);
  });

  it('addToPlaylist rejects an unknown playlist', async () => {
    await rejectsWith(setup().yt.addToPlaylist(TOKEN, 'nope', 'complete-1'), 404, 'playlistNotFound');
  });

  it('addToPlaylist rejects an unknown video', async () => {
    await rejectsWith(setup().yt.addToPlaylist(TOKEN, 'pl-empty', 'nope'), 404, 'videoNotFound');
  });

  it('removeFromPlaylist removes the item', async () => {
    const { store, yt } = setup();
    const [first] = (await yt.getPlaylistItems(TOKEN, 'pl-highlights')).data.items!;
    await yt.removeFromPlaylist(TOKEN, first.id!);
    const left = (await yt.getPlaylistItems(TOKEN, 'pl-highlights')).data.items!;
    expect(left.map((i) => [i.snippet?.resourceId?.videoId, i.snippet?.position])).toEqual([['complete-2', 0]]);
    expect(store.playlistItems.some((i) => i.id === first.id)).toBe(false);
  });

  it('removeFromPlaylist rejects an unknown item', async () => {
    await rejectsWith(setup().yt.removeFromPlaylist(TOKEN, 'nope'), 404, 'playlistItemNotFound');
  });

  it('createPlaylist adds an empty playlist', async () => {
    const { yt } = setup();
    const res = await yt.createPlaylist(TOKEN, { title: 'VODs', description: 'd', privacyStatus: 'public' });
    expect(res.data).toMatchObject({ snippet: { title: 'VODs', description: 'd' }, status: { privacyStatus: 'public' } });
    const listed = (await yt.getPlaylists(TOKEN)).data.items!.find((p) => p.id === res.data.id);
    expect(listed?.contentDetails?.itemCount).toBe(0);
  });

  it('createPlaylist rejects a missing title', async () => {
    await rejectsWith(setup().yt.createPlaylist(TOKEN, { title: ' ', description: '', privacyStatus: 'private' }), 400, 'playlistTitleRequired');
  });

  it('updatePlaylist replaces the details', async () => {
    const { yt } = setup();
    const res = await yt.updatePlaylist(TOKEN, 'pl-series', { title: 'Renamed', description: '', privacyStatus: 'public' });
    expect(res.data).toMatchObject({ id: 'pl-series', snippet: { title: 'Renamed', description: '' }, status: { privacyStatus: 'public' } });
  });

  it('updatePlaylist rejects an unknown playlist', async () => {
    await rejectsWith(setup().yt.updatePlaylist(TOKEN, 'nope', { title: 'T', description: '', privacyStatus: 'private' }), 404, 'playlistNotFound');
  });

  it('updatePlaylist rejects a missing title', async () => {
    await rejectsWith(setup().yt.updatePlaylist(TOKEN, 'pl-series', { title: '', description: '', privacyStatus: 'private' }), 400, 'playlistTitleRequired');
  });

  it('deletePlaylist removes the playlist and its items', async () => {
    const { store, yt } = setup();
    await yt.deletePlaylist(TOKEN, 'pl-highlights');
    expect(ids((await yt.getPlaylists(TOKEN)).data.items)).toEqual(['pl-series', 'pl-empty']);
    expect(store.playlistItems.some((i) => i.snippet?.playlistId === 'pl-highlights')).toBe(false);
  });

  it('deletePlaylist rejects an unknown playlist', async () => {
    await rejectsWith(setup().yt.deletePlaylist(TOKEN, 'nope'), 404, 'playlistNotFound');
  });
});

describe('errors', () => {
  it('carry the code and message the pages read for ErrorDisplay', async () => {
    const err = await setup().yt.stopStreamById(TOKEN, 'nope').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).toMatchObject({
      code: 404,
      errors: [{ domain: 'youtube.liveBroadcast', reason: 'liveBroadcastNotFound', message: expect.any(String) }],
    });
  });
});
