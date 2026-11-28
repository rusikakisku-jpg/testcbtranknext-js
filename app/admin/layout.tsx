import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CBT RANK Admin Panel',
  robots: { index: false, follow: false, nocache: true }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="sarkari-admin-shell">{children}</div>;
}
