import Link from 'next/link';
import RelatedExamsSection from './RelatedExamsSection';
import { BlogPost } from '../data/blogs';
import { AdBanner } from './GoogleAdSense';
import { ADSENSE_CONFIG } from '../config/adsense';

interface AnswerkeySidebarProps {
  currentSlug?: string;
  recentPosts?: BlogPost[];
  popularPosts?: BlogPost[];
}

function getCoverUrl(coverImage?: string | null): string {
  if (!coverImage) return 'https://upload.cbtrank.com/logo.png';
  if (coverImage.startsWith('http')) return coverImage;
  return `https://upload.cbtrank.com/${coverImage.replace(/^\/+/, '')}`;
}

export default function AnswerkeySidebar({
  currentSlug = '',
  recentPosts = [],
  popularPosts = [],
}: AnswerkeySidebarProps) {
  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Popular & Related Exams Widget */}
      <RelatedExamsSection
        currentSlug={currentSlug}
        isSidebar={true}
        showUniversalCta={false}
      />

      {/* 2. Search Articles & Guides Widget */}
      <div
        className="widget widget-search"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h3
          className="widget-title"
          style={{
            fontSize: '0.98rem',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🔍</span> Search Blog &amp; Guides
        </h3>
        <form action="/blog" method="GET" className="search-form">
          <input
            type="search"
            name="q"
            className="search-input"
            placeholder="Search articles, answer keys..."
          />
          <button type="submit" className="search-btn" aria-label="Submit Search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>
      </div>

      {/* 2b. Sidebar Manual AdSense Banner */}
      <AdBanner slotId={ADSENSE_CONFIG.SLOTS.SIDEBAR_BANNER} />

      {/* 3. Recent Exam Updates Widget */}
      {recentPosts && recentPosts.length > 0 && (
        <div
          className="widget widget-popular"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h3
            className="widget-title"
            style={{
              fontSize: '0.98rem',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📰</span> Recent Exam Updates
          </h3>
          <ul className="popular-posts-list">
            {recentPosts.slice(0, 5).map((post) => (
              <li key={post.slug} className="popular-item">
                <Link href={`/blog/${post.slug}`} style={{ flexShrink: 0, display: 'block' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getCoverUrl(post.coverImage)}
                    alt={post.title || 'Recent Post'}
                    className="popular-thumb"
                    loading="lazy"
                  />
                </Link>
                <div className="popular-info">
                  <Link href={`/blog/${post.slug}`} className="popular-title-link">
                    {post.title}
                  </Link>
                  <span className="popular-date">
                    {post.date ? post.date.split(' ')[0] : 'Recent'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Popular Rank & Cut-off Guides Widget */}
      {popularPosts && popularPosts.length > 0 && (
        <div
          className="widget widget-popular"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h3
            className="widget-title"
            style={{
              fontSize: '0.98rem',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🔥</span> Popular Rank &amp; Cut-Off Guides
          </h3>
          <ul className="popular-posts-list">
            {popularPosts.slice(0, 5).map((post) => (
              <li key={post.slug} className="popular-item">
                <Link href={`/blog/${post.slug}`} style={{ flexShrink: 0, display: 'block' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getCoverUrl(post.coverImage)}
                    alt={post.title || 'Popular Post'}
                    className="popular-thumb"
                    loading="lazy"
                  />
                </Link>
                <div className="popular-info">
                  <Link href={`/blog/${post.slug}`} className="popular-title-link">
                    {post.title}
                  </Link>
                  <span className="popular-date">
                    {post.date ? post.date.split(' ')[0] : 'Recent'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Join Telegram Channel Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0088cc 0%, #006699 100%)',
          borderRadius: '18px',
          padding: '20px',
          color: '#ffffff',
          boxShadow: '0 10px 28px rgba(0, 136, 204, 0.28)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🚀</span>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
            Join Telegram Channel
          </h4>
        </div>
        <p
          style={{
            margin: '0 0 14px 0',
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.5,
          }}
        >
          Get instant alerts for new answer keys, normalized shift cutoffs, and question challenges.
        </p>
        <a
          href="https://t.me/cbtrank"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            padding: '11px 16px',
            background: '#ffffff',
            color: '#0088cc',
            fontWeight: 800,
            fontSize: '0.84rem',
            borderRadius: '10px',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'transform 0.15s ease',
          }}
        >
          Join @cbtrank on Telegram →
        </a>
      </div>

    </div>
  );
}
