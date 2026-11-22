import { createFakeYouTubeService } from './fake/service';
import { getFakeStore } from './fake/store';
import { googleYouTubeService } from './google';
import type { YouTubeService } from './types';

export type { YouTubeMode, YouTubeService } from './types';

/**
 * Returns the YouTube implementation selected by TLC_YOUTUBE_MODE.
 * Call it inside a handler (not at module level) so the mode is read per request.
 */
export function getYouTubeService(): YouTubeService {
  const mode = process.env.TLC_YOUTUBE_MODE ?? '';
  if (mode === '' || mode === 'google') {
    return googleYouTubeService;
  }
  if (mode === 'fake') {
    return createFakeYouTubeService(getFakeStore);
  }
  throw new Error(`Invalid TLC_YOUTUBE_MODE "${mode}". Use "google" (default) or "fake".`);
}
