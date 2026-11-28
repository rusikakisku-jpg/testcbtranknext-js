'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SarkariPostDetailView from '../../components/SarkariPostDetailView';
import { SarkariAuthor, SarkariPost } from '../../lib/sarkariConstants';

export default function AdminUnsavedPreviewPage() {
  const [post, setPost] = useState<SarkariPost | null>(null);
  const [author, setAuthor] = useState<SarkariAuthor>({
    id: 1,
    name: 'Mangal',
    slug: 'mangal'
  });
  const [layoutMode, setLayoutMode] = useState<'blog_2col' | 'classic'>('blog_2col');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cbtrank_sarkari_unsaved_preview');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          post?: SarkariPost;
          layoutMode?: 'blog_2col' | 'classic';
          authorName?: string;
        };
        if (parsed.post) setPost(parsed.post);
        if (parsed.layoutMode) setLayoutMode(parsed.layoutMode);
        if (parsed.authorName) setAuthor({ id: 1, name: parsed.authorName, slug: 'author' });
      }
    } catch {}
  }, []);

  if (!post) {
    return (
      <div className="admin-container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div className="admin-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>
            No unsaved preview data found. Click &quot;👁️ Preview Draft&quot; from Create or Edit Post.
          </p>
          <Link href="/admin/posts/new" className="btn btn-primary">
            Go to Create Post
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '13px'
        }}
      >
        <span>
          👁️ <strong>UNSAVED FORM PREVIEW</strong> — Active Mode:{' '}
          <b>{layoutMode === 'blog_2col' ? '2-Column Blog + Sidebar' : 'Classic Sarkari Single-Column'}</b>
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setLayoutMode(layoutMode === 'blog_2col' ? 'classic' : 'blog_2col')}
            style={{
              background: '#ab183d',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Switch Preview to {layoutMode === 'blog_2col' ? 'Classic Sarkari' : '2-Column Blog'}
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            style={{
              background: '#334155',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Close Tab
          </button>
        </div>
      </div>

      <SarkariPostDetailView
        post={post}
        author={author}
        relatedPosts={[]}
        recentPosts={[]}
        popularPosts={[]}
        categoryCounts={{}}
        layoutMode={layoutMode}
        settings={{
          telegram_url: 'https://t.me/cbtrank',
          whatsapp_url: ''
        }}
        isDraftPreview={true}
      />
    </div>
  );
}
