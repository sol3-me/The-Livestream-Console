'use client';
import type { FormattedStream, StreamsData, StreamsPageError } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ErrorDisplay from './ErrorDisplay';
import StreamCard from './StreamCard';
import StreamFeatured from './StreamFeatured';
import StreamTableRow from './StreamTableRow';
import DeleteStreamModal from './modals/DeleteStreamModal';
import EditStreamModal from './modals/EditStreamModal';
import StopStreamModal from './modals/StopStreamModal';

type ViewMode = 'grid' | 'table';
type SortKey = 'title' | 'startTime' | 'privacyStatus' | 'enableAutoStart' | 'enableAutoStop';
type SortDir = 'asc' | 'desc';

interface StreamsClientProps {
  streams: StreamsData | null;
  error: StreamsPageError | null;
}

export default function StreamsClient({ streams, error }: StreamsClientProps) {
  const router = useRouter();
  const [clientError, setClientError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stoppingStream, setStoppingStream] = useState<FormattedStream | null>(null);
  const [editingStream, setEditingStream] = useState<FormattedStream | null>(null);
  const [deletingStream, setDeletingStream] = useState<FormattedStream | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('startTime');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [uiMounted, setUiMounted] = useState(false);

  // Restore persisted view, sort column, and sort direction preferences
  useEffect(() => {
    const storedView = localStorage.getItem('streams-view') as ViewMode | null;
    if (storedView === 'grid' || storedView === 'table') setView(storedView);

    const storedKey = localStorage.getItem('streams-sort-key') as SortKey | null;
    const validKeys: SortKey[] = ['title', 'startTime', 'privacyStatus', 'enableAutoStart', 'enableAutoStop'];
    if (storedKey && validKeys.includes(storedKey)) setSortKey(storedKey);

    const storedDir = localStorage.getItem('streams-sort-dir') as SortDir | null;
    if (storedDir === 'asc' || storedDir === 'desc') setSortDir(storedDir);

    setUiMounted(true);
  }, []);

  const toggleView = (next: ViewMode) => {
    setView(next);
    localStorage.setItem('streams-view', next);
  };

  const handleSort = (key: SortKey) => {
    const nextDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(nextDir);
    localStorage.setItem('streams-sort-key', key);
    localStorage.setItem('streams-sort-dir', nextDir);
  };

  const sortedUpcoming = useMemo(() => {
    if (!streams?.upcoming) return [];
    return [...streams.upcoming].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === 'boolean' && typeof bv === 'boolean') {
        cmp = Number(av) - Number(bv);
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [streams?.upcoming, sortKey, sortDir]);


  const handleStop = useCallback(async () => {
    if (!stoppingStream) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/streams/stop/${stoppingStream.id}`, { method: 'POST' });
      const data = (await res.json()) as { errors?: { message: string }[] };
      if (!res.ok) throw data;
      setStoppingStream(null);
      router.refresh();
    } catch (e) {
      const err = e as { errors?: { message: string }[] };
      setClientError(err.errors?.[0]?.message ?? 'Failed to stop stream.');
      setStoppingStream(null);
    } finally {
      setLoading(false);
    }
  }, [stoppingStream, router]);

  const handleEdit = useCallback(
    async (formData: Record<string, string>) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/streams/edit/${formData.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = (await res.json()) as { errors?: { message: string }[] };
        if (!res.ok) throw data;
        setEditingStream(null);
        router.refresh();
      } catch (e) {
        const err = e as { errors?: { message: string }[] };
        setClientError(err.errors?.[0]?.message ?? 'Failed to edit stream.');
        setEditingStream(null);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const handleDelete = useCallback(async () => {
    if (!deletingStream) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/streams/delete/${deletingStream.id}`, { method: 'DELETE' });
      const data = (await res.json()) as { errors?: { message: string }[] };
      if (!res.ok) throw data;
      setDeletingStream(null);
      router.refresh();
    } catch (e) {
      const err = e as { errors?: { message: string }[] };
      setClientError(err.errors?.[0]?.message ?? 'Failed to delete stream.');
      setDeletingStream(null);
    } finally {
      setLoading(false);
    }
  }, [deletingStream, router]);

  return (
    <div className="py-10">
      <div className="max-w-7xl mx-auto px-4">
        {(clientError || error) && (
          <ErrorDisplay
            message={clientError ?? error?.errorMessage ?? ''}
            helpLink={!clientError ? error?.helpLink : undefined}
            onDismiss={() => setClientError(null)}
          />
        )}

        {streams && (
          <>
            <StreamFeatured
              active={streams.active}
              last={streams.last}
              onStop={setStoppingStream}
              onEdit={setEditingStream}
            />
            <div>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
                <h1 className="text-3xl font-light">Upcoming Streams</h1>
                {uiMounted ? (
                  <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-0.5">
                    <button
                      onClick={() => toggleView('grid')}
                      aria-label="Grid view"
                      title="Grid view"
                      className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                      {/* 3-col grid icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm6.5-9A2.25 2.25 0 008.5 4.25v2.5A2.25 2.25 0 0010.75 9h2.5A2.25 2.25 0 0015.5 6.75v-2.5A2.25 2.25 0 0013.25 2h-2.5zm0 9a2.25 2.25 0 00-2.25 2.25v2.5A2.25 2.25 0 0010.75 18h2.5a2.25 2.25 0 002.25-2.25v-2.5A2.25 2.25 0 0013.25 11h-2.5zm6.5-9A2.25 2.25 0 0015 4.25v2.5A2.25 2.25 0 0017.25 9h.5A2.25 2.25 0 0020 6.75v-2.5A2.25 2.25 0 0017.75 2h-.5z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleView('table')}
                      aria-label="Table view"
                      title="Table view"
                      className={`p-1.5 rounded transition-colors ${view === 'table' ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                      {/* list/table icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-0.5">
                    <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-4">Showing top 10 results.</p>

              {!uiMounted ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                      <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      <div className="p-4 flex flex-col gap-3 flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="h-7 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedUpcoming.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm">No upcoming streams found.</p>
              ) : view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedUpcoming.map((stream) => (
                    <StreamCard
                      key={stream.id}
                      stream={stream}
                      onEdit={setEditingStream}
                      onDelete={setDeletingStream}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      <tr>
                        {(
                          [
                            { key: 'title', label: 'Title' },
                            { key: 'startTime', label: 'Scheduled' },
                            { key: 'privacyStatus', label: 'Privacy' },
                            { key: 'enableAutoStart', label: 'Auto-start' },
                            { key: 'enableAutoStop', label: 'Auto-stop' },
                          ] as { key: SortKey; label: string }[]
                        ).map(({ key, label }) => (
                          <th
                            key={key}
                            onClick={() => handleSort(key)}
                            className="py-2.5 px-4 text-left cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-200 transition-colors whitespace-nowrap"
                          >
                            {label}
                            {sortKey === key && (
                              <span className="ml-1 text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                        ))}
                        <th className="py-2.5 px-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      {sortedUpcoming.map((stream) => (
                        <StreamTableRow
                          key={stream.id}
                          stream={stream}
                          onEdit={setEditingStream}
                          onDelete={setDeletingStream}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {stoppingStream && (
        <StopStreamModal
          stream={stoppingStream}
          loading={loading}
          onConfirm={handleStop}
          onClose={() => setStoppingStream(null)}
        />
      )}
      {editingStream && (
        <EditStreamModal
          stream={editingStream}
          loading={loading}
          onSubmit={handleEdit}
          onClose={() => setEditingStream(null)}
        />
      )}
      {deletingStream && (
        <DeleteStreamModal
          stream={deletingStream}
          loading={loading}
          onConfirm={handleDelete}
          onClose={() => setDeletingStream(null)}
        />
      )}
    </div>
  );
}
