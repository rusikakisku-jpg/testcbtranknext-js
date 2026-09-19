import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search History - Previously Checked Answer Keys | CBT RANK',
  description: 'View, reload, and review your previously calculated answer keys, scorecards, and live rank predictions on CBT RANK.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
