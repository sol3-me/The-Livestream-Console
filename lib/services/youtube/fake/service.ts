import type { YouTubeService } from '../types';
import type { FakeStore } from './scenario';

const list = { data: { items: [] } } as never;
const item = { data: {} } as never;

export function createFakeYouTubeService(_getStore: () => FakeStore, _now: () => Date = () => new Date()): YouTubeService {
  return {
    getStreams: async () => list,
    getStreamById: async () => list,
    stopStreamById: async () => item,
    editStream: async () => item,
    deleteStream: async () => item,
    createStream: async () => item,
    getLiveStreamByBroadcastId: async () => null,
    getLiveStreamsByIds: async () => [],
    getMyLiveStreams: async () => [],
    bindBroadcastToStream: async () => item,
    getPlaylists: async () => list,
    getPlaylistItems: async () => list,
    addToPlaylist: async () => item,
    removeFromPlaylist: async () => item,
    createPlaylist: async () => item,
    updatePlaylist: async () => item,
    deletePlaylist: async () => item,
  };
}
