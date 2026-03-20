'use client';
import type { FormattedPlaylist, PlaylistItem } from '@/lib/types';
import { formatPlaylistItems, toLocalDatetime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import PlaylistCard from './PlaylistCard';
import PlaylistTableRow from './PlaylistTableRow';
import DeletePlaylistModal from './modals/DeletePlaylistModal';
import PlaylistEditModal from './modals/PlaylistEditModal';

type ViewMode = 'grid' | 'table';
type PlaylistSortKey = 'title' | 'publishedAt' | 'itemCount' | 'privacyStatus';
type SortDir = 'asc' | 'desc';

const VALID_SORT_KEYS: PlaylistSortKey[] = ['title', 'publishedAt', 'itemCount', 'privacyStatus'];

function sortPlaylists(items: FormattedPlaylist[], key: PlaylistSortKey, dir: SortDir) {
    return [...items].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        let cmp = 0;
        if (typeof av === 'number' && typeof bv === 'number') {
            cmp = av - bv;
        } else {
            cmp = String(av ?? '').localeCompare(String(bv ?? ''));
        }
        return dir === 'asc' ? cmp : -cmp;
    });
}

interface PlaylistsClientProps {
    playlists: FormattedPlaylist[];
}

export default function PlaylistsClient({ playlists: initialPlaylists }: PlaylistsClientProps) {
    const router = useRouter();
    const [playlists, setPlaylists] = useState(initialPlaylists);
    const [creating, setCreating] = useState(false);
    const [editingPlaylist, setEditingPlaylist] = useState<FormattedPlaylist | null>(null);
    const [deletingPlaylist, setDeletingPlaylist] = useState<FormattedPlaylist | null>(null);
    const [viewingPlaylist, setViewingPlaylist] = useState<FormattedPlaylist | null>(null);
    const [viewItems, setViewItems] = useState<PlaylistItem[]>([]);
    const [viewLoading, setViewLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [removingItemId, setRemovingItemId] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortKey, setSortKey] = useState<PlaylistSortKey>('publishedAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [uiMounted, setUiMounted] = useState(false);

    // Restore persisted preferences
    useEffect(() => {
        const storedView = localStorage.getItem('playlists-view') as ViewMode | null;
        if (storedView === 'grid' || storedView === 'table') setViewMode(storedView);
        const storedKey = localStorage.getItem('playlists-sort-key') as PlaylistSortKey | null;
        if (storedKey && VALID_SORT_KEYS.includes(storedKey)) setSortKey(storedKey);
        const storedDir = localStorage.getItem('playlists-sort-dir') as SortDir | null;
        if (storedDir === 'asc' || storedDir === 'desc') setSortDir(storedDir);
        setUiMounted(true);
    }, []);

    const toggleView = (next: ViewMode) => {
        setViewMode(next);
        localStorage.setItem('playlists-view', next);
    };

    const handleSort = (key: PlaylistSortKey) => {
        const nextDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
        setSortKey(key);
        setSortDir(nextDir);
        localStorage.setItem('playlists-sort-key', key);
        localStorage.setItem('playlists-sort-dir', nextDir);
    };

    const sorted = useMemo(() => sortPlaylists(playlists, sortKey, sortDir), [playlists, sortKey, sortDir]);

    const handleCreate = useCallback(async (data: { title: string; description: string; privacyStatus: string }) => {
        setCreateLoading(true);
        try {
            const res = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = (await res.json()) as { errors?: { message: string }[] };
            if (!res.ok) throw result;
            toast.success('Playlist created');
            setCreating(false);
            router.refresh();
        } catch (e) {
            const err = e as { errors?: { message: string }[] };
            toast.error(err.errors?.[0]?.message ?? 'Failed to create playlist');
        } finally {
            setCreateLoading(false);
        }
    }, [router]);

    const handleEdit = useCallback(async (data: { title: string; description: string; privacyStatus: string }) => {
        if (!editingPlaylist) return;
        setEditLoading(true);
        const previous = playlists;
        const playlistId = editingPlaylist.id;

        // Optimistic update
        setPlaylists((prev) => prev.map((p) => p.id === playlistId ? { ...p, ...data } : p));
        setEditingPlaylist(null);

        try {
            const res = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = (await res.json()) as { errors?: { message: string }[] };
            if (!res.ok) throw result;
            toast.success('Playlist updated');
            router.refresh();
        } catch (e) {
            const err = e as { errors?: { message: string }[] };
            toast.error(err.errors?.[0]?.message ?? 'Failed to update playlist');
            setPlaylists(previous);
        } finally {
            setEditLoading(false);
        }
    }, [editingPlaylist, playlists, router]);

    const handleDelete = useCallback(async () => {
        if (!deletingPlaylist) return;
        setDeleteLoading(true);
        const idToDelete = deletingPlaylist.id;
        const previous = playlists;

        // Optimistic removal
        setPlaylists((prev) => prev.filter((p) => p.id !== idToDelete));
        setDeletingPlaylist(null);

        try {
            const res = await fetch(`/api/playlists/${encodeURIComponent(idToDelete)}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = (await res.json()) as { errors?: { message: string }[] };
                throw data;
            }
            toast.success('Playlist deleted');
            router.refresh();
        } catch (e) {
            const err = e as { errors?: { message: string }[] };
            toast.error(err.errors?.[0]?.message ?? 'Failed to delete playlist');
            setPlaylists(previous);
        } finally {
            setDeleteLoading(false);
        }
    }, [deletingPlaylist, playlists, router]);

    const handleView = useCallback(async (playlist: FormattedPlaylist) => {
        setViewingPlaylist(playlist);
        setViewLoading(true);
        setViewItems([]);
        try {
            const res = await fetch(`/api/playlists/${encodeURIComponent(playlist.id)}/items`);
            if (!res.ok) throw new Error('Failed to load items');
            const raw = (await res.json()) as unknown[];
            setViewItems(formatPlaylistItems(raw));
        } catch {
            toast.error('Failed to load playlist items');
        } finally {
            setViewLoading(false);
        }
    }, []);

    const handleRemoveItem = useCallback(async (itemId: string) => {
        if (!viewingPlaylist) return;
        setRemovingItemId(itemId);
        try {
            const res = await fetch(
                `/api/playlists/${encodeURIComponent(viewingPlaylist.id)}/items/${encodeURIComponent(itemId)}`,
                { method: 'DELETE' },
            );
            if (!res.ok) throw new Error('Failed to remove');
            setViewItems((prev) => prev.filter((i) => i.id !== itemId));
            setPlaylists((prev) =>
                prev.map((p) => p.id === viewingPlaylist.id ? { ...p, itemCount: Math.max(0, p.itemCount - 1) } : p),
            );
            toast.success('Item removed from playlist');
        } catch {
            toast.error('Failed to remove item');
        } finally {
            setRemovingItemId(null);
        }
    }, [viewingPlaylist]);

    return (
        <div className="py-10">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                    <h1 className="text-3xl font-light flex items-center gap-2">
                        Playlists
                        <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {playlists.length}
                        </span>
                    </h1>
                    <div className="flex items-center gap-3">
                        {/* Sort dropdown */}
                        {playlists.length > 1 && uiMounted && (
                            <select
                                value={`${sortKey}-${sortDir}`}
                                onChange={(e) => {
                                    const [k, d] = e.target.value.split('-') as [PlaylistSortKey, SortDir];
                                    setSortKey(k); setSortDir(d);
                                    localStorage.setItem('playlists-sort-key', k);
                                    localStorage.setItem('playlists-sort-dir', d);
                                }}
                                className="text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="publishedAt-desc">Newest first</option>
                                <option value="publishedAt-asc">Oldest first</option>
                                <option value="title-asc">Title A–Z</option>
                                <option value="title-desc">Title Z–A</option>
                                <option value="itemCount-desc">Most videos</option>
                                <option value="itemCount-asc">Fewest videos</option>
                                <option value="privacyStatus-asc">Privacy A–Z</option>
                                <option value="privacyStatus-desc">Privacy Z–A</option>
                            </select>
                        )}
                        {/* View toggle */}
                        {playlists.length > 0 && uiMounted && (
                            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-0.5">
                                <button
                                    onClick={() => toggleView('grid')}
                                    aria-label="Grid view"
                                    title="Grid view"
                                    className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => toggleView('table')}
                                    aria-label="Table view"
                                    title="Table view"
                                    className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setCreating(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                            Create Playlist
                        </button>
                    </div>
                </div>

                {playlists.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 p-8 text-center">
                        <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex items-center justify-center">
                            <span aria-hidden="true">♫</span>
                        </div>
                        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100">No playlists yet</h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Create a playlist to organise your streams and videos.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                            <button
                                onClick={() => setCreating(true)}
                                className="inline-flex px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                            >
                                Create Playlist
                            </button>
                            <a
                                href="https://studio.youtube.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Open YouTube Studio
                            </a>
                        </div>
                    </div>
                ) : !uiMounted ? (
                    viewMode === 'table' ? (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        {['Title', 'Created', 'Videos', 'Privacy', 'Actions'].map((h) => (
                                            <th key={h} className="py-2.5 px-4 text-left text-xs text-gray-400 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="py-3 px-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" /></td>
                                            <td className="py-3 px-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" /></td>
                                            <td className="py-3 px-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8 mx-auto" /></td>
                                            <td className="py-3 px-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" /></td>
                                            <td className="py-3 px-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24 ml-auto" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mb-3" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2 mb-2" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
                                </div>
                            ))}
                        </div>
                    )
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sorted.map((playlist) => (
                            <PlaylistCard
                                key={playlist.id}
                                playlist={playlist}
                                onEdit={setEditingPlaylist}
                                onDelete={setDeletingPlaylist}
                                onView={handleView}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                <tr>
                                    {([
                                        { key: 'title' as const, label: 'Title', align: 'text-left' },
                                        { key: 'publishedAt' as const, label: 'Created', align: 'text-left' },
                                        { key: 'itemCount' as const, label: 'Videos', align: 'text-center' },
                                        { key: 'privacyStatus' as const, label: 'Privacy', align: 'text-left' },
                                    ]).map(({ key, label, align }) => (
                                        <th
                                            key={key}
                                            onClick={() => handleSort(key)}
                                            className={`py-2.5 px-4 cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-200 transition-colors whitespace-nowrap ${align}`}
                                        >
                                            {label}
                                            {sortKey === key && (
                                                <span className="ml-1 text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </th>
                                    ))}
                                    <th className="py-2.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                {sorted.map((playlist) => (
                                    <PlaylistTableRow
                                        key={playlist.id}
                                        playlist={playlist}
                                        onEdit={setEditingPlaylist}
                                        onDelete={setDeletingPlaylist}
                                        onView={handleView}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create playlist modal */}
            {creating && (
                <PlaylistEditModal
                    mode="create"
                    loading={createLoading}
                    onSubmit={handleCreate}
                    onClose={() => setCreating(false)}
                />
            )}

            {/* Edit playlist modal */}
            {editingPlaylist && (
                <PlaylistEditModal
                    mode="edit"
                    initialData={{
                        title: editingPlaylist.title,
                        description: editingPlaylist.description,
                        privacyStatus: editingPlaylist.privacyStatus,
                    }}
                    loading={editLoading}
                    onSubmit={handleEdit}
                    onClose={() => setEditingPlaylist(null)}
                />
            )}

            {/* Delete playlist modal */}
            {deletingPlaylist && (
                <DeletePlaylistModal
                    playlist={deletingPlaylist}
                    loading={deleteLoading}
                    onConfirm={handleDelete}
                    onClose={() => setDeletingPlaylist(null)}
                />
            )}

            {/* View playlist items drawer/modal */}
            {viewingPlaylist && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-end bg-black/50"
                    onClick={(e) => e.target === e.currentTarget && setViewingPlaylist(null)}
                >
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg h-full overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div>
                                <h5 className="text-base font-semibold dark:text-gray-100">{viewingPlaylist.title}</h5>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {viewingPlaylist.itemCount} video{viewingPlaylist.itemCount !== 1 ? 's' : ''} · {viewingPlaylist.privacyStatus}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingPlaylist(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-4">
                            {viewLoading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex gap-3 animate-pulse">
                                            <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : viewItems.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                                    This playlist is empty.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {viewItems.map((item, idx) => (
                                        <div key={item.id} className="flex gap-3 group">
                                            <div className="relative flex-shrink-0">
                                                <span className="absolute top-0 left-0 bg-black/70 text-white text-[10px] px-1 rounded-br z-10">
                                                    {idx + 1}
                                                </span>
                                                {item.thumbnail ? (
                                                    <img
                                                        src={item.thumbnail.url}
                                                        alt=""
                                                        className="w-24 h-16 object-cover rounded"
                                                        width={item.thumbnail.width}
                                                        height={item.thumbnail.height}
                                                    />
                                                ) : (
                                                    <div className="w-24 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">
                                                        No thumb
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <a
                                                    href={`https://www.youtube.com/watch?v=${item.videoId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-medium dark:text-gray-100 hover:underline line-clamp-2"
                                                >
                                                    {item.title}
                                                </a>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                    Added {toLocalDatetime(item.publishedAt)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                disabled={removingItemId === item.id}
                                                className="self-center opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 disabled:opacity-50"
                                                title="Remove from playlist"
                                            >
                                                {removingItemId === item.id ? (
                                                    <span className="text-xs">…</span>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                        <path fillRule="evenodd" d="M8.5 3a1 1 0 00-1 1V5H5a1 1 0 000 2h.293l.853 8.536A2 2 0 008.137 17h3.726a2 2 0 001.99-1.464L14.707 7H15a1 1 0 100-2h-2.5V4a1 1 0 00-1-1h-3zM9.5 5V4h1v1h-1z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
