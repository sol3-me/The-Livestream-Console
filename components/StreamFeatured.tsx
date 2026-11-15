'use client';
import type { FormattedStream } from '@/lib/types';
import { toLocalDatetime } from '@/lib/utils';
import { useState } from 'react';

interface StreamFeaturedProps {
  active: FormattedStream[];
  last: FormattedStream[];
  onStop: (stream: FormattedStream) => void;
  onEdit: (stream: FormattedStream) => void;
}

function IframeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="relative w-full pb-[56.25%] h-0 overflow-hidden bg-gray-100 dark:bg-gray-900">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        loading="lazy"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      const fallback = document.createElement('textarea');
      fallback.value = id;
      fallback.style.position = 'fixed';
      fallback.style.left = '-9999px';
      document.body.appendChild(fallback);
      fallback.focus();
      fallback.select();
      document.execCommand('copy');
      document.body.removeChild(fallback);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="font-mono underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      title="Copy stream ID"
    >
      {copied ? 'Copied!' : id}
    </button>
  );
}

function CardShell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
      {children}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
        {footer}
      </div>
    </div>
  );
}

function ToggleRows({ stream }: { stream: FormattedStream }) {
  return (
    <div className="flex gap-4 mb-3">
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
  );
}

function StreamKeyLine({ stream }: { stream: FormattedStream }) {
  if (!stream.streamKeyName) {
    return <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600 mb-3 italic">No key bound</p>;
  }
  return (
    <p className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mb-3 font-mono">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
        <path
          fillRule="evenodd"
          d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707L8.196 8.39A5.002 5.002 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z"
          clipRule="evenodd"
        />
      </svg>
      {stream.streamKeyName}
    </p>
  );
}

export default function StreamFeatured({ active, last, onStop, onEdit }: StreamFeaturedProps) {
  if (active.length > 0) {
    const stream = active[0];
    return (
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-4">
          Active Stream{' '}
          <span className="inline-block align-middle bg-red-600 text-white text-sm px-2 py-0.5 rounded">
            Live
          </span>
        </h1>
        <CardShell
          footer={
            <>
              {toLocalDatetime(stream.actualStartTime ?? stream.startTime)} ·{' '}
              <CopyIdButton id={stream.id} />
            </>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700">
              <IframeEmbed videoId={stream.id} />
            </div>
            <div className="p-4 flex flex-col">
              <h2 className="text-base font-semibold mb-2 line-clamp-2 dark:text-gray-100">{stream.title}</h2>
              <ToggleRows stream={stream} />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-3">{stream.description}</p>
              <StreamKeyLine stream={stream} />
              <div className="flex items-center gap-2 flex-wrap mt-auto">
                <button
                  onClick={() => onStop(stream)}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M6 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H6z" />
                  </svg>
                  Stop
                </button>
                <a
                  href={stream.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  View
                </a>
                <a
                  href={stream.controlRoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Live Control
                </a>
                <button
                  onClick={() => onEdit(stream)}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </CardShell>
      </div>
    );
  }

  if (last.length > 0) {
    const stream = last[0];
    return (
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-4">
          Last Stream{' '}
          <span className="inline-block align-middle bg-green-600 text-white text-sm px-2 py-0.5 rounded">
            Complete
          </span>
        </h1>
        <CardShell
          footer={
            <>
              {toLocalDatetime(stream.startTime)} ·{' '}
              <CopyIdButton id={stream.id} />
            </>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700">
              <IframeEmbed videoId={stream.id} />
            </div>
            <div className="p-4 flex flex-col">
              <h2 className="text-base font-semibold mb-2 line-clamp-2 dark:text-gray-100">{stream.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-3">{stream.description}</p>
              <div className="space-y-0.5 mb-3">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  <strong>Scheduled For:</strong> {toLocalDatetime(stream.startTime)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  <strong>Start Date:</strong> {toLocalDatetime(stream.actualStartTime)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  <strong>End Date:</strong> {toLocalDatetime(stream.actualEndTime)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-auto">
                <a
                  href={stream.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  View
                </a>
              </div>
            </div>
          </div>
        </CardShell>
      </div>
    );
  }

  return null;
}
