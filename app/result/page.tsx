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
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false
      });

      // Trim any subpixel gaps outside the blue border so the image ends flush on the border
      let finalCanvas = canvas;
      try {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          const isBlue = (idx: number) => {
            const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
            return a > 140 && b > 130 && (b - r) > 30 && (b - g) > 20;
          };

          // Scan from top down (up to 80px)
          let minY = 0;
          for (let y = 0; y < Math.min(height, 80); y++) {
            let hasBlue = false;
            for (let x = 0; x < width; x++) {
              if (isBlue((y * width + x) * 4)) { hasBlue = true; break; }
            }
            if (hasBlue) { minY = y; break; }
          }

          // Scan from bottom up (up to 80px)
          let maxY = height - 1;
          for (let y = height - 1; y >= Math.max(0, height - 80); y--) {
            let hasBlue = false;
            for (let x = 0; x < width; x++) {
              if (isBlue((y * width + x) * 4)) { hasBlue = true; break; }
            }
            if (hasBlue) { maxY = y; break; }
          }

          // Scan from left to right (up to 80px)
          let minX = 0;
          for (let x = 0; x < Math.min(width, 80); x++) {
            let hasBlue = false;
            for (let y = minY; y <= maxY; y++) {
              if (isBlue((y * width + x) * 4)) { hasBlue = true; break; }
            }
            if (hasBlue) { minX = x; break; }
          }

          // Scan from right to left (up to 80px)
          let maxX = width - 1;
          for (let x = width - 1; x >= Math.max(0, width - 80); x--) {
            let hasBlue = false;
            for (let y = minY; y <= maxY; y++) {
              if (isBlue((y * width + x) * 4)) { hasBlue = true; break; }
            }
            if (hasBlue) { maxX = x; break; }
          }

          if (minX > 0 || minY > 0 || maxX < width - 1 || maxY < height - 1) {
            const cropW = maxX - minX + 1;
            const cropH = maxY - minY + 1;
            if (cropW > 100 && cropH > 100) {
              const cropped = document.createElement('canvas');
              cropped.width = cropW;
              cropped.height = cropH;
              const cropCtx = cropped.getContext('2d');
              if (cropCtx) {
                cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
                finalCanvas = cropped;
              }
            }
          }
        }
      } catch (cropErr) {
        console.warn('Could not auto-trim canvas borders:', cropErr);
      }

      const imgData = finalCanvas.toDataURL('image/png', 1.0);

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
            border: 5px solid #0044cc !important;
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
              border-width: 4.5px !important;
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
            grid-template-rows: repeat(6, 1fr);
            gap: 24px 10px;
            align-items: center;
            justify-items: center;
            pointer-events: none;
            user-select: none;
            z-index: 10;
            overflow: hidden;
            padding: 16px;
          }

          .scorecard-watermark-item {
            transform: rotate(-25deg);
            font-size: 1.12rem;
            font-weight: 800;
            color: #0044cc;
            opacity: 0.06;
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
            border-bottom: 2.5px solid #0044cc;
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
            table-layout: fixed;
            border-collapse: collapse;
            font-size: 0.78rem;
            border-bottom: 2.5px solid #0044cc;
          }

          .scorecard-cand-th {
            width: 38%;
            background: #f8fafc;
            padding: 6px 12px;
            text-align: left;
            font-weight: 700;
            color: #475569;
            font-size: 0.77rem;
            border-right: 1px solid #cbd5e1;
            box-sizing: border-box;
          }

          .scorecard-cand-td {
            width: 62%;
            background: #ffffff;
            padding: 6px 12px;
            font-weight: 800;
            color: #0f172a;
            font-size: 0.78rem;
            text-align: left;
            box-sizing: border-box;
            word-break: break-word;
            overflow-wrap: anywhere;
          }

          .scorecard-cand-td.is-roll {
            font-weight: 900;
            color: #0044cc;
            font-family: monospace;
          }

          .scorecard-cand-td.is-venue {
            font-size: 0.74rem;
          }

          /* Interactive Recalculate Controls Bar */
          .scorecard-recalc-bar {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            width: 100%;
            padding: 6px 12px;
            background: #f8fafc;
            border-bottom: 1px solid #cbd5e1;
            box-sizing: border-box;
          }

          .scorecard-recalc-inputs {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            font-size: 0.78rem;
            font-weight: 700;
            color: #334155;
            flex-wrap: wrap;
            gap: 6px;
          }

          @media (max-width: 520px) {
            .scorecard-recalc-bar {
              padding: 5px 10px;
            }
          }

          /* Subject-Wise Performance Table */
          .scorecard-subject-table {
            width: 100%;
            table-layout: fixed;
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
            box-sizing: border-box;
          }

          .scorecard-subj-th:last-child {
            border-right: none;
          }

          .scorecard-subj-td {
            padding: 8px 5px;
            border-right: 1px solid #cbd5e1;
            white-space: nowrap;
            box-sizing: border-box;
          }

          .scorecard-subj-td:last-child {
            border-right: none;
          }

          /* Section column width strictly matches candidate table key column */
          .scorecard-sec-th,
          .scorecard-sec-name {
            width: 38%;
            box-sizing: border-box;
            padding: 8px 10px;
          }

          .scorecard-total-th {
            width: 15%;
            box-sizing: border-box;
          }

          .scorecard-subj-tfoot {
            background: #eff6ff;
            border-top: 2.5px solid #3b82f6;
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
            font-weight: 900;
            color: #1e293b;
            font-size: 0.88rem;
            line-height: 1;
          }

          .scorecard-subj-legend .legend-item {
            display: inline-flex;
            align-items: center;
            gap: 3px;
          }

          @media (max-width: 640px) {
            /* Compact User Info (Candidate Details Table) on Mobile */
            .scorecard-cand-table {
              font-size: 0.68rem !important;
            }
            .scorecard-cand-th {
              font-size: 0.67rem !important;
              padding: 4.5px 8px !important;
              width: 36% !important;
              line-height: 1.3 !important;
            }
            .scorecard-cand-td {
              font-size: 0.68rem !important;
              padding: 4.5px 8px !important;
              width: 64% !important;
              line-height: 1.3 !important;
            }
            .scorecard-cand-td.is-venue {
              font-size: 0.63rem !important;
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
            /* Section column on mobile strictly matches candidate key column (36%) */
            .scorecard-sec-th,
            .scorecard-sec-name {
              width: 36% !important;
              font-size: 0.69rem !important;
              padding: 6px 6px !important;
              line-height: 1.25 !important;
            }
            .scorecard-total-th {
              width: 16% !important;
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
            .scorecard-watermark-item {
              font-size: 0.98rem !important;
              opacity: 0.062 !important;
            }
          }

          /* Bottom Action Buttons Stack (Below the Scorecard Container) */
          .scorecard-actions-panel {
            position: relative;
            z-index: 1;
            padding: 16px 0 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            box-sizing: border-box;
          }

          /* 1. Primary Action: View Live Rank */
          .result-action-card {
            position: relative;
            display: flex;
            align-items: center;
            border-radius: 14px;
            text-decoration: none;
            transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
            box-sizing: border-box;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }

          .result-action-rank {
            background: linear-gradient(135deg, #003db8 0%, #0044cc 45%, #2563eb 100%);
            color: #ffffff;
            padding: 14px 18px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 18px rgba(0, 68, 204, 0.28), 0 1px 3px rgba(0, 0, 0, 0.08);
            justify-content: space-between;
            overflow: hidden;
          }

          .result-action-rank::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
            transform: skewX(-25deg);
            transition: left 0.75s ease;
          }

          .result-action-rank:hover::before {
            left: 150%;
          }

          .result-action-rank:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 26px rgba(0, 68, 204, 0.38), 0 2px 6px rgba(0, 0, 0, 0.1);
            filter: brightness(1.03);
          }

          .result-action-rank:active {
            transform: scale(0.985);
          }

          .result-action-content {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .result-action-icon-pill {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            flex-shrink: 0;
          }

          .rank-icon-pill {
            width: 42px;
            height: 42px;
            background: rgba(255, 255, 255, 0.16);
            backdrop-filter: blur(8px);
            color: #fbbf24;
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          }

          .result-action-labels {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .result-action-header {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .result-action-title {
            font-weight: 800;
            font-size: 0.98rem;
            letter-spacing: -0.01em;
            line-height: 1.2;
          }

          .result-live-badge {
            background: rgba(16, 185, 129, 0.22);
            color: #6ee7b7;
            border: 1px solid rgba(16, 185, 129, 0.4);
            font-size: 0.65rem;
            font-weight: 900;
            letter-spacing: 0.06em;
            padding: 2px 7px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            text-transform: uppercase;
          }

          .result-live-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #34d399;
            box-shadow: 0 0 6px #34d399;
            animation: liveDotPulse 1.6s ease-in-out infinite;
          }

          @keyframes liveDotPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.8); }
          }

          .result-action-subtitle {
            font-size: 0.76rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.82);
            line-height: 1.2;
          }

          .result-action-arrow-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(6px);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.22);
            padding: 8px 14px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.82rem;
            white-space: nowrap;
            flex-shrink: 0;
            transition: all 0.2s ease;
          }

          .result-action-rank:hover .result-action-arrow-btn {
            background: rgba(255, 255, 255, 0.25);
            transform: translateX(2px);
          }

          /* 2. Secondary Dual Row: Review Answerkey & Download Scorecard */
          .result-actions-dual-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            width: 100%;
            box-sizing: border-box;
          }

          .result-action-review,
          .result-action-download {
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            color: #0f172a;
            padding: 12px 14px;
            gap: 8px;
            box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .result-action-review .result-action-title,
          .result-action-download .result-action-title {
            color: #0f172a;
            font-size: 0.88rem;
            font-weight: 800;
            white-space: nowrap;
          }

          .review-icon-pill {
            width: 38px;
            height: 38px;
            background: #f5f3ff;
            color: #7c3aed;
            border: 1px solid #ede9fe;
          }

          .download-icon-pill {
            width: 38px;
            height: 38px;
            background: #f0fdf4;
            color: #16a34a;
            border: 1px solid #dcfce7;
          }

          .result-action-review:hover {
            border-color: #c7d2fe;
            background: #faf5ff;
            box-shadow: 0 4px 16px rgba(124, 58, 237, 0.1);
            transform: translateY(-2px);
          }

          .result-action-download:hover:not(:disabled) {
            border-color: #bbf7d0;
            background: #f0fdf4;
            box-shadow: 0 4px 16px rgba(22, 163, 74, 0.1);
            transform: translateY(-2px);
          }

          .result-action-review:active,
          .result-action-download:active:not(:disabled) {
            transform: scale(0.98);
          }

          .result-action-download:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none !important;
          }

          .result-btn-spinner {
            animation: spinActionIcon 0.9s linear infinite;
          }

          @keyframes spinActionIcon {
            100% { transform: rotate(360deg); }
          }

          /* Backwards-compatible aliases */
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

          /* Responsive adjustments for narrow screens */
          @media (max-width: 440px) {
            .result-action-rank {
              padding: 12px 14px;
            }
            .rank-icon-pill {
              width: 36px;
              height: 36px;
            }
            .result-action-title {
              font-size: 0.90rem;
            }
            .result-action-arrow-btn span {
              display: none;
            }
            .result-action-arrow-btn {
              padding: 6px 10px;
            }
            .result-action-review,
            .result-action-download {
              padding: 10px 10px;
              gap: 8px;
            }
            .review-icon-pill,
            .download-icon-pill {
              width: 32px;
              height: 32px;
            }
            .result-action-review .result-action-title,
            .result-action-download .result-action-title {
              font-size: 0.80rem;
            }
          }
        `}</style>

      <div className="result-main">

        {/* UNIFIED SCORECARD CONTAINER (1:1 with Download Template UI) */}
        <div className="scorecard-card" id="cbrank-scorecard-card">

          {/* Multiple Repeating Security Watermarks: CBT Rank */}
          <div className="scorecard-watermark-grid">
            {Array.from({ length: 12 }).map((_, i) => (
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
              {hasBonus && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Bonus (+):{' '}
                  <span
                    style={{
                      width: '56px',
                      background: '#fff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '3px 6px',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      color: '#0f172a',
                      display: 'inline-block',
                      boxSizing: 'border-box'
                    }}
                  >
                    {rightVal}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Subject-Wise Performance Table (Flush, Edge to Edge) */}
          <div className="scorecard-table-wrapper">
            <table className="scorecard-subject-table">
              <thead>
                <tr className="scorecard-subj-head">
                  <th className="scorecard-subj-th scorecard-sec-th scorecard-sec-name" style={{ textAlign: 'left' }}>Section</th>
                  <th className="scorecard-subj-th">
                    <span className="th-desktop-label">Total</span>
                    <span className="th-mobile-label">TQ</span>
                  </th>
                  <th className="scorecard-subj-th" style={{ color: '#4ade80' }}>
                    <span className="th-desktop-label">Right</span>
                    <span className="th-mobile-label">R</span>
                  </th>
                  <th className="scorecard-subj-th" style={{ color: '#f87171' }}>
                    <span className="th-desktop-label">Wrong</span>
                    <span className="th-mobile-label">W</span>
                  </th>
                  {hasBonus && (
                    <th className="scorecard-subj-th" style={{ color: '#c084fc' }}>
                      <span className="th-desktop-label">Bonus</span>
                      <span className="th-mobile-label">B</span>
                    </th>
                  )}
                  <th className="scorecard-subj-th" style={{ color: '#fbbf24' }}>
                    <span className="th-desktop-label">Skip</span>
                    <span className="th-mobile-label">S</span>
                  </th>
                  <th className="scorecard-subj-th scorecard-total-th" style={{ padding: '8px 10px', textAlign: 'right' }}>Total</th>
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

          {/* 5. Note / Legend Bar (Explaining TQ, R, W, S, B) */}
          <div className="scorecard-subj-legend">
            <span className="legend-title">*</span>
            <span className="legend-item"><strong style={{ color: '#2563eb' }}>TQ</strong> = Total Questions</span>
            <span className="legend-item"><strong style={{ color: '#16a34a' }}>R</strong> = Right</span>
            <span className="legend-item"><strong style={{ color: '#dc2626' }}>W</strong> = Wrong</span>
            <span className="legend-item"><strong style={{ color: '#d97706' }}>S</strong> = Skip</span>
            {hasBonus && (
              <span className="legend-item"><strong style={{ color: '#9333ea' }}>B</strong> = Bonus</span>
            )}
          </div>

        </div>
        {/* END OF BLUE-BORDERED SCORECARD CONTAINER */}

        {/* 6. Action Buttons Stack (Placed outside the scorecard container) */}
        <div className="scorecard-actions-panel no-print">
          {/* Primary Action Card: View Live Rank */}
          {APP_FEATURE_FLAGS.SHOW_VIEW_RANK && (
            <Link
              href="/rank"
              className="result-action-card result-action-rank"
              aria-label="View Your Live Rank"
            >
              <div className="result-action-content">
                <div className="result-action-icon-pill rank-icon-pill" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M6 5h12v4c0 3.31-2.69 6-6 6s-6-2.69-6-6V5z" />
                  </svg>
                </div>
                <div className="result-action-labels">
                  <div className="result-action-header">
                    <span className="result-action-title">View Live Rank</span>
                    <span className="result-live-badge">
                      <span className="result-live-dot" />
                      LIVE
                    </span>
                  </div>
                  <span className="result-action-subtitle">Check category, shift &amp; overall rank</span>
                </div>
              </div>
              <div className="result-action-arrow-btn" aria-hidden="true">
                <span>View Rank</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}

          {/* Secondary Duo Row: Review Answerkey & Download Scorecard */}
          <div className="result-actions-dual-grid app-btn-duo-row">
            {APP_FEATURE_FLAGS.SHOW_REVIEW_ANSWERKEY && (
              <Link
                href="/review-answerkey"
                className="result-action-card result-action-review app-btn-sub"
                aria-label="Review Answer Key Questions"
              >
                <div className="result-action-icon-pill review-icon-pill" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <span className="result-action-title">Review Answerkey</span>
              </Link>
            )}

            {APP_FEATURE_FLAGS.SHOW_DOWNLOAD_SCORECARD && (
              <button
                type="button"
                disabled={isGeneratingImg}
                onClick={handleDownloadImageScorecard}
                className="result-action-card result-action-download app-btn-sub"
                aria-label="Download Scorecard Image"
              >
                <div className="result-action-icon-pill download-icon-pill" aria-hidden="true">
                  {isGeneratingImg ? (
                    <svg className="result-btn-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                </div>
                <span className="result-action-title">
                  {isGeneratingImg ? 'Generating...' : 'Download Scorecard'}
                </span>
              </button>
            )}
          </div>
        </div>

      </div>
    </main>

    {/* ─────────────────────────────────────────────────────────── */}
    {/* ─────────────────────────────────────────────────────────── */}
    {/* Dedicated Full-Bleed Table Scorecard (1:1 Mobile Portrait)  */}
    {/* Captured by html2canvas when "Download Scorecard" is clicked */}
    {/* ─────────────────────────────────────────────────────────── */}
    <div
      id="cbrank-download-template"
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '380px',
        background: '#ffffff',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#0f172a',
        padding: 0,
        boxSizing: 'border-box',
        border: '5px solid #0044cc',
        borderRadius: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
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
          gridTemplateRows: 'repeat(6, 1fr)',
          gap: '24px 10px',
          alignItems: 'center',
          justifyItems: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 10,
          overflow: 'hidden',
          padding: '16px'
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              transform: 'rotate(-25deg)',
              fontSize: '0.98rem',
              fontWeight: 800,
              color: '#0044cc',
              opacity: 0.062,
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
          padding: '8px 14px',
          textAlign: 'center',
          borderBottom: '2.5px solid #0044cc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '44px'
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultData.headerImgUrl}
            alt="Exam Header Logo"
            style={{
              maxHeight: '55px',
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
          padding: '10px 14px',
          textAlign: 'center',
          borderBottom: '2.5px solid #0044cc'
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, lineHeight: 1.3, color: '#ffffff' }}>
            {resultData.headerBannerText || resultData.examName || 'CBT Competitive Examination'}
          </h2>
        </div>
      )}

      {/* 2. Candidate Examination Details Table (Edge to Edge, 2 Columns: Label | Value) */}
      <table style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        fontSize: '0.68rem',
        borderBottom: '2.5px solid #0044cc'
      }}>
        <tbody>
          {displayRows.map((row, idx) => {
            const isLast = idx === displayRows.length - 1;
            const isRoll = /roll|registration|id|participant\s*id|applicant/i.test(row.label);
            const isVenue = row.label.toLowerCase().includes('center') || row.label.toLowerCase().includes('venue');
            return (
              <tr key={idx} style={{ borderBottom: isLast ? 'none' : '1px solid #cbd5e1' }}>
                <th style={{
                  width: '36%',
                  background: '#f8fafc',
                  padding: '4.5px 8px',
                  textAlign: 'left',
                  fontWeight: 700,
                  color: '#475569',
                  fontSize: '0.67rem',
                  lineHeight: 1.3,
                  borderRight: '1px solid #cbd5e1',
                  boxSizing: 'border-box'
                }}>
                  {row.label}
                </th>
                <td style={{
                  width: '64%',
                  background: '#ffffff',
                  padding: '4.5px 8px',
                  fontWeight: isRoll ? 900 : 800,
                  color: isRoll ? '#0044cc' : '#0f172a',
                  fontFamily: isRoll ? 'monospace' : 'inherit',
                  textAlign: 'left',
                  fontSize: isVenue ? '0.63rem' : '0.68rem',
                  lineHeight: isVenue ? 1.25 : 1.3,
                  boxSizing: 'border-box',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere'
                }}>
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 3. Right (+) / Wrong (-) Marks Row (Clean Static Bar 1:1 with Mobile UI) */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        minHeight: '28px',
        padding: '0 10px',
        background: '#f8fafc',
        borderBottom: '1px solid #cbd5e1',
        boxSizing: 'border-box',
        fontSize: '0.74rem',
        fontWeight: 700,
        color: '#334155'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
          <span>Right (+):&nbsp;</span>
          <span style={{
            fontWeight: 800,
            fontSize: '0.74rem',
            color: '#0f172a',
            lineHeight: 1
          }}>
            {rightVal}
          </span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
          <span>Wrong (-):&nbsp;</span>
          <span style={{
            fontWeight: 800,
            fontSize: '0.74rem',
            color: '#0f172a',
            lineHeight: 1
          }}>
            {wrongVal}
          </span>
        </div>
        {hasBonus && (
          <div style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
            <span>Bonus (+):&nbsp;</span>
            <span style={{
              fontWeight: 800,
              fontSize: '0.74rem',
              color: '#0f172a',
              lineHeight: 1
            }}>
              {rightVal}
            </span>
          </div>
        )}
      </div>

      {/* 4. Subject-Wise Performance Table (Edge to Edge, 1:1 Mobile Portrait) */}
      <table style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        fontSize: '0.70rem',
        textAlign: 'center',
        borderBottom: '1px solid #cbd5e1'
      }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#ffffff', fontWeight: 800, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            <th style={{ width: '36%', padding: '6px 6px', textAlign: 'left', borderRight: '1px solid #334155', boxSizing: 'border-box' }}>Section</th>
            <th style={{ padding: '6px 3px', borderRight: '1px solid #334155', fontWeight: 900, fontSize: '0.76rem', letterSpacing: '0.02em', boxSizing: 'border-box' }}>TQ</th>
            <th style={{ padding: '6px 3px', color: '#4ade80', borderRight: '1px solid #334155', fontWeight: 900, fontSize: '0.76rem', letterSpacing: '0.02em', boxSizing: 'border-box' }}>R</th>
            <th style={{ padding: '6px 3px', color: '#f87171', borderRight: '1px solid #334155', fontWeight: 900, fontSize: '0.76rem', letterSpacing: '0.02em', boxSizing: 'border-box' }}>W</th>
            {hasBonus && (
              <th style={{ padding: '6px 3px', color: '#c084fc', borderRight: '1px solid #334155', fontWeight: 900, fontSize: '0.76rem', letterSpacing: '0.02em', boxSizing: 'border-box' }}>B</th>
            )}
            <th style={{ padding: '6px 3px', color: '#fbbf24', borderRight: '1px solid #334155', fontWeight: 900, fontSize: '0.76rem', letterSpacing: '0.02em', boxSizing: 'border-box' }}>S</th>
            <th style={{ width: '16%', padding: '6px 3px', textAlign: 'right', boxSizing: 'border-box' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {resultData.sections.map((sec, idx) => {
            const sm = calcSectionMarks(sec, rightVal, wrongVal, fallbackBonus);
            return (
              <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ width: '36%', padding: '6px 6px', textAlign: 'left', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #cbd5e1', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: '0.69rem', lineHeight: 1.25, boxSizing: 'border-box' }}>{sec.name}</td>
                <td style={{ padding: '6px 3px', fontWeight: 700, borderRight: '1px solid #cbd5e1', boxSizing: 'border-box' }}>{sec.total}</td>
                <td style={{ padding: '6px 3px', fontWeight: 800, color: '#16a34a', borderRight: '1px solid #cbd5e1', boxSizing: 'border-box' }}>{sec.correct}</td>
                <td style={{ padding: '6px 3px', fontWeight: 800, color: '#dc2626', borderRight: '1px solid #cbd5e1', boxSizing: 'border-box' }}>{sec.wrong}</td>
                {hasBonus && (
                  <td style={{ padding: '6px 3px', fontWeight: 800, color: '#9333ea', borderRight: '1px solid #cbd5e1', boxSizing: 'border-box' }}>{sec.bonus !== undefined ? sec.bonus : fallbackBonus}</td>
                )}
                <td style={{ padding: '6px 3px', fontWeight: 700, color: '#d97706', borderRight: '1px solid #cbd5e1', boxSizing: 'border-box' }}>{sec.unattempted}</td>
                <td style={{ width: '16%', padding: '6px 3px', textAlign: 'right', fontWeight: 900, color: sm >= 0 ? '#0f172a' : '#dc2626', boxSizing: 'border-box' }}>
                  {sm.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: '#eff6ff', borderTop: '2.5px solid #3b82f6', fontWeight: 900 }}>
            <td style={{ width: '36%', padding: '7px 6px', textAlign: 'left', color: '#1e3a8a', borderRight: '1px solid #cbd5e1', fontSize: '0.71rem', boxSizing: 'border-box' }}>TOTAL</td>
            <td style={{ padding: '7px 3px', color: '#0f172a', borderRight: '1px solid #cbd5e1', fontSize: '0.71rem', boxSizing: 'border-box' }}>{totalQuestions}</td>
            <td style={{ padding: '7px 3px', color: '#16a34a', borderRight: '1px solid #cbd5e1', fontSize: '0.71rem', boxSizing: 'border-box' }}>{totalRight}</td>
            <td style={{ padding: '7px 3px', color: '#dc2626', borderRight: '1px solid #cbd5e1', fontSize: '0.71rem', boxSizing: 'border-box' }}>{totalWrong}</td>
            {hasBonus && (
              <td style={{ padding: '7px 3px', color: '#9333ea', borderRight: '1px solid #cbd5e1', fontSize: '0.71rem', boxSizing: 'border-box' }}>{totalBonus}</td>
            )}
            <td style={{ padding: '7px 3px', color: '#d97706', borderRight: '1px solid #cbd5e1', fontSize: '0.71rem', boxSizing: 'border-box' }}>{totalUnattempted}</td>
            <td style={{ width: '16%', padding: '7px 3px', textAlign: 'right', color: raw >= 0 ? '#0044cc' : '#dc2626', fontSize: '0.78rem', fontFamily: 'monospace', boxSizing: 'border-box' }}>
              {raw.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* 4. Note / Legend Bar (Explaining TQ, R, W, S, B) */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '6px 8px',
        background: '#f8fafc',
        fontSize: '0.68rem',
        color: '#475569',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px 8px',
        lineHeight: 1.4,
        boxSizing: 'border-box'
      }}>
        <span style={{ fontWeight: 900, color: '#1e293b', fontSize: '0.88rem', lineHeight: 1 }}>*</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><strong style={{ color: '#2563eb' }}>TQ</strong> = Total Questions</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><strong style={{ color: '#16a34a' }}>R</strong> = Right</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><strong style={{ color: '#dc2626' }}>W</strong> = Wrong</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><strong style={{ color: '#d97706' }}>S</strong> = Skip</span>
        {hasBonus && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><strong style={{ color: '#9333ea' }}>B</strong> = Bonus</span>
        )}
      </div>
    </div>
    </>
  );
}
