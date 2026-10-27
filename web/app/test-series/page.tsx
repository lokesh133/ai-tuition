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
            const rawUser = localStorage.getItem('ai_tuition_student_user');
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

            const rawHist = localStorage.getItem('vidya_worksheet_history_v1');
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

        // 2. Fetch latest student record from API if phone exists
        if (phone) {
          try {
            const res = await fetch(`/api/student/records?phone=${phone}`);
            if (res.ok) {
              const json = await res.json();
              if (json.success && json.record) {
                const rec = json.record;
                if (rec.currentSession) {
                  if (Array.isArray(rec.currentSession.uploadedFiles) && rec.currentSession.uploadedFiles.length > 0) {
                    setUploadedFiles(rec.currentSession.uploadedFiles);
                  }
                  if (rec.currentSession.pageDataMap && Object.keys(rec.currentSession.pageDataMap).length > 0) {
                    setPageDataMap((prev) => ({ ...prev, ...rec.currentSession.pageDataMap }));
                  }
                }
                if (Array.isArray(rec.worksheetHistory) && rec.worksheetHistory.length > 0) {
                  setWorksheetHistory(rec.worksheetHistory);
                }
              }
            }
          } catch (apiErr) {
            console.error('API fetch error for student records:', apiErr);
          }
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
