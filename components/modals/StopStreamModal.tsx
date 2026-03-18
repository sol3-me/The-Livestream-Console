'use client';
import type { FormattedStream } from '@/lib/types';
import Modal from './Modal';

interface StopStreamModalProps {
  stream: FormattedStream;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function StopStreamModal({
  stream,
  loading,
  onConfirm,
  onClose,
}: StopStreamModalProps) {
  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Stop Livestream?"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      }
    >
      <div className="text-center">
        <p className="mb-6">
          This will completely <strong>STOP</strong> the livestream:
          <br />
          <em className="text-gray-600 dark:text-gray-400">{stream.title}</em>
        </p>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Stopping…' : "Yes, I'm sure — STOP"}
        </button>
      </div>
    </Modal>
  );
}
