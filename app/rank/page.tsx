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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

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

  const bonusCountFromData = Number(resultData.bonusCount || resultData.rawBonusQuestions || 0);
  const sectionsHaveBonus = Boolean(resultData.sections?.some(s => s.bonus && s.bonus > 0));
  const hasBonus = Boolean(sectionsHaveBonus || (bonusCountFromData > 0));
  const fallbackBonus = (!sectionsHaveBonus && resultData.sections?.length === 1) ? bonusCountFromData : 0;

  let totBonus = 0;
  resultData.sections?.forEach(s => {
    totBonus += (s.bonus || 0);
  });
  if (totBonus === 0 && hasBonus) {
    totBonus = bonusCountFromData;
  }

  const totQuestions = resultData.sections?.reduce((acc, s) => acc + (s.total || 0), 0) || 0;
  const totUnattempted = resultData.sections?.reduce((acc, s) => acc + (s.unattempted || 0), 0) || 0;
  const totAttempted = totQuestions - totUnattempted;
  const totCorrect = resultData.sections?.reduce((acc, s) => acc + (s.correct || 0), 0) || 0;
  const totWrong = resultData.sections?.reduce((acc, s) => acc + (s.wrong || 0), 0) || 0;
  const totScore = ((totCorrect + totBonus) * rightVal) - (totWrong * wrongVal);

  const currentOverall = liveRank ? liveRank.overallRank : overallRank;
  const currentTotal = liveRank ? liveRank.totalOverall : totalOverall;
  const calculatedPercentile = liveRank?.percentile !== undefined && liveRank.percentile !== null
    ? Number(liveRank.percentile).toFixed(2)
    : (currentTotal > 1 ? (((currentTotal - currentOverall) / currentTotal) * 100).toFixed(2) : '100.00');

  const candidateInitial = candidateName ? candidateName.trim().charAt(0).toUpperCase() : 'C';

  const totalAttemptedQuestions = totCorrect + totWrong;
  const overallAccuracy = totalAttemptedQuestions > 0 ? ((totCorrect / totalAttemptedQuestions) * 100).toFixed(1) : '0.0';
  const percentileNum = Math.min(100, Math.max(0, parseFloat(calculatedPercentile) || 0));

  // Multi-segment percentage distribution
  const pctCorrect = totQuestions > 0 ? Math.round((totCorrect / totQuestions) * 100) : 0;
  const pctWrong = totQuestions > 0 ? Math.round((totWrong / totQuestions) * 100) : 0;
  const pctUnattempted = Math.max(0, 100 - pctCorrect - pctWrong);

  const metaChips = [
    resultData.testDate ? { label: 'Date', val: `${resultData.testDate}${resultData.testTime ? ` (${resultData.testTime})` : ''}`, icon: '📅' } : null,
    effectiveCommunity ? { label: 'Category', val: effectiveCommunity, icon: '🏷️' } : null,
    effectiveGender ? { label: 'Gender', val: effectiveGender, icon: '🚻' } : null,
    formData?.state ? { label: 'State', val: formData.state, icon: '📍' } : null,
    effectiveSubType ? { label: 'Trade', val: effectiveSubType, icon: '🔧' } : null,
    resultData.testCenter ? { label: 'Center', val: resultData.testCenter, icon: '🏫' } : null,
  ].filter(Boolean) as Array<{ label: string; val: string; icon: string }>;

  return (
    <main style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        /* ============================================================
           PREMIUM MOBILE APP-STYLE DESIGN SYSTEM FOR /rank
           ============================================================ */
        .app-rank-page {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 12px 60px;
          box-sizing: border-box;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          overflow-x: hidden;
        }

        .app-rank-grid-layout {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .app-rank-content {
          flex: 1 1 720px;
          min-width: 0;
          max-width: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-sizing: border-box;
        }

        .app-rank-side {
          flex: 0 0 320px;
          min-width: 290px;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: sticky;
          top: 80px;
          box-sizing: border-box;
        }

        /* 1. Mobile Quick Navigation Header */
        .app-top-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          padding: 10px 14px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
          width: 100%;
          box-sizing: border-box;
        }

        .app-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          padding: 4px 8px;
          border-radius: 8px;
          background: #eff6ff;
          transition: background 0.15s ease;
        }

        .app-back-link:hover {
          background: #dbeafe;
        }

        .app-top-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .app-live-pulse-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .app-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
          animation: appPulse 2s infinite;
        }

        @keyframes appPulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.35); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }

        .app-reload-icon-btn {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .app-reload-icon-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* 2. Exam Banner Card */
        .app-exam-banner-card {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 12px 16px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          box-sizing: border-box;
          width: 100%;
        }

        .app-exam-logo {
          max-height: 65px;
          max-width: 100%;
          object-fit: contain;
          margin: 0 auto;
          display: block;
        }

        .app-exam-title-text {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.35;
        }

        /* 3. HERO ALL-INDIA RANK SHOWCASE CARD */
        .app-hero-podium {
          background: linear-gradient(145deg, #091428 0%, #112240 50%, #1e3a8a 100%);
          border-radius: 20px;
          padding: 20px 18px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 25px -4px rgba(30, 58, 138, 0.35);
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .app-hero-podium::before {
          content: "";
          position: absolute;
          top: -30px;
          right: -30px;
          width: 160px;
          height: 160px;
          background: radial-gradient(circle, rgba(96, 165, 250, 0.22) 0%, rgba(255, 255, 255, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        /* Candidate Micro-Chip Inside Hero (Mobile) */
        .app-hero-candidate-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.16);
          padding: 8px 12px;
          border-radius: 12px;
          margin-bottom: 16px;
          backdrop-filter: blur(8px);
        }

        .app-hero-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 900;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .app-hero-cinfo {
          flex: 1;
          min-width: 0;
        }

        .app-hero-cname-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .app-hero-cname {
          font-size: 0.95rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .app-hero-csub {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.72rem;
          color: #bfdbfe;
          margin-top: 2px;
          flex-wrap: wrap;
        }

        .app-hero-csub-item {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        /* Main Rank Podium Display */
        .app-hero-rank-box {
          text-align: center;
          padding: 6px 0 10px;
        }

        .app-hero-rank-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #93c5fd;
          background: rgba(30, 58, 138, 0.45);
          padding: 4px 12px;
          border-radius: 999px;
          border: 1px solid rgba(147, 197, 253, 0.25);
          margin-bottom: 8px;
        }

        .app-hero-rank-number {
          font-size: clamp(2.3rem, 7.5vw, 3.2rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #ffffff;
          text-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          word-break: break-word;
        }

        .app-hero-rank-out-of {
          font-size: clamp(1rem, 3.8vw, 1.25rem);
          font-weight: 600;
          color: #93c5fd;
          margin-left: 6px;
        }

        .app-hero-percentile-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 800;
          color: #ffffff;
          margin-top: 10px;
          backdrop-filter: blur(4px);
        }

        /* Visual Percentile Progress Bar */
        .app-hero-progress-track {
          width: 100%;
          max-width: 320px;
          height: 7px;
          background: rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          margin: 12px auto 0;
          overflow: hidden;
        }

        .app-hero-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #60a5fa 0%, #34d399 100%);
          transition: width 0.6s ease;
        }

        /* 4. Sub-Ranks Modern Grid */
        .app-sub-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 901px) {
          .app-sub-metrics-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .app-sub-tile {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
          box-sizing: border-box;
          min-width: 0;
          position: relative;
          overflow: hidden;
        }

        .app-sub-tile-shift { border-top: 3.5px solid #10b981; }
        .app-sub-tile-cat   { border-top: 3.5px solid #f59e0b; }
        .app-sub-tile-gen   { border-top: 3.5px solid #8b5cf6; }
        .app-sub-tile-trade { border-top: 3.5px solid #3b82f6; }

        .app-sub-tile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          margin-bottom: 6px;
        }

        .app-sub-tile-title {
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #64748b;
        }

        .app-sub-tile-val {
          font-size: clamp(1.2rem, 4.2vw, 1.45rem);
          font-weight: 900;
          line-height: 1.1;
          color: #0f172a;
          word-break: break-word;
        }

        .app-sub-tile-total {
          font-size: 0.72rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .app-sub-tag-pill {
          display: inline-block;
          align-self: flex-start;
          margin-top: 6px;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 1px 7px;
          border-radius: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .app-sub-tile-shift .app-sub-tag-pill { background: #ecfdf5; color: #047857; }
        .app-sub-tile-cat .app-sub-tag-pill   { background: #fffbeb; color: #b45309; }
        .app-sub-tile-gen .app-sub-tag-pill   { background: #faf5ff; color: #6b21a8; }
        .app-sub-tile-trade .app-sub-tag-pill { background: #eff6ff; color: #1d4ed8; }

        /* 5. Score & Accuracy Cockpit Card */
        .app-score-cockpit-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 16px;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          box-sizing: border-box;
        }

        .app-cockpit-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .app-cockpit-title {
          font-size: 0.86rem;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0;
        }

        .app-net-score-pill {
          font-size: 0.95rem;
          font-weight: 900;
          padding: 4px 12px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .app-net-score-pos {
          background: #ecfdf5;
          color: #059669;
          border: 1.5px solid #a7f3d0;
        }

        .app-net-score-neg {
          background: #fef2f2;
          color: #dc2626;
          border: 1.5px solid #fecaca;
        }

        /* Segmented Question Bar */
        .app-seg-bar-track {
          width: 100%;
          height: 10px;
          border-radius: 999px;
          display: flex;
          overflow: hidden;
          background: #f1f5f9;
        }

        .app-seg-correct {
          background: #10b981;
          height: 100%;
          transition: width 0.4s ease;
        }

        .app-seg-wrong {
          background: #ef4444;
          height: 100%;
          transition: width 0.4s ease;
        }

        .app-seg-unatt {
          background: #cbd5e1;
          height: 100%;
          transition: width 0.4s ease;
        }

        /* KPI 4-Pill Grid */
        .app-kpi-quad-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          width: 100%;
          box-sizing: border-box;
        }

        .app-kpi-quad-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 8px 6px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .app-kpi-quad-label {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
        }

        .app-kpi-quad-val {
          font-size: 0.96rem;
          font-weight: 900;
        }

        .app-kpi-val-correct { color: #15803d; }
        .app-kpi-val-wrong   { color: #b91c1c; }
        .app-kpi-val-unatt   { color: #475569; }
        .app-kpi-val-acc     { color: #2563eb; }

        /* 6. Subject-Wise Performance Section */
        .app-subjects-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.03);
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
        }

        .app-subjects-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 8px;
        }

        .app-subjects-title {
          font-size: 0.86rem;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0;
        }

        /* View Mode Segmented Switcher */
        .app-view-switcher {
          display: inline-flex;
          background: #e2e8f0;
          padding: 2px;
          border-radius: 8px;
          gap: 2px;
        }

        .app-view-tab {
          border: none;
          background: transparent;
          font-size: 0.74rem;
          font-weight: 800;
          color: #475569;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .app-view-tab-active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        /* Subject Cards List */
        .app-subject-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px;
          box-sizing: border-box;
          width: 100%;
        }

        .app-subject-brick {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: border-color 0.15s ease;
        }

        .app-subject-brick:hover {
          border-color: #cbd5e1;
        }

        .app-subject-brick-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .app-subject-brick-name {
          font-size: 0.88rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.3;
          margin: 0;
          word-break: break-word;
        }

        .app-subject-brick-score {
          font-size: 0.84rem;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .app-brick-score-pos {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .app-brick-score-neg {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        /* Micro Progress Bar */
        .app-subject-micro-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 700;
        }

        .app-micro-track {
          flex: 1;
          height: 6px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
        }

        .app-micro-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #10b981, #059669);
        }

        /* Chips Row */
        .app-subject-chips-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 5px;
        }

        .app-mini-chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .app-chip-total   { background: #f1f5f9; color: #475569; }
        .app-chip-correct { background: #dcfce7; color: #15803d; }
        .app-chip-wrong   { background: #fee2e2; color: #b91c1c; }
        .app-chip-skip    { background: #fef3c7; color: #b45309; }
        .app-chip-bonus   { background: #f3e8ff; color: #7e22ce; }

        /* Overall Summary Brick (Mobile) */
        .app-total-brick {
          background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* 7. Detailed Table View */
        .app-table-scroll-container {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          display: block;
        }

        .app-pro-table {
          width: 100%;
          min-width: 480px;
          border-collapse: collapse;
          font-size: 0.82rem;
          text-align: center;
        }

        .app-pro-table thead tr {
          background: #f1f5f9;
          color: #475569;
          font-weight: 800;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .app-pro-table th,
        .app-pro-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #f1f5f9;
        }

        /* 8. Action Buttons */
        .app-action-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          box-sizing: border-box;
        }

        .app-btn-main {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: linear-gradient(135deg, #0044cc 0%, #2563eb 100%);
          color: #ffffff;
          padding: 13px 18px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.92rem;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(0, 68, 204, 0.28);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .app-btn-main:hover {
          filter: brightness(1.06);
          box-shadow: 0 6px 18px rgba(0, 68, 204, 0.35);
        }

        .app-btn-duo-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          width: 100%;
          box-sizing: border-box;
        }

        .app-btn-sub {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #ffffff;
          color: #0f172a;
          border: 1.5px solid #cbd5e1;
          padding: 11px 14px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.82rem;
          text-decoration: none;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .app-btn-sub:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        /* 9. Candidate Profile Card (Desktop Sidebar) */
        .app-desktop-profile-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 16px;
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.03);
          width: 100%;
          box-sizing: border-box;
        }

        .app-profile-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .app-chips-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .app-cloud-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.74rem;
          color: #334155;
          line-height: 1.25;
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .app-rank-page {
            padding: 10px 8px calc(70px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .app-rank-grid-layout {
            flex-direction: column !important;
            gap: 12px !important;
          }
          .app-rank-side {
            display: none !important;
          }
          .app-hide-on-mobile {
            display: none !important;
          }
          .app-show-on-mobile {
            display: block !important;
          }
        }

        @media (min-width: 901px) {
          .app-hide-on-desktop {
            display: none !important;
          }
          .app-show-on-desktop {
            display: block !important;
          }
        }

        /* Print Mode */
        @media print {
          .no-print,
          .app-top-nav-bar,
          .app-action-stack,
          .app-view-switcher {
            display: none !important;
          }
          .app-rank-page {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .app-rank-grid-layout {
            display: block !important;
          }
          .app-rank-side {
            display: none !important;
          }
          .app-hero-podium {
            background: #ffffff !important;
            color: #000000 !important;
            border: 1.5px solid #000000 !important;
            box-shadow: none !important;
          }
          .app-hero-rank-number,
          .app-hero-cname {
            color: #000000 !important;
          }
          .app-hero-rank-out-of,
          .app-hero-csub {
            color: #333333 !important;
          }
          .app-table-scroll-container {
            display: block !important;
          }
        }
      `}</style>

      <div className="app-rank-page">
        <div className="app-rank-grid-layout">

          {/* MAIN CONTENT COLUMN */}
          <div className="app-rank-content">

            {/* 1. Mobile Quick Navigation Bar */}
            <div className="app-top-nav-bar no-print">
              <Link href="/result" className="app-back-link">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Scorecard</span>
              </Link>

              <div className="app-top-title-group">
                <div className="app-live-pulse-badge">
                  <span className="app-pulse-dot" />
                  <span>Live Rank</span>
                </div>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="app-reload-icon-btn"
                  title="Refresh Live Rank"
                  aria-label="Refresh Live Rank"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 2. Exam Banner Card */}
            <div className="app-exam-banner-card">
              {resultData.headerImgUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={resultData.headerImgUrl}
                  alt="Exam Header Logo"
                  className="app-exam-logo"
                />
              ) : (
                <h1 className="app-exam-title-text">
                  {resultData.headerBannerText || resultData.examName || 'CBT Exam Rank & Performance'}
                </h1>
              )}
            </div>

            {/* 3. HERO ALL-INDIA RANK SHOWCASE CARD */}
            <div className="app-hero-podium">
              {/* Candidate Info Strip (Mobile View) */}
              <div className="app-hero-candidate-strip app-hide-on-desktop">
                <div className="app-hero-avatar">
                  {candidateInitial}
                </div>
                <div className="app-hero-cinfo">
                  <div className="app-hero-cname-row">
                    <h2 className="app-hero-cname">{candidateName}</h2>
                    <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 800 }}>✓ Verified</span>
                  </div>
                  <div className="app-hero-csub">
                    {rollNumber && (
                      <span className="app-hero-csub-item">
                        <strong>Roll:</strong> {rollNumber}
                      </span>
                    )}
                    {effectiveCommunity && (
                      <span className="app-hero-csub-item">
                        • <strong>Cat:</strong> {effectiveCommunity}
                      </span>
                    )}
                    {resultData.testDate && (
                      <span className="app-hero-csub-item">
                        • {resultData.testDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Rank Center */}
              <div className="app-hero-rank-box">
                <span className="app-hero-rank-label">
                  🏆 All India Rank (AIR)
                </span>
                <div className="app-hero-rank-number">
                  {loadingRank && !liveRank ? '...' : `#${liveRank ? liveRank.overallRank : overallRank}`}
                  <span className="app-hero-rank-out-of">
                    {' / '}{liveRank ? liveRank.totalOverall : totalOverall}
                  </span>
                </div>

                <div>
                  <span className="app-hero-percentile-badge">
                    ⚡ Top {((Number(liveRank ? liveRank.totalOverall : totalOverall) - Number(liveRank ? liveRank.overallRank : overallRank)) / Math.max(1, Number(liveRank ? liveRank.totalOverall : totalOverall)) * 100 <= 0 ? '0.01' : (100 - Number(calculatedPercentile)).toFixed(2))}% • {calculatedPercentile} Percentile
                  </span>
                </div>

                <div className="app-hero-progress-track">
                  <div className="app-hero-progress-fill" style={{ width: `${percentileNum}%` }} />
                </div>
              </div>
            </div>

            {/* 4. SUB-RANKS METRICS GRID */}
            <div className="app-sub-metrics-grid">
              {/* Shift Rank */}
              <div className="app-sub-tile app-sub-tile-shift">
                <div className="app-sub-tile-header">
                  <span className="app-sub-tile-title">⏱️ Shift Rank</span>
                </div>
                <div className="app-sub-tile-val">
                  {loadingRank && !liveRank ? '...' : `#${liveRank ? liveRank.shiftRank : shiftRank}`}
                  <span className="app-sub-tile-total"> / {liveRank ? liveRank.totalShift : totalShift}</span>
                </div>
                <span className="app-sub-tag-pill">
                  {resultData.testTime || 'Current Shift'}
                </span>
              </div>

              {/* Category Rank */}
              <div className="app-sub-tile app-sub-tile-cat">
                <div className="app-sub-tile-header">
                  <span className="app-sub-tile-title">👥 Category Rank</span>
                </div>
                <div className="app-sub-tile-val">
                  {loadingRank && !liveRank ? '...' : `#${liveRank ? liveRank.categoryRank : categoryRank}`}
                  <span className="app-sub-tile-total"> / {liveRank ? liveRank.totalCategory : totalCategory}</span>
                </div>
                <span className="app-sub-tag-pill">
                  {effectiveCommunity}
                </span>
              </div>

              {/* Gender Rank */}
              <div className="app-sub-tile app-sub-tile-gen">
                <div className="app-sub-tile-header">
                  <span className="app-sub-tile-title">🚻 Gender Rank</span>
                </div>
                <div className="app-sub-tile-val">
                  {loadingRank && (!liveRank || !liveRank.genderRank) ? '...' : `#${liveRank && liveRank.genderRank ? liveRank.genderRank : genderRank}`}
                  <span className="app-sub-tile-total"> / {liveRank && liveRank.totalGender ? liveRank.totalGender : totalGender}</span>
                </div>
                <span className="app-sub-tag-pill">
                  {effectiveGender || 'All Candidates'}
                </span>
              </div>

              {/* Trade / Stream Rank (if applicable) */}
              {Boolean(subTypeRank && totalSubType) && (
                <div className="app-sub-tile app-sub-tile-trade">
                  <div className="app-sub-tile-header">
                    <span className="app-sub-tile-title">🔧 Trade Rank</span>
                  </div>
                  <div className="app-sub-tile-val">
                    {loadingRank && !liveRank ? '...' : `#${subTypeRank}`}
                    <span className="app-sub-tile-total"> / {totalSubType}</span>
                  </div>
                  <span className="app-sub-tag-pill">
                    {effectiveSubType}
                  </span>
                </div>
              )}
            </div>

            {/* 5. SCORE & ACCURACY COCKPIT CARD */}
            <div className="app-score-cockpit-card">
              <div className="app-cockpit-top">
                <h3 className="app-cockpit-title">
                  📊 Performance Summary
                </h3>
                <div className={`app-net-score-pill ${totScore < 0 ? 'app-net-score-neg' : 'app-net-score-pos'}`}>
                  <span>Marks:</span>
                  <strong>{totScore >= 0 ? `+${totScore.toFixed(2)}` : totScore.toFixed(2)}</strong>
                </div>
              </div>

              {/* Segmented Distribution Bar */}
              <div className="app-seg-bar-track" title={`Correct: ${pctCorrect}%, Wrong: ${pctWrong}%, Unattempted: ${pctUnattempted}%`}>
                <div className="app-seg-correct" style={{ width: `${pctCorrect}%` }} />
                <div className="app-seg-wrong" style={{ width: `${pctWrong}%` }} />
                <div className="app-seg-unatt" style={{ width: `${pctUnattempted}%` }} />
              </div>

              {/* 4-KPI Grid */}
              <div className="app-kpi-quad-grid">
                <div className="app-kpi-quad-item">
                  <span className="app-kpi-quad-label">Correct</span>
                  <span className="app-kpi-quad-val app-kpi-val-correct">✓ {totCorrect}</span>
                </div>
                <div className="app-kpi-quad-item">
                  <span className="app-kpi-quad-label">Wrong</span>
                  <span className="app-kpi-quad-val app-kpi-val-wrong">✕ {totWrong}</span>
                </div>
                <div className="app-kpi-quad-item">
                  <span className="app-kpi-quad-label">Skipped</span>
                  <span className="app-kpi-quad-val app-kpi-val-unatt">– {totUnattempted}</span>
                </div>
                <div className="app-kpi-quad-item">
                  <span className="app-kpi-quad-label">Accuracy</span>
                  <span className="app-kpi-quad-val app-kpi-val-acc">🎯 {overallAccuracy}%</span>
                </div>
              </div>
            </div>

            {/* 6. MOBILE ACTIONS (Only visible on screens <= 900px) */}
            <div className="app-hide-on-desktop no-print">
              <div className="app-action-stack">
                {APP_FEATURE_FLAGS.SHOW_REVIEW_ANSWERKEY && (
                  <Link href="/review-answerkey" className="app-btn-main">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Review Answerkey</span>
                    <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>→</span>
                  </Link>
                )}

                <div className="app-btn-duo-row">
                  <Link href="/result" className="app-btn-sub">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Scorecard</span>
                  </Link>

                  <button type="button" onClick={() => window.print()} className="app-btn-sub">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 7. SUBJECT-WISE BREAKDOWN SECTION */}
            {resultData.sections && resultData.sections.length > 0 && (
              <div className="app-subjects-card">
                <div className="app-subjects-header">
                  <h3 className="app-subjects-title">
                    📑 Section-Wise Breakdown
                  </h3>

                  {/* View Mode Switcher */}
                  <div className="app-view-switcher no-print">
                    <button
                      type="button"
                      className={`app-view-tab ${viewMode === 'cards' ? 'app-view-tab-active' : ''}`}
                      onClick={() => setViewMode('cards')}
                    >
                      📱 Cards
                    </button>
                    <button
                      type="button"
                      className={`app-view-tab ${viewMode === 'table' ? 'app-view-tab-active' : ''}`}
                      onClick={() => setViewMode('table')}
                    >
                      📋 Table
                    </button>
                  </div>
                </div>

                {/* VIEW A: APP CARDS (Default on mobile) */}
                {viewMode === 'cards' && (
                  <div className="app-subject-cards-stack">
                    {resultData.sections.map((sec, idx) => {
                      const secBonus = (sec.bonus !== undefined && sec.bonus !== null) ? sec.bonus : fallbackBonus;
                      const secAttempted = sec.total - sec.unattempted;
                      const secScore = ((sec.correct + (secBonus || 0)) * rightVal) - (sec.wrong * wrongVal);
                      const secAcc = secAttempted > 0 ? ((sec.correct / secAttempted) * 100).toFixed(1) : '0.0';
                      const secAccNum = Math.min(100, Math.max(0, parseFloat(secAcc) || 0));

                      return (
                        <div key={idx} className="app-subject-brick">
                          <div className="app-subject-brick-top">
                            <h4 className="app-subject-brick-name">{sec.name}</h4>
                            <span className={`app-subject-brick-score ${secScore < 0 ? 'app-brick-score-neg' : 'app-brick-score-pos'}`}>
                              {secScore >= 0 ? `+${secScore.toFixed(2)}` : secScore.toFixed(2)}
                            </span>
                          </div>

                          {/* Micro Progress Bar */}
                          <div className="app-subject-micro-bar">
                            <span>Accuracy: <strong>{secAcc}%</strong></span>
                            <div className="app-micro-track">
                              <div className="app-micro-fill" style={{ width: `${secAccNum}%` }} />
                            </div>
                          </div>

                          {/* Stat Chips */}
                          <div className="app-subject-chips-row">
                            <span className="app-mini-chip app-chip-total">Total: {sec.total}</span>
                            <span className="app-mini-chip app-chip-correct">✓ {sec.correct} Correct</span>
                            <span className="app-mini-chip app-chip-wrong">✕ {sec.wrong} Wrong</span>
                            <span className="app-mini-chip app-chip-skip">– {sec.unattempted} Left</span>
                            {hasBonus && (
                              <span className="app-mini-chip app-chip-bonus">★ {secBonus || 0} Bonus</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Overall Summary Brick */}
                    <div className="app-total-brick">
                      <div className="app-subject-brick-top">
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>🎯 Overall Aggregate Total</strong>
                        <span className={`app-subject-brick-score ${totScore < 0 ? 'app-brick-score-neg' : 'app-brick-score-pos'}`}>
                          Total Marks: {totScore >= 0 ? `+${totScore.toFixed(2)}` : totScore.toFixed(2)}
                        </span>
                      </div>
                      <div className="app-subject-chips-row">
                        <span className="app-mini-chip app-chip-total">Questions: {totQuestions}</span>
                        <span className="app-mini-chip app-chip-correct">✓ {totCorrect} Correct</span>
                        <span className="app-mini-chip app-chip-wrong">✕ {totWrong} Wrong</span>
                        <span className="app-mini-chip app-chip-skip">– {totUnattempted} Left</span>
                        {hasBonus && (
                          <span className="app-mini-chip app-chip-bonus">★ {totBonus} Bonus</span>
                        )}
                        <span className="app-mini-chip" style={{ background: '#dbeafe', color: '#1d4ed8' }}>🎯 {overallAccuracy}% Accuracy</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW B: FULL DATA TABLE (Shown when Table tab is clicked, or always on print) */}
                {(viewMode === 'table' || typeof window === 'undefined') && (
                  <div className="app-table-scroll-container">
                    <table className="app-pro-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', minWidth: '110px' }}>Section / Subject</th>
                          <th>Total</th>
                          <th>Attempted</th>
                          <th>Correct</th>
                          <th>Wrong</th>
                          {hasBonus && <th>Bonus</th>}
                          <th>Skipped</th>
                          <th style={{ textAlign: 'right' }}>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultData.sections.map((sec, idx) => {
                          const secBonus = (sec.bonus !== undefined && sec.bonus !== null) ? sec.bonus : fallbackBonus;
                          const secAttempted = sec.total - sec.unattempted;
                          const secScore = ((sec.correct + (secBonus || 0)) * rightVal) - (sec.wrong * wrongVal);

                          return (
                            <tr key={idx}>
                              <td style={{ textAlign: 'left', fontWeight: 800, color: '#0f172a' }}>
                                {sec.name}
                              </td>
                              <td style={{ fontWeight: 700 }}>{sec.total}</td>
                              <td style={{ fontWeight: 700 }}>{secAttempted}</td>
                              <td>
                                <span className="app-mini-chip app-chip-correct">+{sec.correct}</span>
                              </td>
                              <td>
                                <span className="app-mini-chip app-chip-wrong">-{sec.wrong}</span>
                              </td>
                              {hasBonus && (
                                <td>
                                  <span className="app-mini-chip app-chip-bonus">{secBonus || 0}</span>
                                </td>
                              )}
                              <td>
                                <span className="app-mini-chip app-chip-skip">{sec.unattempted}</span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 900, color: secScore < 0 ? '#dc2626' : '#0f172a' }}>
                                {secScore.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 900, color: '#0f172a', fontSize: '0.84rem' }}>
                          <td style={{ textAlign: 'left', fontWeight: 900, color: '#0f172a' }}>Total</td>
                          <td style={{ fontWeight: 900 }}>{totQuestions}</td>
                          <td style={{ fontWeight: 900 }}>{totAttempted}</td>
                          <td style={{ fontWeight: 900, color: '#15803d' }}>{totCorrect}</td>
                          <td style={{ fontWeight: 900, color: '#dc2626' }}>{totWrong}</td>
                          {hasBonus && (
                            <td style={{ fontWeight: 900, color: '#7e22ce' }}>{totBonus}</td>
                          )}
                          <td style={{ fontWeight: 900, color: '#b45309' }}>{totUnattempted}</td>
                          <td style={{ textAlign: 'right', fontWeight: 900, color: totScore < 0 ? '#dc2626' : '#0044cc' }}>
                            {totScore.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* DESKTOP SIDEBAR COLUMN (Only visible on screens > 900px) */}
          <div className="app-rank-side no-print">

            {/* Candidate Profile Card */}
            <div className="app-desktop-profile-card">
              <div className="app-profile-head">
                <div className="app-hero-avatar">
                  {candidateInitial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>{candidateName}</h2>
                    <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '999px' }}>✓</span>
                  </div>
                  {rollNumber && (
                    <span style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 700, fontFamily: 'monospace' }}>Roll: {rollNumber}</span>
                  )}
                </div>
              </div>

              <div className="app-chips-cloud">
                {metaChips.map((chip, idx) => (
                  <div key={idx} className="app-cloud-chip">
                    <span>{chip.icon}</span>
                    <span>{chip.label}:</span>
                    <strong>{chip.val}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="app-action-stack">
              {APP_FEATURE_FLAGS.SHOW_REVIEW_ANSWERKEY && (
                <Link href="/review-answerkey" className="app-btn-main">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Review Answerkey</span>
                </Link>
              )}

              <Link href="/result" className="app-btn-sub">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Scorecard</span>
              </Link>

              <button type="button" onClick={() => window.print()} className="app-btn-sub">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download PDF</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}
