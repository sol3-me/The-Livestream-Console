export interface StreamThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface FormattedStream {
  id: string;
  title: string;
  description: string;
  startTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  thumbnail?: StreamThumbnail;
  enableAutoStart: boolean;
  enableAutoStop: boolean;
  status: string;
  isLive: boolean;
  isComplete: boolean;
  privacyStatus: string;
  videoLink: string;
  controlRoomLink: string;
}

export interface StreamsData {
  active: FormattedStream[];
  upcoming: FormattedStream[];
  completed: FormattedStream[];
  last: FormattedStream[];
}

export interface StreamsPageError {
  errorMessage: string;
  helpLink?: string;
  code?: number;
}

export interface FormattedPlaylist {
  id: string;
  title: string;
  description: string;
  thumbnail?: StreamThumbnail;
  itemCount: number;
  privacyStatus: string;
  publishedAt: string;
}

export interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail?: StreamThumbnail;
  position: number;
  publishedAt: string;
}
