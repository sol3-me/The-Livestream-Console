import { authOptions } from '@/lib/authOptions';
import { getLiveStreamByBroadcastId } from '@/lib/youtube';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await getLiveStreamByBroadcastId(session.access_token, params.id);
    if (!result) {
      return NextResponse.json({ error: 'No stream key found for this broadcast' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error('ERROR fetching stream key:', e);
    return NextResponse.json(e, { status: 500 });
  }
}
