'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_FEATURE_FLAGS } from '../config/features';
import { fetchLiveRankAction } from '../actions/calculate';
import { cbtGet, cbtGetString, cbtSave, STORAGE_KEYS } from '../utils/storage';

interface Section {
  name: string;
  total: number;
  correct: number;
  wrong: number;
  bonus?: number;
  unattempted: number;
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
  correctCount: number;
  wrongCount: number;
  bonusCount?: number;
  rawBonusQuestions?: string | number;
  unattemptedCount: number;
  overallRank: number;
  shiftRank: number;
  categoryRank: number;
  genderRank?: number;
  subTypeRank?: number;
  totalSubType?: number;
  subType?: string;
  sub_type?: string;
  custom_data?: Record<string, any>;
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
  sub_type?: string;
  custom_data?: Record<string, any>;
}

export default function RankPage() {
  const router = useRouter();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [rightVal, setRightVal] = useState(1.0);
  const [wrongVal, setWrongVal] = useState(0.25);
  const [liveRank, setLiveRank] = useState<{
    overallRank: number;
    totalOverall: number;
    shiftRank: number;
    totalShift: number;
    categoryRank: number;
    totalCategory: number;
    genderRank?: number;
    totalGender?: number;
    subTypeRank?: number;
    totalSubType?: number;
    subType?: string;
    percentile: number;
  } | null>(null);
  const [loadingRank, setLoadingRank] = useState(true);
  const [mobileBreakdownView, setMobileBreakdownView] = useState<'cards' | 'table'>('cards');

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

      let currentRight = 1.0;
      let currentWrong = 0;

      if (savedRight !== null && savedRight !== undefined && savedRight !== '') {
        currentRight = parseFloat(savedRight);
      } else if (form?.marks_right !== undefined && form?.marks_right !== null) {
        currentRight = Number(form.marks_right);
      }
      setRightVal(currentRight);

      if (savedWrong !== null && savedWrong !== undefined && savedWrong !== '') {
        currentWrong = parseFloat(savedWrong);
      } else if (form?.marks_wrong !== undefined && form?.marks_wrong !== null) {
        currentWrong = Number(form.marks_wrong);
      }
      setWrongVal(currentWrong);

      setResultData(result);
      setFormData(form);

      // Compute raw marks for live database query
      let tRight = 0, tWrong = 0, tBonus = 0;
      if (result.sections && result.sections.length > 0) {
        result.sections.forEach(s => {
          tRight += s.correct;
          tWrong += s.wrong;
          tBonus += (s.bonus || 0);
        });
      } else {
        tRight = Number(result.correctCount || 0);
        tWrong = Number(result.wrongCount || 0);
      }
      if (tBonus === 0 && (result.bonusCount || result.rawBonusQuestions)) {
        tBonus = Number(result.bonusCount || result.rawBonusQuestions || 0);
      }
      const rawScore = ((tRight + tBonus) * currentRight) - (tWrong * currentWrong);

      const authCommRow = result.infoRows?.find(r => /community|caste|category/i.test(r.label));
      const effCategory = (result as any).category || authCommRow?.value || form?.category || 'UR';
      const authGenderRow = result.infoRows?.find(r => /gender|sex/i.test(r.label));
      const effGender = (result as any).gender || authGenderRow?.value || form?.gender || '';
      const rNum = result.rollNo || result.infoRows?.find(r => /roll|registration|id/i.test(r.label))?.value || '';
      const ansUrl = form?.ans_key_url || '';

      const officialExamId = result.examId || form?.exam_id || '';

      if ((result as any).liveRank) {
        const cached = (result as any).liveRank;
        setLiveRank(cached);
        if (cached && cached.genderRank !== undefined && cached.totalGender !== undefined) {
          setLoadingRank(false);
        }
      }

      const candidateSubType = (result as any).subType || (result as any).sub_type || form?.sub_type || (result as any)?.custom_data?.sub_type || '';

      fetchLiveRankAction({
        examId: officialExamId,
        examSlug: (result as any).exam_slug || (result as any).slug || form?.exam_slug || '',
        examDate: result.testDate || '',
        examTime: result.testTime || '',
        category: effCategory,
        gender: effGender,
        totalMarks: rawScore,
        userId: rNum,
        url: ansUrl,
        subType: candidateSubType
      }).then(res => {
        if (res && res.success && res.data) {
          setLiveRank(res.data);
          try {
            cbtSave(STORAGE_KEYS.RESULT_DATA, {
              ...result,
              overallRank: res.data.overallRank,
              totalOverall: res.data.totalOverall,
              shiftRank: res.data.shiftRank,
              totalShift: res.data.totalShift,
              categoryRank: res.data.categoryRank,
              totalCategory: res.data.totalCategory,
              genderRank: res.data.genderRank,
              totalGender: res.data.totalGender,
              subTypeRank: res.data.subTypeRank,
              totalSubType: res.data.totalSubType,
              subType: res.data.subType || candidateSubType,
              liveRank: res.data
            });
          } catch (e) {}
        }
        setLoadingRank(false);
      }).catch(() => {
        setLoadingRank(false);
      });

    } catch (e) {
      router.push('/');
    }
  }, [router]);

  if (!resultData) {
    return null;
  }

  const candidateName = resultData.candidateName || resultData.infoRows?.find(r => /name|candidate/i.test(r.label))?.value || 'Verified Candidate';
  const rollNumber = resultData.rollNo || resultData.infoRows?.find(r => /roll|registration|id/i.test(r.label))?.value || '';
  const authenticCommunityRow = resultData.infoRows?.find(r => /community|caste|category/i.test(r.label));
  const effectiveCommunity = authenticCommunityRow ? authenticCommunityRow.value : (formData?.category || 'UR');

  const authGenderRow = resultData.infoRows?.find(r => /gender|sex/i.test(r.label));
  const rawGender = (resultData as any).gender || authGenderRow?.value || formData?.gender || '';
  const effectiveGender = rawGender ? (rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()) : '';

  const effectiveSubType = liveRank?.subType || (resultData as any).subType || (resultData as any).sub_type || formData?.sub_type || (resultData as any)?.custom_data?.sub_type || '';
  const subTypeRank = liveRank?.subTypeRank || resultData.subTypeRank;
  const totalSubType = liveRank?.totalSubType || resultData.totalSubType;

  const overallRank = liveRank?.overallRank || resultData.overallRank || 1;
  const totalOverall = liveRank?.totalOverall || (resultData as any).totalOverall || (overallRank <= 1 ? 1 : overallRank);
  const shiftRank = liveRank?.shiftRank || resultData.shiftRank || 1;
  const totalShift = liveRank?.totalShift || (resultData as any).totalShift || (shiftRank <= 1 ? 1 : shiftRank);
  const categoryRank = liveRank?.categoryRank || resultData.categoryRank || 1;
  const totalCategory = liveRank?.totalCategory || (resultData as any).totalCategory || (categoryRank <= 1 ? 1 : categoryRank);
  const genderRank = (liveRank && liveRank.genderRank) ? liveRank.genderRank : (resultData.genderRank || 1);
  const totalGender = (liveRank && liveRank.totalGender) ? liveRank.totalGender : ((resultData as any).totalGender || (genderRank <= 1 ? 1 : genderRank));

  return (
    <main>
      <style>{`
        /* App-Style Mobile Responsive Optimization for /rank */
        @media (max-width: 768px) {
          .rank-result-main {
            padding: 10px 10px calc(75px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .rank-layout-row {
            gap: 12px !important;
          }
          .rank-main-col {
            flex: 1 1 100% !important;
            min-width: 100% !important;
            gap: 10px !important;
          }
          .rank-mobile-top-bar {
            display: flex !important;
          }
          .rank-main-card {
            padding: 12px 10px !important;
            border-radius: 14px !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04) !important;
          }
          .exam-logo {
            max-height: 60px !important;
          }
          .candidate-top-summary {
            display: block !important;
            padding: 10px 12px !important;
            border-radius: 12px !important;
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            margin-bottom: 12px !important;
          }
          .desktop-pdf-row {
            display: none !important;
          }
          .rank-showcase-box {
            padding: 14px 10px !important;
            border-radius: 14px !important;
            margin-bottom: 12px !important;
          }
          .live-rank-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            margin-bottom: 12px !important;
          }
          .card-trade {
            grid-column: span 2 !important;
          }
          .rank-metric-card {
            padding: 10px 6px !important;
            border-radius: 12px !important;
            min-height: 68px !important;
          }
          .rank-card-value {
            font-size: 1.15rem !important;
          }
          .rank-mobile-actions {
            display: flex !important;
          }
          .mobile-breakdown-toggle {
            display: inline-flex !important;
          }
          .rank-desktop-table-container {
            display: none;
          }
          .rank-desktop-table-container.mobile-force-show {
            display: block !important;
          }
          .review-right-sidebar {
            display: none !important;
          }
        }

        @media (min-width: 769px) {
          .rank-mobile-top-bar {
            display: none !important;
          }
          .rank-mobile-actions {
            display: none !important;
          }
          .mobile-breakdown-toggle {
            display: none !important;
          }
          .rank-mobile-cards-container {
            display: none !important;
          }
          .rank-desktop-table-container {
            display: block !important;
          }
          .review-right-sidebar {
            display: flex !important;
          }
        }
      `}</style>

      <div className="result-main rank-result-main" style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>

        {/* 2-Column Responsive Layout with Right Sidebar */}
        <div className="rank-layout-row" style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'flex-start',
          flexWrap: 'wrap'
        }}>

          {/* LEFT MAIN CONTENT COLUMN (Rank Showcase + Breakdown + Tables) */}
          <div className="rank-main-col" style={{ flex: '1 1 680px', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Mobile App Navigation Header Bar */}
            <div className="rank-mobile-top-bar no-print" style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '8px 12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <Link
                href="/result"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#0044cc',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  padding: '4px 6px',
                  borderRadius: '6px'
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Scorecard
              </Link>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Live Rank & Analytics
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  color: '#334155',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PDF
              </button>
            </div>

            {/* Rank Card Main Container */}
            <div className="rank-main-card" style={{ padding: '18px 16px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
              
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

              {/* Candidate Info Summary Header (App-Style Profile Card on Mobile & Print) */}
              <div className="candidate-top-summary" style={{
                marginBottom: '14px',
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #003366 0%, #004b87 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1rem',
                    flexShrink: 0
                  }}>
                    👤
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {candidateName}
                    </div>
                    {rollNumber && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Roll No: <span style={{ fontFamily: 'monospace', color: '#0044cc', fontWeight: 800 }}>{rollNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px 12px', fontSize: '9pt' }}>
                  {resultData.testDate && <div><strong style={{ color: '#475569' }}>Date:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{resultData.testDate}</span></div>}
                  {resultData.testTime && <div><strong style={{ color: '#475569' }}>Time:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{resultData.testTime}</span></div>}
                  {effectiveCommunity && <div><strong style={{ color: '#475569' }}>Category:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{effectiveCommunity}</span></div>}
                  {effectiveGender && <div><strong style={{ color: '#475569' }}>Gender:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{effectiveGender}</span></div>}
                  {formData?.state && <div><strong style={{ color: '#475569' }}>State:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{formData.state}</span></div>}
                  {effectiveSubType && <div><strong style={{ color: '#475569' }}>Trade / Stream:</strong> <span style={{ color: '#0044cc', fontWeight: 800 }}>{effectiveSubType}</span></div>}
                </div>
              </div>

              {/* Action Bar / Download PDF Button Row (Hidden on Mobile & Print) */}
              <div className="no-print desktop-pdf-row" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                marginBottom: '16px',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '12px'
              }}>
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

              {/* Beautiful Live Rank Summary Showcase Card */}
              <div className="rank-showcase-box" style={{
                background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
                border: '1.5px solid #bfdbfe',
                borderRadius: '16px',
                padding: '22px 20px',
                marginBottom: '20px',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.06)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Accent top line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3.5px',
                  background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)'
                }} />

                {/* Status Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  color: '#15803d',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    display: 'inline-block'
                  }} />
                  Live Rank Generated
                </div>

                <p style={{
                  fontSize: '0.84rem',
                  color: '#475569',
                  maxWidth: '560px',
                  margin: '0 auto 16px',
                  lineHeight: 1.55,
                  fontWeight: 500
                }}>
                  Live rank breakdown calculated among participating candidates for this exam.
                </p>

                {/* Live Rank Cards */}
                <div className="live-rank-grid">
                  <div className="rank-metric-card card-overall">
                    <span className="rank-card-label">🥇 Overall Rank</span>
                    <div className="rank-card-value rank-val-overall">
                      {loadingRank && !liveRank ? '...' : `#${liveRank ? liveRank.overallRank : overallRank}`}
                      <span className="rank-card-total">
                        {' / '}{liveRank ? liveRank.totalOverall : totalOverall}
                      </span>
                    </div>
                  </div>

                  <div className="rank-metric-card card-shift">
                    <span className="rank-card-label">⏱️ Shift Rank</span>
                    <div className="rank-card-value rank-val-shift">
                      {loadingRank && !liveRank ? '...' : `#${liveRank ? liveRank.shiftRank : shiftRank}`}
                      <span className="rank-card-total">
                        {' / '}{liveRank ? liveRank.totalShift : totalShift}
                      </span>
                    </div>
                  </div>

                  <div className="rank-metric-card card-category">
                    <span className="rank-card-label">👥 Category Rank</span>
                    <div className="rank-card-value rank-val-category">
                      {loadingRank && !liveRank ? '...' : `#${liveRank ? liveRank.categoryRank : categoryRank}`}
                      <span className="rank-card-total">
                        {' / '}{liveRank ? liveRank.totalCategory : totalCategory}
                      </span>
                    </div>
                    {effectiveCommunity && (
                      <span className="rank-subtag rank-subtag-category">
                        {effectiveCommunity}
                      </span>
                    )}
                  </div>

                  <div className="rank-metric-card card-gender">
                    <span className="rank-card-label">🚻 Gender Rank</span>
                    <div className="rank-card-value rank-val-gender">
                      {loadingRank && (!liveRank || !liveRank.genderRank) ? '...' : `#${liveRank && liveRank.genderRank ? liveRank.genderRank : genderRank}`}
                      <span className="rank-card-total">
                        {' / '}{liveRank && liveRank.totalGender ? liveRank.totalGender : totalGender}
                      </span>
                    </div>
                    {effectiveGender && (
                      <span className="rank-subtag rank-subtag-gender">
                        {effectiveGender}
                      </span>
                    )}
                  </div>

                  {Boolean(subTypeRank && totalSubType) && (
                    <div className="rank-metric-card card-trade" style={{ background: '#faf5ff', border: '1px solid #d8b4fe' }}>
                      <span className="rank-card-label" style={{ color: '#7e22ce' }}>🔧 Trade / Paper Rank</span>
                      <div className="rank-card-value rank-val-trade" style={{ color: '#6b21a8' }}>
                        {loadingRank && !liveRank ? '...' : `#${subTypeRank}`}
                        <span className="rank-card-total">
                          {' / '}{totalSubType}
                        </span>
                      </div>
                      {effectiveSubType && (
                        <span className="rank-subtag rank-subtag-trade" style={{ background: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>
                          {effectiveSubType}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'linear-gradient(135deg, #0044cc 0%, #003399 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 68, 204, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Live Rank Status
                  </button>
                </div>
              </div>

              {/* Mobile Quick Action Buttons (App Style) */}
              <div className="rank-mobile-actions no-print" style={{
                display: 'none',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '14px'
              }}>
                {APP_FEATURE_FLAGS.SHOW_REVIEW_ANSWERKEY && (
                  <Link
                    href="/review-answerkey"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)',
                      textAlign: 'center'
                    }}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Review Answerkey
                  </Link>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Link
                    href="/result"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      color: '#1e293b',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      textDecoration: 'none',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Scorecard
                  </Link>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      color: '#334155',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                </div>
              </div>

              {/* Subject-Wise Performance Breakdown */}
              {resultData.sections && resultData.sections.length > 0 && (() => {
                const bonusCountFromData = Number(resultData.bonusCount || resultData.rawBonusQuestions || 0);
                const sectionsHaveBonus = Boolean(resultData.sections.some(s => s.bonus && s.bonus > 0));
                const hasBonus = Boolean(sectionsHaveBonus || (bonusCountFromData > 0));
                const fallbackBonus = (!sectionsHaveBonus && resultData.sections.length === 1) ? bonusCountFromData : 0;

                let totBonus = 0;
                resultData.sections.forEach(s => {
                  totBonus += (s.bonus || 0);
                });
                if (totBonus === 0 && hasBonus) {
                  totBonus = bonusCountFromData;
                }

                const totQuestions = resultData.sections.reduce((acc, s) => acc + (s.total || 0), 0);
                const totUnattempted = resultData.sections.reduce((acc, s) => acc + (s.unattempted || 0), 0);
                const totAttempted = totQuestions - totUnattempted;
                const totCorrect = resultData.sections.reduce((acc, s) => acc + (s.correct || 0), 0);
                const totWrong = resultData.sections.reduce((acc, s) => acc + (s.wrong || 0), 0);
                const totScore = ((totCorrect + totBonus) * rightVal) - (totWrong * wrongVal);

                return (
                  <div style={{ borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{
                      background: '#f8fafc',
                      padding: '10px 14px',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}>
                      <h3 style={{ fontSize: '0.84rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                        📑 Section Breakdown
                      </h3>

                      {/* Mobile View Switcher (Cards / Table) */}
                      <div className="mobile-breakdown-toggle" style={{
                        display: 'none',
                        alignItems: 'center',
                        background: '#e2e8f0',
                        padding: '2px',
                        borderRadius: '8px',
                        gap: '2px'
                      }}>
                        <button
                          type="button"
                          onClick={() => setMobileBreakdownView('cards')}
                          style={{
                            border: 'none',
                            background: mobileBreakdownView === 'cards' ? '#ffffff' : 'transparent',
                            color: mobileBreakdownView === 'cards' ? '#0f172a' : '#64748b',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: mobileBreakdownView === 'cards' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          📱 Cards
                        </button>
                        <button
                          type="button"
                          onClick={() => setMobileBreakdownView('table')}
                          style={{
                            border: 'none',
                            background: mobileBreakdownView === 'table' ? '#ffffff' : 'transparent',
                            color: mobileBreakdownView === 'table' ? '#0f172a' : '#64748b',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: mobileBreakdownView === 'table' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          📋 Table
                        </button>
                      </div>
                    </div>

                    {/* Mobile App-Style Section Performance Cards */}
                    <div className="rank-mobile-cards-container" style={{
                      display: mobileBreakdownView === 'cards' ? 'flex' : 'none',
                      flexDirection: 'column',
                      gap: '10px',
                      padding: '12px 10px',
                      background: '#f8fafc'
                    }}>
                      {resultData.sections.map((sec, idx) => {
                        const secBonus = (sec.bonus !== undefined && sec.bonus !== null) ? sec.bonus : fallbackBonus;
                        const secAttempted = sec.total - sec.unattempted;
                        const secScore = ((sec.correct + (secBonus || 0)) * rightVal) - (sec.wrong * wrongVal);

                        return (
                          <div
                            key={idx}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '12px',
                              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a', lineHeight: 1.3 }}>
                                {sec.name}
                              </div>
                              <div style={{
                                background: secScore < 0 ? '#fef2f2' : '#f0fdf4',
                                border: `1px solid ${secScore < 0 ? '#fecaca' : '#bbf7d0'}`,
                                color: secScore < 0 ? '#b91c1c' : '#15803d',
                                fontWeight: 900,
                                fontSize: '0.82rem',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                {secScore >= 0 ? `+${secScore.toFixed(2)}` : secScore.toFixed(2)}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: hasBonus && (secBonus > 0) ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 4px' }}>
                                <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{sec.total}</div>
                              </div>
                              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '6px 4px' }}>
                                <div style={{ fontSize: '0.64rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>Correct</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>{sec.correct}</div>
                              </div>
                              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 4px' }}>
                                <div style={{ fontSize: '0.64rem', color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase' }}>Wrong</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#b91c1c', marginTop: '2px' }}>{sec.wrong}</div>
                              </div>
                              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '6px 4px' }}>
                                <div style={{ fontSize: '0.64rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>Skip</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>{sec.unattempted}</div>
                              </div>
                              {hasBonus && (secBonus > 0) && (
                                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '6px 4px' }}>
                                  <div style={{ fontSize: '0.64rem', color: '#7e22ce', fontWeight: 700, textTransform: 'uppercase' }}>Bonus</div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7e22ce', marginTop: '2px' }}>{secBonus}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Total Performance Summary Card on Mobile */}
                      <div style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 900, fontSize: '0.86rem', color: '#0f172a' }}>
                              Total Performance
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              Attempted: <strong>{totAttempted}</strong> / {totQuestions}
                            </div>
                          </div>
                          <div style={{
                            background: totScore < 0 ? '#fee2e2' : '#dcfce7',
                            border: `1.5px solid ${totScore < 0 ? '#fca5a5' : '#86efac'}`,
                            color: totScore < 0 ? '#991b1b' : '#166534',
                            fontWeight: 900,
                            fontSize: '0.92rem',
                            padding: '4px 10px',
                            borderRadius: '10px'
                          }}>
                            {totScore.toFixed(2)}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: hasBonus && (totBonus > 0) ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 4px' }}>
                            <div style={{ fontSize: '0.64rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Total</div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{totQuestions}</div>
                          </div>
                          <div style={{ background: '#ffffff', border: '1px solid #86efac', borderRadius: '8px', padding: '6px 4px' }}>
                            <div style={{ fontSize: '0.64rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Correct</div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#166534', marginTop: '2px' }}>{totCorrect}</div>
                          </div>
                          <div style={{ background: '#ffffff', border: '1px solid #fca5a5', borderRadius: '8px', padding: '6px 4px' }}>
                            <div style={{ fontSize: '0.64rem', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>Wrong</div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#991b1b', marginTop: '2px' }}>{totWrong}</div>
                          </div>
                          <div style={{ background: '#ffffff', border: '1px solid #fde68a', borderRadius: '8px', padding: '6px 4px' }}>
                            <div style={{ fontSize: '0.64rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>Skip</div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#b45309', marginTop: '2px' }}>{totUnattempted}</div>
                          </div>
                          {hasBonus && (totBonus > 0) && (
                            <div style={{ background: '#ffffff', border: '1px solid #d8b4fe', borderRadius: '8px', padding: '6px 4px' }}>
                              <div style={{ fontSize: '0.64rem', color: '#6b21a8', fontWeight: 700, textTransform: 'uppercase' }}>Bonus</div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#6b21a8', marginTop: '2px' }}>{totBonus}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop Table View (also toggleable on mobile) */}
                    <div className={`rank-desktop-table-container${mobileBreakdownView === 'table' ? ' mobile-force-show' : ''}`} style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#475569', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Section / Subject</th>
                            <th style={{ padding: '10px 8px' }}>Total</th>
                            <th className="rank-desktop-col" style={{ padding: '10px 8px' }}>Attempted</th>
                            <th className="rank-desktop-col" style={{ padding: '10px 8px', color: '#d97706' }}>Unattempted</th>
                            <th style={{ padding: '10px 8px', color: '#059669' }}>Correct</th>
                            <th style={{ padding: '10px 8px', color: '#ef4444' }}>Wrong</th>
                            {hasBonus && (
                              <th style={{ padding: '10px 8px', color: '#9333ea', fontWeight: 800 }}>Bonus</th>
                            )}
                            <th className="rank-mobile-col" style={{ padding: '10px 8px', color: '#d97706' }}>Skip</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultData.sections.map((sec, idx) => {
                            const secBonus = (sec.bonus !== undefined && sec.bonus !== null) ? sec.bonus : fallbackBonus;
                            const secAttempted = sec.total - sec.unattempted;
                            const secScore = ((sec.correct + (secBonus || 0)) * rightVal) - (sec.wrong * wrongVal);
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                                <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#0f172a' }}>{sec.name}</td>
                                <td style={{ padding: '10px 8px', fontWeight: 700 }}>{sec.total}</td>
                                <td className="rank-desktop-col" style={{ padding: '10px 8px', fontWeight: 700 }}>{secAttempted}</td>
                                <td className="rank-desktop-col" style={{ padding: '10px 8px', fontWeight: 700, color: '#d97706' }}>{sec.unattempted}</td>
                                <td style={{ padding: '10px 8px', fontWeight: 800, color: '#059669' }}>{sec.correct}</td>
                                <td style={{ padding: '10px 8px', fontWeight: 800, color: '#ef4444' }}>{sec.wrong}</td>
                                {hasBonus && (
                                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#9333ea' }}>{secBonus || 0}</td>
                                )}
                                <td className="rank-mobile-col" style={{ padding: '10px 8px', fontWeight: 700, color: '#d97706' }}>{sec.unattempted}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: secScore < 0 ? '#ef4444' : '#0f172a' }}>{secScore.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 900, color: '#0f172a', fontSize: '0.82rem' }}>
                            <td style={{ padding: '12px 12px', textAlign: 'left', fontWeight: 900, color: '#0f172a' }}>Total</td>
                            <td style={{ padding: '12px 8px', fontWeight: 900 }}>{totQuestions}</td>
                            <td className="rank-desktop-col" style={{ padding: '12px 8px', fontWeight: 900 }}>{totAttempted}</td>
                            <td className="rank-desktop-col" style={{ padding: '12px 8px', fontWeight: 900, color: '#d97706' }}>{totUnattempted}</td>
                            <td style={{ padding: '12px 8px', fontWeight: 900, color: '#059669' }}>{totCorrect}</td>
                            <td style={{ padding: '12px 8px', fontWeight: 900, color: '#ef4444' }}>{totWrong}</td>
                            {hasBonus && (
                              <td style={{ padding: '12px 8px', fontWeight: 900, color: '#9333ea' }}>{totBonus}</td>
                            )}
                            <td className="rank-mobile-col" style={{ padding: '12px 8px', fontWeight: 900, color: '#d97706' }}>{totUnattempted}</td>
                            <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 900, color: totScore < 0 ? '#ef4444' : '#0f172a', fontSize: '0.88rem' }}>
                              {totScore.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>

          {/* RIGHT SIDEBAR COLUMN (Candidate Info + Integrated Review Answerkey Button + Back to Scorecard) */}
          <div className="review-right-sidebar no-print" style={{
            flex: '0 0 310px',
            minWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'sticky',
            top: '20px'
          }}>

            {/* Sidebar Card 1: 👤 User Information Profile with Integrated Review Answerkey Button */}
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
                {effectiveGender && !resultData.infoRows?.some(r => /gender|sex/i.test(r.label)) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Gender:</span>
                    <strong style={{ color: '#0f172a' }}>{effectiveGender}</strong>
                  </div>
                )}
              </div>

              {/* Integrated Review Answerkey Button directly below User Info */}
              {APP_FEATURE_FLAGS.SHOW_REVIEW_ANSWERKEY && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <Link
                    href="/review-answerkey"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      padding: '11px 16px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Review Answerkey
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
    </main>
  );
}
