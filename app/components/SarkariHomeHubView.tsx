import Link from 'next/link';
import {
  SARKARI_CATEGORIES,
  SarkariBadge,
  SarkariMarquee,
  SarkariPost
} from '../lib/sarkariConstants';
import SarkariSubheader from './SarkariSubheader';

interface Props {
  settings: Record<string, string>;
  badges: SarkariBadge[];
  marquees: SarkariMarquee[];
  categoryPosts: Record<string, SarkariPost[]>;
  hiddenCategories: Set<string>;
}

const BOX_ORDER = [
  { slug: 'latest-jobs', title: 'Latest Jobs', moreLabel: 'View More Latest Jobs →', emptyText: 'No jobs posted yet.' },
  { slug: 'admit-card', title: 'Admit Card', moreLabel: 'View More Admit Card →', emptyText: 'No admit cards available yet.' },
  { slug: 'answer-key', title: 'Answer Key', moreLabel: 'View More Answer Key →', emptyText: 'No answer keys available yet.' },
  { slug: 'result', title: 'Result', moreLabel: 'View More Result →', emptyText: 'No results available yet.' },
  { slug: 'syllabus', title: 'Syllabus', moreLabel: 'View More Syllabus →', emptyText: 'No syllabus updates posted yet.' },
  { slug: 'certificate-verification', title: 'Certificate Verification', moreLabel: 'View More Verification →', emptyText: 'No verification services listed.' },
  { slug: 'admission', title: 'Admission', moreLabel: 'View More Admission →', emptyText: 'No admission forms available yet.' },
  { slug: 'important', title: 'Important', moreLabel: 'View More Important →', emptyText: 'No updates listed.' }
];

export default function SarkariHomeHubView({
  settings,
  badges,
  marquees,
  categoryPosts,
  hiddenCategories
}: Props) {
  const visibleBoxes = BOX_ORDER.filter((b) => !hiddenCategories.has(b.slug));

  return (
    <div className="gez-portal-root">
      {/* GovtExamZone Authentic Crimson Header Strip */}
      <div className="gez-portal-banner">
        <div className="container">
          <div className="gez-portal-banner-inner">
            <h1 className="gez-portal-banner-title">
              {(settings.site_title || 'CBT RANK').toUpperCase()} — SARKARI EXAM PORTAL
            </h1>
            <div className="gez-portal-banner-sub">
              {settings.header_subtitle || 'LATEST GOVT JOBS, ADMIT CARD, RESULTS, ANSWER KEY & SYLLABUS'}
            </div>
          </div>
          <nav className="gez-portal-subnav" aria-label="Sarkari Categories">
            <Link href="/">CBTRank Home</Link>
            <Link href="/latest-jobs">Latest Jobs</Link>
            <Link href="/admit-card">Admit Card</Link>
            <Link href="/results">Results</Link>
            <Link href="/answer-key">Answer Key</Link>
            <Link href="/syllabus">Syllabus</Link>
            <Link href="/answerkey">Rank Calculator</Link>
          </nav>
        </div>
      </div>

      <SarkariSubheader
        settings={settings}
        badges={badges}
        marquees={marquees}
        showMarquees={true}
        showSearch={true}
        showBadges={true}
      />

      <main className="container">
        {visibleBoxes.length > 0 && (
          <section className="content-grid-3">
            {visibleBoxes.map((box) => {
              const items = categoryPosts[box.slug] || [];
              const targetHref = SARKARI_CATEGORIES[box.slug]?.route || `/category/${box.slug}`;
              return (
                <div key={box.slug} className="sarkari-box" data-category-box={box.slug}>
                  <div className="sarkari-box-header">
                    <Link href={targetHref}>{box.title}</Link>
                  </div>
                  <ul className="sarkari-box-list">
                    {items.length > 0 ? (
                      items.map((post) => (
                        <li key={post.id}>
                          <span className="list-chevron">›</span>
                          <div>
                            <Link href={`/post/${post.slug}`}>{post.title}</Link>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li>
                        <span style={{ color: '#64748b' }}>{box.emptyText}</span>
                      </li>
                    )}
                  </ul>
                  <div className="sarkari-box-footer">
                    <Link href={targetHref}>{box.moreLabel}</Link>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
