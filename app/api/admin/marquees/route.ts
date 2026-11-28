export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromCookies } from '../../../lib/sarkariAuth';
import { dbRun, ensureSarkariSchema, fetchSarkariMarquees } from '../../../lib/sarkariDb';

export async function GET() {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const marquees = await fetchSarkariMarquees();
  return NextResponse.json({ marquees });
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
      url?: string;
      display_order?: number;
    };
    const title = String(body.title || '').trim();
    const url = String(body.url || '').trim();
    const displayOrder = Number(body.display_order || 1);

    if (!title || !url) {
      return NextResponse.json({ error: 'Ticker text and URL are required' }, { status: 400 });
    }

    if (body.id) {
      await dbRun(
        'UPDATE sarkari_marquees SET title = ?, url = ?, display_order = ? WHERE id = ?',
        [title, url, displayOrder, Number(body.id)]
      );
    } else {
      await dbRun(
        'INSERT INTO sarkari_marquees (title, url, display_order) VALUES (?, ?, ?)',
        [title, url, displayOrder]
      );
    }
    const marquees = await fetchSarkariMarquees();
    return NextResponse.json({ success: true, marquees });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save marquee' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const id = Number(new URL(req.url).searchParams.get('id') || 0);
    if (!id) return NextResponse.json({ error: 'Invalid marquee id' }, { status: 400 });
    await dbRun('DELETE FROM sarkari_marquees WHERE id = ?', [id]);
    const marquees = await fetchSarkariMarquees();
    return NextResponse.json({ success: true, marquees });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete marquee' }, { status: 500 });
  }
}
