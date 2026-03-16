'use client';

interface ErrorDisplayProps {
  message: string;
  helpLink?: string;
  onDismiss?: () => void;
}

export default function ErrorDisplay({ message, helpLink, onDismiss }: ErrorDisplayProps) {
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between gap-3">
      <p className="text-sm text-red-700">
        There was an error: <em>{message}</em>
        {helpLink && (
          <>
            {' '}
            <a
              href={helpLink}
              className="underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              more information
            </a>
          </>
        )}
        .
      </p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0"
          aria-label="Dismiss error"
        >
          &times;
        </button>
      )}
    </div>
  );
}
