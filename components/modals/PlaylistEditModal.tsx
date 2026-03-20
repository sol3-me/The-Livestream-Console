'use client';
import { useState, type FormEvent } from 'react';
import Modal from './Modal';

interface PlaylistEditModalProps {
    mode: 'create' | 'edit';
    initialData?: { title?: string; description?: string; privacyStatus?: string };
    loading: boolean;
    onSubmit: (data: { title: string; description: string; privacyStatus: string }) => void;
    onClose: () => void;
}

export default function PlaylistEditModal({
    mode,
    initialData,
    loading,
    onSubmit,
    onClose,
}: PlaylistEditModalProps) {
    const [title, setTitle] = useState(initialData?.title ?? '');
    const [description, setDescription] = useState(initialData?.description ?? '');
    const [privacyStatus, setPrivacyStatus] = useState(initialData?.privacyStatus ?? 'private');

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit({ title: title.trim(), description, privacyStatus });
    };

    const inputClass =
        'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
    const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

    const isCreate = mode === 'create';

    return (
        <Modal
            open={true}
            onClose={onClose}
            title={isCreate ? 'Create Playlist' : 'Edit Playlist'}
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
                        form="playlist-edit-form"
                        disabled={loading || !title.trim()}
                        className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isCreate
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {loading
                            ? isCreate
                                ? 'Creating…'
                                : 'Saving…'
                            : isCreate
                                ? 'Create Playlist'
                                : 'Save Changes'}
                    </button>
                </>
            }
        >
            <form id="playlist-edit-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelClass} htmlFor="playlist-title">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="playlist-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass} htmlFor="playlist-desc">
                        Description
                    </label>
                    <textarea
                        id="playlist-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass} htmlFor="playlist-privacy">
                        Privacy
                    </label>
                    <select
                        id="playlist-privacy"
                        value={privacyStatus}
                        onChange={(e) => setPrivacyStatus(e.target.value)}
                        className={inputClass}
                    >
                        <option value="public">Public</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="private">Private</option>
                    </select>
                </div>
            </form>
        </Modal>
    );
}
