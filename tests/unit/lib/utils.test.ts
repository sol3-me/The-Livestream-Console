import { describe, expect, it } from 'vitest';
import {
  formatPlaylistItems,
  formatPlaylists,
  formatStreams,
  parallelAsync,
  toDatetimeLocalValue,
  toLocalDatetime,
} from '@/lib/utils';
import { broadcast, listResponse } from '../fixtures/youtube';

describe('parallelAsync', () => {
  it('resolves every keyed promise and keeps the keys', async () => {
    const out = await parallelAsync({ a: Promise.resolve(1), b: Promise.resolve('two') });
    expect(out).toEqual({ a: 1, b: 'two' });
  });

  it('rejects if any promise rejects', async () => {
    await expect(parallelAsync({ a: Promise.resolve(1), b: Promise.reject(new Error('x')) })).rejects.toThrow('x');
  });
});

describe('formatStreams', () => {
  const thumb = { url: 'https://i.ytimg.com/sd.jpg', width: 640, height: 480 };

  it('returns [] when there is no items array', () => {
    expect(formatStreams(undefined)).toEqual([]);
    expect(formatStreams({ data: {} })).toEqual([]);
  });

  it('maps a broadcast to FormattedStream with links and key name', () => {
    const b = broadcast({
      snippet: {
        title: 'T',
        description: 'D',
        scheduledStartTime: '2026-12-01T18:00:00Z',
        actualStartTime: '2026-12-01T18:01:00Z',
        thumbnails: { standard: thumb },
      },
    });
    const [s] = formatStreams(listResponse([b]), new Map([['key-1', 'Main key']]));
    expect(s).toEqual({
      id: 'vid-1',
      title: 'T',
      description: 'D',
      startTime: '2026-12-01T18:00:00Z',
      actualStartTime: '2026-12-01T18:01:00Z',
      actualEndTime: undefined,
      thumbnail: thumb,
      enableAutoStart: false,
      enableAutoStop: true,
      status: 'ready',
      isLive: false,
      isComplete: false,
      privacyStatus: 'private',
      videoLink: 'https://www.youtube.com/watch?v=vid-1',
      controlRoomLink: 'https://studio.youtube.com/video/vid-1/livestreaming',
      boundStreamId: 'key-1',
      streamKeyName: 'Main key',
    });
  });

  it('flags live and complete broadcasts from lifeCycleStatus', () => {
    const live = broadcast({ id: 'l', status: { privacyStatus: 'public', lifeCycleStatus: 'live' } });
    const done = broadcast({ id: 'c', status: { privacyStatus: 'public', lifeCycleStatus: 'complete' } });
    const [l, c] = formatStreams(listResponse([live, done]));
    expect([l.isLive, l.isComplete]).toEqual([true, false]);
    expect([c.isLive, c.isComplete]).toEqual([false, true]);
  });

  it('leaves streamKeyName undefined when the key is unknown or unbound', () => {
    const unbound = broadcast({ contentDetails: { ...broadcast().contentDetails, boundStreamId: undefined } });
    const [a, b] = formatStreams(listResponse([broadcast(), unbound]), new Map());
    expect(a.streamKeyName).toBeUndefined();
    expect(b.boundStreamId).toBeUndefined();
    expect(b.streamKeyName).toBeUndefined();
  });
});

describe('formatPlaylists', () => {
  it('maps playlists, preferring the medium thumbnail', () => {
    const medium = { url: 'm', width: 320, height: 180 };
    const out = formatPlaylists([
      {
        id: 'pl-1',
        snippet: { title: 'A', description: 'd', publishedAt: '2026-01-01', thumbnails: { medium, default: { url: 'd' } } },
        contentDetails: { itemCount: 4 },
        status: { privacyStatus: 'public' },
      },
    ]);
    expect(out).toEqual([
      { id: 'pl-1', title: 'A', description: 'd', thumbnail: medium, itemCount: 4, privacyStatus: 'public', publishedAt: '2026-01-01' },
    ]);
  });

  it('falls back to the default thumbnail, 0 items, private and empty description', () => {
    const def = { url: 'd', width: 120, height: 90 };
    const [p] = formatPlaylists([{ id: 'pl-2', snippet: { title: 'B', publishedAt: 'x', thumbnails: { default: def } } }]);
    expect(p.thumbnail).toEqual(def);
    expect(p.itemCount).toBe(0);
    expect(p.privacyStatus).toBe('private');
    expect(p.description).toBe('');
  });
});

describe('formatPlaylistItems', () => {
  it('maps items, taking videoId from resourceId first', () => {
    const [i] = formatPlaylistItems([
      {
        id: 'it-1',
        snippet: { title: 'V', description: 'd', position: 2, publishedAt: 'p', resourceId: { videoId: 'vid-r' }, thumbnails: { medium: { url: 'm' } } },
        contentDetails: { videoId: 'vid-c' },
      },
    ]);
    expect(i).toEqual({ id: 'it-1', videoId: 'vid-r', title: 'V', description: 'd', thumbnail: { url: 'm' }, position: 2, publishedAt: 'p' });
  });

  it('falls back to contentDetails.videoId, then empty; position 0; empty description', () => {
    const [a, b] = formatPlaylistItems([
      { id: 'a', snippet: { title: 'A' }, contentDetails: { videoId: 'vid-c' } },
      { id: 'b', snippet: { title: 'B' } },
    ]);
    expect(a.videoId).toBe('vid-c');
    expect(b.videoId).toBe('');
    expect(b.position).toBe(0);
    expect(b.description).toBe('');
  });
});

describe('toLocalDatetime', () => {
  it('returns empty for no input', () => {
    expect(toLocalDatetime()).toBe('');
    expect(toLocalDatetime('')).toBe('');
  });

  it('formats with the en-GB locale', () => {
    const iso = '2026-12-01T18:05:00Z';
    expect(toLocalDatetime(iso)).toBe(new Date(iso).toLocaleString('en-GB'));
  });

  // Characterises B10: invalid input does not throw, so the catch never runs.
  it('currently returns "Invalid Date" for garbage input (bug B10)', () => {
    expect(toLocalDatetime('garbage')).toBe('Invalid Date');
  });
});

describe('toDatetimeLocalValue', () => {
  it('returns empty for no input', () => {
    expect(toDatetimeLocalValue()).toBe('');
  });

  it('formats as local YYYY-MM-DDTHH:MM with zero padding', () => {
    const local = new Date(2026, 0, 5, 7, 3); // 5 Jan 2026 07:03 local time
    expect(toDatetimeLocalValue(local.toISOString())).toBe('2026-01-05T07:03');
  });

  // Characterises B10.
  it('currently returns NaN parts for garbage input (bug B10)', () => {
    expect(toDatetimeLocalValue('garbage')).toBe('NaN-NaN-NaNTNaN:NaN');
  });
});
