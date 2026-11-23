'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const TYPING_PASSAGES = [
  {
    title: 'SSC Pattern: Economic & Governance',
    text: 'The economic transformation of India over the past few decades has been driven by rapid digital adoption, manufacturing initiatives, and infrastructure modernization. Government competitive examinations have expanded access for youth across diverse states and regional backgrounds. Digital public infrastructure such as unified payments and online governance platforms have accelerated financial inclusion in rural and urban areas alike. As India continues to integrate with the global economy, educational institutions and public sector organizations are prioritizing digital literacy, administrative efficiency, and transparency in public service delivery. Aspirants preparing for national recruitment tests must cultivate steady speed, analytical precision, and consistent discipline to meet administrative standards.'
  },
  {
    title: 'Railway Pattern: Transport & Development',
    text: 'Indian Railways represents one of the largest and most complex transport networks in the world, connecting thousands of stations and carrying millions of passengers daily. The recent introduction of modern train sets, station redevelopment programs, and advanced signaling technology has significantly improved travel safety and passenger convenience. Dedicated freight corridors have revolutionized cargo movement across industrial hubs, reducing logistics costs and supporting national economic growth. Dedicated staff and technical professionals play an indispensable role in maintaining track safety and scheduling efficiency across all operating divisions.'
  },
  {
    title: 'General English: Science & Innovation',
    text: 'Scientific research and technological innovation are fundamental pillars of modern human progress. The transition towards renewable energy such as solar power, wind generation, and electric transport is reducing environmental degradation while creating sustainable employment opportunities worldwide. Clean water conservation, forest protection, and efficient municipal waste management ensure that natural resources remain viable for future generations. Dedicated young professionals with strong analytical thinking and technical capabilities are essential for driving scientific achievements.'
  }
];

export default function TypingPage() {
  const [selectedPassageIndex, setSelectedPassageIndex] = useState<number>(0);
  const [testDuration, setTestDuration] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isTestActive, setIsTestActive] = useState<boolean>(false);
  const [isTestFinished, setIsTestFinished] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>('');
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [keystrokes, setKeystrokes] = useState<number>(0);
  const [backspaces, setBackspaces] = useState<number>(0);
  const typingInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<any>(null);

  const currentPassageWords = TYPING_PASSAGES[selectedPassageIndex].text.trim().split(/\s+/);

  const startTypingTest = () => {
    setIsTestActive(true);
    setIsTestFinished(false);
    setTimeLeft(testDuration);
    setUserInput('');
    setTypedWords([]);
    setKeystrokes(0);
    setBackspaces(0);
    setTimeout(() => {
      typingInputRef.current?.focus();
    }, 50);
  };

  const resetTypingTest = (newDuration?: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const dur = newDuration !== undefined ? newDuration : testDuration;
    setIsTestActive(false);
    setIsTestFinished(false);
    setTimeLeft(dur);
    setUserInput('');
    setTypedWords([]);
    setKeystrokes(0);
    setBackspaces(0);
  };

  useEffect(() => {
    if (isTestActive && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTestActive(false);
            setIsTestFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTestActive, timeLeft]);

  const handleTypingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isTestFinished) return;

    if (!isTestActive) {
      setIsTestActive(true);
    }

    if (e.key === 'Backspace') {
      setBackspaces((b) => b + 1);
    }

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const trimmed = userInput.trim();
      if (trimmed.length > 0) {
        setTypedWords((prev) => [...prev, trimmed]);
        setUserInput('');

        if (typedWords.length + 1 >= currentPassageWords.length) {
          setIsTestActive(false);
          setIsTestFinished(true);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
      }
    } else if (e.key.length === 1) {
      setKeystrokes((k) => k + 1);
    }
  };

  const elapsedSeconds = testDuration - timeLeft;
  const elapsedMinutes = Math.max(elapsedSeconds, 1) / 60;

  let correctWordsCount = 0;
  let incorrectWordsCount = 0;
  typedWords.forEach((word, idx) => {
    if (idx < currentPassageWords.length) {
      if (word === currentPassageWords[idx]) {
        correctWordsCount++;
      } else {
        incorrectWordsCount++;
      }
    }
  });

  const totalTypedWords = typedWords.length;
  const grossWpm = Math.round(totalTypedWords / elapsedMinutes) || 0;
  const netWpm = Math.max(0, Math.round((correctWordsCount - incorrectWordsCount * 0.5) / elapsedMinutes)) || 0;
  const accuracy = totalTypedWords > 0 ? Math.round((correctWordsCount / totalTypedWords) * 100) : 100;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = Math.min(100, Math.round((typedWords.length / currentPassageWords.length) * 100));

  return (
    <main className="typing-page-main">
      <style>{`
        .typing-page-main {
          min-height: calc(100vh - 140px);
          background: #f8fafc;
          padding: 24px 16px 84px;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing: border-box;
          overflow-x: hidden;
          width: 100%;
        }
        .typing-container {
          max-width: 800px;
          margin: 0 auto;
          box-sizing: border-box;
          width: 100%;
        }

        /* Header Card */
        .typing-main-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
          margin-bottom: 20px;
          box-sizing: border-box;
          width: 100%;
        }
        .typing-header-row {
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 16px;
          margin-bottom: 18px;
        }
        .typing-header-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }
        .typing-header-text {
          flex: 1;
          min-width: 0;
        }
        .typing-title-h1 {
          font-size: 1.35rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .typing-subtitle-p {
          font-size: 0.86rem;
          color: #64748b;
          margin: 0;
          line-height: 1.45;
        }
        .exam-pattern-pill {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 800;
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 2px 8px;
          border-radius: 999px;
          margin-bottom: 4px;
          text-transform: uppercase;
        }

        /* Tips Banner */
        .hardware-hint-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 0.82rem;
          color: #1e40af;
          margin-bottom: 18px;
          line-height: 1.4;
        }

        /* Controls: Duration & Timer */
        .controls-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 12px 14px;
          border-radius: 14px;
          margin-bottom: 16px;
        }
        .durations-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .duration-chip {
          padding: 6px 11px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .duration-chip:hover {
          border-color: #94a3b8;
          background: #f1f5f9;
        }
        .duration-chip.active {
          border-color: #059669;
          background: #ecfdf5;
          color: #047857;
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.15);
        }
        .timer-badge-box {
          font-size: 1.25rem;
          font-weight: 850;
          color: #059669;
          background: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          padding: 6px 14px;
          border-radius: 10px;
          font-variant-numeric: tabular-nums;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .timer-badge-box.warning {
          color: #dc2626;
          background: #fee2e2;
          border-color: #fca5a5;
        }

        /* Passage Selector */
        .passage-select-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 750;
          color: #334155;
          margin-bottom: 6px;
        }
        .passage-select-input {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.9rem;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          box-sizing: border-box;
          margin-bottom: 16px;
          cursor: pointer;
        }
        .passage-select-input:focus {
          border-color: #059669;
        }

        /* Live 4-Stats Grid (Responsive 2x2 on Mobile, 4-col on Desktop) */
        .stats-dashboard {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .stat-tile {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 8px;
          text-align: center;
        }
        .stat-tile-val {
          font-size: 1.45rem;
          font-weight: 850;
          line-height: 1.1;
          letter-spacing: -0.01em;
        }
        .stat-tile-lbl {
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 750;
          text-transform: uppercase;
          margin-top: 4px;
          letter-spacing: 0.02em;
        }

        /* Progress Bar */
        .progress-bar-container {
          width: 100%;
          height: 4px;
          background: #e2e8f0;
          border-radius: 999px;
          margin-bottom: 10px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: #059669;
          transition: width 0.2s ease;
        }

        /* Reading Passage Box */
        .passage-card-box {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 14px;
          padding: 16px;
          font-size: 1.02rem;
          line-height: 1.8;
          max-height: 180px;
          overflow-y: auto;
          user-select: none;
          box-sizing: border-box;
          cursor: text;
          margin-bottom: 16px;
        }
        .p-word {
          display: inline-block;
          margin-right: 5px;
          border-radius: 3px;
          padding: 0 3px;
        }
        .p-word.correct { color: #16a34a; font-weight: 650; }
        .p-word.incorrect { color: #dc2626; text-decoration: line-through; background: #fee2e2; }
        .p-word.active {
          background: #dbeafe;
          color: #1d4ed8;
          font-weight: 800;
          outline: 1.5px solid #3b82f6;
        }
        .p-word.pending { color: #64748b; }

        /* Typing Input Field */
        .typing-input-field {
          width: 100%;
          padding: 14px 16px;
          font-size: 16px; /* 16px prevents iOS Safari auto-zoom */
          border: 2px solid #059669;
          border-radius: 12px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          box-sizing: border-box;
          margin-bottom: 14px;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.12);
        }
        .typing-input-field:focus {
          border-color: #047857;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.2);
        }
        .typing-input-field:disabled {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #94a3b8;
          box-shadow: none;
        }

        /* Buttons row */
        .actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .space-hint-text {
          font-size: 0.8rem;
          color: #64748b;
        }
        .space-hint-kbd {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 2px 5px;
          border-radius: 4px;
          font-weight: 750;
        }
        .btn-restart-action {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #334155;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.86rem;
          font-weight: 750;
          cursor: pointer;
        }
        .btn-restart-action:hover {
          background: #f8fafc;
        }
        .btn-start-action {
          background: #059669;
          border: none;
          color: #ffffff;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 0.86rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);
        }

        /* Scorecard Result */
        .scorecard-box {
          background: linear-gradient(180deg, #ecfdf5 0%, #f0fdf4 100%);
          border: 1.5px solid #a7f3d0;
          border-radius: 16px;
          padding: 20px 16px;
          text-align: center;
          margin-top: 20px;
          box-sizing: border-box;
        }
        .scorecard-h2 {
          font-size: 1.25rem;
          font-weight: 850;
          color: #065f46;
          margin: 0 0 6px 0;
        }
        .verdict-tag {
          display: inline-block;
          font-size: 0.82rem;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 999px;
          margin: 6px 0 16px;
        }
        .verdict-tag.pass {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #86efac;
        }
        .verdict-tag.fail {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }
        .scorecard-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 18px;
        }
        .sc-card {
          background: #ffffff;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          padding: 10px 6px;
        }
        .sc-val {
          font-size: 1.4rem;
          font-weight: 850;
        }
        .sc-lbl {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 750;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* Guidelines Card */
        .guidelines-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          box-sizing: border-box;
        }
        .guidelines-header {
          font-size: 0.92rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .guidelines-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.84rem;
          color: #334155;
          line-height: 1.5;
        }

        @media (max-width: 640px) {
          .typing-page-main {
            padding: 16px 12px 76px;
          }
          .typing-main-card {
            padding: 16px 14px;
            border-radius: 16px;
          }
          .typing-title-h1 {
            font-size: 1.15rem;
          }
          .stats-dashboard {
            grid-template-columns: repeat(2, 1fr);
          }
          .scorecard-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .passage-card-box {
            font-size: 0.94rem;
            max-height: 160px;
            padding: 12px;
          }
          .controls-panel {
            padding: 10px;
          }
          .duration-chip {
            padding: 5px 8px;
            font-size: 0.78rem;
          }
        }
      `}</style>

      <div className="typing-container">
        <div className="typing-main-card">
          {/* Header */}
          <div className="typing-header-row">
            <div className="typing-header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="6" y1="8" x2="6.01" y2="8" />
                <line x1="10" y1="8" x2="10.01" y2="8" />
                <line x1="14" y1="8" x2="14.01" y2="8" />
                <line x1="18" y1="8" x2="18.01" y2="8" />
                <line x1="6" y1="12" x2="6.01" y2="12" />
                <line x1="10" y1="12" x2="10.01" y2="12" />
                <line x1="14" y1="12" x2="14.01" y2="12" />
                <line x1="18" y1="12" x2="18.01" y2="12" />
                <line x1="7" y1="16" x2="17" y2="16" />
              </svg>
            </div>
            <div className="typing-header-text">
              <span className="exam-pattern-pill">SSC &amp; Railway Pattern</span>
              <h1 className="typing-title-h1">Exam Typing Speed Test</h1>
              <p className="typing-subtitle-p">
                Practice TCS iON test format with real-time Gross WPM, Net WPM &amp; accuracy analysis.
              </p>
            </div>
          </div>

          {/* Hint */}
          <div className="hardware-hint-banner">
            <span>💡</span>
            <div>
              <strong>Exam Advice:</strong> For best exam simulation, practice on a PC/Laptop physical keyboard or connect an OTG external keyboard with mobile.
            </div>
          </div>

          {/* Controls Bar: Duration & Timer */}
          <div className="controls-panel">
            <div className="durations-wrap">
              {[
                { label: '1 Min', val: 60 },
                { label: '2 Min', val: 120 },
                { label: '5 Min', val: 300 },
                { label: '10 Min (RRB)', val: 600 },
                { label: '15 Min (SSC)', val: 900 }
              ].map((d) => (
                <button
                  key={d.val}
                  type="button"
                  className={`duration-chip${testDuration === d.val ? ' active' : ''}`}
                  onClick={() => { setTestDuration(d.val); resetTypingTest(d.val); }}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className={`timer-badge-box${timeLeft <= 10 && isTestActive ? ' warning' : ''}`}>
              <span>⏱️</span>
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>

          {/* Passage Selector */}
          <div>
            <label className="passage-select-label">Select Practice Passage:</label>
            <select
              className="passage-select-input"
              value={selectedPassageIndex}
              disabled={isTestActive}
              onChange={(e) => {
                setSelectedPassageIndex(Number(e.target.value));
                resetTypingTest();
              }}
            >
              {TYPING_PASSAGES.map((p, idx) => (
                <option key={idx} value={idx}>{p.title}</option>
              ))}
            </select>
          </div>

          {/* 4 Stats Tiles (Responsive 2x2 on Mobile) */}
          <div className="stats-dashboard">
            <div className="stat-tile">
              <div className="stat-tile-val" style={{ color: '#059669' }}>{netWpm}</div>
              <div className="stat-tile-lbl">Net WPM</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-val" style={{ color: '#0f172a' }}>{grossWpm}</div>
              <div className="stat-tile-lbl">Gross WPM</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-val" style={{ color: accuracy >= 95 ? '#16a34a' : '#d97706' }}>
                {accuracy}%
              </div>
              <div className="stat-tile-lbl">Accuracy</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-val" style={{ color: '#0f172a' }}>{keystrokes}</div>
              <div className="stat-tile-lbl">Depressions</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>

          {/* Passage Reader */}
          <div className="passage-card-box" onClick={() => typingInputRef.current?.focus()}>
            {currentPassageWords.map((word, idx) => {
              let statusClass = 'pending';
              if (idx < typedWords.length) {
                statusClass = typedWords[idx] === word ? 'correct' : 'incorrect';
              } else if (idx === typedWords.length) {
                statusClass = 'active';
              }

              return (
                <span key={idx} className={`p-word ${statusClass}`}>
                  {word}
                </span>
              );
            })}
          </div>

          {/* Typing Input */}
          <div>
            <input
              ref={typingInputRef}
              type="text"
              className="typing-input-field"
              placeholder={isTestActive ? "Type word and press Space..." : "Click here to start typing (Timer begins on first stroke)..."}
              value={userInput}
              disabled={isTestFinished}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleTypingKeyDown}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>

          {/* Actions Bar */}
          <div className="actions-row">
            <div className="space-hint-text">
              Press <kbd className="space-hint-kbd">Space</kbd> after each word to proceed.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => resetTypingTest()}
                className="btn-restart-action"
              >
                🔄 Reset
              </button>
              {!isTestActive && !isTestFinished && (
                <button
                  type="button"
                  onClick={startTypingTest}
                  className="btn-start-action"
                >
                  ▶️ Start Test
                </button>
              )}
            </div>
          </div>

          {/* Scorecard on Completion */}
          {isTestFinished && (
            <div className="scorecard-box">
              <h2 className="scorecard-h2">🎉 Test Complete! Official Scorecard</h2>
              <div>
                {netWpm >= 35 ? (
                  <span className="verdict-tag pass">
                    ✅ Qualified for SSC CGL / CHSL (≥ 35 WPM) &amp; RRB NTPC (≥ 30 WPM)
                  </span>
                ) : netWpm >= 30 ? (
                  <span className="verdict-tag pass">
                    ✅ Qualified for RRB NTPC (≥ 30 WPM) | SSC CHSL (Target: 35 WPM)
                  </span>
                ) : (
                  <span className="verdict-tag fail">
                    ⚠️ Needs Speed Practice (Target: 35 WPM English / 30 WPM Hindi)
                  </span>
                )}
              </div>

              <div className="scorecard-stats-grid">
                <div className="sc-card">
                  <div className="sc-val" style={{ color: '#059669' }}>{netWpm} WPM</div>
                  <div className="sc-lbl">Net Speed</div>
                </div>
                <div className="sc-card">
                  <div className="sc-val" style={{ color: '#0f172a' }}>{grossWpm} WPM</div>
                  <div className="sc-lbl">Gross Speed</div>
                </div>
                <div className="sc-card">
                  <div className="sc-val" style={{ color: accuracy >= 95 ? '#16a34a' : '#d97706' }}>{accuracy}%</div>
                  <div className="sc-lbl">Accuracy</div>
                </div>
                <div className="sc-card">
                  <div className="sc-val" style={{ color: '#0f172a' }}>{keystrokes}</div>
                  <div className="sc-lbl">Depressions</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => resetTypingTest()}
                className="btn-start-action"
                style={{ padding: '10px 24px', fontSize: '0.92rem' }}
              >
                🔁 Practice Another Passage
              </button>
            </div>
          )}
        </div>

        {/* Guidelines Card */}
        <div className="guidelines-card">
          <div className="guidelines-header">
            <span>📌</span> Official Exam Typing Standards
          </div>
          <ul className="guidelines-list">
            <li>
              <strong>SSC CGL / CHSL:</strong> 35 WPM English (approx 1750 key depressions in 10 minutes) or 30 WPM Hindi (approx 1500 key depressions).
            </li>
            <li>
              <strong>RRB NTPC (Junior Clerk / Accounts):</strong> 30 WPM in English or 25 WPM in Hindi for 10 minutes.
            </li>
            <li>
              <strong>Accuracy Requirement:</strong> Max permissible error margin is 5% for General/UR category and up to 7-10% for reserved categories.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
