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
    throw new Error('TLC_YOUTUBE_MODE=fake is not available yet (Phase 1D).');
  }
  throw new Error(`Invalid TLC_YOUTUBE_MODE "${mode}". Use "google" (default) or "fake".`);
}
