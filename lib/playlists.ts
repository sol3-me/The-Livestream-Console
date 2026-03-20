import { google } from 'googleapis';

function getYoutubeClient(accessToken: string) {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
    );
    auth.setCredentials({ access_token: accessToken });
    return google.youtube({ version: 'v3', auth });
}

export async function getPlaylists(accessToken: string) {
    const youtube = getYoutubeClient(accessToken);
    return youtube.playlists.list({
        part: ['snippet', 'contentDetails', 'status'],
        mine: true,
        maxResults: 50,
    });
}

export async function getPlaylistItems(accessToken: string, playlistId: string) {
    const youtube = getYoutubeClient(accessToken);
    return youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId,
        maxResults: 50,
    });
}

export async function addToPlaylist(accessToken: string, playlistId: string, videoId: string) {
    const youtube = getYoutubeClient(accessToken);
    return youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
            snippet: {
                playlistId,
                resourceId: {
                    kind: 'youtube#video',
                    videoId,
                },
            },
        },
    });
}

export async function removeFromPlaylist(accessToken: string, playlistItemId: string) {
    const youtube = getYoutubeClient(accessToken);
    return youtube.playlistItems.delete({ id: playlistItemId });
}

export interface CreatePlaylistData {
    title: string;
    description: string;
    privacyStatus: string;
}

export async function createPlaylist(accessToken: string, data: CreatePlaylistData) {
    const youtube = getYoutubeClient(accessToken);
    return youtube.playlists.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: data.title,
                description: data.description,
            },
            status: {
                privacyStatus: data.privacyStatus,
            },
        },
    });
}

export interface UpdatePlaylistData {
    title: string;
    description: string;
    privacyStatus: string;
}

export async function updatePlaylist(accessToken: string, playlistId: string, data: UpdatePlaylistData) {
    const youtube = getYoutubeClient(accessToken);
    return youtube.playlists.update({
        part: ['snippet', 'status'],
        requestBody: {
            id: playlistId,
            snippet: {
                title: data.title,
                description: data.description,
            },
            status: {
                privacyStatus: data.privacyStatus,
            },
        },
    });
}

export async function deletePlaylist(accessToken: string, playlistId: string) {
    const youtube = getYoutubeClient(accessToken);
    return youtube.playlists.delete({ id: playlistId });
}
