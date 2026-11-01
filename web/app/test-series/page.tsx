'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrintableSundayExamModal from '@/components/PrintableSundayExamModal';
import { Loader2 } from 'lucide-react';

export default function WeeklyTestSeriesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [studentUser, setStudentUser] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [pageDataMap, setPageDataMap] = useState<Record<string, any>>({});
  const [worksheetHistory, setWorksheetHistory] = useState<any[]>([]);
  const [board, setBoard] = useState<string>('RBSE');
  const [className, setClassName] = useState<string>('Class 4th');
  const [medium, setMedium] = useState<'hindi' | 'english'>('hindi');
  const [subjectName, setSubjectName] = useState<string>('गणित (Mathematics)');

  useEffect(() => {
    async function loadData() {
      try {
        let phone: string | null = null;
        let sUser: any = null;

        // 1. Read from localStorage
        if (typeof window !== 'undefined') {
          try {
            const rawUser = localStorage.getItem('student_user') || localStorage.getItem('ai_tuition_student_user');
            if (rawUser) {
              sUser = JSON.parse(rawUser);
              setStudentUser(sUser);
              if (sUser.phone) phone = sUser.phone;
              if (sUser.board) setBoard(sUser.board);
              if (sUser.className) setClassName(sUser.className);
              if (sUser.medium) setMedium(sUser.medium);
            }

            const rawSession = localStorage.getItem('vidya_current_session');
            if (rawSession) {
              const sess = JSON.parse(rawSession);
              if (Array.isArray(sess.uploadedFiles)) {
                setUploadedFiles(sess.uploadedFiles);
              }
              if (sess.pageDataMap) {
                setPageDataMap(sess.pageDataMap);
              }
            }

            const rawHist = localStorage.getItem('ai_tuition_worksheet_records') || localStorage.getItem('vidya_worksheet_history_v1');
            if (rawHist) {
              const hist = JSON.parse(rawHist);
              if (Array.isArray(hist)) {
                setWorksheetHistory(hist);
              }
            }
          } catch (e) {
            console.error('LocalStorage read error:', e);
          }
        }

        // 2. Fetch latest student record from API (phone or general fallback)
        try {
          const fetchUrl = phone
            ? `/api/student/records?phone=${encodeURIComponent(phone)}`
            : '/api/student/records?phone=general';
          const res = await fetch(fetchUrl);
          if (res.ok) {
            const json = await res.json();
            if (json.success) {
              const h = json.worksheetHistory || json.record?.worksheetHistory;
              if (Array.isArray(h) && h.length > 0) {
                setWorksheetHistory((prev) => {
                  const map = new Map<string, any>();
                  prev.forEach((r) => { if (r.id) map.set(r.id, r); });
                  h.forEach((r: any) => { if (r.id) map.set(r.id, r); });
                  return Array.from(map.values());
                });
              }
              const curr = json.record?.currentSession || json.currentSession;
              if (curr) {
                if (Array.isArray(curr.uploadedFiles) && curr.uploadedFiles.length > 0) {
                  setUploadedFiles(curr.uploadedFiles);
                }
                if (curr.pageDataMap && Object.keys(curr.pageDataMap).length > 0) {
                  setPageDataMap((prev) => ({ ...prev, ...curr.pageDataMap }));
                }
              }
            }
          }
        } catch (apiErr) {
          console.error('API fetch error for student records:', apiErr);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-sm font-bold">साप्ताहिक टेस्ट सीरीज़ लोड हो रही है...</span>
        </div>
      </div>
    );
  }

  return (
    <PrintableSundayExamModal
      isOpen={true}
      onClose={() => router.push('/tutor')}
      studentName={studentUser?.name || 'छात्र'}
      className={className}
      board={board}
      subjectName={subjectName}
      medium={medium}
      existingUploadedFiles={uploadedFiles}
      pageDataMap={pageDataMap}
      worksheetHistory={worksheetHistory}
      isFullPage={true}
    />
  );
}
