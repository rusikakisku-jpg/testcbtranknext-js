export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SARKARI_CATEGORIES } from '../../lib/sarkariConstants';
import { buildCategoryMetadata, renderCategoryPage } from '../../lib/sarkariPageHelper';

interface CategoryRouteProps {
  params: Promise<{ cat: string }>;
  searchParams?: Promise<{ page?: string; q?: string }>;
}

export async function generateMetadata({ params }: CategoryRouteProps): Promise<Metadata> {
  const { cat } = await params;
  return buildCategoryMetadata(cat);
}

export default async function CategoryDynamicPage({ params, searchParams }: CategoryRouteProps) {
  const { cat } = await params;
  if (!SARKARI_CATEGORIES[cat]) {
    notFound();
  }
  return renderCategoryPage(cat, searchParams);
}
