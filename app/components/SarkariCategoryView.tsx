import Link from 'next/link';
import {
  SARKARI_CATEGORIES,
  SARKARI_CATEGORY_KEYS,
  SarkariBadge,
  SarkariCategoryMeta,
  SarkariPost
} from '../lib/sarkariConstants';
import SarkariSubheader from './SarkariSubheader';

interface Props {
  categoryMeta: SarkariCategoryMeta;
  posts: SarkariPost[];
  totalPosts: number;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  settings: Record<string, string>;
  badges?: SarkariBadge[];
  categoryCounts?: Record<string, number>;
}

export default function SarkariCategoryView({
  categoryMeta,
  posts,
  currentPage,
  totalPages,
  searchQuery,
  settings,
  badges = []
}: Props) {
  const buildPageHref = (pageNum: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (pageNum > 1) params.set('page', String(pageNum));
    const qs = params.toString();
    return qs ? `${categoryMeta.route}?${qs}` : categoryMeta.route;
  };

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="gez-portal-root">
      {/* Compact Category Sub-Header */}
      <SarkariSubheader
        settings={settings}
        badges={badges}
        searchQuery={searchQuery}
        showBadges={false}
        showSearch={false}
      />

      <main className="container">
        {/* Category Quick Bar */}
        <div className="gez-cat-strip">
          <Link href="/sarkari" className="gez-cat-strip-link">
            🏠 Sarkari Hub
          </Link>
          {SARKARI_CATEGORY_KEYS.map((key) => {
            const cat = SARKARI_CATEGORIES[key];
            return (
              <Link
                key={key}
                href={cat.route}
                className={`gez-cat-strip-link${key === categoryMeta.slug ? ' active' : ''}`}
              >
                {cat.shortLabel}
              </Link>
            );
          })}
        </div>

        {/* Breadcrumb */}
        <div style={{ fontSize: '13px', margin: '10px 0 12px 2px', color: '#666' }}>
          <Link href="/" style={{ color: 'var(--primary-red)', fontWeight: 'bold', textDecoration: 'none' }}>
            🏠 Home
          </Link>
          <span style={{ margin: '0 6px', color: '#999' }}>»</span>
          <Link href="/sarkari" style={{ color: '#475569', fontWeight: 600, textDecoration: 'none' }}>
            Sarkari Portal
          </Link>
          <span style={{ margin: '0 6px', color: '#999' }}>»</span>
          <span style={{ color: '#333', fontWeight: 600 }}>{categoryMeta.name}</span>
        </div>

        <div className="sarkari-box" style={{ marginBottom: '30px' }}>
          <h1 className="sarkari-box-header" style={{ margin: 0, fontSize: '16px', lineHeight: 1.3 }}>
            {categoryMeta.name} - CBTRank 2026
          </h1>

          {/* Category Overview + Search Filter */}
          <div
            style={{
              padding: '14px 18px',
              background: '#fafafa',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '13.5px',
              lineHeight: 1.65,
              color: '#334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <p style={{ margin: 0, flex: '1 1 360px' }}>{categoryMeta.introEn}</p>
            <form action={categoryMeta.route} method="GET" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder={`Filter ${categoryMeta.name}...`}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  minWidth: '185px'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--primary-red)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                Filter
              </button>
              {searchQuery && (
                <Link
                  href={categoryMeta.route}
                  style={{
                    padding: '6px 10px',
                    background: '#e2e8f0',
                    color: '#1e293b',
                    borderRadius: '4px',
                    fontSize: '12.5px',
                    fontWeight: 600
                  }}
                >
                  Reset
                </Link>
              )}
            </form>
          </div>

          <ul className="sarkari-box-list">
            {posts.length > 0 ? (
              posts.map((post) => (
                <li key={post.id}>
                  <span className="list-chevron">›</span>
                  <div style={{ flex: 1 }}>
                    <Link
                      href={`/post/${post.slug}`}
                      style={{ fontWeight: 'bold', color: 'var(--link-blue)', fontSize: '14.5px' }}
                    >
                      {post.title}
                    </Link>
                    {post.department && (
                      <span style={{ color: '#666', fontSize: '12.5px' }}> ({post.department})</span>
                    )}
                    {post.total_vacancy && (
                      <span className="tag-badge tag-blue" style={{ marginLeft: '6px' }}>
                        {post.total_vacancy}
                      </span>
                    )}
                    {post.last_date && (
                      <span className="tag-badge tag-green" style={{ marginLeft: '6px' }}>
                        Last Date: {post.last_date}
                      </span>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li style={{ padding: '24px', textAlign: 'center', color: '#666', justifyContent: 'center' }}>
                No notifications found in this category{searchQuery ? ` matching "${searchQuery}"` : ' yet'}.
              </li>
            )}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '15px',
                borderTop: '1px solid #eee'
              }}
            >
              {currentPage > 1 && (
                <Link
                  href={buildPageHref(currentPage - 1)}
                  style={{ padding: '6px 12px', background: '#eee', borderRadius: '3px', fontWeight: 'bold', color: '#333' }}
                >
                  « Previous
                </Link>
              )}
              {pageNumbers.map((num) => (
                <Link
                  key={num}
                  href={buildPageHref(num)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '3px',
                    fontWeight: 'bold',
                    background: num === currentPage ? 'var(--primary-red)' : '#eee',
                    color: num === currentPage ? '#fff' : '#333'
                  }}
                >
                  {num}
                </Link>
              ))}
              {currentPage < totalPages && (
                <Link
                  href={buildPageHref(currentPage + 1)}
                  style={{ padding: '6px 12px', background: '#eee', borderRadius: '3px', fontWeight: 'bold', color: '#333' }}
                >
                  Next »
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
