import { google, youtube_v3 } from 'googleapis';
import type { StreamKeyInfo } from './types';
import type { StreamStatus } from './constants';
import { streamStatus as STATUS } from './constants';

const PART = ['snippet', 'contentDetails', 'status'];

function getYoutubeClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ access_token: accessToken });
  return google.youtube({ version: 'v3', auth });
}

export async function getStreams(
  accessToken: string,
  status: StreamStatus = STATUS.UPCOMING,
  limit = 10,
) {
  const youtube = getYoutubeClient(accessToken);
  return youtube.liveBroadcasts.list({
    part: PART,
    broadcastStatus: status,
    maxResults: limit,
  });
}

export async function getStreamById(accessToken: string, streamId: string) {
  const youtube = getYoutubeClient(accessToken);
  return youtube.liveBroadcasts.list({
    part: PART,
    id: [streamId],
  });
}

export async function stopStreamById(accessToken: string, id: string) {
  const youtube = getYoutubeClient(accessToken);
  return youtube.liveBroadcasts.transition({
    broadcastStatus: 'complete',
    id,
    part: PART,
  });
}

export async function editStream(accessToken: string, streamData: unknown) {
  const youtube = getYoutubeClient(accessToken);
  return youtube.liveBroadcasts.update({
    part: PART,
    requestBody: streamData as youtube_v3.Schema$LiveBroadcast,
  });
}

export async function deleteStream(accessToken: string, streamId: string) {
  const youtube = getYoutubeClient(accessToken);
  return youtube.liveBroadcasts.delete({ id: streamId });
}

export interface CreateStreamData {
  title: string;
  description: string;
  scheduledStartTime: string;
  privacyStatus: string;
  enableAutoStart: boolean;
  enableAutoStop: boolean;
}

export async function createStream(accessToken: string, data: CreateStreamData) {
  const youtube = getYoutubeClient(accessToken);
  return youtube.liveBroadcasts.insert({
    part: PART,
    requestBody: {
      snippet: {
        title: data.title,
        description: data.description,
        scheduledStartTime: data.scheduledStartTime,
      },
      status: {
        privacyStatus: data.privacyStatus,
      },
      contentDetails: {
        enableAutoStart: data.enableAutoStart,
        enableAutoStop: data.enableAutoStop,
        enableDvr: true,
        enableEmbed: true,
        recordFromStart: true,
        enableClosedCaptions: false,
        enableContentEncryption: false,
        startWithSlate: false,
        monitorStream: {
          enableMonitorStream: true,
          broadcastStreamDelayMs: 0,
        },
      },
    },
  });
}

export async function getLiveStreamByBroadcastId(
  accessToken: string,
  broadcastId: string,
): Promise<StreamKeyInfo | null> {
  const youtube = getYoutubeClient(accessToken);

  const broadcastRes = await youtube.liveBroadcasts.list({
    part: ['contentDetails'],
    id: [broadcastId],
  });
  const boundStreamId = broadcastRes.data.items?.[0]?.contentDetails?.boundStreamId;
  if (!boundStreamId) return null;

  const streamRes = await youtube.liveStreams.list({
    part: ['snippet', 'cdn'],
    id: [boundStreamId],
  });
  const liveStream = streamRes.data.items?.[0];
  if (!liveStream) return null;

  const cdn = liveStream.cdn;
  const ingestionInfo = cdn?.ingestionInfo;

  return {
    streamId: boundStreamId,
    streamTitle: liveStream.snippet?.title ?? '',
    streamKey: ingestionInfo?.streamName ?? '',
    ingestionAddress: ingestionInfo?.ingestionAddress ?? '',
    backupIngestionAddress: ingestionInfo?.backupIngestionAddress ?? undefined,
    resolution: cdn?.resolution ?? undefined,
    frameRate: cdn?.frameRate ?? undefined,
    ingestionType: cdn?.ingestionType ?? undefined,
  };
}

/** Fetch multiple liveStreams by their IDs in a single API call. */
export async function getLiveStreamsByIds(accessToken: string, streamIds: string[]) {
  if (streamIds.length === 0) return [];
  const youtube = getYoutubeClient(accessToken);
  const res = await youtube.liveStreams.list({
    part: ['snippet', 'cdn'],
    id: streamIds,
    maxResults: 50,
  });
  return res.data.items ?? [];
}

/** List all stream keys belonging to the authenticated user. */
export async function getMyLiveStreams(accessToken: string) {
  const youtube = getYoutubeClient(accessToken);
  const res = await youtube.liveStreams.list({
    part: ['snippet', 'cdn'],
    mine: true,
    maxResults: 50,
  });
  return res.data.items ?? [];
}

/** Bind a broadcast to a specific stream key. */
export async function bindBroadcastToStream(
  accessToken: string,
  broadcastId: string,
  streamId: string,
) {
  const youtube = getYoutubeClient(accessToken);
  return youtube.liveBroadcasts.bind({
    id: broadcastId,
    streamId,
    part: ['id', 'contentDetails'],
  });
}
