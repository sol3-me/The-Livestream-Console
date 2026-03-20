'use client';
import type { FormattedPlaylist } from '@/lib/types';
import { toLocalDatetime } from '@/lib/utils';

interface PlaylistCardProps {
    playlist: FormattedPlaylist;
    onEdit: (playlist: FormattedPlaylist) => void;
    onDelete: (playlist: FormattedPlaylist) => void;
    onView: (playlist: FormattedPlaylist) => void;
}

export default function PlaylistCard({ playlist, onEdit, onDelete, onView }: PlaylistCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            {playlist.thumbnail ? (
                <img
                    src={playlist.thumbnail.url}
                    alt="playlist thumbnail"
                    className="w-full object-cover aspect-video"
                    width={playlist.thumbnail.width}
                    height={playlist.thumbnail.height}
                />
            ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-purple-300 dark:text-purple-600">
                        <path fillRule="evenodd" d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.456.122z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
            <div className="p-4 flex flex-col flex-1">
                <h5 className="font-semibold text-base mb-1 line-clamp-2 dark:text-gray-100">{playlist.title}</h5>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {playlist.itemCount} video{playlist.itemCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                        {playlist.privacyStatus}
                    </span>
                </div>
                {playlist.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{playlist.description}</p>
                )}
                {!playlist.description && <div className="flex-1" />}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => onView(playlist)}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path d="M10 3a7 7 0 105.293 11.586l.56.56a1 1 0 101.414-1.414l-.56-.56A7 7 0 0010 3zm0 2a5 5 0 110 10 5 5 0 010-10zm-1 2.5a1 1 0 012 0V10h2.5a1 1 0 110 2H10a1 1 0 01-1-1V7.5z" />
                        </svg>
                        View Items
                    </button>
                    <a
                        href={`https://www.youtube.com/playlist?list=${playlist.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                        </svg>
                        YouTube
                    </a>
                    <button
                        onClick={() => onEdit(playlist)}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path d="M4 13.5V16h2.5l7.37-7.37-2.5-2.5L4 13.5zm10.71-6.21a1 1 0 000-1.41l-1.59-1.59a1 1 0 00-1.41 0l-.88.88 2.5 2.5.88-.88z" />
                        </svg>
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(playlist)}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M8.5 3a1 1 0 00-1 1V5H5a1 1 0 000 2h.293l.853 8.536A2 2 0 008.137 17h3.726a2 2 0 001.99-1.464L14.707 7H15a1 1 0 100-2h-2.5V4a1 1 0 00-1-1h-3zM9.5 5V4h1v1h-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
                Created {toLocalDatetime(playlist.publishedAt)} · <span className="font-mono">{playlist.id}</span>
            </div>
        </div>
    );
}
