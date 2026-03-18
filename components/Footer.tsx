import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto py-4 text-center text-sm text-gray-400 border-t border-gray-200">
      <p className="mb-1 text-xs">
        This is an open source web app, not affiliated with Google.{' '}
        <Link href="/about" className="underline hover:text-gray-600">
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
          className="underline hover:text-gray-600"
        >
          @sol3uk
        </a>
        {' · '}
        <Link href="/tos" className="underline hover:text-gray-600">
          Terms of Service
        </Link>
        {' · '}
        <Link href="/privacy" className="underline hover:text-gray-600">
          Privacy Policy
        </Link>
      </p>
    </footer>
  );
}
