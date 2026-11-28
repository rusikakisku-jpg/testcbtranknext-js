'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdBanner } from './GoogleAdSense';
import { ADSENSE_CONFIG } from '../config/adsense';

export default function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  // Hide main footer on /typing (it has its own dedicated TypingFooter) and /admin
  if (pathname?.startsWith('/typing') || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Manual Google AdSense Banner above Footer */}
      <AdBanner slotId={ADSENSE_CONFIG.SLOTS.FOOTER_BANNER} />
      <footer>
        <div className="footer-inner">
          <nav aria-label="Footer Navigation">
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/answerkey">Answer Key</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/about-us">About Us</Link></li>
              <li><Link href="/contact-us">Contact Us</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions">Terms and Conditions</Link></li>
              <li><Link href="/disclaimer">Disclaimer</Link></li>
            </ul>
          </nav>
          <div className="footer-copy">
            &copy; {year} CBTRANK.COM | All Rights Reserved
          </div>
        </div>
      </footer>
    </>
  );
}
