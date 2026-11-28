export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  isAdminAuthenticatedFromCookies,
  verifyAdminCredentials
} from '../../../lib/sarkariAuth';
import { getD1ConnectionStatus } from '../../../lib/sarkariDb';

export async function GET() {
  const authenticated = await isAdminAuthenticatedFromCookies();
  const dbStatus = authenticated ? await getD1ConnectionStatus() : undefined;
  return NextResponse.json({ authenticated, dbStatus }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { username?: string; password?: string };
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    const ok = await verifyAdminCredentials(username, password);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Invalid admin username or password' }, { status: 401 });
    }

    const token = await createAdminSessionToken(username);
    const res = NextResponse.json({ success: true, authenticated: true });
    let isHttps = process.env.NODE_ENV === 'production';
    try {
      isHttps = new URL(req.url).protocol === 'https:';
    } catch {}
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttps,
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });
    return res;
  } catch {
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
  return res;
}
