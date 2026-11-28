export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromCookies } from '../../../lib/sarkariAuth';
import { dbRun, fetchSarkariUploads } from '../../../lib/sarkariDb';

export async function GET() {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let isR2Configured = Boolean(process.env.R2_UPLOAD_URL);
  let publicDomain = 'https://upload.cbtrank.com';
  try {
    const ctx = getRequestContext();
    const env = (ctx?.env || {}) as Record<string, any>;
    if (env.R2 || env.BUCKET || env.STORAGE_BUCKET || env.UPLOAD_BUCKET) {
      isR2Configured = true;
    }
    if (env.R2_PUBLIC_URL || env.R2_PUBLIC_DOMAIN) {
      publicDomain = String(env.R2_PUBLIC_URL || env.R2_PUBLIC_DOMAIN);
    }
  } catch {}

  const uploads = await fetchSarkariUploads(60);
  return NextResponse.json({ isR2Configured, publicDomain, uploads });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get('id') || 0);
    const fileKey = url.searchParams.get('key') || '';
    if (!id) return NextResponse.json({ error: 'Invalid upload id' }, { status: 400 });

    if (fileKey) {
      try {
        const ctx = getRequestContext();
        const env = (ctx?.env || {}) as Record<string, any>;
        const bucket = env.R2 || env.BUCKET || env.STORAGE_BUCKET || env.UPLOAD_BUCKET;
        if (bucket && typeof bucket.delete === 'function') {
          await bucket.delete(fileKey);
        }
      } catch {}
    }

    await dbRun('DELETE FROM sarkari_uploads WHERE id = ?', [id]);
    const uploads = await fetchSarkariUploads(60);
    return NextResponse.json({ success: true, uploads });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Delete failed' }, { status: 500 });
  }
}
