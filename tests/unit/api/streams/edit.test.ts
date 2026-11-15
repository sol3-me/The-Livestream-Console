import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/streams/edit/[id]/route';
import { addToPlaylist, bindBroadcastToStream, editStream, getStreamById } from '@/tests/unit/helpers/youtube-service';
import { broadcast, listResponse } from '../../fixtures/youtube';
import { ctx, makeRequest } from '../../helpers/request';
import { signedIn, signedOut, TEST_TOKEN } from '../../helpers/session';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }));
vi.mock('@/lib/services/youtube', () => import('@/tests/unit/helpers/youtube-service'));

const post = (body: unknown, id = 'vid-1') =>
  POST(makeRequest(`/api/streams/edit/${id}`, { method: 'POST', body }), ctx({ id }));

describe('POST /api/streams/edit/[id]', () => {
  beforeEach(() => {
    signedIn();
    vi.mocked(getStreamById).mockResolvedValue(listResponse([broadcast()]) as never);
    vi.mocked(editStream).mockResolvedValue({} as never);
  });

  it('returns 401 when there is no session', async () => {
    signedOut();
    const res = await post({ id: 'vid-1' });
    expect(res.status).toBe(401);
    expect(getStreamById).not.toHaveBeenCalled();
  });

  it('returns 404 when YouTube does not know the broadcast', async () => {
    vi.mocked(getStreamById).mockResolvedValue(listResponse([]) as never);
    const res = await post({ id: 'missing' });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Stream not found' });
    expect(editStream).not.toHaveBeenCalled();
  });

  it('looks the broadcast up by the id in the body', async () => {
    await post({ id: 'vid-1' });
    expect(getStreamById).toHaveBeenCalledWith(TEST_TOKEN, 'vid-1');
  });

  // Characterises bug B3: the [id] URL segment is ignored; body.id wins.
  it('currently uses body.id even when it differs from the URL id (bug B3)', async () => {
    await post({ id: 'body-id' }, 'url-id');
    expect(getStreamById).toHaveBeenCalledWith(TEST_TOKEN, 'body-id');
  });

  it('merges the edit onto the existing broadcast and sends it to YouTube', async () => {
    const res = await post({
      id: 'vid-1',
      title: 'New title',
      startTime: '2026-12-02T20:00:00Z',
      privacyStatus: 'public',
      autoStart: 'true',
      autoStop: 'false',
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ redirectUrl: '/streams' });

    const sent = vi.mocked(editStream).mock.calls[0][1] as Record<string, any>;
    expect(vi.mocked(editStream).mock.calls[0][0]).toBe(TEST_TOKEN);
    expect(sent.id).toBe('vid-1');
    expect(sent.snippet).toEqual({
      title: 'New title',
      description: 'Existing description',
      scheduledStartTime: '2026-12-02T20:00:00Z',
    });
    expect(sent.status).toEqual({ privacyStatus: 'public' });
    expect(sent.contentDetails.enableAutoStart).toBe(true);
    expect(sent.contentDetails.enableAutoStop).toBe(false);
    expect(sent.contentDetails.enableDvr).toBe(true);
  });

  it('binds to a new stream key when one is given', async () => {
    await post({ id: 'vid-1', streamKeyId: 'key-2' });
    expect(bindBroadcastToStream).toHaveBeenCalledWith(TEST_TOKEN, 'vid-1', 'key-2');
  });

  it('does not bind when no stream key is given', async () => {
    await post({ id: 'vid-1' });
    expect(bindBroadcastToStream).not.toHaveBeenCalled();
  });

  // Characterises bug B3 (second half): bind failure is fatal here, unlike create.
  it('currently returns 500 if the bind fails after the edit was saved (bug B3)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(bindBroadcastToStream).mockRejectedValue(new Error('bind failed'));
    const res = await post({ id: 'vid-1', streamKeyId: 'key-2' });
    expect(editStream).toHaveBeenCalled();
    expect(res.status).toBe(500);
  });

  it('adds the broadcast to every selected playlist', async () => {
    await post({ id: 'vid-1', playlistIds: '["pl-1","pl-2"]' });
    expect(addToPlaylist).toHaveBeenCalledTimes(2);
    expect(addToPlaylist).toHaveBeenCalledWith(TEST_TOKEN, 'pl-1', 'vid-1');
    expect(addToPlaylist).toHaveBeenCalledWith(TEST_TOKEN, 'pl-2', 'vid-1');
  });

  it('still succeeds when playlistIds is not valid JSON', async () => {
    const res = await post({ id: 'vid-1', playlistIds: '{oops' });
    expect(res.status).toBe(200);
    expect(addToPlaylist).not.toHaveBeenCalled();
  });

  it('still succeeds when a playlist add fails', async () => {
    vi.mocked(addToPlaylist).mockRejectedValue(new Error('nope'));
    const res = await post({ id: 'vid-1', playlistIds: '["pl-1"]' });
    expect(res.status).toBe(200);
  });

  it('returns 500 with the error body when YouTube update fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(editStream).mockRejectedValue({ code: 400, errors: [{ message: 'bad' }] });
    const res = await post({ id: 'vid-1' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ code: 400, errors: [{ message: 'bad' }] });
  });
});
