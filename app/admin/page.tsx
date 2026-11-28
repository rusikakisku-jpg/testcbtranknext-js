'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SARKARI_CATEGORIES, SARKARI_CATEGORY_KEYS, SarkariPost } from '../lib/sarkariConstants';

interface DashboardData {
  dbStatus?: { connected: boolean; mode: string; message: string };
  stats?: { total: number; active: number; draft: number };
  categoryCounts?: Record<string, number>;
  posts?: SarkariPost[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({});
  const [layoutMode, setLayoutMode] = useState<'blog_2col' | 'classic'>('blog_2col');
  const [telegramUrl, setTelegramUrl] = useState('https://t.me/cbtrank');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const authRes = await fetch('/api/admin/auth');
        const authJson = (await authRes.json()) as { authenticated?: boolean };
        if (!authJson.authenticated) {
          router.replace('/admin/login');
          return;
        }
        const [postsRes, setRes] = await Promise.all([
          fetch('/api/admin/posts'),
          fetch('/api/admin/settings')
        ]);
        if (postsRes.ok) {
          setData((await postsRes.json()) as DashboardData);
        }
        if (setRes.ok) {
          const sj = (await setRes.json()) as { settings?: Record<string, string> };
          if (sj.settings?.post_detail_layout === 'classic') setLayoutMode('classic');
          if (sj.settings?.telegram_url) setTelegramUrl(sj.settings.telegram_url);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_detail_layout: layoutMode,
          telegram_url: telegramUrl
        })
      });
      if (res.ok) setSettingsMsg('Settings saved successfully!');
      else setSettingsMsg('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.replace('/admin/login');
  }

  if (loading) {
    return (
      <main className="sarkari-container" style={{ padding: '40px 16px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading CBT RANK Admin Dashboard...</p>
      </main>
    );
  }

  return (
    <main className="sarkari-container" style={{ padding: '20px 16px 48px' }}>
      <div className="sarkari-admin-topbar">
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            🛡️ CBT RANK Admin Panel
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '2px' }}>
            Latest Jobs, Admit Card, Results, Syllabus &amp; Answer Key CMS
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link href="/admin/posts/new" className="sarkari-btn-primary">➕ New Post</Link>
          <Link href="/admin/posts" className="sarkari-btn-secondary">📋 All Posts</Link>
          <button type="button" onClick={handleLogout} className="sarkari-btn-danger">Logout</button>
        </div>
      </div>

      {data.dbStatus && !data.dbStatus.connected && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 16px', borderRadius: '8px', marginBottom: '18px', fontSize: '0.9rem' }}>
          <strong>⚠️ Cloudflare D1 Connection Notice:</strong> {data.dbStatus.message}
          <div style={{ fontSize: '0.82rem', marginTop: '4px', color: '#7f1d1d' }}>
            Fix: In Cloudflare Pages → Settings → Environment Variables, set <code>CF_D1_TOKEN</code> (with D1 Edit permission) or bind your <code>cbtrank_db</code> D1 database as <code>DB</code> under Functions → D1 database bindings.
          </div>
        </div>
      )}

      {data.dbStatus?.connected && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '0.86rem', fontWeight: 600 }}>
          ✅ {data.dbStatus.message}
        </div>
      )}

      <div className="sarkari-stats-grid">
        <div className="sarkari-stat-box">
          <div className="sarkari-stat-val">{data.stats?.total ?? 0}</div>
          <div className="sarkari-stat-label">Total Posts</div>
        </div>
        <div className="sarkari-stat-box">
          <div className="sarkari-stat-val" style={{ color: '#16a34a' }}>{data.stats?.active ?? 0}</div>
          <div className="sarkari-stat-label">Published Live</div>
        </div>
        <div className="sarkari-stat-box">
          <div className="sarkari-stat-val" style={{ color: '#d97706' }}>{data.stats?.draft ?? 0}</div>
          <div className="sarkari-stat-label">Drafts (In Review)</div>
        </div>
      </div>

      <div className="sarkari-admin-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
          Category Quick Counts &amp; Public Links
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
          {SARKARI_CATEGORY_KEYS.map((key) => {
            const meta = SARKARI_CATEGORIES[key];
            return (
              <Link
                key={key}
                href={meta.route}
                target="_blank"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  color: '#0f172a'
                }}
              >
                <span>{meta.name}</span>
                <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '999px', fontSize: '0.78rem' }}>
                  {data.categoryCounts?.[key] || 0}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="sarkari-admin-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
          Post Detail Layout &amp; Portal Settings
        </h2>
        {settingsMsg && (
          <div style={{ background: '#dcfce7', color: '#166534', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.86rem', fontWeight: 600 }}>
            {settingsMsg}
          </div>
        )}
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="sarkari-form-group" style={{ flex: '1 1 240px', marginBottom: 0 }}>
            <label>Post Detail Page Layout (`/post/[slug]`)</label>
            <select
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value as 'blog_2col' | 'classic')}
              className="sarkari-input"
            >
              <option value="blog_2col">2-Column Blog + Sidebar (Full Article Only)</option>
              <option value="classic">Classic Sarkari Single-Column (Tables &amp; Links Only)</option>
            </select>
          </div>
          <div className="sarkari-form-group" style={{ flex: '1 1 240px', marginBottom: 0 }}>
            <label>Telegram Channel URL</label>
            <input
              type="url"
              value={telegramUrl}
              onChange={(e) => setTelegramUrl(e.target.value)}
              className="sarkari-input"
            />
          </div>
          <button type="submit" disabled={savingSettings} className="sarkari-btn-primary">
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      <div className="sarkari-admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Recent Posts
          </h2>
          <Link href="/admin/posts" style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>
            Manage All →
          </Link>
        </div>
        {(data.posts || []).length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            No posts created yet. Click <strong>➕ New Post</strong> to create your first post!
          </p>
        ) : (
          <div className="table-responsive">
            <table className="sarkari-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.posts || []).slice(0, 8).map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.title}</strong></td>
                    <td>{SARKARI_CATEGORIES[p.category]?.name || p.category}</td>
                    <td>
                      <span className={`sarkari-status-pill ${p.status}`}>
                        {p.status === 'active' ? 'Published' : p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <a href={p.previewUrl || `/post/${p.slug}`} target="_blank" rel="noopener noreferrer" className="sarkari-btn-secondary sarkari-sm">
                        {p.status === 'active' ? 'View' : '👁️ Preview'}
                      </a>{' '}
                      <Link href={`/admin/posts/edit/${p.id}`} className="sarkari-btn-secondary sarkari-sm">
                        ✏️ Edit
                      </Link>
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
