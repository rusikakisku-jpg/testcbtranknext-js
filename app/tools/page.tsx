import Link from 'next/link';
import type { Metadata } from 'next';
import { AdBanner } from '../components/GoogleAdSense';
import { ADSENSE_CONFIG } from '../config/adsense';

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
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      </svg>
    ),
    title: 'Image Resize & KB Compress',
    badge: 'Photo & Signature',
    desc: 'Compress and resize photos (20–50 KB) & signatures (10–20 KB) to exact required dimensions for SSC, RRB & UPSC portals.',
    tags: ['20–50 KB Photo', '10–20 KB Signature', 'JPEG / JPG'],
  },
  {
    id: 'background',
    href: '/tools/image-background-change',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
      </svg>
    ),
    title: 'Image Background Change',
    badge: 'White / Sky Blue',
    desc: 'Convert photo background to pure white or light sky blue in one click to prevent application form rejection.',
    tags: ['Pure White BG', 'Sky Blue', 'Transparent PNG'],
  },
];

export default function ToolsHubPage() {
  return (
    <main className="tools-page-main">
      <style>{`
        .tools-page-main {
          min-height: calc(100vh - 140px);
          background: #f8fafc;
          padding: 32px 16px 84px;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing: border-box;
          overflow-x: hidden;
          width: 100%;
        }
        .tools-container {
          max-width: 720px;
          margin: 0 auto;
          box-sizing: border-box;
          width: 100%;
        }

        /* Header */
        .tools-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .tools-title {
          font-size: 1.85rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.025em;
          line-height: 1.25;
        }
        .tools-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0 auto;
          max-width: 520px;
          line-height: 1.5;
        }

        /* Tools List */
        .tools-list-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .tool-list-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 20px 22px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          box-sizing: border-box;
          width: 100%;
        }
        .tool-list-card:hover {
          border-color: #0044cc;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -4px rgba(0, 68, 204, 0.12);
        }
        .tool-card-left {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }
        .tool-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #eff6ff;
          color: #0044cc;
          border: 1px solid #bfdbfe;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .tool-list-card:hover .tool-icon-circle {
          background: #0044cc;
          color: #ffffff;
          border-color: #0044cc;
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
          font-size: 1.08rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .tool-badge {
          font-size: 0.68rem;
          font-weight: 750;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          letter-spacing: 0.02em;
          flex-shrink: 0;
        }
        .tool-desc {
          font-size: 0.86rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0 0 10px 0;
        }
        .tool-tags-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tool-tag {
          font-size: 0.72rem;
          font-weight: 600;
          color: #475569;
          background: #f8fafc;
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .tool-arrow-box {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #0044cc;
          font-weight: 750;
          font-size: 0.88rem;
          padding: 8px 14px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          margin-left: 14px;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .tool-list-card:hover .tool-arrow-box {
          background: #0044cc;
          color: #ffffff;
          border-color: #0044cc;
        }
        .tool-arrow-icon {
          font-size: 0.95rem;
          transition: transform 0.2s;
        }
        .tool-list-card:hover .tool-arrow-icon {
          transform: translateX(2px);
        }

        @media (max-width: 640px) {
          .tools-page-main {
            padding: 20px 12px 76px;
          }
          .tools-title {
            font-size: 1.5rem;
          }
          .tool-list-card {
            padding: 16px 14px;
            border-radius: 16px;
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
            font-size: 1rem;
          }
          .tool-arrow-box span:first-child {
            display: none;
          }
          .tool-arrow-box {
            padding: 6px 10px;
            margin-left: 8px;
          }
        }
      `}</style>

      <div className="tools-container">
        <header className="tools-header">
          <h1 className="tools-title">Aspirant Photo Tools</h1>
          <p className="tools-subtitle">
            Format photo and signature strictly according to SSC, RRB &amp; Govt exam notification rules.
          </p>
        </header>

        {/* AdSense Tools Top Banner Unit */}
        <AdBanner slotId={ADSENSE_CONFIG.SLOTS.TOOLS_BANNER || ADSENSE_CONFIG.SLOTS.HOMEPAGE_BANNER} />

        <div className="tools-list-view">
          {TOOLS_LIST.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              prefetch={true}
              className="tool-list-card"
            >
              <div className="tool-card-left">
                <div className="tool-icon-circle">
                  {tool.icon}
                </div>
                <div className="tool-info">
                  <div className="tool-title-row">
                    <h2 className="tool-title">{tool.title}</h2>
                    <span className="tool-badge">{tool.badge}</span>
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
                <span>Open Tool</span>
                <span className="tool-arrow-icon">❯</span>
              </div>
            </Link>
          ))}
        </div>

        {/* AdSense Tools Bottom Footer Unit */}
        <AdBanner slotId={ADSENSE_CONFIG.SLOTS.FOOTER_BANNER} />
      </div>
    </main>
  );
}
