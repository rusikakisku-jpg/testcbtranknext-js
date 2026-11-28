export interface SarkariCategoryMeta {
  slug: string;
  name: string;
  route: string;
  shortLabel: string;
  accentColor: string;
  description: string;
}

export const SARKARI_CATEGORIES: Record<string, SarkariCategoryMeta> = {
  'latest-jobs': {
    slug: 'latest-jobs',
    name: 'Latest Jobs',
    route: '/latest-jobs',
    shortLabel: 'Latest Jobs',
    accentColor: '#2563eb',
    description: 'Latest Central and State Government recruitment notifications, online application forms, eligibility, and official links.'
  },
  'admit-card': {
    slug: 'admit-card',
    name: 'Admit Card',
    route: '/admit-card',
    shortLabel: 'Admit Card',
    accentColor: '#0284c7',
    description: 'Download official exam hall tickets, admit cards, city intimation slips, and exam date schedules.'
  },
  'result': {
    slug: 'result',
    name: 'Exam Results',
    route: '/results',
    shortLabel: 'Results',
    accentColor: '#16a34a',
    description: 'Check latest government exam results, merit lists, scorecards, and category-wise final cutoff PDFs.'
  },
  'answer-key': {
    slug: 'answer-key',
    name: 'Answer Key',
    route: '/answer-key',
    shortLabel: 'Answer Key',
    accentColor: '#7c3aed',
    description: 'Official provisional & final answer keys, objection deadlines, and question paper downloads.'
  },
  'syllabus': {
    slug: 'syllabus',
    name: 'Syllabus',
    route: '/syllabus',
    shortLabel: 'Syllabus',
    accentColor: '#d97706',
    description: 'Detailed post-wise syllabus, exam pattern, negative marking rules, and physical efficiency standards.'
  },
  'admission': {
    slug: 'admission',
    name: 'Admission',
    route: '/category/admission',
    shortLabel: 'Admission',
    accentColor: '#0d9488',
    description: 'University entrance tests, counselling schedules, and national admission notifications.'
  },
  'certificate-verification': {
    slug: 'certificate-verification',
    name: 'Document Verification',
    route: '/category/certificate-verification',
    shortLabel: 'DV / Verification',
    accentColor: '#dc2626',
    description: 'Certificate verification schedules, DAF checklists, and shortlisted roll number lists.'
  },
  'important': {
    slug: 'important',
    name: 'Important Updates',
    route: '/category/important',
    shortLabel: 'Important',
    accentColor: '#475569',
    description: 'Official government exam calendars, OTR notices, and important candidate advisories.'
  }
};

export const SARKARI_CATEGORY_KEYS = Object.keys(SARKARI_CATEGORIES);

export interface ImportantDateItem {
  event: string;
  date: string;
}

export interface ApplicationFeeItem {
  category: string;
  fee: string;
}

export interface AgeLimitRow {
  category: string;
  min_age: string;
  max_age: string;
}

export interface AgeLimitData {
  as_on?: string;
  relaxation?: string;
  min_age?: string;
  max_age?: string;
  categories?: AgeLimitRow[];
}

export interface VacancyItem {
  post_name: string;
  total_post: string;
  eligibility: string;
}

export interface CustomCategoryTable {
  columns: string[];
  rows: string[][];
}

export interface CustomLinkItem {
  label: string;
  url: string;
  btn_text?: string;
}

export interface SarkariPost {
  id: number;
  title: string;
  slug: string;
  category: string;
  department?: string | null;
  post_date?: string | null;
  last_date?: string | null;
  short_desc?: string | null;
  total_vacancy?: string | null;
  important_dates?: string | null;
  application_fee?: string | null;
  age_limit?: string | null;
  vacancy_details?: string | null;
  category_details?: string | null;
  how_to_apply?: string | null;
  article_content?: string | null;
  thumbnail?: string | null;
  links?: string | null;
  notification_pdf?: string | null;
  admit_card_url?: string | null;
  result_url?: string | null;
  apply_online_url?: string | null;
  official_website_url?: string | null;
  views?: number;
  is_featured?: number;
  status: string;
  author_id?: number;
  created_at?: string;
  updated_at?: string;
  bumped_at?: string;
  previewUrl?: string;
}

export interface SarkariAuthor {
  id: number;
  name: string;
  slug: string;
  role?: string;
  bio?: string;
  avatar_url?: string;
}

export function slugifyText(input: string): string {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `post-${Date.now()}`;
}

export function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw !== 'string') return (raw as T) ?? fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return fallback;
  }
}

export function formatShortDate(raw?: string | null): string {
  if (!raw) return 'Recent';
  const parsed = Date.parse(raw);
  if (isNaN(parsed)) return String(raw);
  return new Date(parsed).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
