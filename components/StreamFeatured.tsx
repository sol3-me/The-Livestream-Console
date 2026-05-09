'use client';
import type { FormattedStream } from '@/lib/types';
import { toLocalDatetime } from '@/lib/utils';

interface StreamFeaturedProps {
  active: FormattedStream[];
  last: FormattedStream[];
  onStop: (stream: FormattedStream) => void;
  onEdit: (stream: FormattedStream) => void;
}

function IframeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="relative w-full pb-[56.25%] h-0 overflow-hidden rounded">
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded"
        loading="lazy"
        src={`https://www.youtube.com/embed/${videoId}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
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
        <div className="border-2 border-red-400 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IframeEmbed videoId={stream.id} />
            <div>
              <h2 className="text-xl font-semibold mb-2 dark:text-gray-100">{stream.title}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{stream.description}</p>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 select-none">
                  <input type="checkbox" checked={stream.enableAutoStart} disabled readOnly />
                  auto-start
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 select-none">
                  <input type="checkbox" checked={stream.enableAutoStop} disabled readOnly />
                  auto-stop
                </label>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                <strong>Live Since:</strong> {toLocalDatetime(stream.actualStartTime)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-mono">{stream.id}</p>
              {stream.streamKeyName ? (
                <p className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mb-4 font-mono">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
                    <path fillRule="evenodd" d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707L8.196 8.39A5.002 5.002 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                  {stream.streamKeyName}
                </p>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-600 mb-4 italic">No key bound</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onStop(stream)}
                  className="inline-flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M6 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H6z" />
                  </svg>
                  STOP
                </button>
                <a
                  href={stream.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M10 3a7 7 0 105.293 11.586l.56.56a1 1 0 101.414-1.414l-.56-.56A7 7 0 0010 3zm0 2a5 5 0 110 10 5 5 0 010-10zm-1 2.5a1 1 0 012 0V10h2.5a1 1 0 110 2H10a1 1 0 01-1-1V7.5z" />
                  </svg>
                  View
                </a>
                <a
                  href={stream.controlRoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M3 5a2 2 0 012-2h6a2 2 0 012 2v2.382l2.447-1.632A1 1 0 0117 6.618v6.764a1 1 0 01-1.553.832L13 12.582V15a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                  </svg>
                  Live Control
                </a>
                <button
                  onClick={() => onEdit(stream)}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M4 13.5V16h2.5l7.37-7.37-2.5-2.5L4 13.5zm10.71-6.21a1 1 0 000-1.41l-1.59-1.59a1 1 0 00-1.41 0l-.88.88 2.5 2.5.88-.88z" />
                  </svg>
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
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
        <div className="border-2 border-green-400 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IframeEmbed videoId={stream.id} />
            <div>
              <h2 className="text-xl font-semibold mb-2 dark:text-gray-100">{stream.title}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{stream.description}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                <strong>Scheduled For:</strong> {toLocalDatetime(stream.startTime)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                <strong>Start Date:</strong> {toLocalDatetime(stream.actualStartTime)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                <strong>End Date:</strong> {toLocalDatetime(stream.actualEndTime)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 font-mono">{stream.id}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={stream.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M10 3a7 7 0 105.293 11.586l.56.56a1 1 0 101.414-1.414l-.56-.56A7 7 0 0010 3zm0 2a5 5 0 110 10 5 5 0 010-10zm-1 2.5a1 1 0 012 0V10h2.5a1 1 0 110 2H10a1 1 0 01-1-1V7.5z" />
                  </svg>
                  View
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
