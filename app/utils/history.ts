import { cbtGet, cbtSave, cbtSaveString, STORAGE_KEYS } from './storage';

export interface HistoryItem {
  id: string;
  timestamp: number;
  formattedDate: string;
  candidateName: string;
  rollNo: string;
  examName: string;
  examSlug: string;
  examId?: string;
  testDate?: string;
  testTime?: string;
  testCenter?: string;
  rawScore: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  bonusCount: number;
  unattemptedCount: number;
  marksRight: number;
  marksWrong: number;
  overallRank?: number;
  totalOverall?: number;
  shiftRank?: number;
  totalShift?: number;
  categoryRank?: number;
  totalCategory?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resultData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any;
}

const HISTORY_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days retention
const MAX_HISTORY_ITEMS = 25;

/**
 * Retrieve all search history items, newest first.
 * If history is empty but active calculation exists in localStorage,
 * automatically synthesizes and saves the active calculation into history.
 */
export function getSearchHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = cbtGet<HistoryItem[]>(STORAGE_KEYS.SEARCH_HISTORY) || [];

    // Auto-migration: if active result exists, ensure it is in history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentResult = cbtGet<any>(STORAGE_KEYS.RESULT_DATA);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentForm = cbtGet<any>(STORAGE_KEYS.FORM_DATA);
    const savedRight = cbtGet<string>(STORAGE_KEYS.MARKS_RIGHT);
    const savedWrong = cbtGet<string>(STORAGE_KEYS.MARKS_WRONG);

    if (currentResult && (currentResult.candidateName || currentResult.rollNo || currentResult.rollNumber)) {
      const roll = String(currentResult.rollNo || currentResult.rollNumber || '').trim();
      const exam = String(currentResult.examName || currentForm?.exam_slug || 'Answer Key').trim();
      const url = String(currentForm?.ans_key_url || '').trim();

      const exists = list.some(item =>
        (roll && item.rollNo === roll && item.examName === exam) ||
        (url && item.formData?.ans_key_url === url)
      );

      if (!exists) {
        const mr = savedRight ? parseFloat(savedRight) : (currentForm?.marks_right ?? 1);
        const mw = savedWrong ? parseFloat(savedWrong) : (currentForm?.marks_wrong ?? 0);
        const bonus = Number(currentResult.bonusCount || currentResult.rawBonusQuestions || 0);
        const correct = Number(currentResult.correctCount || 0);
        const wrong = Number(currentResult.wrongCount || 0);
        const unattempted = Number(currentResult.unattemptedCount || 0);
        const total = correct + wrong + unattempted + bonus;
        const score = ((correct + bonus) * mr) - (wrong * mw);

        const now = new Date();
        const autoItem: HistoryItem = {
          id: `hist_${Date.now()}`,
          timestamp: Date.now(),
          formattedDate: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          candidateName: currentResult.candidateName || 'Candidate',
          rollNo: roll || 'N/A',
          examName: exam,
          examSlug: currentForm?.exam_slug || 'general',
          examId: currentResult.examId || currentForm?.exam_id || '',
          testDate: currentResult.testDate || '',
          testTime: currentResult.testTime || '',
          testCenter: currentResult.testCenter || '',
          rawScore: Number(score.toFixed(2)),
          totalQuestions: total,
          correctCount: correct,
          wrongCount: wrong,
          bonusCount: bonus,
          unattemptedCount: unattempted,
          marksRight: mr,
          marksWrong: mw,
          overallRank: currentResult.overallRank,
          totalOverall: currentResult.totalOverall,
          shiftRank: currentResult.shiftRank,
          totalShift: currentResult.totalShift,
          categoryRank: currentResult.categoryRank,
          totalCategory: currentResult.totalCategory,
          resultData: currentResult,
          formData: currentForm || {},
        };

        const updatedList = [autoItem, ...list].slice(0, MAX_HISTORY_ITEMS);
        cbtSave(STORAGE_KEYS.SEARCH_HISTORY, updatedList, HISTORY_TTL_MS);
        return updatedList;
      }
    }

    return list;
  } catch (e) {
    console.warn('[CBTRank History] Failed to read history:', e);
    return [];
  }
}

/**
 * Add a new calculated answer key search to history.
 */
export function addToSearchHistory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resultData: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any,
  marksRight: number = 1,
  marksWrong: number = 0
): void {
  if (typeof window === 'undefined' || !resultData) return;
  try {
    const list = cbtGet<HistoryItem[]>(STORAGE_KEYS.SEARCH_HISTORY) || [];
    const roll = String(resultData.rollNo || resultData.rollNumber || '').trim();
    const exam = String(resultData.examName || formData?.exam_slug || 'Answer Key').trim();
    const url = String(formData?.ans_key_url || '').trim();

    const bonus = Number(resultData.bonusCount || resultData.rawBonusQuestions || 0);
    const correct = Number(resultData.correctCount || 0);
    const wrong = Number(resultData.wrongCount || 0);
    const unattempted = Number(resultData.unattemptedCount || 0);
    const total = correct + wrong + unattempted + bonus;
    const score = ((correct + bonus) * marksRight) - (wrong * marksWrong);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newItem: HistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      formattedDate,
      candidateName: resultData.candidateName || 'Candidate',
      rollNo: roll || 'N/A',
      examName: exam,
      examSlug: formData?.exam_slug || 'general',
      examId: resultData.examId || formData?.exam_id || '',
      testDate: resultData.testDate || '',
      testTime: resultData.testTime || '',
      testCenter: resultData.testCenter || '',
      rawScore: Number(score.toFixed(2)),
      totalQuestions: total,
      correctCount: correct,
      wrongCount: wrong,
      bonusCount: bonus,
      unattemptedCount: unattempted,
      marksRight,
      marksWrong,
      overallRank: resultData.overallRank,
      totalOverall: resultData.totalOverall,
      shiftRank: resultData.shiftRank,
      totalShift: resultData.totalShift,
      categoryRank: resultData.categoryRank,
      totalCategory: resultData.totalCategory,
      resultData,
      formData,
    };

    // Remove duplicates if same roll & exam or same URL, keeping new entry at the top
    const filtered = list.filter(item => {
      const sameRoll = roll && item.rollNo === roll && item.examName === exam;
      const sameUrl = url && item.formData?.ans_key_url === url;
      return !(sameRoll || sameUrl);
    });

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    cbtSave(STORAGE_KEYS.SEARCH_HISTORY, updated, HISTORY_TTL_MS);
  } catch (e) {
    console.warn('[CBTRank History] Failed to add to history:', e);
  }
}

/**
 * Delete a single history item by ID.
 */
export function deleteFromSearchHistory(id: string): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = cbtGet<HistoryItem[]>(STORAGE_KEYS.SEARCH_HISTORY) || [];
    const updated = list.filter(item => item.id !== id);
    cbtSave(STORAGE_KEYS.SEARCH_HISTORY, updated, HISTORY_TTL_MS);
    return updated;
  } catch (e) {
    return [];
  }
}

/**
 * Clear all history items.
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    cbtSave(STORAGE_KEYS.SEARCH_HISTORY, [], HISTORY_TTL_MS);
  } catch (e) {}
}

/**
 * Restore a history item's data into localStorage so that /result,
 * /review-answerkey, and /rank immediately load this paper.
 */
export function restoreSearchHistoryItem(item: HistoryItem): void {
  if (typeof window === 'undefined' || !item) return;
  try {
    if (item.resultData) {
      cbtSave(STORAGE_KEYS.RESULT_DATA, item.resultData);
    }
    if (item.formData) {
      cbtSave(STORAGE_KEYS.FORM_DATA, item.formData);
    }
    if (item.marksRight !== undefined) {
      cbtSaveString(STORAGE_KEYS.MARKS_RIGHT, String(item.marksRight));
    }
    if (item.marksWrong !== undefined) {
      cbtSaveString(STORAGE_KEYS.MARKS_WRONG, String(item.marksWrong));
    }
  } catch (e) {
    console.warn('[CBTRank History] Failed to restore history item:', e);
  }
}
