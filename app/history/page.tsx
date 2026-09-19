'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getSearchHistory,
  deleteFromSearchHistory,
  clearSearchHistory,
  restoreSearchHistoryItem,
  HistoryItem,
} from '../utils/history';

function formatRelativeTime(timestamp: number, formattedFallback: string): string {
  if (!timestamp) return formattedFallback || '';
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formattedFallback || new Date(timestamp).toLocaleDateString();
}

function getCandidateInitials(name: string): string {
  if (!name || name === 'Candidate' || name === 'N/A') return 'CR';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'score'>('recent');
  const [showClearModal, setShowClearModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    try {
      const items = getSearchHistory();
      setHistory(items);
    } catch (e) {
      console.error('[History Page] Error loading history:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleCopyRoll = (e: React.MouseEvent, roll: string) => {
    e.stopPropagation();
    if (!roll || roll === 'N/A') return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(roll);
        showToast(`Roll No copied: ${roll}`);
      }
    } catch {
      showToast(`Roll: ${roll}`);
    }
  };

  // Filter & Sort items
  const displayHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = history;

    if (q) {
      list = list.filter(item => {
        const name = (item.candidateName || '').toLowerCase();
        const roll = (item.rollNo || '').toLowerCase();
        const exam = (item.examName || '').toLowerCase();
        const slug = (item.examSlug || '').toLowerCase();
        const center = (item.testCenter || '').toLowerCase();
        return name.includes(q) || roll.includes(q) || exam.includes(q) || slug.includes(q) || center.includes(q);
      });
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'score') {
        return (b.rawScore ?? 0) - (a.rawScore ?? 0);
      }
      return (b.timestamp ?? 0) - (a.timestamp ?? 0);
    });
  }, [history, searchQuery, sortBy]);

  const handleOpenItem = (item: HistoryItem, destination: '/result' | '/review-answerkey' | '/rank' = '/result') => {
    try {
      restoreSearchHistoryItem(item);
      router.push(destination);
    } catch (err) {
      console.error('Error restoring history item:', err);
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = deleteFromSearchHistory(id);
      setHistory(updated);
      showToast('Paper removed from history');
    } catch (err) {
      console.error('Error deleting history item:', err);
    }
  };

  const handleClearAll = () => {
    try {
      clearSearchHistory();
      setHistory([]);
      setShowClearModal(false);
      showToast('All search history cleared');
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  return (
    <main className="history-page-wrapper">
      {/* Dynamic Toast Feedback Pill */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f172a',
            color: '#ffffff',
            padding: '9px 18px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 800,
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
            letterSpacing: '-0.01em',
            animation: 'fadeIn 0.18s ease-out'
          }}
        >
          <span style={{ color: '#38bdf8' }}>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="history-container">

        {/* App Hero Header Card */}
        <div className="history-hero-card">
          <div className="history-header-top">
            <div className="history-brand-group">
              <div className="history-app-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <polyline points="12 7 12 12 15 15" />
                </svg>
              </div>
              <div className="history-title-group">
                <h1 className="history-main-title">
                  <span>Search History</span>
                  <span className="history-badge-pro">Saved</span>
                </h1>
                <p className="history-subtitle">
                  Previously checked answer keys, scorecards & live ranks
                </p>
              </div>
            </div>

            {history.length > 0 && (
              <div className="history-header-actions">
                <div className="history-count-pill">
                  <span className="history-online-dot"></span>
                  <span>{history.length} {history.length === 1 ? 'Paper' : 'Papers'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearModal(true)}
                  className="history-clear-btn"
                  title="Clear all search history"
                  aria-label="Clear all search history"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear All</span>
                </button>
              </div>
            )}
          </div>

          {/* Search Input & Quick Filter Chips */}
          {history.length >= 1 && (
            <div className="history-controls-bar">
              <div className="history-search-input-box">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by candidate name, roll number, or exam..."
                  className="history-search-input"
                  aria-label="Search papers"
                />
                <svg
                  className="history-search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="history-search-clear"
                    title="Clear filter"
                    aria-label="Clear filter"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Filter Sort Chips */}
              <div className="history-filter-chips">
                <button
                  type="button"
                  onClick={() => setSortBy('recent')}
                  className={`history-filter-chip${sortBy === 'recent' ? ' active' : ''}`}
                  aria-label="Sort by most recent"
                >
                  <span>⚡ Recent First</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('score')}
                  className={`history-filter-chip${sortBy === 'score' ? ' active' : ''}`}
                  aria-label="Sort by highest score"
                >
                  <span>🏆 Highest Score</span>
                </button>

                {searchQuery && (
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginLeft: 'auto' }}>
                    Showing {displayHistory.length} of {history.length}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Papers List Area */}
        {!isLoaded ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '48px 20px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.88rem',
            fontWeight: 750
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#0044cc',
              borderRadius: '50%',
              margin: '0 auto 12px auto',
              animation: 'spin 0.8s linear infinite'
            }} />
            Loading your search history...
          </div>
        ) : history.length === 0 ? (
          /* Empty State */
          <div className="history-empty-card">
            <div className="history-empty-icon-wrap">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
            </div>
            <h2 className="history-empty-title">
              No Checked Papers Yet
            </h2>
            <p className="history-empty-desc">
              Whenever you calculate an answer key on CBT Rank, your scorecards, category analysis, response metrics, and live ranks will automatically appear here for instant 1-tap access.
            </p>
            <Link href="/answerkey" className="history-empty-cta">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="3" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <circle cx="9" cy="12" r="1" fill="currentColor" />
                <circle cx="15" cy="12" r="1" fill="currentColor" />
                <circle cx="9" cy="16" r="1" fill="currentColor" />
                <circle cx="15" cy="16" r="1" fill="currentColor" />
              </svg>
              <span>Calculate Answer Key Now →</span>
            </Link>
          </div>
        ) : displayHistory.length === 0 ? (
          /* Search Filter Empty State */
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '38px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
          }}>
            <p style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 800, margin: '0 0 6px 0' }}>
              No papers found matching &quot;{searchQuery}&quot;
            </p>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 16px 0', fontWeight: 500 }}>
              Try searching with a different candidate name, roll number, or exam.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: '#0044cc',
                color: '#ffffff',
                border: 'none',
                padding: '7px 18px',
                borderRadius: '9px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Paper Cards */
          <div>
            {displayHistory.map((item) => {
              const hasBonus = Boolean(item.bonusCount && item.bonusCount > 0);
              const initials = getCandidateInitials(item.candidateName);
              const rightMarks = item.marksRight ? Number((item.correctCount * item.marksRight).toFixed(1)) : item.correctCount;
              const wrongPenalty = item.marksWrong ? Number((item.wrongCount * item.marksWrong).toFixed(1)) : item.wrongCount;
              const bonusMarks = item.marksRight ? Number((item.bonusCount * item.marksRight).toFixed(1)) : item.bonusCount;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenItem(item, '/result')}
                  className="history-paper-card"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleOpenItem(item, '/result');
                  }}
                  aria-label={`Open scorecard for ${item.candidateName}`}
                >
                  <div className="history-paper-card-inner">
                    {/* Top Row: Exam Badge, Time & Delete */}
                    <div className="history-card-top-bar">
                      <div className="history-exam-pill">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                          <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                        <span>{item.examName || 'CBT Answer Key'}</span>
                      </div>

                      <div className="history-card-top-right">
                        <span className="history-card-time">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>{formatRelativeTime(item.timestamp, item.formattedDate)}</span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="history-delete-btn"
                          title="Remove from history"
                          aria-label="Remove paper from history"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Candidate Info & Score Hero Row */}
                    <div className="history-candidate-hero-row">
                      <div className="history-candidate-profile">
                        <div className="history-candidate-avatar">
                          {initials}
                        </div>
                        <div className="history-candidate-details">
                          <div className="history-candidate-name">
                            {item.candidateName || 'Candidate'}
                          </div>

                          <div className="history-candidate-meta-pills">
                            <button
                              type="button"
                              onClick={(e) => handleCopyRoll(e, item.rollNo)}
                              className="history-roll-chip"
                              title="Click to copy roll number"
                              aria-label={`Copy roll number ${item.rollNo}`}
                            >
                              <span>Roll: <strong>{item.rollNo || 'N/A'}</strong></span>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </button>

                            {item.testDate && (
                              <span className="history-shift-meta">
                                📅 {item.testDate}
                              </span>
                            )}
                            {item.testTime && (
                              <span className="history-shift-meta">
                                ⏰ {item.testTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Elevated Hero Score Box */}
                      <div className="history-score-hero-box">
                        <div className="history-score-label">Raw Score</div>
                        <div className="history-score-val">
                          {item.rawScore !== undefined ? Number(item.rawScore).toFixed(2) : '--'}
                        </div>
                        <div className="history-score-sub">
                          {item.totalQuestions ? `${item.totalQuestions} Questions` : 'Scorecard'}
                        </div>
                      </div>
                    </div>

                    {/* Performance Breakdown Grid */}
                    <div className="history-breakdown-grid">
                      {/* 1. Right */}
                      <div className="history-stat-pill right">
                        <span className="history-stat-pill-label">
                          <span>✓</span> Right
                        </span>
                        <span className="history-stat-pill-val">
                          {item.correctCount ?? 0}
                        </span>
                        <span className="history-stat-pill-sub">
                          +{rightMarks}
                        </span>
                      </div>

                      {/* 2. Wrong */}
                      <div className="history-stat-pill wrong">
                        <span className="history-stat-pill-label">
                          <span>✕</span> Wrong
                        </span>
                        <span className="history-stat-pill-val">
                          {item.wrongCount ?? 0}
                        </span>
                        <span className="history-stat-pill-sub">
                          -{wrongPenalty}
                        </span>
                      </div>

                      {/* 3. Unattempted */}
                      <div className="history-stat-pill skip">
                        <span className="history-stat-pill-label">
                          <span>—</span> Skip
                        </span>
                        <span className="history-stat-pill-val">
                          {item.unattemptedCount ?? 0}
                        </span>
                        <span className="history-stat-pill-sub">
                          0 pts
                        </span>
                      </div>

                      {/* 4. Bonus (If present) */}
                      {hasBonus && (
                        <div className="history-stat-pill bonus">
                          <span className="history-stat-pill-label">
                            <span>★</span> Bonus
                          </span>
                          <span className="history-stat-pill-val">
                            {item.bonusCount}
                          </span>
                          <span className="history-stat-pill-sub">
                            +{bonusMarks}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rank Ribbon Banner (if rank data exists) */}
                    {(item.shiftRank && item.shiftRank > 0) || (item.overallRank && item.overallRank > 0) ? (
                      <div className="history-rank-banner">
                        <div className="history-rank-left">
                          <span>🏆</span>
                          <span>
                            {item.shiftRank && item.shiftRank > 0 ? 'Shift Rank:' : 'Live Rank:'}
                          </span>
                          <span className="history-rank-num">
                            #{item.shiftRank || item.overallRank}
                          </span>
                          {item.totalShift && item.totalShift > 0 && (
                            <span style={{ opacity: 0.85, fontSize: '0.70rem' }}>
                              of {item.totalShift.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {item.categoryRank && item.categoryRank > 0 && (
                          <div style={{ fontSize: '0.70rem', fontWeight: 800, color: '#78350f' }}>
                            Cat: #{item.categoryRank}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Touch Friendly Action Buttons */}
                    <div className="history-action-bar">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenItem(item, '/result');
                        }}
                        className="history-btn-scorecard"
                        aria-label="View scorecard for this paper"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <span>View Scorecard</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenItem(item, '/review-answerkey');
                        }}
                        className="history-btn-review"
                        aria-label="Review answer key questions"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 11l3 3L22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        <span>Review Paper</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenItem(item, '/rank');
                        }}
                        className="history-btn-rank"
                        aria-label="View live rank and cut-offs"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                          <path d="M4 22h16" />
                          <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
                          <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                        </svg>
                        <span>Rank</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Confirmation Modal for Clear All */}
      {showClearModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.15s ease-out'
          }}
          onClick={() => setShowClearModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '26px 22px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              boxSizing: 'border-box',
              border: '1px solid #e2e8f0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.18)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', textAlign: 'center', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
              Clear All Search History?
            </h3>
            <p style={{ fontSize: '0.80rem', color: '#64748b', textAlign: 'center', margin: '0 0 22px 0', lineHeight: 1.5, fontWeight: 500 }}>
              This will remove all {history.length} saved scorecards, response calculations, and ranks from this device. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  borderRadius: '11px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  borderRadius: '11px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  fontWeight: 850,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
