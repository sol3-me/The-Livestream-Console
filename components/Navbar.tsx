'use client';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import InstallPWAButton from './InstallPWAButton';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

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

  // Close dropdown on Escape or outside click
  useEffect(() => {
    if (!menuOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (menuRef.current?.contains(target) || toggleRef.current?.contains(target)) {
        return;
      }

      setMenuOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [menuOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const releaseTag = latestRelease?.tag_name;
  const releaseUrl = latestRelease?.html_url ?? 'https://github.com/sol3uk/The-Livestream-Console/releases/latest';
  const releaseLabel = releaseTag ?? 'latest';
  const releaseTitle = latestRelease
    ? `View ${releaseLabel} release notes`
    : 'View latest release notes';

  const linkClass = (path: string) =>
    `text-sm transition-colors hover:text-white ${pathname === path ? 'text-white font-semibold' : 'text-gray-400'
    }`;

  const dropdownLinkClass = (path: string) =>
    `block px-4 py-2 text-sm transition-colors hover:bg-gray-700 ${pathname === path ? 'text-white font-semibold' : 'text-gray-300'
    }`;

  return (
    <nav className="bg-gray-900 text-white px-4 py-3 relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <Link href="/" className="font-bold text-lg tracking-tight text-white shrink-0">
          TLC
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5 flex-wrap">
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
          <InstallPWAButton />
        </div>

        {/* Mobile: right-side controls */}
        <div className="flex md:hidden items-center gap-3">
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

          {/* Hamburger toggle */}
          <button
            ref={toggleRef}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="text-gray-400 hover:text-white transition-colors p-1"
            type="button"
          >
            {menuOpen ? (
              /* X icon */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="md:hidden absolute left-0 right-0 top-full bg-gray-900 border-t border-gray-700 shadow-lg z-50"
        >
          <div className="flex flex-col py-2">
            {isAuthLoading ? (
              <div className="px-4 py-3 space-y-3">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
              </div>
            ) : (
              <>
                {isLoggedIn ? (
                  <Link href="/dashboard" className={dropdownLinkClass('/dashboard')}>
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/" className={dropdownLinkClass('/')}>
                    Home
                  </Link>
                )}
                {isLoggedIn && (
                  <Link href="/streams" className={dropdownLinkClass('/streams')}>
                    Streams
                  </Link>
                )}
                {isLoggedIn && (
                  <Link href="/playlists" className={dropdownLinkClass('/playlists')}>
                    Playlists
                  </Link>
                )}
                <Link href="/about" className={dropdownLinkClass('/about')}>
                  About
                </Link>
                <a
                  href={releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
                  title={releaseTitle}
                >
                  Release: {releaseLabel}
                </a>
                <div className="border-t border-gray-700 mt-1 pt-1">
                  {isLoggedIn ? (
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                      type="button"
                    >
                      Log out
                    </button>
                  ) : (
                    pathname !== '/' && (
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm text-green-400 hover:bg-gray-700 transition-colors"
                      >
                        Log in
                      </Link>
                    )
                  )}
                </div>
              </>
            )}

            {/* Install CTA — always at bottom, visually distinct */}
            <div className="border-t border-gray-700 mt-1 pt-1">
              <InstallPWAButton dropdownItem />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
