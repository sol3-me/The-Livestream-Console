'use client';
import type { AvailableStreamKey, FormattedStream, StreamKeyInfo } from '@/lib/types';
import { toDatetimeLocalValue, toLocalDatetime } from '@/lib/utils';
import { useEffect, useState, type FormEvent } from 'react';
import PlaylistMultiSelect from '../PlaylistMultiSelect';
import Modal from './Modal';

interface EditStreamModalProps {
  stream: FormattedStream;
  loading: boolean;
  onSubmit: (data: Record<string, string>) => void;
  onClose: () => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement('textarea');
      el.value = value;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${label}`}
      className="shrink-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-500">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
        </svg>
      )}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function SecretRow({ label, value }: { label: string; value: string }) {
  const [revealed, setRevealed] = useState(false);
  const display = !revealed ? '•'.repeat(Math.min(value.length, 32)) : value;
  return (
    <div className="space-y-1">
      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 block text-xs bg-gray-100 dark:bg-gray-900 rounded px-2 py-1.5 font-mono break-all select-all">
          {display}
        </code>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          title={revealed ? 'Hide' : 'Reveal'}
          className="shrink-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {revealed ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
              <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
            </svg>
          )}
          {revealed ? 'Hide' : 'Show'}
        </button>
        <CopyButton value={value} label={label} />
      </div>
    </div>
  );
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Stream key state
  const [availableKeys, setAvailableKeys] = useState<AvailableStreamKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<string>(stream.boundStreamId ?? '');
  const [keyInfo, setKeyInfo] = useState<StreamKeyInfo | null>(null);
  const [keyInfoLoading, setKeyInfoLoading] = useState(false);

  // Fetch available keys when advanced section opens
  useEffect(() => {
    if (!showAdvanced || availableKeys.length > 0) return;
    setKeysLoading(true);
    setKeysError(null);
    fetch('/api/streams/keys')
      .then(async (res) => {
        const data = await res.json() as AvailableStreamKey[] | { error: string };
        if (!res.ok) throw new Error((data as { error: string }).error ?? 'Failed to load stream keys');
        setAvailableKeys(data as AvailableStreamKey[]);
      })
      .catch((e: Error) => setKeysError(e.message))
      .finally(() => setKeysLoading(false));
  }, [showAdvanced, availableKeys.length]);

  // Fetch credential details for the currently-selected key when advanced is open
  useEffect(() => {
    if (!showAdvanced || !selectedKeyId) { setKeyInfo(null); return; }
    setKeyInfoLoading(true);
    fetch(`/api/streams/${stream.id}/streamkey`)
      .then(async (res) => {
        if (!res.ok) { setKeyInfo(null); return; }
        setKeyInfo(await res.json() as StreamKeyInfo);
      })
      .catch(() => setKeyInfo(null))
      .finally(() => setKeyInfoLoading(false));
  }, [showAdvanced, selectedKeyId, stream.id]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const obj: Record<string, string> = {};
    formData.forEach((val, key) => { obj[key] = val.toString(); });
    obj.autoStart = String(autoStart);
    obj.autoStop = String(autoStop);
    if (playlistIds.length > 0) obj.playlistIds = JSON.stringify(playlistIds);
    // Only send streamKeyId if user explicitly changed it
    if (selectedKeyId && selectedKeyId !== stream.boundStreamId) {
      obj.streamKeyId = selectedKeyId;
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
          <label className={labelClass} htmlFor="edit-title">Title</label>
          <input
            id="edit-title"
            type="text"
            name="title"
            defaultValue={stream.title}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="edit-desc">Description</label>
          <textarea
            id="edit-desc"
            name="description"
            defaultValue={stream.description}
            rows={3}
            className={inputClass}
          />
        </div>

        {/* Stream key — primary info at a glance */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Stream Key</p>
          {stream.streamKeyName ? (
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 font-mono">
              {stream.streamKeyName}
              {stream.boundStreamId && (
                <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">{stream.boundStreamId}</span>
              )}
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">No key bound</p>
          )}
        </div>

        {/* Scheduled start time */}
        <div>
          <label className={labelClass} htmlFor="edit-startTime">Scheduled For</label>
          {!stream.isLive && !stream.isComplete ? (
            <input
              id="edit-startTime"
              type="datetime-local"
              name="startTime"
              defaultValue={toDatetimeLocalValue(stream.startTime)}
              className={`${inputClass} datetime-input`}
            />
          ) : (
            <input type="text" defaultValue={toLocalDatetime(stream.startTime)} disabled className={disabledInputClass} />
          )}
        </div>

        {/* Actual times for completed streams */}
        {stream.isComplete && (
          <>
            <div>
              <label className={labelClass}>Actual Start</label>
              <input type="text" defaultValue={toLocalDatetime(stream.actualStartTime)} disabled className={disabledInputClass} />
            </div>
            <div>
              <label className={labelClass}>Actual End</label>
              <input type="text" defaultValue={toLocalDatetime(stream.actualEndTime)} disabled className={disabledInputClass} />
            </div>
          </>
        )}

        {/* Privacy */}
        {!stream.isComplete && (
          <div>
            <label className={labelClass} htmlFor="edit-privacy">Privacy</label>
            <select id="edit-privacy" name="privacyStatus" defaultValue={stream.privacyStatus} className={inputClass}>
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>
        )}

        {/* Auto-start / auto-stop */}
        {!stream.isComplete && (
          <div className="flex gap-6">
            {!stream.isLive && (
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                <input type="checkbox" checked={autoStart} onChange={(e) => setAutoStart(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                auto-start
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
              <input type="checkbox" checked={autoStop} onChange={(e) => setAutoStop(e.target.checked)} className="accent-blue-600 w-4 h-4" />
              auto-stop
            </label>
          </div>
        )}

        <div>
          <label className={labelClass}>Add to Playlists</label>
          <PlaylistMultiSelect selectedIds={playlistIds} onChange={setPlaylistIds} videoId={stream.id} />
        </div>

        {/* Advanced settings accordion */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span>Advanced settings</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            >
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-4">
              {/* Stream key selector */}
              <div>
                <label className={labelClass} htmlFor="edit-stream-key-select">Bound Stream Key</label>
                {keysLoading && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">Loading keys…</p>
                )}
                {keysError && (
                  <p className="text-xs text-red-500">{keysError}</p>
                )}
                {!keysLoading && !keysError && (
                  <select
                    id="edit-stream-key-select"
                    value={selectedKeyId}
                    onChange={(e) => setSelectedKeyId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">— select a stream key —</option>
                    {availableKeys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}{k.resolution ? ` (${k.resolution}${k.frameRate ? ` · ${k.frameRate}` : ''})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Ingestion credentials for the selected key */}
              {keyInfoLoading && (
                <p className="text-xs text-gray-400 dark:text-gray-500">Loading credentials…</p>
              )}
              {keyInfo && !keyInfoLoading && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stream URL (Primary)</span>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-900 rounded px-2 py-1.5 font-mono break-all select-all">
                        {keyInfo.ingestionAddress}
                      </code>
                      <CopyButton value={keyInfo.ingestionAddress} label="Stream URL" />
                    </div>
                  </div>
                  {keyInfo.backupIngestionAddress && (
                    <div className="space-y-1">
                      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stream URL (Backup)</span>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-900 rounded px-2 py-1.5 font-mono break-all select-all">
                          {keyInfo.backupIngestionAddress}
                        </code>
                        <CopyButton value={keyInfo.backupIngestionAddress} label="Backup Stream URL" />
                      </div>
                    </div>
                  )}
                  <SecretRow label="Stream Key" value={keyInfo.streamKey} />
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded px-3 py-2">
                    Keep your stream key private. Anyone with it can stream to your channel.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

