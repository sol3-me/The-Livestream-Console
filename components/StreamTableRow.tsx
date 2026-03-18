'use client';
import type { FormattedStream } from '@/lib/types';
import { toLocalDatetime } from '@/lib/utils';

interface StreamTableRowProps {
    stream: FormattedStream;
    onEdit: (stream: FormattedStream) => void;
    onDelete: (stream: FormattedStream) => void;
    onCopy: (stream: FormattedStream) => void;
}

export default function StreamTableRow({ stream, onEdit, onDelete, onCopy }: StreamTableRowProps) {
    return (
        <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
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
            <td className="py-3 px-4 text-center">
                <input type="checkbox" checked={stream.enableAutoStart} disabled readOnly className="accent-blue-600" />
            </td>
            <td className="py-3 px-4 text-center">
                <input type="checkbox" checked={stream.enableAutoStop} disabled readOnly className="accent-blue-600" />
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(stream)}
                        className="text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onCopy(stream)}
                        className="text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Copy
                    </button>
                    <button
                        onClick={() => onDelete(stream)}
                        className="text-xs px-2.5 py-1 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}
