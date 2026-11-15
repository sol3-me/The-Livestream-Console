import { vi } from 'vitest';
import type { YouTubeService } from '@/lib/services/youtube';

/**
 * Stand-in for `@/lib/services/youtube` in route tests:
 *
 *   vi.mock('@/lib/services/youtube', () => import('@/tests/unit/helpers/youtube-service'));
 *   import { createStream } from '@/tests/unit/helpers/youtube-service';
 *
 * Each method is a vi.fn() that tests stub and assert on. `getYouTubeService` is a
 * plain function (not a vi.fn) so `mockReset: true` can't wipe what it returns.
 */
export const getStreams = vi.fn();
export const getStreamById = vi.fn();
export const stopStreamById = vi.fn();
export const editStream = vi.fn();
export const deleteStream = vi.fn();
export const createStream = vi.fn();
export const getLiveStreamByBroadcastId = vi.fn();
export const getLiveStreamsByIds = vi.fn();
export const getMyLiveStreams = vi.fn();
export const bindBroadcastToStream = vi.fn();
export const getPlaylists = vi.fn();
export const getPlaylistItems = vi.fn();
export const addToPlaylist = vi.fn();
export const removeFromPlaylist = vi.fn();
export const createPlaylist = vi.fn();
export const updatePlaylist = vi.fn();
export const deletePlaylist = vi.fn();

const service = {
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
} as unknown as YouTubeService;

export function getYouTubeService(): YouTubeService {
  return service;
}
