import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Student Tools - Image Resize, Background Change & Typing Test | CBT RANK',
  description: 'Free online tools for govt exam aspirants (SSC, RRB, Railway, UPSC, State PSC). Resize photos & signatures, change background to white, and practice exam typing speed test.',
  keywords: [
    'Typing Test Online',
    'SSC Typing Test',
    'RRB NTPC Typing Test',
    'Typing Speed Test 35 WPM',
    'Image Resize',
    'Image Background Change',
    'Passport Photo Background White',
    'SSC Photo Resize 20KB 50KB',
    'Signature Resize 10KB 20KB',
    'Compress Photo to 50KB',
    'CBT Rank Tools'
  ],
  alternates: {
    canonical: 'https://cbtrank.com/tools',
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
