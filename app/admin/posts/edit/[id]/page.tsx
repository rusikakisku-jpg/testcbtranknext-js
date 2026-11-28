import EditPostClient from './EditPostClient';

export const runtime = 'edge';

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditPostClient id={id} />;
}
