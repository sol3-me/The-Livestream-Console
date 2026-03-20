import PlaylistsClient from '@/components/PlaylistsClient';
import { authOptions } from '@/lib/authOptions';
import { getPlaylists } from '@/lib/playlists';
import type { FormattedPlaylist } from '@/lib/types';
import { formatPlaylists } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function PlaylistsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');
    if (session.error === 'RefreshAccessTokenError') redirect('/api/auth/signin');

    let playlists: FormattedPlaylist[] = [];

    try {
        const result = await getPlaylists(session.access_token!);
        playlists = formatPlaylists(result.data.items ?? []);
    } catch (e) {
        console.error('ERROR - /playlists:', e);
        redirect('/');
    }

    return <PlaylistsClient playlists={playlists} />;
}
