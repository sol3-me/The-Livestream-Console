'use client';
import type { FormattedStream, StreamsData, StreamsPageError } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import ErrorDisplay from './ErrorDisplay';
import StreamCard from './StreamCard';
import StreamFeatured from './StreamFeatured';
import StreamTableRow from './StreamTableRow';
import AddToPlaylistModal from './modals/AddToPlaylistModal';
import CreateStreamModal from './modals/CreateStreamModal';
import DeleteStreamModal from './modals/DeleteStreamModal';
import EditStreamModal from './modals/EditStreamModal';
import Modal from './modals/Modal';
import StopStreamModal from './modals/StopStreamModal';


type ViewMode = 'grid' | 'table';
type SortKey = 'title' | 'startTime' | 'privacyStatus' | 'enableAutoStart' | 'enableAutoStop';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;
const VALID_SORT_KEYS: SortKey[] = ['title', 'startTime', 'privacyStatus', 'enableAutoStart', 'enableAutoStop'];

function sortStreams(streams: FormattedStream[], sortKey: SortKey, sortDir: SortDir) {
    return [...streams].sort((a, b) => {
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
}

function normalizeStartTime(raw?: string): string {
    if (!raw) return new Date().toISOString();
    return /[Z+]/.test(raw) ? raw : new Date(raw).toISOString();
}

function buildOptimisticCreatedStream(formData: Record<string, string>): FormattedStream {
    const tempId = `pending-${Date.now()}`;
    const startTime = normalizeStartTime(formData.startTime);
    return {
        id: tempId,
        title: formData.title ?? 'Untitled stream',
        description: formData.description ?? '',
        startTime,
        enableAutoStart: formData.autoStart === 'true',
        enableAutoStop: formData.autoStop === 'true',
        status: 'ready',
        isLive: false,
        isComplete: false,
        privacyStatus: formData.privacyStatus ?? 'private',
        videoLink: '#',
        controlRoomLink: 'https://studio.youtube.com',
    };
}

function applyEditToStream(stream: FormattedStream, formData: Record<string, string>): FormattedStream {
    if (stream.id !== formData.id) return stream;
    const updatedStart = formData.startTime ? normalizeStartTime(formData.startTime) : stream.startTime;
    return {
        ...stream,
        title: formData.title ?? stream.title,
        description: formData.description ?? stream.description,
        startTime: updatedStart,
        privacyStatus: formData.privacyStatus ?? stream.privacyStatus,
        enableAutoStart: formData.autoStart ? formData.autoStart === 'true' : stream.enableAutoStart,
        enableAutoStop: formData.autoStop ? formData.autoStop === 'true' : stream.enableAutoStop,
    };
}

function EmptyState({
    title,
    description,
    primaryLabel,
    onPrimaryClick,
    secondaryLabel,
    secondaryHref,
}: {
    title: string;
    description?: string;
    primaryLabel?: string;
    onPrimaryClick?: () => void;
    secondaryLabel?: string;
    secondaryHref?: string;
}) {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 p-8 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex items-center justify-center">
                <span aria-hidden="true">○</span>
            </div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100">{title}</h2>
            {description && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                {primaryLabel && onPrimaryClick && (
                    <button
                        onClick={onPrimaryClick}
                        className="inline-flex px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                        {primaryLabel}
                    </button>
                )}
                {secondaryLabel && secondaryHref && (
                    <a
                        href={secondaryHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        {secondaryLabel}
                    </a>
                )}
            </div>
        </div>
    );
}

function SectionPagination({
    page,
    totalPages,
    onPrevious,
    onNext,
}: {
    page: number;
    totalPages: number;
    onPrevious: () => void;
    onNext: () => void;
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-gray-400">
            <button
                onClick={onPrevious}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Back
            </button>
            <span>
                Page {page} of {totalPages}
            </span>
            <button
                onClick={onNext}
                disabled={page >= totalPages}
                className="px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Forward
            </button>
        </div>
    );
}

interface StreamsClientProps {
    streams: StreamsData | null;
    error: StreamsPageError | null;
}

export default function StreamsClient({ streams, error }: StreamsClientProps) {
    const router = useRouter();
    const [clientError, setClientError] = useState<string | null>(null);
    const [stopLoading, setStopLoading] = useState(false);
    const [stoppingStream, setStoppingStream] = useState<FormattedStream | null>(null);
    const [editingStream, setEditingStream] = useState<FormattedStream | null>(null);
    const [deletingStream, setDeletingStream] = useState<FormattedStream | null>(null);
    const [createStreamData, setCreateStreamData] = useState<Partial<FormattedStream> | null>(null);
    const [streamsState, setStreamsState] = useState<StreamsData | null>(streams);


    const [upcomingView, setUpcomingView] = useState<ViewMode>('grid');
    const [upcomingSortKey, setUpcomingSortKey] = useState<SortKey>('startTime');
    const [upcomingSortDir, setUpcomingSortDir] = useState<SortDir>('asc');
    const [upcomingPage, setUpcomingPage] = useState(1);

    const [completedView, setCompletedView] = useState<ViewMode>('grid');
    const [completedSortKey, setCompletedSortKey] = useState<SortKey>('startTime');
    const [completedSortDir, setCompletedSortDir] = useState<SortDir>('desc');
    const [completedPage, setCompletedPage] = useState(1);
    const [uiMounted, setUiMounted] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    useEffect(() => {
        setStreamsState(streams);
    }, [streams]);

    // Restore persisted section preferences for view/sort.
    useEffect(() => {
        const storedUpcomingView = localStorage.getItem('streams-upcoming-view') as ViewMode | null;
        if (storedUpcomingView === 'grid' || storedUpcomingView === 'table') setUpcomingView(storedUpcomingView);

        const storedUpcomingKey = localStorage.getItem('streams-upcoming-sort-key') as SortKey | null;
        if (storedUpcomingKey && VALID_SORT_KEYS.includes(storedUpcomingKey)) setUpcomingSortKey(storedUpcomingKey);

        const storedUpcomingDir = localStorage.getItem('streams-upcoming-sort-dir') as SortDir | null;
        if (storedUpcomingDir === 'asc' || storedUpcomingDir === 'desc') setUpcomingSortDir(storedUpcomingDir);

        const storedCompletedView = localStorage.getItem('streams-completed-view') as ViewMode | null;
        if (storedCompletedView === 'grid' || storedCompletedView === 'table') setCompletedView(storedCompletedView);

        const storedCompletedKey = localStorage.getItem('streams-completed-sort-key') as SortKey | null;
        if (storedCompletedKey && VALID_SORT_KEYS.includes(storedCompletedKey)) setCompletedSortKey(storedCompletedKey);

        const storedCompletedDir = localStorage.getItem('streams-completed-sort-dir') as SortDir | null;
        if (storedCompletedDir === 'asc' || storedCompletedDir === 'desc') setCompletedSortDir(storedCompletedDir);

        setUiMounted(true);
    }, []);

    const toggleUpcomingView = (next: ViewMode) => {
        setUpcomingView(next);
        localStorage.setItem('streams-upcoming-view', next);
    };

    const handleUpcomingSort = (key: SortKey) => {
        const nextDir = upcomingSortKey === key && upcomingSortDir === 'asc' ? 'desc' : 'asc';
        setUpcomingSortKey(key);
        setUpcomingSortDir(nextDir);
        localStorage.setItem('streams-upcoming-sort-key', key);
        localStorage.setItem('streams-upcoming-sort-dir', nextDir);
    };

    const toggleCompletedView = (next: ViewMode) => {
        setCompletedView(next);
        localStorage.setItem('streams-completed-view', next);
    };

    const handleCompletedSort = (key: SortKey) => {
        const nextDir = completedSortKey === key && completedSortDir === 'asc' ? 'desc' : 'asc';
        setCompletedSortKey(key);
        setCompletedSortDir(nextDir);
        localStorage.setItem('streams-completed-sort-key', key);
        localStorage.setItem('streams-completed-sort-dir', nextDir);
    };

    const sortedUpcoming = useMemo(() => {
        if (!streamsState?.upcoming) return [];
        return sortStreams(streamsState.upcoming, upcomingSortKey, upcomingSortDir);
    }, [streamsState?.upcoming, upcomingSortKey, upcomingSortDir]);

    const sortedCompleted = useMemo(() => {
        if (!streamsState?.completed) return [];
        return sortStreams(streamsState.completed, completedSortKey, completedSortDir);
    }, [streamsState?.completed, completedSortKey, completedSortDir]);

    const upcomingTotalPages = Math.max(1, Math.ceil(sortedUpcoming.length / PAGE_SIZE));
    const completedTotalPages = Math.max(1, Math.ceil(sortedCompleted.length / PAGE_SIZE));

    useEffect(() => {
        if (upcomingPage > upcomingTotalPages) setUpcomingPage(upcomingTotalPages);
    }, [upcomingPage, upcomingTotalPages]);

    useEffect(() => {
        if (completedPage > completedTotalPages) setCompletedPage(completedTotalPages);
    }, [completedPage, completedTotalPages]);

    const pagedUpcoming = useMemo(() => {
        const start = (upcomingPage - 1) * PAGE_SIZE;
        return sortedUpcoming.slice(start, start + PAGE_SIZE);
    }, [sortedUpcoming, upcomingPage]);

    const pagedCompleted = useMemo(() => {
        const start = (completedPage - 1) * PAGE_SIZE;
        return sortedCompleted.slice(start, start + PAGE_SIZE);
    }, [sortedCompleted, completedPage]);

    const isTotallyEmpty =
        !!streamsState &&
        streamsState.active.length === 0 &&
        streamsState.upcoming.length === 0 &&
        streamsState.completed.length === 0;

    const toggleSelect = useCallback((stream: FormattedStream) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(stream.id)) {
                next.delete(stream.id);
            } else {
                next.add(stream.id);
            }
            return next;
        });
    }, []);

    const lastClickedRef = useRef<string | null>(null);

    /** Shift-aware selection handler. Pass the ordered ID list of the visible section. */
    const handleSelect = useCallback((stream: FormattedStream, orderedIds: string[], e: React.MouseEvent) => {
        if (e.shiftKey && lastClickedRef.current) {
            // Prevent text selection when shift-clicking
            window.getSelection()?.removeAllRanges();
            const lastIdx = orderedIds.indexOf(lastClickedRef.current);
            const curIdx = orderedIds.indexOf(stream.id);
            if (lastIdx !== -1 && curIdx !== -1) {
                const [start, end] = lastIdx < curIdx ? [lastIdx, curIdx] : [curIdx, lastIdx];
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    for (let i = start; i <= end; i++) {
                        next.add(orderedIds[i]);
                    }
                    return next;
                });
                lastClickedRef.current = stream.id;
                return;
            }
        }
        lastClickedRef.current = stream.id;
        toggleSelect(stream);
    }, [toggleSelect]);

    const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

    const upcomingIds = useMemo(() => pagedUpcoming.map((s) => s.id), [pagedUpcoming]);
    const completedIds = useMemo(() => pagedCompleted.map((s) => s.id), [pagedCompleted]);

    const selectUpcoming = useCallback((stream: FormattedStream, e: React.MouseEvent) => {
        handleSelect(stream, upcomingIds, e);
    }, [handleSelect, upcomingIds]);

    const selectCompleted = useCallback((stream: FormattedStream, e: React.MouseEvent) => {
        handleSelect(stream, completedIds, e);
    }, [handleSelect, completedIds]);

    const handleStop = useCallback(async () => {
        if (!stoppingStream) return;
        setStopLoading(true);
        try {
            const res = await fetch(`/api/streams/stop/${stoppingStream.id}`, { method: 'POST' });
            const data = (await res.json()) as { errors?: { message: string }[] };
            if (!res.ok) throw data;
            toast.success('Stream stopped');
            setStoppingStream(null);
            router.refresh();
        } catch (e) {
            const err = e as { errors?: { message: string }[] };
            const message = err.errors?.[0]?.message ?? 'Failed to stop stream.';
            setClientError(message);
            toast.error(message);
            setStoppingStream(null);
        } finally {
            setStopLoading(false);
        }
    }, [stoppingStream, router]);

    const handleEdit = useCallback(
        async (formData: Record<string, string>) => {
            if (!streamsState) return;

            const previous = streamsState;
            setEditingStream(null);
            setStreamsState({
                ...previous,
                active: previous.active.map((s) => applyEditToStream(s, formData)),
                upcoming: previous.upcoming.map((s) => applyEditToStream(s, formData)),
                completed: previous.completed.map((s) => applyEditToStream(s, formData)),
                last: previous.last.map((s) => applyEditToStream(s, formData)),
            });

            fetch(`/api/streams/edit/${formData.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
                .then(async (res) => {
                    const data = (await res.json()) as { errors?: { message: string }[] };
                    if (!res.ok) throw data;
                    toast.success('Stream updated');
                    router.refresh();
                })
                .catch((e: { errors?: { message: string }[] }) => {
                    const message = e.errors?.[0]?.message ?? 'Failed to edit stream.';
                    setClientError(message);
                    toast.error(message);
                    setStreamsState(previous);
                });
        },
        [router, streamsState],
    );

    const handleDelete = useCallback(async () => {
        if (!deletingStream || !streamsState) return;

        const idToDelete = deletingStream.id;
        const previous = streamsState;
        setDeletingStream(null);
        setStreamsState({
            ...previous,
            active: previous.active.filter((s) => s.id !== idToDelete),
            upcoming: previous.upcoming.filter((s) => s.id !== idToDelete),
            completed: previous.completed.filter((s) => s.id !== idToDelete),
            last: previous.last.filter((s) => s.id !== idToDelete),
        });

        fetch(`/api/streams/delete/${idToDelete}`, { method: 'DELETE' })
            .then(async (res) => {
                const data = (await res.json()) as { errors?: { message: string }[] };
                if (!res.ok) throw data;
                toast.success('Stream deleted');
                router.refresh();
            })
            .catch((e: { errors?: { message: string }[] }) => {
                const message = e.errors?.[0]?.message ?? 'Failed to delete stream.';
                setClientError(message);
                toast.error(message);
                setStreamsState(previous);
            });
    }, [deletingStream, router, streamsState]);

    const handleBulkDelete = useCallback(async () => {
        if (!streamsState || selectedIds.size === 0) return;
        const idsToDelete = Array.from(selectedIds);
        const previous = streamsState;
        const idSet = new Set(idsToDelete);

        setBulkDeleting(false);
        clearSelection();
        setStreamsState({
            ...previous,
            active: previous.active.filter((s) => !idSet.has(s.id)),
            upcoming: previous.upcoming.filter((s) => !idSet.has(s.id)),
            completed: previous.completed.filter((s) => !idSet.has(s.id)),
            last: previous.last.filter((s) => !idSet.has(s.id)),
        });

        const results = await Promise.allSettled(
            idsToDelete.map((id) =>
                fetch(`/api/streams/delete/${id}`, { method: 'DELETE' }).then(async (res) => {
                    if (!res.ok) throw await res.json();
                }),
            ),
        );
        const failures = results.filter((r) => r.status === 'rejected').length;
        if (failures > 0) {
            toast.error(`Failed to delete ${failures} of ${idsToDelete.length} streams`);
            setStreamsState(previous);
        } else {
            toast.success(`Deleted ${idsToDelete.length} stream${idsToDelete.length !== 1 ? 's' : ''}`);
            router.refresh();
        }
    }, [clearSelection, router, selectedIds, streamsState]);

    const handleCreate = useCallback(
        async (formData: Record<string, string>) => {
            const optimistic = buildOptimisticCreatedStream(formData);
            const previous = streamsState;
            setCreateStreamData(null);

            if (previous) {
                setStreamsState({
                    ...previous,
                    upcoming: [optimistic, ...previous.upcoming],
                });
            }

            fetch('/api/streams/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
                .then(async (res) => {
                    const data = (await res.json()) as { errors?: { message: string }[] };
                    if (!res.ok) throw data;
                    toast.success('Stream created');
                    router.refresh();
                })
                .catch((e: { errors?: { message: string }[] }) => {
                    const message = e.errors?.[0]?.message ?? 'Failed to create stream.';
                    setClientError(message);
                    toast.error(message);
                    if (previous) setStreamsState(previous);
                });
        },
        [router, streamsState],
    );

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

                {streamsState && (
                    <>
                        {isTotallyEmpty ? (
                            <section className="py-4">
                                <EmptyState
                                    title="No streams found yet"
                                    description="Create a stream here, or jump to YouTube Studio."
                                    primaryLabel="Create Stream"
                                    onPrimaryClick={() => setCreateStreamData({})}
                                    secondaryLabel="Open YouTube Studio"
                                    secondaryHref="https://studio.youtube.com"
                                />
                            </section>
                        ) : (
                            <>
                                <StreamFeatured
                                    active={streamsState.active}
                                    last={streamsState.last}
                                    onStop={setStoppingStream}
                                    onEdit={setEditingStream}
                                />

                                <div>
                                    <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
                                        <h1 className="text-3xl font-light flex items-center gap-2">
                                            Upcoming Streams
                                            <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                {streamsState.upcoming.length}
                                            </span>
                                        </h1>
                                        <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCreateStreamData({})}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
                                        >
                                            + Create Stream
                                        </button>
                                        {uiMounted ? (
                                            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-0.5">
                                                <button
                                                    onClick={() => toggleUpcomingView('grid')}
                                                    aria-label="Grid view"
                                                    title="Grid view"
                                                    className={`p-1.5 rounded transition-colors ${upcomingView === 'grid' ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                        <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm6.5-9A2.25 2.25 0 008.5 4.25v2.5A2.25 2.25 0 0010.75 9h2.5A2.25 2.25 0 0015.5 6.75v-2.5A2.25 2.25 0 0013.25 2h-2.5zm0 9a2.25 2.25 0 00-2.25 2.25v2.5A2.25 2.25 0 0010.75 18h2.5a2.25 2.25 0 002.25-2.25v-2.5A2.25 2.25 0 0013.25 11h-2.5zm6.5-9A2.25 2.25 0 0015 4.25v2.5A2.25 2.25 0 0017.25 9h.5A2.25 2.25 0 0020 6.75v-2.5A2.25 2.25 0 0017.75 2h-.5z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => toggleUpcomingView('table')}
                                                    aria-label="Table view"
                                                    title="Table view"
                                                    className={`p-1.5 rounded transition-colors ${upcomingView === 'table' ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                                >
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
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">10 items per page</p>

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
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : sortedUpcoming.length === 0 ? (
                                        <EmptyState
                                            title="No upcoming streams"
                                            description="Create your next stream to start filling this section."
                                            primaryLabel="Create Stream"
                                            onPrimaryClick={() => setCreateStreamData({})}
                                            secondaryLabel="Open YouTube Studio"
                                            secondaryHref="https://studio.youtube.com"
                                        />
                                    ) : upcomingView === 'grid' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pagedUpcoming.map((stream) => (
                                                <StreamCard
                                                    key={stream.id}
                                                    stream={stream}
                                                    onEdit={setEditingStream}
                                                    onDelete={setDeletingStream}
                                                    onCopy={setCreateStreamData}
                                                    selected={selectedIds.has(stream.id)}
                                                    onSelect={selectUpcoming}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                    <tr>
                                                        <th className="py-2.5 px-4 w-10"></th>
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
                                                                onClick={() => handleUpcomingSort(key)}
                                                                className={`py-2.5 px-4 cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-200 transition-colors whitespace-nowrap ${key === 'enableAutoStart' || key === 'enableAutoStop' ? 'text-center' : 'text-left'
                                                                    }`}
                                                            >
                                                                {label}
                                                                {upcomingSortKey === key && (
                                                                    <span className="ml-1 text-blue-500">{upcomingSortDir === 'asc' ? '↑' : '↓'}</span>
                                                                )}
                                                            </th>
                                                        ))}                                                        <th className="py-2.5 px-4 text-left">Stream Key</th>                                                        <th className="py-2.5 px-4 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                                    {pagedUpcoming.map((stream) => (
                                                        <StreamTableRow
                                                            key={stream.id}
                                                            stream={stream}
                                                            onEdit={setEditingStream}
                                                            onDelete={setDeletingStream}
                                                            onCopy={setCreateStreamData}
                                                            selected={selectedIds.has(stream.id)}
                                                            onSelect={selectUpcoming}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <SectionPagination
                                        page={upcomingPage}
                                        totalPages={upcomingTotalPages}
                                        onPrevious={() => setUpcomingPage((p) => Math.max(1, p - 1))}
                                        onNext={() => setUpcomingPage((p) => Math.min(upcomingTotalPages, p + 1))}
                                    />
                                </div>

                                <div className="mt-10">
                                    <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
                                        <h2 className="text-2xl font-light flex items-center gap-2">
                                            Completed Streams
                                            <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                {streamsState.completed.length}
                                            </span>
                                        </h2>
                                        {uiMounted ? (
                                            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-0.5">
                                                <button
                                                    onClick={() => toggleCompletedView('grid')}
                                                    aria-label="Completed grid view"
                                                    title="Completed grid view"
                                                    className={`p-1.5 rounded transition-colors ${completedView === 'grid' ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                        <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm6.5-9A2.25 2.25 0 008.5 4.25v2.5A2.25 2.25 0 0010.75 9h2.5A2.25 2.25 0 0015.5 6.75v-2.5A2.25 2.25 0 0013.25 2h-2.5zm0 9a2.25 2.25 0 00-2.25 2.25v2.5A2.25 2.25 0 0010.75 18h2.5a2.25 2.25 0 002.25-2.25v-2.5A2.25 2.25 0 0013.25 11h-2.5zm6.5-9A2.25 2.25 0 0015 4.25v2.5A2.25 2.25 0 0017.25 9h.5A2.25 2.25 0 0020 6.75v-2.5A2.25 2.25 0 0017.75 2h-.5z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => toggleCompletedView('table')}
                                                    aria-label="Completed table view"
                                                    title="Completed table view"
                                                    className={`p-1.5 rounded transition-colors ${completedView === 'table' ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                                >
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
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">10 items per page</p>

                                    {sortedCompleted.length === 0 ? (
                                        <EmptyState
                                            title="No completed streams yet"
                                            description="Completed livestreams will appear here once your broadcasts finish."
                                            primaryLabel="Create Stream"
                                            onPrimaryClick={() => setCreateStreamData({})}
                                            secondaryLabel="Open YouTube Studio"
                                            secondaryHref="https://studio.youtube.com"
                                        />
                                    ) : completedView === 'grid' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pagedCompleted.map((stream) => (
                                                <StreamCard
                                                    key={`completed-${stream.id}`}
                                                    stream={stream}
                                                    onEdit={setEditingStream}
                                                    onDelete={setDeletingStream}
                                                    onCopy={setCreateStreamData}
                                                    selected={selectedIds.has(stream.id)}
                                                    onSelect={selectCompleted}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                    <tr>
                                                        <th className="py-2.5 px-4 w-10"></th>
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
                                                                onClick={() => handleCompletedSort(key)}
                                                                className={`py-2.5 px-4 cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-200 transition-colors whitespace-nowrap ${key === 'enableAutoStart' || key === 'enableAutoStop' ? 'text-center' : 'text-left'
                                                                    }`}
                                                            >
                                                                {label}
                                                                {completedSortKey === key && (
                                                                    <span className="ml-1 text-blue-500">{completedSortDir === 'asc' ? '↑' : '↓'}</span>
                                                                )}
                                                            </th>
                                                        ))}
                                                        <th className="py-2.5 px-4 text-left">Stream Key</th>
                                                        <th className="py-2.5 px-4 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                                    {pagedCompleted.map((stream) => (
                                                        <StreamTableRow
                                                            key={`completed-table-${stream.id}`}
                                                            stream={stream}
                                                            onEdit={setEditingStream}
                                                            onDelete={setDeletingStream}
                                                            onCopy={setCreateStreamData}
                                                            selected={selectedIds.has(stream.id)}
                                                            onSelect={selectCompleted}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <SectionPagination
                                        page={completedPage}
                                        totalPages={completedTotalPages}
                                        onPrevious={() => setCompletedPage((p) => Math.max(1, p - 1))}
                                        onNext={() => setCompletedPage((p) => Math.min(completedTotalPages, p + 1))}
                                    />
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

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
                    loading={false}
                    onSubmit={handleEdit}
                    onClose={() => setEditingStream(null)}
                />
            )}
            {deletingStream && (
                <DeleteStreamModal
                    stream={deletingStream}
                    loading={false}
                    onConfirm={handleDelete}
                    onClose={() => setDeletingStream(null)}
                />
            )}
            {bulkDeleting && selectedIds.size > 0 && (
                <Modal
                    open={true}
                    onClose={() => setBulkDeleting(false)}
                    title="Delete Livestreams?"
                    footer={
                        <>
                            <button
                                onClick={() => setBulkDeleting(false)}
                                className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Yes, I&apos;m sure &mdash; DELETE
                            </button>
                        </>
                    }
                >
                    <div className="text-center">
                        <p className="mb-6">
                            This will permanently <strong>DELETE</strong>{' '}
                            <strong>{selectedIds.size}</strong> livestream{selectedIds.size !== 1 ? 's' : ''}.
                            This action cannot be undone.
                        </p>
                    </div>
                </Modal>
            )}
            {createStreamData !== null && (
                <CreateStreamModal
                    initialData={createStreamData}
                    loading={false}
                    onSubmit={handleCreate}
                    onClose={() => setCreateStreamData(null)}
                />
            )}
            {showAddToPlaylist && selectedIds.size > 0 && (
                <AddToPlaylistModal
                    videoIds={Array.from(selectedIds)}
                    onClose={() => setShowAddToPlaylist(false)}
                    onSuccess={() => {
                        setShowAddToPlaylist(false);
                        clearSelection();
                    }}
                />
            )}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-0 inset-x-0 z-40 bg-blue-600 text-white shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        <span className="text-sm font-medium">
                            {selectedIds.size} stream{selectedIds.size !== 1 ? 's' : ''} selected
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowAddToPlaylist(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-white text-blue-700 hover:bg-blue-50 font-medium transition-colors"
                            >
                                Add to Playlist
                            </button>
                            <button
                                onClick={() => setBulkDeleting(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 font-medium transition-colors"
                            >
                                Delete
                            </button>
                            <button
                                onClick={clearSelection}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-white/40 hover:bg-blue-700 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
