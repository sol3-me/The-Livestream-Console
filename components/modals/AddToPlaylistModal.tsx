'use client';
import type { FormattedPlaylist } from '@/lib/types';
import { useEffect, useState } from 'react';
import Modal from './Modal';

interface AddToPlaylistModalProps {
    videoIds: string[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddToPlaylistModal({
    videoIds,
    onClose,
    onSuccess,
}: AddToPlaylistModalProps) {
    const [playlists, setPlaylists] = useState<FormattedPlaylist[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/playlists')
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to load playlists');
                const data = (await res.json()) as Record<string, unknown>[];
                if (cancelled) return;
                const formatted: FormattedPlaylist[] = data.map((item) => {
                    const snippet = item.snippet as Record<string, unknown>;
                    const contentDetails = item.contentDetails as Record<string, unknown>;
                    const status = item.status as Record<string, unknown>;
                    const thumbnails = snippet?.thumbnails as Record<string, unknown> | undefined;
                    const thumb = (thumbnails?.medium ?? thumbnails?.default) as FormattedPlaylist['thumbnail'];
                    return {
                        id: item.id as string,
                        title: (snippet?.title as string) ?? '',
                        description: (snippet?.description as string) ?? '',
                        thumbnail: thumb,
                        itemCount: (contentDetails?.itemCount as number) ?? 0,
                        privacyStatus: (status?.privacyStatus as string) ?? 'private',
                        publishedAt: (snippet?.publishedAt as string) ?? '',
                    };
                });
                setPlaylists(formatted);
            })
            .catch(() => {
                if (!cancelled) setError('Could not load playlists.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const handleAdd = async (playlistId: string) => {
        setAdding(playlistId);
        setError(null);
        try {
            for (const videoId of videoIds) {
                const res = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoId }),
                });
                if (!res.ok) {
                    const data = (await res.json()) as { errors?: { message: string }[] };
                    throw new Error(data.errors?.[0]?.message ?? 'Failed to add video');
                }
            }
            onSuccess();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add to playlist');
        } finally {
            setAdding(null);
        }
    };

    return (
        <Modal
            open={true}
            onClose={onClose}
            title={`Add ${videoIds.length} video${videoIds.length !== 1 ? 's' : ''} to playlist`}
            footer={
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Close
                </button>
            }
        >
            {error && (
                <div className="mb-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                    {error}
                </div>
            )}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    ))}
                </div>
            ) : playlists.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No playlists found. Create one on the Playlists page first.
                </p>
            ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                    {playlists.map((pl) => (
                        <button
                            key={pl.id}
                            onClick={() => handleAdd(pl.id)}
                            disabled={adding !== null}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {pl.thumbnail ? (
                                <img
                                    src={pl.thumbnail.url}
                                    alt=""
                                    className="w-12 h-9 object-cover rounded"
                                    width={pl.thumbnail.width}
                                    height={pl.thumbnail.height}
                                />
                            ) : (
                                <div className="w-12 h-9 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">
                                    ♫
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate dark:text-gray-100">{pl.title}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {pl.itemCount} item{pl.itemCount !== 1 ? 's' : ''} · {pl.privacyStatus}
                                </p>
                            </div>
                            {adding === pl.id ? (
                                <span className="text-xs text-blue-500">Adding…</span>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </Modal>
    );
}
