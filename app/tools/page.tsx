import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Student Tools - Photo Resize, Background Change & Typing Test | CBT RANK',
  description: 'Free online tools for govt exam aspirants (SSC, RRB, Railway, UPSC, State PSC). Resize photos & signatures to 20-50 KB, change photo background to white, and practice exam typing speed test.',
  alternates: {
    canonical: 'https://cbtrank.com/tools',
  },
};

const TOOLS_LIST = [
  {
    id: 'resize',
    href: '/tools/image-resize',
    icon: '📐',
    iconClass: 'tool-icon-resize',
    title: 'Image Resize & KB Compress',
    badge: 'Photo & Sign',
    desc: 'Resize photo (20-50 KB) and signature (10-20 KB) to exact pixels for SSC, RRB & UPSC.',
    cta: 'Open Tool'
  },
  {
    id: 'background',
    href: '/tools/image-background-change',
    icon: '🎨',
    iconClass: 'tool-icon-bg',
    title: 'Image Background Change',
    badge: 'White / Blue BG',
    desc: 'Convert photo background to pure white or light sky blue per official exam notification rules.',
    cta: 'Open Tool'
  },
  {
    id: 'typing',
    href: '/tools/typing-test',
    icon: '⌨️',
    iconClass: 'tool-icon-typing',
    title: 'Exam Typing Speed Test',
    badge: 'SSC & Railway',
    desc: 'Practice typing test with real-time Gross WPM, Net WPM, Accuracy % and Key Depressions countdown.',
    cta: 'Start Test'
  },
];

export default function ToolsHubPage() {
  return (
    <main className="tools-page-main">
      <style>{`
        .tools-page-main {
          min-height: calc(100vh - 140px);
          background: #f8fafc;
          padding: 24px 16px 80px;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .tools-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .tools-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .tools-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }
        .tools-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* Tools List View */
        .tools-list-view {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 32px;
        }
        .tool-list-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px 20px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }
        .tool-list-card:hover {
          border-color: #0066ff;
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 102, 255, 0.12);
        }
        .tool-card-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }
        .tool-icon-circle {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        .tool-icon-resize { background: #dbeafe; color: #1d4ed8; }
        .tool-icon-bg { background: #fae8ff; color: #a21caf; }
        .tool-icon-typing { background: #dcfce7; color: #15803d; }

        .tool-info {
          flex: 1;
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
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .tool-badge {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #0066ff;
          border: 1px solid #bfdbfe;
          letter-spacing: 0.03em;
        }
        .tool-desc {
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.45;
          margin: 0;
        }
        .tool-arrow-box {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #0066ff;
          font-weight: 700;
          font-size: 0.88rem;
          margin-left: 14px;
          flex-shrink: 0;
        }
        .tool-arrow-icon {
          font-size: 1.15rem;
          transition: transform 0.2s;
        }
        .tool-list-card:hover .tool-arrow-icon {
          transform: translateX(3px);
        }

        .exam-info-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 14px;
          padding: 20px;
          font-size: 0.88rem;
          color: #166534;
          line-height: 1.6;
        }
        .exam-info-card strong { color: #14532d; }

        @media (max-width: 640px) {
          .tool-list-card {
            padding: 14px 16px;
          }
          .tool-icon-circle {
            width: 44px;
            height: 44px;
            font-size: 1.35rem;
          }
          .tool-arrow-box span {
            display: none;
          }
        }
      `}</style>

      <div className="tools-container">
        {/* Header */}
        <header className="tools-header">
          <h1 className="tools-title">Aspirant &amp; Student Tools</h1>
          <p className="tools-subtitle">
            Free online utilities for SSC, Railway, UPSC &amp; Govt exam forms. Select a tool below to open:
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
                <div className={`tool-icon-circle ${tool.iconClass}`}>
                  {tool.icon}
                </div>
                <div className="tool-info">
                  <div className="tool-title-row">
                    <h2 className="tool-title">{tool.title}</h2>
                    <span className="tool-badge">{tool.badge}</span>
                  </div>
                  <p className="tool-desc">{tool.desc}</p>
                </div>
              </div>

              <div className="tool-arrow-box">
                <span>{tool.cta}</span>
                <span className="tool-arrow-icon">❯</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Govt Exam Guidelines Notice */}
        <div className="exam-info-card">
          <strong>📌 Official Guidelines for SSC, Railway &amp; Govt Competitive Exams:</strong>
          <ul style={{ paddingLeft: 18, marginTop: 8, marginBottom: 0 }}>
            <li><strong>Photo Specifications:</strong> Must have plain white or light background, 20 KB to 50 KB file size, 3.5 × 4.5 cm dimensions.</li>
            <li><strong>Signature Specifications:</strong> 10 KB to 20 KB, clear on white paper with black/blue ink.</li>
            <li><strong>Typing Speed Criteria:</strong> SSC CHSL/CGL requires <strong>35 WPM</strong> in English (approx 1750 key depressions in 10 mins) or <strong>30 WPM</strong> in Hindi. RRB NTPC requires <strong>30 WPM</strong> in English or <strong>25 WPM</strong> in Hindi.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
