'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isLoggedIn = !!session;

  const linkClass = (path: string) =>
    `text-sm transition-colors hover:text-white ${
      pathname === path ? 'text-white font-semibold' : 'text-gray-400'
    }`;

  return (
    <nav className="bg-gray-900 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="font-bold text-lg tracking-tight text-white">
          TLC
        </Link>
        <div className="flex items-center gap-5 flex-wrap">
          {isLoggedIn ? (
            <Link href="/dashboard" className={linkClass('/dashboard')}>
              Dashboard
            </Link>
          ) : (
            <Link href="/" className={linkClass('/')}>
              Home
            </Link>
          )}
          {isLoggedIn && (
            <Link href="/streams" className={linkClass('/streams')}>
              Streams
            </Link>
          )}
          <Link href="/about" className={linkClass('/about')}>
            About
          </Link>
          <span className="text-xs text-gray-600">v2.0</span>
          {isLoggedIn ? (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm px-3 py-1 border border-red-500 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors"
            >
              Log out
            </button>
          ) : (
            pathname !== '/' && (
              <Link
                href="/login"
                className="text-sm px-3 py-1 border border-green-500 text-green-400 rounded hover:bg-green-500 hover:text-white transition-colors"
              >
                Log in
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
