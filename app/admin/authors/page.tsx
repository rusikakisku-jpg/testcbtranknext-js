'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminConsoleShell from '../components/AdminConsoleShell';
import { SarkariAuthor } from '../../lib/sarkariConstants';

export default function AdminAuthorsPage() {
  const router = useRouter();
  const [authors, setAuthors] = useState<SarkariAuthor[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [newAuthor, setNewAuthor] = useState({
    name: '',
    slug: '',
    role: 'Recruitment Analyst & Exam Writer',
    email: '',
    qualification: '',
    experience: '',
    avatar_url: 'https://upload.cbtrank.com/logo.png',
    bio: '',
    is_active: true
  });

  const loadAuthors = useCallback(async () => {
    const res = await fetch('/api/admin/authors', { cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const json = (await res.json()) as { authors?: SarkariAuthor[] };
    setAuthors(json.authors || []);
  }, [router]);

  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/authors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAuthor)
    });
    if (res.ok) {
      const json = (await res.json()) as { authors?: SarkariAuthor[] };
      setAuthors(json.authors || []);
      setNewAuthor({
        name: '',
        slug: '',
        role: 'Recruitment Analyst & Exam Writer',
        email: '',
        qualification: '',
        experience: '',
        avatar_url: 'https://upload.cbtrank.com/logo.png',
        bio: '',
        is_active: true
      });
      setMsg('✅ Author successfully created!');
    }
  };

  const handleSaveEdit = async (a: SarkariAuthor) => {
    const res = await fetch('/api/admin/authors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(a)
    });
    if (res.ok) {
      const json = (await res.json()) as { authors?: SarkariAuthor[] };
      setAuthors(json.authors || []);
      setEditingId(null);
      setMsg('✅ Author profile updated!');
    }
  };

  return (
    <AdminConsoleShell pageTitle="Authors & Team">
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2>Manage Editorial Team &amp; Authors ({authors.length})</h2>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
              Manage editorial staff, authors, and fact-checkers for recruitment alerts
            </div>
          </div>
        </div>

        {msg && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 600 }}>
            {msg}
          </div>
        )}

        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '18px 20px', marginBottom: '25px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '14px', fontSize: '15px', color: '#1e293b' }}>
            ➕ Add New Author / Editorial Member
          </h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" className="form-control" value={newAuthor.name} onChange={(e) => setNewAuthor({ ...newAuthor, name: e.target.value })} required placeholder="e.g. Priya Sharma" />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input type="text" className="form-control" value={newAuthor.slug} onChange={(e) => setNewAuthor({ ...newAuthor, slug: e.target.value })} placeholder="auto-generated if empty" />
              </div>
              <div className="form-group">
                <label>Role / Title *</label>
                <input type="text" className="form-control" value={newAuthor.role} onChange={(e) => setNewAuthor({ ...newAuthor, role: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={newAuthor.email} onChange={(e) => setNewAuthor({ ...newAuthor, email: e.target.value })} placeholder="author@cbtrank.com" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Qualification</label>
                <input type="text" className="form-control" value={newAuthor.qualification} onChange={(e) => setNewAuthor({ ...newAuthor, qualification: e.target.value })} placeholder="e.g. B.Tech, UPSC Prelims" />
              </div>
              <div className="form-group">
                <label>Experience</label>
                <input type="text" className="form-control" value={newAuthor.experience} onChange={(e) => setNewAuthor({ ...newAuthor, experience: e.target.value })} placeholder="e.g. 5+ Years Exam Reporting" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Avatar URL</label>
                <input type="text" className="form-control" value={newAuthor.avatar_url} onChange={(e) => setNewAuthor({ ...newAuthor, avatar_url: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Short Bio / Verification Statement</label>
              <textarea className="form-control" rows={2} value={newAuthor.bio} onChange={(e) => setNewAuthor({ ...newAuthor, bio: e.target.value })} placeholder="Brief professional background and fact-checking expertise..." />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 20px' }}>+ Save New Author</button>
          </form>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Avatar</th>
                <th>Author Name &amp; Slug</th>
                <th>Role &amp; Credentials</th>
                <th>Posts</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((a, idx) => (
                <tr key={a.id}>
                  <td>
                    <img
                      src={a.avatar_url || 'https://upload.cbtrank.com/logo.png'}
                      alt={a.name}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                    />
                  </td>
                  <td>
                    {editingId === a.id ? (
                      <input
                        type="text"
                        className="form-control"
                        value={a.name}
                        onChange={(e) => {
                          const next = [...authors];
                          next[idx] = { ...a, name: e.target.value };
                          setAuthors(next);
                        }}
                      />
                    ) : (
                      <>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>{a.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>/author/{a.slug}</div>
                        {a.email && <div style={{ fontSize: '11.5px', color: '#64748b' }}>📧 {a.email}</div>}
                      </>
                    )}
                  </td>
                  <td>
                    {editingId === a.id ? (
                      <input
                        type="text"
                        className="form-control"
                        value={a.role || ''}
                        onChange={(e) => {
                          const next = [...authors];
                          next[idx] = { ...a, role: e.target.value };
                          setAuthors(next);
                        }}
                      />
                    ) : (
                      <>
                        <div style={{ fontWeight: 600, color: '#ab183d', fontSize: '13px' }}>{a.role}</div>
                        {(a.qualification || a.experience) && (
                          <div style={{ fontSize: '12px', color: '#475569' }}>
                            {[a.qualification, a.experience].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {a.post_count || 0} Posts
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '3px 8px', background: a.is_active !== 0 ? '#dcfce7' : '#fee2e2', color: a.is_active !== 0 ? '#166534' : '#991b1b', fontSize: '11.5px', fontWeight: 700, borderRadius: '4px' }}>
                      {a.is_active !== 0 ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {editingId === a.id ? (
                      <>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(authors[idx])}>💾 Save</button>{' '}
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(a.id)}>✏️ Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminConsoleShell>
  );
}
