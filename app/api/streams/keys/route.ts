import { authOptions } from '@/lib/authOptions';
import type { AvailableStreamKey } from '@/lib/types';
import { getMyLiveStreams } from '@/lib/youtube';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const items = await getMyLiveStreams(session.access_token);
    const keys: AvailableStreamKey[] = items.map((s) => ({
      id: s.id ?? '',
      name: s.snippet?.title ?? '',
      resolution: s.cdn?.resolution ?? undefined,
      frameRate: s.cdn?.frameRate ?? undefined,
      ingestionType: s.cdn?.ingestionType ?? undefined,
    }));
    return NextResponse.json(keys);
  } catch (e) {
    console.error('ERROR fetching stream keys:', e);
    return NextResponse.json(e, { status: 500 });
  }
}
