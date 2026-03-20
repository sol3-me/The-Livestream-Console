'use client';
import type { FormattedPlaylist } from '@/lib/types';
import { formatPlaylists } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PlaylistMultiSelectProps {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    /** When provided, auto-loads the playlists that already contain this video. */
    videoId?: string;
}

export default function PlaylistMultiSelect({ selectedIds, onChange, videoId }: PlaylistMultiSelectProps) {
    const [playlists, setPlaylists] = useState<FormattedPlaylist[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/playlists');
                if (res.ok) {
                    const data = (await res.json()) as unknown[];
                    setPlaylists(formatPlaylists(data));
                }
            } catch { /* ignore */ }

            if (videoId) {
                try {
                    const res = await fetch(`/api/playlists/membership?videoId=${encodeURIComponent(videoId)}`);
                    if (res.ok) {
                        const ids = (await res.json()) as string[];
                        if (ids.length > 0) onChange(ids);
                    }
                } catch { /* ignore */ }
            }

            setLoading(false);
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Position dropdown below the button
    useEffect(() => {
        if (!open || !btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                btnRef.current?.contains(e.target as Node) ||
                dropRef.current?.contains(e.target as Node)
            ) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const toggle = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((x) => x !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectedNames = playlists
        .filter((p) => selectedIds.includes(p.id))
        .map((p) => p.title);

    return (
        <div className="relative">
            <button
                ref={btnRef}
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-between"
            >
                <span className={selectedNames.length === 0 ? 'text-gray-400 dark:text-gray-500' : ''}>
                    {loading
                        ? 'Loading playlists…'
                        : selectedNames.length === 0
                            ? 'None selected'
                            : selectedNames.length <= 2
                                ? selectedNames.join(', ')
                                : `${selectedNames.length} playlists selected`}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                    className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>
            {open && createPortal(
                <div
                    ref={dropRef}
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
                    className="z-[100] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                    {loading ? (
                        <div className="px-3 py-2 text-sm text-gray-400">Loading…</div>
                    ) : playlists.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">No playlists found</div>
                    ) : (
                        playlists.map((p) => (
                            <label
                                key={p.id}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer select-none"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(p.id)}
                                    onChange={() => toggle(p.id)}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 accent-blue-600"
                                />
                                <span className="dark:text-gray-100 truncate">{p.title}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0">
                                    {p.itemCount} video{p.itemCount !== 1 ? 's' : ''}
                                </span>
                            </label>
                        ))
                    )}
                </div>,
                document.body,
            )}
        </div>
    );
}
