import RelatedExamsSection from './RelatedExamsSection';
import { BlogPost } from '../data/blogs';
import { AdBanner } from './GoogleAdSense';
import AdsterraBanner from './AdsterraBanner';
import { ADSENSE_CONFIG } from '../config/adsense';

interface AnswerkeySidebarProps {
  currentSlug?: string;
  recentPosts?: BlogPost[];
  popularPosts?: BlogPost[];
}

export default function AnswerkeySidebar({
  currentSlug = '',
}: AnswerkeySidebarProps) {
  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* 1. Popular & Related Answer Key Calculators Widget */}
      <RelatedExamsSection
        currentSlug={currentSlug}
        isSidebar={true}
        showUniversalCta={false}
      />

      {/* 2. Join Telegram Channel Card (Directly Below Popular & Related Answer Key) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0088cc 0%, #006699 100%)',
          borderRadius: '18px',
          padding: '20px',
          color: '#ffffff',
          boxShadow: '0 10px 28px rgba(0, 136, 204, 0.28)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🚀</span>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
            Join Telegram Channel
          </h4>
        </div>
        <p
          style={{
            margin: '0 0 14px 0',
            fontSize: '0.82rem',
            color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.5,
          }}
        >
          Get instant alerts for new answer keys, normalized shift cutoffs, and question challenges.
        </p>
        <a
          href="https://t.me/cbtrank"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            padding: '11px 16px',
            background: '#ffffff',
            color: '#0088cc',
            fontWeight: 800,
            fontSize: '0.84rem',
            borderRadius: '10px',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'transform 0.15s ease',
          }}
        >
          Join @cbtrank on Telegram →
        </a>
      </div>

      {/* 3. Manual AdSense & Fallback Banner */}
      <AdBanner slotId={ADSENSE_CONFIG.SLOTS.SIDEBAR_BANNER} />
      <AdsterraBanner size="300x250" />
    </div>
  );
}
