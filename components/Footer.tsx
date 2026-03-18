import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto py-4 text-center text-sm text-gray-400 border-t border-gray-200 dark:border-gray-700 dark:text-gray-500">
      <p className="mb-1 text-xs">
        This is an open source web app, not affiliated with Google.{' '}
        <Link href="/about" className="underline hover:text-gray-600 dark:hover:text-gray-300">
          Find out more
        </Link>
        .
      </p>
      <p>
        Built by{' '}
        <a
          href="https://github.com/sol3uk"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600 dark:hover:text-gray-300"
        >
          @sol3uk
        </a>
        {' · '}
        <Link href="/tos" className="underline hover:text-gray-600 dark:hover:text-gray-300">
          Terms of Service
        </Link>
        {' · '}
        <Link href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">
          Privacy Policy
        </Link>
      </p>
    </footer>
  );
}
