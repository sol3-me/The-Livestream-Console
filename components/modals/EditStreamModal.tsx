'use client';
import type { FormattedStream } from '@/lib/types';
import { toLocalDatetime } from '@/lib/utils';
import { useState, type FormEvent } from 'react';
import Modal from './Modal';

interface EditStreamModalProps {
  stream: FormattedStream;
  loading: boolean;
  onSubmit: (data: Record<string, string>) => void;
  onClose: () => void;
}

export default function EditStreamModal({
  stream,
  loading,
  onSubmit,
  onClose,
}: EditStreamModalProps) {
  const [autoStart, setAutoStart] = useState(stream.enableAutoStart);
  const [autoStop, setAutoStop] = useState(stream.enableAutoStop);

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
    onSubmit(obj);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Edit Livestream — ${stream.id}`}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="id" value={stream.id} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-title">
            Title
          </label>
          <input
            id="edit-title"
            type="text"
            name="title"
            defaultValue={stream.title}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-desc">
            Description
          </label>
          <textarea
            id="edit-desc"
            name="description"
            defaultValue={stream.description}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled For</label>
          <input
            type="text"
            defaultValue={toLocalDatetime(stream.startTime)}
            disabled
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-400"
          />
        </div>
        {stream.isComplete && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Start</label>
              <input
                type="text"
                defaultValue={toLocalDatetime(stream.actualStartTime)}
                disabled
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual End</label>
              <input
                type="text"
                defaultValue={toLocalDatetime(stream.actualEndTime)}
                disabled
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-400"
              />
            </div>
          </>
        )}
        {!stream.isComplete && (
          <div className="flex gap-6">
            {!stream.isLive && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="accent-blue-600 w-4 h-4"
                />
                auto-start
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoStop}
                onChange={(e) => setAutoStop(e.target.checked)}
                className="accent-blue-600 w-4 h-4"
              />
              auto-stop
            </label>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
}
