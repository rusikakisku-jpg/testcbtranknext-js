export const runtime = 'edge';

import type { Metadata } from 'next';
import Link from 'next/link';
import SarkariSubheader from '../components/SarkariSubheader';
import { SARKARI_CATEGORIES } from '../lib/sarkariConstants';
import {
  fetchSarkariBadges,
  getSarkariSettings,
  searchActiveSarkariPosts
} from '../lib/sarkariDb';

export const metadata: Metadata = {
  title: 'Search Notifications - Jobs, Admit Card, Results & Answer Key',
  robots: { index: false, follow: true }
};

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp.q || '').trim();
  const [settings, badges, posts] = await Promise.all([
    getSarkariSettings(),
    fetchSarkariBadges(),
    query ? searchActiveSarkariPosts(query, 40, 0) : Promise.resolve([])
  ]);

  return (
    <div className="gez-portal-root">
      <SarkariSubheader
        settings={settings}
        badges={badges}
        searchQuery={query}
        showSearch={true}
        showBadges={false}
      />

      <main className="container">
        <div className="gez-breadcrumb-row">
          <Link href="/">🏠 Home</Link>
          <span>»</span>
          <Link href="/sarkari">Sarkari Portal</Link>
          <span>»</span>
          <span>Search{query ? `: "${query}"` : ''}</span>
        </div>

        <div className="sarkari-box" style={{ marginBottom: '30px' }}>
          <h1 className="sarkari-box-header" style={{ margin: 0, fontSize: '16px', lineHeight: 1.3 }}>
            {query ? `Search Results for "${query}" (${posts.length})` : 'Search Government Jobs, Admit Cards & Results'}
          </h1>

          <ul className="sarkari-box-list">
            {posts.length > 0 ? (
              posts.map((post) => (
                <li key={post.id}>
                  <span className="list-chevron">›</span>
                  <div style={{ flex: 1 }}>
                    <Link href={`/post/${post.slug}`} style={{ fontWeight: 'bold', color: 'var(--link-blue)', fontSize: '14.5px' }}>
                      {post.title}
                    </Link>
                    {post.department && (
                      <span style={{ color: '#666', fontSize: '12.5px' }}> ({post.department})</span>
                    )}
                    <span className="tag-badge tag-blue" style={{ marginLeft: '6px' }}>
                      {SARKARI_CATEGORIES[post.category]?.name || post.category}
                    </span>
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
                {query
                  ? `No notifications found matching "${query}". Try searching with shorter keywords like SSC, Railway, Constable, or CGL.`
                  : 'Enter a keyword in the search box above to find notifications.'}
              </li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
