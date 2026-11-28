export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromCookies } from '../../../lib/sarkariAuth';
import { getSarkariSettings, saveSarkariSetting } from '../../../lib/sarkariDb';

export async function GET() {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const settings = await getSarkariSettings();
  return NextResponse.json({ success: true, settings }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Record<string, string>;
    const allowed = ['post_detail_layout', 'telegram_url', 'whatsapp_url'];
    for (const k of allowed) {
      if (body[k] !== undefined) {
        await saveSarkariSetting(k, String(body[k]).trim());
      }
    }
    const settings = await getSarkariSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Save failed' }, { status: 500 });
  }
}
