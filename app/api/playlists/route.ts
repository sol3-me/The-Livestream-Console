import { authOptions } from '@/lib/authOptions';
import { createPlaylist, getPlaylists } from '@/lib/playlists';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const result = await getPlaylists(session.access_token);
        return NextResponse.json(result.data.items ?? []);
    } catch (e) {
        console.error('ERROR LISTING PLAYLISTS:', e);
        return NextResponse.json(e, { status: 500 });
    }
}

interface CreatePlaylistBody {
    title: string;
    description?: string;
    privacyStatus?: string;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = (await req.json()) as CreatePlaylistBody;
        if (!body.title?.trim()) {
            return NextResponse.json({ errors: [{ message: 'Title is required.' }] }, { status: 400 });
        }
        const result = await createPlaylist(session.access_token, {
            title: body.title.trim(),
            description: body.description ?? '',
            privacyStatus: body.privacyStatus ?? 'private',
        });
        return NextResponse.json(result.data);
    } catch (e) {
        console.error('ERROR CREATING PLAYLIST:', e);
        return NextResponse.json(e, { status: 500 });
    }
}
