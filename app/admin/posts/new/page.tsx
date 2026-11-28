'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SarkariPostEditor from '../../components/SarkariPostEditor';

export default function AdminNewPostPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/auth', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: any) => {
        if (!d?.authenticated) {
          router.replace('/admin/login');
        }
      })
      .catch(() => {});
  }, [router]);

  return <SarkariPostEditor />;
}
