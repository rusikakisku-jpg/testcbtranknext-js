'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Use dedicated TypingNavbar when on /typing
  if (pathname?.startsWith('/typing')) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="navbar" id="navbar">
      <div className="navbar-inner">
        <Link href="/" className="nav-logo" aria-label="CBT RANK Home">
          <img
            src="https://upload.cbtrank.com/logo.png"
            alt="CBT RANK Logo"
            className="logo-img"
            width={42}
            height={42}
          />
          <span className="logo-text">CBT RANK</span>
        </Link>

        <nav aria-label="Main Navigation">
          <ul className="nav-links">
            <li>
              <Link href="/" className={isActive('/') ? 'active' : ''}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/tools" className={isActive('/tools') ? 'active' : ''}>
                Tools
              </Link>
            </li>
            <li>
              <Link href="/typing" className={isActive('/typing') ? 'active' : ''}>
                Typing
              </Link>
            </li>
            <li>
              <Link href="/answerkey" className={isActive('/answerkey') ? 'active' : ''}>
                Answer Key
              </Link>
            </li>
            <li>
              <Link href="/history" className={isActive('/history') ? 'active' : ''}>
                History
              </Link>
            </li>
            <li>
              <Link href="/blog" className={isActive('/blog') ? 'active' : ''}>
                Blog
              </Link>
            </li>
            <li className="nav-dropdown">
              <button type="button" className="nav-dropdown-trigger">
                Sarkari Alerts ▾
              </button>
              <div className="nav-dropdown-menu">
                <Link href="/latest-jobs" className={isActive('/latest-jobs') ? 'active' : ''}>
                  Latest Jobs
                </Link>
                <Link href="/admit-card" className={isActive('/admit-card') ? 'active' : ''}>
                  Admit Card
                </Link>
                <Link href="/results" className={isActive('/results') ? 'active' : ''}>
                  Results
                </Link>
                <Link href="/answer-key" className={isActive('/answer-key') ? 'active' : ''}>
                  Answer Key
                </Link>
                <Link href="/syllabus" className={isActive('/syllabus') ? 'active' : ''}>
                  Syllabus
                </Link>
              </div>
            </li>
          </ul>
        </nav>

        <button
          className={`hamburger${isOpen ? ' open' : ''}`}
          id="hamburger"
          aria-label="Toggle Navigation Menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div
        className={`mobile-drawer${isOpen ? ' open' : ''}`}
        id="mobile-drawer"
        role="navigation"
        aria-label="Mobile Navigation"
      >
        <Link
          href="/"
          className={isActive('/') ? 'active' : ''}
          onClick={() => setIsOpen(false)}
        >
          Home
        </Link>
        <Link
          href="/tools"
          className={isActive('/tools') ? 'active' : ''}
          onClick={() => setIsOpen(false)}
        >
          Tools
        </Link>
        <Link
          href="/typing"
          className={isActive('/typing') ? 'active' : ''}
          onClick={() => setIsOpen(false)}
        >
          Typing Test
        </Link>
        <Link
          href="/answerkey"
          className={isActive('/answerkey') ? 'active' : ''}
          onClick={() => setIsOpen(false)}
        >
          Answer Key
        </Link>
        <Link
          href="/history"
          className={isActive('/history') ? 'active' : ''}
          onClick={() => setIsOpen(false)}
        >
          History
        </Link>
        <Link
          href="/blog"
          className={isActive('/blog') ? 'active' : ''}
          onClick={() => setIsOpen(false)}
        >
          Blog
        </Link>
        <Link
          href="/latest-jobs"
          className={isActive('/latest-jobs') ? 'active' : ''}
          onClick={() => setIsOpen(false)}
        >
          Latest Jobs
        </Link>
        <Link
          href="/admit-card"
          className={isActive('/admit-card') ? 'active' : ''}
          onClick={() => setIsOpen(false)}
        >
          Admit Card
        </Link>
        <Link
          href="/results"
          className={isActive('/results') ? 'active' : ''}
          onClick={() => setIsOpen(false)}
        >
          Results
        </Link>
        <Link
          href="/answer-key"
          className={isActive('/answer-key') ? 'active' : ''}
          onClick={() => setIsOpen(false)}
        >
          Answer Key
        </Link>
        <Link
          href="/syllabus"
          className={isActive('/syllabus') ? 'active' : ''}
          onClick={() => setIsOpen(false)}
        >
          Syllabus
        </Link>
      </div>
    </header>
  );
}
