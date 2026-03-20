'use client';
import type { FormattedPlaylist } from '@/lib/types';
import Modal from './Modal';

interface DeletePlaylistModalProps {
    playlist: FormattedPlaylist;
    loading: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export default function DeletePlaylistModal({
    playlist,
    loading,
    onConfirm,
    onClose,
}: DeletePlaylistModalProps) {
    return (
        <Modal
            open={true}
            onClose={onClose}
            title="Delete Playlist?"
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Deleting…' : "Yes, I'm sure — DELETE"}
                    </button>
                </>
            }
        >
            <div className="text-center">
                <p className="mb-6">
                    This will permanently <strong>DELETE</strong> the playlist:
                    <br />
                    <em className="text-gray-600 dark:text-gray-400">{playlist.title}</em>
                    <br />
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({playlist.itemCount} item{playlist.itemCount !== 1 ? 's' : ''})
                    </span>
                </p>
            </div>
        </Modal>
    );
}
