import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { register } from '@/instrumentation';

const originalMode = process.env.TLC_YOUTUBE_MODE;

type Spy = { mock: { calls: unknown[][] } };
const output = (spy: Spy) => spy.mock.calls.map((args) => args.join(' ')).join('\n');

describe('instrumentation register(): YouTube mode', () => {
  let log: Spy;
  let warn: Spy;
  let error: Spy;

  beforeEach(() => {
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalMode === undefined) delete process.env.TLC_YOUTUBE_MODE;
    else process.env.TLC_YOUTUBE_MODE = originalMode;
    vi.restoreAllMocks();
  });

  it('warns loudly when fake mode is on', async () => {
    process.env.TLC_YOUTUBE_MODE = 'fake';
    await register();
    const text = output(warn);
    expect(text).toContain('FAKE YOUTUBE MODE');
    expect(text).toContain('TLC_YOUTUBE_MODE=fake');
    expect(text).toContain('No real YouTube calls are made');
  });

  it.each([undefined, '', 'google'])('stays quiet about YouTube mode when it is %j', async (mode) => {
    if (mode === undefined) delete process.env.TLC_YOUTUBE_MODE;
    else process.env.TLC_YOUTUBE_MODE = mode;
    await register();
    expect(output(warn)).not.toContain('FAKE YOUTUBE MODE');
    expect(output(error)).not.toContain('TLC_YOUTUBE_MODE');
  });

  it('reports an invalid mode at startup rather than on the first request', async () => {
    process.env.TLC_YOUTUBE_MODE = 'bogus';
    await register();
    expect(output(error)).toContain('Invalid TLC_YOUTUBE_MODE "bogus". Use "google" (default) or "fake".');
  });

  it('still runs the environment check', async () => {
    await register();
    expect(output(log)).toContain('Environment check');
  });
});
