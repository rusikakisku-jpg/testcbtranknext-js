'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_FEATURE_FLAGS } from '../config/features';
import { getBase64ImageAction } from '../actions/calculate';
import { cbtGet, cbtSave, cbtRemove, cbtGetString, cbtSaveString, STORAGE_KEYS } from '../utils/storage';

interface TelegramPortalModalProps {
  onJoin: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

function TelegramPortalModal({ onJoin, onClose, showCloseButton = true }: TelegramPortalModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      id="cbtrank-tg-portal-overlay"
      onClick={(e) => {
        if (showCloseButton && e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(10, 18, 40, 0.88)',
        backdropFilter: 'blur(7px)',
        WebkitBackdropFilter: 'blur(7px)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        position: 'relative',
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '400px',
        width: '100%',
        padding: '32px 24px 28px',
        boxShadow: '0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.15)',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        boxSizing: 'border-box',
      }}>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              padding: 0,
              transition: 'all 0.2s ease',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0088cc 0%, #29b6f6 100%)',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 12px rgba(0,136,204,0.12), 0 8px 24px rgba(0,136,204,0.45)',
        }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </div>

        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(90deg,#0088cc,#29b6f6)',
          color: '#fff',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '3px 12px',
          borderRadius: '999px',
          marginBottom: '12px',
        }}>Official Telegram Channel</div>

        <h3 style={{ fontSize: '1.22rem', fontWeight: 900, color: '#0a1228', margin: '0 0 10px', lineHeight: 1.3 }}>
          Get  Exam &amp; Rank Updates!
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 0 26px', lineHeight: 1.6 }}>
          Join our official Telegram Channel to get instant notifications about  <strong>Answer Keys</strong>, <strong>Ranks</strong> &amp; <strong>Cut-off Marks</strong> updates!
        </p>

        <a
          href="https://t.me/cbtrank"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onJoin}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #0088cc 0%, #29b6f6 100%)',
            color: '#ffffff',
            padding: '15px 20px',
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '0.97rem',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,136,204,0.4)',
            letterSpacing: '0.01em',
          }}
        >
          🚀 Join Official Telegram Channel
        </a>
      </div>
    </div>,
    document.body
  );
}

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

const ENABLE_TELEGRAM_DIALOG = true;
const SHOW_TELEGRAM_DIALOG_CLOSE_ICON = false; // Set to `true` to show cross (close) icon on dialogue, or `false` to hide it

export default function ResultPage() {
  const router = useRouter();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [rightVal, setRightVal] = useState(1.0);
  const [wrongVal, setWrongVal] = useState(0.25);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const pendingRedirect = useRef(false);

  function handleTelegramJoinClick() {
    try {
      localStorage.setItem('cbtrank_tg_popup_last_time', Date.now().toString());
      cbtRemove(STORAGE_KEYS.SHOW_TG_POPUP);
    } catch (e) {}
    setShowTelegramModal(false);
    if (pendingRedirect.current) {
      pendingRedirect.current = false;
      router.push('/');
    }
  }

  function handleTelegramCloseClick() {
    try {
      localStorage.setItem('cbtrank_tg_popup_last_time', Date.now().toString());
      cbtRemove(STORAGE_KEYS.SHOW_TG_POPUP);
    } catch (e) {}
    setShowTelegramModal(false);
    if (pendingRedirect.current) {
      pendingRedirect.current = false;
      router.push('/');
    }
  }

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

      // Auto-convert header image to Base64 in background so canvas export is instant and 100% CORS safe
      if (result.headerImgUrl && typeof result.headerImgUrl === 'string' && !result.headerImgUrl.startsWith('data:image')) {
        getBase64ImageAction(result.headerImgUrl)
          .then((b64) => {
            if (b64 && b64.startsWith('data:image')) {
              setResultData((prev) => (prev ? { ...prev, headerImgUrl: b64 } : prev));
              try {
                const cached = cbtGet<ResultData>(STORAGE_KEYS.RESULT_DATA);
                if (cached) {
                  cbtSave(STORAGE_KEYS.RESULT_DATA, { ...cached, headerImgUrl: b64 });
                }
              } catch (e) {}
            }
          })
          .catch(() => {});
      }

      if (ENABLE_TELEGRAM_DIALOG) {
        const showFlag = cbtGetString(STORAGE_KEYS.SHOW_TG_POPUP);
        if (showFlag === 'true') {
          cbtRemove(STORAGE_KEYS.SHOW_TG_POPUP);
          setShowTelegramModal(true);
        }
      }
    } catch (e) {
      router.push('/');
    }
  }, [router]);

  function calcMarks(sections: Section[], rightMark: number, wrongMark: number, bonusCount = 0) {
    let totalRight = 0, totalWrong = 0, totalUnattempted = 0, totalSecBonus = 0;
    sections.forEach(s => {
      totalRight += s.correct;
      totalWrong += s.wrong;
      totalSecBonus += (s.bonus || 0);
      totalUnattempted += s.unattempted;
    });
    const effectiveBonus = totalSecBonus > 0 ? totalSecBonus : bonusCount;
    const raw = ((totalRight + effectiveBonus) * rightMark) - (totalWrong * wrongMark);
    return { raw, totalRight, totalWrong, totalUnattempted, totalBonus: effectiveBonus };
  }

  function calcSectionMarks(sec: Section, rightMark: number, wrongMark: number, defaultBonus = 0) {
    const b = (sec.bonus !== undefined && sec.bonus !== null && sec.bonus > 0) ? sec.bonus : defaultBonus;
    return ((sec.correct + b) * rightMark) - (sec.wrong * wrongMark);
  }

  async function handleDownloadImageScorecard() {
    const templateEl = document.getElementById('cbrank-download-template');
    if (!templateEl) return;

    try {
      setIsGeneratingImg(true);

      // Ensure header image is Base64 to guarantee 0% CORS canvas blank space in downloaded image
      if (resultData?.headerImgUrl && !resultData.headerImgUrl.startsWith('data:image')) {
        try {
          const b64 = await getBase64ImageAction(resultData.headerImgUrl);
          if (b64 && b64.startsWith('data:image')) {
            setResultData((prev) => (prev ? { ...prev, headerImgUrl: b64 } : prev));
            // Brief pause to allow DOM update
            await new Promise((r) => setTimeout(r, 80));
          }
        } catch (e) {}
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2canvasModule = (await import('html2canvas')) as any;
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const canvas = await html2canvas(templateEl, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // Trigger direct download as "CBT Rank.png"
      const link = document.createElement('a');
      link.download = 'CBT Rank.png';
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating image scorecard:', err);
    } finally {
      setIsGeneratingImg(false);
    }
  }

  if (!resultData) {
    return (ENABLE_TELEGRAM_DIALOG && showTelegramModal) ? (
      <TelegramPortalModal
        onJoin={handleTelegramJoinClick}
        onClose={handleTelegramCloseClick}
        showCloseButton={SHOW_TELEGRAM_DIALOG_CLOSE_ICON}
      />
    ) : null;
  }

  const bonusCountFromData = Number(resultData.bonusCount || resultData.rawBonusQuestions || 0);
  const sectionsHaveBonus = Boolean(resultData.sections?.some(s => s.bonus && s.bonus > 0));
  const hasBonus = Boolean(sectionsHaveBonus || (bonusCountFromData > 0));
  const fallbackBonus = (!sectionsHaveBonus && resultData.sections?.length === 1) ? bonusCountFromData : 0;

  const { raw, totalRight, totalWrong, totalUnattempted, totalBonus } = calcMarks(resultData.sections, rightVal, wrongVal, bonusCountFromData);
  const totalAttempted = totalRight + totalWrong + (hasBonus ? totalBonus : 0);
  const totalQuestions = totalRight + totalWrong + totalUnattempted + (hasBonus ? totalBonus : 0);

  const candidateName = resultData.candidateName || resultData.infoRows?.find(r => /name|candidate|participant/i.test(r.label))?.value || 'Verified Candidate';
  const candidateInitial = (candidateName || 'C').charAt(0).toUpperCase();
  const candidateRollNo = resultData.rollNo || resultData.infoRows?.find(r => /roll|registration|id|applicant|user|ticket/i.test(r.label))?.value || formData?.ans_key_url?.match(/[\/=](\d{8,12})/)?.[1] || formData?.ans_key_url?.match(/\/pub\/([^\/]+)\//i)?.[1] || '';
  const candidateCategory = resultData.infoRows?.find(r => /community|caste|category/i.test(r.label))?.value || formData?.category || 'UR';
  const candidateTestDate = resultData.testDate || resultData.infoRows?.find(r => /date/i.test(r.label))?.value || '';
  const candidateTestTime = resultData.testTime || resultData.infoRows?.find(r => /time|shift/i.test(r.label))?.value || '';
  const candidateTestCenter = resultData.testCenter || resultData.infoRows?.find(r => /center|venue/i.test(r.label))?.value || '';

  // Dynamically compute all Candidate & Examination details without dropping any field
  const displayRows: Array<{ label: string; value: string }> = [];
  const existingKeySet = new Set<string>();

  if (resultData?.infoRows && resultData.infoRows.length > 0) {
    resultData.infoRows.forEach(row => {
      if (row.label && row.value && String(row.value).trim() !== '') {
        let val = String(row.value);
        if (/^(gender|sex)$/i.test(row.label.trim())) {
          val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        }
        displayRows.push({ label: row.label, value: val });
        existingKeySet.add(row.label.toLowerCase().trim());
      }
    });
  } else {
    if (resultData.candidateName) displayRows.push({ label: 'Candidate Name', value: resultData.candidateName });
    if (resultData.rollNo) displayRows.push({ label: 'Roll / Reg. Number', value: resultData.rollNo });
    if (resultData.examName) displayRows.push({ label: 'Subject / Exam', value: resultData.examName });
    if (resultData.testDate) displayRows.push({ label: 'Test Date', value: resultData.testDate });
    if (resultData.testTime) displayRows.push({ label: 'Test Time', value: resultData.testTime });
    if (resultData.testCenter) displayRows.push({ label: 'Test Center / Venue', value: resultData.testCenter });
  }

  // Complement with user-submitted form data if not already included in candidate_info
  if (formData?.category && !Array.from(existingKeySet).some(k => k.includes('category') || k.includes('community') || k.includes('caste'))) {
    displayRows.push({ label: 'Category', value: formData.category });
  }
  const formHz = formData?.horizontal_category?.trim();
  if (formHz && !['none', 'na', 'n/a', 'null', '--', 'not applicable', 'no'].includes(formHz.toLowerCase()) && !Array.from(existingKeySet).some(k => k.includes('horizontal'))) {
    displayRows.push({ label: 'Horizontal Reservation', value: formHz });
  }
  if (formData?.gender && !Array.from(existingKeySet).some(k => k.includes('gender') || k.includes('sex'))) {
    const rawGender = String(formData.gender).trim();
    const formattedGender = rawGender ? (rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()) : '';
    displayRows.push({ label: 'Gender', value: formattedGender });
  }
  if (formData?.state && !Array.from(existingKeySet).some(k => k.includes('state') || k.includes('zone') || k.includes('region'))) {
    displayRows.push({ label: formData.location_label || 'State / Zone', value: formData.state });
  }
  if (formData?.paper_language && !Array.from(existingKeySet).some(k => k.includes('language') || k.includes('medium'))) {
    displayRows.push({ label: 'Paper Language', value: formData.paper_language });
  }


  return (
    <>
      {ENABLE_TELEGRAM_DIALOG && showTelegramModal && (
        <TelegramPortalModal
          onJoin={handleTelegramJoinClick}
          onClose={handleTelegramCloseClick}
          showCloseButton={SHOW_TELEGRAM_DIALOG_CLOSE_ICON}
        />
      )}

      <main style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <style>{`
          /* ============================================================
             DEDICATED FULL-BLEED SCORECARD DESIGN SYSTEM FOR /result
             Matches the authentic official scorecard UI 1:1 with download template
             ============================================================ */
          .result-main {
            flex: 1;
            width: 100%;
            max-width: 680px;
            margin: 0 auto;
            padding: 18px 12px 60px;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
          }

          /* Single Unified Scorecard Card (1:1 with Download Template) */
          .scorecard-card {
            background: #ffffff !important;
            border-radius: 14px !important;
            border: 4px solid #0044cc !important;
            box-shadow: 0 4px 24px rgba(0, 68, 204, 0.10), 0 1px 4px rgba(0, 0, 0, 0.05) !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            position: relative !important;
          }

          @media (max-width: 768px) {
            .result-main {
              padding: 12px 8px 50px !important;
            }
            .scorecard-card {
              border-width: 3.5px !important;
              border-radius: 12px !important;
            }
          }

          /* Security Watermark Grid */
          .scorecard-watermark-grid {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(5, 1fr);
            gap: 24px 10px;
            align-items: center;
            justify-items: center;
            pointer-events: none;
            user-select: none;
            z-index: 0;
            overflow: hidden;
            padding: 16px;
          }

          .scorecard-watermark-item {
            transform: rotate(-25deg);
            font-size: 1.45rem;
            font-weight: 900;
            color: #0044cc;
            opacity: 0.055;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            white-space: nowrap;
            font-family: system-ui, -apple-system, sans-serif;
          }

          /* Header Section */
          .scorecard-header-box {
            position: relative;
            z-index: 1;
            background: #ffffff;
            padding: 10px 16px;
            text-align: center;
            border-bottom: 2px solid #0044cc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 48px;
            box-sizing: border-box;
          }

          .scorecard-header-box.text-banner {
            background: #0044cc;
            color: #ffffff;
            padding: 12px 16px;
          }

          .scorecard-header-logo {
            max-height: 65px;
            max-width: 100%;
            object-fit: contain;
            display: block;
            margin: 0 auto;
          }

          .scorecard-header-title {
            font-size: 1.08rem;
            font-weight: 900;
            margin: 0;
            line-height: 1.3;
            color: #ffffff;
          }

          /* Candidate Examination Details Table */
          .scorecard-table-wrapper {
            position: relative;
            z-index: 1;
            width: 100%;
            overflow-x: auto;
            box-sizing: border-box;
          }

          .scorecard-cand-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.82rem;
            border-bottom: 2px solid #0044cc;
          }

          .scorecard-cand-th {
            width: 38%;
            background: #f8fafc;
            padding: 7px 12px;
            text-align: left;
            font-weight: 700;
            color: #475569;
            border-right: 1px solid #cbd5e1;
            box-sizing: border-box;
          }

          .scorecard-cand-td {
            width: 62%;
            background: #ffffff;
            padding: 7px 12px;
            font-weight: 800;
            color: #0f172a;
            text-align: left;
            box-sizing: border-box;
          }

          .scorecard-cand-td.is-roll {
            font-weight: 900;
            color: #0044cc;
            font-family: monospace;
          }

          .scorecard-cand-td.is-venue {
            font-size: 0.78rem;
          }

          /* Interactive Recalculate Controls Bar */
          .scorecard-recalc-bar {
            position: relative;
            z-index: 1;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #f8fafc;
            border-bottom: 1px solid #cbd5e1;
            box-sizing: border-box;
          }

          .scorecard-recalc-title {
            font-size: 0.74rem;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin: 0;
          }

          .scorecard-recalc-inputs {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.78rem;
            font-weight: 700;
            color: #334155;
          }

          @media (max-width: 520px) {
            .scorecard-recalc-bar {
              flex-direction: column;
              align-items: flex-start;
              gap: 6px;
            }
            .scorecard-recalc-inputs {
              width: 100%;
              justify-content: space-between;
            }
          }

          /* Subject-Wise Performance Table */
          .scorecard-subject-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.80rem;
            text-align: center;
            border-bottom: 1px solid #cbd5e1;
          }

          .scorecard-subj-head {
            background: #0f172a;
            color: #ffffff;
            font-weight: 800;
            font-size: 0.72rem;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }

          .scorecard-subj-th {
            padding: 8px 5px;
            border-right: 1px solid #334155;
            white-space: nowrap;
          }

          .scorecard-subj-th:last-child {
            border-right: none;
          }

          .scorecard-subj-td {
            padding: 8px 5px;
            border-right: 1px solid #cbd5e1;
            white-space: nowrap;
          }

          .scorecard-subj-td:last-child {
            border-right: none;
          }

          .scorecard-sec-name {
            padding: 8px 10px;
          }

          .scorecard-subj-tfoot {
            background: #eff6ff;
            border-top: 2px solid #3b82f6;
            font-weight: 900;
            font-size: 0.84rem;
          }

          .scorecard-subject-table .th-desktop-label {
            display: inline;
          }

          .scorecard-subject-table .th-mobile-label {
            display: none;
          }

          .scorecard-subj-legend {
            position: relative;
            z-index: 1;
            padding: 8px 12px;
            background: #f8fafc;
            border-bottom: 1px solid #cbd5e1;
            font-size: 0.74rem;
            color: #475569;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px 14px;
            line-height: 1.4;
            box-sizing: border-box;
          }

          .scorecard-subj-legend .legend-title {
            font-weight: 800;
            color: #1e293b;
          }

          .scorecard-subj-legend .legend-item {
            display: inline-flex;
            align-items: center;
            gap: 3px;
          }

          @media (max-width: 640px) {
            /* Compact User Info (Candidate Details Table) on Mobile */
            .scorecard-cand-table {
              font-size: 0.72rem !important;
            }
            .scorecard-cand-th {
              font-size: 0.70rem !important;
              padding: 5px 8px !important;
              width: 36% !important;
              line-height: 1.3 !important;
            }
            .scorecard-cand-td {
              font-size: 0.72rem !important;
              padding: 5px 8px !important;
              width: 64% !important;
              line-height: 1.3 !important;
            }
            .scorecard-cand-td.is-venue {
              font-size: 0.67rem !important;
              line-height: 1.25 !important;
            }

            /* Compact Subject-Wise Performance Table on Mobile */
            .scorecard-subject-table {
              font-size: 0.70rem !important;
            }
            .scorecard-subj-head .scorecard-subj-th {
              font-size: 0.68rem !important;
              padding: 6px 3px !important;
            }
            .scorecard-subj-td {
              font-size: 0.70rem !important;
              padding: 6px 3px !important;
            }
            .scorecard-sec-name {
              font-size: 0.69rem !important;
              padding: 6px 6px !important;
              line-height: 1.25 !important;
            }
            .scorecard-subj-tfoot td {
              font-size: 0.71rem !important;
              padding: 7px 3px !important;
            }
            .scorecard-subj-tfoot td:last-child {
              font-size: 0.78rem !important;
            }
            .scorecard-subject-table .th-desktop-label {
              display: none !important;
            }
            .scorecard-subject-table .th-mobile-label {
              display: inline !important;
              font-size: 0.76rem !important;
              font-weight: 900 !important;
              letter-spacing: 0.02em !important;
            }
            .scorecard-subj-legend {
              font-size: 0.68rem !important;
              padding: 6px 8px !important;
              gap: 4px 8px !important;
            }
          }

          /* Bottom Action Buttons Stack */
          .scorecard-actions-panel {
            position: relative;
            z-index: 1;
            padding: 14px 14px;
            background: #f8fafc;
            border-top: 2px solid #0044cc;
            display: flex;
            flex-direction: column;
            gap: 10px;
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
            padding: 12px 18px;
            border-radius: 12px;
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

          .app-btn-main:active {
            transform: scale(0.98);
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
            padding: 10px 12px;
            border-radius: 10px;
            font-weight: 800;
            font-size: 0.82rem;
            text-decoration: none;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
            transition: all 0.2s ease;
            box-sizing: border-box;
          }

          .app-btn-sub:hover {
            background: #f1f5f9;
            border-color: #94a3b8;
          }

          .app-btn-sub:active {
            transform: scale(0.98);
          }
        `}</style>

      <div className="result-main">

        {/* UNIFIED SCORECARD CONTAINER (1:1 with Download Template UI) */}
        <div className="scorecard-card" id="cbrank-scorecard-card">

          {/* Multiple Repeating Security Watermarks: CBT Rank */}
          <div className="scorecard-watermark-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="scorecard-watermark-item">
                CBT Rank
              </div>
            ))}
          </div>

          {/* 1. Header Section (Logo OR Blue Text Banner) */}
          {resultData.headerImgUrl ? (
            <div className="scorecard-header-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultData.headerImgUrl}
                alt="Exam Header Logo"
                className="scorecard-header-logo"
              />
            </div>
          ) : (
            <div className="scorecard-header-box text-banner">
              <h2 className="scorecard-header-title">
                {resultData.headerBannerText || resultData.examName || 'CBT Competitive Examination'}
              </h2>
            </div>
          )}

          {/* 2. Candidate Examination Details Table (Edge to Edge, 2 Columns) */}
          <div className="scorecard-table-wrapper">
            <table className="scorecard-cand-table">
              <tbody>
                {displayRows.map((row, idx) => {
                  const isLast = idx === displayRows.length - 1;
                  const isRoll = /roll|registration|id|participant\s*id|applicant/i.test(row.label);
                  return (
                    <tr key={idx} style={{ borderBottom: isLast ? 'none' : '1px solid #cbd5e1' }}>
                      <th className="scorecard-cand-th">
                        {row.label}
                      </th>
                      <td
                        className={`scorecard-cand-td ${isRoll ? 'is-roll' : ''} ${row.label.toLowerCase().includes('center') || row.label.toLowerCase().includes('venue') ? 'is-venue' : ''}`}
                      >
                        {row.value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 3. Interactive Recalculate Controls Bar (no-print) */}
          <div className="scorecard-recalc-bar no-print">
            <h3 className="scorecard-recalc-title">Subject-Wise Performance Breakdown</h3>
            <div className="scorecard-recalc-inputs">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Right (+):{' '}
                <input
                  type="number"
                  inputMode="decimal"
                  id="right-val-input"
                  value={rightVal === 0 ? '' : rightVal}
                  placeholder="0"
                  step="any"
                  min="0"
                  style={{ width: '56px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: '0.85rem', outline: 'none' }}
                  onChange={e => {
                    const v = e.target.value;
                    let n = 0;
                    if (v !== '') {
                      const parsed = parseFloat(v);
                      if (!isNaN(parsed)) n = parsed;
                    }
                    setRightVal(n);
                    try {
                      cbtSaveString(STORAGE_KEYS.MARKS_RIGHT, n.toString());
                      const parsedForm = cbtGet<FormData>(STORAGE_KEYS.FORM_DATA);
                      if (parsedForm) {
                        parsedForm.marks_right = n;
                        cbtSave(STORAGE_KEYS.FORM_DATA, parsedForm);
                        setFormData(parsedForm);
                      }
                    } catch (err) {
                      console.error('Error saving recalculated right val:', err);
                    }
                  }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Wrong (-):{' '}
                <input
                  type="number"
                  inputMode="decimal"
                  id="wrong-val-input"
                  value={wrongVal === 0 ? '' : wrongVal}
                  placeholder="0"
                  step="any"
                  min="0"
                  style={{ width: '56px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: '0.85rem', outline: 'none' }}
                  onChange={e => {
                    const v = e.target.value;
                    let n = 0;
                    if (v !== '') {
                      const parsed = parseFloat(v);
                      if (!isNaN(parsed)) n = parsed;
                    }
                    setWrongVal(n);
                    try {
                      cbtSaveString(STORAGE_KEYS.MARKS_WRONG, n.toString());
                      const parsedForm = cbtGet<FormData>(STORAGE_KEYS.FORM_DATA);
                      if (parsedForm) {
                        parsedForm.marks_wrong = n;
                        cbtSave(STORAGE_KEYS.FORM_DATA, parsedForm);
                        setFormData(parsedForm);
                      }
                    } catch (err) {
                      console.error('Error saving recalculated wrong val:', err);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* 4. Subject-Wise Performance Table (Flush, Edge to Edge) */}
          <div className="scorecard-table-wrapper">
            <table className="scorecard-subject-table">
              <thead>
                <tr className="scorecard-subj-head">
                  <th className="scorecard-subj-th" style={{ padding: '8px 10px', textAlign: 'left', minWidth: '100px' }}>Section</th>
                  <th className="scorecard-subj-th">Total</th>
                  <th className="scorecard-subj-th" style={{ color: '#4ade80' }}>
                    <span className="th-desktop-label">Right (+{rightVal})</span>
                    <span className="th-mobile-label">R</span>
                  </th>
                  <th className="scorecard-subj-th" style={{ color: '#f87171' }}>
                    <span className="th-desktop-label">Wrong (-{wrongVal})</span>
                    <span className="th-mobile-label">W</span>
                  </th>
                  {hasBonus && (
                    <th className="scorecard-subj-th" style={{ color: '#c084fc' }}>
                      <span className="th-desktop-label">Bonus (+{rightVal})</span>
                      <span className="th-mobile-label">B</span>
                    </th>
                  )}
                  <th className="scorecard-subj-th" style={{ color: '#fbbf24' }}>
                    <span className="th-desktop-label">Skip</span>
                    <span className="th-mobile-label">S</span>
                  </th>
                  <th className="scorecard-subj-th" style={{ padding: '8px 10px', textAlign: 'right' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {resultData.sections.map((sec, idx) => {
                  const sm = calcSectionMarks(sec, rightVal, wrongVal, fallbackBonus);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td className="scorecard-subj-td scorecard-sec-name" style={{ textAlign: 'left', fontWeight: 800, color: '#0f172a', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.35 }}>
                        {sec.name}
                      </td>
                      <td className="scorecard-subj-td" style={{ fontWeight: 700 }}>{sec.total}</td>
                      <td className="scorecard-subj-td" style={{ fontWeight: 800, color: '#16a34a' }}>{sec.correct}</td>
                      <td className="scorecard-subj-td" style={{ fontWeight: 800, color: '#dc2626' }}>{sec.wrong}</td>
                      {hasBonus && (
                        <td className="scorecard-subj-td" style={{ fontWeight: 800, color: '#9333ea' }}>{sec.bonus !== undefined ? sec.bonus : fallbackBonus}</td>
                      )}
                      <td className="scorecard-subj-td" style={{ fontWeight: 700, color: '#d97706' }}>{sec.unattempted}</td>
                      <td className="scorecard-subj-td" style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: sm >= 0 ? '#0f172a' : '#dc2626' }}>
                        {sm.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="scorecard-subj-tfoot">
                  <td className="scorecard-subj-td scorecard-sec-name" style={{ textAlign: 'left', color: '#1e3a8a', whiteSpace: 'normal' }}>
                    <span className="th-desktop-label">GRAND TOTAL</span>
                    <span className="th-mobile-label">TOTAL</span>
                  </td>
                  <td className="scorecard-subj-td" style={{ color: '#0f172a' }}>{totalQuestions}</td>
                  <td className="scorecard-subj-td" style={{ color: '#16a34a' }}>{totalRight}</td>
                  <td className="scorecard-subj-td" style={{ color: '#dc2626' }}>{totalWrong}</td>
                  {hasBonus && (
                    <td className="scorecard-subj-td" style={{ color: '#9333ea' }}>{totalBonus}</td>
                  )}
                  <td className="scorecard-subj-td" style={{ color: '#d97706' }}>{totalUnattempted}</td>
                  <td className="scorecard-subj-td" style={{ padding: '9px 10px', textAlign: 'right', color: raw >= 0 ? '#0044cc' : '#dc2626', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                    {raw.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 5. Note / Legend Bar (Explaining R, W, S, B) */}
          <div className="scorecard-subj-legend">
            <span className="legend-title">📌 Note:</span>
            <span className="legend-item"><strong style={{ color: '#16a34a' }}>R</strong> = Right (+{rightVal})</span>
            <span className="legend-item"><strong style={{ color: '#dc2626' }}>W</strong> = Wrong (-{wrongVal})</span>
            <span className="legend-item"><strong style={{ color: '#d97706' }}>S</strong> = Skip</span>
            {hasBonus && (
              <span className="legend-item"><strong style={{ color: '#9333ea' }}>B</strong> = Bonus (+{rightVal})</span>
            )}
          </div>

          {/* 6. Bottom Action Buttons Stack (no-print) */}
          <div className="scorecard-actions-panel no-print">
            {/* Primary Full-Width CTA: View Your Rank */}
            {APP_FEATURE_FLAGS.SHOW_VIEW_RANK && (
              <Link
                href="/rank"
                className="app-btn-main"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>View Your Live Rank</span>
                <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>→</span>
              </Link>
            )}

            {/* Secondary Duo Row: Review Answerkey & Download Scorecard */}
            <div className="app-btn-duo-row">
              {APP_FEATURE_FLAGS.SHOW_REVIEW_ANSWERKEY && (
                <Link
                  href="/review-answerkey"
                  className="app-btn-sub"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Review Answerkey</span>
                </Link>
              )}

              {APP_FEATURE_FLAGS.SHOW_DOWNLOAD_SCORECARD && (
                <button
                  type="button"
                  disabled={isGeneratingImg}
                  onClick={handleDownloadImageScorecard}
                  className="app-btn-sub"
                >
                  {isGeneratingImg ? (
                    <span>Generating...</span>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Download Scorecard</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>

    {/* ─────────────────────────────────────────────────────────── */}
    {/* Dedicated Full-Bleed Table Scorecard (RankGuruji Design)    */}
    {/* Captured by html2canvas when "Download Scorecard" is clicked */}
    {/* ─────────────────────────────────────────────────────────── */}
    <div
      id="cbrank-download-template"
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '520px',
        background: '#ffffff',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#0f172a',
        padding: 0,
        boxSizing: 'border-box',
        border: '5px solid #0044cc',
        borderTop: '5px solid #0044cc',
        borderRight: '5px solid #0044cc',
        borderBottom: '5px solid #0044cc',
        borderLeft: '5px solid #0044cc',
        overflow: 'hidden'
      }}
    >
      {/* Multiple Repeating Security Watermarks: CBT Rank */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr)',
          gap: '24px 10px',
          alignItems: 'center',
          justifyItems: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 99,
          overflow: 'hidden',
          padding: '16px'
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              transform: 'rotate(-25deg)',
              fontSize: '1.45rem',
              fontWeight: 900,
              color: '#0044cc',
              opacity: 0.055,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            CBT Rank
          </div>
        ))}
      </div>

      {/* 1. Header Section (Exam Header Logo / Banner Image OR Text Banner) */}
      {resultData.headerImgUrl ? (
        <div style={{
          position: 'relative',
          zIndex: 1,
          background: '#ffffff',
          padding: '10px 16px',
          textAlign: 'center',
          borderBottom: '2px solid #0044cc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '48px'
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultData.headerImgUrl}
            alt="Exam Header Logo"
            style={{
              maxHeight: '65px',
              maxWidth: '100%',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto'
            }}
          />
        </div>
      ) : (
        <div style={{
          position: 'relative',
          zIndex: 1,
          background: '#0044cc',
          color: '#ffffff',
          padding: '12px 16px',
          textAlign: 'center',
          borderBottom: '2px solid #0044cc'
        }}>
          <h2 style={{ fontSize: '1.08rem', fontWeight: 900, margin: 0, lineHeight: 1.3, color: '#ffffff' }}>
            {resultData.headerBannerText || resultData.examName || 'CBT Competitive Examination'}
          </h2>
        </div>
      )}

      {/* Candidate Details Table (Edge to Edge, 2 Columns: Label | Value) */}
      <table style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.78rem',
        borderBottom: '2px solid #0044cc'
      }}>
        <tbody>
          {displayRows.map((row, idx) => {
            const isLast = idx === displayRows.length - 1;
            const isRoll = /roll|registration|id|participant\s*id|applicant/i.test(row.label);
            return (
              <tr key={idx} style={{ borderBottom: isLast ? 'none' : '1px solid #cbd5e1' }}>
                <th style={{ width: '38%', background: '#f8fafc', padding: '6px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', borderRight: '1px solid #cbd5e1' }}>
                  {row.label}
                </th>
                <td style={{
                  width: '62%',
                  background: '#ffffff',
                  padding: '6px 12px',
                  fontWeight: isRoll ? 900 : 800,
                  color: isRoll ? '#0044cc' : '#0f172a',
                  fontFamily: isRoll ? 'monospace' : 'inherit',
                  textAlign: 'left',
                  fontSize: row.label.toLowerCase().includes('center') || row.label.toLowerCase().includes('venue') ? '0.75rem' : 'inherit'
                }}>
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Subject-Wise Performance Table (Edge to Edge, 100% Flush) */}
      <table style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.78rem',
        textAlign: 'center',
        borderBottom: '1px solid #cbd5e1'
      }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#ffffff', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            <th style={{ padding: '8px 10px', textAlign: 'left', borderRight: '1px solid #334155', whiteSpace: 'normal', minWidth: '110px' }}>Section</th>
            <th style={{ padding: '8px 4px', borderRight: '1px solid #334155' }}>Total</th>
            <th style={{ padding: '8px 4px', color: '#4ade80', borderRight: '1px solid #334155' }}>Right (+{rightVal})</th>
            <th style={{ padding: '8px 4px', color: '#f87171', borderRight: '1px solid #334155' }}>Wrong (-{wrongVal})</th>
            {hasBonus && (
              <th style={{ padding: '8px 4px', color: '#c084fc', borderRight: '1px solid #334155' }}>Bonus (+{rightVal})</th>
            )}
            <th style={{ padding: '8px 4px', color: '#fbbf24', borderRight: '1px solid #334155' }}>Skip</th>
            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {resultData.sections.map((sec, idx) => {
            const sm = calcSectionMarks(sec, rightVal, wrongVal, fallbackBonus);
            return (
              <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #cbd5e1', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: 1.35 }}>{sec.name}</td>
                <td style={{ padding: '8px 4px', fontWeight: 700, borderRight: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>{sec.total}</td>
                <td style={{ padding: '8px 4px', fontWeight: 800, color: '#16a34a', borderRight: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>{sec.correct}</td>
                <td style={{ padding: '8px 4px', fontWeight: 800, color: '#dc2626', borderRight: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>{sec.wrong}</td>
                {hasBonus && (
                  <td style={{ padding: '8px 4px', fontWeight: 800, color: '#9333ea', borderRight: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>{sec.bonus !== undefined ? sec.bonus : fallbackBonus}</td>
                )}
                <td style={{ padding: '8px 4px', fontWeight: 700, color: '#d97706', borderRight: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>{sec.unattempted}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: sm >= 0 ? '#0f172a' : '#dc2626', whiteSpace: 'nowrap' }}>
                  {sm.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: '#eff6ff', borderTop: '2px solid #3b82f6', fontWeight: 900, fontSize: '0.82rem' }}>
            <td style={{ padding: '9px 10px', textAlign: 'left', color: '#1e3a8a', borderRight: '1px solid #cbd5e1', whiteSpace: 'normal' }}>GRAND TOTAL</td>
            <td style={{ padding: '9px 4px', color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>{totalQuestions}</td>
            <td style={{ padding: '9px 4px', color: '#16a34a', borderRight: '1px solid #cbd5e1' }}>{totalRight}</td>
            <td style={{ padding: '9px 4px', color: '#dc2626', borderRight: '1px solid #cbd5e1' }}>{totalWrong}</td>
            {hasBonus && (
              <td style={{ padding: '9px 4px', color: '#9333ea', borderRight: '1px solid #cbd5e1' }}>{totalBonus}</td>
            )}
            <td style={{ padding: '9px 4px', color: '#d97706', borderRight: '1px solid #cbd5e1' }}>{totalUnattempted}</td>
            <td style={{ padding: '9px 10px', textAlign: 'right', color: raw >= 0 ? '#0044cc' : '#dc2626', fontSize: '0.95rem', fontFamily: 'monospace' }}>
              {raw.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
    </>
  );
}
