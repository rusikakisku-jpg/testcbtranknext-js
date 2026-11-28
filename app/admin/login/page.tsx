'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        authenticated?: boolean;
        error?: string;
      } | null;
      if (!res.ok || (!json?.authenticated && !json?.success)) {
        setError(json?.error || 'Invalid Admin Username or Password');
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Network error while connecting to /api/admin/auth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gez-login-screen">
      <div className="gez-login-wrap">
        <div className="gez-login-card">
          <div className="gez-login-header">
            <Link href="/" className="gez-login-emblem" title="Go to CBT RANK">
              <img src="https://upload.cbtrank.com/logo.png" alt="CBT RANK" />
            </Link>
            <h1 className="gez-login-title">Admin Console Pro</h1>
            <p className="gez-login-subtitle">Sign in to manage CBT RANK Sarkari Portal, D1 &amp; R2</p>
          </div>

          {error && <div className="gez-login-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="gez-login-field">
              <label htmlFor="admin-user">Admin Username</label>
              <input
                id="admin-user"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="admin"
              />
            </div>

            <div className="gez-login-field">
              <label htmlFor="admin-pass">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-pass"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter admin password"
                  style={{ paddingRight: '46px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="gez-login-submit">
              {loading ? 'Authenticating...' : 'Sign In to Admin Suite →'}
            </button>
          </form>

          <div className="gez-login-footer">
            <Link href="/">← Return to CBT RANK Home</Link>
            <span>Cloudflare Edge Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
