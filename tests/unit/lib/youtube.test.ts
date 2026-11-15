import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindBroadcastToStream,
  createStream,
  deleteStream,
  editStream,
  getLiveStreamByBroadcastId,
  getLiveStreamsByIds,
  getMyLiveStreams,
  getStreamById,
  getStreams,
  stopStreamById,
} from '@/lib/youtube';
import { liveStream } from '../fixtures/youtube';

const g = vi.hoisted(() => ({}) as ReturnType<typeof import('./googleapis-mock').createGoogleapisMock>);
vi.mock('googleapis', async () => {
  const { createGoogleapisMock } = await import('./googleapis-mock');
  Object.assign(g, createGoogleapisMock());
  return g.module;
});

const PART = ['snippet', 'contentDetails', 'status'];
const TOKEN = 'tok';

beforeEach(() => {
  g.youtubeFactory.mockImplementation(() => g.yt);
  vi.stubEnv('GOOGLE_CLIENT_ID', 'cid');
  vi.stubEnv('GOOGLE_CLIENT_SECRET', 'csecret');
});

describe('YouTube client construction', () => {
  it('builds an OAuth2 client from env credentials and the caller\'s access token', async () => {
    g.yt.liveBroadcasts.list.mockResolvedValue({ data: {} });
    await getStreams(TOKEN);
    expect(g.oauth.ctor).toHaveBeenCalledWith('cid', 'csecret');
    expect(g.oauth.setCredentials).toHaveBeenCalledWith({ access_token: TOKEN });
    expect(g.youtubeFactory).toHaveBeenCalledWith(expect.objectContaining({ version: 'v3' }));
  });
});

describe('getStreams', () => {
  it('defaults to upcoming broadcasts, 10 at a time', async () => {
    g.yt.liveBroadcasts.list.mockResolvedValue('res');
    expect(await getStreams(TOKEN)).toBe('res');
    expect(g.yt.liveBroadcasts.list).toHaveBeenCalledWith({ part: PART, broadcastStatus: 'upcoming', maxResults: 10 });
  });

  it('passes status and limit through', async () => {
    await getStreams(TOKEN, 'completed', 50);
    expect(g.yt.liveBroadcasts.list).toHaveBeenCalledWith({ part: PART, broadcastStatus: 'completed', maxResults: 50 });
  });
});

describe('simple broadcast calls', () => {
  it('getStreamById lists by id', async () => {
    await getStreamById(TOKEN, 'v1');
    expect(g.yt.liveBroadcasts.list).toHaveBeenCalledWith({ part: PART, id: ['v1'] });
  });

  it('stopStreamById transitions to complete', async () => {
    await stopStreamById(TOKEN, 'v1');
    expect(g.yt.liveBroadcasts.transition).toHaveBeenCalledWith({ broadcastStatus: 'complete', id: 'v1', part: PART });
  });

  it('editStream sends the body as requestBody', async () => {
    const body = { id: 'v1', snippet: { title: 't' } };
    await editStream(TOKEN, body);
    expect(g.yt.liveBroadcasts.update).toHaveBeenCalledWith({ part: PART, requestBody: body });
  });

  it('deleteStream deletes by id', async () => {
    await deleteStream(TOKEN, 'v1');
    expect(g.yt.liveBroadcasts.delete).toHaveBeenCalledWith({ id: 'v1' });
  });

  it('bindBroadcastToStream binds broadcast to key', async () => {
    await bindBroadcastToStream(TOKEN, 'v1', 'k1');
    expect(g.yt.liveBroadcasts.bind).toHaveBeenCalledWith({ id: 'v1', streamId: 'k1', part: ['id', 'contentDetails'] });
  });
});

describe('createStream', () => {
  it('inserts with the user fields plus fixed defaults (DVR, embed, record from start, monitor)', async () => {
    g.yt.liveBroadcasts.insert.mockResolvedValue('created');
    const out = await createStream(TOKEN, {
      title: 'T',
      description: 'D',
      scheduledStartTime: '2026-12-01T18:00:00Z',
      privacyStatus: 'unlisted',
      enableAutoStart: true,
      enableAutoStop: false,
    });
    expect(out).toBe('created');
    expect(g.yt.liveBroadcasts.insert).toHaveBeenCalledWith({
      part: PART,
      requestBody: {
        snippet: { title: 'T', description: 'D', scheduledStartTime: '2026-12-01T18:00:00Z' },
        status: { privacyStatus: 'unlisted' },
        contentDetails: {
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
      },
    });
  });
});

describe('getLiveStreamByBroadcastId', () => {
  it('resolves broadcast → bound stream → key info', async () => {
    g.yt.liveBroadcasts.list.mockResolvedValue({ data: { items: [{ contentDetails: { boundStreamId: 'key-1' } }] } });
    g.yt.liveStreams.list.mockResolvedValue({ data: { items: [liveStream()] } });
    const info = await getLiveStreamByBroadcastId(TOKEN, 'v1');
    expect(g.yt.liveBroadcasts.list).toHaveBeenCalledWith({ part: ['contentDetails'], id: ['v1'] });
    expect(g.yt.liveStreams.list).toHaveBeenCalledWith({ part: ['snippet', 'cdn'], id: ['key-1'] });
    expect(info).toEqual({
      streamId: 'key-1',
      streamTitle: 'Main key',
      streamKey: 'abcd-efgh',
      ingestionAddress: 'rtmp://a.rtmp.youtube.com/live2',
      backupIngestionAddress: 'rtmp://b.rtmp.youtube.com/live2?backup=1',
      resolution: '1080p',
      frameRate: '60fps',
      ingestionType: 'rtmp',
    });
  });

  it('returns null when the broadcast has no bound stream', async () => {
    g.yt.liveBroadcasts.list.mockResolvedValue({ data: { items: [{ contentDetails: {} }] } });
    expect(await getLiveStreamByBroadcastId(TOKEN, 'v1')).toBeNull();
    expect(g.yt.liveStreams.list).not.toHaveBeenCalled();
  });

  it('returns null when the bound stream no longer exists', async () => {
    g.yt.liveBroadcasts.list.mockResolvedValue({ data: { items: [{ contentDetails: { boundStreamId: 'k' } }] } });
    g.yt.liveStreams.list.mockResolvedValue({ data: { items: [] } });
    expect(await getLiveStreamByBroadcastId(TOKEN, 'v1')).toBeNull();
  });

  it('defaults missing cdn fields to empty strings / undefined', async () => {
    g.yt.liveBroadcasts.list.mockResolvedValue({ data: { items: [{ contentDetails: { boundStreamId: 'k' } }] } });
    g.yt.liveStreams.list.mockResolvedValue({ data: { items: [{}] } });
    expect(await getLiveStreamByBroadcastId(TOKEN, 'v1')).toEqual({
      streamId: 'k',
      streamTitle: '',
      streamKey: '',
      ingestionAddress: '',
      backupIngestionAddress: undefined,
      resolution: undefined,
      frameRate: undefined,
      ingestionType: undefined,
    });
  });
});

describe('live stream (key) listing', () => {
  it('getLiveStreamsByIds short-circuits on an empty list', async () => {
    expect(await getLiveStreamsByIds(TOKEN, [])).toEqual([]);
    expect(g.yt.liveStreams.list).not.toHaveBeenCalled();
  });

  it('getLiveStreamsByIds batch-fetches and unwraps items', async () => {
    g.yt.liveStreams.list.mockResolvedValue({ data: { items: [{ id: 'a' }] } });
    expect(await getLiveStreamsByIds(TOKEN, ['a', 'b'])).toEqual([{ id: 'a' }]);
    expect(g.yt.liveStreams.list).toHaveBeenCalledWith({ part: ['snippet', 'cdn'], id: ['a', 'b'], maxResults: 50 });
  });

  it('getLiveStreamsByIds returns [] when items are missing', async () => {
    g.yt.liveStreams.list.mockResolvedValue({ data: {} });
    expect(await getLiveStreamsByIds(TOKEN, ['a'])).toEqual([]);
  });

  it('getMyLiveStreams lists the user\'s keys and unwraps items', async () => {
    g.yt.liveStreams.list.mockResolvedValue({ data: { items: [{ id: 'k' }] } });
    expect(await getMyLiveStreams(TOKEN)).toEqual([{ id: 'k' }]);
    expect(g.yt.liveStreams.list).toHaveBeenCalledWith({ part: ['snippet', 'cdn'], mine: true, maxResults: 50 });
  });

  it('getMyLiveStreams returns [] when items are missing', async () => {
    g.yt.liveStreams.list.mockResolvedValue({ data: {} });
    expect(await getMyLiveStreams(TOKEN)).toEqual([]);
  });
});
