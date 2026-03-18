import { google, youtube_v3 } from 'googleapis';
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
