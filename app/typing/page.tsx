'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import TypingNavbar, { TypingCandidate } from './components/TypingNavbar';
import TypingFooter from './components/TypingFooter';
import TypingLoginModal from './components/TypingLoginModal';
import { AdBanner } from '../components/GoogleAdSense';
import { ADSENSE_CONFIG } from '../config/adsense';

interface PassageItem {
  id: string;
  category: string;
  title: string;
  text: string;
}

const TYPING_PASSAGES: PassageItem[] = [
  {
    id: 'ssc-econ',
    category: 'SSC CGL / CHSL Pattern',
    title: 'Economic Growth & Administrative Reforms in India',
    text: 'The economic transformation of India over the past few decades has been driven by rapid digital adoption, manufacturing initiatives, and infrastructure modernization. Government competitive examinations have expanded access for youth across diverse states and regional backgrounds. Digital public infrastructure such as unified payments and online governance platforms have accelerated financial inclusion in rural and urban areas alike. As India continues to integrate with the global economy, educational institutions and public sector organizations are prioritizing digital literacy, administrative efficiency, and transparency in public service delivery. Aspirants preparing for national recruitment tests must cultivate steady speed, analytical precision, and consistent discipline to meet administrative standards.'
  },
  {
    id: 'rrb-rail',
    category: 'RRB NTPC Pattern',
    title: 'Indian Railways Modernization & Logistics Corridors',
    text: 'Indian Railways represents one of the largest and most complex transport networks in the world, connecting thousands of stations and carrying millions of passengers daily. The recent introduction of modern train sets, station redevelopment programs, and advanced signaling technology has significantly improved travel safety and passenger convenience. Dedicated freight corridors have revolutionized cargo movement across industrial hubs, reducing logistics costs and supporting national economic growth. Dedicated staff and technical professionals play an indispensable role in maintaining track safety and scheduling efficiency across all operating divisions.'
  },
  {
    id: 'court-legal',
    category: 'High Court Pattern',
    title: 'Constitutional Rights, Judicial Precedents & Legal Procedure',
    text: 'The judicial system of India serves as the guardian of fundamental rights and constitutional liberties enshrined under the Supreme Law of the land. High Courts and subordinate judicial officers adjudicate civil disputes, writ petitions, and criminal appeals with strict adherence to evidence and statutory precedent. Speedy disposal of pending litigations and the integration of electronic courts have made justice more accessible to ordinary citizens. Accurate transcription of oral depositions, judgments, and legal petitions requires exceptional speed, vigilance, and strict compliance with legal terminology.'
  },
  {
    id: 'sci-tech',
    category: 'Science & Governance',
    title: 'Scientific Research, Space Exploration & Green Energy',
    text: 'Scientific research and technological innovation are fundamental pillars of modern human progress. The transition towards renewable energy such as solar power, wind generation, and electric transport is reducing environmental degradation while creating sustainable employment opportunities worldwide. Clean water conservation, forest protection, and efficient municipal waste management ensure that natural resources remain viable for future generations. Dedicated young professionals with strong analytical thinking and technical capabilities are essential for driving scientific achievements.'
  },
  {
    id: 'polity-const',
    category: 'Indian Polity',
    title: 'Parliamentary Democracy, Federalism & Public Administration',
    text: 'The Constitution of India establishes a sovereign, socialist, secular, and democratic republic with a parliamentary framework. Decentralization of power through local panchayats and municipal corporations ensures grassroots participation in developmental planning. The civil services function as the permanent executive, responsible for executing policies formulated by elected representatives. Professional integrity, impartiality, and diligence remain the core virtues expected from every public servant serving across administrative tiers.'
  }
];

export default function TypingPage() {
  // Candidate State
  const [candidate, setCandidate] = useState<TypingCandidate | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Test Setup State
  const [selectedPassageIndex, setSelectedPassageIndex] = useState<number>(0);
  const [testDuration, setTestDuration] = useState<number>(900); // Default 15m (SSC)
  const [backspaceMode, setBackspaceMode] = useState<'allowed' | 'current_word' | 'disabled'>('allowed');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active Typing Engine State
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const [isTestActive, setIsTestActive] = useState<boolean>(false);
  const [isTestFinished, setIsTestFinished] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>('');
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [keystrokes, setKeystrokes] = useState<number>(0);
  const [backspacesCount, setBackspacesCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);

  const typingInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<any>(null);
  const passageBoxRef = useRef<HTMLDivElement>(null);

  // Load Saved Candidate from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cbt_typing_candidate');
      if (saved) {
        setCandidate(JSON.parse(saved));
      }
    } catch {
      // LocalStorage error fallback
    }
  }, []);

  // Split current passage into words
  const currentPassageWords = useMemo(() => {
    return TYPING_PASSAGES[selectedPassageIndex].text.trim().split(/\s+/);
  }, [selectedPassageIndex]);

  // Audio Click Feedback (Soft Typewriter Click via Web Audio API)
  const playClickSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio fallback
    }
  };

  // Start Test
  const startTypingTest = () => {
    setIsTestActive(true);
    setIsTestFinished(false);
    setTimeLeft(testDuration);
    setUserInput('');
    setTypedWords([]);
    setKeystrokes(0);
    setBackspacesCount(0);
    setErrorCount(0);
    setTimeout(() => {
      typingInputRef.current?.focus();
    }, 50);
  };

  // Reset Test
  const resetTypingTest = (newDuration?: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const dur = newDuration !== undefined ? newDuration : testDuration;
    setIsTestActive(false);
    setIsTestFinished(false);
    setTimeLeft(dur);
    setUserInput('');
    setTypedWords([]);
    setKeystrokes(0);
    setBackspacesCount(0);
    setErrorCount(0);
  };

  // Timer Countdown Effect
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

  // Handle Key Down in Input
  const handleTypingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isTestFinished) return;

    if (!isTestActive) {
      setIsTestActive(true);
    }

    // Handle Backspace Rules
    if (e.key === 'Backspace') {
      if (backspaceMode === 'disabled') {
        e.preventDefault();
        return;
      }
      if (backspaceMode === 'current_word' && userInput === '') {
        // In TCS iON mode, cannot backspace to previous word!
        e.preventDefault();
        return;
      }
      setBackspacesCount((b) => b + 1);
    }

    // Handle Word Submission via Space or Enter
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const trimmed = userInput.trim();
      if (trimmed.length > 0) {
        playClickSound();
        const expectedWord = currentPassageWords[typedWords.length];
        if (trimmed !== expectedWord) {
          setErrorCount((prev) => prev + 1);
        }

        const nextTyped = [...typedWords, trimmed];
        setTypedWords(nextTyped);
        setUserInput('');

        // Check if finished
        if (nextTyped.length >= currentPassageWords.length) {
          setIsTestActive(false);
          setIsTestFinished(true);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setKeystrokes((k) => k + 1);
      playClickSound();
    }
  };

  // Calculation Metrics
  const elapsedSeconds = Math.max(1, testDuration - timeLeft);
  const elapsedMinutes = elapsedSeconds / 60;

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

  const totalWords = typedWords.length;
  // Standard TCS Depression Rule: 5 strokes = 1 word
  const grossWpm = Math.round(totalWords / elapsedMinutes) || 0;
  const netWpm = Math.max(0, Math.round((correctWordsCount - incorrectWordsCount * 0.5) / elapsedMinutes)) || 0;
  const accuracy = totalWords > 0 ? Math.round((correctWordsCount / totalWords) * 100) : 100;

  // Format Timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = Math.min(100, Math.round((typedWords.length / currentPassageWords.length) * 100));

  // Quick Preset Selection Helper
  const handleQuickExamMode = (preset: 'ssc' | 'rrb' | 'court' | 'warmup1' | 'warmup5') => {
    if (preset === 'ssc') {
      setTestDuration(900);
      setBackspaceMode('current_word');
      resetTypingTest(900);
    } else if (preset === 'rrb') {
      setTestDuration(600);
      setBackspaceMode('allowed');
      resetTypingTest(600);
    } else if (preset === 'court') {
      setTestDuration(600);
      setBackspaceMode('current_word');
      resetTypingTest(600);
    } else if (preset === 'warmup1') {
      setTestDuration(60);
      setBackspaceMode('allowed');
      resetTypingTest(60);
    } else if (preset === 'warmup5') {
      setTestDuration(300);
      setBackspaceMode('allowed');
      resetTypingTest(300);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('cbt_typing_candidate');
    } catch {
      // Fallback
    }
    setCandidate(null);
  };

  return (
    <div className="typing-portal-page">
      {/* 1. Dedicated Portal Header */}
      <TypingNavbar
        candidate={candidate}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="typing-main-content">
        {/* Hero Section */}
        <section className="typing-hero-section">
          <div className="typing-hero-container">
            <div className="typing-hero-badge">
              <span>⚡ OFFICIAL TCS iON CBT PATTERN SIMULATOR</span>
            </div>
            <h1 className="typing-hero-title">
              All-India Govt Exam Typing Speed &amp; Accuracy Portal
            </h1>
            <p className="typing-hero-subtitle">
              Practice exact notification-pattern typing tests for <strong>SSC CGL (DEST), CHSL, RRB NTPC, &amp; High Court</strong> with live countdown timers, TCS iON backspace restrictions, and instant pass/fail scorecards.
            </p>

            {/* Candidate Bar if logged in */}
            {candidate ? (
              <div className="typing-candidate-banner">
                <span className="candidate-badge-active">Logged in Candidate</span>
                <span className="candidate-name-bold">{candidate.name}</span>
                <span className="candidate-sep">•</span>
                <span className="candidate-exam-pill">{candidate.targetExam}</span>
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="btn-edit-candidate"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="typing-guest-banner">
                <span>Guest Practice Mode Active.</span>
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="btn-link-login"
                >
                  Candidate Login to Save Scorecards →
                </button>
              </div>
            )}

            {/* Exam Quick Selectors */}
            <div className="typing-exam-chips-row">
              <span className="chips-label">Quick Exam Modes:</span>
              <button
                type="button"
                className={`exam-chip-btn${testDuration === 900 && backspaceMode === 'current_word' ? ' active' : ''}`}
                onClick={() => handleQuickExamMode('ssc')}
              >
                🏛️ SSC CGL/CHSL (15 Min | 35 WPM)
              </button>
              <button
                type="button"
                className={`exam-chip-btn${testDuration === 600 && backspaceMode === 'allowed' ? ' active' : ''}`}
                onClick={() => handleQuickExamMode('rrb')}
              >
                🚆 RRB NTPC (10 Min | 30 WPM)
              </button>
              <button
                type="button"
                className={`exam-chip-btn${testDuration === 600 && backspaceMode === 'current_word' ? ' active' : ''}`}
                onClick={() => handleQuickExamMode('court')}
              >
                ⚖️ High Court Typist (10 Min | 40 WPM)
              </button>
              <button
                type="button"
                className={`exam-chip-btn${testDuration === 60 ? ' active' : ''}`}
                onClick={() => handleQuickExamMode('warmup1')}
              >
                ⏱️ 1 Min Sprint
              </button>
              <button
                type="button"
                className={`exam-chip-btn${testDuration === 300 ? ' active' : ''}`}
                onClick={() => handleQuickExamMode('warmup5')}
              >
                ⏱️ 5 Min Practice
              </button>
            </div>
          </div>
        </section>

        {/* Typing Test Arena */}
        <section id="test-arena" className="typing-arena-section">
          <div className="typing-container">
            <div className="typing-card">
              {/* Arena Header & Settings Toolbar */}
              <div className="typing-toolbar">
                <div className="toolbar-left">
                  <span className="arena-status-dot"></span>
                  <span className="arena-title">
                    {TYPING_PASSAGES[selectedPassageIndex].title}
                  </span>
                </div>

                <div className="toolbar-right">
                  {/* Sound Toggle */}
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`btn-toolbar-icon${soundEnabled ? ' active' : ''}`}
                    title={soundEnabled ? 'Typewriter Sound Enabled' : 'Typewriter Sound Muted'}
                  >
                    {soundEnabled ? '🔊 Sound ON' : '🔇 Muted'}
                  </button>

                  {/* Font Size */}
                  <div className="font-size-toggle">
                    <button
                      type="button"
                      className={`font-chip${fontSize === 'normal' ? ' active' : ''}`}
                      onClick={() => setFontSize('normal')}
                      title="Normal Text Size"
                    >
                      A
                    </button>
                    <button
                      type="button"
                      className={`font-chip${fontSize === 'large' ? ' active' : ''}`}
                      onClick={() => setFontSize('large')}
                      title="Large Text Size"
                    >
                      A+
                    </button>
                    <button
                      type="button"
                      className={`font-chip${fontSize === 'xlarge' ? ' active' : ''}`}
                      onClick={() => setFontSize('xlarge')}
                      title="Extra Large Text Size"
                    >
                      A++
                    </button>
                  </div>
                </div>
              </div>

              {/* Controls Grid: Duration, Backspace Mode & Timer */}
              <div className="controls-panel">
                <div className="control-group">
                  <span className="control-label">Duration:</span>
                  <div className="duration-chips">
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
                </div>

                <div className="control-group">
                  <span className="control-label">Backspace Mode:</span>
                  <div className="backspace-mode-chips">
                    <button
                      type="button"
                      className={`mode-chip${backspaceMode === 'allowed' ? ' active' : ''}`}
                      onClick={() => setBackspaceMode('allowed')}
                      title="Standard: You can backspace anything in the input"
                    >
                      Full Allowed
                    </button>
                    <button
                      type="button"
                      className={`mode-chip${backspaceMode === 'current_word' ? ' active' : ''}`}
                      onClick={() => setBackspaceMode('current_word')}
                      title="TCS iON Mode: Backspace allowed only within current active word"
                    >
                      🔒 Current Word (TCS)
                    </button>
                    <button
                      type="button"
                      className={`mode-chip${backspaceMode === 'disabled' ? ' active' : ''}`}
                      onClick={() => setBackspaceMode('disabled')}
                      title="Strict Practice: Backspace is completely locked"
                    >
                      ⛔ Disabled
                    </button>
                  </div>
                </div>

                <div className="timer-box">
                  <div className={`timer-badge${timeLeft <= 30 && isTestActive ? ' warning' : ''}`}>
                    <span className="timer-icon">⏱️</span>
                    <span className="timer-number">{formatTimer(timeLeft)}</span>
                  </div>
                </div>
              </div>

              {/* Passage Dropdown */}
              <div className="passage-select-wrapper">
                <label className="field-caption">Select Passage Topic:</label>
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
                    <option key={p.id} value={idx}>
                      [{p.category}] {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live HUD 5 Stats */}
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-val text-primary">{netWpm}</div>
                  <div className="stat-lbl">Net WPM</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val text-dark">{grossWpm}</div>
                  <div className="stat-lbl">Gross WPM</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val" style={{ color: accuracy >= 95 ? '#16a34a' : accuracy >= 90 ? '#d97706' : '#dc2626' }}>
                    {accuracy}%
                  </div>
                  <div className="stat-lbl">Accuracy</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val text-dark">{keystrokes}</div>
                  <div className="stat-lbl">Depressions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val" style={{ color: errorCount === 0 ? '#16a34a' : '#dc2626' }}>
                    {errorCount}
                  </div>
                  <div className="stat-lbl">Errors</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>

              {/* Passage Reading Box */}
              <div
                ref={passageBoxRef}
                className={`passage-box font-${fontSize}`}
                onClick={() => typingInputRef.current?.focus()}
              >
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
              <div className="input-group-wrapper">
                <input
                  ref={typingInputRef}
                  type="text"
                  className="typing-input"
                  placeholder={
                    isTestActive
                      ? "Type word and press Space..."
                      : "Click here to start typing (Timer begins on your first keystroke)..."
                  }
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

              {/* Actions Toolbar */}
              <div className="actions-bar">
                <div className="hint-text">
                  <span>💡 Press <kbd className="hint-kbd">Space</kbd> after each word to proceed.</span>
                  {backspaceMode === 'current_word' && (
                    <span style={{ color: '#0044cc', marginLeft: 8 }}>[TCS iON Word Lock Active]</span>
                  )}
                </div>
                <div className="actions-btn-group">
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

              {/* Scorecard on Test Completion */}
              {isTestFinished && (
                <div className="scorecard-box">
                  <div className="scorecard-header">
                    <span className="scorecard-badge-icon">🏆</span>
                    <div>
                      <h2 className="scorecard-title">Test Complete! Candidate Evaluation</h2>
                      <p className="scorecard-sub">
                        {candidate?.name ? `Candidate: ${candidate.name} | ` : ''}
                        Elapsed Time: {formatTimer(elapsedSeconds)}
                      </p>
                    </div>
                  </div>

                  {/* Qualification Evaluation Badge */}
                  <div className="qualification-badge-box">
                    {netWpm >= 35 ? (
                      <div className="qualification-tag pass">
                        <span className="tag-icon">✅</span>
                        <div>
                          <strong>QUALIFIED FOR SSC CGL, CHSL (≥ 35 WPM) &amp; RRB NTPC (≥ 30 WPM)</strong>
                          <p>Excellent speed and accuracy! You meet the official criteria for Central Govt posts.</p>
                        </div>
                      </div>
                    ) : netWpm >= 30 ? (
                      <div className="qualification-tag pass">
                        <span className="tag-icon">✅</span>
                        <div>
                          <strong>QUALIFIED FOR RRB NTPC (≥ 30 WPM)</strong>
                          <p>Eligible for Railway NTPC Typing Skill Test! (Target for SSC CGL: 35 WPM).</p>
                        </div>
                      </div>
                    ) : (
                      <div className="qualification-tag fail">
                        <span className="tag-icon">⚠️</span>
                        <div>
                          <strong>NEEDS MORE PRACTICE (Cutoff: 35 WPM SSC / 30 WPM RRB)</strong>
                          <p>Keep practicing daily on exam passages to minimize errors and hit the required benchmark.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Results Breakdown Grid */}
                  <div className="scorecard-grid">
                    <div className="sc-tile highlight">
                      <div className="sc-val">{netWpm} WPM</div>
                      <div className="sc-lbl">Net Speed</div>
                    </div>
                    <div className="sc-tile">
                      <div className="sc-val">{grossWpm} WPM</div>
                      <div className="sc-lbl">Gross Speed</div>
                    </div>
                    <div className="sc-tile">
                      <div className="sc-val" style={{ color: accuracy >= 95 ? '#16a34a' : '#d97706' }}>
                        {accuracy}%
                      </div>
                      <div className="sc-lbl">Accuracy</div>
                    </div>
                    <div className="sc-tile">
                      <div className="sc-val">{keystrokes}</div>
                      <div className="sc-lbl">Total Depressions</div>
                    </div>
                    <div className="sc-tile">
                      <div className="sc-val" style={{ color: errorCount === 0 ? '#16a34a' : '#dc2626' }}>
                        {errorCount}
                      </div>
                      <div className="sc-lbl">Mistakes Count</div>
                    </div>
                    <div className="sc-tile">
                      <div className="sc-val">{backspacesCount}</div>
                      <div className="sc-lbl">Backspaces Used</div>
                    </div>
                  </div>

                  <div className="scorecard-actions">
                    <button
                      type="button"
                      onClick={() => resetTypingTest()}
                      className="btn-start"
                    >
                      🔁 Practice Again
                    </button>
                    {!candidate && (
                      <button
                        type="button"
                        onClick={() => setIsLoginModalOpen(true)}
                        className="btn-secondary-action"
                      >
                        💾 Save Profile &amp; History
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AdSense Unit 1 */}
        <div className="typing-ad-wrapper">
          <AdBanner slotId={ADSENSE_CONFIG.SLOTS.TOOLS_BANNER || ADSENSE_CONFIG.SLOTS.HOMEPAGE_BANNER} />
        </div>

        {/* Exam Modes & Standards Cards */}
        <section id="exam-modes" className="typing-info-section">
          <div className="typing-container">
            <div className="section-head-center">
              <span className="section-tag">OFFICIAL CRITERIA</span>
              <h2 className="section-heading">Supported CBT Exam Typing Standards</h2>
              <p className="section-subheading">
                Notification criteria and evaluation standards followed by major government recruiting boards:
              </p>
            </div>

            <div className="exam-cards-grid">
              {/* Card 1: SSC CGL & CHSL */}
              <div className="exam-info-card">
                <div className="card-top-icon">🏛️</div>
                <h3 className="exam-card-title">SSC CGL &amp; CHSL DEST</h3>
                <div className="exam-rule-row">
                  <span className="rule-label">Duration:</span>
                  <span className="rule-val">15 Minutes</span>
                </div>
                <div className="exam-rule-row">
                  <span className="rule-label">Keystrokes:</span>
                  <span className="rule-val">2000 - 2050 Depressions</span>
                </div>
                <div className="exam-rule-row">
                  <span className="rule-label">Benchmark:</span>
                  <span className="rule-val">35 WPM English / 30 WPM Hindi</span>
                </div>
                <div className="exam-rule-row">
                  <span className="rule-label">Error Relaxation:</span>
                  <span className="rule-val">5% UR / 7% OBC, SC, ST</span>
                </div>
                <p className="exam-card-desc">
                  Conducted by Staff Selection Commission on computer. 5 depressions are counted as 1 word. Negative deduction applies for full and half mistakes.
                </p>
              </div>

              {/* Card 2: RRB NTPC */}
              <div className="exam-info-card">
                <div className="card-top-icon">🚆</div>
                <h3 className="exam-card-title">RRB NTPC Typing Skill Test</h3>
                <div className="exam-rule-row">
                  <span className="rule-label">Duration:</span>
                  <span className="rule-val">10 Minutes</span>
                </div>
                <div className="exam-rule-row">
                  <span className="rule-label">Word Target:</span>
                  <span className="rule-val">300 Words English / 250 Hindi</span>
                </div>
                <div className="exam-rule-row">
                  <span className="rule-label">Speed:</span>
                  <span className="rule-val">30 WPM English / 25 WPM Hindi</span>
                </div>
                <div className="exam-rule-row">
                  <span className="rule-label">Error Allowance:</span>
                  <span className="rule-val">5% of total typed words</span>
                </div>
                <p className="exam-card-desc">
                  Railway Recruitment Board (RRB) requires candidates to type continuously. 5% mistakes are ignored, and each excess mistake deducts 10 words from net score.
                </p>
              </div>

              {/* Card 3: High Court */}
              <div className="exam-info-card">
                <div className="card-top-icon">⚖️</div>
                <h3 className="exam-card-title">High Court &amp; Court Typist</h3>
                <div className="exam-rule-row">
                  <span className="rule-label">Duration:</span>
                  <span className="rule-val">10 Minutes</span>
                </div>
                <div className="exam-rule-row">
                  <span className="rule-label">Required Speed:</span>
                  <span className="rule-val">35 – 40 WPM</span>
                </div>
                <div className="exam-rule-row">
                  <span className="rule-label">Passage:</span>
                  <span className="rule-val">Legal &amp; Judicial Judgments</span>
                </div>
                <div className="exam-rule-row">
                  <span className="rule-label">Evaluation:</span>
                  <span className="rule-val">Strict Accuracy &gt; 95%</span>
                </div>
                <p className="exam-card-desc">
                  High Courts in Delhi, Allahabad, Patna, and Rajasthan follow strict standards. Legal formatting and punctuation errors carry heavy penalties.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Evaluation & Calculation Rules Section */}
        <section id="marking-rules" className="typing-rules-section">
          <div className="typing-container">
            <div className="rules-box">
              <h2 className="rules-box-title">📝 How Net Typing Speed &amp; Errors are Calculated</h2>
              <div className="rules-grid">
                <div className="rule-item">
                  <div className="rule-num">1</div>
                  <div className="rule-content">
                    <h4>The 5-Character Depression Standard</h4>
                    <p>In all government Computer Based Tests, every 5 keystrokes (including letters, numbers, punctuation, and spaces) are counted as one standard word.</p>
                  </div>
                </div>

                <div className="rule-item">
                  <div className="rule-num">2</div>
                  <div className="rule-content">
                    <h4>Full Mistakes (Full Word Penalties)</h4>
                    <p>Omission of words, substitution of words with wrong spelling, or addition of non-existent words are classified as Full Mistakes.</p>
                  </div>
                </div>

                <div className="rule-item">
                  <div className="rule-num">3</div>
                  <div className="rule-content">
                    <h4>Half Mistakes (Minor Discrepancies)</h4>
                    <p>Spacing errors (double spacing between words), capitalization errors (small letter instead of capital letter), or punctuation errors are counted as Half Mistakes.</p>
                  </div>
                </div>

                <div className="rule-item">
                  <div className="rule-num">4</div>
                  <div className="rule-content">
                    <h4>Formula for Net Words Per Minute (WPM)</h4>
                    <p><strong>Net WPM = (Total Correct Depressions / 5 - Error Penalties) / Time in Minutes</strong>. Only the Net WPM determines final selection qualification.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pro Tips Section */}
        <section id="pro-tips" className="typing-tips-section">
          <div className="typing-container">
            <div className="section-head-center">
              <span className="section-tag">ASPIRANT TIPS</span>
              <h2 className="section-heading">4 Golden Rules to Crack CBT Typing Tests</h2>
            </div>

            <div className="tips-grid">
              <div className="tip-card">
                <div className="tip-icon">🎯</div>
                <h4>Accuracy Over Raw Speed</h4>
                <p>In exam conditions, a single mistake deducts multiple net marks. Aim for 98% accuracy at 32 WPM rather than 88% accuracy at 42 WPM.</p>
              </div>

              <div className="tip-card">
                <div className="tip-icon">⌨️</div>
                <h4>Master Home Row Positioning</h4>
                <p>Keep your fingers resting on A-S-D-F and J-K-L-; using all 10 fingers prevents finger fatigue during the rigorous 15-minute exam duration.</p>
              </div>

              <div className="tip-card">
                <div className="tip-icon">🛑</div>
                <h4>Break the Backspace Addiction</h4>
                <p>TCS iON exam software restricts backspace to current word only. Use our &ldquo;Current Word Lock&rdquo; mode to eliminate accidental backspacing habit.</p>
              </div>

              <div className="tip-card">
                <div className="tip-icon">👀</div>
                <h4>Read Two Words Ahead</h4>
                <p>Always keep your eyes focused on the screen, not the physical keyboard. Reading 2-3 words ahead builds natural muscle memory rhythm.</p>
              </div>
            </div>
          </div>
        </section>

        {/* AdSense Unit 2 (Footer banner) */}
        <div className="typing-ad-wrapper">
          <AdBanner slotId={ADSENSE_CONFIG.SLOTS.FOOTER_BANNER} />
        </div>
      </main>

      {/* 2. Dedicated Portal Footer */}
      <TypingFooter />

      {/* 3. Aspirant Login / Profile Modal */}
      <TypingLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialCandidate={candidate}
        onLoginSuccess={(newCand) => setCandidate(newCand)}
      />

      {/* Scoped CSS Styles for Typing Portal */}
      <style jsx global>{`
        .typing-portal-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* Nav Root */
        .typing-nav-root {
          background: #ffffff;
          border-bottom: 1.5px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 999;
          box-shadow: 0 1px 6px rgba(15, 23, 42, 0.04);
        }
        .typing-nav-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 20px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .typing-nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: inherit;
        }
        .typing-nav-logo-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #0044cc;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .typing-nav-brand-title {
          font-size: 1.15rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #0f172a;
          display: block;
          line-height: 1.1;
        }
        .typing-nav-brand-badge {
          font-size: 0.62rem;
          font-weight: 750;
          background: #eff6ff;
          color: #0044cc;
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid #bfdbfe;
          display: inline-block;
          letter-spacing: 0.04em;
        }

        /* Nav Links */
        .typing-nav-desktop-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .typing-nav-link {
          background: transparent;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .typing-nav-link:hover {
          color: #0044cc;
          background: #f1f5f9;
        }

        /* Nav Right */
        .typing-nav-right-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .typing-nav-back-link {
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 750;
          color: #0044cc;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 6px 12px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }
        .typing-nav-back-link:hover {
          background: #0044cc;
          color: #ffffff;
        }

        /* User Pill in Nav */
        .typing-user-pill-wrapper {
          position: relative;
        }
        .typing-user-pill-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          padding: 4px 10px 4px 6px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .typing-user-pill-btn:hover {
          border-color: #0044cc;
        }
        .typing-user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0044cc;
          color: #ffffff;
          font-weight: 850;
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .typing-user-info-text {
          text-align: left;
          line-height: 1.1;
        }
        .typing-user-name {
          display: block;
          font-size: 0.82rem;
          font-weight: 800;
          color: #0f172a;
          max-width: 110px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .typing-user-target {
          display: block;
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 600;
          max-width: 110px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .typing-user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
          padding: 8px;
          z-index: 1000;
        }
        .typing-user-dropdown-header {
          padding: 8px 10px;
          font-size: 0.84rem;
          color: #0f172a;
        }
        .typing-badge-sub {
          display: block;
          font-size: 0.72rem;
          color: #0044cc;
          font-weight: 700;
          margin-top: 2px;
        }
        .typing-dropdown-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 6px 0;
        }
        .typing-dropdown-item {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #334155;
          cursor: pointer;
        }
        .typing-dropdown-item:hover {
          background: #f1f5f9;
        }
        .typing-dropdown-item.danger {
          color: #dc2626;
        }
        .typing-dropdown-item.danger:hover {
          background: #fee2e2;
        }

        .typing-nav-login-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0044cc;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 0.84rem;
          font-weight: 750;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .typing-nav-login-btn:hover {
          background: #0037a8;
        }

        .typing-mobile-toggle-btn {
          display: none;
          background: transparent;
          border: none;
          color: #0f172a;
          cursor: pointer;
          padding: 4px;
        }

        /* Mobile Drawer */
        .typing-mobile-drawer {
          background: #ffffff;
          border-bottom: 1.5px solid #e2e8f0;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .typing-mobile-drawer-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .typing-mobile-link {
          text-align: left;
          background: transparent;
          border: none;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 0.92rem;
          font-weight: 750;
          color: #334155;
          cursor: pointer;
          text-decoration: none;
        }
        .typing-mobile-link:hover {
          background: #f1f5f9;
          color: #0044cc;
        }
        .typing-mobile-auth-bar {
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
        }
        .typing-mobile-login-btn {
          width: 100%;
          background: #0044cc;
          color: #ffffff;
          border: none;
          padding: 10px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 0.92rem;
        }
        .typing-btn-logout-sm {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fca5a5;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.76rem;
        }

        /* Main Content */
        .typing-main-content {
          flex: 1;
        }

        /* Hero */
        .typing-hero-section {
          background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
          border-bottom: 1px solid #e2e8f0;
          padding: 36px 16px 32px;
          text-align: center;
        }
        .typing-hero-container {
          max-width: 920px;
          margin: 0 auto;
        }
        .typing-hero-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 850;
          color: #0044cc;
          background: #dbeafe;
          border: 1px solid #bfdbfe;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 14px;
          letter-spacing: 0.03em;
        }
        .typing-hero-title {
          font-size: 2.1rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.025em;
          margin: 0 0 12px 0;
          line-height: 1.2;
        }
        .typing-hero-subtitle {
          font-size: 1.02rem;
          color: #475569;
          margin: 0 auto 20px;
          max-width: 760px;
          line-height: 1.55;
        }

        /* Candidate Status Bar */
        .typing-candidate-banner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1.5px solid #bfdbfe;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.84rem;
          box-shadow: 0 2px 8px rgba(0, 68, 204, 0.06);
          margin-bottom: 22px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .candidate-badge-active {
          font-size: 0.68rem;
          font-weight: 800;
          background: #dcfce7;
          color: #15803d;
          padding: 2px 8px;
          border-radius: 999px;
        }
        .candidate-name-bold {
          font-weight: 850;
          color: #0f172a;
        }
        .candidate-sep {
          color: #94a3b8;
        }
        .candidate-exam-pill {
          color: #0044cc;
          font-weight: 750;
        }
        .btn-edit-candidate {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.76rem;
          text-decoration: underline;
          cursor: pointer;
        }

        .typing-guest-banner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.82rem;
          color: #64748b;
          margin-bottom: 22px;
        }
        .btn-link-login {
          background: transparent;
          border: none;
          color: #0044cc;
          font-weight: 750;
          cursor: pointer;
        }

        /* Exam Chips */
        .typing-exam-chips-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .chips-label {
          font-size: 0.82rem;
          font-weight: 750;
          color: #64748b;
          margin-right: 4px;
        }
        .exam-chip-btn {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #334155;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .exam-chip-btn:hover {
          border-color: #0044cc;
          color: #0044cc;
        }
        .exam-chip-btn.active {
          background: #0044cc;
          border-color: #0044cc;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 68, 204, 0.2);
        }

        /* Arena Section */
        .typing-arena-section {
          padding: 24px 16px 40px;
        }
        .typing-container {
          max-width: 860px;
          margin: 0 auto;
        }
        .typing-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 24px 26px;
          box-shadow: 0 6px 24px rgba(15, 23, 42, 0.05);
        }

        /* Toolbar */
        .typing-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 16px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .arena-status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
        }
        .arena-title {
          font-size: 1.05rem;
          font-weight: 850;
          color: #0f172a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-toolbar-icon {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 4px 10px;
          border-radius: 7px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-toolbar-icon.active {
          color: #0044cc;
          border-color: #bfdbfe;
          background: #eff6ff;
        }
        .font-size-toggle {
          display: flex;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          overflow: hidden;
        }
        .font-chip {
          background: #ffffff;
          border: none;
          padding: 4px 8px;
          font-size: 0.74rem;
          font-weight: 750;
          color: #64748b;
          cursor: pointer;
        }
        .font-chip.active {
          background: #0044cc;
          color: #ffffff;
        }

        /* Controls Panel */
        .controls-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 12px 16px;
          border-radius: 14px;
          margin-bottom: 16px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .control-label {
          font-size: 0.78rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .duration-chips, .backspace-mode-chips {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .duration-chip, .mode-chip {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 5px 10px;
          border-radius: 7px;
          font-size: 0.78rem;
          font-weight: 750;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .duration-chip:hover, .mode-chip:hover {
          border-color: #94a3b8;
        }
        .duration-chip.active, .mode-chip.active {
          background: #0044cc;
          border-color: #0044cc;
          color: #ffffff;
        }
        .timer-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          padding: 6px 16px;
          border-radius: 9px;
          font-variant-numeric: tabular-nums;
        }
        .timer-badge.warning {
          background: #fef2f2;
          border-color: #fca5a5;
          animation: pulseRed 1s infinite;
        }
        .timer-number {
          font-size: 1.25rem;
          font-weight: 900;
          color: #0f172a;
        }
        .timer-badge.warning .timer-number {
          color: #dc2626;
        }
        @keyframes pulseRed {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        /* Passage Select */
        .passage-select-wrapper {
          margin-bottom: 14px;
        }
        .field-caption {
          display: block;
          font-size: 0.76rem;
          font-weight: 750;
          color: #64748b;
          margin-bottom: 4px;
        }
        .passage-select {
          width: 100%;
          padding: 9px 12px;
          border: 1.5px solid #cbd5e1;
          border-radius: 9px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #0f172a;
          background: #ffffff;
          cursor: pointer;
          outline: none;
        }
        .passage-select:focus {
          border-color: #0044cc;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 8px 6px;
          text-align: center;
        }
        .stat-card.primary {
          background: #eff6ff;
          border-color: #bfdbfe;
        }
        .stat-val {
          font-size: 1.4rem;
          font-weight: 900;
          line-height: 1.1;
        }
        .text-primary {
          color: #0044cc;
        }
        .text-dark {
          color: #0f172a;
        }
        .stat-lbl {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 800;
          text-transform: uppercase;
          margin-top: 3px;
          letter-spacing: 0.02em;
        }

        /* Progress */
        .progress-track {
          height: 5px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .progress-fill {
          height: 100%;
          background: #0044cc;
          transition: width 0.2s ease;
        }

        /* Passage Reading Box */
        .passage-box {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 16px 18px;
          min-height: 140px;
          max-height: 190px;
          overflow-y: auto;
          line-height: 1.8;
          user-select: none;
          margin-bottom: 14px;
          cursor: text;
          scroll-behavior: smooth;
        }
        .passage-box.font-normal {
          font-size: 1.05rem;
        }
        .passage-box.font-large {
          font-size: 1.25rem;
          line-height: 1.9;
        }
        .passage-box.font-xlarge {
          font-size: 1.45rem;
          line-height: 2;
        }
        .p-word {
          display: inline-block;
          margin-right: 7px;
          padding: 2px 4px;
          border-radius: 4px;
          transition: all 0.1s ease;
        }
        .p-word.pending {
          color: #475569;
        }
        .p-word.active {
          background: #0044cc;
          color: #ffffff;
          font-weight: 750;
          box-shadow: 0 0 0 2px rgba(0, 68, 204, 0.2);
        }
        .p-word.correct {
          color: #16a34a;
          background: #f0fdf4;
        }
        .p-word.incorrect {
          color: #dc2626;
          background: #fef2f2;
          text-decoration: underline wavy #dc2626;
        }

        /* Input */
        .input-group-wrapper {
          margin-bottom: 14px;
        }
        .typing-input {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid #0044cc;
          border-radius: 12px;
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          box-sizing: border-box;
          box-shadow: 0 4px 12px rgba(0, 68, 204, 0.08);
          transition: all 0.15s ease;
        }
        .typing-input:focus {
          border-color: #0037a8;
          box-shadow: 0 0 0 4px rgba(0, 68, 204, 0.18);
        }
        .typing-input::placeholder {
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.95rem;
        }

        /* Actions */
        .actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hint-text {
          font-size: 0.82rem;
          color: #64748b;
        }
        .hint-kbd {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 800;
          color: #0f172a;
        }
        .actions-btn-group {
          display: flex;
          gap: 8px;
        }
        .btn-restart {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #475569;
          padding: 9px 18px;
          border-radius: 9px;
          font-size: 0.86rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-restart:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .btn-start {
          background: #0044cc;
          border: 1.5px solid #0044cc;
          color: #ffffff;
          padding: 9px 22px;
          border-radius: 9px;
          font-size: 0.88rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 12px rgba(0, 68, 204, 0.2);
        }
        .btn-start:hover {
          background: #0037a8;
        }

        /* Scorecard */
        .scorecard-box {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 2px dashed #cbd5e1;
          animation: fadeIn 0.2s ease-out;
        }
        .scorecard-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .scorecard-badge-icon {
          font-size: 2rem;
        }
        .scorecard-title {
          font-size: 1.25rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }
        .scorecard-sub {
          font-size: 0.84rem;
          color: #64748b;
          margin: 2px 0 0 0;
        }
        .qualification-badge-box {
          margin-bottom: 16px;
        }
        .qualification-tag {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.88rem;
          line-height: 1.45;
        }
        .qualification-tag.pass {
          background: #f0fdf4;
          border: 1.5px solid #86efac;
          color: #14532d;
        }
        .qualification-tag.fail {
          background: #fef2f2;
          border: 1.5px solid #fca5a5;
          color: #7f1d1d;
        }
        .tag-icon {
          font-size: 1.3rem;
        }
        .scorecard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .sc-tile {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          text-align: center;
        }
        .sc-tile.highlight {
          background: #eff6ff;
          border-color: #93c5fd;
        }
        .sc-tile.highlight .sc-val {
          color: #0044cc;
        }
        .sc-val {
          font-size: 1.5rem;
          font-weight: 900;
          color: #0f172a;
        }
        .sc-lbl {
          font-size: 0.72rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .scorecard-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn-secondary-action {
          background: #f1f5f9;
          border: 1.5px solid #cbd5e1;
          color: #334155;
          padding: 9px 18px;
          border-radius: 9px;
          font-size: 0.88rem;
          font-weight: 750;
          cursor: pointer;
        }

        /* Ad Banner Wrapper */
        .typing-ad-wrapper {
          max-width: 860px;
          margin: 0 auto 30px;
          padding: 0 16px;
        }

        /* Info & Exam Modes */
        .typing-info-section, .typing-rules-section, .typing-tips-section {
          padding: 40px 16px;
        }
        .typing-info-section {
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }
        .section-head-center {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 30px;
        }
        .section-tag {
          font-size: 0.7rem;
          font-weight: 850;
          color: #0044cc;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 3px 10px;
          border-radius: 999px;
          display: inline-block;
          margin-bottom: 8px;
        }
        .section-heading {
          font-size: 1.7rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }
        .section-subheading {
          font-size: 0.92rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* Exam Grid */
        .exam-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .exam-info-card {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 22px 20px;
          display: flex;
          flex-direction: column;
        }
        .card-top-icon {
          font-size: 1.8rem;
          margin-bottom: 10px;
        }
        .exam-card-title {
          font-size: 1.15rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 14px 0;
        }
        .exam-rule-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px dashed #e2e8f0;
          font-size: 0.82rem;
        }
        .rule-label {
          color: #64748b;
          font-weight: 600;
        }
        .rule-val {
          color: #0f172a;
          font-weight: 750;
        }
        .exam-card-desc {
          font-size: 0.80rem;
          color: #64748b;
          margin-top: 14px;
          line-height: 1.5;
        }

        /* Rules Box */
        .rules-box {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 30px;
        }
        .rules-box-title {
          font-size: 1.35rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 24px 0;
          text-align: center;
        }
        .rules-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .rule-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .rule-num {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #0044cc;
          color: #ffffff;
          font-weight: 900;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .rule-content h4 {
          font-size: 0.98rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .rule-content p {
          font-size: 0.84rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* Tips */
        .tips-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .tip-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 18px 16px;
          text-align: center;
        }
        .tip-icon {
          font-size: 1.8rem;
          margin-bottom: 8px;
        }
        .tip-card h4 {
          font-size: 0.92rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }
        .tip-card p {
          font-size: 0.80rem;
          color: #64748b;
          margin: 0;
          line-height: 1.45;
        }

        /* Modal */
        .typing-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .typing-modal-card {
          background: #ffffff;
          border-radius: 20px;
          max-width: 460px;
          width: 100%;
          padding: 26px 24px;
          box-shadow: 0 24px 50px rgba(0, 0, 0, 0.25);
          animation: popModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes popModal {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .typing-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .typing-modal-title-group {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .typing-modal-icon {
          font-size: 1.8rem;
        }
        .typing-modal-title {
          font-size: 1.25rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 2px 0;
        }
        .typing-modal-sub {
          font-size: 0.80rem;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }
        .typing-modal-close-btn {
          background: #f1f5f9;
          border: none;
          color: #64748b;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.84rem;
          font-weight: 700;
        }
        .typing-modal-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .typing-modal-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
        }
        .typing-form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .typing-form-label {
          font-size: 0.82rem;
          font-weight: 750;
          color: #334155;
        }
        .typing-form-input, .typing-form-select {
          padding: 10px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.90rem;
          color: #0f172a;
          outline: none;
        }
        .typing-form-input:focus, .typing-form-select:focus {
          border-color: #0044cc;
        }
        .typing-modal-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }
        .typing-btn-primary {
          background: #0044cc;
          color: #ffffff;
          border: none;
          padding: 11px;
          border-radius: 10px;
          font-size: 0.92rem;
          font-weight: 800;
          cursor: pointer;
        }
        .typing-btn-primary:hover {
          background: #0037a8;
        }
        .typing-btn-secondary {
          background: transparent;
          color: #64748b;
          border: none;
          padding: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
        }
        .typing-btn-secondary:hover {
          color: #0f172a;
        }

        /* Footer */
        .typing-footer-root {
          background: #0b132b;
          color: #cbd5e1;
          padding: 50px 20px 24px;
          margin-top: auto;
          font-size: 0.86rem;
        }
        .typing-footer-container {
          max-width: 1240px;
          margin: 0 auto;
        }
        .typing-footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 36px;
          margin-bottom: 40px;
        }
        .typing-footer-brand-title {
          font-size: 1.25rem;
          font-weight: 900;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .typing-footer-brand-desc {
          font-size: 0.84rem;
          line-height: 1.6;
          color: #94a3b8;
          margin-bottom: 16px;
        }
        .typing-footer-badge-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .typing-footer-pill {
          background: #1e293b;
          color: #38bdf8;
          font-size: 0.70rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #334155;
        }
        .typing-footer-heading {
          font-size: 0.92rem;
          font-weight: 850;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0 0 16px 0;
        }
        .typing-footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .typing-footer-links li span, .typing-footer-links li a {
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.82rem;
          transition: color 0.15s ease;
        }
        .typing-footer-links li a:hover {
          color: #38bdf8;
        }
        .typing-footer-bottom {
          border-top: 1px solid #1e293b;
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.78rem;
          color: #64748b;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .typing-nav-desktop-links {
            display: none;
          }
          .typing-mobile-toggle-btn {
            display: block;
          }
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .exam-cards-grid {
            grid-template-columns: 1fr;
          }
          .rules-grid {
            grid-template-columns: 1fr;
          }
          .tips-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .typing-footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 640px) {
          .typing-hero-title {
            font-size: 1.55rem;
          }
          .typing-card {
            padding: 16px 14px;
            border-radius: 16px;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .scorecard-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .tips-grid {
            grid-template-columns: 1fr;
          }
          .typing-footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
