import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST } from '@/app/api/test-support/scenario/route';
import { getYouTubeService } from '@/lib/services/youtube';
import { SCENARIO_NAMES } from '@/lib/services/youtube/fake/scenarios';
import { getFakeStore, resetFakeStore } from '@/lib/services/youtube/fake/store';
import { makeRequest } from '../helpers/request';

const originalMode = process.env.TLC_YOUTUBE_MODE;
const post = (body?: unknown) =>
  POST(makeRequest('/api/test-support/scenario', body === undefined ? { method: 'POST' } : { method: 'POST', body }));

afterEach(() => {
  if (originalMode === undefined) delete process.env.TLC_YOUTUBE_MODE;
  else process.env.TLC_YOUTUBE_MODE = originalMode;
  resetFakeStore();
});

describe('POST /api/test-support/scenario', () => {
  it.each([undefined, '', 'google'])('is a 404 when TLC_YOUTUBE_MODE is %j, and changes nothing', async (mode) => {
    if (mode === undefined) delete process.env.TLC_YOUTUBE_MODE;
    else process.env.TLC_YOUTUBE_MODE = mode;
    const before = getFakeStore();
    const res = await post({ scenario: 'empty' });
    expect(res.status).toBe(404);
    expect(getFakeStore()).toBe(before);
  });

  describe('in fake mode', () => {
    beforeEach(() => {
      process.env.TLC_YOUTUBE_MODE = 'fake';
    });

    it('switches to the requested scenario', async () => {
      const res = await post({ scenario: 'one-live' });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ scenario: 'one-live' });
      const { data } = await getYouTubeService().getStreams('token', 'upcoming');
      expect(data.items).toEqual([]);
    });

    it('resets to the default scenario when no scenario is given, undoing earlier writes', async () => {
      await getYouTubeService().stopStreamById('token', 'live-1');
      const res = await post();
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ scenario: 'mixed' });
      const { data } = await getYouTubeService().getStreams('token', 'active');
      expect(data.items?.map((b) => b.id)).toEqual(['live-1']);
    });

    it('rejects an unknown scenario with the list of valid ones', async () => {
      const before = getFakeStore();
      const res = await post({ scenario: 'nope' });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Unknown scenario "nope"', scenarios: [...SCENARIO_NAMES] });
      expect(getFakeStore()).toBe(before);
    });
  });
});
