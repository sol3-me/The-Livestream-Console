'use client';
import type { FormattedStream } from '@/lib/types';
import { toLocalDatetime } from '@/lib/utils';

interface StreamTableRowProps {
    stream: FormattedStream;
    onEdit: (stream: FormattedStream) => void;
    onDelete: (stream: FormattedStream) => void;
    onCopy: (stream: FormattedStream) => void;
    selected?: boolean;
    onSelect?: (stream: FormattedStream, e: React.MouseEvent) => void;
}

export default function StreamTableRow({ stream, onEdit, onDelete, onCopy, selected, onSelect }: StreamTableRowProps) {
    return (
        <tr className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${selected ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
            {onSelect && (
                <td className="py-3 px-4 w-10" onClick={(e) => onSelect(stream, e)}>
                    <input
                        type="checkbox"
                        checked={selected ?? false}
                        readOnly
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 accent-blue-600 pointer-events-none"
                    />
                </td>
            )}
            <td className="py-3 px-4 max-w-[220px]">
                <a
                    href={stream.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm text-blue-600 dark:text-blue-400 hover:underline line-clamp-2"
                >
                    {stream.title}
                </a>
            </td>
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {toLocalDatetime(stream.startTime)}
            </td>
            <td className="py-3 px-4">
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${stream.privacyStatus === 'public'
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                    : stream.privacyStatus === 'unlisted'
                        ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                    {stream.privacyStatus}
                </span>
            </td>
            <td className="py-3 px-4">
                {stream.streamKeyName ? (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-purple-700 dark:text-purple-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
                            <path fillRule="evenodd" d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707L8.196 8.39A5.002 5.002 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                        {stream.streamKeyName}
                    </span>
                ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-600 italic">—</span>
                )}
            </td>
            <td className="py-3 px-4 text-center">
                <div className="inline-flex items-center justify-center gap-1.5 mx-auto">
                    <input
                        type="checkbox"
                        checked={stream.enableAutoStart}
                        readOnly
                        tabIndex={-1}
                        aria-label="Auto-start display only"
                        title="Display only"
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 pointer-events-none accent-emerald-600"
                    />
                    <span className={`text-[11px] font-semibold ${stream.enableAutoStart ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {stream.enableAutoStart ? 'ON' : 'OFF'}
                    </span>
                </div>
            </td>
            <td className="py-3 px-4 text-center">
                <div className="inline-flex items-center justify-center gap-1.5 mx-auto">
                    <input
                        type="checkbox"
                        checked={stream.enableAutoStop}
                        readOnly
                        tabIndex={-1}
                        aria-label="Auto-stop display only"
                        title="Display only"
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 pointer-events-none accent-rose-600"
                    />
                    <span className={`text-[11px] font-semibold ${stream.enableAutoStop ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {stream.enableAutoStop ? 'ON' : 'OFF'}
                    </span>
                </div>
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                    {!stream.isComplete && (
                        <a
                            href={stream.controlRoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path d="M3 5a2 2 0 012-2h6a2 2 0 012 2v2.382l2.447-1.632A1 1 0 0117 6.618v6.764a1 1 0 01-1.553.832L13 12.582V15a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                            </svg>
                            Live
                        </a>
                    )}
                    <button
                        onClick={() => onEdit(stream)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path d="M4 13.5V16h2.5l7.37-7.37-2.5-2.5L4 13.5zm10.71-6.21a1 1 0 000-1.41l-1.59-1.59a1 1 0 00-1.41 0l-.88.88 2.5 2.5.88-.88z" />
                        </svg>
                        Edit
                    </button>
                    <button
                        onClick={() => onCopy(stream)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path d="M6 2a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6z" />
                            <path d="M3 7a1 1 0 011-1h1v6a3 3 0 003 3h6v1a1 1 0 01-1 1H6a3 3 0 01-3-3V7z" />
                        </svg>
                        Copy
                    </button>
                    <button
                        onClick={() => onDelete(stream)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M8.5 3a1 1 0 00-1 1V5H5a1 1 0 000 2h.293l.853 8.536A2 2 0 008.137 17h3.726a2 2 0 001.99-1.464L14.707 7H15a1 1 0 100-2h-2.5V4a1 1 0 00-1-1h-3zM9.5 5V4h1v1h-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}
