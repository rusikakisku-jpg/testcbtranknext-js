'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SARKARI_CATEGORIES, SarkariPost } from '../../lib/sarkariConstants';

export default function AdminUnsavedPreviewPage() {
  const [post, setPost] = useState<SarkariPost | null>(null);
  const [layoutMode, setLayoutMode] = useState<'blog_2col' | 'classic'>('blog_2col');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cbtrank_sarkari_unsaved_preview');
      if (raw) {
        const parsed = JSON.parse(raw) as { post?: SarkariPost; layoutMode?: 'blog_2col' | 'classic' };
        if (parsed.post) setPost(parsed.post);
        if (parsed.layoutMode) setLayoutMode(parsed.layoutMode);
      }
    } catch {}
  }, []);

  if (!post) {
    return (
      <main className="sarkari-container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>No unsaved preview data found. Open preview from the Admin Post Editor.</p>
        <Link href="/admin/posts" className="sarkari-btn-primary" style={{ marginTop: '12px', display: 'inline-block' }}>
          Back to Admin Posts
        </Link>
      </main>
    );
  }

  const catMeta = SARKARI_CATEGORIES[post.category] || SARKARI_CATEGORIES['latest-jobs'];
  const isBlog = layoutMode === 'blog_2col';

  return (
    <main style={{ minHeight: '80vh', paddingBottom: '42px' }}>
      <div className="sarkari-draft-banner">
        <div className="sarkari-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span>📝 <strong>UNSAVED FORM PREVIEW ({isBlog ? '2-Column Blog' : 'Classic Sarkari'} Mode)</strong></span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setLayoutMode(isBlog ? 'classic' : 'blog_2col')}
              className="sarkari-draft-edit-btn"
            >
              Switch View to {isBlog ? 'Classic Sarkari' : '2-Column Blog'}
            </button>
          </div>
        </div>
      </div>

      <div className="sarkari-container" style={{ paddingTop: '16px' }}>
        <article className="sarkari-article-card">
          <div className="sarkari-hero-top">
            <span className="sarkari-cat-pill" style={{ background: catMeta.accentColor }}>{catMeta.name}</span>
            {post.total_vacancy && <span className="sarkari-vac-badge">{post.total_vacancy}</span>}
          </div>
          <h1 className="sarkari-detail-h1">{post.title || 'Untitled Draft'}</h1>
          <div className="sarkari-detail-meta">
            <span>by <strong>Mangal</strong></span>
            <span>•</span>
            <span>📅 {post.post_date || 'Draft Date'}</span>
            {post.department && (
              <>
                <span>•</span>
                <span>🏛️ {post.department}</span>
              </>
            )}
          </div>

          {post.thumbnail && (
            <div style={{ margin: '14px 0 18px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.thumbnail} alt={post.title} style={{ maxWidth: '100%', maxHeight: '420px', width: '100%', objectFit: 'cover', borderRadius: '8px' }} />
            </div>
          )}

          {post.short_desc && (
            <div className="sarkari-summary-box">
              <div className="sarkari-summary-badge">{catMeta.name} Overview</div>
              <p style={{ margin: 0 }}>{post.short_desc}</p>
            </div>
          )}

          {isBlog && post.article_content ? (
            <div className="gez-article-content" dangerouslySetInnerHTML={{ __html: post.article_content }} />
          ) : (
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.92rem' }}>
                {isBlog
                  ? 'No Full Blog Article HTML added yet. Save and view in Classic mode or add content in the TinyMCE editor.'
                  : 'Classic Sarkari structured fields (Important Dates, Fees, Age Limit, Vacancies, Links) will display here when saved.'}
              </p>
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
