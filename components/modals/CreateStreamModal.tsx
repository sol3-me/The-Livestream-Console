'use client';
import type { AvailableStreamKey, FormattedStream } from '@/lib/types';
import { toDatetimeLocalValue } from '@/lib/utils';
import { useEffect, useState, type FormEvent } from 'react';
import PlaylistMultiSelect from '../PlaylistMultiSelect';
import Modal from './Modal';

interface CreateStreamModalProps {
    /** Pass a FormattedStream to pre-populate (Copy flow). Omit for a blank new stream. */
    initialData?: Partial<FormattedStream>;
    loading: boolean;
    onSubmit: (data: Record<string, string>) => void;
    onClose: () => void;
}

function defaultStartTime(): string {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return toDatetimeLocalValue(d.toISOString());
}

export default function CreateStreamModal({
    initialData,
    loading,
    onSubmit,
    onClose,
}: CreateStreamModalProps) {
    const [autoStart, setAutoStart] = useState(initialData?.enableAutoStart ?? true);
    const [autoStop, setAutoStop] = useState(initialData?.enableAutoStop ?? true);
    const [playlistIds, setPlaylistIds] = useState<string[]>([]);
    const [availableKeys, setAvailableKeys] = useState<AvailableStreamKey[]>([]);
    const [keysLoading, setKeysLoading] = useState(false);
    const [selectedKeyId, setSelectedKeyId] = useState('');

    useEffect(() => {
        setKeysLoading(true);
        fetch('/api/streams/keys')
            .then(async (res) => {
                if (!res.ok) return;
                setAvailableKeys((await res.json()) as AvailableStreamKey[]);
            })
            .catch(() => {})
            .finally(() => setKeysLoading(false));
    }, []);

    const isCopy = !!initialData?.id;

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const obj: Record<string, string> = {};
        formData.forEach((val, key) => {
            obj[key] = val.toString();
        });
        obj.autoStart = String(autoStart);
        obj.autoStop = String(autoStop);
        if (playlistIds.length > 0) {
            obj.playlistIds = JSON.stringify(playlistIds);
        }
        if (selectedKeyId) obj.streamKeyId = selectedKeyId;
        onSubmit(obj);
    };

    const inputClass =
        'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';
    const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

    return (
        <Modal
            open={true}
            onClose={onClose}
            title={isCopy ? 'Copy Stream' : 'Create New Stream'}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-stream-form"
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating…' : isCopy ? 'Create Copy' : 'Create Stream'}
                    </button>
                </>
            }
        >
            <form id="create-stream-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelClass} htmlFor="create-title">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="create-title"
                        type="text"
                        name="title"
                        required
                        defaultValue={isCopy ? `Copy of ${initialData?.title ?? ''}` : (initialData?.title ?? '')}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass} htmlFor="create-desc">
                        Description
                    </label>
                    <textarea
                        id="create-desc"
                        name="description"
                        defaultValue={initialData?.description ?? ''}
                        rows={3}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass} htmlFor="create-startTime">
                        Scheduled For
                    </label>
                    <input
                        id="create-startTime"
                        type="datetime-local"
                        name="startTime"
                        required
                        defaultValue={
                            initialData?.startTime
                                ? toDatetimeLocalValue(initialData.startTime)
                                : defaultStartTime()
                        }
                        className={`${inputClass} datetime-input`}
                    />
                </div>

                <div>
                    <label className={labelClass} htmlFor="create-privacy">
                        Privacy
                    </label>
                    <select
                        id="create-privacy"
                        name="privacyStatus"
                        defaultValue={initialData?.privacyStatus ?? 'private'}
                        className={inputClass}
                    >
                        <option value="public">Public</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="private">Private</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass} htmlFor="create-stream-key">
                        Stream Key{' '}
                        <span className="text-gray-400 dark:text-gray-500 text-xs font-normal">(optional)</span>
                    </label>
                    {keysLoading ? (
                        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ) : (
                        <select
                            id="create-stream-key"
                            value={selectedKeyId}
                            onChange={(e) => setSelectedKeyId(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">— select a stream key —</option>
                            {availableKeys.map((k) => (
                                <option key={k.id} value={k.id}>
                                    {k.name}{k.resolution ? ` · ${k.resolution}` : ''}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={autoStart}
                            onChange={(e) => setAutoStart(e.target.checked)}
                            className="accent-blue-600 w-4 h-4"
                        />
                        auto-start
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={autoStop}
                            onChange={(e) => setAutoStop(e.target.checked)}
                            className="accent-blue-600 w-4 h-4"
                        />
                        auto-stop
                    </label>
                </div>

                <div>
                    <label className={labelClass}>Add to Playlists</label>
                    <PlaylistMultiSelect
                        selectedIds={playlistIds}
                        onChange={setPlaylistIds}
                        videoId={isCopy ? initialData?.id : undefined}
                    />
                </div>

            </form>
        </Modal>
    );
}
