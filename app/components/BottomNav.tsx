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
      {/* Home Tab */}
      <Link
        href="/"
        className={`bottom-nav-item${isHomeActive ? ' active' : ''}`}
        aria-label="Home"
        aria-current={isHomeActive ? 'page' : undefined}
      >
        {isHomeActive && <span className="bottom-nav-indicator" />}
        <div className="bottom-nav-icon-wrapper">
          <svg
            className="bottom-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 10.5L12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5v-9z" />
            <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" />
          </svg>
        </div>
        <span className="bottom-nav-label">Home</span>
      </Link>

      {/* Calculator Tab */}
      <Link
        href="/answerkey"
        className={`bottom-nav-item${isCalculatorActive ? ' active' : ''}`}
        aria-label="Calculator"
        aria-current={isCalculatorActive ? 'page' : undefined}
      >
        {isCalculatorActive && <span className="bottom-nav-indicator" />}
        <div className="bottom-nav-icon-wrapper">
          <svg
            className="bottom-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="2" width="16" height="20" rx="3" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="16" y1="14" x2="16" y2="18" />
            <path
              d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="bottom-nav-label">Calculator</span>
      </Link>

      {/* Blog Tab */}
      <Link
        href="/blog"
        className={`bottom-nav-item${isBlogActive ? ' active' : ''}`}
        aria-label="Blog"
        aria-current={isBlogActive ? 'page' : undefined}
      >
        {isBlogActive && <span className="bottom-nav-indicator" />}
        <div className="bottom-nav-icon-wrapper">
          <svg
            className="bottom-nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="9" y1="7" x2="15" y2="7" />
            <line x1="9" y1="11" x2="15" y2="11" />
          </svg>
        </div>
        <span className="bottom-nav-label">Blog</span>
      </Link>
    </nav>
  );
}
