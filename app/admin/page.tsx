'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminConsoleShell from './components/AdminConsoleShell';
import { SarkariAnalyticsData, SarkariPost } from '../lib/sarkariConstants';

interface DashboardPayload {
  dbStatus?: { connected: boolean; mode: string; message: string };
  isR2Configured?: boolean;
  totalPosts: number;
  activePosts: number;
  draftPosts: number;
  uploadsCount: number;
  analytics: SarkariAnalyticsData;
  recentPosts: SarkariPost[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
        if (res.status === 401) {
          router.replace('/admin/login');
          return;
        }
        const json = (await res.json()) as DashboardPayload;
        setData(json);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const analytics = data?.analytics;
  const todayViews = Number(analytics?.todayViews || 0);
  const yesterdayViews = Number(analytics?.yesterdayViews || 0);
  const todayPostsViewed = Number(analytics?.todayPostsViewed || 0);
  const totalViewsAll = Number(analytics?.totalViews || 0);
  const weekViewsTotal = Number(analytics?.weekViewsTotal || 0);
  const maxDailyViews = Math.max(1, Number(analytics?.maxDailyViews || 1));
  const dailyTrend = analytics?.dailyTrend || [];
  const topPostsOverall = analytics?.topPostsOverall || [];
  const topPostsToday = analytics?.topPostsToday || [];
  const categoryViews = analytics?.categoryViews || [];
  const topLeader = topPostsOverall[0] || null;
  const maxOverallViews = Math.max(1, Number(topLeader?.views || 1));
  const maxTodayViews = Math.max(1, Number(topPostsToday[0]?.today_views || 1));

  let deltaText = 'Live Today';
  let deltaClass = 'analytics-delta-neutral';
  if (yesterdayViews > 0) {
    const pct = Math.round(((todayViews - yesterdayViews) / yesterdayViews) * 100);
    deltaText = `${pct >= 0 ? '▲ +' : '▼ '}${pct}% vs yest.`;
    deltaClass = pct >= 0 ? 'analytics-delta-up' : 'analytics-delta-down';
  } else if (todayViews > 0) {
    deltaText = '▲ Active Today';
    deltaClass = 'analytics-delta-up';
  }

  return (
    <AdminConsoleShell pageTitle="Dashboard Overview">
      {/* Welcome Banner */}
      <div
        className="admin-welcome-banner"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '12px',
          padding: '22px 26px',
          marginBottom: '24px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                background: data?.dbStatus?.connected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: data?.dbStatus?.connected ? '#34d399' : '#fbbf24',
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              ● {loading ? 'Connecting...' : data?.dbStatus?.connected ? 'System Operational' : 'Check D1 Binding'}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Cloudflare D1 &amp; R2 Edge Architecture</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            CBT RANK Sarkari Administrative Suite
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13.5px', margin: 0 }}>
            {data?.dbStatus?.connected
              ? 'Real-time management for Latest Jobs, Admit Cards, Results, Answer Keys, Syllabus, D1 SQL & R2 storage.'
              : data?.dbStatus?.message || 'Attach Cloudflare D1 binding DB (cbtrank_db) to activate live CRUD.'}
          </p>
        </div>
        <div className="admin-welcome-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/admin/posts/new" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '13.5px' }}>
            ➕ Create New Post
          </Link>
          <Link
            href="/sarkari"
            target="_blank"
            className="btn btn-secondary"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            🌐 View Sarkari Portal
          </Link>
        </div>
      </div>

      {/* 4 Modern Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3>Total Notifications</h3>
              <div className="stat-val">{data?.totalPosts || 0}</div>
              <div className="stat-sub" style={{ color: '#0284c7', fontWeight: 600 }}>
                {data?.activePosts || 0} Live • {data?.draftPosts || 0} Drafts
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              📝
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3>Cloudflare D1 SQL</h3>
              <div className="stat-val" style={{ fontSize: '20px', color: '#0284c7', paddingTop: '4px' }}>
                {data?.dbStatus?.connected ? (data.dbStatus.mode === 'binding' ? 'Native D1' : 'REST API') : 'Unbound'}
              </div>
              <div className="stat-sub" style={{ color: data?.dbStatus?.connected ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                ● {data?.dbStatus?.connected ? 'Serverless SQL Active' : 'Needs DB Binding'}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              💾
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3>Cloudflare R2 Storage</h3>
              <div className="stat-val" style={{ fontSize: '20px', color: '#10b981', paddingTop: '4px' }}>
                {data?.isR2Configured ? 'R2 Active' : 'URL Mode'}
              </div>
              <div className="stat-sub" style={{ color: '#64748b', fontWeight: 600 }}>
                {data?.uploadsCount || 0} Files / PDFs Uploaded
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              ☁️
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3>Edge Runtime</h3>
              <div className="stat-val" style={{ fontSize: '20px', color: '#8b5cf6', paddingTop: '4px' }}>
                CF Pages Online
              </div>
              <div className="stat-sub" style={{ color: '#8b5cf6', fontWeight: 600 }}>
                ● Low-Latency Edge Workers
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🚀
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="admin-card" style={{ padding: '16px 20px', marginBottom: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⚡ Quick Management Actions:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href="/admin/posts/new" className="btn btn-primary btn-sm">➕ New Post</Link>
            <Link href="/admin/badges" className="btn btn-secondary btn-sm">🎨 8 Color Badges</Link>
            <Link href="/admin/marquees" className="btn btn-secondary btn-sm">📢 Live Tickers</Link>
            <Link href="/admin/settings#section-categories" className="btn btn-secondary btn-sm">📂 Category Show/Hide</Link>
            <Link href="/admin/r2" className="btn btn-secondary btn-sm">☁️ R2 Uploads</Link>
            <Link href="/admin/d1" className="btn btn-secondary btn-sm">💾 D1 SQL Console</Link>
          </div>
        </div>
      </div>

      {/* Analytics KPIs */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <div>
              <div className="analytics-kpi-label">Today&apos;s Views (IST)</div>
              <div className="analytics-kpi-value">{todayViews.toLocaleString('en-IN')}</div>
            </div>
            <div className="analytics-kpi-icon" style={{ background: '#ffe4e6', color: '#be123c' }}>👁️</div>
          </div>
          <div className="analytics-kpi-meta">
            <span className={`analytics-delta-pill ${deltaClass}`}>{deltaText}</span>
            <span>Yest: {yesterdayViews.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <div>
              <div className="analytics-kpi-label">Posts Viewed Today</div>
              <div className="analytics-kpi-value">{todayPostsViewed.toLocaleString('en-IN')}</div>
            </div>
            <div className="analytics-kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>📄</div>
          </div>
          <div className="analytics-kpi-meta">
            <span style={{ color: '#0369a1' }}>Out of {data?.totalPosts || 0} total posts</span>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <div>
              <div className="analytics-kpi-label">Total Lifetime Views</div>
              <div className="analytics-kpi-value">{totalViewsAll.toLocaleString('en-IN')}</div>
            </div>
            <div className="analytics-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>🔥</div>
          </div>
          <div className="analytics-kpi-meta">
            <span style={{ color: '#059669' }}>7-Day Total: {weekViewsTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="analytics-kpi-label">#1 Top Post Views</div>
              <div className="analytics-kpi-value">{Number(topLeader?.views || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="analytics-kpi-icon" style={{ background: '#fef9c3', color: '#ca8a04' }}>🏆</div>
          </div>
          <div className="analytics-kpi-meta" style={{ overflow: 'hidden' }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', display: 'block' }}>
              {topLeader?.title || 'No views recorded yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="analytics-charts-grid">
        <div className="admin-card">
          <div className="admin-card-header" style={{ marginBottom: '14px' }}>
            <h2>📊 7-Day Views Trend (IST)</h2>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Last 7 Days</span>
          </div>
          <div className="chart-bars-stage">
            {dailyTrend.map((d) => {
              const heightPct = Math.max(8, Math.round((d.views / maxDailyViews) * 100));
              return (
                <div key={d.date} className={`chart-bar-col${d.isToday ? ' is-today' : ''}`}>
                  <div className="chart-bar-count">{d.views}</div>
                  <div className="chart-bar-track">
                    <div className="chart-bar-fill" style={{ height: `${heightPct}%` }} />
                  </div>
                  <div className="chart-bar-label">{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header" style={{ marginBottom: '14px' }}>
            <h2>📁 Category Traffic Share</h2>
          </div>
          <div className="cat-share-list">
            {categoryViews.length > 0 ? (
              categoryViews.map((cv) => (
                <div key={cv.category} className="cat-share-row">
                  <div className="cat-share-meta">
                    <span className="cat-share-name">{cv.name}</span>
                    <span className="cat-share-nums">{cv.views} views</span>
                  </div>
                  <div className="cat-share-bar-bg">
                    <div className="cat-share-bar-fill" style={{ width: `${Math.max(4, cv.pct)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Views will populate as posts receive traffic.</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Posts Leaders */}
      <div className="analytics-top-grid">
        <div className="admin-card">
          <div className="admin-card-header" style={{ marginBottom: '14px' }}>
            <h2>🔥 Top Posts Today</h2>
          </div>
          <div className="top-post-list">
            {topPostsToday.length > 0 ? (
              topPostsToday.map((p, idx) => (
                <div key={p.id} className="top-post-item">
                  <div className="top-post-head">
                    <div className="top-post-title-wrap">
                      <span className={`top-rank-badge rank-${idx + 1}`}>{idx + 1}</span>
                      <Link href={`/admin/posts/edit/${p.id}`} className="top-post-title">{p.title}</Link>
                    </div>
                    <span className="top-post-views-pill today-hot">{p.today_views} today</span>
                  </div>
                  <div className="top-post-foot">
                    <span>{p.category}</span>
                    <div className="top-post-meter-bg">
                      <div className="top-post-meter-fill today-fill" style={{ width: `${Math.round((p.today_views / maxTodayViews) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No views recorded today yet.</p>
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header" style={{ marginBottom: '14px' }}>
            <h2>🏆 All-Time Top Posts</h2>
          </div>
          <div className="top-post-list">
            {topPostsOverall.length > 0 ? (
              topPostsOverall.map((p, idx) => (
                <div key={p.id} className="top-post-item">
                  <div className="top-post-head">
                    <div className="top-post-title-wrap">
                      <span className={`top-rank-badge rank-${idx + 1}`}>{idx + 1}</span>
                      <Link href={`/admin/posts/edit/${p.id}`} className="top-post-title">{p.title}</Link>
                    </div>
                    <span className="top-post-views-pill">{p.views} views</span>
                  </div>
                  <div className="top-post-foot">
                    <span>{p.category}</span>
                    <div className="top-post-meter-bg">
                      <div className="top-post-meter-fill" style={{ width: `${Math.round((p.views / maxOverallViews) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No posts created yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Notifications Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2>📝 Recent Notifications</h2>
          <Link href="/admin/posts" className="btn btn-secondary btn-sm">View All Notifications →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Notification Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Views</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentPosts || []).length > 0 ? (
                data!.recentPosts.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td><b>{p.title}</b></td>
                    <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                    <td>
                      <span
                        style={{
                          background: p.status === 'active' ? '#ecfdf5' : '#fffbeb',
                          color: p.status === 'active' ? '#059669' : '#d97706',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        ● {p.status === 'active' ? 'Published' : p.status}
                      </span>
                    </td>
                    <td>{p.views || 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/admin/posts/edit/${p.id}`} className="btn btn-secondary btn-sm">Edit</Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    No posts yet. Click &quot;Create New Post&quot; to publish your first notification!
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
