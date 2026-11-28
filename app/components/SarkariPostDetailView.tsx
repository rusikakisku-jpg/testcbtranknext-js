import Link from 'next/link';
import {
  AgeLimitData,
  ApplicationFeeItem,
  CustomCategoryTable,
  CustomLinkItem,
  ImportantDateItem,
  SARKARI_CATEGORIES,
  SARKARI_CATEGORY_KEYS,
  SarkariAuthor,
  SarkariBadge,
  SarkariPost,
  VacancyItem,
  formatShortDate,
  safeJsonParse
} from '../lib/sarkariConstants';
import DraftPublishButton from './DraftPublishButton';
import SarkariPostViewTracker from './SarkariPostViewTracker';
import SarkariSubheader from './SarkariSubheader';

interface LegacyCategoryRow {
  post_name?: string;
  ur?: string;
  ews?: string;
  obc?: string;
  sc?: string;
  st?: string;
  total?: string;
}

interface Props {
  post: SarkariPost;
  author: SarkariAuthor;
  relatedPosts: SarkariPost[];
  recentPosts: SarkariPost[];
  popularPosts?: SarkariPost[];
  categoryCounts: Record<string, number>;
  hiddenCategories?: string[];
  badges?: SarkariBadge[];
  layoutMode: 'blog_2col' | 'classic';
  settings: Record<string, string>;
  isDraftPreview?: boolean;
}

export default function SarkariPostDetailView({
  post,
  author,
  relatedPosts,
  recentPosts,
  popularPosts = [],
  categoryCounts,
  hiddenCategories = [],
  badges = [],
  layoutMode,
  settings,
  isDraftPreview = false
}: Props) {
  const catMeta = SARKARI_CATEGORIES[post.category] || SARKARI_CATEGORIES['latest-jobs'];
  const importantDates = safeJsonParse<ImportantDateItem[]>(post.important_dates, []);
  const applicationFee = safeJsonParse<ApplicationFeeItem[]>(post.application_fee, []);
  const vacancyDetails = safeJsonParse<VacancyItem[]>(post.vacancy_details, []);
  const ageLimit = safeJsonParse<AgeLimitData>(post.age_limit, {});
  const links = safeJsonParse<CustomLinkItem[]>(post.links, []);
  const rawCategoryDetails = safeJsonParse<CustomCategoryTable | LegacyCategoryRow[]>(post.category_details, []);

  const isCustomCatTable = Boolean(
    rawCategoryDetails &&
      !Array.isArray(rawCategoryDetails) &&
      Array.isArray((rawCategoryDetails as CustomCategoryTable).columns) &&
      (rawCategoryDetails as CustomCategoryTable).columns.length > 0 &&
      Array.isArray((rawCategoryDetails as CustomCategoryTable).rows) &&
      (rawCategoryDetails as CustomCategoryTable).rows.length > 0
  );
  const isLegacyCatTable = Boolean(
    Array.isArray(rawCategoryDetails) && rawCategoryDetails.length > 0
  );

  const hasRichArticle = Boolean(post.article_content && post.article_content.trim());
  const isBlogMode = layoutMode === 'blog_2col';
  const showSarkariSections = !isBlogMode || !hasRichArticle;

  const hasCategoryAges = Boolean(ageLimit && Array.isArray(ageLimit.categories) && ageLimit.categories.length > 0);
  const hasLegacyAges = Boolean(ageLimit && (ageLimit.min_age || ageLimit.max_age || ageLimit.relaxation));
  const hasAnyLink = Boolean(
    post.apply_online_url ||
      post.notification_pdf ||
      post.admit_card_url ||
      post.result_url ||
      post.official_website_url ||
      links.length > 0
  );

  const displayDate = post.post_date || formatShortDate(post.created_at);
  const shareUrl = `https://cbtrank.com/post/${post.slug}`;
  const whatsappShareHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} - ${shareUrl}`)}`;
  const telegramShareHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`;
  const tgUrl = settings.telegram_url || 'https://t.me/cbtrank';
  const waUrl = settings.whatsapp_url || '';
  const hiddenSet = new Set(hiddenCategories);

  const renderDetailBody = () => (
    <>
      {post.thumbnail && post.thumbnail.trim() && (
        <div className="post-featured-thumb" style={{ margin: '0 0 18px 0', textAlign: 'center' }}>
          <img
            src={post.thumbnail.trim()}
            alt={post.title}
            loading="lazy"
            style={{
              maxWidth: '100%',
              height: 'auto',
              maxHeight: '440px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          />
        </div>
      )}

      {post.short_desc &&
        (isBlogMode ? (
          <div className="gez-summary-box">
            <div className="gez-summary-badge">{catMeta.name} Overview</div>
            <p style={{ margin: 0 }}>{post.short_desc}</p>
          </div>
        ) : (
          <div className="detail-short-info">{post.short_desc}</div>
        ))}

      {/* Optional Full Blog Article (Rendered ONLY in 2-Column Blog Layout) */}
      {isBlogMode && hasRichArticle && (
        <div
          className="gez-article-content"
          id="article-content"
          dangerouslySetInnerHTML={{ __html: post.article_content || '' }}
        />
      )}

      {showSarkariSections && (
        <>
          {!isBlogMode && (
            <div className="quick-jump-nav">
              <span className="quick-jump-label">Quick Jump:</span>
              <a href="#dates" className="quick-jump-pill">📅 Dates</a>
              <a href="#fees" className="quick-jump-pill">💳 Fees</a>
              {(hasCategoryAges || hasLegacyAges) && <a href="#agelimit" className="quick-jump-pill">👤 Age Limit</a>}
              {vacancyDetails.length > 0 && <a href="#vacancies" className="quick-jump-pill">📋 Vacancies</a>}
              {post.how_to_apply && <a href="#howto" className="quick-jump-pill">📝 How to Apply</a>}
              {hasAnyLink && <a href="#links" className="quick-jump-pill">🔗 Important Links</a>}
            </div>
          )}

          {/* 2-Column Info Grid: Important Dates & Application Fee */}
          <div className="detail-info-grid">
            <div className="info-card" id="dates">
              <div className="info-card-header">
                {post.category === 'syllabus'
                  ? 'Important Exam & Syllabus Dates'
                  : post.category === 'admit-card'
                    ? 'Important Dates & Exam Schedule'
                    : post.category === 'result'
                      ? 'Important Dates & Result Schedule'
                      : 'Important Dates'}
              </div>
              <div className="info-card-body">
                {importantDates.length > 0 ? (
                  <ul>
                    {importantDates.map((item, idx) => (
                      <li key={idx}>
                        <span className="info-label">{item.event} : </span>
                        <b className="important-val-date">{item.date}</b>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#666' }}>No date schedule available.</p>
                )}
              </div>
            </div>

            <div className="info-card" id="fees">
              <div className="info-card-header red">
                {post.category === 'syllabus'
                  ? 'Application / Download Fee'
                  : post.category === 'admit-card'
                    ? 'Admit Card / Download Fee'
                    : post.category === 'result'
                      ? 'Result Checking Fee'
                      : 'Application Fee'}
              </div>
              <div className="info-card-body">
                {applicationFee.length > 0 ? (
                  <ul>
                    {applicationFee.map((item, idx) => (
                      <li key={idx}>
                        <span className="info-label">{item.category} : </span>
                        <b className="important-val-fee">{item.fee}</b>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#666' }}>No fee details available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Age Limit Details */}
          {(hasCategoryAges || hasLegacyAges) && (
            <div className="info-card" style={{ marginBottom: '20px' }} id="agelimit">
              <div className="info-card-header" style={{ background: '#006400' }}>
                {post.category === 'syllabus'
                  ? 'Age Limit & Eligibility Overview '
                  : post.category === 'admit-card'
                    ? 'Age Limit & Eligibility Criteria '
                    : 'Age Limit Details '}
                {ageLimit.as_on ? `(as on ${ageLimit.as_on})` : ''}
              </div>
              <div className="info-card-body">
                <ul>
                  {hasCategoryAges && ageLimit.categories
                    ? ageLimit.categories.map((item, idx) => {
                        const parts: string[] = [];
                        if (item.min_age) parts.push(`Min: ${item.min_age}`);
                        if (item.max_age) parts.push(`Max: ${item.max_age}`);
                        return (
                          <li key={idx}>
                            <span className="info-label">{item.category} : </span>
                            <b className="important-val-text">{parts.join(' | ')}</b>
                          </li>
                        );
                      })
                    : (
                      <>
                        {ageLimit.min_age && (
                          <li>
                            <span className="info-label">Minimum Age : </span>
                            <b className="important-val-text">{ageLimit.min_age}</b>
                          </li>
                        )}
                        {ageLimit.max_age && (
                          <li>
                            <span className="info-label">Maximum Age : </span>
                            <b className="important-val-text">{ageLimit.max_age}</b>
                          </li>
                        )}
                      </>
                    )}
                  {ageLimit.relaxation && (
                    <li>
                      <span className="info-label">Age Relaxation : </span>
                      <b className="important-val-text">{ageLimit.relaxation}</b>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Vacancy Details Table */}
          <div id="vacancies">
            {vacancyDetails.length > 0 && (
              <>
                <div style={{ textAlign: 'center', margin: '15px 0 5px 0' }}>
                  <h2 style={{ color: 'var(--primary-red)', fontSize: '20px' }}>
                    {post.category === 'syllabus'
                      ? 'Selection Process & Exam Pattern Details'
                      : post.category === 'admit-card'
                        ? 'Exam Scheme & Selection Details'
                        : post.category === 'result'
                          ? 'Result & Post Overview'
                          : `Vacancy Details : ${post.total_vacancy || ''}`}
                  </h2>
                </div>
                <div className="table-responsive">
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>
                          {post.category === 'syllabus'
                            ? 'Exam Stage / Paper'
                            : post.category === 'admit-card'
                              ? 'Post / Exam Stage'
                              : 'Post Name'}
                        </th>
                        <th style={{ width: '20%' }}>
                          {post.category === 'syllabus'
                            ? 'Pattern & Duration'
                            : post.category === 'admit-card'
                              ? 'Exam Pattern'
                              : 'Total Post'}
                        </th>
                        <th style={{ width: '50%' }}>
                          {post.category === 'syllabus'
                            ? 'Syllabus & Subject Scheme'
                            : post.category === 'admit-card'
                              ? 'Eligibility & Selection Criteria'
                              : 'Eligibility Criteria'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacancyDetails.map((v, idx) => (
                        <tr key={idx}>
                          <td><b className="important-val-text">{v.post_name}</b></td>
                          <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '16.5px', color: '#0000a0' }}>
                            {v.total_post}
                          </td>
                          <td>{v.eligibility}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Category-wise Distribution Table */}
          {(isCustomCatTable || isLegacyCatTable) && (
            <>
              <div style={{ textAlign: 'center', margin: '15px 0 5px 0' }}>
                <h3 style={{ color: '#2b547e', fontSize: '18px' }}>
                  {post.category === 'syllabus'
                    ? 'Category-Wise Minimum Qualifying Marks Standards'
                    : 'Category Wise Vacancy Details'}
                </h3>
              </div>
              <div className="table-responsive">
                <table className="detail-table table-wide">
                  {isCustomCatTable ? (
                    <>
                      <thead>
                        <tr style={{ background: '#2b547e' }}>
                          {(rawCategoryDetails as CustomCategoryTable).columns.map((col, idx) => (
                            <th key={idx}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(rawCategoryDetails as CustomCategoryTable).rows.map((row, rIdx) => (
                          <tr key={rIdx} style={{ textAlign: 'center' }}>
                            {(rawCategoryDetails as CustomCategoryTable).columns.map((col, cIdx) => {
                              const cellVal = Array.isArray(row) && row[cIdx] ? row[cIdx] : '-';
                              const isTotalCol =
                                cIdx === (rawCategoryDetails as CustomCategoryTable).columns.length - 1 &&
                                /total|standard/i.test(col);
                              return (
                                <td
                                  key={cIdx}
                                  style={
                                    cIdx === 0
                                      ? { textAlign: 'left', fontWeight: 'bold' }
                                      : isTotalCol
                                        ? { fontWeight: 'bold', color: 'var(--primary-red)' }
                                        : undefined
                                  }
                                >
                                  {cellVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </>
                  ) : (
                    <>
                      <thead>
                        <tr style={{ background: '#2b547e' }}>
                          <th>Post Name</th>
                          <th>UR / Gen</th>
                          <th>EWS</th>
                          <th>OBC</th>
                          <th>SC</th>
                          <th>ST</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rawCategoryDetails as LegacyCategoryRow[]).map((c, idx) => (
                          <tr key={idx} style={{ textAlign: 'center' }}>
                            <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{c.post_name || '-'}</td>
                            <td>{c.ur || '-'}</td>
                            <td>{c.ews || '-'}</td>
                            <td>{c.obc || '-'}</td>
                            <td>{c.sc || '-'}</td>
                            <td>{c.st || '-'}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary-red)' }}>{c.total || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}
                </table>
              </div>
            </>
          )}

          {/* How to Apply */}
          <div id="howto">
            {post.how_to_apply && post.how_to_apply.trim() && (
              <div style={{ margin: '20px 0' }}>
                <h3 style={{ color: 'var(--primary-red)', fontSize: '18px', marginBottom: '8px' }}>
                  {post.category === 'syllabus'
                    ? `How to Check & Download ${post.title} :`
                    : post.category === 'admit-card'
                      ? `How to Download ${post.title} :`
                      : post.category === 'result'
                        ? `How to Check ${post.title} :`
                        : `How to Fill ${post.title} Online Form:`}
                </h3>
                <div className="how-to-apply-box">{post.how_to_apply}</div>
              </div>
            )}
          </div>

          {/* Useful Important Links Table */}
          {hasAnyLink && (
            <>
              <div style={{ textAlign: 'center', margin: '16px 0', color: '#c62828', fontWeight: 'bold', fontSize: '16px' }}>
                {post.category === 'syllabus'
                  ? 'Candidates Can Download the Complete Syllabus & Exam Pattern PDF Below'
                  : post.category === 'admit-card'
                    ? 'Candidates Can Download Admit Card / Hall Ticket from the Links Below'
                    : post.category === 'result'
                      ? 'Candidates Can Check Result / Scorecard from the Links Below'
                      : 'Interested Candidates Can Read the Full Notification Before Apply Online'}
              </div>
              <div id="links" style={{ textAlign: 'center', margin: '25px 0 10px 0' }}>
                <h2 className="useful-links-heading">Some Useful Important Links</h2>
              </div>
              <div className="table-responsive links-table-responsive">
                <table className="detail-table links-table">
                  <tbody>
                    {post.apply_online_url && (
                      <tr>
                        <td style={{ color: '#006400' }}>Apply Online</td>
                        <td>
                          <a href={post.apply_online_url} target="_blank" rel="noopener noreferrer" className="useful-link-text">
                            Click Here
                          </a>
                        </td>
                      </tr>
                    )}
                    {post.notification_pdf && (
                      <tr>
                        <td style={{ color: '#b71c1c' }}>Download Notification (PDF)</td>
                        <td>
                          <a href={post.notification_pdf} target="_blank" rel="noopener noreferrer" className="useful-link-text">
                            Click Here
                          </a>
                        </td>
                      </tr>
                    )}
                    {post.admit_card_url && (
                      <tr>
                        <td style={{ color: '#0000a0' }}>Download Admit Card</td>
                        <td>
                          <a href={post.admit_card_url} target="_blank" rel="noopener noreferrer" className="useful-link-text">
                            Click Here
                          </a>
                        </td>
                      </tr>
                    )}
                    {post.result_url && (
                      <tr>
                        <td style={{ color: '#0000a0' }}>Download Result</td>
                        <td>
                          <a href={post.result_url} target="_blank" rel="noopener noreferrer" className="useful-link-text">
                            Click Here
                          </a>
                        </td>
                      </tr>
                    )}
                    {links.map((lk, idx) => (
                      <tr key={idx}>
                        <td>{lk.label}</td>
                        <td>
                          <a href={lk.url} target="_blank" rel="noopener noreferrer" className="useful-link-text">
                            {lk.btn_text || 'Click Here'}
                          </a>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td>Check Photo &amp; Signature Resize Tool</td>
                      <td>
                        <Link href="/tools/image-resize" className="useful-link-text">Open Tool</Link>
                      </td>
                    </tr>
                    {post.official_website_url && (
                      <tr>
                        <td>Official Website</td>
                        <td>
                          <a href={post.official_website_url} target="_blank" rel="noopener noreferrer" className="useful-link-text">
                            Click Here
                          </a>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="gez-portal-root">
      {!isDraftPreview && post.id > 0 && <SarkariPostViewTracker postId={post.id} />}

      {isDraftPreview && (
        <div
          style={{
            background: '#fef3c7',
            borderBottom: '2px solid #f59e0b',
            color: '#78350f',
            padding: '12px 16px',
            fontSize: '13.5px',
            fontWeight: 600
          }}
        >
          <div
            className="container"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}
          >
            <div>
              📝 <strong>{String(post.status || 'DRAFT').toUpperCase()} PREVIEW MODE</strong> — This post is currently hidden from public visitors &amp; Google until published after review.
            </div>
            {post.id > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Link
                  href={`/admin/posts/edit/${post.id}`}
                  style={{
                    background: '#ffffff',
                    color: '#1e293b',
                    border: '1px solid #cbd5e1',
                    padding: '5px 12px',
                    borderRadius: '5px',
                    textDecoration: 'none',
                    fontSize: '12.5px',
                    fontWeight: 700
                  }}
                >
                  ✏️ Back to Edit
                </Link>
                <DraftPublishButton postId={post.id} slug={post.slug} />
              </div>
            )}
          </div>
        </div>
      )}

      {isBlogMode ? (
        <main className="gez-blog-page-main">
          <div className="gez-blog-main-container">
            <div className="gez-blog-layout">
              <div className="gez-blog-content-area">
                <article className="gez-article-wrap">
                  <div className="detail-breadcrumb" style={{ marginBottom: '12px' }}>
                    <Link href="/">Home</Link> »{' '}
                    <Link href={catMeta.route}>{catMeta.name}</Link> »{' '}
                    <span>{post.title}</span>
                  </div>

                  <header className="gez-article-header">
                    <div className="gez-article-cats">
                      <Link href={catMeta.route} className="gez-article-cat-tag">
                        {catMeta.name}
                      </Link>
                    </div>
                    <h1 className="gez-article-title">{post.title}</h1>
                    <div className="gez-article-meta">
                      <span className="gez-meta-byline">
                        by <strong>{author.name || 'Mangal'}</strong>
                      </span>
                      <span className="gez-meta-date">📅 {displayDate}</span>
                      {post.department && <span className="gez-meta-dept">🏛️ {post.department}</span>}
                    </div>
                  </header>

                  <div className="gez-article-body">{renderDetailBody()}</div>

                  <div className="gez-share-bar">
                    <span className="gez-share-label">Share:</span>
                    <a href={whatsappShareHref} target="_blank" rel="noopener noreferrer" className="gez-share-btn gez-share-wa">
                      WhatsApp
                    </a>
                    <a href={telegramShareHref} target="_blank" rel="noopener noreferrer" className="gez-share-btn gez-share-tg">
                      Telegram
                    </a>
                  </div>

                  <div className="gez-cta-box">
                    <h3>Get Instant Govt Exam &amp; Result Alerts</h3>
                    <p>Join our official Telegram &amp; WhatsApp channels for fastest job notifications, admit cards, and cutoff updates.</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {tgUrl && (
                        <a href={tgUrl} target="_blank" rel="noopener noreferrer" className="gez-btn-cta" style={{ background: '#229ED9' }}>
                          ✈️ Join Telegram Channel
                        </a>
                      )}
                      {waUrl && (
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="gez-btn-cta" style={{ background: '#16a34a' }}>
                          💬 Join WhatsApp Channel
                        </a>
                      )}
                    </div>
                  </div>

                  {relatedPosts.length > 0 && (
                    <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
                      <h3 style={{ color: '#0f172a', fontSize: '16.5px', fontWeight: 800, marginBottom: '12px' }}>
                        More {catMeta.name} Updates
                      </h3>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {relatedPosts.map((rel) => (
                          <li
                            key={rel.id}
                            style={{
                              padding: '8px 12px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <Link
                              href={`/post/${rel.slug}`}
                              style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '13.5px', textDecoration: 'none' }}
                            >
                              {rel.title}
                            </Link>
                            {rel.post_date && (
                              <span style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap' }}>{rel.post_date}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              </div>

              {/* Right Sidebar (320px) */}
              <aside className="gez-blog-sidebar">
                <div className="gez-widget">
                  <h3 className="gez-widget-title">Search</h3>
                  <form action="/search" method="GET" className="gez-sidebar-search-form">
                    <input
                      type="search"
                      name="q"
                      className="gez-sidebar-search-input"
                      placeholder="Search jobs, admit card, results..."
                      required
                    />
                    <button type="submit" className="gez-sidebar-search-btn" aria-label="Submit Search">
                      🔍
                    </button>
                  </form>
                </div>

                {recentPosts.length > 0 && (
                  <div className="gez-widget">
                    <h3 className="gez-widget-title">Recent Posts</h3>
                    <ul className="gez-sidebar-posts-list">
                      {recentPosts.map((p) => (
                        <li key={p.id} className="gez-sidebar-post-item">
                          <div className="gez-sidebar-post-badge">
                            {SARKARI_CATEGORIES[p.category]?.name || p.category}
                          </div>
                          <Link href={`/post/${p.slug}`} className="gez-sidebar-post-title">
                            {p.title}
                          </Link>
                          <span className="gez-sidebar-post-date">{p.post_date || formatShortDate(p.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {popularPosts.length > 0 && (
                  <div className="gez-widget">
                    <h3 className="gez-widget-title">Popular Posts</h3>
                    <ul className="gez-sidebar-posts-list">
                      {popularPosts.map((p) => (
                        <li key={p.id} className="gez-sidebar-post-item">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                            <span className="gez-sidebar-post-badge" style={{ marginBottom: 0 }}>
                              {SARKARI_CATEGORIES[p.category]?.name || p.category}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>👁️ {p.views || 0}</span>
                          </div>
                          <Link href={`/post/${p.slug}`} className="gez-sidebar-post-title">
                            {p.title}
                          </Link>
                          <span className="gez-sidebar-post-date">{p.post_date || formatShortDate(p.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="gez-widget">
                  <h3 className="gez-widget-title">Categories</h3>
                  <ul className="gez-sidebar-cat-list">
                    {SARKARI_CATEGORY_KEYS.filter((k) => !hiddenSet.has(k)).map((catKey) => {
                      const c = SARKARI_CATEGORIES[catKey];
                      return (
                        <li key={catKey} className="gez-sidebar-cat-item">
                          <Link href={c.route} className="gez-sidebar-cat-link">
                            {c.name}
                          </Link>
                          <span className="gez-sidebar-cat-count">{categoryCounts[catKey] || 0}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </main>
      ) : (
        <main className="container detail-page-container">
          <SarkariSubheader settings={settings} badges={badges} showBadges={false} showSearch={false} />
          <article className="post-detail-wrapper">
            <div className="detail-breadcrumb">
              <Link href="/">Home</Link> »{' '}
              <Link href={catMeta.route}>{catMeta.name}</Link> »{' '}
              <span>{post.title}</span>
            </div>

            <h1 className="detail-post-title">{post.title}</h1>
            {post.department && <div className="detail-dept-name">{post.department}</div>}

            <div className="detail-dates-strip">
              <span className="info-label">Post Date / Update : </span>
              <b className="important-val-postdate">{displayDate}</b>
            </div>

            <div className="social-bar" style={{ margin: '12px 0 14px 0' }}>
              {tgUrl && (
                <a href={tgUrl} target="_blank" rel="noopener noreferrer" className="social-btn telegram">
                  Join Telegram Channel
                </a>
              )}
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="social-btn whatsapp">
                  WhatsApp Channel
                </a>
              )}
            </div>

            {renderDetailBody()}

            {relatedPosts.length > 0 && (
              <div style={{ marginTop: '30px', borderTop: '2px solid #ddd', paddingTop: '15px' }}>
                <h3 style={{ color: 'var(--primary-red)', marginBottom: '10px' }}>More {catMeta.name} Updates:</h3>
                <ul style={{ listStyle: 'square', paddingLeft: '25px', lineHeight: 1.8 }}>
                  {relatedPosts.map((rel) => (
                    <li key={rel.id}>
                      <Link href={`/post/${rel.slug}`} style={{ fontWeight: 600 }}>
                        {rel.title}
                      </Link>
                      {rel.post_date && (
                        <span style={{ fontSize: '12px', color: '#777' }}> - {rel.post_date}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        </main>
      )}
    </div>
  );
}
