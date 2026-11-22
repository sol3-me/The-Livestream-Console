import type { youtube_v3 } from 'googleapis';

/** A scenario as written in `scenarios/*.json`. Times are minutes relative to load time. */
export interface FakeScenario {
  description?: string;
  streamKeys: {
    id: string;
    title: string;
    streamName: string;
    ingestionAddress: string;
    backupIngestionAddress?: string;
    resolution?: string;
    frameRate?: string;
    ingestionType?: string;
  }[];
  broadcasts: {
    id: string;
    title: string;
    description: string;
    lifeCycleStatus: string;
    privacyStatus: string;
    scheduledStartOffsetMinutes: number;
    actualStartOffsetMinutes?: number;
    actualEndOffsetMinutes?: number;
    enableAutoStart: boolean;
    enableAutoStop: boolean;
    boundStreamId?: string;
  }[];
  playlists: {
    id: string;
    title: string;
    description: string;
    privacyStatus: string;
    videoIds: string[];
  }[];
}

/** In-memory YouTube state, in the API's own resource shapes. */
export interface FakeStore {
  broadcasts: youtube_v3.Schema$LiveBroadcast[];
  liveStreams: youtube_v3.Schema$LiveStream[];
  playlists: youtube_v3.Schema$Playlist[];
  playlistItems: youtube_v3.Schema$PlaylistItem[];
  nextId: number;
}

export function createFakeStore(_scenario: FakeScenario, _now: Date): FakeStore {
  return { broadcasts: [], liveStreams: [], playlists: [], playlistItems: [], nextId: 1 };
}
