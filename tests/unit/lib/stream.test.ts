import { describe, expect, it } from 'vitest';
import { Stream, type YouTubeStreamData } from '@/lib/stream';
import { broadcast } from '../fixtures/youtube';

const existing = broadcast() as unknown as YouTubeStreamData;
// boundStreamId is read-only on YouTube's side and is deliberately not sent back on update.
const { boundStreamId: _bound, ...editableContentDetails } = broadcast().contentDetails;

describe('Stream (edit merge model)', () => {
  it('keeps every existing value when the request only has an id', () => {
    const s = new Stream({ id: 'vid-1' }, existing);
    expect(s.id).toBe('vid-1');
    expect(s.snippet).toEqual(existing.snippet);
    expect(s.status).toEqual({ privacyStatus: 'private' });
    expect(s.contentDetails).toEqual(editableContentDetails);
  });

  it('does not send boundStreamId or lifeCycleStatus back to YouTube', () => {
    const s = new Stream({ id: 'vid-1' }, existing);
    expect(s.contentDetails).not.toHaveProperty('boundStreamId');
    expect(s.status).not.toHaveProperty('lifeCycleStatus');
  });

  it('overrides title, description and privacy from the request', () => {
    const s = new Stream({ id: 'x', title: 'New', description: '', privacyStatus: 'public' }, existing);
    expect(s.snippet.title).toBe('New');
    expect(s.snippet.description).toBe('');
    expect(s.status.privacyStatus).toBe('public');
  });

  it('converts a datetime-local start time to UTC ISO', () => {
    const s = new Stream({ id: 'x', startTime: '2026-12-01T18:30' }, existing);
    expect(s.snippet.scheduledStartTime).toBe(new Date('2026-12-01T18:30').toISOString());
  });

  it.each(['2026-12-01T18:30:00Z', '2026-12-01T18:30:00+02:00'])('passes through a zoned start time %s', (t) => {
    expect(new Stream({ id: 'x', startTime: t }, existing).snippet.scheduledStartTime).toBe(t);
  });

  it.each([
    ['true', true],
    [true, true],
    ['false', false],
    [false, false],
  ] as const)('autoStart %j → %s', (input, expected) => {
    expect(new Stream({ id: 'x', autoStart: input }, existing).contentDetails.enableAutoStart).toBe(expected);
  });

  it.each([
    ['true', true],
    [true, true],
    ['false', false],
    [false, false],
  ] as const)('autoStop %j → %s', (input, expected) => {
    expect(new Stream({ id: 'x', autoStop: input }, existing).contentDetails.enableAutoStop).toBe(expected);
  });

  it('falls back to the existing toggles when autoStart/autoStop are absent', () => {
    const on = { ...existing, contentDetails: { ...existing.contentDetails, enableAutoStart: true, enableAutoStop: false } };
    const s = new Stream({ id: 'x' }, on);
    expect(s.contentDetails.enableAutoStart).toBe(true);
    expect(s.contentDetails.enableAutoStop).toBe(false);
  });

  it('passes through the non-editable content details unchanged', () => {
    const custom = {
      ...existing,
      contentDetails: {
        ...existing.contentDetails,
        enableClosedCaptions: true,
        enableContentEncryption: true,
        enableDvr: false,
        enableEmbed: false,
        recordFromStart: false,
        startWithSlate: true,
        monitorStream: { enableMonitorStream: false, broadcastStreamDelayMs: 5000 },
      },
    };
    const { enableAutoStart, enableAutoStop, ...rest } = new Stream({ id: 'x' }, custom).contentDetails;
    const { enableAutoStart: _a, enableAutoStop: _b, boundStreamId: _c, ...expected } = custom.contentDetails as typeof custom.contentDetails & { boundStreamId?: string };
    expect(rest).toEqual(expected);
    expect([enableAutoStart, enableAutoStop]).toEqual([false, true]);
  });
});
