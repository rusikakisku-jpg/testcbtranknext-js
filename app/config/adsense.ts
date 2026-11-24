/**
 * Google AdSense Configuration
 * 
 * ==============================================================================
 * KAISE ACTIVATE KAREIN (FUTURE SETUP):
 * ==============================================================================
 * Jab bhi aapko Google AdSense verify karna ho ya ads lagana ho, aapko sirf:
 * 
 * OPTION 1 (Sabse Aasan):
 * Neeche 'PUBLISHER_ID' me apni AdSense ID paste karein:
 * PUBLISHER_ID: 'ca-pub-1234567890123456',
 * 
 * OPTION 2 (Environment Variable):
 * Cloudflare Pages / .env.local me variable set karein:
 * NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-1234567890123456
 * 
 * ==============================================================================
 * SIRF ID PASTE KARNE PAR KYA-KYA AUTOMATIC HO JAYEGA:
 * 1. AdSense Verification Script (<script async src="...adsbygoogle.js">) auto load hogi.
 * 2. <meta name="google-adsense-account" content="..."> verification tag auto lag jayega.
 * 3. https://cbtrank.com/ads.txt par 'google.com, pub-XXXX, DIRECT, f08c47fec0942fa0' auto live ho jayega.
 * ==============================================================================
 */

export const ADSENSE_CONFIG = {
  // Yahan apni AdSense ID paste karein (e.g. 'ca-pub-1234567890123456' ya 'pub-1234567890123456')
  PUBLISHER_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-3497555781233424',

  // Ads/Script ko ON/OFF karne ke liye toggle (true = Active, false = Disabled)
  ENABLED: true,

  // Default / Fallback slot ID for manual ads
  DEFAULT_SLOT_ID: process.env.NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT_ID || '3497555781',

  // Specific Slot IDs for granular ad placement
  SLOTS: {
    HOMEPAGE_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOMEPAGE || '3497555781',
    CALCULATOR_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CALCULATOR || '3497555781',
    FOOTER_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER || '3497555781',
    SIDEBAR_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || '3497555781',
    ARTICLE_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE || '3497555781',
    HISTORY_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HISTORY || '3497555781',
    HISTORY_SIDEBAR_LEFT: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HISTORY_SIDEBAR_LEFT || '3497555781',
    HISTORY_SIDEBAR_RIGHT: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HISTORY_SIDEBAR_RIGHT || '3497555781',
    TOOLS_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOLS || '3497555781',
  },
};

/**
 * Normalizes any format of publisher ID to 'ca-pub-XXXXXXXXXXXXXXXX'
 */
export function getAdSenseClientId(rawId: string = ADSENSE_CONFIG.PUBLISHER_ID): string {
  if (!rawId) return '';
  const clean = rawId.trim();
  if (clean.startsWith('ca-pub-')) return clean;
  if (clean.startsWith('pub-')) return `ca-${clean}`;
  if (/^\d+$/.test(clean)) return `ca-pub-${clean}`;
  return clean;
}

/**
 * Normalizes publisher ID for ads.txt format ('pub-XXXXXXXXXXXXXXXX')
 */
export function getAdsTxtPubId(rawId: string = ADSENSE_CONFIG.PUBLISHER_ID): string {
  if (!rawId) return '';
  const clean = rawId.trim();
  if (clean.startsWith('ca-pub-')) return clean.replace(/^ca-/, '');
  if (clean.startsWith('pub-')) return clean;
  if (/^\d+$/.test(clean)) return `pub-${clean}`;
  return clean;
}
