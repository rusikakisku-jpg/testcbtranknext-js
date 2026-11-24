import Link from 'next/link';

export default function TypingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="typing-footer-root">
      <div className="typing-footer-container">
        {/* Top Grid */}
        <div className="typing-footer-grid">
          {/* Brand Info */}
          <div className="typing-footer-col brand-col">
            <div className="typing-footer-brand-title">
              <span className="typing-footer-logo-box">⌨️</span>
              <span>CBT TYPING</span>
            </div>
            <p className="typing-footer-brand-desc">
              India&apos;s dedicated Computer-Based Typing Test Simulator. Practice on exact TCS iON exam passages with real-time depression counting, backspace restrictions, and instant qualification scorecards for SSC, Railways &amp; High Court.
            </p>
            <div className="typing-footer-badge-row">
              <span className="typing-footer-pill">⚡ TCS iON Pattern</span>
              <span className="typing-footer-pill">🎯 35 WPM Standard</span>
              <span className="typing-footer-pill">🔒 100% Free</span>
            </div>
          </div>

          {/* Column 2: Supported Exams */}
          <div className="typing-footer-col">
            <h3 className="typing-footer-heading">CBT Typing Exams</h3>
            <ul className="typing-footer-links">
              <li><span>SSC CGL Tier 2 DEST (2000 Keys)</span></li>
              <li><span>SSC CHSL Tier 2 Typing (35 WPM)</span></li>
              <li><span>RRB NTPC Typing Skill Test (30 WPM)</span></li>
              <li><span>Allahabad &amp; Delhi High Court Typist</span></li>
              <li><span>CISF / CRPF Head Constable (Ministerial)</span></li>
              <li><span>DSSSB Junior Assistant &amp; Steno</span></li>
            </ul>
          </div>

          {/* Column 3: Rules & Calculations */}
          <div className="typing-footer-col">
            <h3 className="typing-footer-heading">Evaluation Guidelines</h3>
            <ul className="typing-footer-links">
              <li><span>5-Key Depressions = 1 Word Standard</span></li>
              <li><span>Net WPM = Gross WPM - Error Penalty</span></li>
              <li><span>Full Mistakes: Omission &amp; Word Substitution</span></li>
              <li><span>Half Mistakes: Spacing &amp; Punctuation</span></li>
              <li><span>SSC Cutoff: 5% UR / 7% Reserved</span></li>
              <li><span>RRB Cutoff: 5% Mistakes Relaxation</span></li>
            </ul>
          </div>

          {/* Column 4: Quick Links */}
          <div className="typing-footer-col">
            <h3 className="typing-footer-heading">Quick Links</h3>
            <ul className="typing-footer-links">
              <li><Link href="/">CBT Rank Main Portal</Link></li>
              <li><Link href="/answerkey">Answer Key Scorecard Calculator</Link></li>
              <li><Link href="/tools">Govt Exam Photo &amp; Sign Tools</Link></li>
              <li><Link href="/tools/image-resize">Photo 20-50 KB Resizer</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/disclaimer">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="typing-footer-bottom">
          <div>
            &copy; {currentYear} <strong>CBT TYPING</strong> | Powered by <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>CBTRANK.COM</Link>
          </div>
          <div className="typing-footer-disclaimer-text">
            Designed strictly for educational and typing practice purposes. All trademarks belong to respective exam authorities.
          </div>
        </div>
      </div>
    </footer>
  );
}
