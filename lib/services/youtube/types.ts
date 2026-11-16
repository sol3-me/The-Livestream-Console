import type * as playlists from '@/lib/playlists';
import type * as streams from '@/lib/youtube';

export type YouTubeMode = 'google' | 'fake';

/**
 * Everything the app needs from YouTube. Routes and server pages get an
 * implementation from `getYouTubeService()`, not by importing googleapis
 * wrappers directly, so tests (and the Phase 1D fake) can swap it out.
 *
 * Signatures mirror the existing `lib/youtube.ts` / `lib/playlists.ts`
 * functions, access token first.
 *
 * Implementations must not rely on `this`: callers destructure methods,
 * e.g. `const { createStream } = getYouTubeService();`.
 */
export interface YouTubeService {
  // Broadcasts and stream keys
  getStreams: typeof streams.getStreams;
  getStreamById: typeof streams.getStreamById;
  stopStreamById: typeof streams.stopStreamById;
  editStream: typeof streams.editStream;
  deleteStream: typeof streams.deleteStream;
  createStream: typeof streams.createStream;
  getLiveStreamByBroadcastId: typeof streams.getLiveStreamByBroadcastId;
  getLiveStreamsByIds: typeof streams.getLiveStreamsByIds;
  getMyLiveStreams: typeof streams.getMyLiveStreams;
  bindBroadcastToStream: typeof streams.bindBroadcastToStream;

  // Playlists
  getPlaylists: typeof playlists.getPlaylists;
  getPlaylistItems: typeof playlists.getPlaylistItems;
  addToPlaylist: typeof playlists.addToPlaylist;
  removeFromPlaylist: typeof playlists.removeFromPlaylist;
  createPlaylist: typeof playlists.createPlaylist;
  updatePlaylist: typeof playlists.updatePlaylist;
  deletePlaylist: typeof playlists.deletePlaylist;
}
