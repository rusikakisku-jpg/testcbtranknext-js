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

export default function TypingTestPage() {
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
    <main className="tool-screen-main">
      <style>{`
        .tool-screen-main {
          min-height: calc(100vh - 140px);
          background: radial-gradient(circle at 50% 0%, #ecfdf5 0%, #f8fafc 40%, #f1f5f9 100%);
          padding: 24px 16px 84px;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .tool-screen-container {
          max-width: 860px;
          margin: 0 auto;
        }

        /* Nav Bar */
        .back-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-back-tools {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #1e293b;
          padding: 8px 16px;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-back-tools:hover {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #059669;
          transform: translateX(-2px);
        }
        .privacy-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          padding: 4px 12px;
          border-radius: 999px;
        }

        /* Tool Card */
        .tool-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 22px;
          padding: 30px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.02);
          margin-bottom: 24px;
        }
        .tool-header-block {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 18px;
          margin-bottom: 22px;
        }
        .tool-header-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 18px -4px rgba(5, 150, 105, 0.3);
          flex-shrink: 0;
        }
        .tool-title {
          font-size: 1.5rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }
        .tool-desc {
          font-size: 0.92rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* Controls Bar */
        .typing-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          padding: 12px 18px;
          border-radius: 16px;
          margin-bottom: 20px;
        }
        .dur-pill-group {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }
        .dur-btn {
          padding: 6px 12px;
          border-radius: 10px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dur-btn:hover {
          border-color: #94a3b8;
          background: #f1f5f9;
        }
        .dur-btn.active {
          border-color: #059669;
          background: #ecfdf5;
          color: #047857;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.15);
        }
        .typing-timer-badge {
          font-size: 1.25rem;
          font-weight: 850;
          color: #059669;
          background: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          padding: 6px 18px;
          border-radius: 12px;
          font-variant-numeric: tabular-nums;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.12);
        }
        .typing-timer-badge.warning {
          color: #dc2626;
          background: #fee2e2;
          border-color: #fca5a5;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }

        /* Passage Select */
        .select-box {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 11px;
          font-size: 0.92rem;
          color: #0f172a;
          background: #fff;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .select-box:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
        }

        /* Live Stats Grid */
        .typing-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin: 20px 0;
        }
        .typing-stat-box {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 12px;
          text-align: center;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
          transition: transform 0.2s ease;
        }
        .typing-stat-box:hover {
          transform: translateY(-1px);
        }
        .typing-stat-val {
          font-size: 1.6rem;
          font-weight: 850;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .typing-stat-label {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 750;
          text-transform: uppercase;
          margin-top: 6px;
          letter-spacing: 0.03em;
        }

        /* Passage Display Box */
        .passage-wrapper {
          position: relative;
          margin-bottom: 20px;
        }
        .passage-progress-track {
          width: 100%;
          height: 4px;
          background: #e2e8f0;
          border-radius: 999px;
          margin-bottom: 12px;
          overflow: hidden;
        }
        .passage-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #059669, #10b981);
          transition: width 0.3s ease;
        }
        .passage-box {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 16px;
          padding: 22px;
          font-size: 1.08rem;
          line-height: 1.85;
          max-height: 210px;
          overflow-y: auto;
          user-select: none;
          box-shadow: inset 0 2px 6px rgba(15, 23, 42, 0.03);
          cursor: text;
        }
        .passage-word {
          display: inline-block;
          margin-right: 6px;
          border-radius: 4px;
          padding: 1px 4px;
          transition: all 0.15s ease;
        }
        .passage-word.correct { color: #16a34a; font-weight: 650; }
        .passage-word.incorrect { color: #dc2626; text-decoration: line-through; background: #fee2e2; }
        .passage-word.active {
          background: #dbeafe;
          color: #1d4ed8;
          font-weight: 800;
          outline: 2px solid #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }
        .passage-word.pending { color: #64748b; }

        /* Input Box */
        .typing-input-box {
          margin-bottom: 18px;
        }
        .typing-input {
          width: 100%;
          padding: 16px 20px;
          font-size: 1.15rem;
          border: 2px solid #059669;
          border-radius: 14px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          box-sizing: border-box;
          box-shadow: 0 4px 16px rgba(5, 150, 105, 0.15);
          transition: all 0.2s ease;
        }
        .typing-input:focus {
          border-color: #047857;
          box-shadow: 0 4px 20px rgba(5, 150, 105, 0.25);
        }
        .typing-input:disabled {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #94a3b8;
          box-shadow: none;
        }

        /* Action Buttons */
        .btn-restart {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #334155;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-restart:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }
        .btn-start {
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
          border: none;
          color: #ffffff;
          padding: 9px 22px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
          transition: all 0.2s ease;
        }
        .btn-start:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(5, 150, 105, 0.35);
        }

        /* Scorecard */
        .scorecard-result-box {
          background: linear-gradient(180deg, #ecfdf5 0%, #f0fdf4 100%);
          border: 2px solid #a7f3d0;
          border-radius: 20px;
          padding: 28px 24px;
          text-align: center;
          margin-top: 24px;
          box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.1);
        }
        .scorecard-title {
          font-size: 1.45rem;
          font-weight: 850;
          color: #065f46;
          margin-bottom: 8px;
        }
        .qualification-badge {
          display: inline-block;
          font-size: 0.88rem;
          font-weight: 800;
          padding: 8px 18px;
          border-radius: 999px;
          margin: 8px 0 20px;
        }
        .qualification-badge.pass {
          background: #dcfce7;
          color: #15803d;
          border: 1.5px solid #86efac;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15);
        }
        .qualification-badge.fail {
          background: #fee2e2;
          color: #b91c1c;
          border: 1.5px solid #fca5a5;
        }
        .scorecard-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 22px;
        }
        .scorecard-tile {
          background: #ffffff;
          padding: 14px 10px;
          border-radius: 14px;
          border: 1.5px solid #bbf7d0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }
        .scorecard-val {
          font-size: 1.7rem;
          font-weight: 850;
          line-height: 1.1;
        }
        .scorecard-lbl {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 750;
          text-transform: uppercase;
          margin-top: 4px;
        }

        /* Guidelines Card */
        .exam-info-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border: 1.5px solid #a7f3d0;
          border-radius: 18px;
          padding: 20px;
          font-size: 0.86rem;
          color: #166534;
          line-height: 1.6;
        }
        .exam-info-card strong { color: #14532d; }

        @media (max-width: 640px) {
          .tool-card { padding: 20px 16px; border-radius: 18px; }
          .tool-title { font-size: 1.25rem; }
          .tool-header-icon { width: 44px; height: 44px; border-radius: 12px; }
          .typing-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .scorecard-grid { grid-template-columns: repeat(2, 1fr); }
          .passage-box { font-size: 0.98rem; padding: 16px; }
          .typing-input { font-size: 1rem; padding: 13px 16px; }
        }
      `}</style>

      <div className="tool-screen-container">
        {/* Navigation Bar */}
        <div className="back-nav-bar">
          <Link href="/tools" prefetch={true} className="btn-back-tools">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Back to All Tools</span>
          </Link>
          <span className="privacy-pill">
            <span>⌨️</span> SSC &amp; Railway Pattern
          </span>
        </div>

        <div className="tool-card">
          <div className="tool-header-block">
            <div className="tool-header-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="3"></rect>
                <line x1="6" y1="8" x2="6.01" y2="8"></line>
                <line x1="10" y1="8" x2="10.01" y2="8"></line>
                <line x1="14" y1="8" x2="14.01" y2="8"></line>
                <line x1="18" y1="8" x2="18.01" y2="8"></line>
                <line x1="6" y1="12" x2="6.01" y2="12"></line>
                <line x1="10" y1="12" x2="10.01" y2="12"></line>
                <line x1="14" y1="12" x2="14.01" y2="12"></line>
                <line x1="18" y1="12" x2="18.01" y2="12"></line>
                <line x1="8" y1="16" x2="16" y2="16"></line>
              </svg>
            </div>
            <div>
              <h1 className="tool-title">Exam Typing Speed Test</h1>
              <p className="tool-desc">
                Practice TCS iON / SSC / Railway exam pattern typing test with countdown timer and real-time accuracy analysis.
              </p>
            </div>
          </div>

          {/* Controls Bar: Timer Duration */}
          <div className="typing-controls-bar">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
                Duration:
              </span>
              <div className="dur-pill-group">
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
                    className={`dur-btn${testDuration === d.val ? ' active' : ''}`}
                    onClick={() => { setTestDuration(d.val); resetTypingTest(d.val); }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`typing-timer-badge${timeLeft <= 10 && isTestActive ? ' warning' : ''}`}>
              <span>⏱️</span>
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>

          {/* Passage Select */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 750, color: '#334155', marginBottom: 6 }}>
              Select Practice Passage Pattern:
            </label>
            <select
              className="select-box"
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

          {/* Live Stats Grid */}
          <div className="typing-stats-grid">
            <div className="typing-stat-box">
              <div className="typing-stat-val" style={{ color: '#059669' }}>{netWpm}</div>
              <div className="typing-stat-label">Net WPM</div>
            </div>
            <div className="typing-stat-box">
              <div className="typing-stat-val" style={{ color: '#0f172a' }}>{grossWpm}</div>
              <div className="typing-stat-label">Gross WPM</div>
            </div>
            <div className="typing-stat-box">
              <div className="typing-stat-val" style={{ color: accuracy >= 95 ? '#16a34a' : '#d97706' }}>
                {accuracy}%
              </div>
              <div className="typing-stat-label">Accuracy</div>
            </div>
            <div className="typing-stat-box">
              <div className="typing-stat-val" style={{ color: '#0f172a' }}>{keystrokes}</div>
              <div className="typing-stat-label">Key Depressions</div>
            </div>
          </div>

          {/* Passage Wrapper with Progress */}
          <div className="passage-wrapper">
            <div className="passage-progress-track">
              <div className="passage-progress-bar" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <div className="passage-box" onClick={() => typingInputRef.current?.focus()}>
              {currentPassageWords.map((word, idx) => {
                let statusClass = 'pending';
                if (idx < typedWords.length) {
                  statusClass = typedWords[idx] === word ? 'correct' : 'incorrect';
                } else if (idx === typedWords.length) {
                  statusClass = 'active';
                }

                return (
                  <span key={idx} className={`passage-word ${statusClass}`}>
                    {word}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Typing Input */}
          <div className="typing-input-box">
            <input
              ref={typingInputRef}
              type="text"
              className="typing-input"
              placeholder={isTestActive ? "Type here and hit Space bar..." : "Click here to start typing (Timer begins on first stroke)..."}
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Press <kbd style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 750 }}>Space</kbd> after each word to proceed.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => resetTypingTest()}
                className="btn-restart"
              >
                🔄 Reset Test
              </button>
              {!isTestActive && !isTestFinished && (
                <button
                  type="button"
                  onClick={startTypingTest}
                  className="btn-start"
                >
                  ▶️ Start Test
                </button>
              )}
            </div>
          </div>

          {/* Result Scorecard when finished */}
          {isTestFinished && (
            <div className="scorecard-result-box">
              <div className="scorecard-title">🎉 Test Complete! Your Official Scorecard</div>

              <div>
                {netWpm >= 35 ? (
                  <span className="qualification-badge pass">
                    ✅ Qualified for SSC CGL / CHSL (≥ 35 WPM) &amp; RRB NTPC (≥ 30 WPM)
                  </span>
                ) : netWpm >= 30 ? (
                  <span className="qualification-badge pass">
                    ✅ Qualified for RRB NTPC (≥ 30 WPM) | SSC CHSL (Target: 35 WPM)
                  </span>
                ) : (
                  <span className="qualification-badge fail">
                    ⚠️ Needs Speed Practice (Target: 35 WPM English / 30 WPM Hindi)
                  </span>
                )}
              </div>

              <div className="scorecard-grid">
                <div className="scorecard-tile">
                  <div className="scorecard-val" style={{ color: '#059669' }}>{netWpm} WPM</div>
                  <div className="scorecard-lbl">Net Speed</div>
                </div>
                <div className="scorecard-tile">
                  <div className="scorecard-val" style={{ color: '#0f172a' }}>{grossWpm} WPM</div>
                  <div className="scorecard-lbl">Gross Speed</div>
                </div>
                <div className="scorecard-tile">
                  <div className="scorecard-val" style={{ color: accuracy >= 95 ? '#16a34a' : '#d97706' }}>{accuracy}%</div>
                  <div className="scorecard-lbl">Accuracy</div>
                </div>
                <div className="scorecard-tile">
                  <div className="scorecard-val" style={{ color: '#0f172a' }}>{keystrokes}</div>
                  <div className="scorecard-lbl">Depressions</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => resetTypingTest()}
                className="btn-start"
                style={{ padding: '12px 28px', fontSize: '0.95rem' }}
              >
                🔁 Practice Another Passage
              </button>
            </div>
          )}
        </div>

        {/* Govt Exam Guidelines Notice */}
        <div className="exam-info-card">
          <strong>📌 Official Guidelines for SSC, Railway &amp; Govt Competitive Exams:</strong>
          <ul style={{ paddingLeft: 18, marginTop: 8, marginBottom: 0 }}>
            <li><strong>Typing Speed Criteria:</strong> SSC CHSL/CGL requires <strong>35 WPM</strong> in English (approx 1750 key depressions in 10 mins) or <strong>30 WPM</strong> in Hindi. RRB NTPC requires <strong>30 WPM</strong> in English or <strong>25 WPM</strong> in Hindi.</li>
            <li><strong>Accuracy Standard:</strong> Mistakes must be under 5% to 7% (UR) / 10% (Reserved categories) for qualifying the test.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
