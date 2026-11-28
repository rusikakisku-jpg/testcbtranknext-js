export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { incrementSarkariPostView } from '../../../lib/sarkariDb';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { postId?: number };
    const postId = Number(body.postId);
    if (!postId || isNaN(postId)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    await incrementSarkariPostView(postId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
