export const runtime = 'edge';

import { buildCategoryMetadata, renderCategoryPage } from '../lib/sarkariPageHelper';

export const metadata = buildCategoryMetadata('syllabus');

export default async function SyllabusPage({
  searchParams
}: {
  searchParams?: Promise<{ page?: string; q?: string }>;
}) {
  return renderCategoryPage('syllabus', searchParams);
}
