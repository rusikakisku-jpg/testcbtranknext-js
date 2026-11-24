'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { processAnswerKeyAction, logUserRankAction, logValidUrlAction, fetchLiveRankAction } from '../actions/calculate';
import { cbtSave, cbtGet, cbtRemove, cbtSaveString, cbtGetString, STORAGE_KEYS } from '../utils/storage';
import { addToSearchHistory } from '../utils/history';
import { trackEvent } from './GoogleAnalytics';
import { AdBanner } from './GoogleAdSense';
import { ADSENSE_CONFIG } from '../config/adsense';
import { CustomField } from '../data/exams';

function parseCustomFieldsData(raw: any): CustomField[] {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s || s === '[]' || s === '{}' || s === 'null') return [];
    try {
      parsed = JSON.parse(s);
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((f: any) => f && typeof f === 'object' && (f.id || f.name) && (f.label || f.title))
    .map((f: any) => ({
      id: String(f.id || f.name).trim(),
      label: String(f.label || f.title).trim(),
      type: (f.type === 'number' || f.type === 'text' || f.type === 'select') ? f.type : 'select',
      options: Array.isArray(f.options) ? f.options : [],
      placeholder: f.placeholder ? String(f.placeholder) : undefined,
      required: Boolean(f.required),
      depends_on: f.depends_on && typeof f.depends_on === 'object' ? f.depends_on : undefined,
    }));
}

function normalizeOption(opt: any): { value: string; label: string } {
  if (typeof opt === 'string') {
    return { value: opt, label: opt };
  }
  if (opt && typeof opt === 'object') {
    const val = String(opt.value ?? opt.label ?? '');
    const lbl = String(opt.label ?? opt.value ?? '');
    return { value: val, label: lbl };
  }
  return { value: '', label: '' };
}

const DEFAULT_RRB_ZONES = [
  "Ahmedabad", "Ajmer", "Prayagraj (Allahabad)", "Bengaluru (Bangalore)", "Bhopal", 
  "Bhubaneswar", "Bilaspur", "Chandigarh", "Chennai", "Gorakhpur", "Guwahati", 
  "Jammu Srinagar", "Kolkata", "Malda", "Mumbai", "Muzaffarpur", "Patna", 
  "Ranchi", "Secunderabad", "Siliguri", "Thiruvananthapuram"
];

const DEFAULT_STATES = [
  "Andaman & Nicobar", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra & Nagar Haveli and Daman & Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
];

const DEFAULT_LANGUAGES = [
  "Assamese", "Bengali", "English", "Gujarati", "Hindi", "Kannada", 
  "Malayalam", "Marathi", "Odia", "Punjabi", "Tamil", "Telugu", "Urdu"
];

function parseLocationData(rawLoc: string[] | string | undefined | null, locType: string | undefined): { label: string; list: string[] } {
  let label = (locType && typeof locType === 'string' && locType.trim()) ? locType.trim() : 'State / UT';
  if (label === 'States/UT' || label === 'State/UT' || label === 'States / UT') {
    label = 'State / UT';
  }

  let list: string[] = [];
  if (Array.isArray(rawLoc)) {
    list = rawLoc.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof rawLoc === 'string' && rawLoc.trim()) {
    const s = rawLoc.trim();
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) list = parsed.map((x: any) => String(x).trim()).filter(Boolean);
      } catch (e) {}
    }
    if (list.length === 0 && s.includes(',')) {
      list = s.split(',').map(x => x.trim()).filter(Boolean);
    } else if (list.length === 0 && s) {
      list = [s];
    }
  }

  const isAllIndia = list.length === 1 && list[0].toLowerCase() === 'all india';
  if (list.length === 0 || isAllIndia) {
    if (label.toLowerCase().includes('rrb') || label.toLowerCase().includes('railway') || label.toLowerCase().includes('zone')) {
      list = DEFAULT_RRB_ZONES;
    } else {
      list = DEFAULT_STATES;
    }
  }

  return { label, list };
}

function urlHasHtmlExtension(raw: string): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
    return /\.html$/i.test(parsed.pathname);
  } catch (e) {
    return /\.html$/i.test(raw.split('?')[0].split('#')[0]);
  }
}

function isDigialmHost(raw: string): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
    const host = (parsed.hostname || '').toLowerCase();
    const fullUrl = raw.toLowerCase();

    return host === 'digialm.com' || host.endsWith('.digialm.com') ||
           host === 'tcsion.com' || host.endsWith('.tcsion.com') ||
           fullUrl.includes('assessmentqp') || fullUrl.includes('touchstone') || fullUrl.includes('per/g');
  } catch (e) { return false; }
}

function isCbexamsHost(raw: string): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
    const host = (parsed.hostname || '').toLowerCase();
    return host === 'cbexams.com' || host.endsWith('.cbexams.com');
  } catch (e) { return false; }
}

interface ParseResult {
  correctCount: number;
  wrongCount: number;
  bonusCount?: number;
  rawBonusQuestions?: string | number;
  unattemptedCount: number;
  marks_obtained?: number;
  candidateName: string;
  rollNo: string;
  testDate: string;
  testTime: string;
  testCenter: string;
  examName: string;
  examId?: string;
  exam_info?: any;
  headerImgUrl: string;
  headerBannerText?: string;
  infoRows: Array<{ label: string; value: string }>;
  sections: Array<{ name: string; total: number; correct: number; wrong: number; bonus?: number; unattempted: number; marks_obtained?: number }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  questionsSummary?: Array<any>;
}

function cleanCandidateVal(raw: any): string {
  if (raw === undefined || raw === null) return '';
  return String(raw).replace(/^[:\s-]+/, '').trim();
}

// Normalize JSON data received from parser clusters (DigiALM & CBExams)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSmartApiResponse(data: any, baseUrl: string): ParseResult {
  const info = data.candidate_info || {};
  const score = data.score_summary || {};
  const secSummary = data.section_summary || {};
  
  const candidateName = cleanCandidateVal(info['Applicant Name'] || info['Candidate Name'] || info["Candidate's Name"] || info['Participant Name'] || info['Name'] || data.candidateName || data.candidate_name || data.CandidateName || data.name || 'Verified Candidate');
  const rollNo = cleanCandidateVal(info['Roll Number'] || info['Roll No'] || info['Roll No.'] || info['Registration Number'] || info['Registration No'] || info['Application Id'] || info['Application ID'] || info['Participant ID'] || info['Candidate ID'] || info['User ID'] || data.rollNo || data.roll_no || data.rollNumber || data.registrationNo || Object.entries(info).find(([k]) => /roll|registration|participant\s*id|candidate\s*id|user\s*id|appl(ication)?\s*(id|no)|ticket/i.test(k))?.[1] || data.exam_info?.user_id || '');
  const testDate = cleanCandidateVal(info['Test Date'] || info['Exam Date'] || info['Date of Exam'] || data.testDate || data.exam_info?.exam_date || '');
  const testTime = cleanCandidateVal(info['Test Time'] || info['Test Time and Shift'] || info['Exam Time'] || info['Shift'] || info['Shift Timing'] || data.testTime || data.exam_info?.exam_time || '');
  const testCenter = cleanCandidateVal(info['Test Centre Name'] || info['Test Center Name'] || info['Test Centre'] || info['Centre Name'] || info['Center Name'] || info['Venue'] || data.testCenter || '');
  const rawExamName = info['Exam Level'] || info['Subject'] || info['Assessment Name'] || info['Post Name'] || info['Exam Name'] || info['Exam'] || data.header_banner_text || data.exam_info?.detected_exam_name || data.examName || '';
  const examName = cleanCandidateVal(rawExamName).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const examId = cleanCandidateVal(data.exam_info?.exam_id || data.exam_id || '');
  const headerImgUrl = data.header_banner_img || data.header_image || data.headerImgUrl || data.logo || '';
  const headerBannerText = data.header_banner_text || data.headerBannerText || examName || '';
  const questionsSummary = data.questions_summary || data.questions || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections: Array<{ name: string; total: number; correct: number; wrong: number; bonus?: number; unattempted: number; marks_obtained?: number }> = [];

  // Parse section_summary object map or sections array
  if (typeof secSummary === 'object' && secSummary !== null && Object.keys(secSummary).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(secSummary).forEach(([secName, secObj]: [string, any]) => {
      if (secObj && typeof secObj === 'object') {
        const correct = Number(secObj.correct_answers ?? secObj.correct ?? 0);
        const wrong = Number(secObj.wrong_answers ?? secObj.wrong ?? 0);
        const unattempted = Number(secObj.unattempted ?? 0);
        const bonus = Number(secObj.bonus_questions ?? secObj.bonus ?? 0);
        const total = Number(secObj.total_questions ?? secObj.total ?? (correct + wrong + unattempted));
        const secMarks = (secObj.marks_obtained !== undefined && secObj.marks_obtained !== null && !isNaN(Number(secObj.marks_obtained)))
          ? Number(secObj.marks_obtained)
          : (secObj.score !== undefined && !isNaN(Number(secObj.score)) ? Number(secObj.score) : undefined);
        sections.push({ name: secName, total, correct, wrong, bonus, unattempted, marks_obtained: secMarks });
      }
    });
  } else if (Array.isArray(data.sections)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sections.push(...data.sections.map((sec: any, idx: number) => ({
      name: sec.name || sec.section_name || `Section ${idx + 1}`,
      total: Number(sec.total ?? sec.total_questions ?? 0),
      correct: Number(sec.correct ?? sec.correct_answers ?? 0),
      wrong: Number(sec.wrong ?? sec.wrong_answers ?? 0),
      bonus: Number(sec.bonus ?? sec.bonus_questions ?? 0),
      unattempted: Number(sec.unattempted ?? 0),
      marks_obtained: (sec.marks_obtained !== undefined && sec.marks_obtained !== null && !isNaN(Number(sec.marks_obtained)))
        ? Number(sec.marks_obtained)
        : (sec.score !== undefined && !isNaN(Number(sec.score)) ? Number(sec.score) : undefined)
    })));
  }

  const rawBonus = score.bonus_questions ?? data.bonus_questions ?? data.score_summary?.bonus_questions ?? '';
  const bonusCount = (rawBonus !== '' && rawBonus !== null && rawBonus !== undefined && !isNaN(Number(rawBonus))) ? Number(rawBonus) : 0;

  let correctCount = Number(score.correct_answers ?? score.correct ?? data.correct_answers ?? data.correct ?? data.correctCount ?? 0);
  let wrongCount = Number(score.wrong_answers ?? score.wrong ?? data.wrong_answers ?? data.wrong ?? data.wrongCount ?? 0);
  let unattemptedCount = Number(score.unattempted ?? data.unattempted ?? data.unattemptedCount ?? 0);

  if (correctCount === 0 && wrongCount === 0 && sections.length > 0) {
    sections.forEach(s => {
      correctCount += s.correct;
      wrongCount += s.wrong;
      unattemptedCount += s.unattempted;
    });
  }

  const apiTotalMarks = score.marks_obtained ??
    data.marks_obtained ??
    score.total_marks_obtained ??
    score.score ??
    score.total_marks ??
    data.score ??
    data.total_marks;

  const marks_obtained = (apiTotalMarks !== undefined && apiTotalMarks !== null && !isNaN(Number(apiTotalMarks)))
    ? Number(apiTotalMarks)
    : undefined;

  const infoRows: Array<{ label: string; value: string }> = [];
  if (typeof info === 'object' && info !== null && Object.keys(info).length > 0) {
    Object.entries(info).forEach(([label, value]) => {
      const cleanVal = cleanCandidateVal(value);
      if (cleanVal !== '') {
        const cleanLabel = /community|caste/i.test(label) ? 'Community' : label.replace(/^[:\s-]+/, '').replace(/[:\s-]+$/, '').trim();
        infoRows.push({ label: cleanLabel, value: cleanVal });
      }
    });
  } else {
    if (candidateName) infoRows.push({ label: 'Candidate Name', value: candidateName });
    if (rollNo) infoRows.push({ label: 'Roll Number', value: rollNo });
    if (testDate) infoRows.push({ label: 'Test Date', value: testDate });
    if (testTime) infoRows.push({ label: 'Test Time', value: testTime });
    if (testCenter) infoRows.push({ label: 'Test Center', value: testCenter });
    if (examName) infoRows.push({ label: 'Subject', value: examName });
  }

  return {
    correctCount,
    wrongCount,
    bonusCount,
    rawBonusQuestions: rawBonus,
    unattemptedCount,
    marks_obtained,
    candidateName,
    rollNo,
    testDate,
    testTime,
    testCenter,
    examName,
    examId,
    exam_info: data.exam_info,
    headerImgUrl,
    headerBannerText,
    infoRows,
    sections,
    questionsSummary
  };
}

// ─────────────────────────────────────────────────────────────────
// Props: examSlug = the URL slug (e.g. "osssc-ri-ari-amin-icds-sfs-junior-assistant")
function formatExamSlugTitle(slug: string): string {
  if (!slug) return 'Answer Key Calculator';
  const formatted = slug
    .split('-')
    .map((w: string) => {
      const upper = w.toUpperCase();
      if (['RRB', 'SSC', 'NTPC', 'CBT', 'UG', 'JE', 'CHSL', 'CGL', 'MTS', 'GD', 'OSSSC', 'OSSC', 'RI', 'ARI', 'AMIN', 'SFS', 'ICDS', 'AWO', 'TPO', 'ASI', 'SI'].includes(upper)) {
        return upper;
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
  return `${formatted} Answer Key Calculator`;
}

interface AnswerkeyCalculatorProps {
  examSlug?: string;
  initialTitle?: string;
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
  initialMarksRight?: number | string;
  initialMarksWrong?: number | string;
  initialLocationType?: string;
  initialLocations?: string[] | string;
  initialDescription?: string;
  initialCustomFields?: CustomField[] | string;
}

export default function AnswerkeyCalculator({
  examSlug = '',
  initialTitle = '',
  sidebar,
  children,
  initialMarksRight,
  initialMarksWrong,
  initialLocationType,
  initialLocations,
  initialDescription = '',
  initialCustomFields,
}: AnswerkeyCalculatorProps) {
  const router = useRouter();

  const initialParsed = parseLocationData(initialLocations, initialLocationType);
  const defaultBannerTitle = initialTitle || formatExamSlugTitle(examSlug);
  const [bannerTitle, setBannerTitle] = useState(defaultBannerTitle);
  const [bannerSub, setBannerSub] = useState('Paste your official answer key URL and add your exam details.');
  const [customDescription, setCustomDescription] = useState<string>(initialDescription || '');
  const [customFields, setCustomFields] = useState<CustomField[]>(() => parseCustomFieldsData(initialCustomFields));
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<string[]>(initialParsed.list);
  const [locationLabel, setLocationLabel] = useState(initialParsed.label);
  const [locationLoading, setLocationLoading] = useState(false);
  const [languages, setLanguages] = useState<string[]>(DEFAULT_LANGUAGES);
  const [langLoading, setLangLoading] = useState(false);
  const [showHtmlPaste, setShowHtmlPaste] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error');
  const [toastVisible, setToastVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [btnText, setBtnText] = useState('Calculate Marks & Rank');
  const [progressStep, setProgressStep] = useState(0); // 0=idle 1=fetching 2=parsing 3=ranking 4=saving
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialDescription !== undefined) {
      setCustomDescription(initialDescription || '');
    }
  }, [initialDescription]);

  useEffect(() => {
    if (initialCustomFields !== undefined) {
      setCustomFields(parseCustomFieldsData(initialCustomFields));
    }
  }, [initialCustomFields]);

  const [formData, setFormData] = useState({
    ans_key_url: '',
    ans_key_html: '',
    category: '',
    horizontal_category: 'none',
    gender: '',
    paper_language: '',
    state: '',
    consent: false,
  });

  function showToast(msg: string, type: 'error' | 'success' | 'info' = 'error') {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 4000);
  }

  const [pastedStatus, setPastedStatus] = useState(false);

  async function handlePasteUrl() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setFormData(prev => ({ ...prev, ans_key_url: text.trim() }));
          setPastedStatus(true);
          setTimeout(() => setPastedStatus(false), 2000);
          return;
        } else {
          showToast('Clipboard is empty or does not contain text.', 'info');
        }
      } else {
        const inputEl = document.getElementById('ans_key_url') as HTMLInputElement | null;
        if (inputEl) {
          inputEl.focus();
        }
        showToast('Clipboard reading not supported. Please paste directly into the box.', 'info');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
      const inputEl = document.getElementById('ans_key_url') as HTMLInputElement | null;
      if (inputEl) {
        inputEl.focus();
      }
      showToast('Clipboard permission denied. Please paste directly into the box.', 'info');
    }
  }

  // Apply exam object data to form state
  function applyExamData(examObj: Record<string, unknown>, slug: string) {
    const title = (examObj.title as string) || '';
    const subtitle = (examObj.subtitle as string) || `Paste your ${title || 'exam'} official answer key URL and add your exam details.`;
    const parsed = parseLocationData(examObj.location_id as any, examObj.location_type_id as string);
    
    if (title) {
      setBannerTitle(title.toLowerCase().includes('answer key') ? title : `${title} Answer Key Calculator`);
    } else {
      setBannerTitle(defaultBannerTitle);
    }
    setBannerSub(subtitle);
    setLocationLabel(parsed.label);
    setLocations(parsed.list);
    setLocationLoading(false);

    if (examObj.description !== undefined && examObj.description !== null) {
      setCustomDescription(String(examObj.description));
    }

    if (examObj.custom_fields !== undefined && examObj.custom_fields !== null) {
      setCustomFields(parseCustomFieldsData(examObj.custom_fields));
    }

    // Save default exam marking scheme if provided
    if (examObj.marks_right !== undefined) {
      cbtSaveString(STORAGE_KEYS.MARKS_RIGHT, String(examObj.marks_right));
    }
    if (examObj.marks_wrong !== undefined) {
      cbtSaveString(STORAGE_KEYS.MARKS_WRONG, String(examObj.marks_wrong));
    }
  }

  useEffect(() => {
    if (!examSlug) {
      // Generic /answerkey page — clear old exam marking cache and load default locations (State / UT)
      cbtRemove(STORAGE_KEYS.MARKS_RIGHT);
      cbtRemove(STORAGE_KEYS.MARKS_WRONG);
      cbtRemove(STORAGE_KEYS.ACTIVE_EXAM);
      setLocations(DEFAULT_STATES);
      setLocationLabel('State / UT');
      setCustomDescription('');
      setCustomFields([]);
      setCustomFieldValues({});
      return;
    }

    if (initialMarksRight !== undefined && initialMarksRight !== null && initialMarksRight !== '') {
      cbtSaveString(STORAGE_KEYS.MARKS_RIGHT, String(initialMarksRight));
    }
    if (initialMarksWrong !== undefined && initialMarksWrong !== null && initialMarksWrong !== '') {
      cbtSaveString(STORAGE_KEYS.MARKS_WRONG, String(initialMarksWrong));
    }

    // 1. If backend location_type_id was provided directly via SSR props, apply it
    if (initialLocationType !== undefined) {
      const parsed = parseLocationData(initialLocations, initialLocationType);
      setLocationLabel(parsed.label);
      setLocations(parsed.list);
      return;
    }

    // 2. Exam-specific page — try localStorage cache (0ms)
    try {
      const cachedExam = cbtGet<any>(STORAGE_KEYS.ACTIVE_EXAM);
      if (cachedExam && cachedExam.slug === examSlug) {
        applyExamData(cachedExam, examSlug);
        return;
      }
    } catch (e) {}

    // 3. If someone runs/opens a slug URL directly without initial props, fetch fresh from backend API by slug
    setLocationLoading(true);
    fetch(`https://api.cbtrank.com/exams?slug=${encodeURIComponent(examSlug)}`)
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json && json.success && json.data) {
          applyExamData(json.data, examSlug);
        }
      })
      .catch(() => {})
      .finally(() => setLocationLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examSlug, initialMarksRight, initialMarksWrong, initialLocationType, initialLocations]);

  function isCustomFieldVisible(field: CustomField): boolean {
    if (!field.depends_on) return true;
    const parentVal = (customFieldValues[field.depends_on.field] || '').trim().toLowerCase();
    if (Array.isArray(field.depends_on.value)) {
      return field.depends_on.value.some(v => String(v).trim().toLowerCase() === parentVal);
    }
    return String(field.depends_on.value).trim().toLowerCase() === parentVal;
  }

  const visibleCustomFields = customFields.filter(isCustomFieldVisible);

  function handleCustomFieldChange(fieldId: string, val: string) {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: val
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let urlVal = formData.ans_key_url.trim().replace(/#.*$/, '');
    const { category, gender, state, consent } = formData;

    if (!urlVal || !category || !gender || !state || !consent) {
      showToast('Please fill all required fields (URL, Category, Gender, State / UT).');
      return;
    }

    for (const field of visibleCustomFields) {
      if (field.required) {
        const val = (customFieldValues[field.id] || '').trim();
        if (!val) {
          showToast(`Please ${field.type === 'select' ? 'select' : 'enter'} ${field.label}.`);
          return;
        }
      }
    }

    const derivedSubType = (customFieldValues['sub_type'] || customFieldValues['trade'] || customFieldValues['branch'] || customFieldValues['stream'] || customFieldValues['paper'] || '').trim();

    if (!/^https?:\/\//i.test(urlVal)) urlVal = 'https://' + urlVal;
    try {
      const parsed = new URL(urlVal);
      parsed.pathname = parsed.pathname.replace(/\/+/g, '/');
      urlVal = parsed.toString();
    } catch (e) {}

    setSubmitting(true);
    setBtnText('Processing...');
    setProgressStep(1); // Step 1: Fetching answer key

    let parsedResult: ParseResult | null = null;
    let rawSmartData: any = null;

    try {
      let actionRes: any = null;
      const savedRightBefore = cbtGetString(STORAGE_KEYS.MARKS_RIGHT);
      const savedWrongBefore = cbtGetString(STORAGE_KEYS.MARKS_WRONG);
      const marksRightParam = (savedRightBefore !== null && savedRightBefore !== undefined && savedRightBefore !== '')
        ? savedRightBefore
        : (initialMarksRight !== undefined && initialMarksRight !== null && initialMarksRight !== '' ? String(initialMarksRight) : '');
      const marksWrongParam = (savedWrongBefore !== null && savedWrongBefore !== undefined && savedWrongBefore !== '')
        ? savedWrongBefore
        : (initialMarksWrong !== undefined && initialMarksWrong !== null && initialMarksWrong !== '' ? String(initialMarksWrong) : '');

      try {
        const apiRes = await fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: urlVal,
            category,
            gender,
            state,
            examSlug,
            marks_right: marksRightParam,
            marks_wrong: marksWrongParam,
          })
        });
        if (apiRes.ok) {
          actionRes = await apiRes.json();
        }
      } catch (apiErr) {}

      if (!actionRes) {
        actionRes = await processAnswerKeyAction({
          url: urlVal,
          category,
          gender,
          state,
          examSlug,
          marks_right: marksRightParam,
          marks_wrong: marksWrongParam,
        });
      }

      if (actionRes && actionRes.success && actionRes.data) {
        rawSmartData = actionRes.data;
        setProgressStep(2); // Step 2: Parsing data
        parsedResult = normalizeSmartApiResponse(actionRes.data, urlVal);
      } else {
        showToast('Invalid or broken link. Please check your Answer Key URL and retry.');
        setSubmitting(false);
        setBtnText('Calculate Marks & Rank');
        setProgressStep(0);
        return;
      }
    } catch (err) {
      showToast('Invalid or broken link. Please check your Answer Key URL and retry.');
      setSubmitting(false);
      setBtnText('Calculate Marks & Rank');
      setProgressStep(0);
      return;
    }

    if (!parsedResult) {
      showToast('Invalid or broken link. Please check your Answer Key URL and retry.');
      setSubmitting(false);
      setBtnText('Calculate Marks & Rank');
      setProgressStep(0);
      return;
    }

    // Valid URL and User rank are securely processed server-side

    let domainHost = '';
    try { domainHost = new URL(urlVal).hostname; } catch (e) {}
    const userRoll = (rawSmartData?.exam_info?.user_id) || (parsedResult.rollNo) || (parsedResult.candidateName) || '';
    const examPaperCode = (rawSmartData?.exam_info?.exam_id) || (parsedResult.examId) || '';
    const testExamDate = (rawSmartData?.exam_info?.exam_date) || (parsedResult.testDate) || '';
    const testExamTime = (rawSmartData?.exam_info?.exam_time) || (parsedResult.testTime) || '';
    const apiRight = rawSmartData?.exam_info?.marking_scheme_applied?.marks_right;
    const apiWrong = rawSmartData?.exam_info?.marking_scheme_applied?.marks_wrong;

    const savedRight = cbtGetString(STORAGE_KEYS.MARKS_RIGHT);
    const savedWrong = cbtGetString(STORAGE_KEYS.MARKS_WRONG);

    // Prioritize official marking scheme from exam_info.marking_scheme_applied
    const marksRight = (apiRight !== undefined && apiRight !== null && apiRight !== '')
      ? Number(apiRight)
      : ((savedRight !== null && savedRight !== undefined && savedRight !== '')
        ? parseFloat(savedRight)
        : (initialMarksRight !== undefined && initialMarksRight !== null && initialMarksRight !== '' ? Number(initialMarksRight) : 1));

    const marksWrong = (apiWrong !== undefined && apiWrong !== null && apiWrong !== '')
      ? Number(apiWrong)
      : ((savedWrong !== null && savedWrong !== undefined && savedWrong !== '')
        ? parseFloat(savedWrong)
        : (initialMarksWrong !== undefined && initialMarksWrong !== null && initialMarksWrong !== '' ? Number(initialMarksWrong) : 0));

    // Save official applied marking scheme so result page displays it
    try {
      cbtSaveString(STORAGE_KEYS.MARKS_RIGHT, String(marksRight));
      cbtSaveString(STORAGE_KEYS.MARKS_WRONG, String(marksWrong));
    } catch (e) {}

    // Score obtained: Directly use "marks_obtained" from API response!
    const effectiveBonus = parsedResult.bonusCount || 0;
    const rawScoreVal = (parsedResult.marks_obtained !== undefined && parsedResult.marks_obtained !== null && !isNaN(Number(parsedResult.marks_obtained)))
      ? Number(parsedResult.marks_obtained)
      : (((parsedResult.correctCount + effectiveBonus) * marksRight) - (parsedResult.wrongCount * marksWrong));

    // Safely log candidate ranking data into user_ranks table asynchronously
    try {
      const rankPayload = {
        user_id: userRoll,
        url: urlVal,
        exam_slug: examSlug || 'general',
        paper_language: formData.paper_language || 'English',
        url_hash: '',
        total_marks: rawScoreVal,
        exam_date: testExamDate,
        exam_time: testExamTime,
        exam_id: examPaperCode,
        location: state || '',
        gender: gender || '',
        category: category || '',
        domain: domainHost,
        sub_type: derivedSubType,
        custom_data: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined
      };

      try {
        await fetch('/api/log-rank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify(rankPayload)
        });
      } catch (err) {
        try {
          await logUserRankAction(rankPayload);
        } catch (e) {}
      }

      // Ensure valid answer key URL is also double-persisted in D1
      logValidUrlAction(urlVal).catch(() => {});
    } catch (e) {}

    setProgressStep(3); // Step 3: Fetching live rank
    let liveRankObj: any = null;
    try {
      const livePayload = {
        examId: examPaperCode,
        examSlug: examSlug || '',
        examDate: testExamDate,
        examTime: testExamTime,
        category: category || 'UR',
        gender: gender || '',
        totalMarks: rawScoreVal,
        userId: userRoll,
        url: urlVal,
        subType: derivedSubType
      };

      try {
        const liveFetch = await fetch('/api/live-rank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(livePayload)
        });
        if (liveFetch.ok) {
          const liveJson = await liveFetch.json();
          if (liveJson && liveJson.success && liveJson.data) {
            liveRankObj = liveJson.data;
          }
        }
      } catch (e) {}

      if (!liveRankObj) {
        const liveRes = await fetchLiveRankAction(livePayload);
        if (liveRes && liveRes.success && liveRes.data) {
          liveRankObj = liveRes.data;
        }
      }
    } catch (e) {}

    setProgressStep(4); // Step 4: Saving & redirecting
    const overallRank = liveRankObj ? liveRankObj.overallRank : 1;
    const shiftRank = liveRankObj ? liveRankObj.shiftRank : 1;
    const categoryRank = liveRankObj ? liveRankObj.categoryRank : 1;
    const genderRank = liveRankObj ? (liveRankObj.genderRank || 1) : 1;

    const isDigialm = isDigialmHost(urlVal);
    const isCbexams = isCbexamsHost(urlVal);
    const providerType = isDigialm ? 'Digialm' : (isCbexams ? 'CBExams' : 'Official Portal');

    try {
      const finalFormData = {
        ans_key_url: urlVal,
        category,
        horizontal_category: formData.horizontal_category,
        gender,
        state,
        location_label: locationLabel,
        paper_language: formData.paper_language,
        provider_type: providerType,
        marks_right: marksRight,
        marks_wrong: marksWrong,
        exam_slug: examSlug || 'general',
        exam_id: examPaperCode,
        sub_type: derivedSubType,
        custom_data: customFieldValues
      };
      const finalResultData = {
        ...parsedResult,
        marks_obtained: rawScoreVal,
        raw_score: rawScoreVal,
        examId: examPaperCode,
        exam_info: rawSmartData?.exam_info || parsedResult.exam_info,
        marks_right: marksRight,
        marks_wrong: marksWrong,
        gender: gender || '',
        category: category || '',
        overallRank, shiftRank, categoryRank, genderRank,
        totalOverall: liveRankObj?.totalOverall || (overallRank <= 1 ? 1 : overallRank),
        totalShift: liveRankObj?.totalShift || (shiftRank <= 1 ? 1 : shiftRank),
        totalCategory: liveRankObj?.totalCategory || (categoryRank <= 1 ? 1 : categoryRank),
        totalGender: liveRankObj?.totalGender || (genderRank <= 1 ? 1 : genderRank),
        subTypeRank: liveRankObj?.subTypeRank,
        totalSubType: liveRankObj?.totalSubType,
        subType: derivedSubType || liveRankObj?.subType || '',
        custom_data: customFieldValues,
        liveRank: liveRankObj,
      };

      cbtSave(STORAGE_KEYS.FORM_DATA, finalFormData);
      cbtSave(STORAGE_KEYS.RESULT_DATA, finalResultData);
      cbtSaveString(STORAGE_KEYS.SHOW_TG_POPUP, 'true');
      addToSearchHistory(finalResultData, finalFormData, marksRight, marksWrong);
    } catch (e) {}

    trackEvent('calculate_score', {
      exam_slug: examSlug || 'general',
      category: category || '',
      gender: gender || '',
    });

    router.push('/result');
  }

  const hasCustomDescription = Boolean(customDescription && customDescription.trim().length > 0);

  return (
    <main>
      <div className="answerkey-main">

        {/* Toast */}
        <div className={`toast-container${toastVisible ? ' show' : ''}`} id="toast-container">
          <div className="toast-box">
            <div className="toast-icon">
              {toastType === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : toastType === 'info' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p className="toast-title" style={{ color: toastType === 'success' ? '#16a34a' : toastType === 'info' ? '#2563eb' : '#ef4444' }}>
                {toastType === 'success' ? 'Success' : toastType === 'info' ? 'Notice' : 'Error'}
              </p>
              <p className="toast-msg">{toastMsg}</p>
            </div>
            <button className="toast-close" onClick={() => setToastVisible(false)}>&times;</button>
          </div>
        </div>

        {/* Main Calculator Area (with Desktop 2-Column Side-by-Side Layout) */}
        <div className={sidebar ? "calculator-layout-wrapper" : ""}>
          {/* Left Column: Calculator Card + SEO Guides + FAQs strictly on the Left Side */}
          <div className="calculator-left-col">
            {/* Calculator Card */}
            <div className="calculator-card">
              <div className="top-accent-bar"></div>

          <div className="banner-header">
            <div className="badge-pill">
              <span className="green-dot"></span>
              CBT RANK
            </div>
            <h1 className="banner-title" id="banner-exam-title">{bannerTitle}</h1>
            <p className="banner-sub" id="banner-exam-sub">{bannerSub}</p>
          </div>

          <div className="card-body">
            <form id="anskey-form" autoComplete="off" noValidate onSubmit={handleSubmit}>

              {/* Answer Key URL */}
              <div className="ak-form-group">
                <label htmlFor="ans_key_url">Answer Key URL <span className="star">*</span></label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="url" id="ans_key_url" className="ak-form-input font-mono"
                    placeholder="Paste your official Answerkey Link" required
                    value={formData.ans_key_url}
                    onChange={e => setFormData(prev => ({ ...prev, ans_key_url: e.target.value }))}
                    style={{ paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={handlePasteUrl}
                    title="Paste from clipboard"
                    aria-label="Paste from clipboard"
                    className="ak-paste-icon-btn"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '38px',
                      height: '100%',
                      border: 'none',
                      borderLeft: '1.5px solid #cbd5e1',
                      borderTopRightRadius: '8px',
                      borderBottomRightRadius: '8px',
                      background: 'transparent',
                      boxShadow: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: pastedStatus ? '#16a34a' : '#64748b',
                      outline: 'none',
                      lineHeight: 1
                    }}
                  >
                    {pastedStatus ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="help-text">Use the official answer key link (the page where questions are visible).</p>
              </div>

              {/* HTML Paste (shown on demand) */}
              {showHtmlPaste && (
                <div className="ak-form-group" id="html-paste-group">
                  <label htmlFor="ans_key_html">
                    Paste Answer Key HTML Source{' '}
                    <span style={{ color: '#64748b', fontWeight: 500 }}>(Optional — if URL is blocked)</span>
                  </label>
                  <textarea id="ans_key_html" className="ak-form-textarea"
                    placeholder="Press Ctrl+U on answer key page → Ctrl+A → Ctrl+C → Paste here"
                    value={formData.ans_key_html}
                    onChange={e => setFormData(prev => ({ ...prev, ans_key_html: e.target.value }))}
                  />
                  <p className="help-text">Only needed if the direct URL fetch fails due to security restrictions.</p>
                </div>
              )}

              {/* Form Options Grid (Category, Horizontal, Gender, Paper Language, Custom Fields & State/UT) */}
              <div className="form-grid">
                {/* 1. Category */}
                <div className="ak-form-group">
                  <label htmlFor="category">Category <span className="star">*</span></label>
                  <select id="category" className="ak-form-select" required
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}>
                    <option value="">Select Category</option>
                    <option value="UR">UR</option>
                    <option value="OBC">OBC</option>
                    <option value="EWS">EWS</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>

                {/* 2. Horizontal Category */}
                <div className="ak-form-group">
                  <label htmlFor="horizontal_category">Horizontal Category</label>
                  <select id="horizontal_category" className="ak-form-select"
                    value={formData.horizontal_category}
                    onChange={e => setFormData(prev => ({ ...prev, horizontal_category: e.target.value }))}>
                    <option value="none">None</option>
                    <option value="exsm">EX SM (Ex-Serviceman)</option>
                    <option value="oh">OH (Orthopedically Handicapped)</option>
                    <option value="vh">VH (Visually Handicapped)</option>
                    <option value="hh">HH (Hearing Handicapped)</option>
                    <option value="other-pwd">Other PWD</option>
                  </select>
                </div>

                {/* 3. Gender */}
                <div className="ak-form-group">
                  <label htmlFor="gender">Gender <span className="star">*</span></label>
                  <select id="gender" className="ak-form-select" required
                    value={formData.gender ? (formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1).toLowerCase()) : ''}
                    onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* 4. Paper Language */}
                <div className="ak-form-group">
                  <label htmlFor="paper_language">Paper Language</label>
                  <select id="paper_language" className="ak-form-select"
                    value={formData.paper_language}
                    disabled={langLoading}
                    onChange={e => setFormData(prev => ({ ...prev, paper_language: e.target.value }))}>
                    {langLoading ? (
                      <option value="">Loading Languages...</option>
                    ) : (
                      <>
                        <option value="">Select Language (Optional)</option>
                        {languages.map(lang => (
                          <option key={lang} value={lang.toLowerCase()}>{lang}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* 5. Dynamic Exam Custom Fields (e.g. Trade / Branch, CCAA Qualified?, NAC %, etc.) */}
                {visibleCustomFields.map((field) => (
                  <div key={field.id} className="ak-form-group">
                    <label htmlFor={`custom_${field.id}`}>
                      {field.label} {field.required && <span className="star">*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        id={`custom_${field.id}`}
                        className="ak-form-select"
                        required={field.required}
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      >
                        <option value="">Select {field.label}</option>
                        {(field.options || []).map((opt, optIdx) => {
                          const norm = normalizeOption(opt);
                          return (
                            <option key={norm.value || optIdx} value={norm.value}>
                              {norm.label}
                            </option>
                          );
                        })}
                      </select>
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        id={`custom_${field.id}`}
                        className="ak-form-input"
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        required={field.required}
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      />
                    ) : (
                      <input
                        type="text"
                        id={`custom_${field.id}`}
                        className="ak-form-input"
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        required={field.required}
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                {/* 6. State / UT / Location (Spans full width if odd item, or shares 2nd column if even item) */}
                <div
                  className="ak-form-group"
                  style={visibleCustomFields.length % 2 === 0 ? { gridColumn: 'span 2 / span 2' } : undefined}
                >
                  <label htmlFor="state">{locationLabel} <span className="star">*</span></label>
                  <select id="state" className="ak-form-select" required
                    value={formData.state}
                    disabled={locationLoading}
                    onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}>
                    {locationLoading ? (
                      <option value="">Loading {locationLabel}...</option>
                    ) : (
                      <>
                        <option value="">Select {locationLabel}</option>
                        {locations.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Consent */}
              <div className="consent-row">
                <label className="checkbox-container" htmlFor="consentCheck">
                  <input type="checkbox" id="consentCheck"
                    checked={formData.consent}
                    onChange={e => setFormData(prev => ({ ...prev, consent: e.target.checked }))}
                  />
                  <span className="consent-text">Your submitted data will only be used to calculate your marks &amp; rank.</span>
                </label>
              </div>

              {/* Submit */}
              <button type="submit" id="submitBtn" className="btn-submit"
                disabled={submitting || !formData.consent}>
                <span id="btn-text">{btnText}</span>
              </button>

              {/* Real-time Calculation Progress Feedback */}
              {submitting && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                      {progressStep === 1 && '⏳ Connecting & Fetching Answer Key...'}
                      {progressStep === 2 && '🔍 Parsing Response Sheet & Extracting Answers...'}
                      {progressStep === 3 && '📊 Computing Negative Marking & Querying Live Ranks...'}
                      {progressStep === 4 && '🚀 Finalizing Scorecard & Redirecting...'}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb' }}>
                      {progressStep === 1 && '25%'}
                      {progressStep === 2 && '50%'}
                      {progressStep === 3 && '75%'}
                      {progressStep === 4 && '100%'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '999px',
                    background: '#e2e8f0',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: progressStep === 1 ? '25%' : progressStep === 2 ? '50%' : progressStep === 3 ? '75%' : '100%',
                      background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease-in-out'
                    }} />
                  </div>

                  {/* Micro Steps Indicator */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                    <span style={{ color: progressStep >= 1 ? '#2563eb' : '#94a3b8' }}>1. Fetch</span>
                    <span style={{ color: progressStep >= 2 ? '#2563eb' : '#94a3b8' }}>2. Parse</span>
                    <span style={{ color: progressStep >= 3 ? '#2563eb' : '#94a3b8' }}>3. Calculate</span>
                    <span style={{ color: progressStep >= 4 ? '#2563eb' : '#94a3b8' }}>4. Ready</span>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* AdSense Manual Banner */}
        <AdBanner slotId={ADSENSE_CONFIG.SLOTS.CALCULATOR_BANNER} />

        {/* Rich SEO & Informational Content Cards OR Custom Exam Description */}
        {hasCustomDescription ? (
          <div className="details-wrapper exam-custom-wrapper" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div
              className="info-card exam-custom-article"
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '18px',
                padding: '24px 22px',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
              }}
              dangerouslySetInnerHTML={{ __html: customDescription }}
            />

            {/* Legal Disclaimer */}
            <div className="info-card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px 18px' }}>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
                <strong>⚖️ Disclaimer:</strong> CBTRank is an independent educational score estimation and rank analysis utility created to help candidates calculate indicative scores. CBTRank is not associated with, affiliated with, or endorsed by any government department, board, or examination authority. Official final results, normalized marks, cut-offs, and merit lists are published exclusively by the respective recruitment boards.
              </p>
            </div>
          </div>
        ) : (
          <div className="details-wrapper" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Card 1: Hero Welcome & Overview */}
          <div className="info-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '24px 22px', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'inline-block' }} />
              All-India Exam Evaluation Portal
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              Latest Government Exam Answer Keys &amp; Score Calculator 2025–2026
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
              Welcome to <strong>CBTRank</strong> — your premier online platform to check the latest government recruitment answer keys, calculate accurate normalized &amp; raw scores, and evaluate your category and shift-wise performance. We support major competitive examinations conducted by <strong>SSC, RRB (Railways), Banking (IBPS &amp; SBI), State PSCs, Defence, and Teaching</strong> recruitment authorities.
            </p>
            <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.65, margin: '10px 0 0 0', fontWeight: 500 }}>
              Candidates can easily paste their official response sheet links to get an instant section-wise breakdown, accurate negative marking deductions, and rank predictions before official merit lists are declared.
            </p>
          </div>

          {/* Card 2: Popular CBT Exams Supported (Compact & Clean) */}
          <div className="info-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '20px 22px', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏆</span> Supported CBT Exams on CBTRank
              </h3>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '999px' }}>
                Central &amp; State CBT Mode
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 14px 0' }}>
              Fast automated score calculation and shift ranking for all major Computer-Based Tests:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🚆</span>
                <div>
                  <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block', marginBottom: '2px' }}>Railway (RRB)</strong>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.4 }}>RRB NTPC, ALP, Group D, Technician, JE, etc.</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🏛️</span>
                <div>
                  <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block', marginBottom: '2px' }}>Staff Selection (SSC)</strong>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.4 }}>SSC CGL, CHSL, MTS, GD, CPO, Steno, etc.</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📋</span>
                <div>
                  <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block', marginBottom: '2px' }}>State PSC &amp; Police</strong>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.4 }}>UP, Bihar, Odisha, Rajasthan, MP Exams, etc.</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🛡️</span>
                <div>
                  <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block', marginBottom: '2px' }}>Central &amp; State CBTs</strong>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.4 }}>Defence, Education/TET, Technical Exams, etc.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Step-by-Step Guide - Best Modern UI */}
          <div className="info-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '24px 22px', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
              <h3 id="info-how-to-title" style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span> How to Check Answer Key &amp; Calculate Your Marks on CBTRank
              </h3>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> 4 Simple Steps
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 18px 0' }}>
              Follow these simple steps to calculate your exact marks, accuracy percentage, and shift rankings:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              
              {/* Step 1 */}
              <div
                className="calc-step-card"
                style={{
                  background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                  border: '1.5px solid #e2e8f0',
                  borderTop: '3px solid #2563eb',
                  borderRadius: '14px',
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.78rem' }}>
                    01
                  </span>
                  <span style={{ fontSize: '1.25rem' }}>🔗</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    Copy Response Link
                  </strong>
                  <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    Open your exam portal, view your question paper / answer key, and copy the complete URL from your browser address bar.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className="calc-step-card"
                style={{
                  background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                  border: '1.5px solid #e2e8f0',
                  borderTop: '3px solid #0284c7',
                  borderRadius: '14px',
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.78rem' }}>
                    02
                  </span>
                  <span style={{ fontSize: '1.25rem' }}>📥</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    Paste URL Above
                  </strong>
                  <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    Paste the copied link into the <strong>&ldquo;Answer Key URL&rdquo;</strong> input field in our calculator above.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className="calc-step-card"
                style={{
                  background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                  border: '1.5px solid #e2e8f0',
                  borderTop: '3px solid #7c3aed',
                  borderRadius: '14px',
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.78rem' }}>
                    03
                  </span>
                  <span style={{ fontSize: '1.25rem' }}>⚙️</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    Select Details
                  </strong>
                  <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    Choose your applicable <strong>Category</strong> (UR/OBC/EWS/SC/ST), <strong>Gender</strong>, and <strong>State / Zone</strong>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div
                className="calc-step-card"
                style={{
                  background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                  border: '1.5px solid #e2e8f0',
                  borderTop: '3px solid #059669',
                  borderRadius: '14px',
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.78rem' }}>
                    04
                  </span>
                  <span style={{ fontSize: '1.25rem' }}>🎯</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                    View Instant Report
                  </strong>
                  <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    Click <strong>&ldquo;Calculate Marks &amp; Rank&rdquo;</strong> to instantly view your verified score, negative marks, and rank analysis.
                  </p>
                </div>
              </div>

            </div>

            {/* Micro Quick-Tip Bar */}
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '1rem' }}>💡</span>
              <span style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.45 }}>
                <strong style={{ color: '#0f172a' }}>Quick Tip:</strong> Make sure to copy the full link from your browser address bar when your official candidate response sheet is open on your screen.
              </span>
            </div>
          </div>

          {/* Card 4: Key Benefits & Features */}
          <div className="info-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '24px 22px', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
              ⭐ Key Benefits of Using the CBTRank Answer Key Calculator
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0' }}>
              Why thousands of government exam aspirants trust CBTRank for score evaluation:
            </p>

            <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div className="feature-box blue">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>⚡ Instant Automated Calculation</h4>
                <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  Eliminates manual error by applying exact exam marking schemes including negative marking rules (+1, -0.25, -0.33, etc.) automatically.
                </p>
              </div>

              <div className="feature-box green">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📊 Section-Wise Deep Breakdown</h4>
                <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  Get complete subject-by-subject insights with precise counts of Correct, Wrong, and Unattempted questions.
                </p>
              </div>

              <div className="feature-box purple">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🎯 Shift &amp; Category Ranking</h4>
                <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  Benchmark your performance across all candidates in your shift session and reservation category quota.
                </p>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                <h4 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d97706', marginBottom: '8px' }}>
                  📄 1-Click PDF / Image Scorecard
                </h4>
                <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  Download a beautifully formatted, official-style scorecard PDF/image directly to your device for future records.
                </p>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                <h4 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284c7', marginBottom: '8px' }}>
                  🔒 100% Free &amp; Zero Sign-Up
                </h4>
                <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  No mandatory registration or personal credentials needed. Completely free public evaluation utility for all candidates.
                </p>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                <h4 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ec4899', marginBottom: '8px' }}>
                  📱 Ultra-Fast &amp; Mobile Responsive
                </h4>
                <p style={{ fontSize: '0.76rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  Engineered for lightning-fast parsing on mobile phones, tablets, and desktop computers without delays.
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Objection Process & Next Steps */}
          <div className="info-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '24px 22px', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
              📝 Answer Key Objection &amp; Challenge Process
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, margin: '0 0 12px 0' }}>
              Most recruitment authorities (such as SSC, RRB, and NTA) offer a provisional objection window (typically 3 to 7 days) allowing candidates to challenge disputed questions. If you find any discrepancies:
            </p>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.7 }}>
              <li><strong>Verify with Standard References:</strong> Double-check the disputed question against standard NCERT or recognized authoritative reference books.</li>
              <li><strong>Note Question &amp; Option IDs:</strong> Identify the unique Question ID and Option ID displayed in your official response sheet.</li>
              <li><strong>Submit on Official Board Portal:</strong> Log in to the official exam authority&apos;s objection management portal within the specified challenge dates.</li>
              <li><strong>Attach Documentary Proof:</strong> Upload clear scanned pages of your reference material and pay the prescribed fee per question (refundable if the challenge is accepted).</li>
              <li><strong>Final Answer Key Updates:</strong> The board reviews all challenges with subject matter experts before releasing the final normalized merit list.</li>
            </ul>
          </div>

          {/* Card 6: Why Evaluating Score Early Matters */}
          <div className="info-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '24px 22px', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
              💡 Why Checking Your Answer Key Early is Essential
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, margin: '0 0 12px 0' }}>
              Evaluating your performance immediately after the official key release offers significant tactical advantages:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>🎯 Estimate Selection Cut-Offs</strong>
                <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                  Compare your raw score with expected category cut-offs to understand your qualifying chances.
                </p>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>📚 Plan Tier-II &amp; Skill Tests</strong>
                <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                  Begin early targeted preparation for Mains, Typing, PET, or Interview rounds without losing crucial weeks.
                </p>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>🔍 Identify Negative Mark Traps</strong>
                <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                  Analyze weak chapters or recurring mistakes to optimize your question selection strategy for upcoming exams.
                </p>
              </div>
            </div>
          </div>

          {/* Card 7: Legal Disclaimer */}
          <div className="info-card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px 18px' }}>
            <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
              <strong>⚖️ Disclaimer:</strong> CBTRank is an independent educational score estimation and rank analysis utility created to help candidates calculate indicative scores. CBTRank is not associated with, affiliated with, or endorsed by any government department, board, or examination authority. Official final results, normalized marks, cut-offs, and merit lists are published exclusively by the respective recruitment boards.
            </p>
          </div>

        </div>
      )}

        {/* Custom Page Children (e.g. ExamFaqSection or Exam Details) */}
        {children}
      </div>

      {sidebar && (
        <aside className="calculator-sidebar">
          {sidebar}
        </aside>
      )}
    </div>
  </div>
</main>
  );
}
