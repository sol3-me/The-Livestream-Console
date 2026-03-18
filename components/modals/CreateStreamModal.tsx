'use client';
import type { FormattedStream } from '@/lib/types';
import { toDatetimeLocalValue } from '@/lib/utils';
import { useState, type FormEvent } from 'react';
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
    onSubmit(obj);
  };

  const inputClass =
    'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={isCopy ? 'Copy Stream' : 'Create New Stream'}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className={inputClass}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating…' : isCopy ? 'Create Copy' : 'Create Stream'}
        </button>
      </form>
    </Modal>
  );
}
