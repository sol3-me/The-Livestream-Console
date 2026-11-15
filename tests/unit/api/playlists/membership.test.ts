import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/playlists/membership/route';
import { getPlaylistItems, getPlaylists } from '@/lib/playlists';
import { listResponse } from '../../fixtures/youtube';
import { makeRequest } from '../../helpers/request';
import { signedIn, signedOut, TEST_TOKEN } from '../../helpers/session';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }));
vi.mock('@/lib/playlists', () => ({ getPlaylists: vi.fn(), getPlaylistItems: vi.fn() }));

const get = (query = '?videoId=vid-1') => GET(makeRequest(`/api/playlists/membership${query}`));
const item = (videoId: string) => ({ snippet: { resourceId: { videoId } } });

describe('GET /api/playlists/membership', () => {
  beforeEach(() => {
    signedIn();
    vi.mocked(getPlaylists).mockResolvedValue(listResponse([{ id: 'pl-a' }, { id: 'pl-b' }, { id: 'pl-c' }]) as never);
    vi.mocked(getPlaylistItems).mockImplementation(async (_t, playlistId) => {
      const byPlaylist: Record<string, unknown[]> = {
        'pl-a': [item('vid-1'), item('vid-2')],
        'pl-b': [item('vid-3')],
        'pl-c': [item('vid-1')],
      };
      return listResponse(byPlaylist[playlistId]) as never;
    });
  });

  it('returns 401 when there is no session', async () => {
    signedOut();
    expect((await get()).status).toBe(401);
    expect(getPlaylists).not.toHaveBeenCalled();
  });

  it('returns 400 when videoId is missing', async () => {
    const res = await get('');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'videoId is required' });
  });

  it('returns the ids of every playlist containing the video', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(['pl-a', 'pl-c']);
    expect(getPlaylists).toHaveBeenCalledWith(TEST_TOKEN);
    expect(getPlaylistItems).toHaveBeenCalledTimes(3);
    expect(getPlaylistItems).toHaveBeenCalledWith(TEST_TOKEN, 'pl-a');
  });

  it('ignores playlists whose item lookup fails', async () => {
    vi.mocked(getPlaylistItems).mockImplementation(async (_t, playlistId) => {
      if (playlistId === 'pl-a') throw new Error('boom');
      return listResponse([item('vid-1')]) as never;
    });
    expect(await (await get()).json()).toEqual(['pl-b', 'pl-c']);
  });

  it('returns [] when the user has no playlists', async () => {
    vi.mocked(getPlaylists).mockResolvedValue(listResponse(undefined) as never);
    expect(await (await get()).json()).toEqual([]);
  });

  it('swallows a playlist list failure and returns [] with 200', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getPlaylists).mockRejectedValue(new Error('down'));
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
