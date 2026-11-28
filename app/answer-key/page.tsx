export const runtime = 'edge';

import { buildCategoryMetadata, renderCategoryPage } from '../lib/sarkariPageHelper';

export const metadata = buildCategoryMetadata('answer-key');

export default async function AnswerKeyUpdatesPage({
  searchParams
}: {
  searchParams?: Promise<{ page?: string; q?: string }>;
}) {
  return renderCategoryPage('answer-key', searchParams);
}
