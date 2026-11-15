import {
  addToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistItems,
  getPlaylists,
  removeFromPlaylist,
  updatePlaylist,
} from '@/lib/playlists';
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
import type { YouTubeService } from './types';

/** The real YouTube Data API, via the existing googleapis wrappers. */
export const googleYouTubeService: YouTubeService = {
  getStreams,
  getStreamById,
  stopStreamById,
  editStream,
  deleteStream,
  createStream,
  getLiveStreamByBroadcastId,
  getLiveStreamsByIds,
  getMyLiveStreams,
  bindBroadcastToStream,
  getPlaylists,
  getPlaylistItems,
  addToPlaylist,
  removeFromPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
};
