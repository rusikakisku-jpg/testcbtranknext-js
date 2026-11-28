export const runtime = 'edge';

import { buildCategoryMetadata, renderCategoryPage } from '../lib/sarkariPageHelper';

export const metadata = buildCategoryMetadata('admit-card');

export default async function AdmitCardPage({
  searchParams
}: {
  searchParams?: Promise<{ page?: string; q?: string }>;
}) {
  return renderCategoryPage('admit-card', searchParams);
}
