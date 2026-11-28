'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setError(json.error || 'Invalid credentials');
        setLoading(false);
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Network error while logging in');
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '78vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div className="sarkari-admin-card" style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🛡️</div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            CBT RANK Admin Login
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
            Manage Latest Jobs, Admit Cards, Results, Syllabus &amp; Answer Keys
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.88rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="sarkari-form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="sarkari-input"
              required
            />
          </div>
          <div className="sarkari-form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="sarkari-input"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="sarkari-btn-primary"
            style={{ width: '100%', padding: '11px', marginTop: '6px' }}
          >
            {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 }}>
            ← Back to CBT RANK Home
          </Link>
        </div>
      </div>
    </main>
  );
}
