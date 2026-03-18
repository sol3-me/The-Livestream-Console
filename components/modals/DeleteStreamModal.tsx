'use client';
import type { FormattedStream } from '@/lib/types';
import Modal from './Modal';

interface DeleteStreamModalProps {
  stream: FormattedStream;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteStreamModal({
  stream,
  loading,
  onConfirm,
  onClose,
}: DeleteStreamModalProps) {
  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Delete Livestream?"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      }
    >
      <div className="text-center">
        <p className="mb-6">
          This will permanently <strong>DELETE</strong> the livestream:
          <br />
          <em className="text-gray-600">{stream.title}</em>
        </p>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Deleting…' : "Yes, I'm sure — DELETE"}
        </button>
      </div>
    </Modal>
  );
}
