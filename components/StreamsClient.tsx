'use client';
import type { FormattedStream, StreamsData, StreamsPageError } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import ErrorDisplay from './ErrorDisplay';
import StreamCard from './StreamCard';
import StreamFeatured from './StreamFeatured';
import DeleteStreamModal from './modals/DeleteStreamModal';
import EditStreamModal from './modals/EditStreamModal';
import StopStreamModal from './modals/StopStreamModal';

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
              <h1 className="text-3xl font-light mb-1">Upcoming Streams</h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-4">Showing top 10 results.</p>
              {streams.upcoming.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm">No upcoming streams found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {streams.upcoming.map((stream) => (
                    <StreamCard
                      key={stream.id}
                      stream={stream}
                      onEdit={setEditingStream}
                      onDelete={setDeletingStream}
                    />
                  ))}
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
