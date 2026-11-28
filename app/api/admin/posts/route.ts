export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import {
  buildPostViewOrPreviewUrl,
  isAdminAuthenticatedFromCookies
} from '../../../lib/sarkariAuth';
import {
  dbAll,
  dbFirst,
  dbRun,
  ensureSarkariSchema,
  fetchAllSarkariCategoryCounts,
  getD1ConnectionStatus,
  syncSarkariPostCategories
} from '../../../lib/sarkariDb';
import { SARKARI_CATEGORIES, SarkariPost, slugifyText } from '../../../lib/sarkariConstants';

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbStatus = await getD1ConnectionStatus();
  if (!dbStatus.connected) {
    return NextResponse.json({ success: false, dbStatus, posts: [], categoryCounts: {} }, { status: 200 });
  }

  await ensureSarkariSchema();
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get('category') || '').trim();
  const status = (searchParams.get('status') || '').trim();
  const search = (searchParams.get('search') || '').trim();

  let sql = 'SELECT * FROM sarkari_posts WHERE 1=1';
  const params: unknown[] = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (title LIKE ? OR department LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY id DESC LIMIT 150';

  const rawPosts = await dbAll<SarkariPost>(sql, params);
  const posts = await Promise.all(
    rawPosts.map(async (p) => ({
      ...p,
      previewUrl: await buildPostViewOrPreviewUrl(p)
    }))
  );

  const [categoryCounts, totalRow, activeRow, draftRow] = await Promise.all([
    fetchAllSarkariCategoryCounts(),
    dbFirst<{ c: number }>('SELECT COUNT(*) as c FROM sarkari_posts'),
    dbFirst<{ c: number }>("SELECT COUNT(*) as c FROM sarkari_posts WHERE status = 'active'"),
    dbFirst<{ c: number }>("SELECT COUNT(*) as c FROM sarkari_posts WHERE status = 'draft'")
  ]);

  return NextResponse.json(
    {
      success: true,
      dbStatus,
      stats: {
        total: Number(totalRow?.c || 0),
        active: Number(activeRow?.c || 0),
        draft: Number(draftRow?.c || 0)
      },
      categoryCounts,
      posts
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ok = await ensureSarkariSchema();
    if (!ok) {
      const dbStatus = await getD1ConnectionStatus();
      return NextResponse.json({ success: false, error: dbStatus.message }, { status: 500 });
    }

    const body = (await req.json()) as Record<string, any>;
    const title = String(body.title || '').trim();
    const category = SARKARI_CATEGORIES[String(body.category || '')]
      ? String(body.category)
      : 'latest-jobs';

    if (!title) {
      return NextResponse.json({ success: false, error: 'Post title is required' }, { status: 400 });
    }

    const baseSlug = body.slug ? slugifyText(String(body.slug)) : slugifyText(title);
    let finalSlug = baseSlug;
    const collision = await dbFirst<{ id: number }>('SELECT id FROM sarkari_posts WHERE slug = ?', [finalSlug]);
    if (collision) {
      finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const status = ['draft', 'active', 'archived'].includes(String(body.status))
      ? String(body.status)
      : 'draft';

    const insertRes = await dbRun(
      `INSERT INTO sarkari_posts (
        title, slug, category, department, post_date, last_date,
        short_desc, total_vacancy, important_dates, application_fee,
        age_limit, vacancy_details, category_details, how_to_apply, article_content, thumbnail,
        links, notification_pdf, admit_card_url, result_url,
        apply_online_url, official_website_url, is_featured, status, author_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        finalSlug,
        category,
        body.department ? String(body.department).trim() : null,
        body.post_date ? String(body.post_date).trim() : null,
        body.last_date ? String(body.last_date).trim() : null,
        body.short_desc ? String(body.short_desc).trim() : null,
        body.total_vacancy ? String(body.total_vacancy).trim() : null,
        typeof body.important_dates === 'string' ? body.important_dates : JSON.stringify(body.important_dates || []),
        typeof body.application_fee === 'string' ? body.application_fee : JSON.stringify(body.application_fee || []),
        typeof body.age_limit === 'string' ? body.age_limit : JSON.stringify(body.age_limit || {}),
        typeof body.vacancy_details === 'string' ? body.vacancy_details : JSON.stringify(body.vacancy_details || []),
        typeof body.category_details === 'string' ? body.category_details : JSON.stringify(body.category_details || []),
        body.how_to_apply ? String(body.how_to_apply) : null,
        body.article_content ? String(body.article_content) : null,
        body.thumbnail ? String(body.thumbnail).trim() : null,
        typeof body.links === 'string' ? body.links : JSON.stringify(body.links || []),
        body.notification_pdf ? String(body.notification_pdf).trim() : null,
        body.admit_card_url ? String(body.admit_card_url).trim() : null,
        body.result_url ? String(body.result_url).trim() : null,
        body.apply_online_url ? String(body.apply_online_url).trim() : null,
        body.official_website_url ? String(body.official_website_url).trim() : null,
        body.is_featured ? 1 : 0,
        status,
        Number(body.author_id) || 1
      ]
    );

    const createdRow = insertRes.lastRowId
      ? { id: insertRes.lastRowId }
      : await dbFirst<{ id: number }>('SELECT id FROM sarkari_posts WHERE slug = ?', [finalSlug]);
    const newId = Number(createdRow?.id || 0);

    await syncSarkariPostCategories({
      postId: newId,
      primaryCategory: category,
      newTitle: title,
      previousPost: null,
      extraCategories: Array.isArray(body.extra_categories) ? body.extra_categories : undefined,
      categoryTitles: body.category_titles && typeof body.category_titles === 'object' ? body.category_titles : undefined,
      bumpPrimary: true
    });

    const previewUrl = await buildPostViewOrPreviewUrl({ id: newId, slug: finalSlug, status });
    return NextResponse.json({ success: true, id: newId, slug: finalSlug, status, previewUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Create failed' }, { status: 500 });
  }
}
