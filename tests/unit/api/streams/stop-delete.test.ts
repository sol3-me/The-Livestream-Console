import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from '@/app/api/streams/delete/[id]/route';
import { POST as STOP } from '@/app/api/streams/stop/[id]/route';
import { deleteStream, stopStreamById } from '@/lib/youtube';
import { ctx, makeRequest } from '../../helpers/request';
import { signedIn, signedOut, TEST_TOKEN } from '../../helpers/session';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }));
vi.mock('@/lib/youtube', () => ({ stopStreamById: vi.fn(), deleteStream: vi.fn() }));

const stop = (id = 'vid-1') => STOP(makeRequest(`/api/streams/stop/${id}`, { method: 'POST' }), ctx({ id }));
const del = (id = 'vid-1') => DELETE(makeRequest(`/api/streams/delete/${id}`, { method: 'DELETE' }), ctx({ id }));

describe('POST /api/streams/stop/[id]', () => {
  beforeEach(() => signedIn());

  it('returns 401 when there is no session', async () => {
    signedOut();
    const res = await stop();
    expect(res.status).toBe(401);
    expect(stopStreamById).not.toHaveBeenCalled();
  });

  it('transitions the broadcast named in the URL and returns the redirect', async () => {
    vi.mocked(stopStreamById).mockResolvedValue({} as never);
    const res = await stop('live-7');
    expect(stopStreamById).toHaveBeenCalledWith(TEST_TOKEN, 'live-7');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ redirectUrl: '/streams' });
  });

  it('returns 500 with the error body when YouTube refuses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(stopStreamById).mockRejectedValue({ code: 403, errors: [{ message: 'redundantTransition' }] });
    const res = await stop();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ code: 403, errors: [{ message: 'redundantTransition' }] });
  });
});

describe('DELETE /api/streams/delete/[id]', () => {
  beforeEach(() => signedIn());

  it('returns 401 when there is no session', async () => {
    signedOut();
    const res = await del();
    expect(res.status).toBe(401);
    expect(deleteStream).not.toHaveBeenCalled();
  });

  it('deletes the broadcast named in the URL and returns the redirect', async () => {
    vi.mocked(deleteStream).mockResolvedValue({} as never);
    const res = await del('old-3');
    expect(deleteStream).toHaveBeenCalledWith(TEST_TOKEN, 'old-3');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ redirectUrl: '/streams' });
  });

  it('returns 500 with the error body when YouTube refuses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(deleteStream).mockRejectedValue({ code: 404, errors: [{ message: 'liveBroadcastNotFound' }] });
    const res = await del();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ code: 404, errors: [{ message: 'liveBroadcastNotFound' }] });
  });
});
