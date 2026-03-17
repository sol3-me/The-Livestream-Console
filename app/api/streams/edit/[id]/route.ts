import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getStreamById, editStream } from '@/lib/youtube';
import { Stream, type StreamRequest, type YouTubeStreamData } from '@/lib/stream';

export async function POST(
  req: NextRequest,
  _ctx: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as StreamRequest;
    const apiStream = await getStreamById(session.access_token, body.id);
    const ytStreamData = apiStream.data.items?.[0];
    if (!ytStreamData) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }
    const streamForAPI = new Stream(body, ytStreamData as unknown as YouTubeStreamData);
    await editStream(session.access_token, streamForAPI);
    return NextResponse.json({ redirectUrl: '/streams' });
  } catch (e) {
    console.error('ERROR EDITING:', e);
    return NextResponse.json(e, { status: 500 });
  }
}
