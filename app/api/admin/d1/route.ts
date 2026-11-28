export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromCookies } from '../../../lib/sarkariAuth';
import { dbAll, dbFirst, ensureSarkariSchema, getD1ConnectionStatus } from '../../../lib/sarkariDb';

const TABLE_NAMES = [
  'sarkari_posts',
  'sarkari_post_categories',
  'sarkari_authors',
  'sarkari_settings',
  'sarkari_badges',
  'sarkari_marquees',
  'sarkari_uploads',
  'sarkari_post_daily_views'
];

export async function GET() {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const dbStatus = await getD1ConnectionStatus();
  const tableStats: Array<{ name: string; count: number }> = [];
  if (dbStatus.connected) {
    await ensureSarkariSchema();
    for (const tbl of TABLE_NAMES) {
      try {
        const row = await dbFirst<{ cnt: number }>(`SELECT COUNT(*) AS cnt FROM ${tbl}`);
        tableStats.push({ name: tbl, count: Number(row?.cnt || 0) });
      } catch {
        tableStats.push({ name: tbl, count: 0 });
      }
    }
  }
  return NextResponse.json({ dbStatus, tableStats });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { sql_query?: string };
    const sql = String(body.sql_query || '').trim();
    if (!sql) {
      return NextResponse.json({ error: 'SQL query cannot be empty' }, { status: 400 });
    }
    await ensureSarkariSchema();
    const rows = await dbAll(sql);
    return NextResponse.json({ success: true, rows });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'SQL execution failed' }, { status: 400 });
  }
}
