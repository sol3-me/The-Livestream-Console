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

const at = (now: Date, offsetMinutes: number) => new Date(now.getTime() + offsetMinutes * 60_000).toISOString();

/** Builds a fresh store from a scenario. Throws if the scenario refers to ids it doesn't define. */
export function createFakeStore(scenario: FakeScenario, now: Date): FakeStore {
  const keyIds = new Set(scenario.streamKeys.map((k) => k.id));

  const liveStreams: youtube_v3.Schema$LiveStream[] = scenario.streamKeys.map((k) => ({
    kind: 'youtube#liveStream',
    id: k.id,
    snippet: { title: k.title, publishedAt: at(now, -60 * 24 * 90) },
    cdn: {
      resolution: k.resolution,
      frameRate: k.frameRate,
      ingestionType: k.ingestionType,
      ingestionInfo: {
        streamName: k.streamName,
        ingestionAddress: k.ingestionAddress,
        backupIngestionAddress: k.backupIngestionAddress,
      },
    },
    status: { streamStatus: 'inactive' },
  }));

  const broadcasts: youtube_v3.Schema$LiveBroadcast[] = scenario.broadcasts.map((b) => {
    if (b.boundStreamId && !keyIds.has(b.boundStreamId)) {
      throw new Error(`Scenario broadcast "${b.id}" is bound to unknown stream key "${b.boundStreamId}"`);
    }
    return {
      kind: 'youtube#liveBroadcast',
      id: b.id,
      snippet: {
        title: b.title,
        description: b.description,
        publishedAt: at(now, b.scheduledStartOffsetMinutes - 60 * 24),
        scheduledStartTime: at(now, b.scheduledStartOffsetMinutes),
        actualStartTime: b.actualStartOffsetMinutes === undefined ? undefined : at(now, b.actualStartOffsetMinutes),
        actualEndTime: b.actualEndOffsetMinutes === undefined ? undefined : at(now, b.actualEndOffsetMinutes),
      },
      status: {
        lifeCycleStatus: b.lifeCycleStatus,
        privacyStatus: b.privacyStatus,
        recordingStatus: b.lifeCycleStatus === 'complete' ? 'recorded' : b.lifeCycleStatus === 'live' ? 'recording' : 'notRecording',
      },
      contentDetails: {
        boundStreamId: b.boundStreamId,
        enableAutoStart: b.enableAutoStart,
        enableAutoStop: b.enableAutoStop,
        ...BROADCAST_DEFAULTS,
        monitorStream: { ...BROADCAST_DEFAULTS.monitorStream },
      },
    };
  });

  const playlists: youtube_v3.Schema$Playlist[] = [];
  const playlistItems: youtube_v3.Schema$PlaylistItem[] = [];
  for (const p of scenario.playlists) {
    playlists.push({
      kind: 'youtube#playlist',
      id: p.id,
      snippet: { title: p.title, description: p.description, publishedAt: at(now, -60 * 24 * 30) },
      status: { privacyStatus: p.privacyStatus },
    });
    p.videoIds.forEach((videoId, position) => {
      const video = scenario.broadcasts.find((b) => b.id === videoId);
      if (!video) {
        throw new Error(`Scenario playlist "${p.id}" references unknown video "${videoId}"`);
      }
      playlistItems.push(newPlaylistItem(`${p.id}-item-${position}`, p.id, position, videoId, video.title, video.description, at(now, -60)));
    });
  }

  return { broadcasts, liveStreams, playlists, playlistItems, nextId: 1 };
}

/** The contentDetails values lib/youtube.ts createStream always sends. */
export const BROADCAST_DEFAULTS = {
  enableDvr: true,
  enableEmbed: true,
  recordFromStart: true,
  enableClosedCaptions: false,
  enableContentEncryption: false,
  startWithSlate: false,
  monitorStream: { enableMonitorStream: true, broadcastStreamDelayMs: 0 },
} as const;

export function newPlaylistItem(
  id: string,
  playlistId: string,
  position: number,
  videoId: string,
  title: string | null | undefined,
  description: string | null | undefined,
  publishedAt: string,
): youtube_v3.Schema$PlaylistItem {
  return {
    kind: 'youtube#playlistItem',
    id,
    snippet: {
      playlistId,
      position,
      title,
      description,
      publishedAt,
      resourceId: { kind: 'youtube#video', videoId },
    },
    contentDetails: { videoId },
  };
}
