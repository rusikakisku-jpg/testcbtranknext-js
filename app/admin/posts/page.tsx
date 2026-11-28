'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminConsoleShell from '../components/AdminConsoleShell';
import { SARKARI_CATEGORIES, SARKARI_CATEGORY_KEYS, SarkariPost } from '../../lib/sarkariConstants';

export default function AdminPostsListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<SarkariPost[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'draft' | 'danger'; text: string } | null>(null);

  const loadPosts = useCallback(async (q = '', cat = '', st = '') => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set('search', q);
      if (cat) qs.set('category', cat);
      if (st) qs.set('status', st);
      const res = await fetch(`/api/admin/posts?${qs.toString()}`, { cache: 'no-store' });
      if (res.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const json = (await res.json()) as { posts?: SarkariPost[] };
      setPosts(json.posts || []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleFilter = (e: FormEvent) => {
    e.preventDefault();
    loadPosts(search, categoryFilter, statusFilter);
  };

  const handleReset = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    loadPosts('', '', '');
  };

  const handlePublish = async (id: number) => {
    if (!confirm('Publish this post live now?')) return;
    const res = await fetch(`/api/admin/posts/${id}/publish`, { method: 'POST' });
    if (res.ok) {
      setBannerMsg({ type: 'success', text: '🚀 Post published live successfully!' });
      loadPosts(search, categoryFilter, statusFilter);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this notification?')) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setBannerMsg({ type: 'danger', text: '🗑️ Post deleted successfully!' });
      loadPosts(search, categoryFilter, statusFilter);
    }
  };

  return (
    <AdminConsoleShell pageTitle="All Notifications">
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2>All Examination &amp; Job Notifications ({posts.length})</h2>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
              Search, filter, update or delete notifications across all 8 Sarkari categories
            </div>
          </div>
          <Link href="/admin/posts/new" className="btn btn-primary">➕ Create New Post</Link>
        </div>

        {bannerMsg && (
          <div
            style={{
              background: bannerMsg.type === 'danger' ? '#fee2e2' : bannerMsg.type === 'draft' ? '#fef3c7' : '#dcfce7',
              border: `1px solid ${bannerMsg.type === 'danger' ? '#fca5a5' : bannerMsg.type === 'draft' ? '#fcd34d' : '#86efac'}`,
              color: bannerMsg.type === 'danger' ? '#991b1b' : bannerMsg.type === 'draft' ? '#92400e' : '#166534',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontWeight: 600
            }}
          >
            {bannerMsg.text}
          </div>
        )}

        <form
          onSubmit={handleFilter}
          className="admin-filter-form"
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '22px',
            flexWrap: 'wrap',
            background: '#f8fafc',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: '300px' }}
            placeholder="🔍 Search title or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-control"
            style={{ maxWidth: '210px' }}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              loadPosts(search, e.target.value, statusFilter);
            }}
          >
            <option value="">All Categories (8)</option>
            {SARKARI_CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>{SARKARI_CATEGORIES[key].name}</option>
            ))}
          </select>
          <select
            className="form-control"
            style={{ maxWidth: '170px' }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              loadPosts(search, categoryFilter, e.target.value);
            }}
          >
            <option value="">All Status</option>
            <option value="active">Published (Active)</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '9px 16px' }}>
            Filter Results
          </button>
          {(search || categoryFilter || statusFilter) && (
            <button type="button" onClick={handleReset} className="btn btn-secondary btn-sm" style={{ padding: '8px 14px' }}>
              Reset
            </button>
          )}
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>ID</th>
                <th>Notification Title</th>
                <th style={{ width: '140px' }}>Category</th>
                <th>Department</th>
                <th style={{ width: '130px' }}>Last Date</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '210px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    Loading notifications...
                  </td>
                </tr>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td style={{ fontWeight: 600, color: '#64748b' }}>#{post.id}</td>
                    <td>
                      <Link
                        href={post.status === 'active' ? `/post/${post.slug}` : (post.previewUrl || `/post/${post.slug}`)}
                        target="_blank"
                        style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <span>{post.title}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>↗</span>
                      </Link>
                      {Boolean(post.is_featured) && (
                        <span style={{ background: '#fef08a', color: '#854d0e', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, marginTop: '3px', display: 'inline-block' }}>
                          ★ FEATURED
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 700, textTransform: 'capitalize', display: 'inline-block' }}>
                        {post.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: '#475569' }}>{post.department || '-'}</td>
                    <td style={{ fontSize: '12.5px', color: '#c62828', fontWeight: 600 }}>{post.last_date || '-'}</td>
                    <td>
                      <span
                        style={{
                          background: post.status === 'active' ? '#ecfdf5' : '#fffbeb',
                          color: post.status === 'active' ? '#059669' : '#d97706',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        ● {post.status === 'active' ? 'Published' : post.status === 'draft' ? 'Draft' : post.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {post.status !== 'active' ? (
                        <>
                          <Link
                            href={post.previewUrl || `/post/${post.slug}`}
                            target="_blank"
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '4px', background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}
                          >
                            👁️ Preview
                          </Link>
                          <button
                            type="button"
                            onClick={() => handlePublish(post.id)}
                            className="btn btn-primary btn-sm"
                            style={{ marginRight: '4px', background: '#16a34a', borderColor: '#15803d' }}
                          >
                            🚀 Publish
                          </button>
                        </>
                      ) : (
                        <Link href={`/post/${post.slug}`} target="_blank" className="btn btn-secondary btn-sm" style={{ marginRight: '4px' }}>
                          View
                        </Link>
                      )}
                      <Link href={`/admin/posts/edit/${post.id}`} className="btn btn-secondary btn-sm" style={{ marginRight: '4px' }}>
                        Edit
                      </Link>
                      <button type="button" onClick={() => handleDelete(post.id)} className="btn btn-danger btn-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '35px', color: '#64748b' }}>
                    No notifications found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminConsoleShell>
  );
}
