'use client';
import { toLocalDatetime } from '@/lib/utils';
import type { FormattedStream } from '@/lib/types';

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
        <div className="border-2 border-red-400 rounded-lg p-4 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IframeEmbed videoId={stream.id} />
            <div>
              <h2 className="text-xl font-semibold mb-2">{stream.title}</h2>
              <p className="text-gray-500 text-sm mb-3">{stream.description}</p>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 select-none">
                  <input type="checkbox" checked={stream.enableAutoStart} disabled readOnly />
                  auto-start
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 select-none">
                  <input type="checkbox" checked={stream.enableAutoStop} disabled readOnly />
                  auto-stop
                </label>
              </div>
              <p className="text-xs text-gray-400 mb-1">
                <strong>Live Since:</strong> {toLocalDatetime(stream.actualStartTime)}
              </p>
              <p className="text-xs text-gray-400 mb-4 font-mono">{stream.id}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onStop(stream)}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  STOP
                </button>
                <a
                  href={stream.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  View
                </a>
                <a
                  href={stream.controlRoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  Live Control
                </a>
                <button
                  onClick={() => onEdit(stream)}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                >
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
        <div className="border-2 border-green-400 rounded-lg p-4 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IframeEmbed videoId={stream.id} />
            <div>
              <h2 className="text-xl font-semibold mb-2">{stream.title}</h2>
              <p className="text-gray-500 text-sm mb-3">{stream.description}</p>
              <p className="text-xs text-gray-400 mb-1">
                <strong>Start Date:</strong> {toLocalDatetime(stream.actualStartTime)}
              </p>
              <p className="text-xs text-gray-400 mb-1">
                <strong>End Date:</strong> {toLocalDatetime(stream.actualEndTime)}
              </p>
              <p className="text-xs text-gray-400 mb-4 font-mono">{stream.id}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={stream.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  View
                </a>
                <button
                  onClick={() => onEdit(stream)}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
