'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardReportPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reports');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500 font-bold">
      Redirecting to Student All Report...
    </div>
  );
}
