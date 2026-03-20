'use client';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

interface LatestRelease {
  tag_name?: string;
  html_url?: string;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { theme, toggleTheme, mounted: themeMounted } = useTheme();
  const isAuthLoading = status === 'loading';
  const isLoggedIn = !!session;
  const [latestRelease, setLatestRelease] = useState<LatestRelease | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLatestRelease = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/sol3uk/The-Livestream-Console/releases/latest', {
          headers: {
            Accept: 'application/vnd.github+json',
          },
        });
        if (!res.ok) return;
        const data = (await res.json()) as LatestRelease;
        if (isMounted) setLatestRelease(data);
      } catch {
        // Keep fallback label/link if request fails.
      }
    };

    loadLatestRelease();
    return () => {
      isMounted = false;
    };
  }, []);

  const releaseTag = latestRelease?.tag_name;
  const releaseUrl = latestRelease?.html_url ?? 'https://github.com/sol3uk/The-Livestream-Console/releases/latest';
  const releaseLabel = releaseTag ?? 'latest';
  const releaseTitle = latestRelease
    ? `View ${releaseLabel} release notes`
    : 'View latest release notes';

  const linkClass = (path: string) =>
    `text-sm transition-colors hover:text-white ${pathname === path ? 'text-white font-semibold' : 'text-gray-400'
    }`;

  return (
    <nav className="bg-gray-900 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="font-bold text-lg tracking-tight text-white">
          TLC
        </Link>
        <div className="flex items-center gap-5 flex-wrap">
          {isAuthLoading ? (
            <>
              <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-14 bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-700 rounded animate-pulse" />
            </>
          ) : (
            <>
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
              {isLoggedIn && (
                <Link href="/playlists" className={linkClass('/playlists')}>
                  Playlists
                </Link>
              )}
              <Link href="/about" className={linkClass('/about')}>
                About
              </Link>
            </>
          )}
          <a
            href={releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            title={releaseTitle}
          >
            {releaseLabel}
          </a>
          {themeMounted ? (
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="text-gray-400 hover:text-white transition-colors text-base leading-none"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          ) : (
            <div className="w-5 h-5 bg-gray-700 rounded animate-pulse" />
          )}
          {isAuthLoading ? (
            <div className="h-7 w-16 bg-gray-700 rounded animate-pulse" />
          ) : isLoggedIn ? (
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
