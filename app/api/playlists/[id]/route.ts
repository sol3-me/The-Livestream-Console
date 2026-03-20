import { authOptions } from '@/lib/authOptions';
import { deletePlaylist, updatePlaylist } from '@/lib/playlists';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface UpdatePlaylistBody {
    title: string;
    description?: string;
    privacyStatus?: string;
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = (await req.json()) as UpdatePlaylistBody;
        if (!body.title?.trim()) {
            return NextResponse.json({ errors: [{ message: 'Title is required.' }] }, { status: 400 });
        }
        const result = await updatePlaylist(session.access_token, params.id, {
            title: body.title.trim(),
            description: body.description ?? '',
            privacyStatus: body.privacyStatus ?? 'private',
        });
        return NextResponse.json(result.data);
    } catch (e) {
        console.error('ERROR UPDATING PLAYLIST:', e);
        return NextResponse.json(e, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } },
) {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        await deletePlaylist(session.access_token, params.id);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('ERROR DELETING PLAYLIST:', e);
        return NextResponse.json(e, { status: 500 });
    }
}
