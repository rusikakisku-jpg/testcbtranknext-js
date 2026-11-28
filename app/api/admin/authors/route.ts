export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromCookies } from '../../../lib/sarkariAuth';
import { slugifyText } from '../../../lib/sarkariConstants';
import { dbRun, ensureSarkariSchema, fetchAllSarkariAuthors } from '../../../lib/sarkariDb';

export async function GET() {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const authors = await fetchAllSarkariAuthors();
  return NextResponse.json({ authors });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await ensureSarkariSchema();
    const body = (await req.json()) as Record<string, unknown>;
    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Author full name is required' }, { status: 400 });
    }
    const slug = slugifyText(String(body.slug || name));
    const role = String(body.role || 'Recruitment Analyst').trim();
    const email = String(body.email || '').trim();
    const qualification = String(body.qualification || '').trim();
    const experience = String(body.experience || '').trim();
    const bio = String(body.bio || '').trim();
    const avatarUrl = String(body.avatar_url || 'https://upload.cbtrank.com/logo.png').trim();
    const isActive = body.is_active === false || Number(body.is_active) === 0 ? 0 : 1;

    await dbRun(
      `INSERT INTO sarkari_authors (name, slug, role, email, qualification, experience, bio, avatar_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, role, email, qualification, experience, bio, avatarUrl, isActive]
    );
    const authors = await fetchAllSarkariAuthors();
    return NextResponse.json({ success: true, authors });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to add author' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await ensureSarkariSchema();
    const body = (await req.json()) as Record<string, unknown>;
    const id = Number(body.id || 0);
    const name = String(body.name || '').trim();
    if (!id || !name) {
      return NextResponse.json({ error: 'Author ID and name required' }, { status: 400 });
    }
    const slug = slugifyText(String(body.slug || name));
    const role = String(body.role || 'Recruitment Analyst').trim();
    const email = String(body.email || '').trim();
    const qualification = String(body.qualification || '').trim();
    const experience = String(body.experience || '').trim();
    const bio = String(body.bio || '').trim();
    const avatarUrl = String(body.avatar_url || 'https://upload.cbtrank.com/logo.png').trim();
    const isActive = body.is_active === false || Number(body.is_active) === 0 ? 0 : 1;

    await dbRun(
      `UPDATE sarkari_authors
       SET name = ?, slug = ?, role = ?, email = ?, qualification = ?, experience = ?, bio = ?, avatar_url = ?, is_active = ?
       WHERE id = ?`,
      [name, slug, role, email, qualification, experience, bio, avatarUrl, isActive, id]
    );
    const authors = await fetchAllSarkariAuthors();
    return NextResponse.json({ success: true, authors });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update author' }, { status: 500 });
  }
}
