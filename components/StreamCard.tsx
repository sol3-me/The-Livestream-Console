'use client';
import { toLocalDatetime } from '@/lib/utils';
import type { FormattedStream } from '@/lib/types';

interface StreamCardProps {
  stream: FormattedStream;
  onEdit: (stream: FormattedStream) => void;
  onDelete: (stream: FormattedStream) => void;
}

export default function StreamCard({ stream, onEdit, onDelete }: StreamCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {stream.thumbnail && (
        <img
          src={stream.thumbnail.url}
          alt="video thumbnail"
          className="w-full object-cover"
          width={stream.thumbnail.width}
          height={stream.thumbnail.height}
        />
      )}
      <div className="p-4 flex flex-col flex-1">
        <h5 className="font-semibold text-base mb-2 line-clamp-2">{stream.title}</h5>
        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 select-none">
            <input type="checkbox" checked={stream.enableAutoStart} disabled readOnly className="accent-blue-600" />
            auto-start
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-500 select-none">
            <input type="checkbox" checked={stream.enableAutoStop} disabled readOnly className="accent-blue-600" />
            auto-stop
          </label>
        </div>
        <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1">{stream.description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={stream.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            View
          </a>
          <button
            onClick={() => onEdit(stream)}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(stream)}
            className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
        {toLocalDatetime(stream.startTime)} · <span className="font-mono">{stream.id}</span>
      </div>
    </div>
  );
}
