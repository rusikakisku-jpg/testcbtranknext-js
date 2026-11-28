export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';
import { isAdminAuthenticatedFromCookies } from '../../../lib/sarkariAuth';
import {
  dbAll,
  dbFirst,
  ensureSarkariSchema,
  fetchAdminAnalytics,
  fetchSarkariBadges,
  fetchSarkariMarquees,
  fetchSarkariUploads,
  getD1ConnectionStatus,
  getSarkariSettings
} from '../../../lib/sarkariDb';
import { SarkariPost } from '../../../lib/sarkariConstants';

export async function GET() {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbStatus = await getD1ConnectionStatus();
  let isR2Configured = Boolean(process.env.R2_UPLOAD_URL);
  try {
    const ctx = getRequestContext();
    const env = (ctx?.env || {}) as Record<string, any>;
    if (env.R2 || env.BUCKET || env.STORAGE_BUCKET || env.UPLOAD_BUCKET) {
      isR2Configured = true;
    }
  } catch {}

  if (!dbStatus.connected) {
    return NextResponse.json({
      dbStatus,
      isR2Configured,
      totalPosts: 0,
      activePosts: 0,
      draftPosts: 0,
      uploadsCount: 0,
      badgesCount: 0,
      marqueesCount: 0,
      analytics: await fetchAdminAnalytics(),
      recentPosts: [],
      settings: await getSarkariSettings()
    });
  }

  await ensureSarkariSchema();
  const [totalRow, activeRow, draftRow, uploads, badges, marquees, analytics, recentPosts, settings] = await Promise.all([
    dbFirst<{ c: number }>('SELECT COUNT(*) AS c FROM sarkari_posts'),
    dbFirst<{ c: number }>("SELECT COUNT(*) AS c FROM sarkari_posts WHERE status = 'active'"),
    dbFirst<{ c: number }>("SELECT COUNT(*) AS c FROM sarkari_posts WHERE status = 'draft'"),
    fetchSarkariUploads(100),
    fetchSarkariBadges(),
    fetchSarkariMarquees(),
    fetchAdminAnalytics(),
    dbAll<SarkariPost>('SELECT id, title, slug, category, department, last_date, status, views, created_at FROM sarkari_posts ORDER BY id DESC LIMIT 10'),
    getSarkariSettings()
  ]);

  return NextResponse.json(
    {
      dbStatus,
      isR2Configured,
      totalPosts: Number(totalRow?.c || 0),
      activePosts: Number(activeRow?.c || 0),
      draftPosts: Number(draftRow?.c || 0),
      uploadsCount: uploads.length,
      badgesCount: badges.length,
      marqueesCount: marquees.length,
      analytics,
      recentPosts,
      settings
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
