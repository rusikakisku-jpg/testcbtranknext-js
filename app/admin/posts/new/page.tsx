'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SarkariPostEditor from '../../components/SarkariPostEditor';

export default function AdminNewPostPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((d: any) => {
        if (!d?.authenticated) router.replace('/admin/login');
        else setReady(true);
      })
      .catch(() => router.replace('/admin/login'));
  }, [router]);

  if (!ready) {
    return (
      <main className="sarkari-container" style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>
        Verifying session...
      </main>
    );
  }

  return <SarkariPostEditor />;
}
