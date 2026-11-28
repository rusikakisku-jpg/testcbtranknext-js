import { getRequestContext } from '@cloudflare/next-on-pages';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'cbtrank_sarkari_admin';

function readEnvVar(key: string): string {
  try {
    const ctx = getRequestContext();
    const env = (ctx?.env || {}) as Record<string, unknown>;
    if (env[key] !== undefined && env[key] !== null && String(env[key]).trim() !== '') {
      return String(env[key]).trim();
    }
  } catch {}
  return String(process.env[key] || '').trim();
}

function getAuthSecret(): string {
  return (
    readEnvVar('SESSION_SECRET') ||
    readEnvVar('ADMIN_API_KEY') ||
    'cbtrank_sarkari_session_secret_2026'
  );
}

export function getExpectedAdminPassword(): string {
  return readEnvVar('ADMIN_PASSWORD') || 'cbtrank@2026';
}

export function getExpectedAdminUsername(): string {
  return (readEnvVar('ADMIN_USERNAME') || 'admin').toLowerCase();
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createAdminSessionToken(username: string): Promise<string> {
  const cleanUser = username.trim().toLowerCase();
  return hmacHex(`admin-session:${cleanUser}`, getAuthSecret());
}

export async function verifyAdminSessionToken(token?: string | null): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  const expected = await createAdminSessionToken(getExpectedAdminUsername());
  return timingSafeEqualStr(token.trim(), expected);
}

export async function isAdminAuthenticatedFromCookies(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return await verifyAdminSessionToken(token);
  } catch {
    return false;
  }
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const expectedUser = getExpectedAdminUsername();
  const expectedPass = getExpectedAdminPassword();
  return (
    String(username || '').trim().toLowerCase() === expectedUser &&
    String(password || '') === expectedPass
  );
}

export async function signDraftPreviewToken(postId: number, slug: string): Promise<string> {
  if (!postId || !slug) return '';
  const hex = await hmacHex(`draft-preview:${postId}:${slug}`, getAuthSecret());
  return hex.slice(0, 24);
}

export async function verifyDraftPreviewToken(
  postId: number,
  slug: string,
  token?: string | null
): Promise<boolean> {
  if (!postId || !slug || !token) return false;
  const expected = await signDraftPreviewToken(postId, slug);
  return timingSafeEqualStr(expected, String(token).trim());
}

export async function buildPostViewOrPreviewUrl(post: {
  id: number;
  slug: string;
  status?: string;
}): Promise<string> {
  if (!post?.slug) return '';
  if (post.status === 'active') return `/post/${post.slug}`;
  const tok = await signDraftPreviewToken(post.id, post.slug);
  return `/post/${post.slug}?preview=${encodeURIComponent(tok)}`;
}
