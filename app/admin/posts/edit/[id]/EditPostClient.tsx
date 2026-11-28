'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminConsoleShell from '../../../components/AdminConsoleShell';
import SarkariPostEditor from '../../../components/SarkariPostEditor';
import { SarkariPost } from '../../../../lib/sarkariConstants';

export default function EditPostClient({ id }: { id: string }) {
  const router = useRouter();
  const [post, setPost] = useState<SarkariPost | null>(null);
  const [catMap, setCatMap] = useState<Record<string, { category: string; display_title: string; bumped_at: string }>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/posts/${id}`);
      if (res.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (!res.ok) {
        setError('Post not found');
        return;
      }
      const json = (await res.json()) as {
        post?: SarkariPost;
        categoryMap?: Record<string, { category: string; display_title: string; bumped_at: string }>;
      };
      if (json.post) setPost(json.post);
      if (json.categoryMap) setCatMap(json.categoryMap);
    })();
  }, [id, router]);

  if (error) {
    return (
      <AdminConsoleShell pageTitle="Edit Notification">
        <div className="admin-card" style={{ textAlign: 'center', color: '#991b1b', padding: '40px 16px', fontWeight: 600 }}>
          {error}
        </div>
      </AdminConsoleShell>
    );
  }

  if (!post) {
    return (
      <AdminConsoleShell pageTitle="Edit Notification">
        <div className="admin-card" style={{ textAlign: 'center', color: '#64748b', padding: '40px 16px' }}>
          Loading post editor...
        </div>
      </AdminConsoleShell>
    );
  }

  return <SarkariPostEditor initialPost={post} initialCategoryMap={catMap} />;
}
