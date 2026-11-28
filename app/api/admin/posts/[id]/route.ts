export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import {
  buildPostViewOrPreviewUrl,
  isAdminAuthenticatedFromCookies
} from '../../../../lib/sarkariAuth';
import {
  dbFirst,
  dbRun,
  ensureSarkariSchema,
  getSarkariPostCategoryMap,
  syncSarkariPostCategories
} from '../../../../lib/sarkariDb';
import { SARKARI_CATEGORIES, SarkariPost, slugifyText } from '../../../../lib/sarkariConstants';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await ensureSarkariSchema();
  const { id } = await context.params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) {
    return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
  }
  const [post, categoryMap] = await Promise.all([
    dbFirst<SarkariPost>('SELECT * FROM sarkari_posts WHERE id = ?', [postId]),
    getSarkariPostCategoryMap(postId)
  ]);
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const previewUrl = await buildPostViewOrPreviewUrl(post);
  return NextResponse.json({ success: true, post: { ...post, previewUrl }, categoryMap }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await ensureSarkariSchema();
    const { id } = await context.params;
    const postId = parseInt(id, 10);
    const current = await dbFirst<SarkariPost>('SELECT * FROM sarkari_posts WHERE id = ?', [postId]);
    if (!current) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const body = (await req.json()) as Record<string, any>;
    const title = body.title !== undefined ? String(body.title).trim() : current.title;
    const category = body.category && SARKARI_CATEGORIES[String(body.category)] ? String(body.category) : current.category;
    let finalSlug = body.slug ? slugifyText(String(body.slug)) : current.slug;

    if (finalSlug !== current.slug) {
      const collision = await dbFirst<{ id: number }>('SELECT id FROM sarkari_posts WHERE slug = ? AND id != ?', [finalSlug, postId]);
      if (collision) finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const status = body.status && ['draft', 'active', 'archived'].includes(String(body.status))
      ? String(body.status)
      : current.status;

    await dbRun(
      `UPDATE sarkari_posts SET
        title = ?, slug = ?, category = ?, department = ?, post_date = ?, last_date = ?,
        short_desc = ?, total_vacancy = ?, important_dates = ?, application_fee = ?,
        age_limit = ?, vacancy_details = ?, category_details = ?, how_to_apply = ?, article_content = ?, thumbnail = ?,
        links = ?, notification_pdf = ?, admit_card_url = ?, result_url = ?,
        apply_online_url = ?, official_website_url = ?, is_featured = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title,
        finalSlug,
        category,
        body.department !== undefined ? (String(body.department).trim() || null) : (current.department || null),
        body.post_date !== undefined ? (String(body.post_date).trim() || null) : (current.post_date || null),
        body.last_date !== undefined ? (String(body.last_date).trim() || null) : (current.last_date || null),
        body.short_desc !== undefined ? (String(body.short_desc).trim() || null) : (current.short_desc || null),
        body.total_vacancy !== undefined ? (String(body.total_vacancy).trim() || null) : (current.total_vacancy || null),
        body.important_dates !== undefined ? (typeof body.important_dates === 'string' ? body.important_dates : JSON.stringify(body.important_dates || [])) : (current.important_dates || '[]'),
        body.application_fee !== undefined ? (typeof body.application_fee === 'string' ? body.application_fee : JSON.stringify(body.application_fee || [])) : (current.application_fee || '[]'),
        body.age_limit !== undefined ? (typeof body.age_limit === 'string' ? body.age_limit : JSON.stringify(body.age_limit || {})) : (current.age_limit || '{}'),
        body.vacancy_details !== undefined ? (typeof body.vacancy_details === 'string' ? body.vacancy_details : JSON.stringify(body.vacancy_details || [])) : (current.vacancy_details || '[]'),
        body.category_details !== undefined ? (typeof body.category_details === 'string' ? body.category_details : JSON.stringify(body.category_details || [])) : (current.category_details || '[]'),
        body.how_to_apply !== undefined ? (String(body.how_to_apply) || null) : (current.how_to_apply || null),
        body.article_content !== undefined ? (String(body.article_content) || null) : (current.article_content || null),
        body.thumbnail !== undefined ? (String(body.thumbnail).trim() || null) : (current.thumbnail || null),
        body.links !== undefined ? (typeof body.links === 'string' ? body.links : JSON.stringify(body.links || [])) : (current.links || '[]'),
        body.notification_pdf !== undefined ? (String(body.notification_pdf).trim() || null) : (current.notification_pdf || null),
        body.admit_card_url !== undefined ? (String(body.admit_card_url).trim() || null) : (current.admit_card_url || null),
        body.result_url !== undefined ? (String(body.result_url).trim() || null) : (current.result_url || null),
        body.apply_online_url !== undefined ? (String(body.apply_online_url).trim() || null) : (current.apply_online_url || null),
        body.official_website_url !== undefined ? (String(body.official_website_url).trim() || null) : (current.official_website_url || null),
        body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : (current.is_featured || 0),
        status,
        postId
      ]
    );

    await syncSarkariPostCategories({
      postId,
      primaryCategory: category,
      newTitle: title,
      previousPost: current,
      extraCategories: Array.isArray(body.extra_categories) ? body.extra_categories : undefined,
      categoryTitles: body.category_titles && typeof body.category_titles === 'object' ? body.category_titles : undefined,
      bumpPrimary: Boolean(body.bump_primary)
    });

    const previewUrl = await buildPostViewOrPreviewUrl({ id: postId, slug: finalSlug, status });
    return NextResponse.json({ success: true, id: postId, slug: finalSlug, status, previewUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  if (!(await isAdminAuthenticatedFromCookies())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await ensureSarkariSchema();
  const { id } = await context.params;
  const postId = parseInt(id, 10);
  await dbRun('DELETE FROM sarkari_posts WHERE id = ?', [postId]);
  await dbRun('DELETE FROM sarkari_post_categories WHERE post_id = ?', [postId]);
  return NextResponse.json({ success: true });
}
