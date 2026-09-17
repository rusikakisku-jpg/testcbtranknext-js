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
        /* Modern App-Style UI Design System for /rank */
        .rank-page-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 16px 14px 44px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          color: #0f172a;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .rank-layout {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .rank-main-area {
          flex: 1 1 700px;
          min-width: 0;
          max-width: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-sizing: border-box;
        }

        .rank-sidebar-area {
          flex: 0 0 320px;
          min-width: 290px;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 16px;
          box-sizing: border-box;
        }

        /* Exam Header Card */
        .rank-exam-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 14px 16px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        }

        .rank-exam-img {
          max-height: 80px;
          max-width: 100%;
          object-fit: contain;
          margin: 0 auto;
          display: block;
        }

        .rank-exam-title {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.35;
        }

        /* Candidate App-Style Profile Card */
        .rank-profile-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 16px;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
        }

        .rank-profile-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .rank-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0044cc 0%, #6366f1 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 900;
          flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(0, 68, 204, 0.25);
        }

        .rank-profile-info {
          flex: 1;
          min-width: 0;
        }

        .rank-candidate-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .rank-candidate-name {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.25;
          word-break: break-word;
        }

        .rank-verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 999px;
          text-transform: uppercase;
        }

        .rank-roll-pill {
          display: inline-block;
          margin-top: 4px;
          font-size: 0.76rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-weight: 800;
          color: #2563eb;
          background: #eff6ff;
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid #dbeafe;
        }

        .rank-meta-chips-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .rank-meta-chip {
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

        .rank-meta-chip strong {
          color: #0f172a;
          font-weight: 800;
        }

        /* Hero Live Rank Showcase Banner */
        .rank-hero-banner {
          background: linear-gradient(135deg, #091a36 0%, #102a5c 55%, #0044cc 100%);
          border-radius: 20px;
          padding: 22px 20px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 68, 204, 0.22);
        }

        .rank-hero-banner::after {
          content: "";
          position: absolute;
          top: -40px;
          right: -40px;
          width: 170px;
          height: 170px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .rank-hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          position: relative;
          z-index: 1;
        }

        .rank-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.18);
          border: 1px solid rgba(52, 211, 153, 0.4);
          color: #6ee7b7;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rank-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px #34d399;
          animation: rankPulse 2s infinite;
        }

        @keyframes rankPulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }

        .rank-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }

        .rank-refresh-btn:hover {
          background: rgba(255, 255, 255, 0.22);
        }

        .rank-hero-center {
          text-align: center;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }

        .rank-hero-label {
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #93c5fd;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .rank-hero-value {
          font-size: 2.7rem;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #ffffff;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
        }

        .rank-hero-total {
          font-size: 1.15rem;
          font-weight: 700;
          color: #bfdbfe;
          margin-left: 6px;
        }

        .rank-hero-percentile {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 4px 14px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 800;
          color: #ffffff;
          margin-top: 8px;
          backdrop-filter: blur(4px);
        }

        /* Sub-Ranks Grid */
        .rank-sub-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        @media (min-width: 901px) {
          .rank-sub-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .rank-sub-card {
          background: #ffffff;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
          transition: transform 0.15s ease;
          box-sizing: border-box;
        }

        .rank-sub-card:hover {
          transform: translateY(-2px);
        }

        .rank-sub-card-shift {
          border-color: #bbf7d0;
          background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 60%);
        }

        .rank-sub-card-cat {
          border-color: #fed7aa;
          background: linear-gradient(180deg, #fffbeb 0%, #ffffff 60%);
        }

        .rank-sub-card-gen {
          border-color: #e9d5ff;
          background: linear-gradient(180deg, #faf5ff 0%, #ffffff 60%);
        }

        .rank-sub-card-trade {
          border-color: #c7d2fe;
          background: linear-gradient(180deg, #eef2ff 0%, #ffffff 60%);
        }

        .rank-sub-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .rank-sub-title {
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.03em;
        }

        .rank-sub-num {
          font-size: 1.35rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .rank-sub-card-shift .rank-sub-num { color: #15803d; }
        .rank-sub-card-cat .rank-sub-num { color: #b45309; }
        .rank-sub-card-gen .rank-sub-num { color: #7e22ce; }
        .rank-sub-card-trade .rank-sub-num { color: #4338ca; }

        .rank-sub-out-of {
          font-size: 0.72rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .rank-sub-pill {
          display: inline-block;
          align-self: flex-start;
          margin-top: 6px;
          font-size: 0.66rem;
          font-weight: 800;
          padding: 1px 7px;
          border-radius: 999px;
          text-transform: capitalize;
        }

        .rank-sub-card-cat .rank-sub-pill {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .rank-sub-card-gen .rank-sub-pill {
          background: #f3e8ff;
          color: #7e22ce;
          border: 1px solid #d8b4fe;
        }

        .rank-sub-card-trade .rank-sub-pill {
          background: #e0e7ff;
          color: #4338ca;
          border: 1px solid #c7d2fe;
        }

        /* App Action Group */
        .rank-actions-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .rank-btn-primary {
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

        .rank-btn-primary:hover {
          filter: brightness(1.05);
          box-shadow: 0 6px 18px rgba(0, 68, 204, 0.35);
        }

        .rank-btn-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .rank-btn-secondary {
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
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .rank-btn-secondary:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        /* Performance Breakdown Card */
        .rank-perf-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
          overflow: hidden;
        }

        .rank-perf-header {
          padding: 14px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .rank-perf-title {
          margin: 0;
          font-size: 0.86rem;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rank-score-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 900;
        }

        .rank-score-positive {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .rank-score-negative {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .rank-kpi-strip {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 10px 12px;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.76rem;
          flex-wrap: wrap;
          gap: 6px;
        }

        .rank-kpi-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
        }

        /* Section Table Styling */
        .rank-table-wrap {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          display: block;
          box-sizing: border-box;
        }

        .rank-data-table {
          width: 100%;
          min-width: 480px;
          border-collapse: collapse;
          font-size: 0.82rem;
          text-align: center;
        }

        .rank-data-table thead tr {
          background: #f1f5f9;
          color: #475569;
          font-weight: 800;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .rank-data-table th {
          padding: 9px 8px;
        }

        .rank-data-table td {
          padding: 9px 8px;
          border-bottom: 1px solid #f1f5f9;
        }

        .rank-badge-correct {
          display: inline-block;
          background: #dcfce7;
          color: #15803d;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 0.76rem;
        }

        .rank-badge-wrong {
          display: inline-block;
          background: #fee2e2;
          color: #b91c1c;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 0.76rem;
        }

        .rank-badge-skip {
          display: inline-block;
          background: #fef3c7;
          color: #b45309;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 0.76rem;
        }

        .rank-badge-bonus {
          display: inline-block;
          background: #f3e8ff;
          color: #7e22ce;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 0.76rem;
        }

        /* Mobile vs Desktop Display Rules */
        @media (max-width: 900px) {
          .rank-page-container {
            padding: 10px 8px calc(70px + env(safe-area-inset-bottom, 0px)) !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
            box-sizing: border-box !important;
          }
          .rank-layout {
            flex-direction: column !important;
            gap: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            align-items: stretch !important;
            box-sizing: border-box !important;
          }
          .rank-main-area {
            flex: 1 1 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .rank-sidebar-area {
            display: none !important;
          }
          .rank-mobile-only {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .rank-desktop-only {
            display: none !important;
          }
          .rank-exam-img {
            max-height: 60px !important;
          }
          .rank-hero-banner {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            padding: 18px 14px !important;
          }
          .rank-hero-value {
            font-size: clamp(1.8rem, 6.5vw, 2.3rem) !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
          }
          .rank-hero-total {
            font-size: clamp(0.95rem, 3.5vw, 1.15rem) !important;
          }
          .rank-sub-grid {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .rank-sub-card {
            width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .rank-sub-num {
            font-size: clamp(1.05rem, 4vw, 1.35rem) !important;
            word-break: break-word !important;
          }
          .rank-actions-group {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .rank-perf-card {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .rank-table-wrap {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
        }

        @media (min-width: 901px) {
          .rank-mobile-only {
            display: none !important;
          }
          .rank-desktop-only {
            display: block !important;
          }
        }

        /* Print View Styles */
        @media print {
          .no-print, .rank-actions-group, .rank-refresh-btn {
            display: none !important;
          }
          .rank-page-container {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .rank-layout {
            display: block !important;
          }
          .rank-sidebar-area {
            display: none !important;
          }
          .rank-hero-banner {
            background: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            padding: 12px !important;
          }
          .rank-hero-value {
            color: #000000 !important;
          }
          .rank-hero-total {
            color: #333333 !important;
          }
          .rank-hero-percentile {
            color: #000000 !important;
            border-color: #000000 !important;
          }
        }
      `}</style>

      <div className="rank-page-container">
        <div className="rank-layout">

          {/* MAIN COLUMN */}
          <div className="rank-main-area">

            {/* Exam Header Logo / Title */}
            <div className="rank-exam-card">
              {resultData.headerImgUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={resultData.headerImgUrl}
                  alt="Exam Header Logo"
                  className="rank-exam-img"
                />
              ) : (
                <h1 className="rank-exam-title">
                  {resultData.headerBannerText || resultData.examName || 'CBT Exam Rank & Performance'}
                </h1>
              )}
            </div>

            {/* Mobile Candidate Profile Card (Only visible on screens <= 900px) */}
            <div className="rank-mobile-only">
              <div className="rank-profile-card">
                <div className="rank-profile-header">
                  <div className="rank-avatar">
                    {candidateInitial}
                  </div>
                  <div className="rank-profile-info">
                    <div className="rank-candidate-name-row">
                      <h2 className="rank-candidate-name">{candidateName}</h2>
                      <span className="rank-verified-badge">✓ Verified</span>
                    </div>
                    {rollNumber && (
                      <span className="rank-roll-pill">Roll: {rollNumber}</span>
                    )}
                  </div>
                </div>

                <div className="rank-meta-chips-grid">
                  {metaChips.map((chip, idx) => (
                    <div key={idx} className="rank-meta-chip">
                      <span>{chip.icon}</span>
                      <span>{chip.label}:</span>
                      <strong>{chip.val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Live Rank Showcase Banner */}
            <div className="rank-hero-banner">
              <div className="rank-hero-top">
                <div className="rank-live-pill">
                  <span className="rank-live-dot" />
                  Live Verified Rank
                </div>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rank-refresh-btn no-print"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              <div className="rank-hero-center">
                <span className="rank-hero-label">
                  👑 Overall All-India Rank
                </span>
                <div className="rank-hero-value">
                  {loadingRank && !liveRank ? '...' : `#${liveRank ? liveRank.overallRank : overallRank}`}
                  <span className="rank-hero-total">
                    {' / '}{liveRank ? liveRank.totalOverall : totalOverall}
                  </span>
                </div>

                <div>
                  <span className="rank-hero-percentile">
                    🎯 Top {((Number(liveRank ? liveRank.totalOverall : totalOverall) - Number(liveRank ? liveRank.overallRank : overallRank)) / Math.max(1, Number(liveRank ? liveRank.totalOverall : totalOverall)) * 100 <= 0 ? '0.01' : (100 - Number(calculatedPercentile)).toFixed(2))}% • {calculatedPercentile} Percentile
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Rank Metrics Grid */}
            <div className="rank-sub-grid">
              {/* Shift Rank */}
              <div className="rank-sub-card rank-sub-card-shift">
                <div className="rank-sub-top">
                  <span className="rank-sub-title">⏱️ Shift Rank</span>
                </div>
                <div className="rank-sub-num">
                  {loadingRank && !liveRank ? '...' : `#${liveRank ? liveRank.shiftRank : shiftRank}`}
                  <span className="rank-sub-out-of"> / {liveRank ? liveRank.totalShift : totalShift}</span>
                </div>
              </div>

              {/* Category Rank */}
              <div className="rank-sub-card rank-sub-card-cat">
                <div className="rank-sub-top">
                  <span className="rank-sub-title">👥 Category Rank</span>
                </div>
                <div className="rank-sub-num">
                  {loadingRank && !liveRank ? '...' : `#${liveRank ? liveRank.categoryRank : categoryRank}`}
                  <span className="rank-sub-out-of"> / {liveRank ? liveRank.totalCategory : totalCategory}</span>
                </div>
                {effectiveCommunity && (
                  <span className="rank-sub-pill">{effectiveCommunity}</span>
                )}
              </div>

              {/* Gender Rank */}
              <div className="rank-sub-card rank-sub-card-gen">
                <div className="rank-sub-top">
                  <span className="rank-sub-title">🚻 Gender Rank</span>
                </div>
                <div className="rank-sub-num">
                  {loadingRank && (!liveRank || !liveRank.genderRank) ? '...' : `#${liveRank && liveRank.genderRank ? liveRank.genderRank : genderRank}`}
                  <span className="rank-sub-out-of"> / {liveRank && liveRank.totalGender ? liveRank.totalGender : totalGender}</span>
                </div>
                {effectiveGender && (
                  <span className="rank-sub-pill">{effectiveGender}</span>
                )}
              </div>

              {/* Trade / Stream Rank (if applicable) */}
              {Boolean(subTypeRank && totalSubType) && (
                <div className="rank-sub-card rank-sub-card-trade">
                  <div className="rank-sub-top">
                    <span className="rank-sub-title">🔧 Trade Rank</span>
                  </div>
                  <div className="rank-sub-num">
                    {loadingRank && !liveRank ? '...' : `#${subTypeRank}`}
                    <span className="rank-sub-out-of"> / {totalSubType}</span>
                  </div>
                  {effectiveSubType && (
                    <span className="rank-sub-pill">{effectiveSubType}</span>
                  )}
                </div>
              )}
            </div>

            {/* Mobile App Action Buttons (Only visible on screens <= 900px) */}
            <div className="rank-mobile-only no-print">
              <div className="rank-actions-group">
                {APP_FEATURE_FLAGS.SHOW_REVIEW_ANSWERKEY && (
                  <Link href="/review-answerkey" className="rank-btn-primary">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Review Answerkey</span>
                    <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>→</span>
                  </Link>
                )}

                <div className="rank-btn-row">
                  <Link href="/result" className="rank-btn-secondary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Scorecard</span>
                  </Link>

                  <button type="button" onClick={() => window.print()} className="rank-btn-secondary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Subject-Wise Performance Breakdown Table */}
            {resultData.sections && resultData.sections.length > 0 && (
              <div className="rank-perf-card">
                <div className="rank-perf-header">
                  <h3 className="rank-perf-title">
                    📑 Subject Performance Breakdown
                  </h3>
                  <div className={`rank-score-pill ${totScore < 0 ? 'rank-score-negative' : 'rank-score-positive'}`}>
                    Net Score: {totScore >= 0 ? `+${totScore.toFixed(2)}` : totScore.toFixed(2)}
                  </div>
                </div>

                <div className="rank-kpi-strip">
                  <div className="rank-kpi-item">
                    <span style={{ color: '#475569' }}>Total:</span>
                    <strong>{totQuestions}</strong>
                  </div>
                  <div className="rank-kpi-item" style={{ color: '#15803d' }}>
                    <span>✓ Correct:</span>
                    <strong>{totCorrect}</strong>
                  </div>
                  <div className="rank-kpi-item" style={{ color: '#dc2626' }}>
                    <span>✕ Wrong:</span>
                    <strong>{totWrong}</strong>
                  </div>
                  <div className="rank-kpi-item" style={{ color: '#d97706' }}>
                    <span>– Skipped:</span>
                    <strong>{totUnattempted}</strong>
                  </div>
                  {hasBonus && (
                    <div className="rank-kpi-item" style={{ color: '#9333ea' }}>
                      <span>★ Bonus:</span>
                      <strong>{totBonus}</strong>
                    </div>
                  )}
                </div>

                <div className="rank-table-wrap">
                  <table className="rank-data-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', minWidth: '120px' }}>Section / Subject</th>
                        <th>Total</th>
                        <th className="rank-desktop-only">Attempted</th>
                        <th>Correct</th>
                        <th>Wrong</th>
                        {hasBonus && <th>Bonus</th>}
                        <th>Skip</th>
                        <th style={{ textAlign: 'right' }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.sections.map((sec, idx) => {
                        const secBonus = (sec.bonus !== undefined && sec.bonus !== null) ? sec.bonus : fallbackBonus;
                        const secAttempted = sec.total - sec.unattempted;
                        const secScore = ((sec.correct + (secBonus || 0)) * rightVal) - (sec.wrong * wrongVal);
                        return (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                            <td style={{ textAlign: 'left', fontWeight: 800, color: '#0f172a', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              {sec.name}
                            </td>
                            <td style={{ fontWeight: 700 }}>{sec.total}</td>
                            <td className="rank-desktop-only" style={{ fontWeight: 700 }}>{secAttempted}</td>
                            <td>
                              <span className="rank-badge-correct">+{sec.correct}</span>
                            </td>
                            <td>
                              <span className="rank-badge-wrong">-{sec.wrong}</span>
                            </td>
                            {hasBonus && (
                              <td>
                                <span className="rank-badge-bonus">{secBonus || 0}</span>
                              </td>
                            )}
                            <td>
                              <span className="rank-badge-skip">{sec.unattempted}</span>
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
                        <td className="rank-desktop-only" style={{ fontWeight: 900 }}>{totAttempted}</td>
                        <td style={{ fontWeight: 900, color: '#15803d' }}>{totCorrect}</td>
                        <td style={{ fontWeight: 900, color: '#dc2626' }}>{totWrong}</td>
                        {hasBonus && (
                          <td style={{ fontWeight: 900, color: '#9333ea' }}>{totBonus}</td>
                        )}
                        <td style={{ fontWeight: 900, color: '#d97706' }}>{totUnattempted}</td>
                        <td style={{ textAlign: 'right', fontWeight: 900, color: totScore < 0 ? '#dc2626' : '#0044cc', fontSize: '0.88rem' }}>
                          {totScore.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* DESKTOP SIDEBAR COLUMN (Only visible on screens > 900px) */}
          <div className="rank-sidebar-area no-print">

            {/* Candidate Profile Card */}
            <div className="rank-profile-card">
              <div className="rank-profile-header">
                <div className="rank-avatar">
                  {candidateInitial}
                </div>
                <div className="rank-profile-info">
                  <div className="rank-candidate-name-row">
                    <h2 className="rank-candidate-name">{candidateName}</h2>
                    <span className="rank-verified-badge">✓ Verified</span>
                  </div>
                  {rollNumber && (
                    <span className="rank-roll-pill">Roll: {rollNumber}</span>
                  )}
                </div>
              </div>

              <div className="rank-meta-chips-grid">
                {metaChips.map((chip, idx) => (
                  <div key={idx} className="rank-meta-chip">
                    <span>{chip.icon}</span>
                    <span>{chip.label}:</span>
                    <strong>{chip.val}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Actions Card */}
            <div className="rank-actions-group">
              {APP_FEATURE_FLAGS.SHOW_REVIEW_ANSWERKEY && (
                <Link href="/review-answerkey" className="rank-btn-primary">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Review Answerkey</span>
                  <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>→</span>
                </Link>
              )}

              <Link href="/result" className="rank-btn-secondary">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Scorecard</span>
              </Link>

              <button type="button" onClick={() => window.print()} className="rank-btn-secondary">
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
