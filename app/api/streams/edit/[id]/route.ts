import { authOptions } from '@/lib/authOptions';
import { getYouTubeService } from '@/lib/services/youtube';
import { Stream, type StreamRequest, type YouTubeStreamData } from '@/lib/stream';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  _ctx: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { getStreamById, editStream, bindBroadcastToStream, addToPlaylist } = getYouTubeService();
  try {
    const body = (await req.json()) as StreamRequest & { playlistIds?: string; streamKeyId?: string };
    const apiStream = await getStreamById(session.access_token, body.id);
    const ytStreamData = apiStream.data.items?.[0];
    if (!ytStreamData) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }
    const streamForAPI = new Stream(body, ytStreamData as unknown as YouTubeStreamData);
    await editStream(session.access_token, streamForAPI);

    // Bind to a different stream key if requested
    if (body.streamKeyId) {
      await bindBroadcastToStream(session.access_token, body.id, body.streamKeyId);
    }

    // Add to selected playlists
    if (body.playlistIds) {
      try {
        const ids: string[] = JSON.parse(body.playlistIds);
        await Promise.allSettled(
          ids.map((pid) => addToPlaylist(session.access_token!, pid, body.id)),
        );
      } catch { /* playlist add is best-effort */ }
    }

    return NextResponse.json({ redirectUrl: '/streams' });
  } catch (e) {
    console.error('ERROR EDITING:', e);
    return NextResponse.json(e, { status: 500 });
  }
}
