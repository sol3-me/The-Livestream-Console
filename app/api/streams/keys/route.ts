import { authOptions } from '@/lib/authOptions';
import { getYouTubeService } from '@/lib/services/youtube';
import type { AvailableStreamKey } from '@/lib/types';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { getMyLiveStreams } = getYouTubeService();
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
