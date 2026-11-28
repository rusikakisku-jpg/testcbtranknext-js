import Link from 'next/link';
import { SarkariBadge, SarkariMarquee } from '../lib/sarkariConstants';

interface Props {
  settings: Record<string, string>;
  badges?: SarkariBadge[];
  marquees?: SarkariMarquee[];
  searchQuery?: string;
  showMarquees?: boolean;
  showBadges?: boolean;
  showSearch?: boolean;
}

export default function SarkariSubheader({
  settings,
  badges = [],
  marquees = [],
  searchQuery = '',
  showMarquees = false,
  showBadges = true,
  showSearch = false
}: Props) {
  const tgUrl = settings.telegram_url || 'https://t.me/cbtrank';
  const waUrl = settings.whatsapp_url || '';

  return (
    <div className="container">
      {settings.notice_banner_active === '1' && settings.notice_banner_text && (
        <div
          className="urgent-notice-bar"
          style={{
            backgroundColor: settings.notice_banner_bg || '#dc2626',
            color: '#ffffff',
            padding: '10px 16px',
            fontWeight: 700,
            textAlign: 'center',
            fontSize: '0.95rem',
            borderRadius: '6px',
            margin: '10px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        >
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>📢</span>
          {settings.notice_banner_url ? (
            <a
              href={settings.notice_banner_url}
              style={{ color: '#ffffff', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {settings.notice_banner_text}
            </a>
          ) : (
            <span>{settings.notice_banner_text}</span>
          )}
        </div>
      )}

      {showMarquees && marquees.length > 0 && (
        <div className="ticker-container">
          {marquees.map((m) => (
            <div key={m.id} className="ticker-row">
              <div className="gez-ticker-track">
                <Link href={m.url || '/latest-jobs'}>
                  🔔 {m.title}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSearch && (
        <>
          <div className="search-banner">
            <form action="/search" method="GET" className="search-box-form">
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search Govt Jobs, Admit Card, Result, SSC, Railway..."
              />
              <button type="submit">🔍 Search</button>
            </form>
          </div>
          <div className="social-bar">
            {tgUrl && (
              <a href={tgUrl} target="_blank" rel="noopener noreferrer" className="social-btn telegram">
                ✈️ Join Telegram Channel
              </a>
            )}
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="social-btn whatsapp">
                💬 Join WhatsApp Channel
              </a>
            )}
          </div>
        </>
      )}

      {showBadges && badges.length > 0 && (
        <div className="badges-grid">
          {badges.map((b) => (
            <Link
              key={b.id}
              href={b.url || '/latest-jobs'}
              className="badge-card"
              style={{ backgroundColor: b.bg_color || '#ab183d' }}
            >
              <div>
                <div className="badge-title">{b.title}</div>
                {b.subtitle && <div className="badge-subtitle">{b.subtitle}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
