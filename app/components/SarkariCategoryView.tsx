import Link from 'next/link';
import { AdBanner } from './GoogleAdSense';
import { ADSENSE_CONFIG } from '../config/adsense';
import {
  formatShortDate,
  SARKARI_CATEGORIES,
  SARKARI_CATEGORY_KEYS,
  SarkariCategoryMeta,
  SarkariPost
} from '../lib/sarkariConstants';

interface SarkariCategoryViewProps {
  categoryMeta: SarkariCategoryMeta;
  posts: SarkariPost[];
  totalPosts: number;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  categoryCounts: Record<string, number>;
  recentPosts: SarkariPost[];
}

export default function SarkariCategoryView({
  categoryMeta,
  posts,
  totalPosts,
  currentPage,
  totalPages,
  searchQuery,
  categoryCounts,
  recentPosts
}: SarkariCategoryViewProps) {
  const basePath = categoryMeta.route;

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoryMeta.name} 2026 - CBT RANK`,
    description: categoryMeta.description,
    url: `https://cbtrank.com${basePath}`
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cbtrank.com' },
      { '@type': 'ListItem', position: 2, name: categoryMeta.name, item: `https://cbtrank.com${basePath}` }
    ]
  };

  return (
    <main style={{ minHeight: '80vh', padding: '14px 0 42px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="sarkari-container">
        <div className="sarkari-breadcrumb">
          <Link href="/">Home</Link> <span>»</span> <strong>{categoryMeta.name}</strong>
        </div>

        <div className="sarkari-layout">
          <div className="sarkari-main-col">
            <div className="sarkari-hero-banner" style={{ borderLeftColor: categoryMeta.accentColor }}>
              <div className="sarkari-hero-top">
                <span className="sarkari-cat-pill" style={{ background: categoryMeta.accentColor }}>
                  {categoryMeta.name}
                </span>
                <span className="sarkari-total-pill">{totalPosts} Updates</span>
              </div>
              <h1 className="sarkari-page-h1">{categoryMeta.name} 2026 Updates</h1>
              <p className="sarkari-page-desc">{categoryMeta.description}</p>

              <form action={basePath} method="GET" className="sarkari-search-row">
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder={`Search inside ${categoryMeta.name} by exam or department...`}
                  className="sarkari-search-input"
                />
                <button type="submit" className="sarkari-search-btn">Search</button>
                {searchQuery && (
                  <Link href={basePath} className="sarkari-reset-btn">Clear</Link>
                )}
              </form>
            </div>

            <AdBanner slotId={ADSENSE_CONFIG.SLOTS.HOMEPAGE_BANNER} />

            {posts.length === 0 ? (
              <div className="sarkari-empty-card">
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  {searchQuery ? `No matching ${categoryMeta.name} found` : `No ${categoryMeta.name} published yet`}
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '14px' }}>
                  {searchQuery
                    ? 'Try clearing your search filter or check another category.'
                    : 'Verified official updates will appear here as soon as published.'}
                </p>
                <Link href="/answerkey" className="btn-cta" style={{ display: 'inline-flex', padding: '10px 18px', fontSize: '0.88rem' }}>
                  Check Answer Key Calculator
                </Link>
              </div>
            ) : (
              <div className="sarkari-list-cards">
                {posts.map((post) => (
                  <article key={post.id} className="sarkari-list-item">
                    <div className="sarkari-list-item-main">
                      <div className="sarkari-list-meta">
                        <span className="sarkari-mini-badge" style={{ color: categoryMeta.accentColor, borderColor: categoryMeta.accentColor }}>
                          {categoryMeta.shortLabel}
                        </span>
                        {post.is_featured === 1 && (
                          <span className="sarkari-featured-badge">★ Featured</span>
                        )}
                        {post.total_vacancy && (
                          <span className="sarkari-vac-badge">{post.total_vacancy}</span>
                        )}
                        {post.last_date && (
                          <span className="sarkari-lastdate-badge">Last Date: {post.last_date}</span>
                        )}
                      </div>
                      <h2 className="sarkari-list-title">
                        <Link href={`/post/${post.slug}`}>{post.title}</Link>
                      </h2>
                      {post.short_desc && (
                        <p className="sarkari-list-excerpt">{post.short_desc}</p>
                      )}
                      <div className="sarkari-list-foot">
                        <span>{post.department || 'Official Commission'}</span>
                        <span>•</span>
                        <span>{post.post_date || formatShortDate(post.created_at)}</span>
                      </div>
                    </div>
                    <div className="sarkari-list-action">
                      <Link href={`/post/${post.slug}`} className="sarkari-read-btn">
                        View Details →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="sarkari-pagination" aria-label="Category Pagination">
                {currentPage > 1 && (
                  <Link
                    href={`${basePath}?page=${currentPage - 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                    className="sarkari-page-link"
                  >
                    ← Prev
                  </Link>
                )}
                <span className="sarkari-page-info">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link
                    href={`${basePath}?page=${currentPage + 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                    className="sarkari-page-link"
                  >
                    Next →
                  </Link>
                )}
              </nav>
            )}
          </div>

          <aside className="sidebar">
            <div className="widget widget-calc">
              <Link
                href="/answerkey"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '13px 18px',
                  background: 'linear-gradient(135deg, #0066ff 0%, #0044cc 100%)',
                  color: '#ffffff',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 102, 255, 0.22)'
                }}
              >
                🎯 Answer Key &amp; Rank Calculator
              </Link>
            </div>

            <div className="widget sarkari-sidebar-card">
              <h3 className="widget-title">Browse Sarkari Categories</h3>
              <ul className="sarkari-cat-sidebar-list">
                {SARKARI_CATEGORY_KEYS.map((key) => {
                  const meta = SARKARI_CATEGORIES[key];
                  return (
                    <li key={key}>
                      <Link
                        href={meta.route}
                        className={key === categoryMeta.slug ? 'active' : ''}
                      >
                        <span>{meta.name}</span>
                        <span className="sarkari-cat-count">{categoryCounts[key] || 0}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {recentPosts.length > 0 && (
              <div className="widget sarkari-sidebar-card">
                <h3 className="widget-title">Recent Notification Updates</h3>
                <ul className="sarkari-recent-list">
                  {recentPosts.map((rp) => (
                    <li key={rp.id}>
                      <Link href={`/post/${rp.slug}`}>{rp.title}</Link>
                      <span>{rp.post_date || formatShortDate(rp.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <AdBanner slotId={ADSENSE_CONFIG.SLOTS.SIDEBAR_BANNER} />
          </aside>
        </div>
      </div>
    </main>
  );
}
