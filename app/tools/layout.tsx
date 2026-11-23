import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Student Tools - Image Resize & Background Change | CBT RANK',
  description: 'Free online image tools for government exam application forms (SSC, RRB, Railway, UPSC, State PSC). Resize photos to exact KB/pixels and change photo background instantly.',
  keywords: [
    'Image Resize',
    'Image Background Change',
    'Passport Photo Background White',
    'SSC Photo Resize 20KB 50KB',
    'RRB Photo Tool',
    'Compress Photo to 50KB',
    'Signature Resize 10KB 20KB',
    'CBT Rank Tools'
  ],
  alternates: {
    canonical: 'https://cbtrank.com/tools',
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
