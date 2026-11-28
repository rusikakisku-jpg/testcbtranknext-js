'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminConsoleShell from '../components/AdminConsoleShell';
import { SARKARI_CATEGORIES, SARKARI_CATEGORY_KEYS } from '../../lib/sarkariConstants';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [countMap, setCountMap] = useState<Record<string, number>>({});
  const [hiddenSet, setHiddenSet] = useState<Set<string>>(new Set());
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' });
      if (res.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const json = (await res.json()) as {
        dbStatus?: { connected: boolean; message: string };
        settings?: Record<string, string>;
        categoryCountMap?: Record<string, number>;
        error?: string;
      };
      if (json.dbStatus) setDbStatus(json.dbStatus);
      if (!res.ok) {
        setErrorMsg(json.error || 'Failed to load settings');
        return;
      }
      const st = json.settings || {};
      setSettings(st);
      setCountMap(json.categoryCountMap || {});
      try {
        const arr = JSON.parse(st.hidden_categories || '[]');
        setHiddenSet(new Set(Array.isArray(arr) ? arr.map(String) : []));
      } catch {
        setHiddenSet(new Set());
      }
    } catch {
      setErrorMsg('Network error loading settings');
    }
  }, [router]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateField = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    setErrorMsg('');
    try {
      const payload = {
        ...settings,
        hidden_categories: JSON.stringify(Array.from(hiddenSet))
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        router.replace('/admin/login');
        return;
      }
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        settings?: Record<string, string>;
        error?: string;
      } | null;
      if (!res.ok || !json?.success) {
        setErrorMsg(json?.error || `Failed to save settings (HTTP ${res.status})`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (json.settings) {
        setSettings(json.settings);
      }
      setSavedMsg('✅ Portal settings successfully saved and synchronized across the website!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrorMsg('Network error while saving settings.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const activeLayout = settings.post_detail_layout === 'classic' ? 'classic' : 'blog_2col';

  const hideAllEmptyCats = () => {
    const next = new Set(hiddenSet);
    for (const k of SARKARI_CATEGORY_KEYS) {
      if ((countMap[k] || 0) === 0) next.add(k);
    }
    setHiddenSet(next);
  };

  const showAllCats = () => setHiddenSet(new Set());

  return (
    <AdminConsoleShell pageTitle="Portal Settings">
      <div className="admin-card">
        <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>⚙️ Portal Master Settings &amp; Configuration</h2>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Controls for branding, 2-mode post layout, category visibility, social channels, urgent alert bar &amp; SEO.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link href="/sarkari" target="_blank" className="btn btn-secondary btn-sm">🌐 View Live Portal</Link>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 18px', fontWeight: 700 }}
            >
              {saving ? 'Saving...' : '💾 Save All Settings'}
            </button>
          </div>
        </div>

        {dbStatus && !dbStatus.connected && (
          <div className="alert alert-danger" style={{ fontWeight: 600 }}>
            ⚠️ {dbStatus.message} — Cloudflare Pages Settings → Functions → D1 database bindings me variable <code>DB</code> ko <code>cbtrank_db</code> se bind karein.
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger" style={{ fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {savedMsg && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '14px 18px', borderRadius: '8px', marginBottom: '24px', fontWeight: 600 }}>
            {savedMsg}
          </div>
        )}

        <div className="settings-nav-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '26px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <a href="#section-branding" className="settings-pill">🌐 General &amp; Branding</a>
          <a href="#section-layout" className="settings-pill">📰 Post Page Layout</a>
          <a href="#section-categories" className="settings-pill">📂 Category Visibility</a>
          <a href="#section-social" className="settings-pill">📲 Social Communities</a>
          <a href="#section-announcement" className="settings-pill">📢 Urgent Alert Bar</a>
          <a href="#section-seo" className="settings-pill">🚀 SEO &amp; Meta</a>
        </div>

        <form onSubmit={handleSave}>
          {/* 1. General & Brand Identity */}
          <div id="section-branding" className="settings-group-card">
            <div className="settings-group-header">
              <span className="settings-group-icon">🌐</span>
              <div>
                <h3 className="settings-group-title">1. General &amp; Brand Identity</h3>
                <p className="settings-group-desc">Configure Sarkari portal title, header tagline, domain URL &amp; contact email.</p>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Portal Brand Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.site_title || ''}
                  onChange={(e) => updateField('site_title', e.target.value)}
                  placeholder="CBT RANK"
                />
              </div>
              <div className="form-group">
                <label>Header Subtitle (Banner Tag)</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.header_subtitle || ''}
                  onChange={(e) => updateField('header_subtitle', e.target.value)}
                  placeholder="WWW.CBTRANK.COM — SARKARI PORTAL"
                />
              </div>
              <div className="form-group">
                <label>Primary Domain URL</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.site_domain || ''}
                  onChange={(e) => updateField('site_domain', e.target.value)}
                  placeholder="https://cbtrank.com"
                />
              </div>
              <div className="form-group">
                <label>Support / Contact Email</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.contact_email || ''}
                  onChange={(e) => updateField('contact_email', e.target.value)}
                  placeholder="contact@cbtrank.com"
                />
              </div>
            </div>
          </div>

          {/* 1B. Post / Full Blog Detail Page Layout */}
          <div id="section-layout" className="settings-group-card">
            <div className="settings-group-header">
              <span className="settings-group-icon">📰</span>
              <div>
                <h3 className="settings-group-title">Post / Full Blog Detail Page Layout (2 UI Modes)</h3>
                <p className="settings-group-desc">Choose how post detail pages display on the frontend: Classic Sarkari structured tables OR 2-Column Editorial Blog Article with sticky sidebar.</p>
              </div>
            </div>

            <div className="layout-selector-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <button
                type="button"
                className={`layout-option-card${activeLayout === 'classic' ? ' selected' : ''}`}
                style={{ textAlign: 'left', width: '100%', fontFamily: 'inherit' }}
                onClick={() => updateField('post_detail_layout', 'classic')}
              >
                <div className="layout-card-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="layout-radio-dot" />
                    <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>Classic Sarkari Single-Column</strong>
                  </div>
                  <span className="layout-badge classic-badge">Structured Tables</span>
                </div>
                <div className="layout-wireframe">
                  <div style={{ width: '100%', height: '10px', background: '#ab183d', borderRadius: '3px', marginBottom: '6px' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '6px' }}>
                    <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '3px' }} />
                    <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '3px' }} />
                  </div>
                  <div style={{ width: '100%', height: '22px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px' }} />
                </div>
                <p className="layout-card-desc">
                  Traditional centered single-column Sarkari layout with Dates, Fees, Age Limit, Vacancy tables &amp; 60/40 Important Links table. (Hides Full Blog Article.)
                </p>
              </button>

              <button
                type="button"
                className={`layout-option-card${activeLayout === 'blog_2col' ? ' selected' : ''}`}
                style={{ textAlign: 'left', width: '100%', fontFamily: 'inherit' }}
                onClick={() => updateField('post_detail_layout', 'blog_2col')}
              >
                <div className="layout-card-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="layout-radio-dot" />
                    <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>2-Column Blog + Sidebar Layout</strong>
                  </div>
                  <span className="layout-badge blog-badge">Editorial Mode</span>
                </div>
                <div className="layout-wireframe" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px' }}>
                  <div>
                    <div style={{ width: '70%', height: '8px', background: '#0066ff', borderRadius: '2px', marginBottom: '5px' }} />
                    <div style={{ width: '100%', height: '18px', background: '#e2e8f0', borderRadius: '3px', marginBottom: '5px' }} />
                    <div style={{ width: '100%', height: '24px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ height: '12px', background: '#dbeafe', borderRadius: '2px' }} />
                    <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '2px' }} />
                    <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '2px' }} />
                  </div>
                </div>
                <p className="layout-card-desc">
                  Modern 2-column magazine layout: Full Rich Blog Article on left + Right sidebar with Search, Recent Posts, Popular Posts &amp; Share bar.
                </p>
              </button>
            </div>
          </div>

          {/* 1C. Category Visibility Controls */}
          <div id="section-categories" className="settings-group-card">
            <div className="settings-group-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span className="settings-group-icon">📂</span>
                <div>
                  <h3 className="settings-group-title">Category Visibility Control (Show / Hide Sections)</h3>
                  <p className="settings-group-desc">Hide any category with 0 posts from the Sarkari Portal boxes &amp; sidebar.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" onClick={hideAllEmptyCats} className="btn btn-secondary btn-sm">🙈 Hide All 0-Post Categories</button>
                <button type="button" onClick={showAllCats} className="btn btn-secondary btn-sm">👁️ Show All 8 Categories</button>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.auto_hide_empty_categories === '1'}
                onChange={(e) => updateField('auto_hide_empty_categories', e.target.checked ? '1' : '0')}
                style={{ width: '17px', height: '17px' }}
              />
              <div>
                <strong style={{ fontSize: '13.5px', color: '#1e3a8a' }}>⚡ Automatically Hide Any Category With 0 Active Posts</strong>
                <div style={{ fontSize: '12px', color: '#475569' }}>Empty categories stay hidden automatically and reappear as soon as a post is published in them.</div>
              </div>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {SARKARI_CATEGORY_KEYS.map((catKey) => {
                const countVal = Number(countMap[catKey] || 0);
                const isVisible = !hiddenSet.has(catKey);
                return (
                  <label
                    key={catKey}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '12px 14px',
                      border: `1.5px solid ${isVisible ? '#86efac' : '#fecaca'}`,
                      background: isVisible ? '#f0fdf4' : '#fef2f2',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>{SARKARI_CATEGORIES[catKey].name}</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: countVal > 0 ? '#15803d' : '#b45309', marginTop: '2px' }}>
                        {countVal} active {countVal === 1 ? 'post' : 'posts'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: isVisible ? '#166534' : '#991b1b' }}>
                        {isVisible ? 'Visible' : 'Hidden'}
                      </span>
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={(e) => {
                          const next = new Set(hiddenSet);
                          if (e.target.checked) next.delete(catKey);
                          else next.add(catKey);
                          setHiddenSet(next);
                        }}
                        style={{ width: '17px', height: '17px' }}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 2. Social Channels */}
          <div id="section-social" className="settings-group-card">
            <div className="settings-group-header">
              <span className="settings-group-icon">📲</span>
              <div>
                <h3 className="settings-group-title">2. Social Media &amp; Community Channels</h3>
                <p className="settings-group-desc">Official Telegram, WhatsApp, YouTube &amp; X channel links shown across notifications.</p>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>✈️ Telegram Channel URL</label>
                <input type="text" className="form-control" value={settings.telegram_url || ''} onChange={(e) => updateField('telegram_url', e.target.value)} placeholder="https://t.me/cbtrank" />
              </div>
              <div className="form-group">
                <label>💬 WhatsApp Channel URL</label>
                <input type="text" className="form-control" value={settings.whatsapp_url || ''} onChange={(e) => updateField('whatsapp_url', e.target.value)} placeholder="https://whatsapp.com/channel/..." />
              </div>
              <div className="form-group">
                <label>▶️ YouTube Channel URL</label>
                <input type="text" className="form-control" value={settings.youtube_url || ''} onChange={(e) => updateField('youtube_url', e.target.value)} placeholder="https://youtube.com/@..." />
              </div>
              <div className="form-group">
                <label>🐦 Twitter / X URL</label>
                <input type="text" className="form-control" value={settings.twitter_url || ''} onChange={(e) => updateField('twitter_url', e.target.value)} placeholder="https://x.com/..." />
              </div>
            </div>
          </div>

          {/* 3. Urgent Alert Bar */}
          <div id="section-announcement" className="settings-group-card">
            <div className="settings-group-header">
              <span className="settings-group-icon">📢</span>
              <div>
                <h3 className="settings-group-title">3. Top Urgent Notice / Announcement Bar</h3>
                <p className="settings-group-desc">Displays a bold alert strip at the top of the Sarkari Portal &amp; category pages.</p>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.notice_banner_active === '1'}
                onChange={(e) => updateField('notice_banner_active', e.target.checked ? '1' : '0')}
                style={{ width: '17px', height: '17px' }}
              />
              <span>Activate Top Urgent Notice Bar</span>
            </label>
            <div className="form-row">
              <div className="form-group">
                <label>Announcement Text</label>
                <input type="text" className="form-control" value={settings.notice_banner_text || ''} onChange={(e) => updateField('notice_banner_text', e.target.value)} placeholder="e.g. SSC CGL 2026 Tier 1 Answer Key Out Now — Check Rank!" />
              </div>
              <div className="form-group">
                <label>Link URL (Optional)</label>
                <input type="text" className="form-control" value={settings.notice_banner_url || ''} onChange={(e) => updateField('notice_banner_url', e.target.value)} placeholder="/answerkey or https://..." />
              </div>
              <div className="form-group" style={{ maxWidth: '140px' }}>
                <label>Banner Color</label>
                <input type="color" value={settings.notice_banner_bg || '#dc2626'} onChange={(e) => updateField('notice_banner_bg', e.target.value)} style={{ width: '100%', height: '40px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
              </div>
            </div>
          </div>

          {/* 4. SEO & Meta */}
          <div id="section-seo" className="settings-group-card">
            <div className="settings-group-header">
              <span className="settings-group-icon">🚀</span>
              <div>
                <h3 className="settings-group-title">4. SEO Metadata</h3>
                <p className="settings-group-desc">Default meta description &amp; keywords for Sarkari Portal pages.</p>
              </div>
            </div>
            <div className="form-group">
              <label>Default Meta Description</label>
              <textarea className="form-control" rows={2} value={settings.meta_description || ''} onChange={(e) => updateField('meta_description', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Meta Keywords</label>
              <input type="text" className="form-control" value={settings.meta_keywords || ''} onChange={(e) => updateField('meta_keywords', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '11px 28px', fontSize: '15px' }}>
              {saving ? 'Saving All Settings...' : '💾 Save All Portal Settings'}
            </button>
          </div>
        </form>
      </div>
    </AdminConsoleShell>
  );
}
