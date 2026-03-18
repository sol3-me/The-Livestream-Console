import type { FormattedStream } from './types';

export async function parallelAsync<T extends Record<string, Promise<unknown>>>(
  parallelRequests: T,
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const keys = Object.keys(parallelRequests) as (keyof T)[];
  const values = await Promise.all(Object.values(parallelRequests));
  return keys.reduce(
    (acc, key, index) => {
      acc[key] = values[index] as Awaited<T[typeof key]>;
      return acc;
    },
    {} as { [K in keyof T]: Awaited<T[K]> },
  );
}

export function formatStreams(livestreams: unknown): FormattedStream[] {
  const data = livestreams as { data?: { items?: unknown[] } };
  if (!data?.data?.items) return [];
  return (data.data.items as Record<string, unknown>[]).map((o) => {
    const snippet = o.snippet as Record<string, unknown>;
    const contentDetails = o.contentDetails as Record<string, unknown>;
    const status = o.status as Record<string, unknown>;
    const thumbnails = snippet.thumbnails as Record<string, unknown> | undefined;
    return {
      id: o.id as string,
      title: snippet.title as string,
      description: snippet.description as string,
      startTime: snippet.scheduledStartTime as string,
      actualStartTime: snippet.actualStartTime as string | undefined,
      actualEndTime: snippet.actualEndTime as string | undefined,
      thumbnail: thumbnails?.standard as FormattedStream['thumbnail'],
      enableAutoStart: contentDetails.enableAutoStart as boolean,
      enableAutoStop: contentDetails.enableAutoStop as boolean,
      status: status.lifeCycleStatus as string,
      isLive: status.lifeCycleStatus === 'live',
      isComplete: status.lifeCycleStatus === 'complete',
      privacyStatus: status.privacyStatus as string,
      videoLink: `https://www.youtube.com/watch?v=${o.id}`,
      controlRoomLink: `https://studio.youtube.com/video/${o.id}/livestreaming`,
    };
  });
}

export function toLocalDatetime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('en-GB');
  } catch {
    return '';
  }
}

/** Convert an ISO datetime string to the value format required by <input type="datetime-local"> */
export function toDatetimeLocalValue(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}
