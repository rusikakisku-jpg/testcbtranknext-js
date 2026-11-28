export const runtime = 'edge';

import { buildCategoryMetadata, renderCategoryPage } from '../lib/sarkariPageHelper';

export const metadata = buildCategoryMetadata('result');

export default async function ResultsPage({
  searchParams
}: {
  searchParams?: Promise<{ page?: string; q?: string }>;
}) {
  return renderCategoryPage('result', searchParams);
}
