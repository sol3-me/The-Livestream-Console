'use client';
import { useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

interface InstallPWAButtonProps {
  /** Extra class names applied to the outer button element */
  className?: string;
  /** When true, renders as a full-width block item (for use inside a dropdown) */
  dropdownItem?: boolean;
}

export default function InstallPWAButton({ className = '', dropdownItem = false }: InstallPWAButtonProps) {
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);

    // Hide immediately if already running as installed PWA
    if (isInStandaloneMode()) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Focus close button when modal opens for keyboard accessibility
  useEffect(() => {
    if (showModal) {
      closeRef.current?.focus();
    }
  }, [showModal]);

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setShowModal(false);
  };

  // Don't render until mounted (avoids SSR mismatch) or if already installed
  if (!mounted || installed) return null;

  const ios = isIOS();

  const buttonBase = dropdownItem
    ? `flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-gray-700 transition-colors ${className}`
    : `flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded border border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-gray-900 transition-colors ${className}`;

  return (
    <>
      <button
        onClick={handleClick}
        className={buttonBase}
        aria-label="Install The Livestream Console app"
        type="button"
      >
        {/* Download / install icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
          <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
        </svg>
        Install app
      </button>

      {/* Instructions modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-modal-title"
          onKeyDown={handleKeyDown}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm mx-4 p-5">
            <div className="flex items-start justify-between mb-3">
              <h2
                id="install-modal-title"
                className="text-base font-semibold text-gray-900 dark:text-gray-100"
              >
                Install The Livestream Console
              </h2>
              <button
                ref={closeRef}
                onClick={() => setShowModal(false)}
                className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
                aria-label="Close"
                type="button"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {ios
                ? 'To install on iOS, use Safari:'
                : 'To install, use your browser menu:'}
            </p>

            {ios ? (
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  Tap the{' '}
                  <span className="font-medium">Share</span> button{' '}
                  <span aria-hidden="true">⎋</span> at the bottom of Safari.
                </li>
                <li>
                  Scroll down and tap{' '}
                  <span className="font-medium">Add to Home Screen</span>.
                </li>
                <li>
                  Tap <span className="font-medium">Add</span> to confirm.
                </li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  Open the browser menu{' '}
                  <span aria-hidden="true">⋮</span> (top-right corner).
                </li>
                <li>
                  Look for{' '}
                  <span className="font-medium">Install app</span> or{' '}
                  <span className="font-medium">Add to Home Screen</span>.
                </li>
                <li>Follow the prompts to complete the installation.</li>
              </ol>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full text-sm px-3 py-2 rounded bg-amber-500 text-gray-900 font-medium hover:bg-amber-400 transition-colors"
              type="button"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
