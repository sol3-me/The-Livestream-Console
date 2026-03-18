'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CreateStreamModal from './modals/CreateStreamModal';

export default function DashboardActions() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (data: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/streams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { errors?: { message: string }[]; error?: string };
      if (!res.ok) throw json;
      setIsCreating(false);
      router.push('/streams');
      router.refresh();
    } catch (e) {
      const err = e as { errors?: { message: string }[]; error?: string };
      setError(err.errors?.[0]?.message ?? err.error ?? 'Failed to create stream.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}
      <button
        onClick={() => setIsCreating(true)}
        className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
      >
        Create Stream
      </button>
      {isCreating && (
        <CreateStreamModal
          loading={loading}
          onSubmit={handleCreate}
          onClose={() => setIsCreating(false)}
        />
      )}
    </>
  );
}
