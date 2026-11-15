import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as HEALTH } from '@/app/api/health/route';
import { GET as LATEST } from '@/app/api/releases/latest/route';

const REQUIRED = ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

describe('GET /api/health', () => {
  beforeEach(() => REQUIRED.forEach((k) => vi.stubEnv(k, `value-of-${k}`)));
  afterEach(() => vi.unstubAllEnvs());

  it('is healthy (200) when every required variable is set, and never leaks values', async () => {
    const res = await HEALTH();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.healthy).toBe(true);
    expect(body).not.toHaveProperty('missing');
    expect(body.env.map((e: { key: string }) => e.key)).toEqual(REQUIRED);
    expect(body.env.every((e: { set: boolean }) => e.set)).toBe(true);
    expect(JSON.stringify(body)).not.toContain('value-of-');
  });

  it('is degraded (503) and lists what is missing', async () => {
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');
    vi.stubEnv('NEXTAUTH_URL', '');
    const res = await HEALTH();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.healthy).toBe(false);
    expect(body.missing).toEqual(['NEXTAUTH_URL', 'GOOGLE_CLIENT_SECRET']);
  });

  it('reports runtime info', async () => {
    vi.stubEnv('NEXTAUTH_DEBUG', '1');
    const body = await (await HEALTH()).json();
    expect(body.runtime).toEqual({ node: process.version, nextauth_debug: true, node_env: process.env.NODE_ENV });
  });
});

describe('GET /api/releases/latest', () => {
  const fetchMock = vi.fn();
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => vi.unstubAllGlobals());

  const respond = (status: number, body: unknown) =>
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));

  it('returns the version without the leading v, and the release url', async () => {
    respond(200, { tag_name: 'v3.5.0', html_url: 'https://github.com/x/releases/tag/v3.5.0' });
    const res = await LATEST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ version: '3.5.0', url: 'https://github.com/x/releases/tag/v3.5.0' });
  });

  it('keeps a tag that has no leading v', async () => {
    respond(200, { tag_name: '3.5.0', html_url: 'u' });
    expect(await (await LATEST()).json()).toEqual({ version: '3.5.0', url: 'u' });
  });

  // Characterises bug B6: still points at the pre-rename org.
  it('currently calls the old sol3uk repo path with an hourly revalidate (bug B6)', async () => {
    respond(200, { tag_name: 'v1', html_url: 'u' });
    await LATEST();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/sol3uk/The-Livestream-Console/releases/latest');
    expect(init.next).toEqual({ revalidate: 3600 });
    expect(init.headers['User-Agent']).toBe('The-Livestream-Console');
  });

  it('returns 502 when GitHub responds with an error', async () => {
    respond(404, {});
    const res = await LATEST();
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Failed to fetch latest release.' });
  });

  it.each([
    [{ html_url: 'u' }],
    [{ tag_name: 'v', html_url: 'u' }],
    [{ tag_name: 'v1' }],
  ])('returns 502 when release data is incomplete: %j', async (body) => {
    respond(200, body);
    const res = await LATEST();
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Latest release data is incomplete.' });
  });

  it('returns 502 when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const res = await LATEST();
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Failed to fetch latest release.' });
  });
});
