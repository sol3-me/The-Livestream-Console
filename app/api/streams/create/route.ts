import { authOptions } from '@/lib/authOptions';
import { addToPlaylist } from '@/lib/playlists';
import { bindBroadcastToStream, createStream } from '@/lib/youtube';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface CreateStreamBody {
    title: string;
    description?: string;
    startTime: string;
    privacyStatus?: string;
    autoStart?: string;
    autoStop?: string;
    playlistIds?: string;
    streamKeyId?: string;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = (await req.json()) as CreateStreamBody;
        if (!body.title?.trim()) {
            return NextResponse.json({ errors: [{ message: 'Title is required.' }] }, { status: 400 });
        }
        const scheduledStartTime = /[Z+]/.test(body.startTime)
            ? body.startTime
            : new Date(body.startTime).toISOString();

        const result = await createStream(session.access_token, {
            title: body.title.trim(),
            description: body.description ?? '',
            scheduledStartTime,
            privacyStatus: body.privacyStatus ?? 'private',
            enableAutoStart: body.autoStart === 'true',
            enableAutoStop: body.autoStop === 'true',
        });

        const videoId = result.data.id;

        // Bind to stream key if requested
        if (videoId && body.streamKeyId) {
            try {
                await bindBroadcastToStream(session.access_token, videoId, body.streamKeyId);
            } catch { /* key binding is best-effort */ }
        }

        // Add to selected playlists
        if (videoId && body.playlistIds) {
            try {
                const ids: string[] = JSON.parse(body.playlistIds);
                await Promise.allSettled(
                    ids.map((pid) => addToPlaylist(session.access_token!, pid, videoId)),
                );
            } catch { /* playlist add is best-effort */ }
        }

        return NextResponse.json({ redirectUrl: '/streams' });
    } catch (e) {
        console.error('ERROR CREATING:', e);
        return NextResponse.json(e, { status: 500 });
    }
}
