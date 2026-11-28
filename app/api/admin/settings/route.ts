export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromCookies } from '../../../lib/sarkariAuth';
import {
  fetchAllSarkariCategoryCounts,
  getD1ConnectionStatus,
  getSarkariSettings,
  saveSarkariSettingsBatch
} from '../../../lib/sarkariDb';

const ALLOWED_SETTING_KEYS = new Set([
  'post_detail_layout',
  'site_title',
  'header_subtitle',
  'site_tagline',
  'site_domain',
  'copyright_text',
  'site_logo',
  'site_favicon',
  'hidden_categories',
  'auto_hide_empty_categories',
  'telegram_url',
  'whatsapp_url',
  'youtube_url',
  'twitter_url',
  'contact_email',
  'meta_description',
  'meta_keywords',
  'google_site_verification',
  'adsense_client_id',
  'notice_banner_active',
  'notice_banner_text',
  'notice_banner_url',
  'notice_banner_bg'
]);

export async function GET() {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [dbStatus, settings, categoryCountMap] = await Promise.all([
    getD1ConnectionStatus(),
    getSarkariSettings(),
    fetchAllSarkariCategoryCounts()
  ]);
  return NextResponse.json(
    { dbStatus, settings, categoryCountMap },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const dbStatus = await getD1ConnectionStatus();
    if (!dbStatus.connected) {
      return NextResponse.json(
        { success: false, error: dbStatus.message || 'Cloudflare D1 database is not connected yet.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const entries: Array<[string, string]> = [];
    for (const [k, v] of Object.entries(body)) {
      if (!ALLOWED_SETTING_KEYS.has(k)) continue;
      if (k === 'post_detail_layout') {
        entries.push([k, v === 'classic' ? 'classic' : 'blog_2col']);
      } else if (k === 'hidden_categories') {
        entries.push([k, Array.isArray(v) ? JSON.stringify(v) : String(v || '[]')]);
      } else {
        entries.push([k, String(v ?? '')]);
      }
    }

    await saveSarkariSettingsBatch(entries);
    const settings = await getSarkariSettings();
    return NextResponse.json(
      { success: true, settings },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save settings' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
