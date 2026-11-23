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
        }
      }
    } else if (e.key.length === 1) {
      setKeystrokes((k) => k + 1);
    }
  };

  const elapsedSeconds = testDuration - timeLeft;
  const elapsedMinutes = elapsedSeconds > 0 ? elapsedSeconds / 60 : 0.01;

  let correctChars = 0;
  let wrongChars = 0;
  let correctWordsCount = 0;

  typedWords.forEach((typed, i) => {
    const target = currentPassageWords[i] || '';
    if (typed === target) {
      correctChars += target.length + 1;
      correctWordsCount += 1;
    } else {
      wrongChars += Math.max(typed.length, target.length);
    }
  });

  const grossWpm = Math.round((keystrokes / 5) / (elapsedMinutes || 0.01));
  const netWpm = Math.max(0, Math.round((correctChars / 5) / (elapsedMinutes || 0.01)));
  const accuracy = typedWords.length > 0 ? Math.round((correctWordsCount / typedWords.length) * 100) : 100;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <main className="tool-screen-main">
      <style>{`
        .tool-screen-main {
          min-height: calc(100vh - 140px);
          background: #f8fafc;
          padding: 24px 16px 80px;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .tool-screen-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .back-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .btn-back-tools {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #0066ff;
          font-size: 0.92rem;
          font-weight: 700;
          text-decoration: none;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 8px 14px;
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        .btn-back-tools:hover {
          background: #dbeafe;
          transform: translateX(-2px);
        }
        .screen-badge {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          background: #e2e8f0;
          color: #475569;
          padding: 3px 8px;
          border-radius: 999px;
          letter-spacing: 0.04em;
        }
        .tool-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          margin-bottom: 24px;
        }
        @media (max-width: 600px) {
          .tool-card { padding: 18px 14px; }
        }
        .tool-header-block {
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 14px;
          margin-bottom: 20px;
        }
        .tool-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tool-desc {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
          line-height: 1.45;
        }
        .typing-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 18px;
        }
        .typing-timer-badge {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0066ff;
          background: #eff6ff;
          border: 1.5px solid #bfdbfe;
          padding: 6px 16px;
          border-radius: 10px;
          font-variant-numeric: tabular-nums;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .typing-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (max-width: 640px) {
          .typing-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .typing-stat-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          text-align: center;
        }
        .typing-stat-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
        }
        .typing-stat-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .passage-box {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 14px;
          padding: 18px;
          font-size: 1.05rem;
          line-height: 1.8;
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 18px;
          user-select: none;
          font-family: inherit;
        }
        .passage-word {
          display: inline-block;
          margin-right: 6px;
          border-radius: 4px;
          padding: 1px 3px;
        }
        .passage-word.correct { color: #16a34a; font-weight: 600; }
        .passage-word.incorrect { color: #dc2626; text-decoration: line-through; background: #fee2e2; }
        .passage-word.active { background: #dbeafe; color: #1d4ed8; font-weight: 700; outline: 2px solid #3b82f6; }
        .passage-word.pending { color: #64748b; }

        .typing-input-box {
          position: relative;
          margin-bottom: 16px;
        }
        .typing-input {
          width: 100%;
          padding: 14px 18px;
          font-size: 1.15rem;
          border: 2px solid #0066ff;
          border-radius: 12px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          box-sizing: border-box;
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.15);
        }
        .typing-input:disabled {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #94a3b8;
        }
        .field-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }
        .select-box {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 9px;
          font-size: 0.9rem;
          color: #0f172a;
          background: #fff;
          outline: none;
          box-sizing: border-box;
        }
        .scorecard-result-box {
          background: #eff6ff;
          border: 2px solid #bfdbfe;
          border-radius: 14px;
          padding: 24px;
          text-align: center;
          margin-top: 16px;
        }
        .scorecard-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #1e3a8a;
          margin-bottom: 6px;
        }
        .qualification-badge {
          display: inline-block;
          font-size: 0.85rem;
          font-weight: 800;
          padding: 6px 16px;
          border-radius: 999px;
          margin: 10px 0 16px;
        }
        .qualification-badge.pass { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .qualification-badge.fail { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

        .btn-download {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #0066ff;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          padding: 12px 28px;
          border-radius: 10px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 102, 255, 0.3);
        }
        .btn-download:hover {
          background: #0052cc;
          transform: translateY(-1px);
        }
        .exam-info-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 16px;
          font-size: 0.85rem;
          color: #166534;
          line-height: 1.6;
        }
        .exam-info-card strong { color: #14532d; }
      `}</style>

      <div className="tool-screen-container">
        {/* Navigation Bar */}
        <div className="back-nav-bar">
          <Link href="/tools" prefetch={true} className="btn-back-tools">
            <span>←</span> Back to All Tools
          </Link>
          <span className="screen-badge">SSC &amp; Railway Pattern</span>
        </div>

        <div className="tool-card">
          <div className="tool-header-block">
            <h1 className="tool-title">
              <span>⌨️</span> Exam Typing Speed Test
            </h1>
            <p className="tool-desc">
              Practice TCS iON / SSC / Railway exam pattern typing test with countdown timer and real-time accuracy analysis.
            </p>
          </div>

          {/* Controls Bar: Timer Duration */}
          <div className="typing-controls-bar">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Duration:</label>
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
                  onClick={() => { setTestDuration(d.val); resetTypingTest(d.val); }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: testDuration === d.val ? '#0066ff' : '#cbd5e1',
                    background: testDuration === d.val ? '#eff6ff' : '#ffffff',
                    color: testDuration === d.val ? '#0066ff' : '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="typing-timer-badge">
              ⏱️ {formatTimer(timeLeft)}
            </div>
          </div>

          {/* Passage Select */}
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Select Practice Passage Pattern:</label>
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
              <div className="typing-stat-val" style={{ color: '#0066ff' }}>{netWpm}</div>
              <div className="typing-stat-label">Net WPM</div>
            </div>
            <div className="typing-stat-box">
              <div className="typing-stat-val">{grossWpm}</div>
              <div className="typing-stat-label">Gross WPM</div>
            </div>
            <div className="typing-stat-box">
              <div className="typing-stat-val" style={{ color: accuracy >= 95 ? '#16a34a' : '#d97706' }}>
                {accuracy}%
              </div>
              <div className="typing-stat-label">Accuracy</div>
            </div>
            <div className="typing-stat-box">
              <div className="typing-stat-val">{keystrokes}</div>
              <div className="typing-stat-label">Key Depressions</div>
            </div>
          </div>

          {/* Passage Paragraph Display */}
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

          {/* Typing Input */}
          <div className="typing-input-box">
            <input
              ref={typingInputRef}
              type="text"
              className="typing-input"
              placeholder={isTestActive ? "Type here and press Space..." : "Click here to start typing (Timer will begin automatically)..."}
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
              Press <kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontWeight: 700 }}>Space</kbd> after each word to proceed.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => resetTypingTest()}
                style={{
                  background: '#f1f5f9',
                  border: '1.5px solid #cbd5e1',
                  color: '#475569',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🔄 Restart Test
              </button>
              {!isTestActive && !isTestFinished && (
                <button
                  type="button"
                  onClick={startTypingTest}
                  style={{
                    background: '#0066ff',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ▶️ Start Test
                </button>
              )}
            </div>
          </div>

          {/* Result Scorecard when finished */}
          {isTestFinished && (
            <div className="scorecard-result-box">
              <div className="scorecard-title">🎉 Test Complete! Your Scorecard</div>

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
                    ⚠️ Needs More Speed Practice (Target: 35 WPM English / 30 WPM Hindi)
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0066ff' }}>{netWpm} WPM</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>NET TYPING SPEED</div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{grossWpm} WPM</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>GROSS SPEED</div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: accuracy >= 95 ? '#16a34a' : '#d97706' }}>{accuracy}%</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ACCURACY</div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 18px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{keystrokes}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>KEY DEPRESSIONS</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => resetTypingTest()}
                className="btn-download"
                style={{ border: 'none', cursor: 'pointer' }}
              >
                🔁 Practice Again
              </button>
            </div>
          )}
        </div>

        {/* Govt Exam Guidelines Notice */}
        <div className="exam-info-card">
          <strong>📌 Official Guidelines for SSC, Railway &amp; Govt Competitive Exams:</strong>
          <ul style={{ paddingLeft: 18, marginTop: 6, marginBottom: 0 }}>
            <li><strong>Typing Speed Criteria:</strong> SSC CHSL/CGL requires <strong>35 WPM</strong> in English (approx 1750 key depressions in 10 mins) or <strong>30 WPM</strong> in Hindi. RRB NTPC requires <strong>30 WPM</strong> in English or <strong>25 WPM</strong> in Hindi.</li>
            <li><strong>Accuracy Standard:</strong> Mistakes must be under 5% to 7% (UR) / 10% (Reserved categories) for qualifying the test.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
