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
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formattedFallback || new Date(timestamp).toLocaleDateString();
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Toast auto-hide
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Filter items by search query
  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter(item => {
      const name = (item.candidateName || '').toLowerCase();
      const roll = (item.rollNo || '').toLowerCase();
      const exam = (item.examName || '').toLowerCase();
      const slug = (item.examSlug || '').toLowerCase();
      const center = (item.testCenter || '').toLowerCase();
      return name.includes(q) || roll.includes(q) || exam.includes(q) || slug.includes(q) || center.includes(q);
    });
  }, [history, searchQuery]);

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
      showToast('Search history cleared');
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  return (
    <main className="history-page-wrapper" style={{
      minHeight: '85vh',
      background: '#f8fafc',
      padding: '24px 16px calc(50px + env(safe-area-inset-bottom, 0px)) 16px'
    }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 20px',
          borderRadius: '9999px',
          fontSize: '0.84rem',
          fontWeight: 700,
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>

        {/* Header Section */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          padding: '22px 20px',
          marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0044cc 0%, #0066ff 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 68, 204, 0.25)',
                flexShrink: 0
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <polyline points="12 7 12 12 15 15" />
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  Search History
                </h1>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '3px 0 0 0', fontWeight: 600 }}>
                  Previously checked answer keys & scorecards
                </p>
              </div>
            </div>

            {history.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0'
                }}>
                  {history.length} {history.length === 1 ? 'Paper' : 'Papers'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowClearModal(true)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Clear all search history"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Search Filter Bar (Only if history has 2+ items) */}
          {history.length >= 2 && (
            <div style={{ marginTop: '16px', position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by candidate name, roll number, or exam..."
                style={{
                  width: '100%',
                  padding: '9px 38px 9px 36px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease'
                }}
              />
              {/* Search Icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {/* Clear search query button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontWeight: 900,
                    fontSize: '1rem',
                    padding: '4px'
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Section */}
        {!isLoaded ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.88rem',
            fontWeight: 700
          }}>
            Loading history...
          </div>
        ) : history.length === 0 ? (
          /* Empty State */
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px dashed #cbd5e1',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#eff6ff',
              color: '#0044cc',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
              No Search History Found
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 24px auto', lineHeight: 1.5, fontWeight: 500 }}>
              Whenever you calculate an answer key, your scorecards, response breakdown, and rank will be automatically saved here so you can revisit them anytime.
            </p>
            <Link
              href="/answerkey"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0044cc 0%, #0055ff 100%)',
                color: '#ffffff',
                padding: '11px 24px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 68, 204, 0.28)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="4" y="2" width="16" height="20" rx="3" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <circle cx="9" cy="12" r="1" fill="currentColor" />
                <circle cx="15" cy="12" r="1" fill="currentColor" />
              </svg>
              Calculate Answer Key Now →
            </Link>
          </div>
        ) : filteredHistory.length === 0 ? (
          /* Search Empty State */
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            padding: '36px 20px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, margin: '0 0 12px 0' }}>
              No results match &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              Clear Filter
            </button>
          </div>
        ) : (
          /* Cards List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredHistory.map((item) => {
              const hasBonus = Boolean(item.bonusCount && item.bonusCount > 0);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenItem(item, '/result')}
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1.5px solid #e2e8f0',
                    padding: '16px 16px 14px 16px',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0044cc';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 68, 204, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(15, 23, 42, 0.03)';
                  }}
                >
                  {/* Top Bar: Exam Name & Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                    <span style={{
                      background: '#eff6ff',
                      color: '#0044cc',
                      border: '1px solid #bfdbfe',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      maxWidth: '70%',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.examName || 'CBT Answer Key'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.70rem',
                        color: '#64748b',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        {formatRelativeTime(item.timestamp, item.formattedDate)}
                      </span>

                      {/* Delete icon button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          padding: '3px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                        title="Remove from history"
                        aria-label="Remove paper from history"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Candidate Info Strip */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>👤</span>
                        <span>{item.candidateName}</span>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>Roll: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{item.rollNo}</strong></span>
                        {item.testDate && <span>• 📅 {item.testDate}</span>}
                        {item.testTime && <span>• ⏰ {item.testTime}</span>}
                      </div>
                    </div>

                    {/* Total Score Badge */}
                    <div style={{
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: '10px',
                      textAlign: 'right',
                      flexShrink: 0
                    }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Score
                      </div>
                      <div style={{ fontSize: '1.12rem', fontWeight: 900, color: '#38bdf8', lineHeight: 1, fontFamily: 'monospace' }}>
                        {item.rawScore !== undefined ? Number(item.rawScore).toFixed(2) : '--'}
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Stats Badges */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    padding: '7px 10px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    marginBottom: '12px'
                  }}>
                    <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                      Right: {item.correctCount ?? 0}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}></span>
                      Wrong: {item.wrongCount ?? 0}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }}></span>
                      Skip: {item.unattemptedCount ?? 0}
                    </span>
                    {hasBonus && (
                      <>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span style={{ color: '#9333ea', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9333ea', display: 'inline-block' }}></span>
                          Bonus: {item.bonusCount}
                        </span>
                      </>
                    )}
                    {item.shiftRank && item.shiftRank > 0 ? (
                      <>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span style={{ color: '#0044cc' }}>
                          🏆 Shift Rank: #{item.shiftRank}
                        </span>
                      </>
                    ) : null}
                  </div>

                  {/* Actions Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenItem(item, '/result');
                      }}
                      style={{
                        flex: 1.2,
                        background: '#0044cc',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '7px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#0033aa'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#0044cc'}
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
                      style={{
                        flex: 1,
                        background: '#ffffff',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '7px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#94a3b8';
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      <span>Review Paper</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenItem(item, '/rank');
                      }}
                      style={{
                        flex: 0.8,
                        background: '#ffffff',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '7px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0fdf4';
                        e.currentTarget.style.borderColor = '#16a34a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#bbf7d0';
                      }}
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
            backdropFilter: 'blur(3px)',
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
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', textAlign: 'center', margin: '0 0 8px 0' }}>
              Clear All Search History?
            </h3>
            <p style={{ fontSize: '0.80rem', color: '#64748b', textAlign: 'center', margin: '0 0 20px 0', lineHeight: 1.45 }}>
              This will remove all your saved scorecards and response calculations from this device. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 800,
                  fontSize: '0.78rem',
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
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
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
