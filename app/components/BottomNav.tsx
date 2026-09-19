'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);

  // Eagerly prefetch all bottom nav tabs on mount so page payloads are cached instantly in memory
  useEffect(() => {
    try {
      router.prefetch('/');
      router.prefetch('/answerkey');
      router.prefetch('/history');
      router.prefetch('/blog');
    } catch {
      // router.prefetch safety fallback
    }
  }, [router]);

  // When route transition finishes, sync optimistic path back with actual pathname
  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  const currentPath = optimisticPath ?? pathname;

  if (pathname?.startsWith('/review-answerkey')) {
    return null;
  }

  const isHomeActive = currentPath === '/';
  const isCalculatorActive =
    currentPath === '/answerkey' ||
    currentPath.startsWith('/answerkey/') ||
    currentPath.endsWith('/answerkey') ||
    currentPath.startsWith('/calculator');
  const isHistoryActive = currentPath === '/history' || currentPath.startsWith('/history/');
  const isBlogActive = currentPath === '/blog' || currentPath.startsWith('/blog/');

  const handleTabPress = (path: string) => {
    setOptimisticPath(path);
  };

  return (
    <nav className="bottom-nav" aria-label="Mobile Navigation Menu">
      {/* 1. Home Tab */}
      <Link
        href="/"
        prefetch={true}
        className={`bottom-nav-tab${isHomeActive ? ' active' : ''}`}
        aria-label="Home"
        aria-current={isHomeActive ? 'page' : undefined}
        onClick={() => handleTabPress('/')}
        onTouchStart={() => handleTabPress('/')}
      >
        <div className="bottom-nav-icon-box">
          {isHomeActive ? (
            <svg
              className="bottom-nav-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M11.293 2.293a1 1 0 0 1 1.414 0l8 8A1 1 0 0 1 20 12h-1v8a2 2 0 0 1-2 2h-4a1 1 0 0 1-1-1v-5h-4v5a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-8H2a1 1 0 0 1-.707-1.707l8-8z" />
            </svg>
          ) : (
            <svg
              className="bottom-nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          )}
        </div>
        <span className="bottom-nav-label">Home</span>
      </Link>

      {/* 2. Calculator Tab */}
      <Link
        href="/answerkey"
        prefetch={true}
        className={`bottom-nav-tab${isCalculatorActive ? ' active' : ''}`}
        aria-label="Calculator"
        aria-current={isCalculatorActive ? 'page' : undefined}
        onClick={() => handleTabPress('/answerkey')}
        onTouchStart={() => handleTabPress('/answerkey')}
      >
        <div className="bottom-nav-icon-box">
          <svg
            className="bottom-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="2" width="16" height="20" rx="3" strokeWidth="2" />
            <line x1="8" y1="7" x2="16" y2="7" strokeWidth="2.4" />
            <circle cx="8.5" cy="12" r="1.2" fill="currentColor" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" />
            <circle cx="15.5" cy="12" r="1.2" fill="currentColor" />
            <circle cx="8.5" cy="16.5" r="1.2" fill="currentColor" />
            <circle cx="12" cy="16.5" r="1.2" fill="currentColor" />
            <circle cx="15.5" cy="16.5" r="1.2" fill="currentColor" />
          </svg>
        </div>
        <span className="bottom-nav-label">Calculator</span>
      </Link>

      {/* 3. History Tab */}
      <Link
        href="/history"
        prefetch={true}
        className={`bottom-nav-tab${isHistoryActive ? ' active' : ''}`}
        aria-label="History"
        aria-current={isHistoryActive ? 'page' : undefined}
        onClick={() => handleTabPress('/history')}
        onTouchStart={() => handleTabPress('/history')}
      >
        <div className="bottom-nav-icon-box">
          {isHistoryActive ? (
            <svg
              className="bottom-nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          ) : (
            <svg
              className="bottom-nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          )}
        </div>
        <span className="bottom-nav-label">History</span>
      </Link>

      {/* 4. Blog Tab */}
      <Link
        href="/blog"
        prefetch={true}
        className={`bottom-nav-tab${isBlogActive ? ' active' : ''}`}
        aria-label="Blog"
        aria-current={isBlogActive ? 'page' : undefined}
        onClick={() => handleTabPress('/blog')}
        onTouchStart={() => handleTabPress('/blog')}
      >
        <div className="bottom-nav-icon-box">
          {isBlogActive ? (
            <svg
              className="bottom-nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" />
              <line x1="9.5" y1="7.5" x2="16.5" y2="7.5" stroke="currentColor" strokeWidth="2.2" />
              <line x1="9.5" y1="11.5" x2="14.5" y2="11.5" stroke="currentColor" strokeWidth="2.2" />
              <line x1="9.5" y1="15.5" x2="12.5" y2="15.5" stroke="currentColor" strokeWidth="2.2" />
            </svg>
          ) : (
            <svg
              className="bottom-nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="9.5" y1="7.5" x2="16.5" y2="7.5" />
              <line x1="9.5" y1="11.5" x2="14.5" y2="11.5" />
            </svg>
          )}
        </div>
        <span className="bottom-nav-label">Blog</span>
      </Link>
    </nav>
  );
}
