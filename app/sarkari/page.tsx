export const runtime = 'edge';

import type { Metadata } from 'next';
import SarkariHomeHubView from '../components/SarkariHomeHubView';
import { SARKARI_CATEGORY_KEYS, SarkariPost } from '../lib/sarkariConstants';
import {
  fetchAllSarkariCategoryCounts,
  fetchCategorySarkariPosts,
  fetchSarkariBadges,
  fetchSarkariMarquees,
  getHiddenCategoriesSet,
  getSarkariSettings
} from '../lib/sarkariDb';

export const metadata: Metadata = {
  title: 'Sarkari Alerts Portal - Latest Jobs, Admit Card, Results, Syllabus & Answer Key',
  description: 'Latest Central and State Government Jobs, Admit Cards, Exam Results, Official Answer Keys, Syllabus & Live Rank Calculator on CBTRank.',
  alternates: { canonical: 'https://cbtrank.com/sarkari' }
};

export default async function SarkariHubPage() {
  const [settings, badges, marquees, countMap, ...lists] = await Promise.all([
    getSarkariSettings(),
    fetchSarkariBadges(),
    fetchSarkariMarquees(),
    fetchAllSarkariCategoryCounts(),
    ...SARKARI_CATEGORY_KEYS.map((key) => fetchCategorySarkariPosts(key, 15, 0, ''))
  ]);

  const categoryPosts: Record<string, SarkariPost[]> = {};
  SARKARI_CATEGORY_KEYS.forEach((key, idx) => {
    categoryPosts[key] = lists[idx] || [];
  });

  const hiddenCategories = getHiddenCategoriesSet(settings, countMap);

  return (
    <SarkariHomeHubView
      settings={settings}
      badges={badges}
      marquees={marquees}
      categoryPosts={categoryPosts}
      hiddenCategories={hiddenCategories}
    />
  );
}
