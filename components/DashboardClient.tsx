'use client';
import type { FormattedStream } from '@/lib/types';
import { toLocalDatetime } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CreateStreamModal from './modals/CreateStreamModal';
import EditStreamModal from './modals/EditStreamModal';
import StopStreamModal from './modals/StopStreamModal';

type Timeframe = 'day' | '7d' | '30d';

const TF_LABELS: Record<Timeframe, string> = { day: 'Today', '7d': '7 Days', '30d': '30 Days' };

function getTimeframeCutoff(tf: Timeframe): Date {
  const now = new Date();
  if (tf === 'day') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (tf === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

interface Props {
  activeStreams: FormattedStream[];
  completedStreams: FormattedStream[];
  upcomingCount: number;
}

export default function DashboardClient({ activeStreams, completedStreams, upcomingCount }: Props) {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [stoppingStream, setStoppingStream] = useState<FormattedStream | null>(null);
  const [editingStream, setEditingStream] = useState<FormattedStream | null>(null);
  const [stopLoading, setStopLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const activeStream = activeStreams[0] ?? null;

  const streamsInPeriod = completedStreams.filter((s) => {
    const dateStr = s.actualStartTime ?? s.startTime;
    return dateStr && new Date(dateStr) >= getTimeframeCutoff(timeframe);
  });

  const handleStop = async () => {
    if (!stoppingStream) return;
    setStopLoading(true);
    try {
      const res = await fetch(`/api/streams/stop/${stoppingStream.id}`, { method: 'POST' });
      if (!res.ok) throw await res.json();
      toast.success('Stream stopped');
      setStoppingStream(null);
      router.refresh();
    } catch {
      toast.error('Failed to stop stream');
      setStoppingStream(null);
    } finally {
      setStopLoading(false);
    }
  };

  const handleEdit = async (formData: Record<string, string>) => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/streams/edit/${formData.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw await res.json();
      toast.success('Stream updated');
      setEditingStream(null);
      router.refresh();
    } catch {
      toast.error('Failed to update stream');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreate = async (formData: Record<string, string>) => {
    setCreateLoading(true);
    try {
      const res = await fetch('/api/streams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw await res.json();
      toast.success('Stream created');
      setIsCreating(false);
      router.push('/streams');
    } catch {
      toast.error('Failed to create stream');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <section className="py-10 container mx-auto px-4 max-w-3xl">
      <h1 className="text-4xl font-light mb-2 text-center">Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
        Your livestream control centre.
      </p>

      {/* Primary actions — always prominent */}
      <div className="flex justify-center gap-4 flex-wrap mb-8">
        <Link
          href="/streams"
          className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Upcoming Streams
        </Link>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors"
        >
          Create Stream
        </button>
      </div>

      {/* Active stream card */}
      {activeStream && (
        <div className="mb-6 rounded-xl border-2 border-red-500 dark:border-red-600 bg-white dark:bg-gray-800 shadow-sm p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">
                  ● LIVE
                </span>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {activeStream.title}
                </h2>
              </div>
              {activeStream.streamKeyName && (
                <p className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-mono mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0">
                    <path fillRule="evenodd" d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707L8.196 8.39A5.002 5.002 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                  {activeStream.streamKeyName}
                </p>
              )}
              {activeStream.actualStartTime && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Live since {toLocalDatetime(activeStream.actualStartTime)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setStoppingStream(activeStream)}
                className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Stop
              </button>
              <button
                onClick={() => setEditingStream(activeStream)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Edit
              </button>
              <a
                href={activeStream.controlRoomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Control Room ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stream history metrics */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Stream History
          </h2>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
            {(Object.keys(TF_LABELS) as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {TF_LABELS[tf]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {streamsInPeriod.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Completed in {TF_LABELS[timeframe].toLowerCase()}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{upcomingCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upcoming scheduled</p>
          </div>
          {activeStream ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4 text-center">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">1</p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">Currently live</p>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {completedStreams.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All completed</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {stoppingStream && (
        <StopStreamModal
          stream={stoppingStream}
          loading={stopLoading}
          onConfirm={handleStop}
          onClose={() => setStoppingStream(null)}
        />
      )}
      {editingStream && (
        <EditStreamModal
          stream={editingStream}
          loading={editLoading}
          onSubmit={handleEdit}
          onClose={() => setEditingStream(null)}
        />
      )}
      {isCreating && (
        <CreateStreamModal
          loading={createLoading}
          onSubmit={handleCreate}
          onClose={() => setIsCreating(false)}
        />
      )}
    </section>
  );
}
