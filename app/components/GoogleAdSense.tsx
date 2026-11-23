'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE_CONFIG, getAdSenseClientId } from '../config/adsense';

export default function GoogleAdSense() {
  // Main AdSense Auto Ads script is loaded directly in <head> of layout.tsx for 100% crawler discovery
  return null;
}

/**
 * Reusable Ad Banner Component for manual Google AdSense placements
 */
interface AdBannerProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AdBanner({
  slotId,
  format = 'auto',
  responsive = true,
  className = '',
  style = { display: 'block' },
}: AdBannerProps) {
  const clientId = getAdSenseClientId();
  const effectiveSlotId = slotId || ADSENSE_CONFIG.DEFAULT_SLOT_ID;
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CONFIG.ENABLED || !clientId || !effectiveSlotId) return;
    if (pushedRef.current) return;

    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        pushedRef.current = true;
      }
    } catch (e) {
      // Graceful fallback if ad blocker is active or script loading
    }
  }, [clientId, effectiveSlotId]);

  if (!ADSENSE_CONFIG.ENABLED || !clientId || !effectiveSlotId) {
    return null;
  }

  return (
    <div className={`cbtrank-ad-wrapper my-4 text-center ${className}`.trim()}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={clientId}
        data-ad-slot={effectiveSlotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
