import { authOptions } from '@/lib/authOptions';
import { getPlaylistItems, getPlaylists } from '@/lib/playlists';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videoId = req.nextUrl.searchParams.get('videoId');
    if (!videoId) {
        return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    try {
        const playlists = await getPlaylists(session.access_token);
        const playlistItems = playlists.data.items ?? [];

        const checks = await Promise.allSettled(
            playlistItems.map(async (p) => {
                const items = await getPlaylistItems(session.access_token!, p.id!);
                const found = (items.data.items ?? []).some(
                    (item) => item.snippet?.resourceId?.videoId === videoId,
                );
                return found ? p.id! : null;
            }),
        );

        const matchingIds = checks
            .filter((r): r is PromiseFulfilledResult<string | null> => r.status === 'fulfilled')
            .map((r) => r.value)
            .filter(Boolean) as string[];

        return NextResponse.json(matchingIds);
    } catch (e) {
        console.error('ERROR CHECKING PLAYLISTS FOR VIDEO:', e);
        return NextResponse.json([], { status: 200 });
    }
}
