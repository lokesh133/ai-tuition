// Official Master Curriculum Database for CBSE & RBSE (Classes 1st to 8th)
// Covers Hindi & English Medium, Official Chapters, and Exam Weightage for 4 Subjects:
// 1. Mathematics (Sharma Sir)
// 2. EVS / Science (Neha Mam)
// 3. English (Riya Didi)
// 4. Hindi (Pooja Mam)

import rbseSeedData from '@/data/rbse-curriculum.json';

export interface Chapter {
  id: string;
  chapterNumber: number;
  titleEnglish: string;
  titleHindi: string;
  concepts: string[];
  keyFormulas?: string[];
  term: 'half_yearly' | 'annual';
  estimatedMinutes: number;
  startPage?: number;
  endPage?: number;
  sampleQuestions: {
    question: string;
    type: 'mcq' | 'fill' | 'solve';
    options?: string[];
    correctAnswer: string;
    explanation: string;
    whiteboardSteps?: { step: string; formula: string; annotation: string }[];
  }[];
  bookPages?: {
    pageNumber: number;
    pageTitle: string;
    summary: string;
    concepts?: string[];
    imageUrl?: string;
  }[];
}

export interface SubjectCurriculum {
  id: string;
  subject: string;
  subjectHindi: string;
  bookName: string;
  totalPages?: number;
  bookPdfName?: string;
  bookPdfSize?: string;
  pdfUploadedAt?: string;
  teacherId: 'sharma' | 'neha' | 'riya' | 'pooja';
  teacherName: string;
  emoji: string;
  chapters: Chapter[];
}

export interface BoardCurriculum {
  board: 'RBSE' | 'CBSE';
  classes: {
    [className: string]: {
      [medium in 'english' | 'hindi']: SubjectCurriculum[];
    };
  };
}

export const CURRICULUM_DATA: any = rbseSeedData;

export const CLASS_4_SUBJECTS: SubjectCurriculum[] =
  (rbseSeedData as any)?.RBSE?.classes?.['Class 4th']?.english || [];

export function getCurriculum(
  board: 'RBSE' | 'CBSE' = 'RBSE',
  className: string = 'Class 4th',
  medium: 'english' | 'hindi' = 'hindi'
): SubjectCurriculum[] {
  const b = (CURRICULUM_DATA as any)?.[board] || (CURRICULUM_DATA as any)?.RBSE;
  const cls = b?.classes?.[className] || b?.classes?.['Class 4th'];
  if (cls) {
    return cls[medium] || cls.english || cls.hindi || CLASS_4_SUBJECTS;
  }
  return CLASS_4_SUBJECTS;
}

export function getSubjectById(subjectId: string): SubjectCurriculum {
  const all = getCurriculum('RBSE', 'Class 4th', 'hindi');
  return all.find((s) => s.id.toLowerCase() === subjectId.toLowerCase()) || all[0];
}

/**
 * Fetch fresh curriculum from persistent server storage (API)
 */
export async function fetchDynamicCurriculum(board = 'RBSE', className = 'Class 4th'): Promise<SubjectCurriculum[]> {
  try {
    const res = await fetch(`/api/admin/syllabus?board=${board}&class=${encodeURIComponent(className)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.subjects) && data.subjects.length > 0) {
        return data.subjects;
      }
    }
  } catch (err) {
    console.warn('[CurriculumData] Could not fetch live curriculum, using local seed:', err);
  }
  return getCurriculum(board as any, className);
}
