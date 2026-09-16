'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_FEATURE_FLAGS } from '../config/features';
import { cbtGet, cbtGetString, STORAGE_KEYS } from '../utils/storage';

interface Section {
  name: string;
  total: number;
  correct: number;
  wrong: number;
  bonus?: number;
  unattempted: number;
}

interface QuestionItem {
  q_no: number;
  question_id?: string;
  question_type?: string;
  section: string;
  question_text: string;
  question_image: string;
  question_html: string;
  options: Array<{
    option_no: number;
    option_id?: string;
    option_text: string;
    option_image: string;
    option_html: string;
    is_correct: boolean;
  }>;
  chosen_option: string;
  chosen_option_id?: string;
  right_option: string;
  right_option_no?: number;
  status: string;
}

interface ResultData {
  candidateName: string;
  rollNo: string;
  testDate: string;
  testTime: string;
  testCenter: string;
  examName: string;
  examId?: string;
  headerImgUrl: string;
  headerBannerText?: string;
  infoRows: Array<{ label: string; value: string }>;
  sections: Section[];
  questionsSummary?: QuestionItem[];
  correctCount: number;
  wrongCount: number;
  bonusCount?: number;
  rawBonusQuestions?: string | number;
  unattemptedCount: number;
  overallRank: number;
  shiftRank: number;
  categoryRank: number;
  genderRank?: number;
}

interface FormData {
  ans_key_url?: string;
  category: string;
  horizontal_category?: string;
  gender: string;
  state: string;
  location_label?: string;
  paper_language?: string;
  provider_type?: string;
  marks_right?: number;
  marks_wrong?: number;
  exam_slug?: string;
  exam_id?: string;
}

export default function ReviewAnswerkeyPage() {
  const router = useRouter();
  const breakdownRef = useRef<HTMLDivElement>(null);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [rightVal, setRightVal] = useState(1.0);
  const [wrongVal, setWrongVal] = useState(0.25);
  const [activeSecTab, setActiveSecTab] = useState('ALL');
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [viewMode, setViewMode] = useState<'CBT' | 'LIST'>('CBT');
  const [activeQNo, setActiveQNo] = useState<number>(1);

  useEffect(() => {
    try {
      const rawResult = cbtGet<ResultData>(STORAGE_KEYS.RESULT_DATA);
      const rawForm   = cbtGet<FormData>(STORAGE_KEYS.FORM_DATA);

      if (!rawResult) {
        router.push('/');
        return;
      }

      const result = rawResult as ResultData;
      const form   = rawForm as FormData | null;

      const savedRight = cbtGetString(STORAGE_KEYS.MARKS_RIGHT);
      const savedWrong = cbtGetString(STORAGE_KEYS.MARKS_WRONG);

      if (savedRight !== null && savedRight !== undefined && savedRight !== '') {
        setRightVal(parseFloat(savedRight));
      } else if (form?.marks_right !== undefined && form?.marks_right !== null) {
        setRightVal(Number(form.marks_right));
      } else {
        setRightVal(1.0);
      }

      let effectiveWrong = 0;
      if (savedWrong !== null && savedWrong !== undefined && savedWrong !== '') {
        effectiveWrong = parseFloat(savedWrong);
      } else if (form?.marks_wrong !== undefined && form?.marks_wrong !== null) {
        effectiveWrong = Number(form.marks_wrong);
      }
      setWrongVal(effectiveWrong);

      setResultData(result);
      setFormData(form);

      if (result.questionsSummary && result.questionsSummary.length > 0) {
        setActiveQNo(result.questionsSummary[0].q_no);
      }
    } catch (e) {
      router.push('/');
    }
  }, [router]);

  // ⌨️ Keyboard Shortcuts for CBT Exam Simulation (Left / Right Arrow Keys)
  useEffect(() => {
    if (viewMode !== 'CBT') return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const questions = resultData?.questionsSummary || [];
      if (questions.length === 0) return;

      if (e.key === 'ArrowLeft') {
        const idx = questions.findIndex(q => q.q_no === activeQNo);
        if (idx > 0) {
          const prev = questions[idx - 1];
          setActiveQNo(prev.q_no);
          if (activeSecTab !== 'ALL' && prev.section && prev.section.trim().toLowerCase() !== activeSecTab.trim().toLowerCase()) {
            setActiveSecTab('ALL');
          }
        }
      } else if (e.key === 'ArrowRight') {
        const idx = questions.findIndex(q => q.q_no === activeQNo);
        if (idx >= 0 && idx < questions.length - 1) {
          const next = questions[idx + 1];
          setActiveQNo(next.q_no);
          if (activeSecTab !== 'ALL' && next.section && next.section.trim().toLowerCase() !== activeSecTab.trim().toLowerCase()) {
            setActiveSecTab('ALL');
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, activeQNo, resultData, activeSecTab, activeStatusFilter]);

  function handleStatusFilterChange(st: string, e: React.MouseEvent) {
    e.preventDefault();
    const currentScrollY = window.scrollY;
    const topPos = breakdownRef.current ? breakdownRef.current.getBoundingClientRect().top + window.scrollY : null;
    
    setActiveStatusFilter(st);
    
    if (resultData?.questionsSummary) {
      const matching = resultData.questionsSummary.filter(q => {
        const secMatch = activeSecTab === 'ALL' || (q.section || '').trim().toLowerCase() === activeSecTab.trim().toLowerCase();
        if (!secMatch) return false;
        if (st === 'ALL') return true;
        if (st === 'Discarded') return q.status === 'Discarded' || q.status === 'Bonus' || q.right_option === 'Benefit to All';
        return q.status === st;
      });
      if (matching.length > 0 && !matching.some(q => q.q_no === activeQNo)) {
        setActiveQNo(matching[0].q_no);
      }
    }
    
    requestAnimationFrame(() => {
      if (topPos !== null && currentScrollY > topPos) {
        window.scrollTo({ top: topPos - 20, behavior: 'instant' as ScrollBehavior });
      } else {
        window.scrollTo({ top: currentScrollY, behavior: 'instant' as ScrollBehavior });
      }
    });
  }

  function handleSecTabChange(secName: string, e: React.MouseEvent) {
    e.preventDefault();
    const currentScrollY = window.scrollY;
    const topPos = breakdownRef.current ? breakdownRef.current.getBoundingClientRect().top + window.scrollY : null;
    
    setActiveSecTab(secName);
    
    if (resultData?.questionsSummary) {
      const matching = resultData.questionsSummary.filter(q => {
        const secMatch = secName === 'ALL' || (q.section || '').trim().toLowerCase() === secName.trim().toLowerCase();
        if (!secMatch) return false;
        if (activeStatusFilter === 'ALL') return true;
        if (activeStatusFilter === 'Discarded') return q.status === 'Discarded' || q.status === 'Bonus' || q.right_option === 'Benefit to All';
        return q.status === activeStatusFilter;
      });
      if (matching.length > 0 && !matching.some(q => q.q_no === activeQNo)) {
        setActiveQNo(matching[0].q_no);
      }
    }
    
    requestAnimationFrame(() => {
      if (topPos !== null && currentScrollY > topPos) {
        window.scrollTo({ top: topPos - 20, behavior: 'instant' as ScrollBehavior });
      } else {
        window.scrollTo({ top: currentScrollY, behavior: 'instant' as ScrollBehavior });
      }
    });
  }

  function jumpToQuestion(qNo: number) {
    if (!resultData) return;
    const questions = resultData.questionsSummary || [];
    const targetQ = questions.find(q => q.q_no === qNo);
    if (targetQ) {
      if (activeSecTab !== 'ALL' && targetQ.section && targetQ.section.trim().toLowerCase() !== activeSecTab.trim().toLowerCase()) {
        setActiveSecTab('ALL');
      }
      if (activeStatusFilter !== 'ALL') {
        const isBonus = targetQ.status === 'Discarded' || targetQ.status === 'Bonus' || targetQ.right_option === 'Benefit to All';
        if (activeStatusFilter === 'Discarded' ? !isBonus : targetQ.status !== activeStatusFilter) {
          setActiveStatusFilter('ALL');
        }
      }
    }

    setActiveQNo(qNo);
    setShowMobilePalette(false);

    if (viewMode === 'LIST') {
      setTimeout(() => {
        const el = document.getElementById(`q-card-${qNo}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.transition = 'all 0.3s ease';
          el.style.boxShadow = '0 0 0 3.5px #2563eb, 0 8px 24px rgba(37, 99, 235, 0.25)';
          setTimeout(() => {
            if (el) el.style.boxShadow = '';
          }, 1800);
        }
      }, 100);
    } else {
      const canvasEl = document.getElementById('cbt-question-canvas');
      if (canvasEl && window.innerWidth <= 900) {
        canvasEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  if (!resultData) {
    return null;
  }

  const allQuestions = resultData.questionsSummary || [];

  let totalRight = 0, totalWrong = 0, totalUnattempted = 0;
  resultData.sections.forEach(s => {
    totalRight += s.correct;
    totalWrong += s.wrong;
    totalUnattempted += s.unattempted;
  });

  const selectedSecObj = activeSecTab !== 'ALL'
    ? resultData.sections.find(s => s.name === activeSecTab || s.name.trim().toLowerCase() === activeSecTab.trim().toLowerCase())
    : null;

  const currentSecQuestions = activeSecTab === 'ALL'
    ? allQuestions
    : allQuestions.filter(q => (q.section || '').trim().toLowerCase() === activeSecTab.trim().toLowerCase());

  const pillTotalCount = activeSecTab === 'ALL'
    ? allQuestions.length
    : (selectedSecObj ? selectedSecObj.total : currentSecQuestions.length);

  const pillCorrectCount = activeSecTab === 'ALL'
    ? totalRight
    : (selectedSecObj ? selectedSecObj.correct : currentSecQuestions.filter(q => q.status === 'Correct').length);

  const pillWrongCount = activeSecTab === 'ALL'
    ? totalWrong
    : (selectedSecObj ? selectedSecObj.wrong : currentSecQuestions.filter(q => q.status === 'Wrong').length);

  const pillUnattemptedCount = activeSecTab === 'ALL'
    ? totalUnattempted
    : (selectedSecObj ? selectedSecObj.unattempted : currentSecQuestions.filter(q => q.status === 'Unattempted').length);

  const pillBonusCount = activeSecTab === 'ALL'
    ? (resultData.bonusCount || allQuestions.filter(q => q.status === 'Discarded' || q.status === 'Bonus').length)
    : (selectedSecObj ? (selectedSecObj.bonus || 0) : currentSecQuestions.filter(q => q.status === 'Discarded' || q.status === 'Bonus').length);

  const filteredQuestions = currentSecQuestions.filter(q => {
    if (activeStatusFilter === 'ALL') return true;
    if (activeStatusFilter === 'Discarded') return q.status === 'Discarded' || q.status === 'Bonus' || q.right_option === 'Benefit to All';
    return q.status === activeStatusFilter;
  });

  const activeCbtQuestion = filteredQuestions.find(q => q.q_no === activeQNo) || filteredQuestions[0] || allQuestions.find(q => q.q_no === activeQNo) || allQuestions[0] || null;
  const cbtList = filteredQuestions.length > 0 ? filteredQuestions : allQuestions;
  const currentNavIdx = activeCbtQuestion ? cbtList.findIndex(q => q.q_no === activeCbtQuestion.q_no) : -1;

  const candidateName = resultData.candidateName || resultData.infoRows?.find(r => /name|candidate/i.test(r.label))?.value || 'Verified Candidate';
  const rollNumber = resultData.rollNo || resultData.infoRows?.find(r => /roll|registration|id/i.test(r.label))?.value || '';

  return (
    <main>
      <style>{`
        .review-img-fluid img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
          margin: 6px 0 !important;
          border-radius: 4px !important;
        }
        .review-img-fluid table {
          max-width: 100% !important;
          overflow-x: auto !important;
          display: block !important;
        }
        .palette-grid-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .palette-grid-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .palette-grid-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .palette-grid-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @media (min-width: 901px) {
          .mobile-palette-float-btn {
            display: none !important;
          }
        }
      `}</style>
      <div className="result-main" style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>

        {/* 2-Column Responsive Layout with Right Sidebar */}
        <div style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'flex-start',
          flexWrap: 'wrap'
        }}>

          {/* LEFT MAIN CONTENT COLUMN (Header Banner + Controls + Questions) */}
          <div style={{ flex: '1 1 680px', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Question Breakdown & Header Container */}
            <div ref={breakdownRef} id="question-breakdown-section" style={{ padding: '18px 16px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
              
              {/* Exam Logo / Title Banner (Centered & Full Width Display) */}
              <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                {resultData.headerImgUrl ? (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resultData.headerImgUrl}
                      alt="Exam Header Logo"
                      className="exam-logo"
                      style={{
                        width: '100%',
                        maxWidth: '100%',
                        maxHeight: '120px',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                  </div>
                ) : resultData.headerBannerText ? (
                  <h1 className="exam-name-title" style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', textAlign: 'center' }}>
                    {resultData.headerBannerText}
                  </h1>
                ) : (
                  resultData.examName && (
                    <h1 className="exam-name-title" style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', textAlign: 'center' }}>
                      {resultData.examName}
                    </h1>
                  )
                )}
              </div>

              {/* Candidate Info Summary Header (Visible at Top on Mobile & Print) */}
              <div className="candidate-top-summary" style={{
                marginBottom: '14px',
                padding: '10px 12px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px 12px', fontSize: '9pt' }}>
                  <div><strong>Candidate:</strong> {candidateName}</div>
                  {rollNumber && <div><strong>Roll No:</strong> <span style={{ fontFamily: 'monospace', color: '#0044cc', fontWeight: 800 }}>{rollNumber}</span></div>}
                  {resultData.testDate && <div><strong>Date:</strong> {resultData.testDate}</div>}
                  {resultData.testTime && <div><strong>Time:</strong> {resultData.testTime}</div>}
                  {formData?.category && <div><strong>Category:</strong> {formData.category}</div>}
                  {formData?.state && <div><strong>State:</strong> {formData.state}</div>}
                </div>
              </div>

              {/* Colorful Filter Status Pills & Download PDF Button Row (Hidden on Print) */}
              <div className="no-print" style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '14px',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '12px'
              }}>
                
                {/* Left: Status Filter Pills (ALL, Correct, Wrong, Unattempted) */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* ALL Pill */}
                  <button
                    type="button"
                    onClick={(e) => handleStatusFilterChange('ALL', e)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: activeStatusFilter === 'ALL' ? '1px solid #1d4ed8' : '1px solid #bfdbfe',
                      transition: 'all 0.2s ease',
                      background: activeStatusFilter === 'ALL' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#eff6ff',
                      color: activeStatusFilter === 'ALL' ? '#ffffff' : '#1d4ed8',
                      boxShadow: activeStatusFilter === 'ALL' ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none'
                    }}
                  >
                    All ({pillTotalCount})
                  </button>

                  {/* Correct Pill */}
                  <button
                    type="button"
                    onClick={(e) => handleStatusFilterChange('Correct', e)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: activeStatusFilter === 'Correct' ? '1px solid #047857' : '1px solid #a7f3d0',
                      transition: 'all 0.2s ease',
                      background: activeStatusFilter === 'Correct' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#ecfdf5',
                      color: activeStatusFilter === 'Correct' ? '#ffffff' : '#047857',
                      boxShadow: activeStatusFilter === 'Correct' ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none'
                    }}
                  >
                    Correct ({pillCorrectCount})
                  </button>

                  {/* Wrong Pill */}
                  <button
                    type="button"
                    onClick={(e) => handleStatusFilterChange('Wrong', e)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: activeStatusFilter === 'Wrong' ? '1px solid #b91c1c' : '1px solid #fecaca',
                      transition: 'all 0.2s ease',
                      background: activeStatusFilter === 'Wrong' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#fef2f2',
                      color: activeStatusFilter === 'Wrong' ? '#ffffff' : '#b91c1c',
                      boxShadow: activeStatusFilter === 'Wrong' ? '0 2px 8px rgba(239, 68, 68, 0.35)' : 'none'
                    }}
                  >
                    Wrong ({pillWrongCount})
                  </button>

                  {/* Unattempted Pill */}
                  <button
                    type="button"
                    onClick={(e) => handleStatusFilterChange('Unattempted', e)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: activeStatusFilter === 'Unattempted' ? '1px solid #b45309' : '1px solid #fde68a',
                      transition: 'all 0.2s ease',
                      background: activeStatusFilter === 'Unattempted' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#fffbeb',
                      color: activeStatusFilter === 'Unattempted' ? '#ffffff' : '#b45309',
                      boxShadow: activeStatusFilter === 'Unattempted' ? '0 2px 8px rgba(245, 158, 11, 0.35)' : 'none'
                    }}
                  >
                    Unattempted ({pillUnattemptedCount})
                  </button>

                  {/* Bonus / Discarded Pill (Shown only when > 0) */}
                  {pillBonusCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => handleStatusFilterChange('Discarded', e)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        border: activeStatusFilter === 'Discarded' ? '1px solid #7e22ce' : '1px solid #e9d5ff',
                        transition: 'all 0.2s ease',
                        background: activeStatusFilter === 'Discarded' ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : '#faf5ff',
                        color: activeStatusFilter === 'Discarded' ? '#ffffff' : '#7e22ce',
                        boxShadow: activeStatusFilter === 'Discarded' ? '0 2px 8px rgba(168, 85, 247, 0.35)' : 'none'
                      }}
                    >
                      Bonus / Discarded ({pillBonusCount})
                    </button>
                  )}
                </div>

                {/* Right: View Mode Toggle & Download PDF Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {allQuestions.length > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <button
                        type="button"
                        onClick={() => setViewMode('CBT')}
                        title="Switch to Real DigiALM / TCS iON CBT Interface"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 11px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: viewMode === 'CBT' ? 'linear-gradient(135deg, #004080 0%, #002b5c 100%)' : 'transparent',
                          color: viewMode === 'CBT' ? '#ffffff' : '#475569',
                          boxShadow: viewMode === 'CBT' ? '0 2px 6px rgba(0, 64, 128, 0.35)' : 'none'
                        }}
                      >
                        <span>🖥️ DigiALM CBT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('LIST')}
                        title="Switch to Full Question Paper List View"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 11px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: viewMode === 'LIST' ? 'linear-gradient(135deg, #004080 0%, #002b5c 100%)' : 'transparent',
                          color: viewMode === 'LIST' ? '#ffffff' : '#475569',
                          boxShadow: viewMode === 'LIST' ? '0 2px 6px rgba(0, 64, 128, 0.35)' : 'none'
                        }}
                      >
                        <span>📋 Question Paper</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#ffffff',
                      color: '#0f172a',
                      border: '1.5px solid #cbd5e1',
                      padding: '5px 12px',
                      borderRadius: '14px',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                </div>

              </div>

              {/* Dynamic Section Selector Tabs (Hidden on Print) */}
              {resultData.sections && resultData.sections.length > 1 && (
                <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={(e) => handleSecTabChange('ALL', e)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: activeSecTab === 'ALL' ? '1px solid #4338ca' : '1px solid #e2e8f0',
                      background: activeSecTab === 'ALL' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#f8fafc',
                      color: activeSecTab === 'ALL' ? '#ffffff' : '#475569',
                      boxShadow: activeSecTab === 'ALL' ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'
                    }}
                  >
                    All Sections ({allQuestions.length})
                  </button>
                  {resultData.sections.map(sec => {
                    const isActive = activeSecTab === sec.name;
                    return (
                      <button
                        key={sec.name}
                        type="button"
                        onClick={(e) => handleSecTabChange(sec.name, e)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: isActive ? '1px solid #4338ca' : '1px solid #e2e8f0',
                          background: isActive ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#f8fafc',
                          color: isActive ? '#ffffff' : '#475569',
                          boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'
                        }}
                      >
                        {sec.name} ({sec.total})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Question Cards List or Clean Empty State Handler */}
              {filteredQuestions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  background: '#f8fafc',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '16px',
                  margin: '10px 0'
                }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
                    {activeStatusFilter === 'Wrong' ? '🎉' : activeStatusFilter === 'Unattempted' ? '⚡' : '📝'}
                  </div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    {activeStatusFilter === 'Wrong' ? 'No Wrong Answers Found!' :
                     activeStatusFilter === 'Unattempted' ? 'No Unattempted Questions!' :
                     activeStatusFilter === 'Correct' ? 'No Correct Answers Found' :
                     'No Questions Found'}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    {activeStatusFilter === 'Wrong' ? 'Excellent! You answered all questions correctly in this selection.' :
                     activeStatusFilter === 'Unattempted' ? 'Great effort! You attempted every question in this selection.' :
                     'Select another filter or section tab above to view questions.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* CBT Exam Simulator Canvas (Active when in CBT Mode) */}
                  {viewMode === 'CBT' && activeCbtQuestion && (
                    <div
                      id="cbt-question-canvas"
                      className="no-print"
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0, 51, 102, 0.08)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        marginBottom: '16px'
                      }}
                    >
                      {/* DigiALM Master Navy Blue Header */}
                      <div style={{
                        background: 'linear-gradient(90deg, #003366 0%, #004b87 100%)',
                        color: '#ffffff',
                        padding: '10px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                        borderBottom: '2px solid #002b55'
                      }}>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '0.96rem', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#ffffff', color: '#003366', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 900 }}>
                              CBT
                            </span>
                            <span>{resultData.examName || resultData.headerBannerText || 'Computer Based Test Assessment'}</span>
                          </div>
                          <div style={{ fontSize: '0.68rem', opacity: 0.85, marginTop: '2px' }}>
                            TCS iON / DigiALM Official Candidate Response Sheet Simulator
                          </div>
                        </div>

                        {/* Candidate Profile Header Card */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            background: '#ffffff',
                            color: '#003366',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 900
                          }}>
                            👤
                          </div>
                          <div style={{ fontSize: '0.72rem', lineHeight: 1.25 }}>
                            <div style={{ fontWeight: 800 }}>{candidateName}</div>
                            <div style={{ opacity: 0.9, fontSize: '0.66rem' }}>
                              Roll: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{rollNumber || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DigiALM Section Ribbon & Sub-Header */}
                      <div style={{
                        background: '#e9edf2',
                        borderBottom: '2px solid #cbd5e1',
                        padding: '8px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {/* Left: Dynamic Section Tabs in authentic DigiALM button style */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={(e) => handleSecTabChange('ALL', e)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              border: activeSecTab === 'ALL' ? '1px solid #003366' : '1px solid #cbd5e1',
                              background: activeSecTab === 'ALL' ? '#004080' : '#ffffff',
                              color: activeSecTab === 'ALL' ? '#ffffff' : '#334155',
                              boxShadow: activeSecTab === 'ALL' ? '0 2px 4px rgba(0, 64, 128, 0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            All Sections {activeSecTab === 'ALL' ? '▾' : ''} ({allQuestions.length})
                          </button>
                          {resultData.sections && resultData.sections.map(sec => {
                            const isActive = activeSecTab === sec.name;
                            return (
                              <button
                                key={sec.name}
                                type="button"
                                onClick={(e) => handleSecTabChange(sec.name, e)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  border: isActive ? '1px solid #003366' : '1px solid #cbd5e1',
                                  background: isActive ? '#004080' : '#ffffff',
                                  color: isActive ? '#ffffff' : '#334155',
                                  boxShadow: isActive ? '0 2px 4px rgba(0, 64, 128, 0.25)' : 'none',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {sec.name} {isActive ? '▾' : ''} ({sec.total})
                              </button>
                            );
                          })}
                        </div>

                        {/* Right: DigiALM Question Meta Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.72rem', color: '#475569' }}>
                          <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            Type: MCQ
                          </span>
                          <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            View in: English ▾
                          </span>
                          <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            Marking: <strong style={{ color: '#16a34a' }}>+{rightVal}</strong> | <strong style={{ color: '#dc2626' }}>-{wrongVal}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Question Sub-Header Strip */}
                      <div style={{
                        padding: '8px 18px',
                        background: '#f8fafc',
                        borderBottom: '1.5px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 900, fontSize: '0.94rem', color: '#004080' }}>
                            Question No. {activeCbtQuestion.q_no}
                          </span>
                          {activeCbtQuestion.section && (
                            <span style={{
                              fontSize: '0.7rem',
                              background: '#e2e8f0',
                              color: '#334155',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 700
                            }}>
                              {activeCbtQuestion.section}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                            Question {currentNavIdx + 1} of {cbtList.length}
                          </span>
                          {(() => {
                            const isCorrect = activeCbtQuestion.status === 'Correct';
                            const isWrong = activeCbtQuestion.status === 'Wrong';
                            const isBonus = activeCbtQuestion.status === 'Discarded' || activeCbtQuestion.status === 'Bonus' || activeCbtQuestion.right_option === 'Benefit to All';
                            return (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: isCorrect ? '#16a34a' : isWrong ? '#dc2626' : isBonus ? '#9333ea' : '#94a3b8',
                                color: '#ffffff'
                              }}>
                                {isCorrect ? `Correct (+${rightVal})` : isWrong ? `Wrong (-${wrongVal})` : isBonus ? `Bonus (+${rightVal})` : 'Not Attempted'}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Question Content & DigiALM Question Status Box */}
                      <div style={{
                        padding: '18px 20px',
                        display: 'flex',
                        gap: '20px',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        alignItems: 'flex-start'
                      }}>
                        {/* Left Main: Question Stem & Options */}
                        <div style={{ flex: '1 1 500px', minWidth: '280px' }}>
                          {/* Question Text / Image / HTML */}
                          <div style={{
                            fontSize: '0.92rem',
                            color: '#0f172a',
                            fontWeight: 600,
                            lineHeight: 1.6,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            marginBottom: '16px'
                          }}>
                            {activeCbtQuestion.question_html ? (
                              <div className="review-img-fluid" style={{ maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: activeCbtQuestion.question_html }} />
                            ) : activeCbtQuestion.question_image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={activeCbtQuestion.question_image} alt={`Question ${activeCbtQuestion.q_no}`} style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', display: 'block' }} />
                            ) : (
                              <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{activeCbtQuestion.question_text}</div>
                            )}
                          </div>

                          {/* Options List */}
                          {activeCbtQuestion.options && activeCbtQuestion.options.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Options / Choices:
                              </div>
                              {activeCbtQuestion.options.map(opt => {
                                const isBonus = activeCbtQuestion.status === 'Discarded' || activeCbtQuestion.status === 'Bonus' || activeCbtQuestion.right_option === 'Benefit to All';
                                const isOptRight = !isBonus && opt.is_correct;
                                const chosenLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][opt.option_no - 1] || '';
                                const isOptChosen = (activeCbtQuestion.chosen_option_id && opt.option_id && activeCbtQuestion.chosen_option_id === opt.option_id) || 
                                                   (activeCbtQuestion.chosen_option && String(activeCbtQuestion.chosen_option).trim().toLowerCase() === String(opt.option_no).trim().toLowerCase()) ||
                                                   (activeCbtQuestion.chosen_option && chosenLetter && String(activeCbtQuestion.chosen_option).trim().toUpperCase() === chosenLetter);

                                let bg = '#ffffff';
                                let border = '1.5px solid #e2e8f0';
                                let color = '#334155';
                                let badgeText = '';

                                if (!isBonus) {
                                  if (isOptRight && isOptChosen) {
                                    bg = '#ecfdf5';
                                    border = '2px solid #16a34a';
                                    color = '#14532d';
                                    badgeText = '✔ Correct & Chosen by You';
                                  } else if (isOptRight) {
                                    bg = '#f0fdf4';
                                    border = '2px solid #16a34a';
                                    color = '#14532d';
                                    badgeText = '✔ Official Correct Option';
                                  } else if (isOptChosen) {
                                    bg = '#fef2f2';
                                    border = '2px solid #dc2626';
                                    color = '#7f1d1d';
                                    badgeText = '✖ Your Option (Incorrect)';
                                  }
                                }

                                const cleanOptHtml = opt.option_html ? opt.option_html.replace(new RegExp(`^(\\s*(?:<[^>]+>\\s*)*)${opt.option_no}[\\.\\)]\\s*`, 'i'), '$1') : '';
                                const cleanOptText = opt.option_text ? opt.option_text.replace(new RegExp(`^(\\s*)${opt.option_no}[\\.\\)]\\s*`, 'i'), '$1') : '';

                                return (
                                  <div
                                    key={opt.option_no}
                                    style={{
                                      padding: '10px 14px',
                                      borderRadius: '6px',
                                      background: bg,
                                      border: border,
                                      color: color,
                                      fontSize: '0.84rem',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      width: '100%',
                                      boxSizing: 'border-box',
                                      overflow: 'hidden',
                                      gap: '10px',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: '8px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                      {/* DigiALM Style Radio Button */}
                                      <span style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        border: isOptChosen ? '5px solid #004080' : '2px solid #94a3b8',
                                        background: '#ffffff',
                                        flexShrink: 0,
                                        marginTop: '2px',
                                        display: 'inline-block'
                                      }} />
                                      <span style={{ fontWeight: 800, flexShrink: 0, marginTop: '1px' }}>{opt.option_no}.</span>
                                      {cleanOptHtml ? (
                                        <div className="review-img-fluid" style={{ flex: 1, minWidth: 0, maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: cleanOptHtml }} />
                                      ) : opt.option_image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={opt.option_image} alt={`Option ${opt.option_no}`} style={{ maxWidth: '100%', height: 'auto', maxHeight: '160px', objectFit: 'contain', display: 'block', borderRadius: '4px' }} />
                                      ) : (
                                        <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word', flex: 1, minWidth: 0, paddingTop: '1px' }}>{cleanOptText}</span>
                                      )}
                                    </div>
                                    {badgeText && (
                                      <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 900,
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: isOptRight ? '#16a34a' : '#dc2626',
                                        color: '#ffffff',
                                        marginLeft: '6px',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                        marginTop: '2px'
                                      }}>
                                        {badgeText}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Right: The Famous DigiALM Official Question Information Table */}
                        <div style={{
                          flex: '0 0 240px',
                          maxWidth: '100%',
                          background: '#f8fafc',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}>
                          <div style={{
                            background: '#e2e8f0',
                            borderBottom: '1.5px solid #cbd5e1',
                            padding: '7px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            color: '#004080'
                          }}>
                            DigiALM Question Details
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>Question ID :</td>
                                <td style={{ padding: '6px 10px', fontWeight: 800, color: '#0f172a', textAlign: 'right' }}>{activeCbtQuestion.q_no}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>Status :</td>
                                <td style={{
                                  padding: '6px 10px',
                                  fontWeight: 800,
                                  textAlign: 'right',
                                  color: activeCbtQuestion.status === 'Unattempted' ? '#94a3b8' : '#16a34a'
                                }}>
                                  {activeCbtQuestion.status === 'Unattempted' ? 'Not Answered' : 'Answered'}
                                </td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>Chosen Option :</td>
                                <td style={{ padding: '6px 10px', fontWeight: 800, color: '#0f172a', textAlign: 'right' }}>
                                  {activeCbtQuestion.chosen_option ? activeCbtQuestion.chosen_option : '--'}
                                </td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>Given Key :</td>
                                <td style={{ padding: '6px 10px', fontWeight: 800, color: '#16a34a', textAlign: 'right' }}>
                                  {activeCbtQuestion.right_option ? activeCbtQuestion.right_option : 'Benefit to All'}
                                </td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>Evaluation :</td>
                                <td style={{
                                  padding: '6px 10px',
                                  fontWeight: 900,
                                  textAlign: 'right',
                                  color: activeCbtQuestion.status === 'Correct' ? '#16a34a' :
                                         activeCbtQuestion.status === 'Wrong' ? '#dc2626' :
                                         activeCbtQuestion.status === 'Discarded' || activeCbtQuestion.status === 'Bonus' ? '#9333ea' : '#64748b'
                                }}>
                                  {activeCbtQuestion.status}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>Marks Awarded :</td>
                                <td style={{
                                  padding: '6px 10px',
                                  fontWeight: 900,
                                  textAlign: 'right',
                                  color: activeCbtQuestion.status === 'Correct' ? '#16a34a' :
                                         activeCbtQuestion.status === 'Wrong' ? '#dc2626' :
                                         activeCbtQuestion.status === 'Discarded' || activeCbtQuestion.status === 'Bonus' ? '#9333ea' : '#64748b'
                                }}>
                                  {activeCbtQuestion.status === 'Correct' ? `+${rightVal}` :
                                   activeCbtQuestion.status === 'Wrong' ? `-${wrongVal}` :
                                   activeCbtQuestion.status === 'Discarded' || activeCbtQuestion.status === 'Bonus' ? `+${rightVal}` : '0.00'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* DigiALM Bottom Action Bar */}
                      <div style={{
                        background: '#e9edf2',
                        borderTop: '2px solid #cbd5e1',
                        padding: '10px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        flexWrap: 'wrap'
                      }}>
                        {/* Left: Question Paper & Clear Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setViewMode('LIST')}
                            title="View Full Question Paper List"
                            style={{
                              padding: '7px 14px',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              border: '1px solid #4f46e5',
                              background: '#4f46e5',
                              color: '#ffffff',
                              cursor: 'pointer',
                              boxShadow: '0 1px 3px rgba(79, 70, 229, 0.25)'
                            }}
                          >
                            📋 Question Paper
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleStatusFilterChange('ALL', e)}
                            title="Reset status filters to see all questions"
                            style={{
                              padding: '7px 14px',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            Clear Filter
                          </button>
                        </div>

                        {/* Center: Question Counter */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#004080' }}>
                            Question {currentNavIdx + 1} of {cbtList.length}
                          </div>
                          <div style={{ fontSize: '0.64rem', color: '#64748b' }}>
                            (Keyboard: ◄ / ► arrow keys)
                          </div>
                        </div>

                        {/* Right: Previous & Save and Next */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            disabled={currentNavIdx <= 0}
                            onClick={() => {
                              if (currentNavIdx > 0) {
                                jumpToQuestion(cbtList[currentNavIdx - 1].q_no);
                              }
                            }}
                            title="Previous Question (◄ Left Arrow)"
                            style={{
                              padding: '7px 16px',
                              borderRadius: '4px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              border: '1px solid #cbd5e1',
                              background: currentNavIdx <= 0 ? '#f1f5f9' : '#ffffff',
                              color: currentNavIdx <= 0 ? '#94a3b8' : '#0f172a',
                              cursor: currentNavIdx <= 0 ? 'not-allowed' : 'pointer',
                              boxShadow: currentNavIdx <= 0 ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                          >
                            ◄ Previous
                          </button>

                          <button
                            type="button"
                            disabled={currentNavIdx >= cbtList.length - 1}
                            onClick={() => {
                              if (currentNavIdx < cbtList.length - 1) {
                                jumpToQuestion(cbtList[currentNavIdx + 1].q_no);
                              }
                            }}
                            title="Save & Next Question (► Right Arrow)"
                            style={{
                              padding: '7px 18px',
                              borderRadius: '4px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              border: 'none',
                              background: currentNavIdx >= cbtList.length - 1 ? '#94a3b8' : '#16a34a',
                              color: '#ffffff',
                              cursor: currentNavIdx >= cbtList.length - 1 ? 'not-allowed' : 'pointer',
                              boxShadow: currentNavIdx >= cbtList.length - 1 ? 'none' : '0 2px 6px rgba(22, 163, 74, 0.3)'
                            }}
                          >
                            Save & Next ►
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question Cards List: Rendered in LIST mode on screen, and in PRINT mode always */}
                  <div
                    className={viewMode === 'LIST' ? '' : 'print-only'}
                    style={{
                      display: viewMode === 'LIST' ? 'flex' : undefined,
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    {filteredQuestions.map((q, idx) => {
                      const isCorrect = q.status === 'Correct';
                      const isWrong = q.status === 'Wrong';
                      const isBonus = q.status === 'Discarded' || q.status === 'Bonus' || q.right_option === 'Benefit to All';

                      return (
                        <div
                          key={idx}
                          id={`q-card-${q.q_no}`}
                          style={{
                            borderRadius: '14px',
                            border: isCorrect ? '1.5px solid #a7f3d0' : isWrong ? '1.5px solid #fecaca' : isBonus ? '1.5px solid #d8b4fe' : '1px solid #e2e8f0',
                            background: isCorrect ? '#f0fdf4' : isWrong ? '#fef2f2' : isBonus ? '#faf5ff' : '#f8fafc',
                            padding: '14px 16px',
                            scrollMarginTop: '20px',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            width: '100%'
                          }}
                        >
                          {/* Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>Q.{q.q_no}</span>
                              <span style={{ fontSize: '0.68rem', background: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                {q.section}
                              </span>
                            </div>
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 900, padding: '2px 8px', borderRadius: '10px',
                              background: isCorrect ? '#10b981' : isWrong ? '#ef4444' : isBonus ? '#9333ea' : '#64748b',
                              color: '#ffffff',
                              whiteSpace: 'nowrap'
                            }}>
                              {isCorrect ? `Correct (+${rightVal})` : isWrong ? `Wrong (-${wrongVal})` : isBonus ? `Bonus (+${rightVal})` : 'Unattempted (0.0)'}
                            </span>
                          </div>

                          {/* Question Text / Image / HTML */}
                          <div style={{ fontSize: '0.88rem', color: '#1e293b', marginBottom: '12px', fontWeight: 600, lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%', boxSizing: 'border-box' }}>
                            {q.question_html ? (
                              <div className="review-img-fluid" style={{ maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: q.question_html }} />
                            ) : q.question_image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={q.question_image} alt={`Question ${q.q_no}`} style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', display: 'block' }} />
                            ) : (
                              <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{q.question_text}</div>
                            )}
                          </div>

                          {/* Options List */}
                          {q.options && q.options.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                              {q.options.map(opt => {
                                const isOptRight = !isBonus && opt.is_correct;
                                const chosenLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][opt.option_no - 1] || '';
                                const isOptChosen = (q.chosen_option_id && opt.option_id && q.chosen_option_id === opt.option_id) || 
                                                   (q.chosen_option && String(q.chosen_option).trim().toLowerCase() === String(opt.option_no).trim().toLowerCase()) ||
                                                   (q.chosen_option && chosenLetter && String(q.chosen_option).trim().toUpperCase() === chosenLetter);

                                let bg = '#ffffff';
                                let border = '1px solid #e2e8f0';
                                let color = '#334155';
                                let badgeText = '';

                                if (!isBonus) {
                                  if (isOptRight) {
                                    bg = '#d1fae5';
                                    border = '1.5px solid #10b981';
                                    color = '#065f46';
                                    badgeText = '✓ Correct Answer';
                                  }
                                  if (isOptChosen && !isOptRight) {
                                    bg = '#fee2e2';
                                    border = '1.5px solid #ef4444';
                                    color = '#991b1b';
                                    badgeText = '✗ Your Answer';
                                  }
                                }

                                const cleanOptHtml = opt.option_html ? opt.option_html.replace(new RegExp(`^(\\s*(?:<[^>]+>\\s*)*)${opt.option_no}[\\.\\)]\\s*`, 'i'), '$1') : '';
                                const cleanOptText = opt.option_text ? opt.option_text.replace(new RegExp(`^(\\s*)${opt.option_no}[\\.\\)]\\s*`, 'i'), '$1') : '';

                                return (
                                  <div key={opt.option_no} style={{
                                    padding: '9px 12px', borderRadius: '8px', background: bg, border: border, color: color,
                                    fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                    width: '100%', boxSizing: 'border-box', overflow: 'hidden', gap: '8px'
                                  }}>
                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: '6px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                      <span style={{ fontWeight: 800, flexShrink: 0, marginTop: '1px' }}>{opt.option_no}.</span>
                                      {cleanOptHtml ? (
                                        <div className="review-img-fluid" style={{ flex: 1, minWidth: 0, maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: cleanOptHtml }} />
                                      ) : opt.option_image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={opt.option_image} alt={`Option ${opt.option_no}`} style={{ maxWidth: '100%', height: 'auto', maxHeight: '140px', objectFit: 'contain', display: 'block', borderRadius: '4px' }} />
                                      ) : (
                                        <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word', flex: 1, minWidth: 0 }}>{cleanOptText}</span>
                                      )}
                                    </div>
                                    {badgeText && (
                                      <span style={{ fontSize: '0.68rem', fontWeight: 900, marginLeft: '6px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px' }}>
                                        {badgeText}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

            </div>

          </div>

          {/* RIGHT SIDEBAR COLUMN (Candidate Info + Integrated View Your Rank Button + Back to Scorecard) */}
          <div className="review-right-sidebar no-print" style={{
            flex: '0 0 310px',
            minWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'sticky',
            top: '20px'
          }}>

            {/* Sidebar Card 0: 🎯 DigiALM Question Palette */}
            {allQuestions.length > 0 && (
              <div className="sidebar-palette-card" style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0, 51, 102, 0.08)'
              }}>
                {/* Candidate Info Strip in Palette (Authentic DigiALM Top Right Card) */}
                <div style={{
                  background: 'linear-gradient(90deg, #003366 0%, #004b87 100%)',
                  color: '#ffffff',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '4px',
                    background: '#ffffff',
                    color: '#003366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    flexShrink: 0
                  }}>
                    👤
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {candidateName}
                    </div>
                    <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>
                      Roll: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{rollNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* DigiALM 4-Grid Legend */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '3px', background: '#16a34a', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.68rem' }}>
                      {totalRight}
                    </span>
                    <span>Answered (Correct)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991b1b' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '3px', background: '#dc2626', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.68rem' }}>
                      {totalWrong}
                    </span>
                    <span>Not Answered (Wrong)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '3px', background: '#94a3b8', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.68rem' }}>
                      {totalUnattempted}
                    </span>
                    <span>Not Visited</span>
                  </div>
                  {pillBonusCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b21a8' }}>
                      <span style={{ width: '20px', height: '20px', borderRadius: '3px', background: '#9333ea', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.68rem' }}>
                        {pillBonusCount}
                      </span>
                      <span>Marked for Review</span>
                    </div>
                  )}
                </div>

                {/* DigiALM Section Ribbon Header */}
                <div style={{
                  background: '#004080',
                  color: '#ffffff',
                  padding: '6px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  SECTION : {activeSecTab === 'ALL' ? 'All Sections' : activeSecTab}
                </div>

                {/* Number Grid */}
                <div className="palette-grid-scroll" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
                  gap: '6px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  padding: '10px 12px'
                }}>
                  {allQuestions.map(q => {
                    const isCorrect = q.status === 'Correct';
                    const isWrong = q.status === 'Wrong';
                    const isBonus = q.status === 'Discarded' || q.status === 'Bonus' || q.right_option === 'Benefit to All';
                    const isActiveCbtQ = viewMode === 'CBT' && q.q_no === activeQNo;
                    let bg = '#f1f5f9';
                    let border = '1px solid #cbd5e1';
                    let color = '#475569';
                    if (isCorrect) {
                      bg = '#16a34a';
                      border = '1px solid #15803d';
                      color = '#ffffff';
                    } else if (isWrong) {
                      bg = '#dc2626';
                      border = '1px solid #b91c1c';
                      color = '#ffffff';
                    } else if (isBonus) {
                      bg = '#9333ea';
                      border = '1px solid #7e22ce';
                      color = '#ffffff';
                    }

                    return (
                      <button
                        key={q.q_no}
                        type="button"
                        onClick={() => jumpToQuestion(q.q_no)}
                        title={`Q.${q.q_no} [${q.section}] - ${q.status}`}
                        style={{
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: isActiveCbtQ ? 900 : 700,
                          cursor: 'pointer',
                          border: isActiveCbtQ ? '2px solid #004080' : border,
                          background: bg,
                          color: color,
                          padding: 0,
                          transition: 'all 0.15s ease',
                          transform: isActiveCbtQ ? 'scale(1.15)' : 'none',
                          boxShadow: isActiveCbtQ ? '0 0 0 3px #fbbf24, 0 4px 12px rgba(0, 64, 128, 0.4)' : 'none',
                          zIndex: isActiveCbtQ ? 2 : 1,
                          position: 'relative'
                        }}
                      >
                        {q.q_no}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Palette Action Buttons */}
                <div style={{
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  padding: '8px 12px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'CBT' ? 'LIST' : 'CBT')}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #004080',
                      background: '#ffffff',
                      color: '#004080',
                      fontWeight: 800,
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    {viewMode === 'CBT' ? '📋 Question Paper' : '🖥️ DigiALM CBT'}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontWeight: 800,
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    🖨️ Print
                  </button>
                </div>
              </div>
            )}

            {/* Sidebar Card 1: 👤 User Information Profile with Integrated View Your Rank Button */}
            <div className="sidebar-profile-card" style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '18px',
              padding: '16px',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.9rem'
                }}>
                  👤
                </div>
                <div>
                  <h3 style={{ fontSize: '0.86rem', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                    Candidate Profile
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Response Sheet Details</span>
                </div>
              </div>

              {/* Information Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {resultData.infoRows && resultData.infoRows.length > 0 ? (
                  resultData.infoRows.map((row, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', fontSize: '0.76rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 600, flexShrink: 0, textTransform: 'capitalize' }}>
                        {/community|caste|category/i.test(row.label) ? 'Community' : row.label}:
                      </span>
                      <strong style={{ color: '#0f172a', textAlign: 'right', wordBreak: 'break-word', fontFamily: /roll|registration|number|id/i.test(row.label) ? 'monospace' : 'inherit' }}>
                        {row.value}
                      </strong>
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Name:</span>
                      <strong style={{ color: '#0f172a' }}>{candidateName}</strong>
                    </div>
                    {rollNumber && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Roll No:</span>
                        <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{rollNumber}</strong>
                      </div>
                    )}
                    {resultData.testDate && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Date:</span>
                        <strong style={{ color: '#0f172a' }}>{resultData.testDate}</strong>
                      </div>
                    )}
                    {resultData.testTime && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Time:</span>
                        <strong style={{ color: '#0f172a' }}>{resultData.testTime}</strong>
                      </div>
                    )}
                  </>
                )}

                {formData?.category && !resultData.infoRows?.some(r => /community|caste|category/i.test(r.label)) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Category:</span>
                    <strong style={{ color: '#0f172a' }}>{formData.category}</strong>
                  </div>
                )}
                {formData?.state && !resultData.infoRows?.some(r => /state|zone|location/i.test(r.label)) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>State:</span>
                    <strong style={{ color: '#0f172a' }}>{formData.state}</strong>
                  </div>
                )}
              </div>

              {/* Integrated View Your Rank Button directly below User Info */}
              {APP_FEATURE_FLAGS.SHOW_VIEW_RANK && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <Link
                    href="/rank"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      padding: '11px 16px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    View Your Rank
                  </Link>
                </div>
              )}

            </div>

            {/* Sidebar Card 2: Back to Scorecard CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                href="/result"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1.5px solid #cbd5e1',
                  padding: '11px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'center'
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Scorecard
              </Link>
            </div>

          </div>

        </div>

      </div>

      {/* Mobile Floating Question Palette Button (Only on screens <= 900px) */}
      {allQuestions.length > 0 && (
        <button
          type="button"
          className="mobile-palette-float-btn no-print"
          onClick={() => setShowMobilePalette(true)}
          style={{
            position: 'fixed',
            bottom: '22px',
            right: '20px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '11px 18px',
            borderRadius: '999px',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          <span>🎯 Question Palette</span>
          <span style={{
            background: '#ffffff',
            color: '#1d4ed8',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.72rem',
            fontWeight: 900
          }}>
            {allQuestions.length}
          </span>
        </button>
      )}

      {/* Mobile Question Palette Bottom Drawer / Modal */}
      {showMobilePalette && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setShowMobilePalette(false)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '560px',
              borderTopLeftRadius: '22px',
              borderTopRightRadius: '22px',
              padding: '20px 18px',
              maxHeight: '82vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 30px rgba(0,0,0,0.25)',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🎯</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: '#0f172a' }}>
                    Question Palette
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Tap any question to jump directly
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#475569',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '0.95rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Legend */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              marginBottom: '12px',
              padding: '8px 10px',
              background: '#f8fafc',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 800,
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ color: '#166534' }}>🟢 {totalRight}</div>
              <div style={{ color: '#991b1b' }}>🔴 {totalWrong}</div>
              <div style={{ color: '#475569' }}>⚪ {totalUnattempted}</div>
              <div style={{ color: '#6b21a8' }}>🟣 {pillBonusCount}</div>
            </div>

            {/* Grid */}
            <div className="palette-grid-scroll" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
              gap: '8px',
              overflowY: 'auto',
              flex: 1,
              padding: '4px'
            }}>
              {allQuestions.map(q => {
                const isCorrect = q.status === 'Correct';
                const isWrong = q.status === 'Wrong';
                const isBonus = q.status === 'Discarded' || q.status === 'Bonus' || q.right_option === 'Benefit to All';
                const isActiveCbtQ = viewMode === 'CBT' && q.q_no === activeQNo;
                let bg = '#f1f5f9';
                let border = '1px solid #cbd5e1';
                let color = '#475569';
                if (isCorrect) {
                  bg = '#16a34a';
                  border = '1px solid #15803d';
                  color = '#ffffff';
                } else if (isWrong) {
                  bg = '#dc2626';
                  border = '1px solid #b91c1c';
                  color = '#ffffff';
                } else if (isBonus) {
                  bg = '#9333ea';
                  border = '1px solid #7e22ce';
                  color = '#ffffff';
                }

                return (
                  <button
                    key={q.q_no}
                    type="button"
                    onClick={() => jumpToQuestion(q.q_no)}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      fontSize: '0.84rem',
                      fontWeight: isActiveCbtQ ? 900 : 700,
                      cursor: 'pointer',
                      border: isActiveCbtQ ? '2px solid #004080' : border,
                      background: bg,
                      color: color,
                      padding: 0,
                      transition: 'all 0.15s ease',
                      transform: isActiveCbtQ ? 'scale(1.12)' : 'none',
                      boxShadow: isActiveCbtQ ? '0 0 0 3px #fbbf24, 0 4px 10px rgba(0, 64, 128, 0.4)' : 'none',
                      zIndex: isActiveCbtQ ? 2 : 1,
                      position: 'relative'
                    }}
                  >
                    {q.q_no}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
