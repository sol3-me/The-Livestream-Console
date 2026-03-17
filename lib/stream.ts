export interface StreamRequest {
  id: string;
  title?: string;
  description?: string;
  startTime?: string;
  privacyStatus?: string;
  autoStart?: string | boolean;
  autoStop?: string | boolean;
}

export interface YouTubeStreamData {
  snippet: {
    title: string;
    description: string;
    scheduledStartTime: string;
  };
  status: {
    privacyStatus: string;
  };
  contentDetails: {
    enableAutoStart: boolean;
    enableAutoStop: boolean;
    enableClosedCaptions: boolean;
    enableContentEncryption: boolean;
    enableDvr: boolean;
    enableEmbed: boolean;
    recordFromStart: boolean;
    startWithSlate: boolean;
    monitorStream: {
      enableMonitorStream: boolean;
      broadcastStreamDelayMs: number;
    };
  };
}

export class Stream {
  id: string;
  snippet: { title: string; description: string; scheduledStartTime: string };
  status: { privacyStatus: string };
  contentDetails: {
    enableAutoStart: boolean;
    enableAutoStop: boolean;
    enableClosedCaptions: boolean;
    enableContentEncryption: boolean;
    enableDvr: boolean;
    enableEmbed: boolean;
    recordFromStart: boolean;
    startWithSlate: boolean;
    monitorStream: { enableMonitorStream: boolean; broadcastStreamDelayMs: number };
  };

  constructor(request: StreamRequest, ytStream: YouTubeStreamData) {
    this.id = request.id;
    this.snippet = {
      title: request.title ?? ytStream.snippet.title,
      description: request.description ?? ytStream.snippet.description,
      scheduledStartTime: request.startTime ?? ytStream.snippet.scheduledStartTime,
    };
    this.status = {
      privacyStatus: request.privacyStatus ?? ytStream.status.privacyStatus,
    };
    this.contentDetails = {
      // User-editable toggles
      enableAutoStart:
        request.autoStart === 'true' ||
        request.autoStart === true ||
        (request.autoStart === undefined && ytStream.contentDetails.enableAutoStart),
      enableAutoStop:
        request.autoStop === 'true' ||
        request.autoStop === true ||
        (request.autoStop === undefined && ytStream.contentDetails.enableAutoStop),
      // Passthrough-only fields
      enableClosedCaptions: ytStream.contentDetails.enableClosedCaptions,
      enableContentEncryption: ytStream.contentDetails.enableContentEncryption,
      enableDvr: ytStream.contentDetails.enableDvr,
      enableEmbed: ytStream.contentDetails.enableEmbed,
      recordFromStart: ytStream.contentDetails.recordFromStart,
      startWithSlate: ytStream.contentDetails.startWithSlate,
      monitorStream: {
        enableMonitorStream: ytStream.contentDetails.monitorStream.enableMonitorStream,
        broadcastStreamDelayMs: ytStream.contentDetails.monitorStream.broadcastStreamDelayMs,
      },
    };
  }
}
