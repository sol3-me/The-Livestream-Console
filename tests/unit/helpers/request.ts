import { NextRequest } from 'next/server';

const BASE = 'http://localhost:3000';

/** Build a NextRequest for calling a route handler directly. */
export function makeRequest(path: string, init?: { method?: string; body?: unknown; rawBody?: string }) {
  const body = init?.rawBody ?? (init?.body !== undefined ? JSON.stringify(init.body) : undefined);
  return new NextRequest(new URL(path, BASE), {
    method: init?.method ?? 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body,
  });
}

/** Route handlers in Next 14 receive params synchronously. */
export function ctx<T extends Record<string, string>>(params: T) {
  return { params };
}
