function colourFor(status: string): string {
  if (status === 'public') return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400';
  if (status === 'unlisted') return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400';
  return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
}

/** A stream's privacy status (public / unlisted / private) as a coloured pill. */
export default function PrivacyBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${colourFor(status)}`}>
      {status}
    </span>
  );
}
