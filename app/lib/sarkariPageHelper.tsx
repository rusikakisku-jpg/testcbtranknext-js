import type { Metadata } from 'next';
import SarkariCategoryView from '../components/SarkariCategoryView';
import { SARKARI_CATEGORIES } from './sarkariConstants';
import {
  countCategorySarkariPosts,
  fetchAllSarkariCategoryCounts,
  fetchCategorySarkariPosts,
  fetchSarkariBadges,
  getSarkariSettings
} from './sarkariDb';

const PER_PAGE = 30;

export function buildCategoryMetadata(catKey: string): Metadata {
  const meta = SARKARI_CATEGORIES[catKey];
  if (!meta) return { title: 'Category Not Found' };
  const canonicalUrl = `https://cbtrank.com${meta.route}`;
  return {
    title: `${meta.name} 2026 | Latest Govt Exam Updates`,
    description: meta.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${meta.name} 2026 | CBT RANK`,
      description: meta.description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'CBT RANK'
    }
  };
}

export async function renderCategoryPage(
  catKey: string,
  searchParams?: Promise<{ page?: string; q?: string }>
) {
  const categoryMeta = SARKARI_CATEGORIES[catKey];
  const resolved = searchParams ? await Promise.resolve(searchParams) : {};
  const page = Math.max(1, parseInt(String(resolved?.page || '1'), 10) || 1);
  const query = String(resolved?.q || '').trim();
  const offset = (page - 1) * PER_PAGE;

  const [totalPosts, posts, settings, badges, categoryCounts] = await Promise.all([
    countCategorySarkariPosts(catKey, query),
    fetchCategorySarkariPosts(catKey, PER_PAGE, offset, query),
    getSarkariSettings(),
    fetchSarkariBadges(),
    fetchAllSarkariCategoryCounts()
  ]);

  const totalPages = Math.max(1, Math.ceil(totalPosts / PER_PAGE));

  return (
    <SarkariCategoryView
      categoryMeta={categoryMeta}
      posts={posts}
      totalPosts={totalPosts}
      currentPage={page}
      totalPages={totalPages}
      searchQuery={query}
      settings={settings}
      badges={badges}
      categoryCounts={categoryCounts}
    />
  );
}
