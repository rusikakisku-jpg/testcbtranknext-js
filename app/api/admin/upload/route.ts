export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromCookies } from '../../../lib/sarkariAuth';

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') || formData.get('image') || formData.get('upload');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No file selected' }, { status: 400 });
    }

    const blob = file as File;
    const rawName = (blob.name || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const key = `${Date.now()}-${rawName}`;

    // 1. Prefer native R2 binding if configured in Cloudflare Pages
    let r2Bucket: any = null;
    let r2PublicDomain = 'https://upload.cbtrank.com';
    try {
      const ctx = getRequestContext();
      const env = (ctx?.env || {}) as Record<string, any>;
      r2Bucket = env.R2 || env.BUCKET || env.STORAGE_BUCKET || env.UPLOAD_BUCKET || null;
      if (env.R2_PUBLIC_URL || env.R2_PUBLIC_DOMAIN) {
        r2PublicDomain = String(env.R2_PUBLIC_URL || env.R2_PUBLIC_DOMAIN).replace(/\/+$/, '');
      }
    } catch {}

    if (r2Bucket && typeof r2Bucket.put === 'function') {
      const arr = await blob.arrayBuffer();
      await r2Bucket.put(key, arr, {
        httpMetadata: {
          contentType: blob.type || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000'
        }
      });
      const fullUrl = `${r2PublicDomain}/${key}`;
      return NextResponse.json({ success: true, url: fullUrl, location: fullUrl, key });
    }

    // 2. Fallback to optional external R2 upload worker endpoint if configured
    const externalUploadUrl = process.env.R2_UPLOAD_URL || '';
    if (externalUploadUrl) {
      const fwd = new FormData();
      fwd.append('file', blob, rawName);
      const upRes = await fetch(externalUploadUrl, { method: 'POST', body: fwd });
      const upJson = (await upRes.json().catch(() => null)) as any;
      if (upRes.ok && upJson?.url) {
        const normalizedUrl = upJson.url.startsWith('http')
          ? upJson.url
          : `${r2PublicDomain}/${String(upJson.url).replace(/^\/+/, '')}`;
        return NextResponse.json({ success: true, url: normalizedUrl, location: normalizedUrl });
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'R2 Bucket binding (R2 or BUCKET) not attached to Cloudflare Pages. Attach your R2 bucket or paste an upload.cbtrank.com URL directly.'
      },
      { status: 501 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
