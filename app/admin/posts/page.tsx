'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SARKARI_CATEGORIES, SARKARI_CATEGORY_KEYS, SarkariPost } from '../../lib/sarkariConstants';

export default function AdminPostsListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<SarkariPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [flash, setFlash] = useState('');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (category) qs.set('category', category);
      if (status) qs.set('status', status);

      const res = await fetch(`/api/admin/posts?${qs.toString()}`);
      if (res.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const json = (await res.json()) as { posts?: SarkariPost[] };
      setPosts(json.posts || []);
    } finally {
      setLoading(false);
    }
  }, [search, category, status, router]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function handlePublish(id: number) {
    if (!confirm('Publish this draft live now?')) return;
    const res = await fetch(`/api/admin/posts/${id}/publish`, { method: 'POST' });
    if (res.ok) {
      setFlash('🚀 Post published live!');
      loadPosts();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Permanently delete this post?')) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setFlash('🗑️ Post deleted.');
      loadPosts();
    }
  }

  return (
    <main className="sarkari-container" style={{ padding: '20px 16px 48px' }}>
      <div className="sarkari-admin-topbar">
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            📋 Manage All Notifications &amp; Articles ({posts.length})
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '2px' }}>
            Review drafts via Preview, publish live, edit, or delete
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link href="/admin" className="sarkari-btn-secondary">← Dashboard</Link>
          <Link href="/admin/posts/new" className="sarkari-btn-primary">➕ New Post</Link>
        </div>
      </div>

      {flash && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontWeight: 600 }}>
          {flash}
        </div>
      )}

      <div className="sarkari-admin-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or department..."
            className="sarkari-input"
            style={{ flex: '1 1 240px' }}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="sarkari-input" style={{ width: '200px' }}>
            <option value="">All Categories</option>
            {SARKARI_CATEGORY_KEYS.map((k) => (
              <option key={k} value={k}>{SARKARI_CATEGORIES[k].name}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="sarkari-input" style={{ width: '160px' }}>
            <option value="">All Status</option>
            <option value="active">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button type="button" onClick={loadPosts} className="sarkari-btn-primary">Filter</button>
        </div>
      </div>

      <div className="sarkari-admin-card">
        {loading ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '24px' }}>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '24px' }}>No posts found.</p>
        ) : (
          <div className="table-responsive">
            <table className="sarkari-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>
                      <strong>{p.title}</strong>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {p.department || '—'} {p.last_date ? `• Last Date: ${p.last_date}` : ''}
                      </div>
                    </td>
                    <td>{SARKARI_CATEGORIES[p.category]?.name || p.category}</td>
                    <td>
                      <span className={`sarkari-status-pill ${p.status}`}>
                        {p.status === 'active' ? 'Published' : p.status}
                      </span>
                    </td>
                    <td>{p.views || 0}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <a
                        href={p.previewUrl || `/post/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sarkari-btn-secondary sarkari-sm"
                        style={p.status !== 'active' ? { background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' } : undefined}
                      >
                        {p.status === 'active' ? 'View' : '👁️ Preview'}
                      </a>{' '}
                      {p.status !== 'active' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePublish(p.id)}
                            className="sarkari-btn-primary sarkari-sm"
                            style={{ background: '#16a34a' }}
                          >
                            🚀 Publish
                          </button>{' '}
                        </>
                      )}
                      <Link href={`/admin/posts/edit/${p.id}`} className="sarkari-btn-secondary sarkari-sm">
                        ✏️ Edit
                      </Link>{' '}
                      <button type="button" onClick={() => handleDelete(p.id)} className="sarkari-btn-danger sarkari-sm">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
