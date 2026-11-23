import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Photo & Signature Tools for Govt Exams | CBT RANK',
  description: 'Free online photo resize & background changer for SSC, RRB, Railway, UPSC & State PSC. Compress photo to 20-50 KB, signature to 10-20 KB, and make background white.',
  alternates: {
    canonical: 'https://cbtrank.com/tools',
  },
};

const TOOLS_LIST = [
  {
    id: 'resize',
    href: '/tools/image-resize',
    iconBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    iconColor: '#ffffff',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      </svg>
    ),
    title: 'Image Resize & KB Compress',
    badge: 'Photo & Signature',
    badgeColor: '#1d4ed8',
    badgeBg: '#eff6ff',
    badgeBorder: '#bfdbfe',
    desc: 'Compress and resize photos (20–50 KB) & signatures (10–20 KB) to exact pixels for SSC, RRB & UPSC portals.',
    tags: ['20-50 KB Photo', '10-20 KB Signature', 'JPEG / PNG'],
    cta: 'Open Tool'
  },
  {
    id: 'background',
    href: '/tools/image-background-change',
    iconBg: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
    iconColor: '#ffffff',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
      </svg>
    ),
    title: 'Image Background Change',
    badge: 'White / Sky Blue BG',
    badgeColor: '#6d28d9',
    badgeBg: '#f5f3ff',
    badgeBorder: '#ddd6fe',
    desc: 'Convert photo background to pure white or light sky blue to prevent application rejection by exam authorities.',
    tags: ['Plain White BG', 'Sky Blue', 'Transparent PNG'],
    cta: 'Open Tool'
  },
];

export default function ToolsHubPage() {
  return (
    <main className="tools-page-main">
      <style>{`
        .tools-page-main {
          min-height: calc(100vh - 140px);
          background: #f8fafc;
          padding: 24px 16px 84px;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing: border-box;
          overflow-x: hidden;
          width: 100%;
        }
        .tools-container {
          max-width: 760px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        /* Hero Header */
        .tools-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 0.76rem;
          font-weight: 750;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 10px;
        }
        .tools-title {
          font-size: 1.85rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
          line-height: 1.25;
        }
        .tools-title-accent {
          color: #0044cc;
        }
        .tools-subtitle {
          font-size: 0.92rem;
          color: #64748b;
          margin: 0 auto;
          max-width: 560px;
          line-height: 1.5;
        }

        /* Tools List View */
        .tools-list-view {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 24px;
        }
        .tool-list-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 18px 20px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          box-sizing: border-box;
          width: 100%;
        }
        .tool-list-card:hover {
          border-color: #93c5fd;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.12);
        }
        .tool-card-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }
        .tool-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 6px 14px -3px rgba(0, 0, 0, 0.12);
        }
        .tool-info {
          flex: 1;
          min-width: 0;
        }
        .tool-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }
        .tool-title {
          font-size: 1.05rem;
          font-weight: 750;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tool-badge {
          font-size: 0.68rem;
          font-weight: 750;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 999px;
          letter-spacing: 0.02em;
          flex-shrink: 0;
        }
        .tool-desc {
          font-size: 0.84rem;
          color: #64748b;
          line-height: 1.45;
          margin: 0 0 8px 0;
        }
        .tool-tags-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tool-tag {
          font-size: 0.7rem;
          font-weight: 600;
          color: #475569;
          background: #f1f5f9;
          padding: 2px 7px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          white-space: nowrap;
        }
        .tool-arrow-box {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          color: #0044cc;
          font-weight: 750;
          font-size: 0.84rem;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #bfdbfe;
          margin-left: 12px;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .tool-list-card:hover .tool-arrow-box {
          background: #0044cc;
          color: #ffffff;
          border-color: #0044cc;
        }

        /* Dedicated Typing Banner */
        .typing-nav-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
          border: 1.5px solid #a7f3d0;
          border-radius: 16px;
          padding: 16px 20px;
          margin-bottom: 24px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.06);
          transition: all 0.2s ease;
        }
        .typing-nav-banner:hover {
          border-color: #34d399;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.12);
        }
        .typing-banner-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .typing-banner-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .typing-banner-title {
          font-size: 0.98rem;
          font-weight: 800;
          color: #065f46;
          margin-bottom: 2px;
        }
        .typing-banner-desc {
          font-size: 0.82rem;
          color: #047857;
        }
        .typing-banner-cta {
          font-size: 0.84rem;
          font-weight: 750;
          color: #059669;
          background: #ffffff;
          border: 1px solid #a7f3d0;
          padding: 6px 14px;
          border-radius: 8px;
          white-space: nowrap;
          margin-left: 10px;
          flex-shrink: 0;
        }

        /* Guidelines Card */
        .exam-info-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          box-sizing: border-box;
        }
        .exam-info-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.92rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
        }
        .spec-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .spec-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.84rem;
          color: #334155;
          line-height: 1.5;
        }
        .spec-item strong {
          color: #0f172a;
        }

        @media (max-width: 640px) {
          .tools-page-main {
            padding: 16px 12px 76px;
          }
          .tools-title {
            font-size: 1.45rem;
          }
          .tool-list-card {
            padding: 14px 12px;
            border-radius: 14px;
          }
          .tool-card-left {
            gap: 12px;
          }
          .tool-icon-circle {
            width: 42px;
            height: 42px;
            border-radius: 12px;
          }
          .tool-title {
            font-size: 0.98rem;
            white-space: normal;
          }
          .tool-arrow-box span {
            display: none;
          }
          .tool-arrow-box {
            padding: 7px 9px;
            border-radius: 8px;
            margin-left: 8px;
          }
          .typing-nav-banner {
            padding: 14px 12px;
          }
          .typing-banner-icon {
            width: 38px;
            height: 38px;
          }
          .typing-banner-title {
            font-size: 0.92rem;
          }
          .typing-banner-cta {
            padding: 5px 10px;
            font-size: 0.78rem;
          }
        }
      `}</style>

      <div className="tools-container">
        {/* Header */}
        <header className="tools-header">
          <div className="hero-pill">
            <span>✨</span> 100% Free &amp; Private Tools
          </div>
          <h1 className="tools-title">
            Photo &amp; Signature <span className="tools-title-accent">Tools</span>
          </h1>
          <p className="tools-subtitle">
            Format your photograph and signature strictly as per official SSC, RRB, Railway &amp; UPSC notification rules.
          </p>
        </header>

        {/* Tools List View */}
        <div className="tools-list-view">
          {TOOLS_LIST.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              prefetch={true}
              className="tool-list-card"
            >
              <div className="tool-card-left">
                <div
                  className="tool-icon-circle"
                  style={{ background: tool.iconBg, color: tool.iconColor }}
                >
                  {tool.iconSvg}
                </div>
                <div className="tool-info">
                  <div className="tool-title-row">
                    <h2 className="tool-title">{tool.title}</h2>
                    <span
                      className="tool-badge"
                      style={{
                        color: tool.badgeColor,
                        background: tool.badgeBg,
                        border: `1px solid ${tool.badgeBorder}`,
                      }}
                    >
                      {tool.badge}
                    </span>
                  </div>
                  <p className="tool-desc">{tool.desc}</p>
                  <div className="tool-tags-row">
                    {tool.tags.map((tag, idx) => (
                      <span key={idx} className="tool-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="tool-arrow-box">
                <span>{tool.cta}</span>
                <span>❯</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Separate Dedicated Typing Banner */}
        <Link href="/typing" prefetch={true} className="typing-nav-banner">
          <div className="typing-banner-left">
            <div className="typing-banner-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="6" y1="8" x2="6.01" y2="8" />
                <line x1="10" y1="8" x2="10.01" y2="8" />
                <line x1="14" y1="8" x2="14.01" y2="8" />
                <line x1="18" y1="8" x2="18.01" y2="8" />
                <line x1="7" y1="16" x2="17" y2="16" />
              </svg>
            </div>
            <div>
              <div className="typing-banner-title">Practice Exam Typing Test</div>
              <div className="typing-banner-desc">Dedicated screen with timer &amp; real-time WPM</div>
            </div>
          </div>
          <div className="typing-banner-cta">
            Open Typing ❯
          </div>
        </Link>

        {/* Guidelines Card */}
        <div className="exam-info-card">
          <div className="exam-info-header">
            <span>📌</span> Official Specifications (SSC / RRB / UPSC)
          </div>
          <ul className="spec-list">
            <li className="spec-item">
              <span>📷</span>
              <div>
                <strong>Photograph:</strong> 20 KB to 50 KB file size, 3.5 × 4.5 cm (approx 200 × 230 px), plain white or very light background.
              </div>
            </li>
            <li className="spec-item">
              <span>✍️</span>
              <div>
                <strong>Signature:</strong> 10 KB to 20 KB file size, 140 × 60 px, clearly signed with black or blue ink on white paper.
              </div>
            </li>
            <li className="spec-item">
              <span>🔒</span>
              <div>
                <strong>100% Privacy:</strong> All image processing happens locally inside your browser. No files are uploaded to any server.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
