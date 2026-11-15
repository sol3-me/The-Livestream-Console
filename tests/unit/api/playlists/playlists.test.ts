import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE as DELETE_ITEM } from '@/app/api/playlists/[id]/items/[itemId]/route';
import { GET as GET_ITEMS, POST as ADD_ITEM } from '@/app/api/playlists/[id]/items/route';
import { DELETE as DELETE_PLAYLIST, PUT } from '@/app/api/playlists/[id]/route';
import { GET as LIST, POST as CREATE } from '@/app/api/playlists/route';
import {
  addToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistItems,
  getPlaylists,
  removeFromPlaylist,
  updatePlaylist,
} from '@/lib/playlists';
import { listResponse } from '../../fixtures/youtube';
import { ctx, makeRequest } from '../../helpers/request';
import { signedIn, signedOut, TEST_TOKEN } from '../../helpers/session';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }));
vi.mock('@/lib/playlists', () => ({
  getPlaylists: vi.fn(),
  getPlaylistItems: vi.fn(),
  addToPlaylist: vi.fn(),
  removeFromPlaylist: vi.fn(),
  createPlaylist: vi.fn(),
  updatePlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
}));

const ytError = { code: 403, errors: [{ message: 'forbidden' }] };
const quietErrors = () => vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => signedIn());

describe('GET /api/playlists', () => {
  it('returns 401 when there is no session', async () => {
    signedOut();
    expect((await LIST()).status).toBe(401);
    expect(getPlaylists).not.toHaveBeenCalled();
  });

  it('returns the raw playlist items from YouTube', async () => {
    vi.mocked(getPlaylists).mockResolvedValue(listResponse([{ id: 'pl-1' }, { id: 'pl-2' }]) as never);
    const res = await LIST();
    expect(getPlaylists).toHaveBeenCalledWith(TEST_TOKEN);
    expect(await res.json()).toEqual([{ id: 'pl-1' }, { id: 'pl-2' }]);
  });

  it('returns [] when YouTube omits items', async () => {
    vi.mocked(getPlaylists).mockResolvedValue(listResponse(undefined) as never);
    expect(await (await LIST()).json()).toEqual([]);
  });

  it('returns 500 with the error body when YouTube fails', async () => {
    quietErrors();
    vi.mocked(getPlaylists).mockRejectedValue(ytError);
    const res = await LIST();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual(ytError);
  });
});

describe('POST /api/playlists', () => {
  const create = (body: unknown) => CREATE(makeRequest('/api/playlists', { method: 'POST', body }));

  it('returns 401 when there is no session', async () => {
    signedOut();
    expect((await create({ title: 'x' })).status).toBe(401);
    expect(createPlaylist).not.toHaveBeenCalled();
  });

  it.each([undefined, '', '  '])('returns 400 when the title is %j', async (title) => {
    const res = await create({ title });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ errors: [{ message: 'Title is required.' }] });
    expect(createPlaylist).not.toHaveBeenCalled();
  });

  it('creates with a trimmed title and returns YouTube data', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({ data: { id: 'pl-new' } } as never);
    const res = await create({ title: ' Vods ', description: 'd', privacyStatus: 'public' });
    expect(createPlaylist).toHaveBeenCalledWith(TEST_TOKEN, { title: 'Vods', description: 'd', privacyStatus: 'public' });
    expect(await res.json()).toEqual({ id: 'pl-new' });
  });

  it('defaults description to empty and privacy to private', async () => {
    vi.mocked(createPlaylist).mockResolvedValue({ data: {} } as never);
    await create({ title: 'T' });
    expect(createPlaylist).toHaveBeenCalledWith(TEST_TOKEN, { title: 'T', description: '', privacyStatus: 'private' });
  });

  it('returns 500 with the error body when YouTube fails', async () => {
    quietErrors();
    vi.mocked(createPlaylist).mockRejectedValue(ytError);
    const res = await create({ title: 'T' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual(ytError);
  });
});

describe('PUT /api/playlists/[id]', () => {
  const put = (body: unknown, id = 'pl-1') => PUT(makeRequest(`/api/playlists/${id}`, { method: 'PUT', body }), ctx({ id }));

  it('returns 401 when there is no session', async () => {
    signedOut();
    expect((await put({ title: 'x' })).status).toBe(401);
    expect(updatePlaylist).not.toHaveBeenCalled();
  });

  it.each([undefined, '', '  '])('returns 400 when the title is %j', async (title) => {
    const res = await put({ title });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ errors: [{ message: 'Title is required.' }] });
    expect(updatePlaylist).not.toHaveBeenCalled();
  });

  it('updates the playlist in the URL with a trimmed title', async () => {
    vi.mocked(updatePlaylist).mockResolvedValue({ data: { id: 'pl-9' } } as never);
    const res = await put({ title: ' New ', description: 'd', privacyStatus: 'unlisted' }, 'pl-9');
    expect(updatePlaylist).toHaveBeenCalledWith(TEST_TOKEN, 'pl-9', { title: 'New', description: 'd', privacyStatus: 'unlisted' });
    expect(await res.json()).toEqual({ id: 'pl-9' });
  });

  it('defaults description to empty and privacy to private', async () => {
    vi.mocked(updatePlaylist).mockResolvedValue({ data: {} } as never);
    await put({ title: 'T' });
    expect(updatePlaylist).toHaveBeenCalledWith(TEST_TOKEN, 'pl-1', { title: 'T', description: '', privacyStatus: 'private' });
  });

  it('returns 500 with the error body when YouTube fails', async () => {
    quietErrors();
    vi.mocked(updatePlaylist).mockRejectedValue(ytError);
    const res = await put({ title: 'T' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual(ytError);
  });
});

describe('DELETE /api/playlists/[id]', () => {
  const del = (id = 'pl-1') => DELETE_PLAYLIST(makeRequest(`/api/playlists/${id}`, { method: 'DELETE' }), ctx({ id }));

  it('returns 401 when there is no session', async () => {
    signedOut();
    expect((await del()).status).toBe(401);
    expect(deletePlaylist).not.toHaveBeenCalled();
  });

  it('deletes the playlist in the URL', async () => {
    vi.mocked(deletePlaylist).mockResolvedValue({} as never);
    const res = await del('pl-7');
    expect(deletePlaylist).toHaveBeenCalledWith(TEST_TOKEN, 'pl-7');
    expect(await res.json()).toEqual({ success: true });
  });

  it('returns 500 with the error body when YouTube fails', async () => {
    quietErrors();
    vi.mocked(deletePlaylist).mockRejectedValue(ytError);
    const res = await del();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual(ytError);
  });
});

describe('GET /api/playlists/[id]/items', () => {
  const get = (id = 'pl-1') => GET_ITEMS(makeRequest(`/api/playlists/${id}/items`), ctx({ id }));

  it('returns 401 when there is no session', async () => {
    signedOut();
    expect((await get()).status).toBe(401);
    expect(getPlaylistItems).not.toHaveBeenCalled();
  });

  it('returns the raw items of the playlist in the URL', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue(listResponse([{ id: 'it-1' }]) as never);
    const res = await get('pl-3');
    expect(getPlaylistItems).toHaveBeenCalledWith(TEST_TOKEN, 'pl-3');
    expect(await res.json()).toEqual([{ id: 'it-1' }]);
  });

  it('returns [] when YouTube omits items', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue(listResponse(undefined) as never);
    expect(await (await get()).json()).toEqual([]);
  });

  it('returns 500 with the error body when YouTube fails', async () => {
    quietErrors();
    vi.mocked(getPlaylistItems).mockRejectedValue(ytError);
    const res = await get();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual(ytError);
  });
});

describe('POST /api/playlists/[id]/items', () => {
  const add = (body: unknown, id = 'pl-1') =>
    ADD_ITEM(makeRequest(`/api/playlists/${id}/items`, { method: 'POST', body }), ctx({ id }));

  it('returns 401 when there is no session', async () => {
    signedOut();
    expect((await add({ videoId: 'v' })).status).toBe(401);
    expect(addToPlaylist).not.toHaveBeenCalled();
  });

  it.each([undefined, '', '  '])('returns 400 when videoId is %j', async (videoId) => {
    const res = await add({ videoId });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ errors: [{ message: 'Video ID is required.' }] });
    expect(addToPlaylist).not.toHaveBeenCalled();
  });

  it('adds the trimmed video to the playlist in the URL', async () => {
    vi.mocked(addToPlaylist).mockResolvedValue({ data: { id: 'it-new' } } as never);
    const res = await add({ videoId: ' vid-1 ' }, 'pl-4');
    expect(addToPlaylist).toHaveBeenCalledWith(TEST_TOKEN, 'pl-4', 'vid-1');
    expect(await res.json()).toEqual({ id: 'it-new' });
  });

  it('returns 500 with the error body when YouTube fails', async () => {
    quietErrors();
    vi.mocked(addToPlaylist).mockRejectedValue(ytError);
    const res = await add({ videoId: 'v' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual(ytError);
  });
});

describe('DELETE /api/playlists/[id]/items/[itemId]', () => {
  const del = (id = 'pl-1', itemId = 'it-1') =>
    DELETE_ITEM(makeRequest(`/api/playlists/${id}/items/${itemId}`, { method: 'DELETE' }), ctx({ id, itemId }));

  it('returns 401 when there is no session', async () => {
    signedOut();
    expect((await del()).status).toBe(401);
    expect(removeFromPlaylist).not.toHaveBeenCalled();
  });

  it('removes by playlist item id (not playlist id)', async () => {
    vi.mocked(removeFromPlaylist).mockResolvedValue({} as never);
    const res = await del('pl-1', 'it-42');
    expect(removeFromPlaylist).toHaveBeenCalledWith(TEST_TOKEN, 'it-42');
    expect(await res.json()).toEqual({ success: true });
  });

  it('returns 500 with the error body when YouTube fails', async () => {
    quietErrors();
    vi.mocked(removeFromPlaylist).mockRejectedValue(ytError);
    const res = await del();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual(ytError);
  });
});
