'use client';
import type { FormattedPlaylist } from '@/lib/types';
import { toLocalDatetime } from '@/lib/utils';

interface PlaylistTableRowProps {
    playlist: FormattedPlaylist;
    onEdit: (playlist: FormattedPlaylist) => void;
    onDelete: (playlist: FormattedPlaylist) => void;
    onView: (playlist: FormattedPlaylist) => void;
}

export default function PlaylistTableRow({ playlist, onEdit, onDelete, onView }: PlaylistTableRowProps) {
    return (
        <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
            <td className="py-3 px-4 max-w-[250px]">
                <span className="font-medium text-sm dark:text-gray-100 line-clamp-2">{playlist.title}</span>
            </td>
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {toLocalDatetime(playlist.publishedAt)}
            </td>
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                {playlist.itemCount}
            </td>
            <td className="py-3 px-4">
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${playlist.privacyStatus === 'public'
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                        : playlist.privacyStatus === 'unlisted'
                            ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                    {playlist.privacyStatus}
                </span>
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => onView(playlist)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="View items"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        View
                    </button>
                    <a
                        href={`https://www.youtube.com/playlist?list=${playlist.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="Open on YouTube"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                        </svg>
                        YT
                    </a>
                    <button
                        onClick={() => onEdit(playlist)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="Edit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path d="M4 13.5V16h2.5l7.37-7.37-2.5-2.5L4 13.5zm10.71-6.21a1 1 0 000-1.41l-1.59-1.59a1 1 0 00-1.41 0l-.88.88 2.5 2.5.88-.88z" />
                        </svg>
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(playlist)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        title="Delete"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M8.5 3a1 1 0 00-1 1V5H5a1 1 0 000 2h.293l.853 8.536A2 2 0 008.137 17h3.726a2 2 0 001.99-1.464L14.707 7H15a1 1 0 100-2h-2.5V4a1 1 0 00-1-1h-3zM9.5 5V4h1v1h-1z" clipRule="evenodd" />
                        </svg>
                        Del
                    </button>
                </div>
            </td>
        </tr>
    );
}
