'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminConsoleShell from '../components/AdminConsoleShell';
import { SarkariUpload } from '../../lib/sarkariConstants';

export default function AdminR2Page() {
  const router = useRouter();
  const [isR2Configured, setIsR2Configured] = useState(false);
  const [publicDomain, setPublicDomain] = useState('https://upload.cbtrank.com');
  const [uploads, setUploads] = useState<SarkariUpload[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadR2 = useCallback(async () => {
    const res = await fetch('/api/admin/r2', { cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const json = (await res.json()) as { isR2Configured?: boolean; publicDomain?: string; uploads?: SarkariUpload[] };
    setIsR2Configured(Boolean(json.isR2Configured));
    if (json.publicDomain) setPublicDomain(json.publicDomain);
    setUploads(json.uploads || []);
  }, [router]);

  useEffect(() => {
    loadR2();
  }, [loadR2]);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMsg('');
    setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = (await res.json()) as { success?: boolean; url?: string; error?: string };
      if (res.ok && json.url) {
        setMsg(`✅ Uploaded: ${json.url}`);
        setFile(null);
        loadR2();
      } else {
        setErr(json.error || 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (u: SarkariUpload) => {
    if (!confirm('Delete this file record from storage?')) return;
    const res = await fetch(`/api/admin/r2?id=${u.id}&key=${encodeURIComponent(u.file_key || '')}`, { method: 'DELETE' });
    if (res.ok) {
      const json = (await res.json()) as { uploads?: SarkariUpload[] };
      setUploads(json.uploads || []);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard?.writeText(url);
    setMsg(`📋 Copied URL: ${url}`);
  };

  return (
    <AdminConsoleShell pageTitle="Cloudflare R2 Storage">
      <div className="admin-card">
        <div className="admin-card-header">
          <h2>Cloudflare R2 Object Storage Manager</h2>
        </div>

        <div
          style={{
            background: isR2Configured ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${isR2Configured ? '#86efac' : '#fde68a'}`,
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '25px'
          }}
        >
          <h3 style={{ marginTop: 0, color: isR2Configured ? '#166534' : '#92400e', fontSize: '16px' }}>
            {isR2Configured ? '✅ Cloudflare R2 Remote Storage is ACTIVE' : 'ℹ️ Waiting for Cloudflare R2 Bucket Binding'}
          </h3>
          <p style={{ fontSize: '13.5px', margin: '6px 0', color: '#334155' }}>
            <b>Public Domain:</b> {publicDomain} |{' '}
            <b>Status:</b> {isR2Configured ? 'Native R2 Bucket / Worker Upload Active' : 'Attach R2 binding named R2 or set R2_UPLOAD_URL in Cloudflare Pages'}
          </p>
        </div>

        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-danger">{err}</div>}

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '18px', marginBottom: '25px' }}>
          <h3 style={{ marginTop: 0, fontSize: '15px' }}>Upload Document / PDF / Image to R2</h3>
          <form onSubmit={handleUpload} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="file"
              className="form-control"
              style={{ maxWidth: '380px' }}
              required
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button type="submit" disabled={uploading} className="btn btn-primary">
              {uploading ? 'Uploading...' : 'Upload to Storage'}
            </button>
          </form>
        </div>

        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Stored Files ({uploads.length})</h3>
        <div className="admin-table-responsive" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>File Name</th>
                <th>Storage</th>
                <th>Size</th>
                <th>Uploaded At</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length > 0 ? (
                uploads.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>
                      <a href={u.file_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: '#0f172a' }}>
                        {u.original_name}
                      </a>
                      <div style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>{u.file_url}</div>
                    </td>
                    <td>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                        {(u.storage_type || 'r2').toUpperCase()}
                      </span>
                    </td>
                    <td>{u.file_size ? `${(u.file_size / 1024).toFixed(1)} KB` : '-'}</td>
                    <td>{u.created_at}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => copyUrl(u.file_url)} style={{ marginRight: '6px' }}>
                        Copy URL
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '25px', color: '#64748b' }}>
                    No documents uploaded yet.
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
