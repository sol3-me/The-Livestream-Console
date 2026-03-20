'use client';
import type { FormattedStream } from '@/lib/types';
import { toDatetimeLocalValue, toLocalDatetime } from '@/lib/utils';
import { useState, type FormEvent } from 'react';
import PlaylistMultiSelect from '../PlaylistMultiSelect';
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
  const [playlistIds, setPlaylistIds] = useState<string[]>([]);

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
    onSubmit(obj);
  };

  const inputClass =
    'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const disabledInputClass =
    'w-full border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Edit Livestream — ${stream.id}`}
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
            form="edit-stream-form"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </>
      }
    >
      <form id="edit-stream-form" onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="id" value={stream.id} />

        <div>
          <label className={labelClass} htmlFor="edit-title">
            Title
          </label>
          <input
            id="edit-title"
            type="text"
            name="title"
            defaultValue={stream.title}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="edit-desc">
            Description
          </label>
          <textarea
            id="edit-desc"
            name="description"
            defaultValue={stream.description}
            rows={3}
            className={inputClass}
          />
        </div>

        {/* Scheduled start time — editable for upcoming streams, read-only otherwise */}
        <div>
          <label className={labelClass} htmlFor="edit-startTime">
            Scheduled For
          </label>
          {!stream.isLive && !stream.isComplete ? (
            <input
              id="edit-startTime"
              type="datetime-local"
              name="startTime"
              defaultValue={toDatetimeLocalValue(stream.startTime)}
              className={`${inputClass} datetime-input`}
            />
          ) : (
            <input
              type="text"
              defaultValue={toLocalDatetime(stream.startTime)}
              disabled
              className={disabledInputClass}
            />
          )}
        </div>

        {/* Actual times shown for completed streams */}
        {stream.isComplete && (
          <>
            <div>
              <label className={labelClass}>Actual Start</label>
              <input
                type="text"
                defaultValue={toLocalDatetime(stream.actualStartTime)}
                disabled
                className={disabledInputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Actual End</label>
              <input
                type="text"
                defaultValue={toLocalDatetime(stream.actualEndTime)}
                disabled
                className={disabledInputClass}
              />
            </div>
          </>
        )}

        {/* Privacy status — editable for upcoming and live streams */}
        {!stream.isComplete && (
          <div>
            <label className={labelClass} htmlFor="edit-privacy">
              Privacy
            </label>
            <select
              id="edit-privacy"
              name="privacyStatus"
              defaultValue={stream.privacyStatus}
              className={inputClass}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>
        )}

        {/* Auto-start / auto-stop checkboxes */}
        {!stream.isComplete && (
          <div className="flex gap-6">
            {!stream.isLive && (
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="accent-blue-600 w-4 h-4"
                />
                auto-start
              </label>
            )}
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
        )}

        <div>
          <label className={labelClass}>Add to Playlists</label>
          <PlaylistMultiSelect
            selectedIds={playlistIds}
            onChange={setPlaylistIds}
            videoId={stream.id}
          />
        </div>
      </form>
    </Modal>
  );
}

