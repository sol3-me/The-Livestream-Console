import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as GET_KEY } from '@/app/api/streams/[id]/streamkey/route';
import { GET as GET_KEYS } from '@/app/api/streams/keys/route';
import { getLiveStreamByBroadcastId, getMyLiveStreams } from '@/tests/unit/helpers/youtube-service';
import { liveStream } from '../../fixtures/youtube';
import { ctx, makeRequest } from '../../helpers/request';
import { signedIn, signedOut, TEST_TOKEN } from '../../helpers/session';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }));
vi.mock('@/lib/services/youtube', () => import('@/tests/unit/helpers/youtube-service'));

describe('GET /api/streams/keys', () => {
  beforeEach(() => signedIn());

  it('returns 401 when there is no session', async () => {
    signedOut();
    const res = await GET_KEYS();
    expect(res.status).toBe(401);
    expect(getMyLiveStreams).not.toHaveBeenCalled();
  });

  it('maps the user\'s live streams to AvailableStreamKey', async () => {
    vi.mocked(getMyLiveStreams).mockResolvedValue([
      liveStream(),
      { id: 'key-2', snippet: { title: 'Backup' }, cdn: {} },
      {},
    ] as never);
    const res = await GET_KEYS();
    expect(getMyLiveStreams).toHaveBeenCalledWith(TEST_TOKEN);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: 'key-1', name: 'Main key', resolution: '1080p', frameRate: '60fps', ingestionType: 'rtmp' },
      { id: 'key-2', name: 'Backup' },
      { id: '', name: '' },
    ]);
  });

  it('returns 500 when YouTube fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getMyLiveStreams).mockRejectedValue({ code: 500 });
    const res = await GET_KEYS();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ code: 500 });
  });
});

describe('GET /api/streams/[id]/streamkey', () => {
  const get = (id = 'vid-1') => GET_KEY(makeRequest(`/api/streams/${id}/streamkey`), ctx({ id }));

  beforeEach(() => signedIn());

  it('returns 401 when there is no session', async () => {
    signedOut();
    const res = await get();
    expect(res.status).toBe(401);
    expect(getLiveStreamByBroadcastId).not.toHaveBeenCalled();
  });

  it('returns the key info for the broadcast in the URL', async () => {
    const info = { streamId: 'key-1', streamTitle: 'Main key', streamKey: 'abcd', ingestionAddress: 'rtmp://x' };
    vi.mocked(getLiveStreamByBroadcastId).mockResolvedValue(info);
    const res = await get('vid-9');
    expect(getLiveStreamByBroadcastId).toHaveBeenCalledWith(TEST_TOKEN, 'vid-9');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(info);
  });

  it('returns 404 when the broadcast has no bound key', async () => {
    vi.mocked(getLiveStreamByBroadcastId).mockResolvedValue(null);
    const res = await get();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'No stream key found for this broadcast' });
  });

  it('returns 500 when YouTube fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getLiveStreamByBroadcastId).mockRejectedValue({ code: 401 });
    const res = await get();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ code: 401 });
  });
});
