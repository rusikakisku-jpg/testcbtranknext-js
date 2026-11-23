import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Change Photo Background to White Online for Govt Exams | CBT RANK',
  description: 'Free passport photo background changer for SSC, RRB, Railway, and UPSC exams. Easily make photo background plain white or light blue to prevent application form rejection.',
  keywords: [
    'White Background Photo Online',
    'Passport Photo Background Change to White',
    'SSC Photo White Background Maker',
    'Change Image Background to White Free',
    'Govt Exam Photo Background Editor',
    'CBT Rank Background Changer'
  ],
  alternates: {
    canonical: 'https://cbtrank.com/tools/image-background-change',
  },
  openGraph: {
    title: 'Change Photo Background to White Online | CBT RANK',
    description: 'Convert any photo background to clean white for SSC, RRB, and UPSC application forms.',
    url: 'https://cbtrank.com/tools/image-background-change',
    siteName: 'CBT RANK',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Change Photo Background to White Online | CBT RANK',
    description: 'Make exam photo background plain white to comply with official recruitment guidelines.',
  },
};

export default function ImageBackgroundChangeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
