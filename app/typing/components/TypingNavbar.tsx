'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface TypingCandidate {
  name: string;
  rollNo?: string;
  targetExam: string;
  loggedInAt?: number;
}

interface TypingNavbarProps {
  candidate: TypingCandidate | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
}

export default function TypingNavbar({
  candidate,
  onOpenLoginModal,
  onLogout,
}: TypingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="typing-nav-root">
      <div className="typing-nav-container">
        {/* Brand Left */}
        <div className="typing-nav-brand-group">
          <Link href="/typing" className="typing-nav-brand">
            <span className="typing-nav-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
              </svg>
            </span>
            <div className="typing-nav-brand-text">
              <span className="typing-nav-brand-title">CBT TYPING</span>
              <span className="typing-nav-brand-badge">EXAM SIMULATOR</span>
            </div>
          </Link>
        </div>

        {/* Desktop Menu Links */}
        <nav className="typing-nav-desktop-links" aria-label="Typing Portal Navigation">
          <button
            type="button"
            onClick={() => scrollToSection('test-arena')}
            className="typing-nav-link"
          >
            <span>Typing Test</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('exam-modes')}
            className="typing-nav-link"
          >
            <span>Exam Modes</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('marking-rules')}
            className="typing-nav-link"
          >
            <span>Evaluation Rules</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pro-tips')}
            className="typing-nav-link"
          >
            <span>Tips &amp; Tricks</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="typing-nav-right-actions">
          {/* Back to Main CBT Rank */}
          <Link
            href="/"
            className="typing-nav-back-link"
            title="Return to Main CBT Rank Calculator Portal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>CBT Rank</span>
          </Link>

          {/* User Auth Section */}
          {candidate ? (
            <div className="typing-user-pill-wrapper">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="typing-user-pill-btn"
                aria-expanded={userDropdownOpen}
              >
                <div className="typing-user-avatar">
                  {candidate.name.charAt(0).toUpperCase()}
                </div>
                <div className="typing-user-info-text">
                  <span className="typing-user-name">{candidate.name}</span>
                  <span className="typing-user-target">{candidate.targetExam}</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {userDropdownOpen && (
                <div className="typing-user-dropdown">
                  <div className="typing-user-dropdown-header">
                    <strong>{candidate.name}</strong>
                    {candidate.rollNo && <span>Roll: {candidate.rollNo}</span>}
                    <span className="typing-badge-sub">{candidate.targetExam}</span>
                  </div>
                  <div className="typing-dropdown-divider" />
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenLoginModal();
                    }}
                    className="typing-dropdown-item"
                  >
                    ✏️ Edit Profile / Change Exam
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="typing-dropdown-item danger"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="typing-nav-login-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Aspirant Login</span>
            </button>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="typing-mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="typing-mobile-drawer">
          <div className="typing-mobile-drawer-links">
            <button
              type="button"
              onClick={() => scrollToSection('test-arena')}
              className="typing-mobile-link"
            >
              ⌨️ Typing Test Arena
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('exam-modes')}
              className="typing-mobile-link"
            >
              🏛️ Exam Patterns &amp; Durations
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('marking-rules')}
              className="typing-mobile-link"
            >
              📝 Evaluation &amp; Error Rules
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pro-tips')}
              className="typing-mobile-link"
            >
              💡 Typing Tips
            </button>
            <Link
              href="/"
              className="typing-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              🌐 Back to CBT Rank Calculator
            </Link>
          </div>
          <div className="typing-mobile-auth-bar">
            {candidate ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{candidate.name}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{candidate.targetExam}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="typing-btn-logout-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLoginModal();
                }}
                className="typing-mobile-login-btn"
              >
                Aspirant Login / Profile
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
