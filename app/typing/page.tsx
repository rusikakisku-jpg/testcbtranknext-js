'use client';

import { useState, useRef, useEffect } from 'react';

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
          max-width: 760px;
          margin: 0 auto;
          box-sizing: border-box;
          width: 100%;
        }

        /* Main Card */
        .typing-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 26px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          box-sizing: border-box;
          width: 100%;
        }
        .typing-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 14px;
          margin-bottom: 18px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .typing-title-area {
          flex: 1;
          min-width: 0;
        }
        .typing-title {
          font-size: 1.35rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 2px 0;
          letter-spacing: -0.02em;
        }
        .typing-subtitle {
          font-size: 0.86rem;
          color: #64748b;
          margin: 0;
        }

        /* Controls Panel */
        .controls-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 12px;
          margin-bottom: 16px;
        }
        .duration-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .duration-chip {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .duration-chip:hover {
          border-color: #94a3b8;
          background: #f1f5f9;
        }
        .duration-chip.active {
          border-color: #0044cc;
          background: #eff6ff;
          color: #0044cc;
        }
        .timer-badge {
          font-size: 1.2rem;
          font-weight: 850;
          color: #0f172a;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          padding: 5px 14px;
          border-radius: 8px;
          font-variant-numeric: tabular-nums;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .timer-badge.warning {
          color: #dc2626;
          border-color: #fca5a5;
          background: #fef2f2;
        }

        /* Passage Selector */
        .passage-select {
          width: 100%;
          padding: 9px 12px;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.88rem;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          box-sizing: border-box;
          margin-bottom: 16px;
          cursor: pointer;
        }
        .passage-select:focus {
          border-color: #0044cc;
        }

        /* Live 4 Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 8px;
          text-align: center;
        }
        .stat-val {
          font-size: 1.4rem;
          font-weight: 850;
          line-height: 1.1;
        }
        .stat-lbl {
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 750;
          text-transform: uppercase;
          margin-top: 4px;
          letter-spacing: 0.02em;
        }

        /* Progress Bar */
        .progress-track {
          width: 100%;
          height: 3px;
          background: #e2e8f0;
          border-radius: 999px;
          margin-bottom: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #0044cc;
          transition: width 0.2s ease;
        }

        /* Passage Reader */
        .passage-box {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 14px;
          padding: 16px;
          font-size: 1rem;
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
          background: #eff6ff;
          color: #0044cc;
          font-weight: 800;
          outline: 1.5px solid #0044cc;
        }
        .p-word.pending { color: #64748b; }

        /* Typing Input */
        .typing-input {
          width: 100%;
          padding: 13px 16px;
          font-size: 16px;
          border: 2px solid #0044cc;
          border-radius: 12px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          box-sizing: border-box;
          margin-bottom: 14px;
          box-shadow: 0 2px 8px rgba(0, 68, 204, 0.1);
        }
        .typing-input:focus {
          box-shadow: 0 4px 14px rgba(0, 68, 204, 0.2);
        }
        .typing-input:disabled {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #94a3b8;
          box-shadow: none;
        }

        /* Actions */
        .actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .hint-text {
          font-size: 0.8rem;
          color: #64748b;
        }
        .hint-kbd {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 2px 5px;
          border-radius: 4px;
          font-weight: 750;
        }
        .btn-restart {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #334155;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.86rem;
          font-weight: 750;
          cursor: pointer;
        }
        .btn-start {
          background: #0044cc;
          border: none;
          color: #ffffff;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 0.86rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 68, 204, 0.25);
        }

        /* Scorecard */
        .scorecard-box {
          background: #f8fafc;
          border: 1.5px solid #bfdbfe;
          border-radius: 16px;
          padding: 20px 16px;
          text-align: center;
          margin-top: 20px;
          box-sizing: border-box;
        }
        .scorecard-title {
          font-size: 1.25rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 6px 0;
        }
        .qualification-tag {
          display: inline-block;
          font-size: 0.82rem;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 999px;
          margin: 6px 0 16px;
        }
        .qualification-tag.pass {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #86efac;
        }
        .qualification-tag.fail {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }
        .scorecard-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 18px;
        }
        .sc-tile {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 6px;
        }
        .sc-val {
          font-size: 1.35rem;
          font-weight: 850;
        }
        .sc-lbl {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 750;
          text-transform: uppercase;
          margin-top: 2px;
        }

        @media (max-width: 640px) {
          .typing-page-main { padding: 16px 12px 76px; }
          .typing-card { padding: 16px 14px; border-radius: 16px; }
          .typing-title { font-size: 1.15rem; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .scorecard-grid { grid-template-columns: repeat(2, 1fr); }
          .passage-box { font-size: 0.94rem; max-height: 160px; padding: 12px; }
          .controls-panel { padding: 8px 10px; }
          .duration-chip { padding: 5px 8px; font-size: 0.78rem; }
        }
      `}</style>

      <div className="typing-container">
        <div className="typing-card">
          {/* Header */}
          <div className="typing-header">
            <div className="typing-title-area">
              <h1 className="typing-title">Exam Typing Speed Test</h1>
              <p className="typing-subtitle">
                Practice TCS iON test format with real-time Gross WPM, Net WPM &amp; accuracy.
              </p>
            </div>
          </div>

          {/* Controls: Duration & Timer */}
          <div className="controls-panel">
            <div className="duration-group">
              {[
                { label: '1m', val: 60 },
                { label: '2m', val: 120 },
                { label: '5m', val: 300 },
                { label: '10m (RRB)', val: 600 },
                { label: '15m (SSC)', val: 900 }
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

            <div className={`timer-badge${timeLeft <= 10 && isTestActive ? ' warning' : ''}`}>
              <span>⏱️</span>
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>

          {/* Passage Selector */}
          <div>
            <select
              className="passage-select"
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

          {/* Live 4 Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-val" style={{ color: '#0044cc' }}>{netWpm}</div>
              <div className="stat-lbl">Net WPM</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: '#0f172a' }}>{grossWpm}</div>
              <div className="stat-lbl">Gross WPM</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: accuracy >= 95 ? '#16a34a' : '#d97706' }}>
                {accuracy}%
              </div>
              <div className="stat-lbl">Accuracy</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: '#0f172a' }}>{keystrokes}</div>
              <div className="stat-lbl">Depressions</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>

          {/* Reading Passage Box */}
          <div className="passage-box" onClick={() => typingInputRef.current?.focus()}>
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
              className="typing-input"
              placeholder={isTestActive ? "Type here and press Space..." : "Click here to start typing (Timer begins on first key)..."}
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

          {/* Actions */}
          <div className="actions-bar">
            <div className="hint-text">
              Press <kbd className="hint-kbd">Space</kbd> after each word to proceed.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => resetTypingTest()}
                className="btn-restart"
              >
                🔄 Reset
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

          {/* Scorecard on Completion */}
          {isTestFinished && (
            <div className="scorecard-box">
              <h2 className="scorecard-title">🎉 Test Complete! Scorecard</h2>
              <div>
                {netWpm >= 35 ? (
                  <span className="qualification-tag pass">
                    ✅ Qualified for SSC CGL / CHSL (≥ 35 WPM) &amp; RRB NTPC (≥ 30 WPM)
                  </span>
                ) : netWpm >= 30 ? (
                  <span className="qualification-tag pass">
                    ✅ Qualified for RRB NTPC (≥ 30 WPM) | SSC Target: 35 WPM
                  </span>
                ) : (
                  <span className="qualification-tag fail">
                    ⚠️ Needs More Speed Practice (Target: 35 WPM English / 30 WPM Hindi)
                  </span>
                )}
              </div>

              <div className="scorecard-grid">
                <div className="sc-tile">
                  <div className="sc-val" style={{ color: '#0044cc' }}>{netWpm} WPM</div>
                  <div className="sc-lbl">Net Speed</div>
                </div>
                <div className="sc-tile">
                  <div className="sc-val" style={{ color: '#0f172a' }}>{grossWpm} WPM</div>
                  <div className="sc-lbl">Gross Speed</div>
                </div>
                <div className="sc-tile">
                  <div className="sc-val" style={{ color: accuracy >= 95 ? '#16a34a' : '#d97706' }}>{accuracy}%</div>
                  <div className="sc-lbl">Accuracy</div>
                </div>
                <div className="sc-tile">
                  <div className="sc-val" style={{ color: '#0f172a' }}>{keystrokes}</div>
                  <div className="sc-lbl">Depressions</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => resetTypingTest()}
                className="btn-start"
                style={{ padding: '10px 24px', fontSize: '0.92rem' }}
              >
                🔁 Practice Again
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
