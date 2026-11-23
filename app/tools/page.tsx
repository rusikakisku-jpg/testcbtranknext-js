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
    iconGradient: 'from-blue-600 to-indigo-600',
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
    desc: 'Compress and resize photos (20–50 KB) & signatures (10–20 KB) to exact dimensions for SSC, RRB & UPSC application portals.',
    tags: ['20-50 KB', 'SSC & RRB Spec', 'Instant Compression'],
    cta: 'Open Tool'
  },
  {
    id: 'background',
    href: '/tools/image-background-change',
    iconGradient: 'from-purple-600 to-indigo-600',
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
    desc: 'Convert photo background to clean white or light sky blue in seconds to avoid form rejection by examination authorities.',
    tags: ['Plain White BG', 'Sky Blue', 'Transparent PNG'],
    cta: 'Open Tool'
  },
  {
    id: 'typing',
    href: '/tools/typing-test',
    iconGradient: 'from-emerald-600 to-teal-600',
    iconBg: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    iconColor: '#ffffff',
    iconSvg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="3"></rect>
        <line x1="6" y1="8" x2="6.01" y2="8"></line>
        <line x1="10" y1="8" x2="10.01" y2="8"></line>
        <line x1="14" y1="8" x2="14.01" y2="8"></line>
        <line x1="18" y1="8" x2="18.01" y2="8"></line>
        <line x1="6" y1="12" x2="6.01" y2="12"></line>
        <line x1="10" y1="12" x2="10.01" y2="12"></line>
        <line x1="14" y1="12" x2="14.01" y2="12"></line>
        <line x1="18" y1="12" x2="18.01" y2="12"></line>
        <line x1="8" y1="16" x2="16" y2="16"></line>
      </svg>
    ),
    title: 'Exam Typing Speed Test',
    badge: 'TCS iON / SSC Pattern',
    badgeColor: '#047857',
    badgeBg: '#ecfdf5',
    badgeBorder: '#a7f3d0',
    desc: 'Practice official examination typing passages with real-time Net WPM, Gross WPM, Accuracy % and Key Depressions countdown.',
    tags: ['35 WPM SSC Target', 'Timer Countdown', 'Instant Scorecard'],
    cta: 'Start Test'
  },
];

export default function ToolsHubPage() {
  return (
    <main className="tools-page-main">
      <style>{`
        .tools-page-main {
          min-height: calc(100vh - 140px);
          background: radial-gradient(circle at 50% 0%, #f0f7ff 0%, #f8fafc 40%, #f1f5f9 100%);
          padding: 32px 16px 84px;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .tools-container {
          max-width: 860px;
          margin: 0 auto;
        }

        /* Hero Header */
        .tools-header {
          text-align: center;
          margin-bottom: 32px;
          position: relative;
        }
        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 5px 14px;
          border-radius: 999px;
          margin-bottom: 14px;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
        }
        .tools-title {
          font-size: 2.15rem;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 10px 0;
          letter-spacing: -0.03em;
          line-height: 1.2;
        }
        .tools-title-gradient {
          background: linear-gradient(135deg, #0044cc 0%, #2563eb 50%, #0284c7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .tools-subtitle {
          font-size: 1rem;
          color: #475569;
          margin: 0 auto;
          max-width: 620px;
          line-height: 1.6;
        }

        /* Trust Badges Bar */
        .trust-bar {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin: 18px 0 28px;
        }
        .trust-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid #e2e8f0;
          padding: 4px 12px;
          border-radius: 999px;
        }

        /* Tools List View */
        .tools-list-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 36px;
        }
        .tool-list-card {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 22px 24px;
          text-decoration: none;
          color: inherit;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02);
          overflow: hidden;
        }
        .tool-list-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: transparent;
          transition: background 0.25s;
        }
        .tool-list-card:hover {
          border-color: #93c5fd;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -6px rgba(37, 99, 235, 0.12), 0 4px 12px rgba(15, 23, 42, 0.04);
        }
        .tool-list-card:hover::before {
          background: #0044cc;
        }
        .tool-card-left {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          flex: 1;
        }
        .tool-icon-circle {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 8px 18px -4px rgba(0, 0, 0, 0.15);
          transition: transform 0.25s ease;
        }
        .tool-list-card:hover .tool-icon-circle {
          transform: scale(1.06);
        }

        .tool-info {
          flex: 1;
        }
        .tool-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .tool-title {
          font-size: 1.15rem;
          font-weight: 750;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .tool-badge {
          font-size: 0.72rem;
          font-weight: 750;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 999px;
          letter-spacing: 0.03em;
        }
        .tool-desc {
          font-size: 0.88rem;
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
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        /* Action Arrow Box */
        .tool-arrow-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #eff6ff;
          color: #0044cc;
          font-weight: 750;
          font-size: 0.86rem;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid #bfdbfe;
          margin-left: 16px;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .tool-list-card:hover .tool-arrow-box {
          background: #0044cc;
          color: #ffffff;
          border-color: #0044cc;
          box-shadow: 0 4px 12px rgba(0, 68, 204, 0.25);
        }
        .tool-arrow-icon {
          font-size: 1rem;
          transition: transform 0.2s;
        }
        .tool-list-card:hover .tool-arrow-icon {
          transform: translateX(3px);
        }

        /* Guidelines Card */
        .exam-info-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border: 1.5px solid #a7f3d0;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.06);
        }
        .exam-info-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 800;
          color: #065f46;
          margin-bottom: 14px;
        }
        .spec-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .spec-box {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 14px;
        }
        .spec-box-title {
          font-size: 0.82rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #047857;
          margin-bottom: 6px;
          letter-spacing: 0.02em;
        }
        .spec-box-desc {
          font-size: 0.82rem;
          color: #1e293b;
          line-height: 1.45;
          margin: 0;
        }

        @media (max-width: 768px) {
          .spec-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .tools-page-main {
            padding: 20px 12px 76px;
          }
          .tools-title {
            font-size: 1.65rem;
          }
          .tool-list-card {
            padding: 16px 14px;
            border-radius: 16px;
          }
          .tool-card-left {
            gap: 12px;
          }
          .tool-icon-circle {
            width: 44px;
            height: 44px;
            border-radius: 12px;
          }
          .tool-title {
            font-size: 1.02rem;
          }
          .tool-arrow-box span {
            display: none;
          }
          .tool-arrow-box {
            padding: 8px 10px;
            border-radius: 10px;
            margin-left: 8px;
          }
        }
      `}</style>

      <div className="tools-container">
        {/* Header */}
        <header className="tools-header">
          <div className="hero-badge-pill">
            <span>✨</span> 100% Free Aspirant Toolkit
          </div>
          <h1 className="tools-title">
            Student &amp; Aspirant <span className="tools-title-gradient">Utilities</span>
          </h1>
          <p className="tools-subtitle">
            Official specification-compliant tools designed for SSC, RRB, Railway, UPSC &amp; State PSC candidates.
          </p>

          {/* Privacy & Fast Trust Bar */}
          <div className="trust-bar">
            <span className="trust-item">
              <span>🔒</span> 100% Client-Side Privacy
            </span>
            <span className="trust-item">
              <span>⚡</span> Instant Canvas Processing
            </span>
            <span className="trust-item">
              <span>🎯</span> Form Rejection Prevention
            </span>
          </div>
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
                <span className="tool-arrow-icon">❯</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Govt Exam Guidelines Notice */}
        <div className="exam-info-card">
          <div className="exam-info-header">
            <span>📌</span> Official Guidelines for SSC, Railway &amp; Govt Competitive Exams
          </div>
          <div className="spec-grid">
            <div className="spec-box">
              <div className="spec-box-title">📷 Photo Specs</div>
              <p className="spec-box-desc">
                Must be <strong>20 KB to 50 KB</strong> with <strong>plain white or light background</strong> (3.5 × 4.5 cm).
              </p>
            </div>
            <div className="spec-box">
              <div className="spec-box-title">✍️ Signature Specs</div>
              <p className="spec-box-desc">
                Must be <strong>10 KB to 20 KB</strong>, clearly scanned on clean white paper with black/blue ink.
              </p>
            </div>
            <div className="spec-box">
              <div className="spec-box-title">⌨️ Typing Standards</div>
              <p className="spec-box-desc">
                SSC requires <strong>35 WPM English</strong> / <strong>30 WPM Hindi</strong>. RRB NTPC requires <strong>30 WPM English</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
