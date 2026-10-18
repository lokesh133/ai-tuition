'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reports');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-xs text-slate-500 font-bold">
      Redirecting to Student All Report...
    </div>
  );
}
