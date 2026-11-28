export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromCookies } from '../../../lib/sarkariAuth';
import { dbRun, ensureSarkariSchema, fetchSarkariBadges } from '../../../lib/sarkariDb';

export async function GET() {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const badges = await fetchSarkariBadges();
  return NextResponse.json({ badges });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await ensureSarkariSchema();
    const body = (await req.json()) as {
      id?: number;
      title?: string;
      subtitle?: string;
      url?: string;
      bg_color?: string;
      display_order?: number;
    };
    const title = String(body.title || '').trim();
    const subtitle = String(body.subtitle || '').trim();
    const url = String(body.url || '').trim();
    const bgColor = String(body.bg_color || '#ab183d').trim();
    const displayOrder = Number(body.display_order || 1);

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    if (body.id) {
      await dbRun(
        'UPDATE sarkari_badges SET title = ?, subtitle = ?, url = ?, bg_color = ?, display_order = ? WHERE id = ?',
        [title, subtitle, url, bgColor, displayOrder, Number(body.id)]
      );
    } else {
      await dbRun(
        'INSERT INTO sarkari_badges (title, subtitle, url, bg_color, display_order) VALUES (?, ?, ?, ?, ?)',
        [title, subtitle, url, bgColor, displayOrder]
      );
    }
    const badges = await fetchSarkariBadges();
    return NextResponse.json({ success: true, badges });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save badge' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const id = Number(new URL(req.url).searchParams.get('id') || 0);
    if (!id) return NextResponse.json({ error: 'Invalid badge id' }, { status: 400 });
    await dbRun('DELETE FROM sarkari_badges WHERE id = ?', [id]);
    const badges = await fetchSarkariBadges();
    return NextResponse.json({ success: true, badges });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete badge' }, { status: 500 });
  }
}
