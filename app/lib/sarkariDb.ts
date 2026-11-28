import { getRequestContext } from '@cloudflare/next-on-pages';
import {
  SARKARI_CATEGORIES,
  SARKARI_CATEGORY_KEYS,
  SarkariAnalyticsData,
  SarkariAuthor,
  SarkariBadge,
  SarkariMarquee,
  SarkariPost,
  SarkariUpload
} from './sarkariConstants';

interface D1PreparedStatementLike {
  bind: (...values: unknown[]) => D1PreparedStatementLike;
  all: <T = Record<string, unknown>>() => Promise<{ results?: T[]; success?: boolean }>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<{ success?: boolean; meta?: { last_row_id?: number; changes?: number } }>;
}

interface D1BindingLike {
  prepare: (sql: string) => D1PreparedStatementLike;
}

export interface D1ConnectionStatus {
  connected: boolean;
  mode: 'binding' | 'rest' | 'unconfigured';
  message: string;
  databaseId?: string;
}

let schemaInitialized = false;

function getNativeD1(): D1BindingLike | null {
  try {
    const ctx = getRequestContext();
    const env = (ctx?.env || {}) as Record<string, unknown>;
    const db = (env.DB || env.CBTRANK_DB || env.D1) as D1BindingLike | undefined;
    if (db && typeof db.prepare === 'function') {
      return db;
    }
  } catch {
    // Expected during static evaluation outside request context
  }
  return null;
}

function getRestConfig(): { accountId: string; dbId: string; token: string } | null {
  let envVars: Record<string, unknown> = {};
  try {
    const ctx = getRequestContext();
    if (ctx?.env) envVars = ctx.env as Record<string, unknown>;
  } catch {}

  const accountId = String(envVars.CF_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || '38c7d789225e89652dd6bb111403db5d').trim();
  const dbId = String(envVars.CF_D1_DATABASE_ID || process.env.CF_D1_DATABASE_ID || 'fd29c541-3fd2-4fa8-8dc1-19809ab907c3').trim();
  const token = String(envVars.CF_D1_TOKEN || envVars.CF_API_TOKEN || process.env.CF_D1_TOKEN || process.env.CF_API_TOKEN || '').trim();

  if (!accountId || !dbId || !token) return null;
  return { accountId, dbId, token };
}

export async function getD1ConnectionStatus(): Promise<D1ConnectionStatus> {
  const nativeDb = getNativeD1();
  if (nativeDb) {
    try {
      await nativeDb.prepare('SELECT 1').first();
      return {
        connected: true,
        mode: 'binding',
        message: 'Connected via native Cloudflare Pages D1 Binding (DB)',
        databaseId: 'fd29c541-3fd2-4fa8-8dc1-19809ab907c3'
      };
    } catch (err: any) {
      return { connected: false, mode: 'binding', message: err?.message || 'D1 binding query failed' };
    }
  }
  const rest = getRestConfig();
  if (rest) {
    try {
      const res = await queryRestD1('SELECT 1 AS ok', []);
      if (res.success) {
        return {
          connected: true,
          mode: 'rest',
          message: 'Connected via Cloudflare D1 REST API',
          databaseId: rest.dbId
        };
      }
      return { connected: false, mode: 'rest', message: res.error || 'D1 REST authentication error', databaseId: rest.dbId };
    } catch (err: any) {
      return { connected: false, mode: 'rest', message: err?.message || 'D1 REST connection failed', databaseId: rest.dbId };
    }
  }
  return {
    connected: false,
    mode: 'unconfigured',
    message: 'No Cloudflare D1 Binding (DB) or CF_D1_TOKEN environment variable configured in Cloudflare Pages.',
    databaseId: 'fd29c541-3fd2-4fa8-8dc1-19809ab907c3'
  };
}

async function queryRestD1<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<{ success: boolean; results: T[]; lastRowId?: number; error?: string }> {
  const rest = getRestConfig();
  if (!rest) {
    return { success: false, results: [], error: 'D1 REST credentials not configured' };
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${rest.accountId}/d1/database/${rest.dbId}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${rest.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params }),
    cache: 'no-store'
  });
  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok || !data?.success) {
    const errMsg = data?.errors?.[0]?.message || `D1 HTTP ${res.status}`;
    return { success: false, results: [], error: errMsg };
  }
  const firstResult = data?.result?.[0];
  return {
    success: true,
    results: Array.isArray(firstResult?.results) ? (firstResult.results as T[]) : [],
    lastRowId: firstResult?.meta?.last_row_id
  };
}

export async function dbAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const nativeDb = getNativeD1();
  if (nativeDb) {
    const stmt = params.length > 0 ? nativeDb.prepare(sql).bind(...params) : nativeDb.prepare(sql);
    const out = await stmt.all<T>();
    return Array.isArray(out?.results) ? out.results : [];
  }
  const rest = await queryRestD1<T>(sql, params);
  if (!rest.success) throw new Error(rest.error || 'Database query failed');
  return rest.results;
}

export async function dbFirst<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await dbAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function dbRun(sql: string, params: unknown[] = []): Promise<{ lastRowId?: number }> {
  const nativeDb = getNativeD1();
  if (nativeDb) {
    const stmt = params.length > 0 ? nativeDb.prepare(sql).bind(...params) : nativeDb.prepare(sql);
    const out = await stmt.run();
    return { lastRowId: out?.meta?.last_row_id };
  }
  const rest = await queryRestD1(sql, params);
  if (!rest.success) throw new Error(rest.error || 'Database write failed');
  return { lastRowId: rest.lastRowId };
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS sarkari_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    department TEXT,
    post_date TEXT,
    last_date TEXT,
    short_desc TEXT,
    total_vacancy TEXT,
    important_dates TEXT,
    application_fee TEXT,
    age_limit TEXT,
    vacancy_details TEXT,
    category_details TEXT,
    how_to_apply TEXT,
    article_content TEXT,
    thumbnail TEXT,
    links TEXT,
    notification_pdf TEXT,
    admit_card_url TEXT,
    result_url TEXT,
    apply_online_url TEXT,
    official_website_url TEXT,
    views INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    author_id INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sarkari_post_categories (
    post_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    display_title TEXT,
    bumped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, category)
  )`,
  `CREATE TABLE IF NOT EXISTS sarkari_authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'Senior Recruitment Analyst & Fact-Checker Lead',
    email TEXT,
    qualification TEXT,
    experience TEXT,
    bio TEXT,
    avatar_url TEXT DEFAULT 'https://upload.cbtrank.com/logo.png',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sarkari_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS sarkari_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    url TEXT NOT NULL,
    bg_color TEXT DEFAULT '#ab183d',
    display_order INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS sarkari_marquees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    display_order INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS sarkari_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT,
    file_key TEXT,
    file_url TEXT,
    storage_type TEXT DEFAULT 'r2',
    file_size INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sarkari_post_daily_views (
    post_id INTEGER NOT NULL,
    view_date TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    PRIMARY KEY (post_id, view_date)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sp_slug ON sarkari_posts(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_sp_cat_status ON sarkari_posts(category, status, id DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_sp_status_id ON sarkari_posts(status, id DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_spc_cat_bump ON sarkari_post_categories(category, bumped_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_spdv_date ON sarkari_post_daily_views(view_date, views DESC)`
];

const DEFAULT_BADGES = [
  { title: 'Latest Jobs 2026', subtitle: 'Apply Online Now', url: '/latest-jobs', bg_color: '#8e1030', order: 1 },
  { title: 'Admit Card 2026', subtitle: 'Download Hall Ticket', url: '/admit-card', bg_color: '#0c1cae', order: 2 },
  { title: 'Exam Results', subtitle: 'Check Scorecard', url: '/results', bg_color: '#15803d', order: 3 },
  { title: 'Answer Keys', subtitle: 'Official Key & Calculator', url: '/answer-key', bg_color: '#7e22ce', order: 4 },
  { title: 'Exam Syllabus', subtitle: 'Subject-Wise PDF', url: '/syllabus', bg_color: '#b45309', order: 5 },
  { title: 'Rank Calculator', subtitle: 'Check Shift Rank', url: '/answerkey', bg_color: '#0f766e', order: 6 },
  { title: 'Admission Forms', subtitle: 'Counselling & Entrance', url: '/category/admission', bg_color: '#c2410c', order: 7 },
  { title: 'Important Alerts', subtitle: 'OTR & Calendars', url: '/category/important', bg_color: '#1e293b', order: 8 }
];

const DEFAULT_MARQUEES = [
  { title: 'CBTRANK Sarkari Portal: Latest Jobs, Admit Card, Results, Answer Keys & Syllabus Live Now', url: '/latest-jobs', order: 1 },
  { title: 'Check Your CBT Exam Marks, Normalized Score & Live Shift Rank Instantly', url: '/answerkey', order: 2 }
];

export async function ensureSarkariSchema(): Promise<boolean> {
  if (schemaInitialized) return true;
  if (!getNativeD1() && !getRestConfig()) return false;

  try {
    for (const stmt of SCHEMA_STATEMENTS) {
      await dbRun(stmt);
    }

    // Safe column migrations for older tables
    for (const colSql of [
      'ALTER TABLE sarkari_authors ADD COLUMN email TEXT',
      'ALTER TABLE sarkari_authors ADD COLUMN qualification TEXT',
      'ALTER TABLE sarkari_authors ADD COLUMN experience TEXT'
    ]) {
      try {
        await dbRun(colSql);
      } catch {}
    }

    await dbRun(
      `INSERT OR IGNORE INTO sarkari_authors (id, name, slug, role, email, qualification, experience, bio, avatar_url, is_active)
       VALUES (1, 'Mangal', 'mangal', 'Senior Recruitment Analyst & Fact-Checker Lead', 'contact@cbtrank.com', 'B.Tech & Competitive Exam Analyst', '5+ Years Govt Recruitment Tracking', 'Verified recruitment researcher and editorial lead at CBT RANK.', 'https://upload.cbtrank.com/logo.png', 1)`
    );

    const badgeCount = await dbFirst<{ total: number }>('SELECT COUNT(*) AS total FROM sarkari_badges');
    if (Number(badgeCount?.total || 0) === 0) {
      for (const b of DEFAULT_BADGES) {
        await dbRun(
          'INSERT INTO sarkari_badges (title, subtitle, url, bg_color, display_order) VALUES (?, ?, ?, ?, ?)',
          [b.title, b.subtitle, b.url, b.bg_color, b.order]
        );
      }
    }

    const mqCount = await dbFirst<{ total: number }>('SELECT COUNT(*) AS total FROM sarkari_marquees');
    if (Number(mqCount?.total || 0) === 0) {
      for (const m of DEFAULT_MARQUEES) {
        await dbRun(
          'INSERT INTO sarkari_marquees (title, url, display_order) VALUES (?, ?, ?)',
          [m.title, m.url, m.order]
        );
      }
    }

    const defaultSettings: Array<[string, string]> = [
      ['post_detail_layout', 'blog_2col'],
      ['site_title', 'CBT RANK'],
      ['header_subtitle', 'WWW.CBTRANK.COM — SARKARI JOBS, ADMIT CARD & RESULTS'],
      ['telegram_url', 'https://t.me/cbtrank'],
      ['whatsapp_url', ''],
      ['hidden_categories', '[]'],
      ['auto_hide_empty_categories', '0']
    ];
    for (const [k, v] of defaultSettings) {
      await dbRun('INSERT OR IGNORE INTO sarkari_settings (key, value) VALUES (?, ?)', [k, v]);
    }

    schemaInitialized = true;
    return true;
  } catch {
    return false;
  }
}

export async function getSarkariSettings(): Promise<Record<string, string>> {
  const defaults: Record<string, string> = {
    post_detail_layout: 'blog_2col',
    telegram_url: 'https://t.me/cbtrank',
    whatsapp_url: '',
    youtube_url: '',
    twitter_url: '',
    site_title: 'CBT RANK',
    header_subtitle: 'WWW.CBTRANK.COM',
    site_tagline: 'Latest Govt Jobs, Admit Card, Results & Rank Calculator',
    site_domain: 'https://cbtrank.com',
    site_logo: 'https://upload.cbtrank.com/logo.png',
    site_favicon: '/favicon.ico',
    copyright_text: '© {year} cbtrank.com. All Rights Reserved.',
    hidden_categories: '[]',
    auto_hide_empty_categories: '0',
    notice_banner_active: '0',
    notice_banner_text: '',
    notice_banner_url: '',
    notice_banner_bg: '#dc2626',
    contact_email: 'contact@cbtrank.com',
    meta_description: 'Latest Government Jobs, Admit Cards, Exam Results, Answer Keys & Syllabus on CBTRank.',
    meta_keywords: 'CBTRank, Sarkari Result, Latest Govt Jobs 2026, Admit Card, Answer Key, Syllabus',
    google_site_verification: '',
    adsense_client_id: ''
  };
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return defaults;
    const rows = await dbAll<{ key: string; value: string }>('SELECT key, value FROM sarkari_settings');
    for (const r of rows) {
      if (r?.key) defaults[r.key] = String(r.value ?? '');
    }
  } catch {}
  return defaults;
}

export async function saveSarkariSetting(key: string, value: string): Promise<void> {
  const ok = await ensureSarkariSchema();
  if (!ok) {
    throw new Error('Cloudflare D1 Database (DB binding or CF_D1_TOKEN) is not attached in Cloudflare Pages.');
  }
  await dbRun(
    'INSERT INTO sarkari_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

export async function saveSarkariSettingsBatch(entries: Array<[string, string]>): Promise<void> {
  if (!entries.length) return;
  const ok = await ensureSarkariSchema();
  if (!ok) {
    throw new Error('Cloudflare D1 Database (DB binding or CF_D1_TOKEN) is not attached in Cloudflare Pages.');
  }

  // Batch into compact multi-row upserts so Cloudflare Worker subrequest limits are never hit
  const CHUNK_SIZE = 12;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    const placeholders = chunk.map(() => '(?, ?)').join(', ');
    const params: unknown[] = [];
    for (const [k, v] of chunk) {
      params.push(k, v);
    }
    await dbRun(
      `INSERT INTO sarkari_settings (key, value) VALUES ${placeholders}
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      params
    );
  }
}

export function getHiddenCategoriesSet(settings: Record<string, string>, countMap: Record<string, number>): Set<string> {
  const hiddenSet = new Set<string>();
  try {
    const arr = JSON.parse(settings.hidden_categories || '[]');
    if (Array.isArray(arr)) {
      arr.forEach((c) => hiddenSet.add(String(c)));
    }
  } catch {}

  if (settings.auto_hide_empty_categories === '1') {
    for (const key of SARKARI_CATEGORY_KEYS) {
      if (Number(countMap[key] || 0) === 0) {
        hiddenSet.add(key);
      }
    }
  }
  return hiddenSet;
}

export async function fetchSarkariBadges(): Promise<SarkariBadge[]> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return [];
    return await dbAll<SarkariBadge>('SELECT * FROM sarkari_badges ORDER BY display_order ASC, id ASC');
  } catch {
    return [];
  }
}

export async function fetchSarkariMarquees(): Promise<SarkariMarquee[]> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return [];
    return await dbAll<SarkariMarquee>('SELECT * FROM sarkari_marquees ORDER BY display_order ASC, id ASC');
  } catch {
    return [];
  }
}

export async function fetchSarkariUploads(limit = 50): Promise<SarkariUpload[]> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return [];
    return await dbAll<SarkariUpload>('SELECT * FROM sarkari_uploads ORDER BY id DESC LIMIT ?', [limit]);
  } catch {
    return [];
  }
}

export async function fetchAllSarkariAuthors(): Promise<SarkariAuthor[]> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return [];
    return await dbAll<SarkariAuthor>(
      `SELECT a.*, (SELECT COUNT(*) FROM sarkari_posts p WHERE p.author_id = a.id) AS post_count
       FROM sarkari_authors a
       ORDER BY a.id ASC`
    );
  } catch {
    return [];
  }
}

export async function getSarkariPostCategoryMap(
  postId: number
): Promise<Record<string, { category: string; display_title: string; bumped_at: string }>> {
  const map: Record<string, { category: string; display_title: string; bumped_at: string }> = {};
  if (!postId) return map;
  try {
    const rows = await dbAll<{ category: string; display_title: string; bumped_at: string }>(
      'SELECT category, display_title, bumped_at FROM sarkari_post_categories WHERE post_id = ? ORDER BY bumped_at DESC',
      [postId]
    );
    for (const r of rows) {
      if (r?.category) {
        map[r.category] = {
          category: r.category,
          display_title: r.display_title || '',
          bumped_at: r.bumped_at || ''
        };
      }
    }
  } catch {}
  return map;
}

function getUtcTs(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function getIstDateString(offsetDays = 0): string {
  const now = new Date(Date.now() + 5.5 * 3600 * 1000 + offsetDays * 86400 * 1000);
  return now.toISOString().slice(0, 10);
}

export async function syncSarkariPostCategories(opts: {
  postId: number;
  primaryCategory: string;
  newTitle: string;
  previousPost: SarkariPost | null;
  extraCategories?: string[];
  categoryTitles?: Record<string, string>;
  bumpPrimary?: boolean;
}): Promise<void> {
  const { postId, primaryCategory, newTitle, previousPost, extraCategories, categoryTitles, bumpPrimary } = opts;
  if (!postId || !primaryCategory) return;

  const nowTs = getUtcTs();
  const existingMap = previousPost ? await getSarkariPostCategoryMap(postId) : {};

  if (previousPost && previousPost.category && !existingMap[previousPost.category]) {
    const prevTs = previousPost.created_at || previousPost.updated_at || nowTs;
    await dbRun(
      'INSERT OR IGNORE INTO sarkari_post_categories (post_id, category, display_title, bumped_at) VALUES (?, ?, ?, ?)',
      [postId, previousPost.category, previousPost.title || newTitle, prevTs]
    );
    existingMap[previousPost.category] = {
      category: previousPost.category,
      display_title: previousPost.title || newTitle,
      bumped_at: prevTs
    };
  }

  const targetSet = new Set<string>();
  if (Array.isArray(extraCategories)) {
    for (const c of extraCategories) {
      if (c && SARKARI_CATEGORIES[c]) targetSet.add(c);
    }
  } else {
    Object.keys(existingMap).forEach((k) => targetSet.add(k));
  }
  if (SARKARI_CATEGORIES[primaryCategory]) targetSet.add(primaryCategory);

  const categoryChanged = Boolean(previousPost && previousPost.category !== primaryCategory);
  if (categoryChanged && previousPost?.category && !Array.isArray(extraCategories)) {
    targetSet.add(previousPost.category);
  }

  for (const oldCat of Object.keys(existingMap)) {
    if (!targetSet.has(oldCat) && oldCat !== primaryCategory) {
      await dbRun('DELETE FROM sarkari_post_categories WHERE post_id = ? AND category = ?', [postId, oldCat]);
    }
  }

  for (const cat of targetSet) {
    const existingRow = existingMap[cat];
    const submittedTitle = String(categoryTitles?.[cat] || '').trim();

    if (cat === primaryCategory) {
      let resolvedTitle = newTitle;
      if (submittedTitle) {
        if (!categoryChanged && previousPost && submittedTitle === previousPost.title && newTitle !== previousPost.title) {
          resolvedTitle = newTitle;
        } else {
          resolvedTitle = submittedTitle;
        }
      }
      const shouldBump = !existingRow || categoryChanged || Boolean(bumpPrimary);
      const resolvedBump = shouldBump ? nowTs : (existingRow.bumped_at || nowTs);
      await dbRun(
        `INSERT INTO sarkari_post_categories (post_id, category, display_title, bumped_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(post_id, category) DO UPDATE SET
           display_title = excluded.display_title,
           bumped_at = excluded.bumped_at`,
        [postId, cat, resolvedTitle, resolvedBump]
      );
    } else if (existingRow) {
      const preservedTitle = submittedTitle || existingRow.display_title || (previousPost ? previousPost.title : newTitle);
      if (preservedTitle !== existingRow.display_title) {
        await dbRun(
          'UPDATE sarkari_post_categories SET display_title = ? WHERE post_id = ? AND category = ?',
          [preservedTitle, postId, cat]
        );
      }
    } else {
      await dbRun(
        `INSERT INTO sarkari_post_categories (post_id, category, display_title, bumped_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(post_id, category) DO UPDATE SET display_title = excluded.display_title`,
        [postId, cat, submittedTitle || newTitle, nowTs]
      );
    }
  }
}

export async function fetchCategorySarkariPosts(
  categorySlug: string,
  limit = 25,
  offset = 0,
  search = ''
): Promise<SarkariPost[]> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return [];
    const cleanSearch = search.trim();
    if (cleanSearch) {
      const term = `%${cleanSearch}%`;
      return await dbAll<SarkariPost>(
        `SELECT p.*, COALESCE(NULLIF(pc.display_title, ''), p.title) AS title, pc.bumped_at
         FROM sarkari_post_categories pc
         INNER JOIN sarkari_posts p ON p.id = pc.post_id
         WHERE pc.category = ? AND p.status = 'active'
           AND (p.title LIKE ? OR pc.display_title LIKE ? OR p.department LIKE ?)
         ORDER BY pc.bumped_at DESC, p.id DESC
         LIMIT ? OFFSET ?`,
        [categorySlug, term, term, term, limit, offset]
      );
    }
    return await dbAll<SarkariPost>(
      `SELECT p.*, COALESCE(NULLIF(pc.display_title, ''), p.title) AS title, pc.bumped_at
       FROM sarkari_post_categories pc
       INNER JOIN sarkari_posts p ON p.id = pc.post_id
       WHERE pc.category = ? AND p.status = 'active'
       ORDER BY pc.bumped_at DESC, p.id DESC
       LIMIT ? OFFSET ?`,
      [categorySlug, limit, offset]
    );
  } catch {
    return [];
  }
}

export async function countCategorySarkariPosts(categorySlug: string, search = ''): Promise<number> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return 0;
    const cleanSearch = search.trim();
    if (cleanSearch) {
      const term = `%${cleanSearch}%`;
      const row = await dbFirst<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM sarkari_post_categories pc
         INNER JOIN sarkari_posts p ON p.id = pc.post_id
         WHERE pc.category = ? AND p.status = 'active'
           AND (p.title LIKE ? OR pc.display_title LIKE ? OR p.department LIKE ?)`,
        [categorySlug, term, term, term]
      );
      return Number(row?.total || 0);
    }
    const row = await dbFirst<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM sarkari_post_categories pc
       INNER JOIN sarkari_posts p ON p.id = pc.post_id
       WHERE pc.category = ? AND p.status = 'active'`,
      [categorySlug]
    );
    return Number(row?.total || 0);
  } catch {
    return 0;
  }
}

export async function searchActiveSarkariPosts(query: string, limit = 30, offset = 0): Promise<SarkariPost[]> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return [];
    const term = `%${query.trim()}%`;
    return await dbAll<SarkariPost>(
      `SELECT * FROM sarkari_posts
       WHERE status = 'active' AND (title LIKE ? OR department LIKE ? OR short_desc LIKE ?)
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [term, term, term, limit, offset]
    );
  } catch {
    return [];
  }
}

export async function fetchRelatedSarkariPosts(
  categorySlug: string,
  excludePostId: number,
  limit = 6
): Promise<SarkariPost[]> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return [];
    return await dbAll<SarkariPost>(
      `SELECT p.id, COALESCE(NULLIF(pc.display_title, ''), p.title) AS title, p.slug, p.category, p.post_date
       FROM sarkari_post_categories pc
       INNER JOIN sarkari_posts p ON p.id = pc.post_id
       WHERE pc.category = ? AND p.id != ? AND p.status = 'active'
       ORDER BY pc.bumped_at DESC, p.id DESC
       LIMIT ?`,
      [categorySlug, excludePostId, limit]
    );
  } catch {
    return [];
  }
}

export async function fetchPopularActiveSarkariPosts(excludeId = 0, limit = 5): Promise<SarkariPost[]> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return [];
    return await dbAll<SarkariPost>(
      `SELECT id, title, slug, category, post_date, views, created_at
       FROM sarkari_posts WHERE status = 'active' AND id != ?
       ORDER BY COALESCE(views, 0) DESC, id DESC LIMIT ?`,
      [excludeId, limit]
    );
  } catch {
    return [];
  }
}

export async function fetchAllSarkariCategoryCounts(): Promise<Record<string, number>> {
  const map: Record<string, number> = {};
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return map;
    const rows = await dbAll<{ category: string; count: number }>(
      `SELECT pc.category, COUNT(DISTINCT pc.post_id) AS count
       FROM sarkari_post_categories pc
       INNER JOIN sarkari_posts p ON p.id = pc.post_id
       WHERE p.status = 'active'
       GROUP BY pc.category`
    );
    for (const r of rows) {
      if (r?.category) map[r.category] = Number(r.count || 0);
    }
  } catch {}
  return map;
}

export async function fetchSarkariPostBySlug(slug: string): Promise<SarkariPost | null> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return null;
    return await dbFirst<SarkariPost>('SELECT * FROM sarkari_posts WHERE slug = ?', [slug]);
  } catch {
    return null;
  }
}

export async function fetchSarkariPostById(id: number): Promise<SarkariPost | null> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return null;
    return await dbFirst<SarkariPost>('SELECT * FROM sarkari_posts WHERE id = ?', [id]);
  } catch {
    return null;
  }
}

export async function fetchRecentActiveSarkariPosts(excludeId = 0, limit = 5): Promise<SarkariPost[]> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return [];
    return await dbAll<SarkariPost>(
      `SELECT id, title, slug, category, post_date, created_at
       FROM sarkari_posts WHERE status = 'active' AND id != ? ORDER BY id DESC LIMIT ?`,
      [excludeId, limit]
    );
  } catch {
    return [];
  }
}

export async function fetchAllActiveSarkariSlugsForSitemap(): Promise<Array<{ slug: string; updated_at?: string }>> {
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return [];
    return await dbAll<{ slug: string; updated_at?: string }>(
      `SELECT slug, updated_at FROM sarkari_posts WHERE status = 'active' ORDER BY id DESC LIMIT 2000`
    );
  } catch {
    return [];
  }
}

export async function fetchSarkariAuthorById(id = 1): Promise<SarkariAuthor> {
  const fallback: SarkariAuthor = {
    id: 1,
    name: 'Mangal',
    slug: 'mangal',
    role: 'Senior Recruitment Analyst & Fact-Checker Lead',
    bio: 'Verified recruitment researcher and content editor at CBT RANK.',
    avatar_url: 'https://upload.cbtrank.com/logo.png'
  };
  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return fallback;
    const row = await dbFirst<SarkariAuthor>('SELECT * FROM sarkari_authors WHERE id = ?', [id]);
    return row || fallback;
  } catch {
    return fallback;
  }
}

export async function incrementSarkariPostView(postId: number): Promise<void> {
  try {
    const todayIst = getIstDateString(0);
    await dbRun('UPDATE sarkari_posts SET views = COALESCE(views, 0) + 1 WHERE id = ?', [postId]);
    await dbRun(
      `INSERT INTO sarkari_post_daily_views (post_id, view_date, views)
       VALUES (?, ?, 1)
       ON CONFLICT(post_id, view_date) DO UPDATE SET views = views + 1`,
      [postId, todayIst]
    );
  } catch {}
}

export async function fetchAdminAnalytics(): Promise<SarkariAnalyticsData> {
  const emptyTrend: SarkariAnalyticsData['dailyTrend'] = [];
  for (let d = -6; d <= 0; d++) {
    const dt = getIstDateString(d);
    const label = d === 0 ? 'Today' : dt.slice(5);
    emptyTrend.push({ date: dt, label, views: 0, isToday: d === 0 });
  }
  const fallback: SarkariAnalyticsData = {
    todayViews: 0,
    yesterdayViews: 0,
    todayPostsViewed: 0,
    totalViews: 0,
    weekViewsTotal: 0,
    maxDailyViews: 1,
    dailyTrend: emptyTrend,
    topPostsOverall: [],
    topPostsToday: [],
    categoryViews: []
  };

  try {
    const ok = await ensureSarkariSchema();
    if (!ok) return fallback;

    const todayStr = getIstDateString(0);
    const yesterdayStr = getIstDateString(-1);
    const start7Str = getIstDateString(-6);

    const [
      totalRow,
      todayRow,
      yestRow,
      dailyRows,
      topOverall,
      topToday,
      catRows
    ] = await Promise.all([
      dbFirst<{ total: number }>('SELECT COALESCE(SUM(views), 0) AS total FROM sarkari_posts'),
      dbFirst<{ total: number; postCount: number }>(
        'SELECT COALESCE(SUM(views), 0) AS total, COUNT(DISTINCT post_id) AS postCount FROM sarkari_post_daily_views WHERE view_date = ?',
        [todayStr]
      ),
      dbFirst<{ total: number }>(
        'SELECT COALESCE(SUM(views), 0) AS total FROM sarkari_post_daily_views WHERE view_date = ?',
        [yesterdayStr]
      ),
      dbAll<{ view_date: string; total: number }>(
        'SELECT view_date, COALESCE(SUM(views), 0) AS total FROM sarkari_post_daily_views WHERE view_date >= ? GROUP BY view_date ORDER BY view_date ASC',
        [start7Str]
      ),
      dbAll<{ id: number; title: string; slug: string; category: string; views: number }>(
        'SELECT id, title, slug, category, COALESCE(views, 0) AS views FROM sarkari_posts ORDER BY views DESC, id DESC LIMIT 5'
      ),
      dbAll<{ id: number; title: string; slug: string; category: string; today_views: number }>(
        `SELECT p.id, p.title, p.slug, p.category, dv.views AS today_views
         FROM sarkari_post_daily_views dv
         INNER JOIN sarkari_posts p ON p.id = dv.post_id
         WHERE dv.view_date = ?
         ORDER BY dv.views DESC LIMIT 5`,
        [todayStr]
      ),
      dbAll<{ category: string; views: number }>(
        'SELECT category, COALESCE(SUM(views), 0) AS views FROM sarkari_posts GROUP BY category ORDER BY views DESC'
      )
    ]);

    const dailyMap = new Map<string, number>();
    for (const r of dailyRows) {
      if (r?.view_date) dailyMap.set(r.view_date, Number(r.total || 0));
    }

    let weekViewsTotal = 0;
    let maxDailyViews = 1;
    const dailyTrend = emptyTrend.map((slot) => {
      const v = dailyMap.get(slot.date) || 0;
      weekViewsTotal += v;
      if (v > maxDailyViews) maxDailyViews = v;
      return { ...slot, views: v };
    });

    const totalViews = Number(totalRow?.total || 0);
    const maxCat = Math.max(1, ...catRows.map((c) => Number(c.views || 0)));
    const categoryViews = catRows.map((c) => ({
      category: c.category,
      name: SARKARI_CATEGORIES[c.category]?.name || c.category,
      views: Number(c.views || 0),
      pct: Math.round((Number(c.views || 0) / maxCat) * 100)
    }));

    return {
      todayViews: Number(todayRow?.total || 0),
      yesterdayViews: Number(yestRow?.total || 0),
      todayPostsViewed: Number(todayRow?.postCount || 0),
      totalViews,
      weekViewsTotal,
      maxDailyViews,
      dailyTrend,
      topPostsOverall: topOverall,
      topPostsToday: topToday,
      categoryViews
    };
  } catch {
    return fallback;
  }
}
