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

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
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
        showToast(`Copied roll: ${roll}`);
      }
    } catch {
      showToast(`Roll: ${roll}`);
    }
  };

  // Filter & Sort
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
      showToast('Paper removed');
    } catch (err) {
      console.error('Error deleting history item:', err);
    }
  };

  const handleClearAll = () => {
    try {
      clearSearchHistory();
      setHistory([]);
      setShowClearModal(false);
      showToast('History cleared');
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  return (
    <main className="history-page-wrapper">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f172a',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '0.80rem',
            fontWeight: 700,
            boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <span style={{ color: '#38bdf8' }}>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="history-container">

        {/* Minimalist Clean Header */}
        <header className="history-header">
          <div className="history-header-top">
            <div>
              <h1 className="history-title">
                <span>History</span>
                {history.length > 0 && (
                  <span className="history-count-badge">{history.length}</span>
                )}
              </h1>
              <p className="history-subtitle">
                Previously checked answer keys and scorecards
              </p>
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="history-clear-link"
                title="Clear history"
                aria-label="Clear all search history"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear all</span>
              </button>
            )}
          </div>

          {/* Search & Sort Row */}
          {history.length >= 1 && (
            <div className="history-search-row">
              <div className="history-search-box">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate, roll no, or exam..."
                  className="history-search-input"
                  aria-label="Search papers"
                />
                <svg
                  className="history-search-icon"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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

              {/* Simple Sort Tabs */}
              <div className="history-filter-tabs">
                <button
                  type="button"
                  onClick={() => setSortBy('recent')}
                  className={`history-filter-tab${sortBy === 'recent' ? ' active' : ''}`}
                  aria-label="Sort by recent"
                >
                  Recent
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('score')}
                  className={`history-filter-tab${sortBy === 'score' ? ' active' : ''}`}
                  aria-label="Sort by highest score"
                >
                  Top Score
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Papers List */}
        {!isLoaded ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '36px 20px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.84rem',
            fontWeight: 600
          }}>
            Loading history...
          </div>
        ) : history.length === 0 ? (
          /* Empty State */
          <div className="history-empty-simple">
            <div className="history-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
            </div>
            <h2 className="history-empty-heading">No History Yet</h2>
            <p className="history-empty-text">
              Whenever you check an answer key on CBT Rank, your calculated scorecards and response breakdown will be saved here automatically.
            </p>
            <Link href="/answerkey" className="history-empty-btn">
              <span>Calculate Answer Key</span>
              <span>→</span>
            </Link>
          </div>
        ) : displayHistory.length === 0 ? (
          /* Search Empty State */
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '32px 20px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 700, margin: '0 0 8px 0' }}>
              No papers found matching &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '6px 14px',
                borderRadius: '7px',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              Clear filter
            </button>
          </div>
        ) : (
          /* Simple Premium Cards */
          <div>
            {displayHistory.map((item) => {
              const hasBonus = Boolean(item.bonusCount && item.bonusCount > 0);
              const rankVal = item.shiftRank || item.overallRank;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenItem(item, '/result')}
                  className="history-card"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleOpenItem(item, '/result');
                  }}
                  aria-label={`Open scorecard for ${item.candidateName}`}
                >
                  {/* Card Header: Exam Tag & Timestamp */}
                  <div className="history-card-header">
                    <span className="history-exam-tag">
                      {item.examName || 'CBT Answer Key'}
                    </span>

                    <div className="history-header-meta">
                      <span className="history-time-text">
                        {formatRelativeTime(item.timestamp, item.formattedDate)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="history-trash-btn"
                        title="Remove paper"
                        aria-label="Remove paper from history"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Card Body: Candidate Info & Score */}
                  <div className="history-card-body">
                    <div>
                      <div className="history-candidate-title">
                        {item.candidateName || 'Candidate'}
                      </div>
                      <div className="history-candidate-sub">
                        <span
                          className="history-roll-pill"
                          onClick={(e) => handleCopyRoll(e, item.rollNo)}
                          title="Click to copy roll number"
                        >
                          <span>{item.rollNo || 'N/A'}</span>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </span>

                        {item.testDate && <span>• {item.testDate}</span>}
                        {item.testTime && <span>• {item.testTime}</span>}
                      </div>
                    </div>

                    <div className="history-score-display">
                      <div className="history-score-caption">Score</div>
                      <div className="history-score-number">
                        {item.rawScore !== undefined ? Number(item.rawScore).toFixed(2) : '--'}
                      </div>
                    </div>
                  </div>

                  {/* Inline Clean Metrics Strip */}
                  <div className="history-metrics-strip">
                    <span className="history-metric-item">
                      <span className="history-dot-right"></span>
                      <span><strong>{item.correctCount ?? 0}</strong> Right</span>
                    </span>

                    <span className="history-metric-divider">•</span>

                    <span className="history-metric-item">
                      <span className="history-dot-wrong"></span>
                      <span><strong>{item.wrongCount ?? 0}</strong> Wrong</span>
                    </span>

                    <span className="history-metric-divider">•</span>

                    <span className="history-metric-item">
                      <span className="history-dot-skip"></span>
                      <span><strong>{item.unattemptedCount ?? 0}</strong> Skip</span>
                    </span>

                    {hasBonus && (
                      <>
                        <span className="history-metric-divider">•</span>
                        <span className="history-metric-item">
                          <span className="history-dot-bonus"></span>
                          <span><strong>{item.bonusCount}</strong> Bonus</span>
                        </span>
                      </>
                    )}

                    {rankVal && rankVal > 0 ? (
                      <span className="history-metric-rank">
                        🏆 #{rankVal} {item.totalShift ? `of ${item.totalShift}` : 'Rank'}
                      </span>
                    ) : null}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="history-card-footer">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenItem(item, '/result');
                      }}
                      className="history-action-primary"
                      aria-label="View scorecard"
                    >
                      <span>View Scorecard</span>
                      <span>→</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenItem(item, '/review-answerkey');
                      }}
                      className="history-action-secondary"
                      aria-label="Review answer key questions"
                    >
                      <span>Review Paper</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenItem(item, '/rank');
                      }}
                      className="history-action-rank"
                      aria-label="View rank prediction"
                    >
                      <span>🏆 Rank</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowClearModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '22px 20px',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              boxSizing: 'border-box',
              border: '1px solid #e2e8f0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              Clear Search History?
            </h3>
            <p style={{ fontSize: '0.80rem', color: '#64748b', margin: '0 0 18px 0', lineHeight: 1.45 }}>
              This will remove all your saved scorecards from this device.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.80rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 750,
                  fontSize: '0.80rem',
                  cursor: 'pointer'
                }}
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
