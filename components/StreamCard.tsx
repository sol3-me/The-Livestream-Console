'use client';
import type { FormattedStream } from '@/lib/types';
import { toLocalDatetime } from '@/lib/utils';
import { useState } from 'react';

interface StreamCardProps {
  stream: FormattedStream;
  onEdit: (stream: FormattedStream) => void;
  onDelete: (stream: FormattedStream) => void;
  onCopy: (stream: FormattedStream) => void;
  selected?: boolean;
  onSelect?: (stream: FormattedStream, e: React.MouseEvent) => void;
}

export default function StreamCard({ stream, onEdit, onDelete, onCopy, selected, onSelect }: StreamCardProps) {
  const [copied, setCopied] = useState(false);
  const showCompletedEmbed = stream.isComplete && !!stream.id;

  const handleCopyId = async () => {
    if (!stream.id) return;
    try {
      await navigator.clipboard.writeText(stream.id);
    } catch {
      const fallbackInput = document.createElement('textarea');
      fallbackInput.value = stream.id;
      fallbackInput.style.position = 'fixed';
      fallbackInput.style.left = '-9999px';
      document.body.appendChild(fallbackInput);
      fallbackInput.focus();
      fallbackInput.select();
      document.execCommand('copy');
      document.body.removeChild(fallbackInput);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden flex flex-col ${selected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-200 dark:border-gray-700'}`}>
      {onSelect && (
        <div className="px-4 pt-3 pb-0">
          <label
            className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none"
            onClick={(e) => { e.preventDefault(); onSelect(stream, e); }}
          >
            <input
              type="checkbox"
              checked={selected ?? false}
              readOnly
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 accent-blue-600 pointer-events-none"
            />
            Select
          </label>
        </div>
      )}
      {showCompletedEmbed ? (
        <div className="relative w-full pb-[56.25%] h-0 overflow-hidden">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            loading="lazy"
            src={`https://www.youtube.com/embed/${stream.id}`}
            title={`YouTube video player for ${stream.title}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        stream.thumbnail && (
          <img
            src={stream.thumbnail.url}
            alt="video thumbnail"
            className="w-full object-cover"
            width={stream.thumbnail.width}
            height={stream.thumbnail.height}
          />
        )
      )}
      <div className="p-4 flex flex-col flex-1">
        <h5 className="font-semibold text-base mb-2 line-clamp-2 dark:text-gray-100">{stream.title}</h5>
        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 select-none">
            <input
              type="checkbox"
              checked={stream.enableAutoStart}
              readOnly
              tabIndex={-1}
              aria-label="Auto-start display only"
              title="Display only"
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 pointer-events-none accent-emerald-600"
            />
            auto-start
            <span className={`text-[11px] font-semibold ${stream.enableAutoStart ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {stream.enableAutoStart ? 'ON' : 'OFF'}
            </span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 select-none">
            <input
              type="checkbox"
              checked={stream.enableAutoStop}
              readOnly
              tabIndex={-1}
              aria-label="Auto-stop display only"
              title="Display only"
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 pointer-events-none accent-rose-600"
            />
            auto-stop
            <span className={`text-[11px] font-semibold ${stream.enableAutoStop ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {stream.enableAutoStop ? 'ON' : 'OFF'}
            </span>
          </label>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-3">{stream.description}</p>
        {stream.streamKeyName ? (
          <p className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mb-3 font-mono">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
              <path fillRule="evenodd" d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707L8.196 8.39A5.002 5.002 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z" clipRule="evenodd" />
            </svg>
            {stream.streamKeyName}
          </p>
        ) : (
          <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600 mb-3 italic">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
              <path fillRule="evenodd" d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707L8.196 8.39A5.002 5.002 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z" clipRule="evenodd" />
            </svg>
            No key bound
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={stream.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path d="M10 3a7 7 0 105.293 11.586l.56.56a1 1 0 101.414-1.414l-.56-.56A7 7 0 0010 3zm0 2a5 5 0 110 10 5 5 0 010-10zm-1 2.5a1 1 0 012 0V10h2.5a1 1 0 110 2H10a1 1 0 01-1-1V7.5z" />
            </svg>
            View
          </a>
          {!stream.isComplete && (
            <a
              href={stream.controlRoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path d="M3 5a2 2 0 012-2h6a2 2 0 012 2v2.382l2.447-1.632A1 1 0 0117 6.618v6.764a1 1 0 01-1.553.832L13 12.582V15a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
              </svg>
              Live Control
            </a>
          )}
          <button
            onClick={() => onEdit(stream)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path d="M4 13.5V16h2.5l7.37-7.37-2.5-2.5L4 13.5zm10.71-6.21a1 1 0 000-1.41l-1.59-1.59a1 1 0 00-1.41 0l-.88.88 2.5 2.5.88-.88z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => onCopy(stream)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path d="M6 2a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6z" />
              <path d="M3 7a1 1 0 011-1h1v6a3 3 0 003 3h6v1a1 1 0 01-1 1H6a3 3 0 01-3-3V7z" />
            </svg>
            Copy
          </button>
          <button
            onClick={() => onDelete(stream)}
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
        {toLocalDatetime(stream.startTime)} ·{' '}
        <button
          onClick={handleCopyId}
          className="font-mono underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Copy stream ID"
        >
          {copied ? 'Copied!' : stream.id}
        </button>
      </div>
    </div>
  );
}
