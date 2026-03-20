import { authOptions } from '@/lib/authOptions';
import { removeFromPlaylist } from '@/lib/playlists';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string; itemId: string } },
) {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        await removeFromPlaylist(session.access_token, params.itemId);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('ERROR REMOVING FROM PLAYLIST:', e);
        return NextResponse.json(e, { status: 500 });
    }
}
