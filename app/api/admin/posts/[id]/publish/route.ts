export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromCookies } from '../../../../../lib/sarkariAuth';
import { dbRun, ensureSarkariSchema } from '../../../../../lib/sarkariDb';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, context: RouteContext) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await ensureSarkariSchema();
  const { id } = await context.params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }
  await dbRun(
    "UPDATE sarkari_posts SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [postId]
  );
  return NextResponse.json({ success: true });
}
