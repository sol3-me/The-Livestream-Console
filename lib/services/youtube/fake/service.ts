import type { youtube_v3 } from 'googleapis';
import type { StreamKeyInfo } from '@/lib/types';
import type { YouTubeService } from '../types';
import { YouTubeApiError } from './errors';
import { BROADCAST_DEFAULTS, newPlaylistItem, type FakeStore } from './scenario';

type Broadcast = youtube_v3.Schema$LiveBroadcast;

// Undocumented by YouTube (assumption): which lifeCycleStatus values each list filter returns.
const UPCOMING = ['created', 'ready'];
const ACTIVE = ['live', 'liveStarting', 'testing', 'testStarting'];
const COMPLETED = ['complete'];
const BY_FILTER: Record<string, string[]> = { upcoming: UPCOMING, active: ACTIVE, completed: COMPLETED };

const PRIVACY = ['private', 'public', 'unlisted'];

// contentDetails fields YouTube only lets you change while a broadcast is created/ready.
const SETUP_ONLY = ['enableAutoStart', 'enableDvr', 'recordFromStart', 'enableClosedCaptions'] as const;

/** Wraps data the way googleapis resolves: callers only read `.data`. */
const respond = <T>(data: T) => ({ data, status: 200, statusText: 'OK', headers: {}, config: {} }) as never;
const clone = <T>(value: T): T => structuredClone(value);
const time = (iso?: string | null) => (iso ? Date.parse(iso) : 0);

const broadcastError = (code: number, reason: string, message: string) =>
  new YouTubeApiError(code, 'youtube.liveBroadcast', reason, message);
const broadcastNotFound = () =>
  broadcastError(404, 'liveBroadcastNotFound', 'Broadcast not found');
const playlistNotFound = () =>
  new YouTubeApiError(404, 'youtube.playlist', 'playlistNotFound', 'The playlist identified with the request cannot be found.');

/**
 * A strict, in-memory stand-in for the YouTube Data API, used with TLC_YOUTUBE_MODE=fake.
 * It enforces the documented rules (and conservative assumptions where the docs are
 * silent) so end-to-end tests fail where real YouTube would reject a request.
 * The access token is ignored. Methods never use `this`, because callers destructure them.
 */
export function createFakeYouTubeService(getStore: () => FakeStore, now: () => Date = () => new Date()): YouTubeService {
  const findBroadcast = (id: string) => getStore().broadcasts.find((b) => b.id === id);
  const requireBroadcast = (id: string) => {
    const b = findBroadcast(id);
    if (!b) throw broadcastNotFound();
    return b;
  };
  const requirePlaylist = (id: string) => {
    const p = getStore().playlists.find((x) => x.id === id);
    if (!p) throw playlistNotFound();
    return p;
  };
  const nextId = (prefix: string) => `${prefix}-${getStore().nextId++}`;
  const isFuture = (iso: string) => !Number.isNaN(Date.parse(iso)) && Date.parse(iso) > now().getTime();

  function validateTitleAndPrivacy(title: string | null | undefined, privacy: string | null | undefined) {
    if (title != null && (title.trim().length === 0 || title.length > 100)) {
      throw broadcastError(400, 'invalidTitle', 'The title must be between 1 and 100 characters.');
    }
    if (privacy != null && !PRIVACY.includes(privacy)) {
      throw broadcastError(400, 'invalidPrivacyStatus', 'Invalid privacy status.');
    }
  }

  const service: YouTubeService = {
    async getStreams(_token, status = 'upcoming', limit = 10) {
      const states = BY_FILTER[status] ?? [];
      const items = getStore()
        .broadcasts.filter((b) => states.includes(b.status?.lifeCycleStatus ?? ''))
        .sort((a, b) =>
          status === 'completed'
            ? time(b.snippet?.actualEndTime) - time(a.snippet?.actualEndTime)
            : time(a.snippet?.scheduledStartTime) - time(b.snippet?.scheduledStartTime),
        )
        .slice(0, limit);
      return respond({ kind: 'youtube#liveBroadcastListResponse', items: clone(items) });
    },

    async getStreamById(_token, streamId) {
      const b = findBroadcast(streamId);
      return respond({ kind: 'youtube#liveBroadcastListResponse', items: b ? [clone(b)] : [] });
    },

    async createStream(_token, data) {
      if (!data.title?.trim()) throw broadcastError(400, 'titleRequired', 'The title is required.');
      if (!data.scheduledStartTime) throw broadcastError(400, 'scheduledStartTimeRequired', 'The scheduled start time is required.');
      if (!data.privacyStatus) throw broadcastError(400, 'privacyStatusRequired', 'The privacy status is required.');
      validateTitleAndPrivacy(data.title, data.privacyStatus);
      if (!isFuture(data.scheduledStartTime)) {
        throw broadcastError(400, 'invalidScheduledStartTime', 'The scheduled start time must be in the future.');
      }
      const broadcast: Broadcast = {
        kind: 'youtube#liveBroadcast',
        id: nextId('fake-broadcast'),
        snippet: {
          title: data.title,
          description: data.description,
          scheduledStartTime: data.scheduledStartTime,
          publishedAt: now().toISOString(),
        },
        // Undocumented (assumption): a new, unbound broadcast starts as "created".
        status: { lifeCycleStatus: 'created', privacyStatus: data.privacyStatus, recordingStatus: 'notRecording' },
        contentDetails: {
          enableAutoStart: data.enableAutoStart,
          enableAutoStop: data.enableAutoStop,
          ...BROADCAST_DEFAULTS,
          monitorStream: { ...BROADCAST_DEFAULTS.monitorStream },
        },
      };
      getStore().broadcasts.push(broadcast);
      return respond(clone(broadcast));
    },

    async editStream(_token, streamData) {
      const body = (streamData ?? {}) as Broadcast;
      if (!body.id) throw broadcastError(400, 'idRequired', 'The broadcast id is required.');
      const existing = requireBroadcast(body.id);
      if (!body.snippet?.scheduledStartTime) {
        throw broadcastError(400, 'scheduledStartTimeRequired', 'The scheduled start time is required.');
      }
      const monitor = body.contentDetails?.monitorStream;
      if (monitor?.enableMonitorStream == null) {
        throw broadcastError(400, 'enableMonitorStreamRequired', 'monitorStream.enableMonitorStream is required.');
      }
      if (monitor.broadcastStreamDelayMs == null) {
        throw broadcastError(400, 'broadcastStreamDelayMsRequired', 'monitorStream.broadcastStreamDelayMs is required.');
      }
      validateTitleAndPrivacy(body.snippet.title, body.status?.privacyStatus);

      const lifeCycle = existing.status?.lifeCycleStatus ?? '';
      const inSetup = UPCOMING.includes(lifeCycle);
      if (!inSetup) {
        const before = existing.contentDetails ?? {};
        const after = body.contentDetails ?? {};
        for (const field of SETUP_ONLY) {
          if (after[field] !== undefined && after[field] !== before[field]) {
            throw broadcastError(403, `${field}ModificationNotAllowed`, `${field} can only be changed before the broadcast starts.`);
          }
        }
        if (monitor.enableMonitorStream !== before.monitorStream?.enableMonitorStream) {
          throw broadcastError(403, 'enableMonitorStreamModificationNotAllowed', 'enableMonitorStream can only be changed before the broadcast starts.');
        }
      }
      const startChanged = body.snippet.scheduledStartTime !== existing.snippet?.scheduledStartTime;
      if (inSetup && startChanged && !isFuture(body.snippet.scheduledStartTime)) {
        throw broadcastError(400, 'invalidScheduledStartTime', 'The scheduled start time must be in the future.');
      }

      // YouTube's update replaces the resource: fields the request leaves out are deleted
      // (privacy reverts to the default). Read-only fields are kept.
      const updated: Broadcast = {
        kind: 'youtube#liveBroadcast',
        id: existing.id,
        snippet: {
          title: body.snippet.title ?? undefined,
          description: body.snippet.description ?? undefined,
          scheduledStartTime: body.snippet.scheduledStartTime,
          publishedAt: existing.snippet?.publishedAt,
          actualStartTime: existing.snippet?.actualStartTime,
          actualEndTime: existing.snippet?.actualEndTime,
        },
        status: {
          lifeCycleStatus: existing.status?.lifeCycleStatus,
          recordingStatus: existing.status?.recordingStatus,
          privacyStatus: body.status?.privacyStatus ?? 'private',
        },
        contentDetails: { ...clone(body.contentDetails), boundStreamId: existing.contentDetails?.boundStreamId },
      };
      const store = getStore();
      store.broadcasts[store.broadcasts.indexOf(existing)] = updated;
      return respond(clone(updated));
    },

    async stopStreamById(_token, id) {
      const b = requireBroadcast(id);
      const lifeCycle = b.status?.lifeCycleStatus ?? '';
      if (lifeCycle === 'complete') {
        throw broadcastError(403, 'redundantTransition', 'The broadcast is already complete.');
      }
      // Undocumented (assumption): only a broadcast that is on air can be completed.
      if (!ACTIVE.includes(lifeCycle)) {
        throw broadcastError(403, 'invalidTransition', `The broadcast cannot transition from ${lifeCycle} to complete.`);
      }
      b.status = { ...b.status, lifeCycleStatus: 'complete', recordingStatus: 'recorded' };
      b.snippet = { ...b.snippet, actualEndTime: now().toISOString() };
      return respond(clone(b));
    },

    async deleteStream(_token, streamId) {
      const b = requireBroadcast(streamId);
      // Undocumented (assumption): a broadcast that is on air can't be deleted.
      if (ACTIVE.includes(b.status?.lifeCycleStatus ?? '')) {
        throw broadcastError(403, 'liveBroadcastDeletionNotAllowed', 'The broadcast cannot be deleted while it is live.');
      }
      const store = getStore();
      store.broadcasts = store.broadcasts.filter((x) => x !== b);
      store.playlistItems = store.playlistItems.filter((i) => i.snippet?.resourceId?.videoId !== streamId);
      return respond('');
    },

    async bindBroadcastToStream(_token, broadcastId, streamId) {
      const b = requireBroadcast(broadcastId);
      if (!getStore().liveStreams.some((s) => s.id === streamId)) {
        throw new YouTubeApiError(404, 'youtube.liveStream', 'liveStreamNotFound', 'Stream not found');
      }
      // Undocumented (assumption): a completed broadcast can't be rebound.
      if (b.status?.lifeCycleStatus === 'complete') {
        throw broadcastError(403, 'liveBroadcastBindingNotAllowed', 'The broadcast can no longer be bound to a stream.');
      }
      b.contentDetails = { ...b.contentDetails, boundStreamId: streamId };
      // Undocumented (assumption): binding completes the setup, so created becomes ready.
      if (b.status?.lifeCycleStatus === 'created') b.status = { ...b.status, lifeCycleStatus: 'ready' };
      return respond(clone(b));
    },

    async getLiveStreamByBroadcastId(_token, broadcastId): Promise<StreamKeyInfo | null> {
      const boundStreamId = findBroadcast(broadcastId)?.contentDetails?.boundStreamId;
      if (!boundStreamId) return null;
      const stream = getStore().liveStreams.find((s) => s.id === boundStreamId);
      if (!stream) return null;
      const cdn = stream.cdn;
      const ingestion = cdn?.ingestionInfo;
      return {
        streamId: boundStreamId,
        streamTitle: stream.snippet?.title ?? '',
        streamKey: ingestion?.streamName ?? '',
        ingestionAddress: ingestion?.ingestionAddress ?? '',
        backupIngestionAddress: ingestion?.backupIngestionAddress ?? undefined,
        resolution: cdn?.resolution ?? undefined,
        frameRate: cdn?.frameRate ?? undefined,
        ingestionType: cdn?.ingestionType ?? undefined,
      };
    },

    async getLiveStreamsByIds(_token, streamIds) {
      if (streamIds.length === 0) return [];
      return clone(getStore().liveStreams.filter((s) => streamIds.includes(s.id ?? '')).slice(0, 50));
    },

    async getMyLiveStreams() {
      return clone(getStore().liveStreams.slice(0, 50));
    },

    async getPlaylists() {
      const store = getStore();
      const items = store.playlists.slice(0, 50).map((p) => ({
        ...clone(p),
        contentDetails: { itemCount: store.playlistItems.filter((i) => i.snippet?.playlistId === p.id).length },
      }));
      return respond({ kind: 'youtube#playlistListResponse', items });
    },

    async getPlaylistItems(_token, playlistId) {
      requirePlaylist(playlistId);
      const items = getStore()
        .playlistItems.filter((i) => i.snippet?.playlistId === playlistId)
        .sort((a, b) => (a.snippet?.position ?? 0) - (b.snippet?.position ?? 0))
        .slice(0, 50);
      return respond({ kind: 'youtube#playlistItemListResponse', items: clone(items) });
    },

    async addToPlaylist(_token, playlistId, videoId) {
      requirePlaylist(playlistId);
      const video = findBroadcast(videoId);
      if (!video) {
        throw new YouTubeApiError(404, 'youtube.playlistItem', 'videoNotFound', 'The video that you are trying to add to the playlist cannot be found.');
      }
      const store = getStore();
      const position = store.playlistItems.filter((i) => i.snippet?.playlistId === playlistId).length;
      const item = newPlaylistItem(
        nextId('fake-item'),
        playlistId,
        position,
        videoId,
        video.snippet?.title,
        video.snippet?.description,
        now().toISOString(),
      );
      store.playlistItems.push(item);
      return respond(clone(item));
    },

    async removeFromPlaylist(_token, playlistItemId) {
      const store = getStore();
      const item = store.playlistItems.find((i) => i.id === playlistItemId);
      if (!item) {
        throw new YouTubeApiError(404, 'youtube.playlistItem', 'playlistItemNotFound', 'The playlist item cannot be found.');
      }
      const playlistId = item.snippet?.playlistId;
      store.playlistItems = store.playlistItems.filter((i) => i !== item);
      store.playlistItems
        .filter((i) => i.snippet?.playlistId === playlistId)
        .sort((a, b) => (a.snippet?.position ?? 0) - (b.snippet?.position ?? 0))
        .forEach((i, position) => {
          i.snippet = { ...i.snippet, position };
        });
      return respond('');
    },

    async createPlaylist(_token, data) {
      if (!data.title?.trim()) {
        throw new YouTubeApiError(400, 'youtube.playlist', 'playlistTitleRequired', 'The request must specify a playlist title.');
      }
      const playlist: youtube_v3.Schema$Playlist = {
        kind: 'youtube#playlist',
        id: nextId('fake-playlist'),
        snippet: { title: data.title, description: data.description, publishedAt: now().toISOString() },
        status: { privacyStatus: data.privacyStatus },
      };
      getStore().playlists.push(playlist);
      return respond(clone(playlist));
    },

    async updatePlaylist(_token, playlistId, data) {
      const playlist = requirePlaylist(playlistId);
      if (!data.title?.trim()) {
        throw new YouTubeApiError(400, 'youtube.playlist', 'playlistTitleRequired', 'The request must specify a playlist title.');
      }
      playlist.snippet = { title: data.title, description: data.description, publishedAt: playlist.snippet?.publishedAt };
      playlist.status = { privacyStatus: data.privacyStatus };
      return respond(clone(playlist));
    },

    async deletePlaylist(_token, playlistId) {
      const playlist = requirePlaylist(playlistId);
      const store = getStore();
      store.playlists = store.playlists.filter((p) => p !== playlist);
      store.playlistItems = store.playlistItems.filter((i) => i.snippet?.playlistId !== playlistId);
      return respond('');
    },
  };

  // A failing scenario (api-error) rejects every call before it touches the store.
  const guarded = Object.entries(service).map(([name, method]) => [
    name,
    async (...args: unknown[]) => {
      const failure = getStore().failWith;
      if (failure) throw new YouTubeApiError(failure.code, failure.domain, failure.reason, failure.message);
      return (method as (...a: unknown[]) => unknown)(...args);
    },
  ]);
  return Object.fromEntries(guarded) as YouTubeService;
}
