'use client';

import React from 'react';
import SundayTestSeriesModal, { TestResultRecord } from './SundayTestSeriesModal';

interface SundayExamProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  className?: string;
  board?: string;
  subjectName?: string;
  medium?: 'hindi' | 'english';
  onTestCompleted?: (result: TestResultRecord) => void;
  isDarkMode?: boolean;
  existingUploadedFiles?: Array<{ id: string; name: string; url: string; type?: string }>;
  pageDataMap?: Record<string, { whiteboardSteps?: any[]; detectedQuestions?: string[]; detectedChapter?: any; heading?: string }>;
  worksheetHistory?: any[];
  isFullPage?: boolean;
}

export default function PrintableSundayExamModal({
  isOpen,
  onClose,
  studentName = 'छात्र',
  className = 'Class 4th',
  board = 'RBSE',
  subjectName = 'गणित (Mathematics)',
  medium = 'hindi',
  onTestCompleted,
  isDarkMode = false,
  existingUploadedFiles,
  pageDataMap,
  worksheetHistory,
  isFullPage = false,
}: SundayExamProps) {
  // Normalize board string (e.g. 'RBSE (राजस्थान बोर्ड)' -> 'RBSE')
  const cleanBoard = board?.toUpperCase().includes('CBSE') ? 'CBSE' : 'RBSE';

  return (
    <SundayTestSeriesModal
      isOpen={isOpen}
      onClose={onClose}
      studentName={studentName}
      className={className}
      board={cleanBoard}
      medium={medium}
      onTestCompleted={onTestCompleted}
      isDarkMode={isDarkMode}
      existingUploadedFiles={existingUploadedFiles}
      pageDataMap={pageDataMap}
      worksheetHistory={worksheetHistory}
      isFullPage={isFullPage}
    />
  );
}
