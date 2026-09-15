'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const isHomeActive = pathname === '/';
  const isCalculatorActive =
    pathname === '/answerkey' ||
    pathname.startsWith('/answerkey/') ||
    pathname.endsWith('/answerkey') ||
    pathname.startsWith('/calculator');
  const isBlogActive = pathname === '/blog' || pathname.startsWith('/blog/');

  return (
    <nav className="bottom-nav" aria-label="Mobile Navigation Menu">
      {/* 1. Home Tab */}
      <Link
        href="/"
        className={`bottom-nav-item${isHomeActive ? ' active' : ''}`}
        aria-label="Home"
        aria-current={isHomeActive ? 'page' : undefined}
      >
        <div className="bottom-nav-icon-wrapper">
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
        {isHomeActive && <span className="bottom-nav-dot" aria-hidden="true" />}
      </Link>

      {/* 2. Calculator Tab */}
      <Link
        href="/answerkey"
        className={`bottom-nav-item${isCalculatorActive ? ' active' : ''}`}
        aria-label="Calculator"
        aria-current={isCalculatorActive ? 'page' : undefined}
      >
        <div className="bottom-nav-icon-wrapper">
          {isCalculatorActive ? (
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
              <rect x="4" y="2" width="16" height="20" rx="3" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="2" />
              <line x1="8" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="2.4" />
              <circle cx="8.5" cy="12" r="1.2" fill="currentColor" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" />
              <circle cx="15.5" cy="12" r="1.2" fill="currentColor" />
              <circle cx="8.5" cy="16.5" r="1.2" fill="currentColor" />
              <circle cx="12" cy="16.5" r="1.2" fill="currentColor" />
              <circle cx="15.5" cy="16.5" r="1.2" fill="currentColor" />
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
              <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
              <line x1="8" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="2.2" />
              <circle cx="8.5" cy="12" r="1.1" fill="currentColor" />
              <circle cx="12" cy="12" r="1.1" fill="currentColor" />
              <circle cx="15.5" cy="12" r="1.1" fill="currentColor" />
              <circle cx="8.5" cy="16.5" r="1.1" fill="currentColor" />
              <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
              <circle cx="15.5" cy="16.5" r="1.1" fill="currentColor" />
            </svg>
          )}
        </div>
        <span className="bottom-nav-label">Calculator</span>
        {isCalculatorActive && <span className="bottom-nav-dot" aria-hidden="true" />}
      </Link>

      {/* 3. Blog Tab */}
      <Link
        href="/blog"
        className={`bottom-nav-item${isBlogActive ? ' active' : ''}`}
        aria-label="Blog"
        aria-current={isBlogActive ? 'page' : undefined}
      >
        <div className="bottom-nav-icon-wrapper">
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
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="2" />
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
        {isBlogActive && <span className="bottom-nav-dot" aria-hidden="true" />}
      </Link>
    </nav>
  );
}
