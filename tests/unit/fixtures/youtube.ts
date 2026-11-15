/** Minimal YouTube API shapes used across unit tests. */

export function broadcast(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vid-1',
    snippet: {
      title: 'Existing title',
      description: 'Existing description',
      scheduledStartTime: '2026-12-01T18:00:00Z',
    },
    status: { privacyStatus: 'private', lifeCycleStatus: 'ready' },
    contentDetails: {
      boundStreamId: 'key-1',
      enableAutoStart: false,
      enableAutoStop: true,
      enableClosedCaptions: false,
      enableContentEncryption: false,
      enableDvr: true,
      enableEmbed: true,
      recordFromStart: true,
      startWithSlate: false,
      monitorStream: { enableMonitorStream: true, broadcastStreamDelayMs: 0 },
    },
    ...overrides,
  };
}

export function liveStream(overrides: Record<string, unknown> = {}) {
  return {
    id: 'key-1',
    snippet: { title: 'Main key' },
    cdn: {
      resolution: '1080p',
      frameRate: '60fps',
      ingestionType: 'rtmp',
      ingestionInfo: {
        streamName: 'abcd-efgh',
        ingestionAddress: 'rtmp://a.rtmp.youtube.com/live2',
        backupIngestionAddress: 'rtmp://b.rtmp.youtube.com/live2?backup=1',
      },
    },
    ...overrides,
  };
}

export const listResponse = <T>(items: T[] | undefined) => ({ data: { items } });
