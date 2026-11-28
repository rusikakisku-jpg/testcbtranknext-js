'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminConsoleShellProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function AdminConsoleShell({ children, pageTitle }: AdminConsoleShellProps) {
  const pathname = usePathname() || '/admin';
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clockText, setClockText] = useState('--:--:--');

  useEffect(() => {
    const updateClock = () => {
      try {
        setClockText(
          new Date().toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        );
      } catch {
        setClockText(new Date().toTimeString().slice(0, 8));
      }
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.replace('/admin/login');
  };

  const resolvedTitle =
    pageTitle ||
    (pathname === '/admin'
      ? 'Dashboard Overview'
      : pathname === '/admin/posts'
        ? 'All Notifications'
        : pathname === '/admin/posts/new'
          ? 'Create Notification'
          : pathname.startsWith('/admin/posts/edit')
            ? 'Edit Notification'
            : pathname === '/admin/badges'
              ? '8 Highlight Badges'
              : pathname === '/admin/marquees'
                ? 'Flash Marquees'
                : pathname === '/admin/authors'
                  ? 'Authors & Team'
                  : pathname === '/admin/r2'
                    ? 'Cloudflare R2 Storage'
                    : pathname === '/admin/d1'
                      ? 'Cloudflare D1 SQL'
                      : pathname === '/admin/settings'
                        ? 'Portal Settings'
                        : 'Management');

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-app-layout">
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' active' : ''}`}
        onClick={closeSidebar}
      />

      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`} id="adminSidebar">
        <div className="sidebar-brand">
          <Link href="/admin" className="brand-link" onClick={closeSidebar}>
            <img
              src="https://upload.cbtrank.com/logo.png"
              alt="CBT RANK"
              className="brand-logo"
              width={36}
              height={36}
              style={{ objectFit: 'contain' }}
            />
            <div className="brand-info">
              <span className="brand-title">CBT RANK</span>
              <span className="brand-subtitle">
                <span className="status-pulse-dot" /> Admin Console Pro
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close Sidebar"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-nav-container">
          <div className="nav-section-title">CORE MANAGEMENT</div>
          <nav className="sidebar-nav">
            <Link
              href="/admin"
              className={`nav-item${pathname === '/admin' ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </Link>
            <Link
              href="/admin/posts"
              className={`nav-item${pathname === '/admin/posts' ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">📝</span>
              <span className="nav-text">All Notifications</span>
            </Link>
            <Link
              href="/admin/posts/new"
              className={`nav-item${pathname === '/admin/posts/new' ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">➕</span>
              <span className="nav-text">Create Post</span>
              <span className="nav-badge new">New</span>
            </Link>
            <Link
              href="/admin/authors"
              className={`nav-item${pathname.startsWith('/admin/authors') ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">✍️</span>
              <span className="nav-text">Authors &amp; Team</span>
            </Link>
          </nav>

          <div className="nav-section-title">HOMEPAGE UI CONTROLS</div>
          <nav className="sidebar-nav">
            <Link
              href="/admin/badges"
              className={`nav-item${pathname === '/admin/badges' ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">🎨</span>
              <span className="nav-text">8 Color Badges</span>
              <span className="nav-badge">8</span>
            </Link>
            <Link
              href="/admin/marquees"
              className={`nav-item${pathname === '/admin/marquees' ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">📢</span>
              <span className="nav-text">Flash Tickers</span>
              <span className="nav-badge">Live</span>
            </Link>
            <Link
              href="/admin/settings#section-categories"
              className="nav-item"
              onClick={closeSidebar}
            >
              <span className="nav-icon">📂</span>
              <span className="nav-text">Category Show/Hide</span>
            </Link>
          </nav>

          <div className="nav-section-title">CLOUD INFRASTRUCTURE</div>
          <nav className="sidebar-nav">
            <Link
              href="/admin/r2"
              className={`nav-item${pathname === '/admin/r2' ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">☁️</span>
              <span className="nav-text">Cloudflare R2</span>
              <span className="nav-badge storage">Storage</span>
            </Link>
            <Link
              href="/admin/d1"
              className={`nav-item${pathname === '/admin/d1' ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">💾</span>
              <span className="nav-text">Cloudflare D1</span>
              <span className="nav-badge db">SQL</span>
            </Link>
          </nav>

          <div className="nav-section-title">PORTAL SETTINGS</div>
          <nav className="sidebar-nav">
            <Link
              href="/admin/settings"
              className={`nav-item${pathname === '/admin/settings' ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Global Settings</span>
            </Link>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="system-status-chip">
            <div className="status-indicator">
              <span className="ping-circle" />
              <span className="ping-core" />
            </div>
            <div className="status-texts">
              <div className="status-line">Cloudflare D1 &amp; R2</div>
              <div className="status-sub">Edge Runtime Online</div>
            </div>
          </div>

          <div className="sidebar-user-row">
            <div className="user-avatar">CBT</div>
            <div className="user-meta">
              <span className="user-name">Admin Portal</span>
              <span className="user-role">Super Administrator</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="sidebar-logout-btn"
              title="Logout from Admin"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-main-viewport">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-toggle-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              <span className="toggle-bar" />
              <span className="toggle-bar" />
              <span className="toggle-bar" />
            </button>
            <div className="topbar-breadcrumb">
              <span className="crumb-root">Console</span>
              <span className="crumb-separator">/</span>
              <span className="crumb-current">{resolvedTitle}</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="live-clock-pill">
              🕒 <span>{clockText} IST</span>
            </div>
            <Link href="/sarkari" target="_blank" className="topbar-btn live-site-btn">
              <span>🌐 <span className="topbar-btn-label">Sarkari Portal</span></span>
              <span className="btn-arrow">↗</span>
            </Link>
            <Link href="/" target="_blank" className="topbar-btn live-site-btn">
              <span>🏠 <span className="topbar-btn-label">CBTRank Home</span></span>
              <span className="btn-arrow">↗</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="topbar-btn logout-btn"
              style={{ border: '1px solid #fecaca', cursor: 'pointer' }}
            >
              <span>🚪 <span className="topbar-btn-label">Logout</span></span>
            </button>
          </div>
        </header>

        <div className="admin-container">{children}</div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="admin-mobile-bottom-nav" aria-label="Admin Mobile Navigation">
        <Link href="/admin" className={`bottom-nav-item${pathname === '/admin' ? ' active' : ''}`}>
          <span className="bottom-nav-icon">📊</span>
          <span className="bottom-nav-label">Home</span>
        </Link>
        <Link href="/admin/posts" className={`bottom-nav-item${pathname === '/admin/posts' ? ' active' : ''}`}>
          <span className="bottom-nav-icon">📝</span>
          <span className="bottom-nav-label">Posts</span>
        </Link>
        <Link
          href="/admin/posts/new"
          className={`bottom-nav-item bottom-nav-fab-wrap${pathname === '/admin/posts/new' ? ' active' : ''}`}
        >
          <span className="bottom-nav-fab">+</span>
          <span className="bottom-nav-label">Create</span>
        </Link>
        <Link href="/admin/badges" className={`bottom-nav-item${pathname === '/admin/badges' ? ' active' : ''}`}>
          <span className="bottom-nav-icon">🎨</span>
          <span className="bottom-nav-label">Badges</span>
        </Link>
        <Link href="/admin/settings" className={`bottom-nav-item${pathname === '/admin/settings' ? ' active' : ''}`}>
          <span className="bottom-nav-icon">⚙️</span>
          <span className="bottom-nav-label">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
