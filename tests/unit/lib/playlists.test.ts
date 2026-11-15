import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistItems,
  getPlaylists,
  removeFromPlaylist,
  updatePlaylist,
} from '@/lib/playlists';

const g = vi.hoisted(() => ({}) as ReturnType<typeof import('./googleapis-mock').createGoogleapisMock>);
vi.mock('googleapis', async () => {
  const { createGoogleapisMock } = await import('./googleapis-mock');
  Object.assign(g, createGoogleapisMock());
  return g.module;
});

const TOKEN = 'tok';

beforeEach(() => {
  g.youtubeFactory.mockImplementation(() => g.yt);
});

describe('lib/playlists', () => {
  it('uses the caller\'s access token', async () => {
    await getPlaylists(TOKEN);
    expect(g.oauth.setCredentials).toHaveBeenCalledWith({ access_token: TOKEN });
  });

  // Characterises bug B4: no pagination beyond the first 50.
  it('getPlaylists lists the user\'s playlists, first page of 50 only (bug B4)', async () => {
    g.yt.playlists.list.mockResolvedValue('res');
    expect(await getPlaylists(TOKEN)).toBe('res');
    expect(g.yt.playlists.list).toHaveBeenCalledWith({ part: ['snippet', 'contentDetails', 'status'], mine: true, maxResults: 50 });
  });

  it('getPlaylistItems lists one playlist, first page of 50 only (bug B4)', async () => {
    await getPlaylistItems(TOKEN, 'pl-1');
    expect(g.yt.playlistItems.list).toHaveBeenCalledWith({ part: ['snippet', 'contentDetails'], playlistId: 'pl-1', maxResults: 50 });
  });

  it('addToPlaylist inserts a youtube#video resource', async () => {
    await addToPlaylist(TOKEN, 'pl-1', 'vid-1');
    expect(g.yt.playlistItems.insert).toHaveBeenCalledWith({
      part: ['snippet'],
      requestBody: { snippet: { playlistId: 'pl-1', resourceId: { kind: 'youtube#video', videoId: 'vid-1' } } },
    });
  });

  it('removeFromPlaylist deletes by playlist item id', async () => {
    await removeFromPlaylist(TOKEN, 'it-1');
    expect(g.yt.playlistItems.delete).toHaveBeenCalledWith({ id: 'it-1' });
  });

  it('createPlaylist inserts snippet and status', async () => {
    await createPlaylist(TOKEN, { title: 'T', description: 'D', privacyStatus: 'public' });
    expect(g.yt.playlists.insert).toHaveBeenCalledWith({
      part: ['snippet', 'status'],
      requestBody: { snippet: { title: 'T', description: 'D' }, status: { privacyStatus: 'public' } },
    });
  });

  it('updatePlaylist updates snippet and status by id', async () => {
    await updatePlaylist(TOKEN, 'pl-1', { title: 'T', description: 'D', privacyStatus: 'unlisted' });
    expect(g.yt.playlists.update).toHaveBeenCalledWith({
      part: ['snippet', 'status'],
      requestBody: { id: 'pl-1', snippet: { title: 'T', description: 'D' }, status: { privacyStatus: 'unlisted' } },
    });
  });

  it('deletePlaylist deletes by id', async () => {
    await deletePlaylist(TOKEN, 'pl-1');
    expect(g.yt.playlists.delete).toHaveBeenCalledWith({ id: 'pl-1' });
  });
});
