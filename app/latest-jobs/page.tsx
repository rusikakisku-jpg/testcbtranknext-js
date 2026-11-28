export const runtime = 'edge';

import { buildCategoryMetadata, renderCategoryPage } from '../lib/sarkariPageHelper';

export const metadata = buildCategoryMetadata('latest-jobs');

export default async function LatestJobsPage({
  searchParams
}: {
  searchParams?: Promise<{ page?: string; q?: string }>;
}) {
  return renderCategoryPage('latest-jobs', searchParams);
}
