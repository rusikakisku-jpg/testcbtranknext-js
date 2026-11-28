'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminConsoleShell from '../components/AdminConsoleShell';

export default function AdminD1Page() {
  const router = useRouter();
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; mode: string; message: string; databaseId?: string } | null>(null);
  const [tableStats, setTableStats] = useState<Array<{ name: string; count: number }>>([]);
  const [sql, setSql] = useState('SELECT id, title, category, status, views FROM sarkari_posts ORDER BY id DESC LIMIT 10;');
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [queryError, setQueryError] = useState('');
  const [running, setRunning] = useState(false);

  const loadStats = useCallback(async () => {
    const res = await fetch('/api/admin/d1', { cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/admin/login');
      return;
    }
    const json = (await res.json()) as { dbStatus?: typeof dbStatus; tableStats?: Array<{ name: string; count: number }> };
    setDbStatus(json.dbStatus || null);
    setTableStats(json.tableStats || []);
  }, [router]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRunSql = async (e: FormEvent) => {
    e.preventDefault();
    setRunning(true);
    setQueryError('');
    try {
      const res = await fetch('/api/admin/d1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql_query: sql })
      });
      const json = (await res.json()) as { rows?: Array<Record<string, unknown>>; error?: string };
      if (!res.ok) {
        setQueryError(json.error || 'Query failed');
        setRows(null);
      } else {
        setRows(json.rows || []);
        loadStats();
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <AdminConsoleShell pageTitle="Cloudflare D1 SQL">
      <div className="admin-card">
        <div className="admin-card-header">
          <h2>Cloudflare D1 Database Management Console</h2>
        </div>

        <div
          style={{
            background: dbStatus?.connected ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${dbStatus?.connected ? '#86efac' : '#fde68a'}`,
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '25px'
          }}
        >
          <h3 style={{ marginTop: 0, color: dbStatus?.connected ? '#166534' : '#92400e', fontSize: '16px' }}>
            {dbStatus?.connected ? '⚡ Connected to Cloudflare D1 Serverless SQL Database' : '⚠️ D1 Database Not Bound Yet'}
          </h3>
          <p style={{ fontSize: '13.5px', margin: '6px 0', color: '#334155' }}>
            <b>Database ID:</b> {dbStatus?.databaseId || 'fd29c541-3fd2-4fa8-8dc1-19809ab907c3'} |{' '}
            <b>Driver:</b> {dbStatus?.mode || 'checking'} | {dbStatus?.message}
          </p>
        </div>

        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Sarkari CMS Tables &amp; Row Counts</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '25px' }}>
          {tableStats.map((t) => (
            <div key={t.name} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '6px', minWidth: '140px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--admin-primary)' }}>{t.count}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Table: <code>{t.name}</code></div>
            </div>
          ))}
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '18px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, fontSize: '15px' }}>Run SQL Query against D1 Database</h3>
          <form onSubmit={handleRunSql}>
            <div className="form-group">
              <textarea
                className="form-control"
                rows={3}
                style={{ fontFamily: 'monospace', fontSize: '13.5px' }}
                value={sql}
                onChange={(e) => setSql(e.target.value)}
              />
            </div>
            <button type="submit" disabled={running} className="btn btn-primary">
              {running ? 'Running...' : 'Execute Query'}
            </button>
          </form>
        </div>

        {queryError && (
          <div className="alert alert-danger">
            <b>Query Error:</b> {queryError}
          </div>
        )}

        {rows && (
          <>
            <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Query Result ({rows.length} row(s))</h3>
            <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
              {rows.length > 0 ? (
                <table className="admin-table d1-sql-table">
                  <thead>
                    <tr>
                      {Object.keys(rows[0]).map((k) => (
                        <th key={k}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, rIdx) => (
                      <tr key={rIdx}>
                        {Object.keys(rows[0]).map((k) => (
                          <td key={k}>{typeof r[k] === 'object' ? JSON.stringify(r[k]) : String(r[k] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Query executed with 0 rows returned.</p>
              )}
            </div>
          </>
        )}
      </div>
    </AdminConsoleShell>
  );
}
