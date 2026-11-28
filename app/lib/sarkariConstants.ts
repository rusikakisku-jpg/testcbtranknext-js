export interface SarkariCategoryMeta {
  slug: string;
  name: string;
  route: string;
  shortLabel: string;
  accentColor: string;
  description: string;
  introEn: string;
}

export const SARKARI_CATEGORIES: Record<string, SarkariCategoryMeta> = {
  'latest-jobs': {
    slug: 'latest-jobs',
    name: 'Latest Jobs',
    route: '/latest-jobs',
    shortLabel: 'Latest Jobs',
    accentColor: '#ab183d',
    description: 'Latest Central and State Government recruitment notifications, online application forms, eligibility, and official links.',
    introEn: 'Explore the latest Central and State Government recruitment notifications (Sarkari Naukri 2026), online application start dates, vacancy breakdowns, eligibility rules, and direct apply links.'
  },
  'admit-card': {
    slug: 'admit-card',
    name: 'Admit Card',
    route: '/admit-card',
    shortLabel: 'Admit Card',
    accentColor: '#ab183d',
    description: 'Download official exam hall tickets, admit cards, city intimation slips, and exam date schedules.',
    introEn: 'Download verified exam hall tickets, call letters, city intimation slips, and official exam schedules directly from UPSC, SSC, RRB, Banking, and State recruitment portals.'
  },
  'result': {
    slug: 'result',
    name: 'Result',
    route: '/results',
    shortLabel: 'Results',
    accentColor: '#ab183d',
    description: 'Check latest government exam results, merit lists, scorecards, and category-wise final cutoff PDFs.',
    introEn: 'Check latest government exam results, merit lists, normalised scorecards, Tier-I/II qualifying cutoffs, and final selection PDFs.'
  },
  'answer-key': {
    slug: 'answer-key',
    name: 'Answer Key',
    route: '/answer-key',
    shortLabel: 'Answer Key',
    accentColor: '#ab183d',
    description: 'Official provisional & final answer keys, objection deadlines, and question paper downloads.',
    introEn: 'Download official provisional and final answer keys, response sheets, challenge windows, and official question papers across CBT recruitment exams.'
  },
  'syllabus': {
    slug: 'syllabus',
    name: 'Syllabus',
    route: '/syllabus',
    shortLabel: 'Syllabus',
    accentColor: '#ab183d',
    description: 'Detailed post-wise syllabus, exam pattern, negative marking rules, and physical efficiency standards.',
    introEn: 'Access complete subject-wise exam syllabus PDFs, marking schemes, tier patterns, physical efficiency criteria, and negative marking rules.'
  },
  'certificate-verification': {
    slug: 'certificate-verification',
    name: 'Certificate Verification',
    route: '/category/certificate-verification',
    shortLabel: 'Verification',
    accentColor: '#ab183d',
    description: 'Certificate verification schedules, DAF checklists, and shortlisted roll number lists.',
    introEn: 'Stay updated with document verification schedules, detailed application form (DAF) deadlines, and shortlisted verification call lists.'
  },
  'admission': {
    slug: 'admission',
    name: 'Admission',
    route: '/category/admission',
    shortLabel: 'Admission',
    accentColor: '#ab183d',
    description: 'University entrance tests, counselling schedules, and national admission notifications.',
    introEn: 'Find latest university entrance forms, CUET/JEE/NEET/ITI/Polytechnic counselling schedules, and national admission notifications.'
  },
  'important': {
    slug: 'important',
    name: 'Important',
    route: '/category/important',
    shortLabel: 'Important',
    accentColor: '#ab183d',
    description: 'Official government exam calendars, OTR notices, and important candidate advisories.',
    introEn: 'Track annual SSC/UPSC/RRB exam calendars, One-Time Registration (OTR) advisories, scholarship forms, and essential candidate circulars.'
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
  email?: string;
  qualification?: string;
  experience?: string;
  bio?: string;
  avatar_url?: string;
  is_active?: number;
  post_count?: number;
}

export interface SarkariBadge {
  id: number;
  title: string;
  subtitle?: string | null;
  url: string;
  bg_color: string;
  display_order: number;
}

export interface SarkariMarquee {
  id: number;
  title: string;
  url: string;
  display_order: number;
}

export interface SarkariUpload {
  id: number;
  original_name: string;
  file_key: string;
  file_url: string;
  storage_type: string;
  file_size: number;
  created_at?: string;
}

export interface SarkariAnalyticsData {
  todayViews: number;
  yesterdayViews: number;
  todayPostsViewed: number;
  totalViews: number;
  weekViewsTotal: number;
  maxDailyViews: number;
  dailyTrend: Array<{ date: string; label: string; views: number; isToday: boolean }>;
  topPostsOverall: Array<{ id: number; title: string; slug: string; category: string; views: number }>;
  topPostsToday: Array<{ id: number; title: string; slug: string; category: string; today_views: number }>;
  categoryViews: Array<{ category: string; name: string; views: number; pct: number }>;
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
