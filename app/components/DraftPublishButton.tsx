'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DraftPublishButton({ postId, slug }: { postId: number; slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handlePublish = async () => {
    if (!confirm('Publish this reviewed post live now?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/publish`, { method: 'POST' });
      if (res.ok) {
        router.push(`/post/${slug}`);
        router.refresh();
      } else {
        alert('Login as Admin or publish from /admin/posts.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePublish}
      disabled={busy}
      style={{
        background: '#16a34a',
        color: '#ffffff',
        border: 'none',
        padding: '6px 14px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '12.5px',
        fontWeight: 700
      }}
    >
      {busy ? 'Publishing...' : '🚀 Publish Live Now'}
    </button>
  );
}
