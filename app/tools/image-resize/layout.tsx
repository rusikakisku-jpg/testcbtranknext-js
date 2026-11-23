import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SSC & Railway Photo & Signature Resize to 20-50 KB & 10-20 KB Online | CBT RANK',
  description: 'Free online photo and signature resizer for SSC, RRB, UPSC, and State PSC applications. Compress photo to 20-50 KB (3.5x4.5 cm) and signature to 10-20 KB in seconds with 100% client-side privacy.',
  keywords: [
    'Photo Resize for SSC',
    'Signature Resize 10KB to 20KB',
    'SSC Photo Resize 20KB to 50KB',
    'RRB Photo Resizer Online',
    'Compress Photo to 50KB',
    'Govt Exam Photo Size Maker',
    'CBT Rank Image Resize'
  ],
  alternates: {
    canonical: 'https://cbtrank.com/tools/image-resize',
  },
  openGraph: {
    title: 'Photo & Signature Resizer for Govt Exams | CBT RANK',
    description: 'Quickly resize and compress exam photos to 20-50 KB and signatures to 10-20 KB.',
    url: 'https://cbtrank.com/tools/image-resize',
    siteName: 'CBT RANK',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Photo & Signature Resizer for Govt Exams | CBT RANK',
    description: 'Resize exam photos and signatures to exact government recruitment notification specifications.',
  },
};

export default function ImageResizeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
