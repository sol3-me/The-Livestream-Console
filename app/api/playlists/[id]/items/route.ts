import { authOptions } from '@/lib/authOptions';
import { addToPlaylist, getPlaylistItems } from '@/lib/playlists';
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
        const result = await getPlaylistItems(session.access_token, params.id);
        return NextResponse.json(result.data.items ?? []);
    } catch (e) {
        console.error('ERROR LISTING PLAYLIST ITEMS:', e);
        return NextResponse.json(e, { status: 500 });
    }
}

interface AddItemBody {
    videoId: string;
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = (await req.json()) as AddItemBody;
        if (!body.videoId?.trim()) {
            return NextResponse.json({ errors: [{ message: 'Video ID is required.' }] }, { status: 400 });
        }
        const result = await addToPlaylist(session.access_token, params.id, body.videoId.trim());
        return NextResponse.json(result.data);
    } catch (e) {
        console.error('ERROR ADDING TO PLAYLIST:', e);
        return NextResponse.json(e, { status: 500 });
    }
}
