'use client';

import { useEffect } from 'react';

export default function SarkariPostViewTracker({ postId }: { postId: number }) {
  useEffect(() => {
    if (!postId) return;
    fetch('/api/sarkari/increment-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId })
    }).catch(() => {});
  }, [postId]);

  return null;
}
