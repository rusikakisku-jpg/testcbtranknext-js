'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminConsoleShell from '../components/AdminConsoleShell';
import { SarkariMarquee } from '../../lib/sarkariConstants';

export default function AdminMarqueesPage() {
  const router = useRouter();
  const [marquees, setMarquees] = useState<SarkariMarquee[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ title: '', url: '/latest-jobs', display_order: 1 });

  const loadMarquees = useCallback(async () => {
    const res = await fetch('/api/admin/marquees', { cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const json = (await res.json()) as { marquees?: SarkariMarquee[] };
    const list = json.marquees || [];
    setMarquees(list);
    setForm((prev) => ({ ...prev, display_order: list.length + 1 }));
  }, [router]);

  useEffect(() => {
    loadMarquees();
  }, [loadMarquees]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/marquees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      const json = (await res.json()) as { marquees?: SarkariMarquee[] };
      setMarquees(json.marquees || []);
      setForm({ title: '', url: '/latest-jobs', display_order: (json.marquees?.length || 0) + 1 });
      setMsg('✅ Marquee ticker saved successfully!');
    }
  };

  const handleSaveEdit = async (m: SarkariMarquee) => {
    const res = await fetch('/api/admin/marquees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m)
    });
    if (res.ok) {
      const json = (await res.json()) as { marquees?: SarkariMarquee[] };
      setMarquees(json.marquees || []);
      setEditingId(null);
      setMsg('✅ Marquee updated!');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this marquee ticker?')) return;
    const res = await fetch(`/api/admin/marquees?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      const json = (await res.json()) as { marquees?: SarkariMarquee[] };
      setMarquees(json.marquees || []);
      setMsg('🗑️ Marquee deleted!');
    }
  };

  return (
    <AdminConsoleShell pageTitle="Flash Marquees">
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2>Manage Scrolling Tickers / Marquees ({marquees.length})</h2>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
              These announcement tickers scroll across the Sarkari portal banner with breaking updates.
            </div>
          </div>
          <Link href="/sarkari" target="_blank" className="btn btn-secondary btn-sm">👁️ View Portal</Link>
        </div>

        {msg && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 600 }}>
            {msg}
          </div>
        )}

        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px 20px', marginBottom: '25px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '15px', color: '#1e293b' }}>+ Add New Marquee Ticker</h3>
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Ticker Announcement Text *</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. SSC CGL 2026 Tier 1 Result Declared || Check Rank"
                  required
                />
              </div>
              <div className="form-group">
                <label>Target URL *</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ maxWidth: '100px' }}>
                <label>Order</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: Number(e.target.value || 1) })}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 18px' }}>+ Add Ticker</button>
          </form>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Order</th>
                <th>Ticker Text</th>
                <th style={{ width: '220px' }}>Target Link</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {marquees.length > 0 ? (
                marquees.map((m, idx) => (
                  <tr key={m.id}>
                    <td><b>{m.display_order}</b></td>
                    <td>
                      {editingId === m.id ? (
                        <input
                          type="text"
                          className="form-control"
                          value={m.title}
                          onChange={(e) => {
                            const next = [...marquees];
                            next[idx] = { ...m, title: e.target.value };
                            setMarquees(next);
                          }}
                        />
                      ) : (
                        <b>{m.title}</b>
                      )}
                    </td>
                    <td>
                      {editingId === m.id ? (
                        <input
                          type="text"
                          className="form-control"
                          value={m.url}
                          onChange={(e) => {
                            const next = [...marquees];
                            next[idx] = { ...m, url: e.target.value };
                            setMarquees(next);
                          }}
                        />
                      ) : (
                        <Link href={m.url} target="_blank" style={{ color: '#ab183d', wordBreak: 'break-all' }}>{m.url}</Link>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {editingId === m.id ? (
                        <>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(marquees[idx])}>💾 Save</button>{' '}
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(m.id)}>✏️ Edit</button>{' '}
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>🗑️</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '25px', color: '#64748b' }}>
                    No marquees found.
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
