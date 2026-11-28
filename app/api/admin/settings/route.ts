export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromCookies } from '../../../lib/sarkariAuth';
import {
  fetchAllSarkariCategoryCounts,
  getSarkariSettings,
  saveSarkariSetting
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
  const [settings, categoryCountMap] = await Promise.all([
    getSarkariSettings(),
    fetchAllSarkariCategoryCounts()
  ]);
  return NextResponse.json({ settings, categoryCountMap });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    for (const [k, v] of Object.entries(body)) {
      if (!ALLOWED_SETTING_KEYS.has(k)) continue;
      if (k === 'post_detail_layout') {
        const val = v === 'classic' ? 'classic' : 'blog_2col';
        await saveSarkariSetting(k, val);
      } else if (k === 'hidden_categories') {
        const val = Array.isArray(v) ? JSON.stringify(v) : String(v || '[]');
        await saveSarkariSetting(k, val);
      } else {
        await saveSarkariSetting(k, String(v ?? ''));
      }
    }
    const settings = await getSarkariSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save settings' }, { status: 500 });
  }
}
