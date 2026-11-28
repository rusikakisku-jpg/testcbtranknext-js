'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminConsoleShell from '../components/AdminConsoleShell';
import { SarkariBadge } from '../../lib/sarkariConstants';

export default function AdminBadgesPage() {
  const router = useRouter();
  const [badges, setBadges] = useState<SarkariBadge[]>([]);
  const [msg, setMsg] = useState('');
  const [newBadge, setNewBadge] = useState({
    title: '',
    subtitle: '',
    url: '/latest-jobs',
    bg_color: '#ab183d',
    display_order: 1
  });

  const loadBadges = useCallback(async () => {
    const res = await fetch('/api/admin/badges', { cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const json = (await res.json()) as { badges?: SarkariBadge[] };
    const list = json.badges || [];
    setBadges(list);
    setNewBadge((prev) => ({ ...prev, display_order: list.length + 1 }));
  }, [router]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBadge)
    });
    if (res.ok) {
      const json = (await res.json()) as { badges?: SarkariBadge[] };
      setBadges(json.badges || []);
      setNewBadge({ title: '', subtitle: '', url: '/latest-jobs', bg_color: '#ab183d', display_order: (json.badges?.length || 0) + 1 });
      setMsg('✅ Badge created and updated on the Sarkari portal!');
    }
  };

  const handleSaveExisting = async (badge: SarkariBadge) => {
    const res = await fetch('/api/admin/badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badge)
    });
    if (res.ok) {
      const json = (await res.json()) as { badges?: SarkariBadge[] };
      setBadges(json.badges || []);
      setMsg('✅ Badge updated successfully!');
    }
  };

  const handleDelete = async (badge: SarkariBadge) => {
    if (!confirm(`Delete badge "${badge.title}"?`)) return;
    const res = await fetch(`/api/admin/badges?id=${badge.id}`, { method: 'DELETE' });
    if (res.ok) {
      const json = (await res.json()) as { badges?: SarkariBadge[] };
      setBadges(json.badges || []);
      setMsg('🗑️ Badge deleted!');
    }
  };

  return (
    <AdminConsoleShell pageTitle="8 Highlight Badges">
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2>Manage Quick Highlight Color Badges ({badges.length})</h2>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
              These colorful cards appear prominently on the Sarkari portal above the 3-column category boxes.
            </div>
          </div>
          <Link href="/sarkari" target="_blank" className="btn btn-secondary btn-sm">
            👁️ View on Sarkari Portal
          </Link>
        </div>

        {msg && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 600 }}>
            {msg}
          </div>
        )}

        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px 20px', marginBottom: '25px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '15px', color: '#1e293b' }}>➕ Add New Quick Badge</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Badge Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newBadge.title}
                  onChange={(e) => setNewBadge({ ...newBadge, title: e.target.value })}
                  placeholder="e.g. SSC CGL 2026"
                  required
                />
              </div>
              <div className="form-group">
                <label>Subtitle (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={newBadge.subtitle}
                  onChange={(e) => setNewBadge({ ...newBadge, subtitle: e.target.value })}
                  placeholder="e.g. Apply Online"
                />
              </div>
              <div className="form-group">
                <label>Target Link URL *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newBadge.url}
                  onChange={(e) => setNewBadge({ ...newBadge, url: e.target.value })}
                  placeholder="/post/slug or /latest-jobs"
                  required
                />
              </div>
              <div className="form-group" style={{ maxWidth: '110px' }}>
                <label>Background</label>
                <input
                  type="color"
                  value={newBadge.bg_color}
                  onChange={(e) => setNewBadge({ ...newBadge, bg_color: e.target.value })}
                  style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: '2px' }}
                />
              </div>
              <div className="form-group" style={{ maxWidth: '90px' }}>
                <label>Order</label>
                <input
                  type="number"
                  className="form-control"
                  value={newBadge.display_order}
                  onChange={(e) => setNewBadge({ ...newBadge, display_order: Number(e.target.value || 1) })}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 18px' }}>
              + Create Badge
            </button>
          </form>
        </div>

        <div className="badges-admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          {badges.map((b, idx) => (
            <div key={b.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div
                  style={{
                    background: b.bg_color,
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    marginBottom: '14px',
                    minHeight: '58px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ fontSize: '14px' }}>{b.title || 'Badge Title'}</div>
                  <small style={{ opacity: 0.9, fontSize: '11.5px', fontWeight: 'normal' }}>{b.subtitle || ''}</small>
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11.5px' }}>Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={b.title}
                    onChange={(e) => {
                      const next = [...badges];
                      next[idx] = { ...b, title: e.target.value };
                      setBadges(next);
                    }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11.5px' }}>Subtitle</label>
                  <input
                    type="text"
                    className="form-control"
                    value={b.subtitle || ''}
                    onChange={(e) => {
                      const next = [...badges];
                      next[idx] = { ...b, subtitle: e.target.value };
                      setBadges(next);
                    }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11.5px' }}>Link URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={b.url}
                    onChange={(e) => {
                      const next = [...badges];
                      next[idx] = { ...b, url: e.target.value };
                      setBadges(next);
                    }}
                  />
                </div>
                <div className="form-row" style={{ marginBottom: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '11.5px' }}>Color</label>
                    <input
                      type="color"
                      value={b.bg_color}
                      onChange={(e) => {
                        const next = [...badges];
                        next[idx] = { ...b, bg_color: e.target.value };
                        setBadges(next);
                      }}
                      style={{ width: '100%', height: '36px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: '2px' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '11.5px' }}>Order</label>
                    <input
                      type="number"
                      className="form-control"
                      value={b.display_order}
                      onChange={(e) => {
                        const next = [...badges];
                        next[idx] = { ...b, display_order: Number(e.target.value || 1) };
                        setBadges(next);
                      }}
                    />
                  </div>
                </div>
                <button type="button" onClick={() => handleSaveExisting(badges[idx])} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  💾 Save Badge
                </button>
              </div>
              <div style={{ marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', textAlign: 'right' }}>
                <button type="button" onClick={() => handleDelete(b)} className="btn btn-danger btn-sm">
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminConsoleShell>
  );
}
