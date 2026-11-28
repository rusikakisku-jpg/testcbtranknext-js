import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Admin Console Pro - CBT RANK',
    template: '%s | Admin Console Pro'
  },
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="gez-admin-root">{children}</div>;
}
