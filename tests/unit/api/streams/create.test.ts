import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/streams/create/route';
import { addToPlaylist } from '@/lib/playlists';
import { bindBroadcastToStream, createStream } from '@/lib/youtube';
import { makeRequest } from '../../helpers/request';
import { signedIn, signedInWithoutToken, signedOut, TEST_TOKEN } from '../../helpers/session';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }));
vi.mock('@/lib/youtube', () => ({ createStream: vi.fn(), bindBroadcastToStream: vi.fn() }));
vi.mock('@/lib/playlists', () => ({ addToPlaylist: vi.fn() }));

const validBody = {
  title: '  My Stream  ',
  description: 'desc',
  startTime: '2026-12-01T18:30:00Z',
  privacyStatus: 'unlisted',
  autoStart: 'true',
  autoStop: 'false',
};

const post = (body: unknown) => POST(makeRequest('/api/streams/create', { method: 'POST', body }));

describe('POST /api/streams/create', () => {
  beforeEach(() => {
    signedIn();
    vi.mocked(createStream).mockResolvedValue({ data: { id: 'vid-1' } } as never);
  });

  it('returns 401 when there is no session', async () => {
    signedOut();
    const res = await post(validBody);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(createStream).not.toHaveBeenCalled();
  });

  it('returns 401 when the session has no access token', async () => {
    signedInWithoutToken();
    const res = await post(validBody);
    expect(res.status).toBe(401);
  });

  it.each([undefined, '', '   '])('returns 400 when the title is %j', async (title) => {
    const res = await post({ ...validBody, title });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ errors: [{ message: 'Title is required.' }] });
    expect(createStream).not.toHaveBeenCalled();
  });

  it('creates the stream with a trimmed title and coerced flags, then returns the redirect', async () => {
    const res = await post(validBody);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ redirectUrl: '/streams' });
    expect(createStream).toHaveBeenCalledWith(TEST_TOKEN, {
      title: 'My Stream',
      description: 'desc',
      scheduledStartTime: '2026-12-01T18:30:00Z',
      privacyStatus: 'unlisted',
      enableAutoStart: true,
      enableAutoStop: false,
    });
  });

  it('applies defaults for description, privacy and flags', async () => {
    await post({ title: 'T', startTime: '2026-12-01T18:30:00Z' });
    expect(createStream).toHaveBeenCalledWith(TEST_TOKEN, {
      title: 'T',
      description: '',
      scheduledStartTime: '2026-12-01T18:30:00Z',
      privacyStatus: 'private',
      enableAutoStart: false,
      enableAutoStop: false,
    });
  });

  it('converts a datetime-local value (no zone) to a UTC ISO string', async () => {
    await post({ ...validBody, startTime: '2026-12-01T18:30' });
    const expected = new Date('2026-12-01T18:30').toISOString();
    expect(vi.mocked(createStream).mock.calls[0][1].scheduledStartTime).toBe(expected);
  });

  it('passes through a start time with a + offset unchanged', async () => {
    await post({ ...validBody, startTime: '2026-12-01T18:30:00+01:00' });
    expect(vi.mocked(createStream).mock.calls[0][1].scheduledStartTime).toBe('2026-12-01T18:30:00+01:00');
  });

  // Characterises bug B2: a missing start time is a 500, not a 400. Flip when B2 is fixed.
  it('currently returns 500 when the start time is missing (bug B2)', async () => {
    const res = await post({ title: 'T' });
    expect(res.status).toBe(500);
    expect(createStream).not.toHaveBeenCalled();
  });

  it('binds the new broadcast to the chosen stream key', async () => {
    await post({ ...validBody, streamKeyId: 'key-9' });
    expect(bindBroadcastToStream).toHaveBeenCalledWith(TEST_TOKEN, 'vid-1', 'key-9');
  });

  it('does not bind when no stream key is chosen', async () => {
    await post(validBody);
    expect(bindBroadcastToStream).not.toHaveBeenCalled();
  });

  it('treats a failed stream key bind as best-effort', async () => {
    vi.mocked(bindBroadcastToStream).mockRejectedValue(new Error('bind failed'));
    const res = await post({ ...validBody, streamKeyId: 'key-9' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ redirectUrl: '/streams' });
  });

  it('adds the new broadcast to every selected playlist', async () => {
    await post({ ...validBody, playlistIds: JSON.stringify(['pl-1', 'pl-2']) });
    expect(addToPlaylist).toHaveBeenCalledTimes(2);
    expect(addToPlaylist).toHaveBeenCalledWith(TEST_TOKEN, 'pl-1', 'vid-1');
    expect(addToPlaylist).toHaveBeenCalledWith(TEST_TOKEN, 'pl-2', 'vid-1');
  });

  it('still succeeds when some playlist adds fail', async () => {
    vi.mocked(addToPlaylist).mockRejectedValueOnce(new Error('nope'));
    const res = await post({ ...validBody, playlistIds: JSON.stringify(['pl-1', 'pl-2']) });
    expect(res.status).toBe(200);
    expect(addToPlaylist).toHaveBeenCalledTimes(2);
  });

  it('still succeeds when playlistIds is not valid JSON', async () => {
    const res = await post({ ...validBody, playlistIds: 'not-json' });
    expect(res.status).toBe(200);
    expect(addToPlaylist).not.toHaveBeenCalled();
  });

  it('skips bind and playlists when YouTube returns no id', async () => {
    vi.mocked(createStream).mockResolvedValue({ data: {} } as never);
    await post({ ...validBody, streamKeyId: 'k', playlistIds: '["pl-1"]' });
    expect(bindBroadcastToStream).not.toHaveBeenCalled();
    expect(addToPlaylist).not.toHaveBeenCalled();
  });

  it('returns 500 when YouTube create fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(createStream).mockRejectedValue({ code: 403, errors: [{ message: 'quota' }] });
    const res = await post(validBody);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ code: 403, errors: [{ message: 'quota' }] });
  });
});
