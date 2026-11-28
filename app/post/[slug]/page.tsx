export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SarkariPostDetailView from '../../components/SarkariPostDetailView';
import { isAdminAuthenticatedFromCookies, verifyDraftPreviewToken } from '../../lib/sarkariAuth';
import { SARKARI_CATEGORIES } from '../../lib/sarkariConstants';
import {
  fetchAllSarkariCategoryCounts,
  fetchRecentActiveSarkariPosts,
  fetchRelatedSarkariPosts,
  fetchSarkariAuthorById,
  fetchSarkariPostBySlug,
  getSarkariSettings
} from '../../lib/sarkariDb';

interface PostPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

async function resolvePostAccess(slug: string, previewToken?: string) {
  const post = await fetchSarkariPostBySlug(slug);
  if (!post) return { post: null, isDraftPreview: false };

  if (post.status === 'active') {
    return { post, isDraftPreview: false };
  }

  const [isAdmin, tokenValid] = await Promise.all([
    isAdminAuthenticatedFromCookies(),
    verifyDraftPreviewToken(post.id, post.slug, previewToken)
  ]);

  if (!isAdmin && !tokenValid) {
    return { post: null, isDraftPreview: false };
  }

  return { post, isDraftPreview: true };
}

export async function generateMetadata({ params, searchParams }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ? await Promise.resolve(searchParams) : {};
  const { post, isDraftPreview } = await resolvePostAccess(slug, sp?.preview);

  if (!post) {
    return { title: 'Post Not Found', robots: { index: false, follow: false } };
  }

  const canonicalUrl = `https://cbtrank.com/post/${post.slug}`;
  return {
    title: isDraftPreview ? `[PREVIEW] ${post.title}` : post.title,
    description: post.short_desc || `${post.title} - Check complete details and official links on CBT RANK.`,
    robots: isDraftPreview ? { index: false, follow: false, nocache: true } : undefined,
    alternates: isDraftPreview ? undefined : { canonical: canonicalUrl },
    openGraph: {
      title: post.title,
      description: post.short_desc || post.title,
      url: canonicalUrl,
      type: 'article',
      siteName: 'CBT RANK',
      images: post.thumbnail ? [{ url: post.thumbnail, width: 1200, height: 675, alt: post.title }] : undefined
    }
  };
}

export default async function SarkariPostDetailPage({ params, searchParams }: PostPageProps) {
  const { slug } = await params;
  const sp = searchParams ? await Promise.resolve(searchParams) : {};
  const { post, isDraftPreview } = await resolvePostAccess(slug, sp?.preview);

  if (!post) {
    notFound();
  }

  const [author, relatedPosts, recentPosts, categoryCounts, settings] = await Promise.all([
    fetchSarkariAuthorById(post.author_id || 1),
    fetchRelatedSarkariPosts(post.category, post.id, 6),
    fetchRecentActiveSarkariPosts(post.id, 6),
    fetchAllSarkariCategoryCounts(),
    getSarkariSettings()
  ]);

  const layoutMode = settings.post_detail_layout === 'classic' ? 'classic' : 'blog_2col';
  const catMeta = SARKARI_CATEGORIES[post.category];
  if (!catMeta) {
    post.category = 'latest-jobs';
  }

  return (
    <SarkariPostDetailView
      post={post}
      author={author}
      relatedPosts={relatedPosts}
      recentPosts={recentPosts}
      categoryCounts={categoryCounts}
      layoutMode={layoutMode}
      isDraftPreview={isDraftPreview}
      telegramUrl={settings.telegram_url || 'https://t.me/cbtrank'}
    />
  );
}
