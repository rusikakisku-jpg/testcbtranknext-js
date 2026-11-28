import Link from 'next/link';
import { AdBanner } from './GoogleAdSense';
import { ADSENSE_CONFIG } from '../config/adsense';
import SarkariPostViewTracker from './SarkariPostViewTracker';
import {
  AgeLimitData,
  ApplicationFeeItem,
  CustomCategoryTable,
  CustomLinkItem,
  formatShortDate,
  ImportantDateItem,
  safeJsonParse,
  SARKARI_CATEGORIES,
  SARKARI_CATEGORY_KEYS,
  SarkariAuthor,
  SarkariPost,
  VacancyItem
} from '../lib/sarkariConstants';

interface SarkariPostDetailViewProps {
  post: SarkariPost;
  author: SarkariAuthor;
  relatedPosts: SarkariPost[];
  recentPosts: SarkariPost[];
  categoryCounts: Record<string, number>;
  layoutMode: 'blog_2col' | 'classic';
  isDraftPreview?: boolean;
  telegramUrl?: string;
}

export default function SarkariPostDetailView({
  post,
  author,
  relatedPosts,
  recentPosts,
  categoryCounts,
  layoutMode,
  isDraftPreview = false,
  telegramUrl = 'https://t.me/cbtrank'
}: SarkariPostDetailViewProps) {
  const catMeta = SARKARI_CATEGORIES[post.category] || SARKARI_CATEGORIES['latest-jobs'];
  const isBlogMode = layoutMode === 'blog_2col';
  const hasRichArticle = Boolean(post.article_content && post.article_content.trim());
  const showSarkariSections = !isBlogMode || !hasRichArticle;

  const importantDates = safeJsonParse<ImportantDateItem[]>(post.important_dates, []);
  const applicationFee = safeJsonParse<ApplicationFeeItem[]>(post.application_fee, []);
  const ageLimit = safeJsonParse<AgeLimitData>(post.age_limit, {});
  const vacancyDetails = safeJsonParse<VacancyItem[]>(post.vacancy_details, []);
  const categoryDetailsRaw = safeJsonParse<CustomCategoryTable | Array<Record<string, string>>>(
    post.category_details,
    []
  );
  const customLinks = safeJsonParse<CustomLinkItem[]>(post.links, []);

  const isCustomCatTable =
    Boolean(
      categoryDetailsRaw &&
        !Array.isArray(categoryDetailsRaw) &&
        Array.isArray((categoryDetailsRaw as CustomCategoryTable).columns) &&
        (categoryDetailsRaw as CustomCategoryTable).columns.length > 0 &&
        Array.isArray((categoryDetailsRaw as CustomCategoryTable).rows) &&
        (categoryDetailsRaw as CustomCategoryTable).rows.length > 0
    );

  const hasCategoryAges = Boolean(
    ageLimit && Array.isArray(ageLimit.categories) && ageLimit.categories.length > 0
  );
  const hasLegacyAges = Boolean(
    ageLimit && (ageLimit.min_age || ageLimit.max_age || ageLimit.relaxation)
  );

  const shareUrl = `https://cbtrank.com/post/${post.slug}`;

  const jobSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.short_desc || post.title,
    image: post.thumbnail || 'https://upload.cbtrank.com/logo.png',
    datePublished: post.created_at || new Date().toISOString(),
    dateModified: post.updated_at || post.created_at || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: author.name || 'Mangal'
    },
    publisher: {
      '@type': 'Organization',
      name: 'CBT RANK',
      logo: { '@type': 'ImageObject', url: 'https://upload.cbtrank.com/logo.png' }
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cbtrank.com' },
      { '@type': 'ListItem', position: 2, name: catMeta.name, item: `https://cbtrank.com${catMeta.route}` },
      { '@type': 'ListItem', position: 3, name: post.title, item: shareUrl }
    ]
  };

  return (
    <main style={{ minHeight: '80vh', paddingBottom: '42px' }}>
      {!isDraftPreview && post.id > 0 && <SarkariPostViewTracker postId={post.id} />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {isDraftPreview && (
        <div className="sarkari-draft-banner">
          <div className="sarkari-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>
              📝 <strong>{String(post.status || 'DRAFT').toUpperCase()} PREVIEW MODE</strong> — Hidden from Google &amp; public visitors until published after review.
            </span>
            {post.id > 0 && (
              <Link href={`/admin/posts/edit/${post.id}`} className="sarkari-draft-edit-btn">
                ✏️ Edit in Admin
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="sarkari-container" style={{ paddingTop: '14px' }}>
        <div className="sarkari-breadcrumb">
          <Link href="/">Home</Link> <span>»</span>{' '}
          <Link href={catMeta.route}>{catMeta.name}</Link> <span>»</span>{' '}
          <span>{post.title}</span>
        </div>

        <div className={isBlogMode ? 'sarkari-layout' : 'sarkari-classic-wrap'}>
          <article className="sarkari-article-card">
            <header className="sarkari-detail-header">
              <div className="sarkari-hero-top">
                <Link href={catMeta.route} className="sarkari-cat-pill" style={{ background: catMeta.accentColor }}>
                  {catMeta.name}
                </Link>
                {post.total_vacancy && (
                  <span className="sarkari-vac-badge">{post.total_vacancy}</span>
                )}
              </div>

              <h1 className="sarkari-detail-h1">{post.title}</h1>

              <div className="sarkari-detail-meta">
                <span>by <strong>{author.name || 'Mangal'}</strong></span>
                <span>•</span>
                <span>📅 {post.post_date || formatShortDate(post.created_at)}</span>
                {post.department && (
                  <>
                    <span>•</span>
                    <span>🏛️ {post.department}</span>
                  </>
                )}
              </div>
            </header>

            {post.thumbnail && post.thumbnail.trim() && (
              <div style={{ margin: '14px 0 18px', textAlign: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.thumbnail.trim()}
                  alt={post.title}
                  style={{ maxWidth: '100%', maxHeight: '420px', width: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>
            )}

            {post.short_desc && (
              <div className="sarkari-summary-box">
                <div className="sarkari-summary-badge">{catMeta.name} Overview</div>
                <p style={{ margin: 0 }}>{post.short_desc}</p>
              </div>
            )}

            {/* Full Blog Article (Shown ONLY in 2-Column Blog Layout) */}
            {isBlogMode && hasRichArticle && (
              <div
                className="gez-article-content"
                dangerouslySetInnerHTML={{ __html: post.article_content as string }}
              />
            )}

            {/* Structured Sarkari Sections (Classic Mode OR fallback when no article_content) */}
            {showSarkariSections && (
              <>
                <div className="sarkari-two-card-grid">
                  <div className="sarkari-info-box">
                    <div className="sarkari-box-head blue">Important Dates</div>
                    <div className="sarkari-box-body">
                      {importantDates.length > 0 ? (
                        <ul>
                          {importantDates.map((item, idx) => (
                            <li key={idx}>
                              <span>{item.event}: </span>
                              <strong>{item.date}</strong>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted">No date schedule added.</p>
                      )}
                    </div>
                  </div>

                  <div className="sarkari-info-box">
                    <div className="sarkari-box-head red">Application Fee</div>
                    <div className="sarkari-box-body">
                      {applicationFee.length > 0 ? (
                        <ul>
                          {applicationFee.map((item, idx) => (
                            <li key={idx}>
                              <span>{item.category}: </span>
                              <strong>{item.fee}</strong>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted">No fee details added.</p>
                      )}
                    </div>
                  </div>
                </div>

                {(hasCategoryAges || hasLegacyAges) && (
                  <div className="sarkari-info-box" style={{ marginBottom: '20px' }}>
                    <div className="sarkari-box-head green">
                      Age Limit Details {ageLimit.as_on ? `(as on ${ageLimit.as_on})` : ''}
                    </div>
                    <div className="sarkari-box-body">
                      <ul>
                        {hasCategoryAges
                          ? ageLimit.categories!.map((row, idx) => (
                              <li key={idx}>
                                <span>{row.category}: </span>
                                <strong>
                                  {[row.min_age ? `Min: ${row.min_age}` : '', row.max_age ? `Max: ${row.max_age}` : '']
                                    .filter(Boolean)
                                    .join(' | ')}
                                </strong>
                              </li>
                            ))
                          : (
                            <>
                              {ageLimit.min_age && <li><span>Minimum Age: </span><strong>{ageLimit.min_age}</strong></li>}
                              {ageLimit.max_age && <li><span>Maximum Age: </span><strong>{ageLimit.max_age}</strong></li>}
                            </>
                          )}
                        {ageLimit.relaxation && (
                          <li><span>Age Relaxation: </span><strong>{ageLimit.relaxation}</strong></li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {vacancyDetails.length > 0 && (
                  <section style={{ marginBottom: '22px' }}>
                    <h2 className="sarkari-sub-heading">
                      Vacancy Details {post.total_vacancy ? `: ${post.total_vacancy}` : ''}
                    </h2>
                    <div className="table-responsive">
                      <table className="sarkari-table">
                        <thead>
                          <tr>
                            <th>Post Name / Stage</th>
                            <th>Total / Pattern</th>
                            <th>Eligibility / Criteria</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vacancyDetails.map((v, idx) => (
                            <tr key={idx}>
                              <td><strong>{v.post_name}</strong></td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: '#0044cc' }}>{v.total_post}</td>
                              <td>{v.eligibility}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {isCustomCatTable && (
                  <section style={{ marginBottom: '22px' }}>
                    <h2 className="sarkari-sub-heading">Category-Wise Distribution</h2>
                    <div className="table-responsive">
                      <table className="sarkari-table">
                        <thead>
                          <tr>
                            {(categoryDetailsRaw as CustomCategoryTable).columns.map((col, idx) => (
                              <th key={idx}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(categoryDetailsRaw as CustomCategoryTable).rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {(categoryDetailsRaw as CustomCategoryTable).columns.map((_, cIdx) => (
                                <td key={cIdx} style={cIdx === 0 ? { fontWeight: 700 } : { textAlign: 'center' }}>
                                  {row[cIdx] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {post.how_to_apply && post.how_to_apply.trim() && (
                  <section style={{ marginBottom: '22px' }}>
                    <h2 className="sarkari-sub-heading">How to Apply / Important Instructions</h2>
                    <div className="sarkari-howto-box">{post.how_to_apply}</div>
                  </section>
                )}

                <section style={{ marginBottom: '20px' }}>
                  <h2 className="sarkari-sub-heading">Some Useful Important Links</h2>
                  <div className="table-responsive">
                    <table className="sarkari-table">
                      <tbody>
                        {post.apply_online_url && (
                          <tr>
                            <td><strong style={{ color: '#15803d' }}>Apply Online</strong></td>
                            <td style={{ textAlign: 'center' }}>
                              <a href={post.apply_online_url} target="_blank" rel="noopener noreferrer" className="sarkari-table-link">
                                Click Here
                              </a>
                            </td>
                          </tr>
                        )}
                        {post.notification_pdf && (
                          <tr>
                            <td><strong style={{ color: '#b91c1c' }}>Download Notification (PDF)</strong></td>
                            <td style={{ textAlign: 'center' }}>
                              <a href={post.notification_pdf} target="_blank" rel="noopener noreferrer" className="sarkari-table-link">
                                Click Here
                              </a>
                            </td>
                          </tr>
                        )}
                        {post.admit_card_url && (
                          <tr>
                            <td><strong style={{ color: '#1d4ed8' }}>Download Admit Card</strong></td>
                            <td style={{ textAlign: 'center' }}>
                              <a href={post.admit_card_url} target="_blank" rel="noopener noreferrer" className="sarkari-table-link">
                                Click Here
                              </a>
                            </td>
                          </tr>
                        )}
                        {post.result_url && (
                          <tr>
                            <td><strong style={{ color: '#1d4ed8' }}>Download Result</strong></td>
                            <td style={{ textAlign: 'center' }}>
                              <a href={post.result_url} target="_blank" rel="noopener noreferrer" className="sarkari-table-link">
                                Click Here
                              </a>
                            </td>
                          </tr>
                        )}
                        {customLinks.map((lnk, idx) => (
                          <tr key={idx}>
                            <td><strong>{lnk.label}</strong></td>
                            <td style={{ textAlign: 'center' }}>
                              <a href={lnk.url} target="_blank" rel="noopener noreferrer" className="sarkari-table-link">
                                {lnk.btn_text || 'Click Here'}
                              </a>
                            </td>
                          </tr>
                        ))}
                        {post.official_website_url && (
                          <tr>
                            <td><strong>Official Website</strong></td>
                            <td style={{ textAlign: 'center' }}>
                              <a href={post.official_website_url} target="_blank" rel="noopener noreferrer" className="sarkari-table-link">
                                Click Here
                              </a>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            <div className="share-bar">
              <span className="share-label">Share:</span>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} - ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-wa"
              >
                WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-tg"
              >
                Telegram
              </a>
            </div>

            <div className="sarkari-cta-strip">
              <div>
                <strong>Check Marks, Shift Rank &amp; Normalization on CBT RANK</strong>
                <p>Join our Telegram channel for fast exam updates or open the Answer Key Calculator.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link href="/answerkey" className="btn-cta" style={{ padding: '10px 16px', fontSize: '0.86rem' }}>
                  Open Calculator →
                </Link>
                <a
                  href={telegramUrl || 'https://t.me/cbtrank'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn share-tg"
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  Join Telegram
                </a>
              </div>
            </div>

            <AdBanner slotId={ADSENSE_CONFIG.SLOTS.ARTICLE_BANNER} />

            {relatedPosts.length > 0 && (
              <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  More {catMeta.name} Updates
                </h3>
                <ul className="sarkari-related-list">
                  {relatedPosts.map((rel) => (
                    <li key={rel.id}>
                      <Link href={`/post/${rel.slug}`}>{rel.title}</Link>
                      {rel.post_date && <span>{rel.post_date}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {isBlogMode && (
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
                  🎯 Answer Key Calculator
                </Link>
              </div>

              <div className="widget sarkari-sidebar-card">
                <h3 className="widget-title">Exam Categories</h3>
                <ul className="sarkari-cat-sidebar-list">
                  {SARKARI_CATEGORY_KEYS.map((key) => {
                    const m = SARKARI_CATEGORIES[key];
                    return (
                      <li key={key}>
                        <Link href={m.route} className={key === post.category ? 'active' : ''}>
                          <span>{m.name}</span>
                          <span className="sarkari-cat-count">{categoryCounts[key] || 0}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {recentPosts.length > 0 && (
                <div className="widget sarkari-sidebar-card">
                  <h3 className="widget-title">Recent Posts</h3>
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
          )}
        </div>
      </div>
    </main>
  );
}
