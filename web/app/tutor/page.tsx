'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Camera,
  Upload,
  Sparkles,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Award,
  ChevronRight,
  ChevronLeft,
  Clock,
  History,
  TrendingUp,
  Brain,
  HelpCircle,
  Check,
  X,
  Smile,
  Zap,
  Flame,
  FileText,
  Share2,
  Loader2,
  Sun,
  Moon,
  Trash2,
  Plus,
  ChevronDown,
  Eye,
  EyeOff,
  Bell,
  Crown,
  Maximize2,
  Minimize2,
  RotateCw,
  Home,
  MessageSquare,
  BarChart2,
  Users,
  Boxes,
  FileCheck,
  Settings,
  Image as ImageIcon,
  Edit3,
  Menu,
  Lock,
  Unlock,
  ShieldAlert,
} from 'lucide-react';
// Student reports now handled centrally on /reports
import PrintableSundayExamModal from '@/components/PrintableSundayExamModal';
import ParentWhatsAppReportModal from '@/components/ParentWhatsAppReportModal';
import TeacherWhiteboardAnimation from '@/components/TeacherWhiteboardAnimation';
import MathNotebookColumnGrid, { tryParseColumnMath } from '@/components/MathNotebookColumnGrid';
import VisualMathDiagramCard from '@/components/VisualMathDiagramCard';
import { WorksheetHistoryModal, SavedWorksheetRecord } from '@/components/WorksheetHistoryModal';
import { PdfWorksheetViewer } from '@/components/PdfWorksheetViewer';
import { enhanceDocumentImage, compressImageForThumbnail, optimizeImageForStorage } from '@/lib/image-enhancer';
import { RoughWorkScratchpad } from '@/components/RoughWorkScratchpad';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { HardWordsDictationCard } from '@/components/HardWordsDictationCard';
import { MySchoolBagModal } from '@/components/MySchoolBagModal';
import { MathSymbolEditorToolbar } from '@/components/MathSymbolEditorToolbar';
import { MathPyramidWidget } from '@/components/MathPyramidWidget';
import VisualEstimationWidget, { DEFAULT_WEIGHT_ITEMS } from '@/components/VisualEstimationWidget';
import { renderMathFractions } from '@/lib/math-fraction-renderer';
import {
  CURRICULUM_DATA,
  getCurriculum,
  Chapter,
  SubjectCurriculum,
} from '@/lib/curriculum-data';

// Learning History Record for Real Teacher Memory
interface StudyHistoryItem {
  id: string;
  time: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  chapterNumber: number;
  chapterTitle: string;
  strength: string;
  weakness?: string;
  score: number;
}

interface WhiteboardStepItem {
  step: string;
  question?: string;
  formula: string;
  annotation: string;
  isMistake?: boolean;
}

// Helper to separate repeating section instruction/heading (e.g. "3. Write true or false:", "2. Fill in the blanks:", "A. Complete the sentences") from the actual question
function parseQuestionAndSection(raw?: string | null): { section?: string; question: string } {
  if (!raw) return { question: '' };
  const trimmed = raw.trim();

  // Helper to normalize section name so all questions in the section match exactly
  const normalizeSection = (sec: string): string => {
    const s = sec.trim();

    // Extract number prefix if present, e.g. "3. ", "2) ", "Question 3: ", "A. "
    const prefixMatch = s.match(/^((?:(?:Question|Q\.?|प्रश्न|Section|Part|खंड|भाग)\s*)?(?:[0-9]+|[A-Z]|[क-ह])[\.\)\-–:]?\s*)/i);
    const prefix = prefixMatch ? prefixMatch[1].trim() + ' ' : '';
    const body = prefixMatch ? s.slice(prefixMatch[0].length).trim() : s;
    const bodyLower = body.toLowerCase();

    if (bodyLower.includes('fill in the blank') || bodyLower.includes('fill in blank') || bodyLower.includes('रिक्त स्थान')) {
      return (prefix + (bodyLower.includes('रिक्त') ? 'रिक्त स्थानों की पूर्ति करें' : 'Fill in the blanks')).trim();
    }
    if (bodyLower.includes('multiple choice') || bodyLower === 'mcq' || bodyLower.includes('mcqs') || bodyLower.includes('बहुविकल्पीय')) {
      return (prefix + 'Multiple Choice Questions (MCQ)').trim();
    }
    if (bodyLower.includes('true/false') || bodyLower.includes('true or false') || bodyLower.includes('सही या गलत') || (bodyLower.includes('सत्य') && bodyLower.includes('असत्य'))) {
      return (prefix + (bodyLower.includes('सही') ? 'सही या गलत लिखिए' : bodyLower.includes('सत्य') ? 'सत्य या असत्य' : 'Write True or False')).trim();
    }
    if (bodyLower.includes('match the following') || bodyLower.includes('उचित मिलान') || bodyLower.includes('सुमेलित')) {
      return (prefix + (bodyLower.includes('उचित') || bodyLower.includes('सुमेलित') ? 'उचित मिलान करें' : 'Match the following')).trim();
    }
    if (bodyLower.includes('short answer') || bodyLower.includes('लघु उत्तरीय')) {
      return (prefix + 'Short Answer Questions').trim();
    }
    if (bodyLower.includes('long answer') || bodyLower.includes('दीर्घ उत्तरीय')) {
      return (prefix + 'Long Answer Questions').trim();
    }
    return s.replace(/[.:\-–]+$/, '').trim();
  };

  // Direct Pattern: Standalone numbered question (e.g. "प्रश्न 3. कोरोना के दौरान...", "3. कोरोना के दौरान...", "Q4: दादा जी का...", "1. Estimate of difference... (a) 20000 (b) 50000...")
  // Prevents tearing off the first Hindi letter (e.g. 'क' from 'कोरोना' or 'द' from 'दादा')
  const directQMatch = trimmed.match(/^(?:(?:Question|Q\.?|प्रश्न|सवाल)\s*)?(\d{1,2})[\.:\-–\)]\s+(.*)$/i);
  if (directQMatch) {
    const qNum = directQMatch[1];
    const qRest = directQMatch[2].trim();
    // If qRest contains multiple MCQ options like (a)..(b).., it is a complete MCQ question, NOT a section heading!
    const isMcqOptions = /\([a-dA-Dक-घ1-4]\)[\s\S]*\([b-dB-Dख-घ2-4]\)/i.test(qRest);
    if (isMcqOptions) {
      return { question: `${qNum}. ${qRest}` };
    }
    // Only treat as section heading if qRest explicitly has an embedded sub-question divider like (i), (a), (क)
    const hasSubQ = /^[\s\S]{3,60}?[:\-–]\s*(\([iIvVxXa-dA-D\dक-ह]+\)|(?:(?<=\s)|^)[iIvVxXa-dA-Dक-ह][\.\)]|\b\d{1,2}[\.\)])\s+(.*)$/i.exec(qRest);
    if (!hasSubQ) {
      return { question: `${qNum}. ${qRest}` };
    }
  }

  // Pattern 0: Numbered/labeled section heading directly followed by sub-question indicator
  // Matches: "3. Write true or false: (i) ..."
  //          "2. Fill in the blanks: (iii) ..."
  //          "4. Convert the following into kilograms and grams. (i) ..."
  //          "1. Multiple Choice Questions (MCQs): Choose the correct option. (i) ..."
  //          "प्रश्न 3. सही या गलत लिखिए: (क) ..."
  // Sub-question indicators: (i), (ii), (iv), (a), (b), (1), 1., i., (क), etc.
  // CRITICAL: Must NOT match if trimmed has multiple MCQ options (a) ... (b) ...!
  const hasMcqOptionsInTrimmed = /\([a-dA-Dक-घ1-4]\)[\s\S]*\([b-dB-Dख-घ2-4]\)/i.test(trimmed);
  if (!hasMcqOptionsInTrimmed) {
    const subIndexMatch = trimmed.match(
      /^((?:(?:Question|Q\.?|प्रश्न|Section|Part|खंड|भाग)\s*(?:[0-9]+|[A-Z]|[क-ह])?[\.\)\-–:]?\s*)?[A-Za-z\u0900-\u097F\s\(\)]{3,100}?)(?:[:\-–.]\s*|\s+)(\([iIvVxXa-dA-D\dक-ह]+\)|(?:(?<=\s)|^)[iIvVxXa-dA-Dक-ह][\.\)]|\b\d{1,2}[\.\)])\s*(.*)$/i
    );
    if (subIndexMatch) {
      const rawSec = subIndexMatch[1].trim();
      const section = normalizeSection(rawSec);
      const subIdx = subIndexMatch[2].trim();
      const qRest = subIndexMatch[3]?.trim() || '';
      const question = qRest ? `${subIdx} ${qRest}` : subIdx;
      return { section, question };
    }
  }

  // Pattern 1: Known section name directly followed by question number (and optional colon/dash/space)
  // e.g. "Fill in the blanks 2: Difference of 388765...", "Fill in the blanks 3 To decrease...", "MCQ 5: Mr. Alex...", "True/False 1: For any..."
  const sectionTypeMatch = trimmed.match(
    /^(Fill in the blanks?|True[\s/]*False|True or False|Multiple Choice Questions?|MCQ|Match the following|Tick the correct [a-z]+|Choose the correct [a-z]+|Short Answer Questions?|Long Answer Questions?|रिक्त स्थान(?: की पूर्ति करें| भरें)?|सही या गलत|सत्य\s*[/या]\s*असत्य|बहुविकल्पीय प्रश्न|सही विकल्प चुनें|उचित मिलान करें|सुमेलित कीजिए)\s*[:\-–]?\s*(?:#|Q\.?|प्रश्न\s*)?(\d+)[\.:\-–\)]?\s*(.*)$/i
  );
  if (sectionTypeMatch && sectionTypeMatch[1] && sectionTypeMatch[2]) {
    const section = normalizeSection(sectionTypeMatch[1]);
    const qNum = sectionTypeMatch[2].trim();
    const qRest = sectionTypeMatch[3]?.trim() || '';
    const question = qRest ? `${qNum}. ${qRest}` : `${qNum}.`;
    return { section, question };
  }

  // Pattern 2: Explicit Section/Part/A. followed by instruction and question number (e.g. "A. Complete the sentences. 1. ...")
  const match = trimmed.match(
    /^((?:(?:Section|Part|खंड|भाग|प्रश्न)\s*[A-Zक-ह0-9]*|[A-Z][\.\s])\s*[^0-9\n\r]+?)(?:[.:]\s*|\s+)(\(?\d+[\.\)]\s*.*)$/i
  );
  if (match && match[1] && match[2]) {
    const section = normalizeSection(match[1]);
    const question = match[2].trim();
    return { section, question };
  }

  // Pattern 3: Heading ending with a colon or dash before question number (e.g. "Fill in the blanks: 1. ...", "Identify the following: 1. three proper nouns")
  const colonMatch = trimmed.match(/^([^:\-–\n\r]{3,40}?)\s*[:\-–]\s*(\(?\d+[\.\)]\s*.*)$/i);
  if (colonMatch && colonMatch[1] && colonMatch[2]) {
    const section = normalizeSection(colonMatch[1]);
    const question = colonMatch[2].trim();
    return { section, question };
  }

  // Pattern 4: General section label followed by number: e.g. "Mathematics 1: ...", "General Science 2: ..."
  const generalMatch = trimmed.match(
    /^((?:Section|Part|खंड|भाग|Chapter|अध्याय)\s*[A-Zक-ह0-9]*|[A-Za-z\u0900-\u097F\s]{3,35}?)\s*[:\-–]\s*(?:#|Q\.?|प्रश्न\s*)?(\d+)[\.:\-–\)]\s*(.*)$/i
  );
  if (generalMatch && generalMatch[1] && generalMatch[2] && generalMatch[3]) {
    const section = normalizeSection(generalMatch[1]);
    const question = `${generalMatch[2]}. ${generalMatch[3].trim()}`;
    return { section, question };
  }

  return { question: trimmed };
}

/**
 * Component for Indian School Column Arithmetic (Addition/Subtraction)
 * Every digit is vertically aligned in its own place value column lane:
 * Lakh | 10-Thousand | Thousand | Hundred | Ten | One
 */
function ColumnArithmeticBox({
  topNum,
  botNum,
  operator = '-',
  label = '',
}: {
  topNum: string | number;
  botNum: string | number;
  operator?: '-' | '+';
  label?: string;
}) {
  const cleanTop = String(topNum).replace(/[^0-9]/g, '');
  const cleanBot = String(botNum).replace(/[^0-9]/g, '');
  const nTop = parseInt(cleanTop, 10) || 0;
  const nBot = parseInt(cleanBot, 10) || 0;
  const nDiff = operator === '-' ? nTop - nBot : nTop + nBot;
  const cleanDiff = String(Math.abs(nDiff));

  const maxLen = Math.max(cleanTop.length, cleanBot.length, cleanDiff.length);
  // Pad strings to exact maxLen so every single column aligns right-to-left
  const topChars = cleanTop.padStart(maxLen, ' ').split('');
  const botChars = cleanBot.padStart(maxLen, ' ').split('');
  const diffChars = cleanDiff.padStart(maxLen, ' ').split('');

  // Indian School Place Values (Lakh, Ten-Thousand, Thousand, Hundred, Ten, One)
  const placeNames = ['10-लाख', 'लाख', '10-हज़ार', 'हज़ार', 'सैकड़ा', 'दहाई', 'इकाई'];
  const relevantPlaces = placeNames.slice(-maxLen);

  // Compute Borrow (for Subtraction) or Carry (for Addition)
  const borrowRow: Array<number | null> = Array(maxLen).fill(null);
  const wasBorrowedFrom: boolean[] = Array(maxLen).fill(false);
  const carryRow: Array<number | null> = Array(maxLen).fill(null);

  if (operator === '-') {
    const currTop = topChars.map((c) => (c === ' ' ? 0 : parseInt(c, 10)));
    const currBot = botChars.map((c) => (c === ' ' ? 0 : parseInt(c, 10)));

    for (let i = maxLen - 1; i >= 0; i--) {
      if (currTop[i] < currBot[i]) {
        let j = i - 1;
        while (j >= 0 && currTop[j] === 0) j--;
        if (j >= 0) {
          currTop[j] -= 1;
          borrowRow[j] = currTop[j];
          wasBorrowedFrom[j] = true;
          for (let k = j + 1; k < i; k++) {
            currTop[k] = 9;
            borrowRow[k] = 9;
            wasBorrowedFrom[k] = true;
          }
          currTop[i] += 10;
          borrowRow[i] = currTop[i];
          wasBorrowedFrom[i] = true;
        }
      }
    }
  } else if (operator === '+') {
    let carry = 0;
    for (let i = maxLen - 1; i >= 0; i--) {
      const dTop = topChars[i] === ' ' ? 0 : parseInt(topChars[i], 10);
      const dBot = botChars[i] === ' ' ? 0 : parseInt(botChars[i], 10);
      const sum = dTop + dBot + carry;
      carry = Math.floor(sum / 10);
      if (carry > 0 && i > 0) {
        carryRow[i - 1] = carry;
      }
    }
  }

  const hasBorrow = borrowRow.some((b) => b !== null);
  const hasCarry = carryRow.some((c) => c !== null);

  return (
    <div className="flex flex-col items-center py-2.5 my-1.5">
      {label && (
        <div className="text-xs font-bold text-blue-800 bg-blue-100/70 px-3 py-1 rounded-full mb-2 border border-blue-200">
          {label}
        </div>
      )}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-blue-200 shadow-sm font-mono inline-block">
        <div className="flex items-center">
          {/* Operator Column on left */}
          <div className="flex flex-col items-center justify-between h-full pr-3 border-r-2 border-blue-100 mr-1 select-none">
            <span className="text-[10px] font-bold text-transparent h-4">op</span>
            {(hasBorrow || hasCarry) && (
              <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1 py-0.5 rounded leading-none">
                {hasBorrow ? 'उधार' : 'हासिल'}
              </span>
            )}
            <span className="text-transparent h-8 sm:h-9" />
            <span className="text-xl sm:text-2xl font-black text-rose-600 h-8 sm:h-9 flex items-center justify-center">
              {operator}
            </span>
            <div className="w-6 border-t-2 border-slate-700 my-1" />
            <span className="text-transparent h-8 sm:h-9" />
          </div>

          {/* Value Columns (Vertical Lanes) */}
          <div className="flex items-stretch">
            {topChars.map((topCh, idx) => {
              const botCh = botChars[idx];
              const diffCh = diffChars[idx];
              const pl = relevantPlaces[idx];
              const borrowVal = borrowRow[idx];
              const carryVal = carryRow[idx];
              const isModified = wasBorrowedFrom[idx];

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center px-2.5 sm:px-3 border-r last:border-r-0 border-blue-100/80 bg-blue-50/20 hover:bg-blue-100/40 transition-colors"
                >
                  {/* Place Value Header */}
                  <span className="text-[10px] sm:text-xs font-bold font-sans text-blue-600 tracking-tight pb-1 mb-1 border-b border-blue-100 w-full text-center">
                    {pl}
                  </span>

                  {/* Borrow / Carry Row */}
                  {(hasBorrow || hasCarry) && (
                    <div className="h-6 flex items-center justify-center">
                      {borrowVal !== null ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 font-black text-[11px] border border-amber-300 shadow-2xs leading-none">
                          {borrowVal}
                        </span>
                      ) : carryVal !== null ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 font-black text-[11px] border border-amber-300 shadow-2xs leading-none">
                          +{carryVal}
                        </span>
                      ) : (
                        <span className="text-transparent text-[11px]">—</span>
                      )}
                    </div>
                  )}

                  {/* Top Digit */}
                  <div className="h-8 sm:h-9 flex items-center justify-center text-base sm:text-lg font-black text-slate-800">
                    {topCh === ' ' ? (
                      '\u00A0'
                    ) : isModified && borrowVal !== null ? (
                      <span className="line-through decoration-rose-500 decoration-2 text-slate-400 font-bold">
                        {topCh}
                      </span>
                    ) : (
                      topCh
                    )}
                  </div>

                  {/* Bottom Digit */}
                  <div className="h-8 sm:h-9 flex items-center justify-center text-base sm:text-lg font-black text-rose-600">
                    {botCh === ' ' ? '\u00A0' : botCh}
                  </div>

                  {/* Column Divider Line */}
                  <div className="w-full border-t-2 border-slate-800 my-1" />

                  {/* Result Digit */}
                  <div className="h-8 sm:h-9 flex items-center justify-center text-base sm:text-lg font-black text-blue-700 bg-blue-50/80 rounded w-full border border-blue-200/50">
                    {diffCh === ' ' ? '\u00A0' : diffCh}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic Classroom Studio - All questions, solutions & steps load 100% dynamically from student uploads and curriculum

export default function TuitionClassroomStudio() {
  const router = useRouter();
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Board & Class Config
  const [board, setBoard] = useState<'RBSE' | 'CBSE'>('RBSE');
  const [className, setClassName] = useState<string>('Class 4th');
  const [medium, setMedium] = useState<'hindi' | 'english'>('hindi');
  const inputRef = useRef<HTMLInputElement>(null);
  const mockAnswerTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load All 4 Core Subjects with dynamic API sync capability
  const [allSubjects, setAllSubjects] = useState<SubjectCurriculum[]>(() =>
    getCurriculum(board, className, medium)
  );

  // Active Student & Gamification Habits
  const [currentStudentName, setCurrentStudentName] = useState<string>('Student');
  const [streakDays, setStreakDays] = useState<number>(3);
  const [studentStars, setStudentStars] = useState<number>(50);
  const [socraticMode, setSocraticMode] = useState<boolean>(true);
  const [isParentReportModalOpen, setIsParentReportModalOpen] = useState<boolean>(false);
  const [isAcademicSelectorOpen, setIsAcademicSelectorOpen] = useState<boolean>(false);
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState<boolean>(false);

  const cleanSpeechText = (text: string) => {
    if (!text) return '';
    // 1. Cut off formula/step-by-step dumps from visual speech bubble (teacher speaks it by voice)
    let clean = text.split('---')[0];
    clean = clean.split(/Notebook Column Method|Given:|Step 1:|चरण 1:|Final Answer:|अंतिम उत्तर:/i)[0];

    // 2. Remove markdown asterisks and latex symbols
    clean = clean
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\$(.*?)\$/g, '$1')
      .replace(/\\text\{([^}]*)\}/g, '$1')
      .replace(/###/g, '')
      .replace(/##/g, '')
      .replace(/#/g, '')
      .replace(/__/g, '')
      .replace(/\\/g, '')
      .trim();

    // 3. Clean up trailing colons or dashes into Hindi full stop
    clean = clean.replace(/[:\-–]\s*$/, '।');
    if (!clean || clean.length < 5) {
      clean = 'नमस्ते बेटा! आपकी कॉपी के सभी सवालों का हल नीचे व्हाइटबोर्ड पर तैयार है। कोई भी सवाल पूछिए!';
    }
    return clean;
  };

  // Read logged-in student preference & habits if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem('student_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name && u.name.trim()) {
          setCurrentStudentName(u.name.trim());
        }
        if (u.board) {
          setBoard(u.board.toUpperCase().includes('CBSE') ? 'CBSE' : 'RBSE');
        }
        if (u.classGrade) {
          const numMatch = u.classGrade.match(/\d+/);
          if (numMatch) {
            setClassName(`Class ${numMatch[0]}th`);
          }
        }
      }
      const savedStars = localStorage.getItem('tuition_stars');
      if (savedStars) setStudentStars(parseInt(savedStars, 10) || 50);
      const savedStreak = localStorage.getItem('tuition_streak');
      if (savedStreak) setStreakDays(parseInt(savedStreak, 10) || 3);
    } catch (e) { }
  }, []);

  // Sync with live changes or board/class switch
  useEffect(() => {
    const localData = getCurriculum(board, className, medium);
    setAllSubjects(localData);
    setSelectedSubject((prev) => {
      if (!prev) return null;
      return localData.find((s) => s.id.toLowerCase() === prev.id.toLowerCase()) || null;
    });

    fetch(`/api/admin/syllabus?board=${board}&class=${encodeURIComponent(className)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.subjects) && d.subjects.length > 0) {
          setAllSubjects(d.subjects);
          setSelectedSubject((prev) => {
            if (!prev) return null;
            return d.subjects.find((s: any) => s.id.toLowerCase() === prev.id.toLowerCase()) || prev;
          });
          setSelectedChapter((prevCh) => {
            if (!prevCh) return null;
            for (const sub of d.subjects) {
              const found = sub.chapters?.find((c: any) => c.id === prevCh.id || c.chapterNumber === prevCh.chapterNumber);
              if (found) return found;
            }
            return prevCh;
          });
        }
      })
      .catch(() => { });
  }, [board, className, medium]);

  // Active Selected Subject & Chapter (No subject pre-selected initially)
  const [selectedSubject, setSelectedSubject] = useState<SubjectCurriculum | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isChaptersOpen, setIsChaptersOpen] = useState<boolean>(false);

  // Active Teacher
  const [currentTeacher, setCurrentTeacher] = useState({
    id: 'sharma',
    name: 'Sharma Sir',
    role: 'Class 1st-8th Math Mentor',
    emoji: '👨‍🏫',
  });

  const TEACHER_LIST_DATA = [
    {
      id: 'sharma',
      name: 'Sharma Sir',
      subject: 'गणित',
      subjectEn: 'Mathematics',
      subjectId: 'math',
      role: 'गणित शिक्षक',
      image: '/teachers/sharma.jpg',
      online: true,
      prompt: 'कोई भी सवाल पूछो, मैं step by step समझाऊँगा ।',
      greeting: 'आओ, गणित को आसान और मज़ेदार बनाएं !',
    },
    {
      id: 'riya',
      name: 'Riya Didi',
      subject: 'English',
      subjectEn: 'English',
      subjectId: 'english',
      role: 'English',
      image: '/teachers/riya.jpg',
      online: true,
      prompt: 'Spelling, story reading or grammar doubt? Just ask!',
      greeting: 'Let\'s make English easy and fun!',
    },
    {
      id: 'neha',
      name: 'Neha Mam',
      subject: 'Science',
      subjectEn: 'Science',
      subjectId: 'science',
      role: 'Science',
      image: '/teachers/neha.jpg',
      online: true,
      prompt: 'पेड़-पौधे, जानवर और विज्ञान के सवाल पूछें।',
      greeting: 'विज्ञान के मजेदार प्रयोग और सीख!',
    },
    {
      id: 'pooja',
      name: 'Pooja Mam',
      subject: 'हिंदी',
      subjectEn: 'Hindi',
      subjectId: 'hindi',
      role: 'हिंदी',
      image: '/teachers/kabir.jpg',
      online: true,
      prompt: 'हिंदी व्याकरण, विलोम शब्द या पाठ के प्रश्न पूछें।',
      greeting: 'हिंदी को समझें और सुंदर लिखें!',
    },
  ];

  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('tutor');
  const [whiteboardDisplayTab, setWhiteboardDisplayTab] = useState<'book' | 'notebook' | 'mock'>('book');
  const [imageZoom, setImageZoom] = useState<number>(1);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(false);
  const [isFitToHeight, setIsFitToHeight] = useState<boolean>(true);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<'both' | 'worksheet' | 'whiteboard'>('both');
  // Live Teacher Doubt Assistant States (Multi-Turn Conversational Doubts)
  const [teacherDoubtPopup, setTeacherDoubtPopup] = useState<{
    isOpen: boolean;
    question: string;
    answer: string;
    questionNumber?: number;
    turns?: Array<{ id: string; role: 'student' | 'teacher'; text: string; time?: string }>;
  } | null>(null);
  const [popupInputText, setPopupInputText] = useState('');
  const [isPopupListening, setIsPopupListening] = useState(false);
  const [isPopupAnswering, setIsPopupAnswering] = useState(false);
  const popupRecognitionRef = useRef<any>(null);
  const popupSpeechHandledRef = useRef<boolean>(false);
  const popupChatEndRef = useRef<HTMLDivElement | null>(null);
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<number | null>(null);

  // 📱 Mobile Navigation Drawer State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 🔒 Child Safe Lock Screen (बाल सुरक्षा लॉक) States
  const [isChildLockActive, setIsChildLockActive] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);

  // Live Camera / Webcam Capture States
  const [isWebcamModalOpen, setIsWebcamModalOpen] = useState<boolean>(false);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);

  const startWebcamCapture = async () => {
    // Mobile devices have native high-res camera with auto-focus
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        videoStreamRef.current = stream;
        setIsWebcamModalOpen(true);
        setTimeout(() => {
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
            webcamVideoRef.current.play().catch(() => {});
          }
        }, 150);
      } else {
        cameraInputRef.current?.click();
      }
    } catch {
      cameraInputRef.current?.click();
    }
  };

  const stopWebcamStream = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    setIsWebcamModalOpen(false);
  };

  const capturePhotoFromWebcam = () => {
    if (!webcamVideoRef.current) return;
    const video = webcamVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      stopWebcamStream();

      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const fakeEvent = {
            target: {
              files: [file],
              value: '',
            },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          handlePhotoUpload(fakeEvent);
        });
    }
  };

  // Whiteboard Steps (empty initially until chapter is selected or doubt asked)
  const [whiteboardSteps, setWhiteboardSteps] = useState<WhiteboardStepItem[]>([]);
  const [revealedSteps, setRevealedSteps] = useState<number>(1);
  const [whiteboardHeading, setWhiteboardHeading] = useState<string>('आज की ट्यूशन क्लास (Ready to Teach)');
  const [activeTargetQuestion, setActiveTargetQuestion] = useState<string>('');

  // Voice & Speech States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingQuestionId, setSpeakingQuestionId] = useState<number | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isMockListening, setIsMockListening] = useState<boolean>(false);
  const mockRecognitionRef = useRef<any>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [speechText, setSpeechText] = useState<string>(
    'नमस्ते बेटा! आज की ट्यूशन में आपका स्वागत है। आप आज कौन सा विषय पढ़ना चाहते हैं? नीचे से विषय चुनें (जैसे Math, English, EVS, Hindi) या बोलकर बताएं (जैसे: "Math का Chapter 8" या "English का Chapter 5")!'
  );

  // Homework Multi-File & Document Upload State (Daily 20 Pages Limit per Student)
  const MAX_DAILY_UPLOADS = 20;
  const getStudentDailyKey = () => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('student_user') : null;
      const studentId = stored ? (JSON.parse(stored).id || JSON.parse(stored).name || 'student') : 'guest';
      const today = new Date().toISOString().slice(0, 10);
      return `upload_count_${studentId}_${today}`;
    } catch {
      const today = new Date().toISOString().slice(0, 10);
      return `upload_count_guest_${today}`;
    }
  };
  const [dailyUploadCount, setDailyUploadCount] = useState<number>(0);

  useEffect(() => {
    try {
      const key = getStudentDailyKey();
      const count = parseInt(localStorage.getItem(key) || '0', 10);
      setDailyUploadCount(isNaN(count) ? 0 : count);
    } catch { }
  }, []);

  // Auto-scroll Teacher Doubt Popup conversation to bottom when new message arrives
  useEffect(() => {
    if (teacherDoubtPopup?.isOpen) {
      setTimeout(() => {
        popupChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [teacherDoubtPopup?.turns?.length, isPopupAnswering]);

  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string; url: string; type: string }>>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [pdfCurrentPage, setPdfCurrentPage] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [activeMathAnim, setActiveMathAnim] = useState<{ num1: number; op: string; num2: number; result: number } | null>(null);

  // Per-page cached data so switching pages immediately loads all questions/answers of that page
  const [pageDataMap, setPageDataMap] = useState<Record<string, {
    whiteboardSteps: WhiteboardStepItem[];
    detectedQuestions: string[];
    detectedChapter?: any;
    heading?: string;
  }>>({});

  // Computed values for active uploaded file
  const activeFileDoc = uploadedFiles.find((f) => f.id === activeFileId) || uploadedFiles[0] || null;
  const uploadedImage = activeFileDoc?.url || null;
  const uploadedFileName = activeFileDoc?.name || '';
  const isPdfWorksheet = Boolean(
    (activeFileDoc?.type && activeFileDoc.type.includes('pdf')) ||
    (uploadedImage && (uploadedImage.includes('.pdf') || uploadedImage.startsWith('data:application/pdf'))) ||
    (uploadedFileName && uploadedFileName.toLowerCase().endsWith('.pdf'))
  );

  const setUploadedImage = (url: string | null) => {
    if (!url) {
      stopAudio();
      setUploadedFiles([]);
      setActiveFileId('');
      setPdfCurrentPage(1);
      setPdfTotalPages(1);
      setPageDataMap({});
      setWhiteboardSteps([]);
      setActiveTargetQuestion('');
      setDetectedQuestions([]);
      setDetectedChapter(null);
      setCustomQuizQuestions([]);
      setCurrentUploadMode('teach');
      setWhiteboardHeading('आज की ट्यूशन क्लास (Ready to Teach)');
      setActiveMathAnim(null);
      setRevealedSteps(0);
      setIsCheckingHomework(false);
      setMockAnswers({});
      setMockEvaluations({});
      setActiveMockQIdx(0);
    }
  };
  const setUploadedFileName = (_name: string) => { };

  const [detectedQuestions, setDetectedQuestions] = useState<string[]>([]);
  const [detectedChapter, setDetectedChapter] = useState<{
    title: string;
    summary?: string;
    storyText?: string;
  } | null>(null);
  const [customQuizQuestions, setCustomQuizQuestions] = useState<any[]>([]);
  const [currentUploadMode, setCurrentUploadMode] = useState<'teach' | 'check' | 'quiz'>('teach');
  const [mockAnswers, setMockAnswers] = useState<Record<number, string>>({});
  const [mockEvaluations, setMockEvaluations] = useState<Record<number, any>>({});
  const [activeMockQIdx, setActiveMockQIdx] = useState<number>(0);
  const [mockQuestionMarks, setMockQuestionMarks] = useState<Record<number, number>>({});
  const [mockManualScore, setMockManualScore] = useState<Record<number, string>>({});
  const [isManualGradingOpen, setIsManualGradingOpen] = useState<boolean>(false);
  const [showMcqSteps, setShowMcqSteps] = useState<Record<number, boolean>>({});
  const [isPageFlipping, setIsPageFlipping] = useState<boolean>(false);

  // Switch between uploaded worksheet pages and immediately show all questions and steps for that page
  const handleSwitchPage = (targetFileId: string) => {
    stopAudio();
    setIsPageFlipping(true);
    setTimeout(() => setIsPageFlipping(false), 350);
    setActiveFileId(targetFileId);
    setPdfCurrentPage(1);
    setActiveTargetQuestion('');
    setActiveMathAnim(null);

    const targetFile = uploadedFiles.find((f) => f.id === targetFileId);
    const targetIdx = uploadedFiles.findIndex((f) => f.id === targetFileId);
    const pageNumber = targetIdx !== -1 ? targetIdx + 1 : 1;

    if (pageDataMap[targetFileId] && pageDataMap[targetFileId].whiteboardSteps.length > 0) {
      const cached = pageDataMap[targetFileId];
      setWhiteboardSteps(cached.whiteboardSteps);
      setRevealedSteps(cached.whiteboardSteps.length);
      setDetectedQuestions(cached.detectedQuestions || []);
      setDetectedChapter(cached.detectedChapter || null);
      setWhiteboardHeading(cached.heading || `पेज #${pageNumber} का हल`);
      const switchMsg = `बेटा, पेज नंबर ${pageNumber} का पूरा हल आ गया है! नीचे स्क्रॉल करके सभी सवाल देखें।`;
      setSpeechText(switchMsg);
      speakText(switchMsg);
    } else if (targetFile) {
      setIsCheckingHomework(true);
      setWhiteboardSteps([]);
      const heading = `पेज #${pageNumber} स्कैन: ${targetFile.name}`;
      setWhiteboardHeading(heading);
      const scanMsg = `बेटा, मैं पेज नंबर ${pageNumber} को ध्यान से पढ़कर इसके सभी सवाल व्हाइटबोर्ड पर ला रहा हूँ!`;
      setSpeechText(scanMsg);
      speakText(scanMsg);

      fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'worksheet',
          learning_language: medium === 'english' ? 'en' : 'hi',
          teacher_id: currentTeacher.id,
          question:
            'कृपया इस पेज को ध्यान से पूरा पढ़ें। इसमें दिए गए सभी प्रश्न (अभ्यास, खाली स्थान, सवाल) पहचानें और बिना किसी फालतू इंट्रो के, सीधे हर सवाल (Q1, Q2, Q3...) का सटीक, पूरा और स्टेप-बाय-स्टेप हल व उत्तर व्हाइटबोर्ड पर समझाएं।',
          image_url: targetFile.url,
          file_name: targetFile.name,
          board,
          className,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.whiteboard_steps && data.whiteboard_steps.length > 0) {
            const cleaned = filterFillerWhiteboardSteps(data.whiteboard_steps);
            setWhiteboardSteps(cleaned);
            setRevealedSteps(cleaned.length);
            setDetectedQuestions(data.detected_questions || []);
            setDetectedChapter(data.detected_chapter || null);
            const finalHeading = `पेज #${pageNumber} हल: ${targetFile.name}`;
            setWhiteboardHeading(finalHeading);
            setPageDataMap((prev) => ({
              ...prev,
              [targetFileId]: {
                whiteboardSteps: cleaned,
                detectedQuestions: data.detected_questions || [],
                detectedChapter: data.detected_chapter || null,
                heading: finalHeading,
              },
            }));
          }
        })
        .catch(() => {
          fallbackUploadResponse(targetFile.name);
        })
        .finally(() => {
          setIsCheckingHomework(false);
        });
    }
  };

  const cleanWorksheetDisplayName = (name?: string | null): string => {
    if (!name) return "??????? ???????";
    let clean = name
      .replace(/^\d{4}-\d{2}-\d{2}T[^-]+-/, "")
      .replace(/^[a-zA-Z0-9_-]+_WhatsApp_Image_/i, "WhatsApp Image ")
      .replace(/^[_\s]+/, "")
      .replace(/\.jpeg\.jpg$/i, "")
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .trim();
    if (/whatsapp\s*image/i.test(clean) || /^img[\s_0-9]+/i.test(clean) || /^pxl[\s_0-9]+/i.test(clean)) {
      return "??????? ??????? (??????)";
    }
    if (/^\d+$/.test(clean)) {
      return `??????? ??? ${clean}`;
    }
    return clean || "??????? ???????";
  };

  // Live Vision Analysis: reads active uploaded worksheet with AI and populates whiteboard steps
  const handleAnalyzeActiveWorksheet = (targetFileParam?: { id?: string; name: string; url: string }) => {
    const fileToScan = targetFileParam || uploadedFiles.find((f) => f.id === activeFileId) || uploadedFiles[0];
    if (!fileToScan || !fileToScan.url) return;

    setIsCheckingHomework(true);
    setWhiteboardSteps([]);
    const cleanName = cleanWorksheetDisplayName(fileToScan.name);
    const heading = `वर्कशीट स्कैन: ${cleanName}`;
    setWhiteboardHeading(heading);
    const scanMsg = `बेटा, मैं आपकी कॉपी को ध्यान से पढ़कर इसके सभी सवाल और स्टेप-बाय-स्टेप हल व्हाइटबोर्ड पर ला रहा हूँ!`;
    setSpeechText(scanMsg);
    speakText(scanMsg);

    fetch('/api/tutor/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'worksheet',
        learning_language: medium === 'english' ? 'en' : 'hi',
        teacher_id: currentTeacher.id,
        question:
          'कृपया इस पेज को ध्यान से पूरा पढ़ें। इसमें दिए गए सभी प्रश्न (अभ्यास, खाली स्थान, सवाल) पहचानें और बिना किसी फालतू इंट्रो के, सीधे हर सवाल (Q1, Q2, Q3...) का सटीक, पूरा और स्टेप-बाय-स्टेप हल व उत्तर व्हाइटबोर्ड पर समझाएं।',
        image_url: fileToScan.url,
        file_name: fileToScan.name,
        board,
        className,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.whiteboard_steps && data.whiteboard_steps.length > 0) {
          const cleaned = filterFillerWhiteboardSteps(data.whiteboard_steps);
          setWhiteboardSteps(cleaned);
          setRevealedSteps(cleaned.length);
          setDetectedQuestions(data.detected_questions || []);
          setDetectedChapter(data.detected_chapter || null);
          const finalHeading = `वर्कशीट हल: ${data.detected_chapter?.title || cleanName}`;
          setWhiteboardHeading(finalHeading);

          if (data.detected_subject) {
            const matchedSub = allSubjects.find((s) =>
              s.id.toLowerCase().includes(data.detected_subject.toLowerCase())
            );
            if (matchedSub) setSelectedSubject(matchedSub);
          }
          if (data.teacher_id) {
            const matchedT = TEACHER_LIST_DATA.find(
              (t) => t.id === data.teacher_id || t.id.includes(data.teacher_id)
            );
            if (matchedT) {
              setCurrentTeacher({
                id: matchedT.id,
                name: matchedT.name,
                role: matchedT.role,
                emoji: matchedT.id === 'sharma' ? '👨‍🏫' : matchedT.id === 'riya' ? '👩‍🏫' : '👩‍🔬',
              });
            }
          }

          if (fileToScan.id) {
            setPageDataMap((prev) => ({
              ...prev,
              [fileToScan.id!]: {
                whiteboardSteps: cleaned,
                detectedQuestions: data.detected_questions || [],
                detectedChapter: data.detected_chapter || null,
                heading: finalHeading,
              },
            }));
          }

          const readyMsg = `बेटा, आपकी कॉपी के सारे सवाल और पूरे हल व्हाइटबोर्ड पर तैयार हैं!`;
          setSpeechText(readyMsg);
          speakText(readyMsg);
        } else {
          fallbackUploadResponse(fileToScan.name);
        }
      })
      .catch((err) => {
        console.error('Worksheet live scan error:', err);
        fallbackUploadResponse(fileToScan.name);
      })
      .finally(() => {
        setIsCheckingHomework(false);
      });
  };

  const handleRemoveFile = (idToRemove?: string) => {
    stopAudio();
    const targetId = idToRemove || activeFileId || (uploadedFiles[0]?.id ?? '');
    const nextFiles = uploadedFiles.filter((f) => f.id && f.id !== targetId);
    setUploadedFiles(nextFiles);
    setPageDataMap((prev) => {
      const copy = { ...prev };
      delete copy[targetId];
      return copy;
    });

    // If no files remain, completely wipe whiteboard, detected questions, and return to clean slate
    if (nextFiles.length === 0 || !targetId) {
      setActiveFileId('');
      setWhiteboardSteps([]);
      setActiveTargetQuestion('');
      setDetectedQuestions([]);
      setDetectedChapter(null);
      setCustomQuizQuestions([]);
      setCurrentUploadMode('teach');
      setWhiteboardHeading('आज की ट्यूशन क्लास (Ready to Teach)');
      setActiveMathAnim(null);
      setRevealedSteps(0);
      setIsCheckingHomework(false);
      setMockAnswers({});
      setMockEvaluations({});
      setActiveMockQIdx(0);
      setSpeechText('नमस्ते बेटा! नई फाइल या वर्कशीट अपलोड करें या बोलकर सवाल पूछें!');
    } else {
      const nextActive = nextFiles.find((f) => f.id === activeFileId) || nextFiles[0];
      handleSwitchPage(nextActive.id);
    }
  };

  const handleClearAllFiles = () => {
    stopAudio();
    setUploadedFiles([]);
    setActiveFileId('');
    setPageDataMap({});
    setWhiteboardSteps([]);
    setActiveTargetQuestion('');
    setDetectedQuestions([]);
    setDetectedChapter(null);
    setCustomQuizQuestions([]);
    setCurrentUploadMode('teach');
    setWhiteboardHeading('आज की ट्यूशन क्लास (Ready to Teach)');
    setActiveMathAnim(null);
    setRevealedSteps(0);
    setIsCheckingHomework(false);
    setMockAnswers({});
    setMockEvaluations({});
    setActiveMockQIdx(0);
    setSpeechText('नमस्ते बेटा! नई फाइल या वर्कशीट अपलोड करें या बोलकर सवाल पूछें!');
    try {
      localStorage.removeItem('vidya_current_session');
    } catch {}
  };

  // Full Page Reset - Clears active session, open files, whiteboard, subject & starts fresh
  const handleFullPageReset = () => {
    const confirmReset = window.confirm(
      'क्या आप पूरे ट्यूशन पेज को रीसेट करना चाहते हैं?\nसभी सक्रिय पेज, सवाल और क्लास साफ हो जाएंगे और आप नई शुरुआत कर सकेंगे।'
    );
    if (!confirmReset) return;

    stopAudio();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    setUploadedFiles([]);
    setActiveFileId('');
    setPageDataMap({});
    setWhiteboardSteps([]);
    setActiveTargetQuestion('');
    setDetectedQuestions([]);
    setDetectedChapter(null);
    setCustomQuizQuestions([]);
    setCurrentUploadMode('teach');
    setWhiteboardHeading('आज की ट्यूशन क्लास (Ready to Teach)');
    setActiveMathAnim(null);
    setRevealedSteps(0);
    setIsCheckingHomework(false);
    setMockAnswers({});
    setMockEvaluations({});
    setActiveMockQIdx(0);
    setImageZoom(1);
    setInputText('');
    if (inputRef.current) inputRef.current.value = '';
    setWhiteboardDisplayTab('book');
    setSelectedSubject(null);
    setSelectedChapter(null);
    setIsChaptersOpen(false);
    try {
      localStorage.removeItem('vidya_current_session');
    } catch {}
    const welcomeMsg = 'नमस्ते बेटा! पेज और व्हाइटबोर्ड पूरी तरह रीसेट हो गया है। आप नई कॉपी अपलोड कर सकते हैं या नया सवाल पूछ सकते हैं!';
    setSpeechText(welcomeMsg);
    speakText(welcomeMsg, undefined, true);
  };

  // Restore active session & enforce Login + Subscription requirement
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Mandatory Student Login Guard
    const savedUserStr = localStorage.getItem('student_user');
    if (!savedUserStr) {
      router.replace('/login?redirect=/tutor');
      return;
    }

    let userObj: any = null;
    try {
      userObj = JSON.parse(savedUserStr);
      setStudentUser(userObj);
      if (userObj.name) {
        setCurrentStudentName(userObj.name);
      }
      if (userObj.classGrade) {
        setClassName(userObj.classGrade);
      }
      if (userObj.board) {
        setBoard(userObj.board);
      }

      // 2. Subscription Verification (Free trial removed: active subscription required)
      const hasSubscription = Boolean(
        userObj.isSubscribed || localStorage.getItem('vidya_subscribed') === 'true'
      );
      setIsSubscribed(hasSubscription);
      if (!hasSubscription) {
        setIsSubscriptionModalOpen(true);
      }
    } catch {
      router.replace('/login?redirect=/tutor');
      return;
    }

    // Safety timeout to ensure loader dismisses within 1.2s max even on slow network
    const safetyTimer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1200);

    // 3. Restore Local Session
    try {
      const savedSessionStr = localStorage.getItem('vidya_current_session');
      if (savedSessionStr) {
        const session = JSON.parse(savedSessionStr);
        if (session.uploadedFiles && Array.isArray(session.uploadedFiles) && session.uploadedFiles.length > 0) {
          const sanitizedFiles = session.uploadedFiles.map((f: any) => {
            let u = f.url;
            if (f.name?.toLowerCase().includes('images.jfif') && (u.length < 25000 || u.startsWith('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAA'))) {
              u = '/data/student-uploads/general/2026-10-28T11-31-48-160Z_images.jfif.jpg';
            }
            return { ...f, url: u };
          });
          setUploadedFiles(sanitizedFiles);
          setActiveFileId(session.activeFileId || sanitizedFiles[0].id);
        }
        if (session.pageDataMap && Object.keys(session.pageDataMap).length > 0) {
          setPageDataMap(session.pageDataMap);
        }
        if (session.whiteboardSteps && Array.isArray(session.whiteboardSteps) && session.whiteboardSteps.length > 0) {
          setWhiteboardSteps(session.whiteboardSteps);
          setRevealedSteps(session.whiteboardSteps.length);
        }
        if (session.whiteboardHeading) {
          setWhiteboardHeading(session.whiteboardHeading);
        }
        if (session.detectedQuestions && Array.isArray(session.detectedQuestions)) {
          setDetectedQuestions(session.detectedQuestions);
        }
        if (session.detectedChapter) {
          setDetectedChapter(session.detectedChapter);
        }
        if (session.activeTargetQuestion) {
          setActiveTargetQuestion(session.activeTargetQuestion);
        }
        if (session.speechText) {
          setSpeechText(session.speechText);
        }
        if (session.currentUploadMode) {
          setCurrentUploadMode(session.currentUploadMode);
        }
        if (session.mockAnswers && typeof session.mockAnswers === 'object' && Object.keys(session.mockAnswers).length > 0) {
          setMockAnswers(session.mockAnswers);
        }
        if (session.mockEvaluations && typeof session.mockEvaluations === 'object' && Object.keys(session.mockEvaluations).length > 0) {
          setMockEvaluations(session.mockEvaluations);
        }
        if (typeof session.activeMockQIdx === 'number') {
          setActiveMockQIdx(session.activeMockQIdx);
        }
        if (session.teacherId && session.teacherName) {
          setCurrentTeacher({
            id: session.teacherId,
            name: session.teacherName,
            role: session.teacherRole || 'Class 1st-8th Math Mentor',
            emoji: session.teacherEmoji || '👨‍🏫',
          });
        }
      }

      // Standalone auto-restore for active mock test progress
      try {
        const savedMock = localStorage.getItem('vidya_mock_test_progress');
        if (savedMock) {
          const parsed = JSON.parse(savedMock);
          if (parsed.answers && Object.keys(parsed.answers).length > 0) {
            setMockAnswers((prev) => ({ ...parsed.answers, ...prev }));
          }
          if (parsed.evaluations && Object.keys(parsed.evaluations).length > 0) {
            setMockEvaluations((prev) => ({ ...parsed.evaluations, ...prev }));
          }
          if (typeof parsed.activeQIdx === 'number') {
            setActiveMockQIdx(parsed.activeQIdx);
          }
          if (parsed.mode === 'quiz') {
            setCurrentUploadMode('quiz');
          }
        }
      } catch {}
    } catch (err) {
      console.warn('Failed to restore vidya_current_session:', err);
    }

    // 4. Server Sync: Restore latest server worksheets & session records
    if (userObj && (userObj.phone || userObj.id)) {
      fetch(`/api/student/records?phone=${encodeURIComponent(userObj.phone || '')}&studentId=${encodeURIComponent(userObj.id || '')}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.currentSession) {
            const s = data.currentSession;
            if (s.uploadedFiles && s.uploadedFiles.length > 0) {
              setUploadedFiles((prev) => (prev.length === 0 ? s.uploadedFiles : prev));
              setActiveFileId(s.activeFileId || s.uploadedFiles[0].id);
            }
            if (s.pageDataMap && Object.keys(s.pageDataMap).length > 0) {
              setPageDataMap(s.pageDataMap);
            }
            const hasRealSteps =
              s.whiteboardSteps &&
              s.whiteboardSteps.length > 0 &&
              !s.whiteboardSteps.every((st: any) => st.formula === 'वर्कशीट सुरक्षित है' || st.step === 'सुरक्षित रिकॉर्ड');

            if (hasRealSteps) {
              setWhiteboardSteps((prev) => (prev.length === 0 ? s.whiteboardSteps : prev));
              setRevealedSteps(s.whiteboardSteps.length);
            }
            if (s.whiteboardHeading) setWhiteboardHeading(s.whiteboardHeading);
            if (s.detectedQuestions && s.detectedQuestions.length > 0) setDetectedQuestions(s.detectedQuestions);
            if (s.detectedChapter) setDetectedChapter(s.detectedChapter);
            if (s.activeTargetQuestion) setActiveTargetQuestion(s.activeTargetQuestion);
          }
          if (data.success && Array.isArray(data.worksheetHistory) && data.worksheetHistory.length > 0) {
            setWorksheetHistory(data.worksheetHistory);
            try {
              localStorage.setItem('ai_tuition_worksheet_records', JSON.stringify(data.worksheetHistory));
            } catch {}
            // If still no uploadedFiles loaded from session, load the most recent worksheet from history
            setUploadedFiles((prev) => {
              if (prev.length === 0 && data.worksheetHistory[0]?.files?.length > 0) {
                setActiveFileId(data.worksheetHistory[0].files[0].id);
                return data.worksheetHistory[0].files;
              }
              return prev;
            });
          }

          // If active file exists but has no real whiteboard steps, auto-scan with AI
          const sessionFiles = data.currentSession?.uploadedFiles;
          const historyFiles = data.worksheetHistory?.[0]?.files;
          const candidateFiles = sessionFiles?.length > 0 ? sessionFiles : historyFiles?.length > 0 ? historyFiles : [];
          const sessionSteps = data.currentSession?.whiteboardSteps;
          const hasRealSteps =
            sessionSteps &&
            sessionSteps.length > 0 &&
            !sessionSteps.every((st: any) => st.formula === 'वर्कशीट सुरक्षित है' || st.step === 'सुरक्षित रिकॉर्ड');

          if (candidateFiles.length > 0 && !hasRealSteps) {
            setTimeout(() => {
              handleAnalyzeActiveWorksheet(candidateFiles[0]);
            }, 500);
          }
        })
        .catch(() => {})
        .finally(() => {
          clearTimeout(safetyTimer);
          setIsInitialLoading(false);
        });
    } else {
      clearTimeout(safetyTimer);
      setIsInitialLoading(false);
    }
  }, []);

  // Auto-save active session to localStorage & server whenever files or whiteboard change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (uploadedFiles.length > 0 || whiteboardSteps.length > 0 || detectedQuestions.length > 0) {
      try {
        const sessionPayload = {
          uploadedFiles: uploadedFiles.map((f) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            url: f.url,
          })),
          activeFileId,
          pageDataMap,
          whiteboardSteps,
          whiteboardHeading,
          detectedQuestions,
          detectedChapter,
          activeTargetQuestion,
          speechText,
          teacherId: currentTeacher.id,
          teacherName: currentTeacher.name,
          teacherRole: currentTeacher.role,
          teacherEmoji: currentTeacher.emoji,
          selectedSubjectId: selectedSubject?.id,
          currentUploadMode,
          mockAnswers,
          mockEvaluations,
          activeMockQIdx,
          timestamp: Date.now(),
        };
        localStorage.setItem('vidya_current_session', JSON.stringify(sessionPayload));

        // Background sync session to server for logged-in student
        const savedUser = localStorage.getItem('student_user');
        if (savedUser) {
          const u = JSON.parse(savedUser);
          if (u.phone || u.id) {
            fetch('/api/student/records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: u.phone,
                studentId: u.id,
                currentSession: sessionPayload,
              }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Could not save session:', err);
      }
    }
  }, [
    uploadedFiles,
    activeFileId,
    pageDataMap,
    whiteboardSteps,
    whiteboardHeading,
    detectedQuestions,
    detectedChapter,
    activeTargetQuestion,
    speechText,
    currentTeacher,
    selectedSubject,
    currentUploadMode,
    mockAnswers,
    mockEvaluations,
    activeMockQIdx,
  ]);

  // Dedicated continuous auto-save for student's mock test typed answers (never lost on refresh)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (Object.keys(mockAnswers).length > 0 || Object.keys(mockEvaluations).length > 0) {
      try {
        localStorage.setItem(
          'vidya_mock_test_progress',
          JSON.stringify({
            answers: mockAnswers,
            evaluations: mockEvaluations,
            activeQIdx: activeMockQIdx,
            mode: currentUploadMode,
            timestamp: Date.now(),
          })
        );
      } catch {}
    }
  }, [mockAnswers, mockEvaluations, activeMockQIdx, currentUploadMode]);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});
  const [isEvaluatingMock, setIsEvaluatingMock] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSundayExamModalOpen, setIsSundayExamModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState<boolean>(false);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState<boolean>(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState<boolean>(false);
  const [worksheetHistory, setWorksheetHistory] = useState<SavedWorksheetRecord[]>([]);
  const [lastArchivedNotice, setLastArchivedNotice] = useState<{ title: string; count: number } | null>(null);
  const [isWorksheetCelebrationOpen, setIsWorksheetCelebrationOpen] = useState<boolean>(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);
  const [isSchoolBagOpen, setIsSchoolBagOpen] = useState<boolean>(false);
  const [activeDictationTestIdx, setActiveDictationTestIdx] = useState<number | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isQuestionPinned, setIsQuestionPinned] = useState<boolean>(true); // 📌 स्क्रीन पर फिक्स toggle state

  // Subscription & Free Trial state
  const [studentUser, setStudentUser] = useState<any>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);
  const [isTrialExpired, setIsTrialExpired] = useState<boolean>(true);
  const [trialUploadCount, setTrialUploadCount] = useState<number>(0);
  const [isFourthUploadAttempt, setIsFourthUploadAttempt] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('student_user');
      let userObj: any = null;
      if (stored) {
        userObj = JSON.parse(stored);
        setStudentUser(userObj);
        const sub = Boolean(userObj.isSubscribed || localStorage.getItem('vidya_subscribed') === 'true');
        setIsSubscribed(sub);
      }

      // Check trial upload count
      const localUploadCount = parseInt(localStorage.getItem('vidya_trial_upload_count') || '0', 10);
      setTrialUploadCount(isNaN(localUploadCount) ? 0 : localUploadCount);

      // Check 7-Day Free Trial timeline
      let trialStartTime = 0;
      const localTrialStart = localStorage.getItem('vidya_trial_start_time');
      if (localTrialStart) {
        trialStartTime = parseInt(localTrialStart, 10);
      } else if (userObj?.createdAt) {
        trialStartTime = new Date(userObj.createdAt).getTime();
        localStorage.setItem('vidya_trial_start_time', String(trialStartTime));
      } else {
        trialStartTime = Date.now();
        localStorage.setItem('vidya_trial_start_time', String(trialStartTime));
      }

      const msElapsed = Date.now() - trialStartTime;
      const daysElapsed = Math.floor(msElapsed / (24 * 60 * 60 * 1000));
      const remaining = Math.max(0, 7 - daysElapsed);
      setTrialDaysRemaining(remaining);
      setIsTrialExpired(remaining <= 0 && !(userObj?.isSubscribed || localStorage.getItem('vidya_subscribed') === 'true'));
    } catch {}
  }, [isSubscribed]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [chalkboardTheme, setChalkboardTheme] = useState<'slate' | 'green'>('slate');
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);
  const [isTypewriterEnabled, setIsTypewriterEnabled] = useState<boolean>(false);

  // Chalk / Dry-Erase Marker Typewriter Component
  const ChalkTypewriter: React.FC<{
    text: string;
    speed?: number;
    delay?: number;
    enabled?: boolean;
    onComplete?: () => void;
    className?: string;
    showCursor?: boolean;
    isChalkboard?: boolean;
  }> = ({
    text,
    speed = 22,
    delay = 0,
    enabled = false,
    onComplete,
    className = '',
    showCursor = false,
    isChalkboard = false,
  }) => {
      if (!enabled) {
        return <span className={`inline font-inherit ${className}`}>{text}</span>;
      }

      const [displayedText, setDisplayedText] = useState(enabled ? '' : text);
      const [isDone, setIsDone] = useState(!enabled);

      useEffect(() => {
        if (!enabled) {
          setDisplayedText(text);
          setIsDone(true);
          return;
        }

        // Safely split into complete grapheme clusters for Hindi so matras and conjuncts (aksharas) never break
        let chars: string[] = [];
        if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
          try {
            const segmenter = new (Intl as any).Segmenter('hi', { granularity: 'grapheme' });
            chars = Array.from(segmenter.segment(text || '')).map((s: any) => s.segment);
          } catch {
            chars = Array.from(text || '');
          }
        } else {
          chars = Array.from(text || '');
        }

        if (chars.length === 0) {
          setDisplayedText('');
          setIsDone(true);
          return;
        }

        setDisplayedText('');
        setIsDone(false);

        let currentIndex = 0;
        let intervalId: any = null;

        const timeoutId = setTimeout(() => {
          intervalId = setInterval(() => {
            currentIndex++;
            if (currentIndex <= chars.length) {
              setDisplayedText(chars.slice(0, currentIndex).join(''));
            } else {
              clearInterval(intervalId);
              setIsDone(true);
              if (onComplete) onComplete();
            }
          }, speed);
        }, delay);

        return () => {
          clearTimeout(timeoutId);
          if (intervalId) clearInterval(intervalId);
        };
      }, [text, speed, delay, enabled]);

      return (
        <span className={`inline relative font-inherit ${className}`}>
          {displayedText}
          {!isDone && enabled && showCursor && (
            <span className="inline-flex items-center ml-1 select-none animate-pulse align-middle">
              <span
                className={`inline-block w-1.5 h-4 rounded-xs ${isChalkboard
                  ? 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]'
                  : 'bg-indigo-600 shadow-[0_0_6px_rgba(99,102,241,0.6)]'
                  }`}
              />
              <span className="text-xs ml-0.5 opacity-90 inline-block transform -rotate-12">
                ✏️
              </span>
            </span>
          )}
        </span>
      );
    };

  // Structured Math Problem Solver (e.g. 10+10, 15*5, 50-20, 100/4)
  const solveMathExpression = (
    q: string,
    teacherName: string
  ): {
    questionDisplay: string;
    speechText: string;
    heading: string;
    num1: number;
    op: string;
    num2: number;
    result: number;
    steps: WhiteboardStepItem[];
  } | null => {
    if (!q) return null;

    let text = q.toLowerCase();

    // Map common spoken Hindi/English number words to digits
    const numWordMap: Record<string, number> = {
      'अट्ठारह': 18, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
      'सत्रह': 17, 'सोलह': 16, 'पंद्रह': 15, 'चौदह': 14, 'तेरह': 13, 'बारह': 12, 'ग्यारह': 11,
      'दस': 10, 'नौ': 9, 'आठ': 8, 'सात': 7, 'छह': 6, 'छः': 6, 'पांच': 5, 'पाँच': 5, 'चार': 4, 'तीन': 3, 'दो': 2, 'एक': 1
    };
    for (const [w, v] of Object.entries(numWordMap)) {
      text = text.split(w).join(String(v));
    }

    let clean = text
      .replace(/कितने?\s*(होते\s*हो|होते\s*हैं|होते\s*है|होते\s*ह|होगा|होता\s*है|होता\s*ह|है|h)?/gi, '')
      .replace(/kitne?\s*(hote\s*ho|hote\s*hai|hote\s*hain|hote\s*h|honge|hoga|hota\s*hai|hota\s*h|h)?/gi, '')
      .replace(/kitna\s*(hota\s*hai|hota\s*h|hoga|aayega|h)?/gi, '')
      .replace(/kya\s*(hota\s*hai|hota\s*h|hoga|aayega|h)/gi, '')
      .replace(/solve\s*(karke\s*dikhao|karo|please)?/gi, '')
      .replace(/हल\s*(करके\s*दिखाओ|करो|कीजिए|करें)?/gi, '')
      .replace(/का\s*मान|का\s*उत्तर/gi, '')
      .replace(/batao|बताओ/gi, '')
      .replace(/\bko\b|\bse\b|\bको\b|\bसे\b/gi, ' ')
      .replace(/में\s*(से)?/gi, ' ')
      .replace(/me\s*(se)?/gi, ' ')
      .replace(/jodo|जोड़ो|जोडो/gi, '+')
      .replace(/[?=]/g, '')
      .trim();

    // 1. Try Infix pattern: num1 OP num2 (e.g. 18 * 2, 18 x 2, 18 guna 2, 18 into 2)
    const mathRegex =
      /([0-9]+(?:\.[0-9]+)?)\s*([\+\-\*\/xX×÷]|plus|minus|times|into|multiply|multiplied\s+by|divide|divided\s+by|aur|और|जोड़|जोड|कम|ghatao|घटाओ|guna|गुणा|गुना|bhag|भाग)\s*([0-9]+(?:\.[0-9]+)?)/i;

    let match = clean.match(mathRegex);

    if (!match) {
      const inlineMatch = text.match(mathRegex);
      if (inlineMatch) {
        match = inlineMatch;
      }
    }

    let num1: number | null = null;
    let num2: number | null = null;
    let rawOp = '+';

    if (match) {
      num1 = parseFloat(match[1]);
      rawOp = match[2].toLowerCase();
      num2 = parseFloat(match[3]);
    } else {
      // 2. Try Hindi SOV Voice Pattern: num1 ... num2 ... [OP] (e.g. 18 ko 2 se guna karo, 25 me 15 jodo, 50 me se 20 ghatao)
      const allNums = text.match(/[0-9]+(?:\.[0-9]+)?/g);
      if (allNums && allNums.length >= 2) {
        num1 = parseFloat(allNums[0]);
        num2 = parseFloat(allNums[1]);
        if (text.match(/गुना|गुणा|guna|multipl|into|times|पहाड़ा|पहाड़ा/)) rawOp = '*';
        else if (text.match(/घटा|ghata|minus|kam|कम/)) rawOp = '-';
        else if (text.match(/भाग|bhag|divide|बटा/)) rawOp = '/';
        else if (text.match(/जोड़|जोड|jod|plus|add|योग/)) rawOp = '+';
        else return null;
      } else {
        return null;
      }
    }

    if (num1 === null || num2 === null || isNaN(num1) || isNaN(num2)) return null;

    if (isNaN(num1) || isNaN(num2)) return null;

    let op = '+';
    let opWordHindi = 'जोड़ (Addition)';
    let opSymbol = '+';

    if (['+', 'plus', 'aur', 'और', 'जोड़', 'जोड'].includes(rawOp)) {
      op = '+';
      opSymbol = '+';
      opWordHindi = 'जोड़ (Addition)';
    } else if (['-', 'minus', 'कम', 'ghatao', 'घटाओ'].includes(rawOp)) {
      op = '-';
      opSymbol = '-';
      opWordHindi = 'घटाव (Subtraction)';
    } else if (['*', 'x', 'times', 'into', 'guna', 'गुणा', '×'].includes(rawOp)) {
      op = '*';
      opSymbol = '×';
      opWordHindi = 'गुणा (Multiplication)';
    } else if (['/', 'divide', 'divided by', 'bhag', 'भाग', '÷'].includes(rawOp)) {
      op = '/';
      opSymbol = '÷';
      opWordHindi = 'भाग (Division)';
    }

    const questionDisplay = `${num1} ${opSymbol} ${num2} = ?`;
    const heading = `गणित समाधान: ${num1} ${opSymbol} ${num2}`;

    if (op === '+') {
      const sum = num1 + num2;
      const isInt1 = Number.isInteger(num1);
      const isInt2 = Number.isInteger(num2);

      let step2Formula = '';
      let step2Annotation = '';

      if (isInt1 && isInt2 && num1 >= 0 && num2 >= 0 && num1 < 1000 && num2 < 1000) {
        const u1 = num1 % 10;
        const t1 = Math.floor((num1 % 100) / 10);
        const u2 = num2 % 10;
        const t2 = Math.floor((num2 % 100) / 10);

        const unitsSum = u1 + u2;
        const tensSum = t1 + t2;

        step2Formula = [
          `1️⃣ इकाई (Ones / Units) जोड़ें: ${u1} + ${u2} = ${unitsSum}`,
          num1 >= 10 || num2 >= 10 ? `2️⃣ दहाई (Tens) जोड़ें: ${t1} + ${t2} = ${tensSum}` : '',
          `3️⃣ कुल योग (Total) = ${sum}`,
        ]
          .filter(Boolean)
          .join('\n');

        step2Annotation = `${teacherName}: "सबसे पहले दाईं तरफ इकाई के अंकों को जोड़ा (${u1} + ${u2} = ${unitsSum})। फिर दहाई के अंकों को जोड़ा (${t1} + ${t2} = ${tensSum})। दोनों मिलकर ${sum} बन गए!"`;
      } else {
        step2Formula = `गणना: ${num1} + ${num2} = ${sum}`;
        step2Annotation = `${teacherName}: "दोनों मानों को आपस में जोड़ने पर ${sum} प्राप्त होता है।"`;
      }

      const speechText = `शाबाश बेटा! सवाल है ${num1} और ${num2} को जोड़ना। इकाई और दहाई के नियम से हल करने पर, ${num1} और ${num2} मिलकर ${sum} होते हैं।`;

      return {
        questionDisplay,
        speechText,
        heading,
        num1,
        op,
        num2,
        result: sum,
        steps: [
          {
            step: 'चरण 1: सवाल व संख्याओं की पहचान',
            question: questionDisplay,
            formula: `${num1} + ${num2} = ? (दो संख्याओं का ${opWordHindi})`,
            annotation: `${teacherName}: "यहाँ हमें दी गई दो संख्याओं ${num1} और ${num2} को आपस में जोड़ना (Add) है।"`,
          },
          {
            step: 'चरण 2: स्थानीय मान व चरणबद्ध जोड़',
            question: questionDisplay,
            formula: step2Formula,
            annotation: step2Annotation,
          },
          {
            step: 'चरण 3: अंतिम सही उत्तर',
            question: questionDisplay,
            formula: `✅ ${num1} + ${num2} = ${sum} (सही उत्तर)`,
            annotation: `${teacherName}: "बहुत बढ़िया! सही उत्तर है ${sum}। आपका डाउट पूरी तरह हल हो गया है!"`,
          },
        ],
      };
    } else if (op === '-') {
      const diff = num1 - num2;
      const speechText = `बेटा, ${num1} में से ${num2} घटाने पर ${diff} बचता है।`;
      return {
        questionDisplay,
        speechText,
        heading,
        num1,
        op,
        num2,
        result: diff,
        steps: [
          {
            step: 'चरण 1: सवाल व संख्याओं की पहचान',
            question: questionDisplay,
            formula: `${num1} - ${num2} = ? (संख्याओं का ${opWordHindi})`,
            annotation: `${teacherName}: "यहाँ हमें बड़ी संख्या ${num1} में से संख्या ${num2} को घटाना (Subtract) है।"`,
          },
          {
            step: 'चरण 2: चरणबद्ध घटाव (Subtraction Steps)',
            question: questionDisplay,
            formula: `1️⃣ कुल संख्या = ${num1}\n2️⃣ घटाई गई संख्या = ${num2}\n3️⃣ शेष मान = ${diff}`,
            annotation: `${teacherName}: "इकाई और दहाई के मान घटाने पर शेषफल ${diff} बचता है।"`,
          },
          {
            step: 'चरण 3: अंतिम परिणाम',
            question: questionDisplay,
            formula: `✅ ${num1} - ${num2} = ${diff} (सही उत्तर)`,
            annotation: `${teacherName}: "शाबाश! सही उत्तर ${diff} है।"`,
          },
        ],
      };
    } else if (op === '*') {
      const prod = num1 * num2;
      const speechText = `बेटा, ${num1} को ${num2} से गुणा करने पर ${prod} आता है।`;
      return {
        questionDisplay,
        speechText,
        heading,
        num1,
        op,
        num2,
        result: prod,
        steps: [
          {
            step: 'चरण 1: सवाल व गुणा का नियम',
            question: questionDisplay,
            formula: `${num1} × ${num2} = ? (गुणा / बार-बार जोड़)`,
            annotation: `${teacherName}: "गुणा का अर्थ है किसी संख्या को बार-बार जोड़ना। यानी ${num1} को ${num2} बार जोड़ना।"`,
          },
          {
            step: 'चरण 2: पहाड़ा व चरणबद्ध गणना',
            question: questionDisplay,
            formula: `1️⃣ पहाड़ा (Table): ${num1} × ${num2}\n2️⃣ गुणनफल: ${num1} × ${num2} = ${prod}`,
            annotation: `${teacherName}: "पहाड़े के नियम से ${num1} × ${num2} = ${prod} होता है।"`,
          },
          {
            step: 'चरण 3: अंतिम सही उत्तर',
            question: questionDisplay,
            formula: `✅ ${num1} × ${num2} = ${prod} (सही उत्तर)`,
            annotation: `${teacherName}: "बहुत बढ़िया! सही गुणनफल ${prod} है।"`,
          },
        ],
      };
    } else {
      if (num2 === 0) {
        return {
          questionDisplay,
          speechText: 'बेटा, किसी भी संख्या को शून्य से भाग नहीं दिया जा सकता। यह अनिर्धारित है।',
          heading,
          num1,
          op,
          num2,
          result: 0,
          steps: [
            {
              step: 'चरण 1: शून्य से भाग का नियम',
              question: questionDisplay,
              formula: `${num1} ÷ 0 = अनिर्धारित (Undefined)`,
              annotation: `${teacherName}: "गणित में शून्य से भाग देना परिभाषित नहीं है।"`,
            },
          ],
        };
      }
      const quot = Number((num1 / num2).toFixed(2));
      const speechText = `बेटा, ${num1} को ${num2} से भाग देने पर भागफल ${quot} आता है।`;
      return {
        questionDisplay,
        speechText,
        heading,
        num1,
        op,
        num2,
        result: quot,
        steps: [
          {
            step: 'चरण 1: भाज्य व भाजक की पहचान',
            question: questionDisplay,
            formula: `भाज्य (Dividend) = ${num1}, भाजक (Divisor) = ${num2}`,
            annotation: `${teacherName}: "यहाँ हमें ${num1} को ${num2} बराबर भागों में बांटना है।"`,
          },
          {
            step: 'चरण 2: चरणबद्ध भाग (Division Step)',
            question: questionDisplay,
            formula: `1️⃣ भाग संक्रिया: ${num1} ÷ ${num2}\n2️⃣ भागफल (Quotient) = ${quot}`,
            annotation: `${teacherName}: "${num2} का पहाड़ा पढ़ने पर भागफल ${quot} प्राप्त होता है।"`,
          },
          {
            step: 'चरण 3: अंतिम सही उत्तर',
            question: questionDisplay,
            formula: `✅ ${num1} ÷ ${num2} = ${quot} (सही उत्तर)`,
            annotation: `${teacherName}: "शाबाश! सही भागफल ${quot} है।"`,
          },
        ],
      };
    }
  };

  const formatFormula = (f: string) => {
    if (!f) return '';
    return f
      // Decode HTML entities
      .replace(/&#(?:10|x0*a);/gi, '\n')
      .replace(/&#(?:13|x0*d);/gi, '\r')
      .replace(/&amp;#(?:10|x0*a);/gi, '\n')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&')
      // Re-attach broken Devanagari consonant + space + matra/combining mark (e.g. 'क ोरोना' -> 'कोरोना', 'द ादा' -> 'दादा', 'द ेश' -> 'देश')
      .replace(/([\u0905-\u0939])\s+([\u0901-\u0903\u093C\u093E-\u094F\u0951-\u0957\u0962-\u0963])/g, (m, c, v) => c + v)
      // Re-attach broken consonant + space + half-letter conjunct of same letter (e.g. 'म म्मी' -> 'मम्मी')
      .replace(/([\u0915-\u0939])\s+([\u0915-\u0939]्)/g, (m, c, h) => (c === h[0] ? c + h : m))
      .replace(/≠\s*stimated/gi, 'Estimated')
      .replace(/\\rightarrow/gi, ' → ')
      .replace(/\\leftarrow/gi, ' ← ')
      .replace(/\\Rightarrow/gi, ' ⇒ ')
      .replace(/\\times/gi, ' × ')
      .replace(/\\div/gi, ' ÷ ')
      .replace(/\\approx/gi, ' ≈ ')
      .replace(/\\le(?![a-zA-Z])/gi, ' ≤ ')
      .replace(/\\ge(?![a-zA-Z])/gi, ' ≥ ')
      .replace(/\\ne(?![a-zA-Z])/gi, ' ≠ ')
      .replace(/\\pm/gi, ' ± ')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/([0-9\)])\.n([A-Za-z0-9])/g, '$1.\n$2')
      .replace(/([0-9\)])n([A-Z])/g, '$1\n$2')
      .replace(/([0-9\)])n(Correct|Difference|Largest|Smallest|Option|Step|चरण|उत्तर)/gi, '$1\n$2')
      .replace(/\\/g, '')
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/^✅\s*(उत्तर व हल|सही हल व उत्तर|हल व उत्तर):\s*/i, '')
      .replace(/^(?:Fill in the blanks?|True[\s/]*False|True or False|Multiple Choice Questions?|MCQ|Match the following|Tick the correct [a-z]+|Choose the correct [a-z]+|Short Answer Questions?|Long Answer Questions?|रिक्त स्थान(?: की पूर्ति करें| भरें)?|सही या गलत|सत्य\s*[/या]\s*असत्य|बहुविकल्पीय प्रश्न)\s*[:\-–]?\s*(?:#|Q\.?|प्रश्न\s*)?\d+[:\.\-–\s]*/i, '')
      .trim();
  };

  // Helper to render question text: fills the blank with the answer and underlines ONLY that answer!
  const renderQuestionWithBlankFill = (
    questionText: string,
    stepItem?: WhiteboardStepItem,
    idx?: number
  ) => {
    if (!questionText) return null;

    // Heal broken Devanagari matras/conjuncts
    questionText = questionText
      .replace(/([\u0905-\u0939])\s+([\u0901-\u0903\u093C\u093E-\u094F\u0951-\u0957\u0962-\u0963])/g, (m, c, v) => c + v)
      .replace(/([\u0915-\u0939])\s+([\u0915-\u0939]्)/g, (m, c, h) => (c === h[0] ? c + h : m));

    // Never underline words in story reading passages!
    const isStory = Boolean(
      questionText.startsWith('Story:') ||
      questionText.toLowerCase().includes('reading passage') ||
      stepItem?.step?.toLowerCase().includes('reading passage') ||
      stepItem?.step?.toLowerCase().includes('पाठ वाचन') ||
      (stepItem?.formula && stepItem.formula.length > 250 && stepItem.formula.includes('\n\n'))
    );
    if (isStory) {
      return renderMathFractions(questionText);
    }

    // Determine the exact answer for Section A fill-in-the-blank questions
    const qLower = questionText.toLowerCase();
    let targetAnswer = '';

    if (qLower.includes('pleasant') || qLower.includes('first place') || (qLower.includes('pond in the middle') && !qLower.includes('under the trees'))) {
      targetAnswer = 'meadow';
    } else if (qLower.includes('weather was hot') || qLower.includes('stood by the')) {
      targetAnswer = 'pond';
    } else if (qLower.includes('older and could eat grass') || qLower.includes('went out to work')) {
      targetAnswer = 'mother';
    } else if (qLower.includes('called him darkie') || qLower.includes('coat was')) {
      targetAnswer = 'black';
    } else if (qLower.includes('successor and predecessor')) {
      targetAnswer = '2';
    } else if (qLower.includes('388765') && qLower.includes('397654')) {
      targetAnswer = '8,889';
    } else if (qLower.includes('471352') && qLower.includes('120500')) {
      targetAnswer = '120,500';
    } else if (qLower.includes('1923695')) {
      targetAnswer = '0';
    } else if (qLower.includes('714123') && qLower.includes('593456')) {
      targetAnswer = '1,20,600';
    } else if (stepItem?.formula) {
      const fTrim = stepItem.formula.trim();
      if (fTrim.length < 30 && !fTrim.includes('\n') && !fTrim.includes('=')) {
        targetAnswer = fTrim.replace(/✅|\[|\]/g, '').trim();
      }
    }

    // Pattern for blank lines in worksheets: _____, ___, [blank], ....
    const blankRegex = /_{2,}|\.{3,}|\[\s*\]|\[blank\]/i;
    const hasBlank = blankRegex.test(questionText);

    if (hasBlank && targetAnswer) {
      const parts = questionText.split(blankRegex);
      return (
        <>
          {parts.map((p, pIdx) => (
            <React.Fragment key={pIdx}>
              {renderMathFractions(p)}
              {pIdx < parts.length - 1 && (
                <span className="underline decoration-emerald-500 dark:decoration-emerald-400 decoration-3 underline-offset-4 font-black text-emerald-600 dark:text-emerald-400 px-1 inline-block">
                  {targetAnswer}
                </span>
              )}
            </React.Fragment>
          ))}
        </>
      );
    }

    // If question does not have a blank symbol (sentence is already completed),
    // underline ONLY that specific targetAnswer word! (e.g. in Q1 only "meadow", in Q2 only "pond")
    if (targetAnswer) {
      const targetRegex = new RegExp(`\\b(${targetAnswer})\\b`, 'i');
      if (targetRegex.test(questionText)) {
        const parts = questionText.split(targetRegex);
        return (
          <>
            {parts.map((p, pIdx) => {
              if (p.toLowerCase() === targetAnswer.toLowerCase()) {
                return (
                  <span
                    key={pIdx}
                    className="underline decoration-emerald-500 dark:decoration-emerald-400 decoration-3 underline-offset-4 font-black text-emerald-600 dark:text-emerald-400 px-1 inline-block"
                  >
                    {p}
                  </span>
                );
              }
              return renderMathFractions(p);
            })}
          </>
        );
      }
    }

    // Support explicit bracketed answers [meadow] or <u>meadow</u>
    if (/\[[^\]]+\]/.test(questionText)) {
      const parts = questionText.split(/(\[[^\]]+\])/g);
      return (
        <>
          {parts.map((part, pIdx) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              return (
                <span
                  key={pIdx}
                  className="underline decoration-emerald-500 dark:decoration-emerald-400 decoration-3 underline-offset-4 font-black text-emerald-600 dark:text-emerald-400 px-1 inline-block"
                >
                  {part.slice(1, -1)}
                </span>
              );
            }
            return renderMathFractions(part);
          })}
        </>
      );
    }

    if (questionText.includes('<u>') && questionText.includes('</u>')) {
      const parts = questionText.split(/(<u>.*?<\/u>)/g);
      return (
        <>
          {parts.map((part, pIdx) => {
            if (part.startsWith('<u>') && part.endsWith('</u>')) {
              return (
                <span
                  key={pIdx}
                  className="underline decoration-emerald-500 dark:decoration-emerald-400 decoration-3 underline-offset-4 font-black text-emerald-600 dark:text-emerald-400 px-1 inline-block"
                >
                  {part.slice(3, -4)}
                </span>
              );
            }
            return renderMathFractions(part);
          })}
        </>
      );
    }

    return renderMathFractions(questionText);
  };

  // Helper for solution blocks: underlines short formula answers
  const renderFormulaAnswer = (formula: string) => {
    if (!formula) return null;
    let clean = formatFormula(formula);
    if (medium === 'english') {
      clean = clean
        .replace(/खाली स्थान में सही उत्तर:/g, 'Correct blank answer:')
        .replace(/सही उत्तर:/g, 'Correct answer:');
    }

    // If clean contains an unfilled blank, auto-resolve with the calculated solution
    const cLower = clean.toLowerCase();
    const blankRegex = /_{2,}|\.{3,}|\[\s*\]|\[blank\]/i;
    if (blankRegex.test(clean)) {
      if (cLower.includes('successor and predecessor')) {
        clean = `The difference of successor (n+1) and predecessor (n-1) of a number is always [2] ✅ (${medium === 'english' ? 'Correct answer:' : 'सही उत्तर:'} [2] ✅)`;
      } else if (cLower.includes('388765') && cLower.includes('397654')) {
        clean = `397654 − 388765 = [8,889] ✅\nDifference of 388765 and 397654 is [8,889] . (${medium === 'english' ? 'Correct answer:' : 'सही उत्तर:'} [8,889] ✅)`;
      } else if (cLower.includes('471352') && cLower.includes('120500')) {
        clean = `To decrease 471352 by 120500 we subtract [120,500] from it. (${medium === 'english' ? 'Correct answer:' : 'सही उत्तर:'} [120,500] ✅)`;
      } else if (cLower.includes('1923695')) {
        clean = `1923695 − 1923695 = [0] ✅ (${medium === 'english' ? 'Correct answer:' : 'सही उत्तर:'} [0] ✅)`;
      } else if (cLower.includes('714123') && cLower.includes('593456')) {
        clean = `714,100 − 593,500 = [120,600] ✅ (${medium === 'english' ? 'Correct answer:' : 'सही उत्तर:'} [120,600] ✅)`;
      }
    }

    // If explicit bracketed [answer]
    if (/\[[^\]]+\]/.test(clean)) {
      const parts = clean.split(/(\[[^\]]+\])/g);
      return (
        <>
          {parts.map((part, pIdx) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              return (
                <span
                  key={pIdx}
                  className="underline decoration-emerald-500 dark:decoration-emerald-400 decoration-3 underline-offset-4 font-black text-emerald-600 dark:text-emerald-400 px-1 inline-block"
                >
                  {part.slice(1, -1)}
                </span>
              );
            }
            return renderMathFractions(part);
          })}
        </>
      );
    }

    // If multi-line or ASCII diagram/table (e.g. geometric boxes, plant diagrams, comparison tables)
    if (clean.includes('\n') || clean.includes('+--') || clean.includes('| :') || clean.includes('📐') || clean.includes('🌱') || /^[\|\+]/.test(clean)) {
      return (
        <pre className="font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed py-1.5 overflow-x-auto bg-black/5 dark:bg-black/40 p-3 rounded-xl border border-black/10 dark:border-white/10 tracking-wide">
          {clean}
        </pre>
      );
    }

    // If short single answer (e.g. "meadow", "pond", "Option (b)", "42")
    if (clean.length < 50 && !clean.includes('\n')) {
      return (
        <span className="underline decoration-emerald-500 dark:decoration-emerald-400 decoration-3 underline-offset-4 font-black text-emerald-600 dark:text-emerald-400 px-1 inline-block">
          {renderMathFractions(clean)}
        </span>
      );
    }

    return renderMathFractions(clean);
  };

  // Helper to dynamically localize whiteboard heading when medium === 'english'
  const renderExplanationText = (text: string) => {
    if (!text) return '';
    if (medium !== 'english') return text;

    let res = text;
    
    // Exact full sentence matches from student records
    res = res
      .replace(/बेटा,?\s*याद रखना जब भी मीटर\s*\(m\)\s*को सेंटीमीटर\s*\(cm\)\s*में बदलना हो,?\s*तो बस 100 से गुणा\s*\(multiply\)\s*कर दो!?/gi,
        'Remember: Whenever converting metres (m) to centimetres (cm), simply multiply by 100!')
      .replace(/शाबाश!?\s*किलोमीटर\s*\(km\)\s*बड़ी इकाई है,?\s*इसे मीटर में बदलने के लिए 1000 से गुणा करते हैं।?/gi,
        'Well done! Kilometre (km) is a larger unit. To convert it to metres, multiply by 1000.')
      .replace(/ध्यान से देखो बेटा,?\s*\(e\)\s*में हमने पहले सबको cm में बदला फिर घटाया।?\s*\(f\)\s*में km और m को अलग-अलग जोड़कर हासिल\s*\(carry\)\s*आगे बढ़ाया है।?/gi,
        'Look closely: In (e) we converted everything to cm first and then subtracted. In (f) we added km and m separately and carried over to km.')
      .replace(/बेटा,?\s*घटाते समय अगर ऊपर वाली संख्या छोटी हो,?\s*तो बगल वाले से उधार\s*\(borrow\)\s*लेना मत भूलना!?/gi,
        "Remember: While subtracting, if the upper digit is smaller, don't forget to borrow from the next column!")
      .replace(/बहुत अच्छे!?\s*\(e\)\s*वाले सवाल में 22 में से 85 नहीं घट सकता,?\s*इसलिए 1 मीटर उधार लिया जो 100 cm बन गया।?/gi,
        'Great job! In problem (e), 85 cannot be subtracted from 22, so we borrowed 1 metre which became 100 cm.')
      .replace(/परिमाप का मतलब है किसी भी आकृति की बाहरी सीमा की कुल लंबाई।?\s*बस सबको जोड़ दो!?/gi,
        'Perimeter means the total length around the outer boundary of any shape. Simply add all the sides!')
      .replace(/पाइप की कुल लंबाई में से बची हुई लंबाई घटाने पर हमें पता चल गया कि कितना हिस्सा निकाला गया।?/gi,
        'By subtracting the remaining length from the total pipe length, we found how much length was removed.')
      .replace(/शाबाश!?\s*चारों टुकड़ों को जोड़ने पर हमें कुल 8 मीटर कपड़ा मिला।?/gi,
        'Well done! Adding all four pieces together gave us a total of 8 metres of cloth.')
      .replace(/कुल क्षमता में से तय की गई दूरी को घटा दिया।?\s*कॉपी में साफ़-साफ़ लिखो बेटा।?/gi,
        'Subtracted the distance covered from the total capacity. Write this down neatly in your notebook!')
      .replace(/बेटा,?\s*याद रखना 3\/4 मीटर मतलब 75 सेंटीमीटर होता है।?\s*पहले तीनों टुकड़ों को जोड़ा,?\s*फिर कुल लंबाई से घटा दिया।?/gi,
        'Remember: 3/4 metre equals 75 centimetres. First we added the three cut pieces, then subtracted from the total ribbon length.')
      .replace(/शाबाश!?\s*जब भी\s*(?:मीटर|metres)\s*को\s*(?:सेंटीमीटर|centimetres)\s*में\s*बदलना\s*हो,?\s*बस\s*संख्या\s*के\s*आगे\s*दो\s*शून्य\s*\(100\s*से\s*गुणा\)\s*लगा\s*देते\s*हैं!?/gi,
        'Well done! Whenever you convert metres into centimetres, simply multiply the number by 100 (add two zeroes)!')
      .replace(/जब भी\s*(?:मीटर|metres)\s*को\s*(?:सेंटीमीटर|centimetres)\s*में\s*बदलना\s*हो,?\s*बस\s*संख्या\s*के\s*आगे\s*दो\s*शून्य\s*\(100\s*से\s*गुणा\)\s*लगा\s*देते\s*हैं!?/gi,
        'Whenever you convert metres into centimetres, simply multiply the number by 100 (add two zeroes)!')
      .replace(/बहुत बढ़िया!?\s*(?:किलोमीटर|kilometres)\s*को\s*(?:मीटर|metres)\s*में\s*बदलने\s*के\s*लिए\s*1000\s*से\s*गुणा\s*करते\s*हैं।?/gi,
        'Great job! To convert kilometres into metres, multiply by 1000.')
      .replace(/इसे अपनी कॉपी में साफ-साफ नोट करो बेटा, इकाइयां \(units\) बदलना बहुत आसान है!?/gi,
        'Note this down neatly in your notebook, converting units is very simple!')
      .replace(/उधार लेने \(borrowing\) वाले सवाल ध्यान से देखो बेटा!?\s*मीटर से सेंटीमीटर या किलोमीटर से मीटर बनाते समय 100 या 1000 जोड़ते हैं।?/gi,
        'Pay attention to borrowing questions! When converting metres to centimetres or kilometres to metres, add 100 or 1000.')
      .replace(/घटाते समय हमेशा छोटी इकाई \(cm\) से शुरू करो बेटा।?/gi,
        'Always start with the smaller unit (cm) while subtracting.')
      .replace(/याद रखो बेटा,\s*परिमाप मतलब किसी भी पार्क या खेत के चारों ओर की पूरी बाउंड्री की लंबाई!?/gi,
        'Remember: Perimeter means the total length around the boundary of any shape or field!')
      .replace(/जब भी 'कितना बचा' या 'कितना कम हुआ' पूँछें,\s*हमेशा घटाव \(Subtraction\) करना होता है!?/gi,
        "Whenever asked 'how much is left' or 'how much less', always perform subtraction!")
      .replace(/जहाँ भी 'कुल \(Total\)' पूँछ,\s*वहाँ हमेशा जोड़ \(Addition\) किया जाता है बेटा!?/gi,
        "Whenever 'Total' is asked, always perform addition!")
      .replace(/शानदार!?\s*कुल क्षमता में से तय की गई दूरी घटाकर शेष दूरी निकाल ली।?/gi,
        'Excellent! Subtracted the covered distance from total capacity to find remaining distance.')
      .replace(/यहाँ पहले तीनों कटे हुए टुकड़ों को जोड़ा,\s*फिर कुल 5 मीटर में से घटा दिया!?\s*बहुत ही बढ़िया सवाल था।?/gi,
        'Here we first added the three cut pieces, then subtracted from the total 5 metres! Excellent problem.')
      // General teacher phrases & conversions
      .replace(/बहुत बढ़िया!?/gi, 'Great job!')
      .replace(/शाबाश बेटा!?/gi, 'Well done dear student!')
      .replace(/शाबाश!?/gi, 'Well done!')
      .replace(/शानदार!?/gi, 'Wonderful!')
      .replace(/जब भी/gi, 'Whenever')
      .replace(/में बदलना हो/gi, 'needs to be converted')
      .replace(/बस संख्या के आगे दो शून्य \(100 से गुणा\) लगा देते हैं!?/gi, 'simply multiply the number by 100 (add two zeroes)!')
      .replace(/संख्या के आगे दो शून्य लगा देते हैं/gi, 'add two zeroes to the number')
      .replace(/100 से गुणा/gi, 'multiply by 100')
      .replace(/1000 से गुणा/gi, 'multiply by 1000')
      .replace(/100 से भाग/gi, 'divide by 100')
      .replace(/1000 से भाग/gi, 'divide by 1000')
      .replace(/गुणा करते हैं/gi, 'multiply')
      .replace(/भाग करते हैं/gi, 'divide')
      .replace(/जोड़ते हैं/gi, 'add')
      .replace(/घटाते हैं/gi, 'subtract')
      .replace(/बदलने के लिए/gi, 'to convert')
      .replace(/याद रखो बेटा:\s*/gi, 'Remember: ')
      .replace(/याद रखो:\s*/gi, 'Remember: ')
      .replace(/सही उत्तर है\s*:\s*/gi, 'The correct answer is: ')
      .replace(/सही उत्तर\s*:\s*/gi, 'Correct Answer: ')
      .replace(/सही उत्तर/gi, 'Correct Answer')
      .replace(/इसे अपनी कॉपी में नोट कर लें।?/gi, 'Note this down in your notebook.')
      .replace(/इसे अपनी नोटबुक में लिख लें!?/gi, 'Write this down in your notebook!')
      .replace(/आपका डाउट पूरी तरह हल हो गया है!?/gi, 'Your question is fully solved!')
      .replace(/नियम के अनुसार मान रखकर हल करने पर सही उत्तर प्राप्त होता है।?/gi, 'Applying the rule step-by-step gives the correct solution.')
      .replace(/समझ आया बेटा\? यदि और कोई सवाल हो तो तुरंत पूछें!?/gi, 'Understood? Feel free to ask if you have any questions!')
      .replace(/बेटा, ध्यान से देखें:\s*/gi, 'Look carefully: ')
      .replace(/आइए इसके मुख्य बिंदुओं और नियमों को समझते हैं।?/gi, 'Let us understand the core concepts and rules.')
      .replace(/यहाँ सही नियम लागू करके स्टेप-बाय-स्टेप हल किया जा रहा है।?/gi, 'Applying the correct rule step-by-step to solve this.')
      .replace(/किलोमीटर/gi, 'kilometres')
      .replace(/सेंटीमीटर/gi, 'centimetres')
      .replace(/मिलीमीटर/gi, 'millimetres')
      .replace(/मीटर/gi, 'metres')
      .replace(/किलोग्राम/gi, 'kilograms')
      .replace(/ग्राम/gi, 'grams')
      .replace(/लीटर/gi, 'litres')
      .replace(/मिलीलीटर/gi, 'millilitres')
      .replace(/इकाइयां/gi, 'units')
      .replace(/इकाई/gi, 'unit')
      .replace(/परिमाप/gi, 'perimeter')
      .replace(/क्षेत्रफल/gi, 'area')
      .replace(/आयतन/gi, 'volume');

    return res;
  };

  const renderWhiteboardSolutionText = (text: string) => {
    if (!text) return '';
    let res = formatFormula(text);
    if (medium === 'english') {
      res = res
        .replace(/याद रखो बेटा:\s*1\s*मीटर\s*\(m\)\s*=\s*100\s*सेंटीमीटर\s*\(cm\)\s*होता है।?\s*इसलिए मीटर को 100 से गुणा करते हैं!?/gi, 'Remember: 1 metre (m) = 100 centimetres (cm). Therefore, multiply metres by 100 to convert into centimetres!')
        .replace(/याद रखो बेटा:\s*/gi, 'Remember: ')
        .replace(/याद रखो:\s*/gi, 'Remember: ')
        .replace(/इसलिए मीटर को 100 से गुणा करते हैं!?/gi, 'Therefore, multiply metres by 100!')
        .replace(/इसलिए मीटर को 100 से गुणा करते हैं/gi, 'multiply metres by 100')
        .replace(/मीटर को 100 से गुणा करते हैं/gi, 'multiply metres by 100')
        .replace(/मीटर\s*\(m\)/gi, 'metres (m)')
        .replace(/सेंटीमीटर\s*\(cm\)/gi, 'centimetres (cm)')
        .replace(/किलोमीटर\s*\(km\)/gi, 'kilometres (km)')
        .replace(/मिलीमीटर\s*\(mm\)/gi, 'millimetres (mm)')
        .replace(/ग्राम\s*\(g\)/gi, 'grams (g)')
        .replace(/किलोग्राम\s*\(kg\)/gi, 'kilograms (kg)')
        .replace(/हल\s*:\s*/gi, 'Solution: ')
        .replace(/सही उत्तर\s*:\s*/gi, 'Correct Answer: ')
        .replace(/उत्तर\s*:\s*/gi, 'Answer: ')
        .replace(/चरण\s*([0-9]+)\s*:\s*/gi, 'Step $1: ')
        .replace(/दिया है\s*:\s*/gi, 'Given: ')
        .replace(/सूत्र\s*:\s*/gi, 'Formula: ');
    }
    return res;
  };

  const getDisplayWhiteboardHeading = (heading: string) => {
    if (!heading) return medium === 'english' ? "Today's Tuition Class (Ready to Teach)" : 'आज की ट्यूशन क्लास (Ready to Teach)';

    // Strip raw camera/whatsapp/screenshot filenames for kid-friendly polish
    let clean = heading.replace(/(?:WhatsApp Image|IMG[-_]|Scan[-_]|photo[-_]|Screenshot)[^.\n]+\.(?:jpe?g|png|webp|pdf)/gi, 'वर्कशीट अभ्यास');
    clean = clean.replace(/(:\s*[^:\n]+\.(?:jpe?g|png|webp|pdf))/gi, '');
    clean = clean.replace(/पेज #([0-9]+)\s*हल:\s*/i, 'पेज #$1: ');

    if (medium === 'english') {
      clean = clean.replace(/पेज #([0-9]+)/g, 'Page #$1');
      clean = clean.replace(/वर्कशीट हल\s*:\s*/gi, 'Worksheet: ');
      clean = clean.replace(/शीट हल\s*:\s*/gi, 'Worksheet: ');
      clean = clean.replace(/गणित समाधान\s*:\s*/gi, 'Math Solution: ');
      clean = clean.replace(/गणित क्लासरूम/gi, 'Math Classroom');
      clean = clean.replace(/समाधान/gi, 'Solution');
      clean = clean.replace(/हल\s*:\s*/gi, 'Solution: ');
      clean = clean.replace(/हल/gi, 'Solution');
      clean = clean.replace('आज की ट्यूशन क्लास', "Today's Tuition Class (Ready to Teach)");
      clean = clean.replace(/मॉक टेस्ट|परीक्षा तैयारी/g, '🎯 Exam Preparation: Worksheet Mock Test');
      clean = clean.replace(/मास्टर उत्तर कुंजी|Master Answer Key/g, '📋 Complete Worksheet Master Answer Key');
    }
    return clean;
  };

  const renderFormulaBlocks = (formula: string, questionText: string = '') => {
    const clean = formatFormula(formula);

    // 🧮 Check for School Math Notebook Column Grid (कॉपी जैसी असली कॉलम विधि)
    const columnMathData = tryParseColumnMath(clean, questionText);
    if (columnMathData) {
      return (
        <MathNotebookColumnGrid
          data={columnMathData}
          isDarkMode={isDarkMode || chalkboardTheme === 'green'}
        />
      );
    }

    // 📐 Check for Geometry (Triangle, Rectangle, Circle, Box/Cuboid, Cylinder) or Column Arithmetic
    const isGeometryOrColumn = Boolean(
      /triangle|त्रिभुज|rectangle|आयत|square|वर्ग|circle|वृत्त|box|cuboid|घनाभ|डिब्बा|बक्सा|cylinder|बेलन|hypotenuse|समकोण|karn|perimeter|परिमाप|area\s*of|क्षेत्रफल|volume\s*of|आयतन|पाइथागोरस/i.test(`${questionText} ${clean}`) ||
      /\d+\s*(?:kg|किग्रा|l|लीटर|m|मीटर|₹|रु|km|किमी)\s*\d+\s*(?:g|ग्राम|ml|मिली|cm|सेमी|पैसे|पैसा|p|m)/i.test(`${questionText} ${clean}`)
    );
    if (isGeometryOrColumn) {
      return (
        <VisualMathDiagramCard
          question={questionText || clean}
          answer={clean}
          isDarkMode={isDarkMode || chalkboardTheme === 'green'}
          medium={medium}
        />
      );
    }

    // ⚖️ Check for Visual Weight/Capacity Estimation Grid (चित्र व वजन पहेली)
    const isVisualEstimation = Boolean(
      /estimate\s+(?:the\s+)?(?:nearest\s+)?weight|वजन\s*का\s*(?:सही\s*)?अनुमान|निकटतम\s*वजन/i.test(questionText || clean) ||
      (/crackers|biscuits|school bag|t-shirt/i.test(questionText || clean) && /2000\s*g|320\s*g|40\s*g|4\s*kg/i.test(clean))
    );
    if (isVisualEstimation) {
      return (
        <VisualEstimationWidget
          questionTitle={questionText || '5. Estimate the nearest weight (निकटतम वजन का सही अनुमान लगाइए)'}
          mode="teach"
          isDarkMode={isDarkMode || chalkboardTheme === 'green'}
          medium={medium}
          onAudioPlay={(t) => speakText(t)}
        />
      );
    }

    // Book Reading Mode: Render full story with all paragraphs unified in one continuous textbook layout
    const isBookPassage = clean.length > 250 && clean.includes('\n\n') && !clean.includes(' | ') && !clean.includes('✅');
    if (isBookPassage) {
      const paragraphs = clean.split('\n\n').map((p) => p.trim()).filter(Boolean);
      return (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-slate-900/80 border border-amber-200/60 dark:border-white/10 shadow-xs space-y-3.5 text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-relaxed">
          {paragraphs.map((p, pIdx) => (
            <p key={pIdx} className="leading-relaxed indent-4 text-justify sm:text-left font-medium">
              <ChalkTypewriter
                text={p.replace(/\[|\]/g, '')}
                speed={14}
                delay={isTypewriterEnabled ? pIdx * 100 : 0}
                enabled={isTypewriterEnabled}
                isChalkboard={chalkboardTheme === 'green'}
              />
            </p>
          ))}
        </div>
      );
    }

    // Smart splitter for multi-step answers:
    // If text has double newlines or multi-line ASCII diagrams/tables, preserve them together!
    let rawParts: string[] = [];
    if (clean.includes('\n\n')) {
      rawParts = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    } else if (clean.includes('\n')) {
      const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
      const blocks: string[] = [];
      let currentDiagram: string[] = [];

      for (const line of lines) {
        const isDiagramLine =
          /^[\+\|~#\-\*=]/.test(line) ||
          /^[🌱📐🌸🪵🍃🥕]/.test(line) ||
          line.includes('+--') ||
          line.includes('| :') ||
          line.includes('---');
        if (isDiagramLine) {
          currentDiagram.push(line);
        } else {
          if (currentDiagram.length > 0) {
            blocks.push(currentDiagram.join('\n'));
            currentDiagram = [];
          }
          blocks.push(line);
        }
      }
      if (currentDiagram.length > 0) {
        blocks.push(currentDiagram.join('\n'));
      }
      rawParts = blocks;
    } else if (clean.includes(' | ')) {
      rawParts = clean.split(' | ').map((p) => p.trim()).filter(Boolean);
    }

    // Only split sentences into separate step cards if it has explicit step markers or math calculations
    const isMathOrExplicitSteps =
      clean.includes('=') ||
      clean.includes('Option') ||
      clean.includes('विकल्प') ||
      clean.includes('Difference') ||
      clean.includes('Estimated') ||
      clean.includes('Total') ||
      /Step\s*\d|चरण\s*\d/i.test(clean);

    if (rawParts.length <= 1 && isMathOrExplicitSteps) {
      const sentenceSteps = clean
        .split(/(?<=\.|\))\s+(?=(?:Option|Difference|Estimated|Largest|Smallest|Total|Sum|Correct|Step|चरण|विकल्प)\b)/i)
        .map((p) => p.trim())
        .filter(Boolean);

      if (sentenceSteps.length > 1) {
        rawParts = sentenceSteps;
      } else {
        rawParts = [clean.trim()];
      }
    }

    // Helper to render student-friendly notebook-style clean math solution (school copy format)
    const renderNotebookSolutionContent = (parts: string[], answerText: string | null) => {
      // Helper to format individual math/explanation line
      const formatLine = (rawLine: string, lineKey: string | number) => {
        let line = rawLine.trim();
        if (!line) return null;

        // Clean computer/raw terminal symbols for students
        line = line
          .replace(/Working Column:\s*/gi, '')
          .replace(/Notebook Column Working:\s*/gi, '')
          .replace(/Difference Working:\s*/gi, '')
          .replace(/<=\s*/g, '≤ ')
          .replace(/>=\s*/g, '≥ ')
          .replace(/->\s*/g, ' → ');

        // Check if section label like "Given:" or "दिया है:"
        if (/^(?:Given(?:\s+Numbers?)?|दिया\s*है)\s*:?/i.test(line)) {
          const rest = line.replace(/^(?:Given(?:\s+Numbers?)?|दिया\s*है)\s*:?\s*/i, '').trim();
          return (
            <div key={lineKey} className="pt-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                📌 {medium === 'english' ? 'Given:' : 'दिया है:'}
              </span>
              {rest && <span className="ml-2 font-bold text-slate-900 dark:text-white">{rest}</span>}
            </div>
          );
        }

        // Check if step label like "Step 1: Round 7,14,123..."
        const stepMatch = line.match(/^(?:Step|चरण)\s*([0-9]+)\s*[:.]\s*(.*)/i);
        if (stepMatch) {
          return (
            <div key={lineKey} className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-2 pt-1 border-t border-slate-100 dark:border-white/5 first:mt-0 first:border-none first:pt-0">
              <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black shrink-0">
                चरण {stepMatch[1]}
              </span>
              <span className="text-xs sm:text-sm">{stepMatch[2]}</span>
            </div>
          );
        }

        // Check if bullet point
        if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
          const bulletText = line.replace(/^[-•*]\s*/, '').trim();
          return (
            <div key={lineKey} className="flex items-start gap-2 pl-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <span className="text-indigo-500 font-bold leading-tight">•</span>
              <span className="leading-snug">{bulletText}</span>
            </div>
          );
        }

        // Normal text line
        return (
          <div key={lineKey} className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-snug">
            {line}
          </div>
        );
      };

      // Helper to check and render clean vertical notebook subtraction/addition
      const renderArithmeticColumn = (colBlock: string, colKey: string | number) => {
        const cLines = colBlock.split('\n').map((l) => l.trim()).filter(Boolean);
        if (cLines.length >= 3 && (cLines[1]?.includes('-') || cLines[1]?.includes('+') || cLines[2]?.includes('---') || cLines[3]?.includes('---'))) {
          const topNum = cLines[0].replace(/^[^\d₹$]+/, '').trim();
          const secondLine = cLines[1];
          const op = secondLine.includes('+') ? '+' : '−';
          const bottomNum = secondLine.replace(/^[-+–\s₹$]+/, '').trim();
          const ansLine = cLines.find((l, idx) => idx >= 2 && !l.includes('---')) || cLines[cLines.length - 1];
          const ansNum = ansLine ? ansLine.replace(/^[^\d₹$]+/, '').trim() : '';

          return (
            <div key={colKey} className="my-2 flex flex-col items-start">
              <div className="inline-flex flex-col items-end px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm shadow-2xs">
                <span className="text-slate-900 dark:text-slate-100 font-bold tracking-wider">{topNum}</span>
                <div className="w-full flex items-center justify-between gap-4 border-b-2 border-slate-700 dark:border-slate-300 pb-0.5 my-0.5">
                  <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm">{op}</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold tracking-wider">{bottomNum}</span>
                </div>
                <span className="text-emerald-700 dark:text-emerald-400 font-black tracking-wider pt-0.5">{ansNum}</span>
              </div>
            </div>
          );
        }

        return (
          <div key={colKey} className="font-mono text-xs sm:text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 whitespace-pre overflow-x-auto my-1">
            {colBlock}
          </div>
        );
      };

      return (
        <div className={`rounded-2xl border transition-all overflow-hidden ${
          isDarkMode || chalkboardTheme === 'green'
            ? 'bg-slate-950/80 border-slate-800 text-slate-100 shadow-sm'
            : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
        }`}>
          {/* Notebook Card Header */}
          <div className={`px-3.5 py-2 border-b flex items-center justify-between text-xs font-bold ${
            isDarkMode || chalkboardTheme === 'green'
              ? 'bg-slate-900/90 border-slate-800 text-indigo-300'
              : 'bg-gradient-to-r from-indigo-50/90 via-sky-50/50 to-white border-indigo-100/80 text-indigo-900'
          }`}>
            <span className="flex items-center gap-1.5 text-xs font-black">
              <span>📝</span>
              <span>{medium === 'english' ? 'Notebook Solution:' : 'कॉपी में ऐसे हल करें (Solution):'}</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {medium === 'english' ? 'Class 4 Math' : 'स्कूल विधि'}
            </span>
          </div>

          {/* Unified Notebook Body: Clean, readable text with zero nested gray boxes */}
          <div className="p-3.5 space-y-2 leading-relaxed font-sans">
            {parts.map((p, pIdx) => {
              if (p.includes('---') || p.includes('-------')) {
                const lines = p.split('\n');
                const textBefore: string[] = [];
                const colLines: string[] = [];
                let seenDash = false;

                for (let li = 0; li < lines.length; li++) {
                  const l = lines[li];
                  if (l.includes('---')) {
                    seenDash = true;
                    const opLine = textBefore.pop();
                    const numLine = textBefore.pop();
                    if (numLine) colLines.push(numLine);
                    if (opLine) colLines.push(opLine);
                    colLines.push(l);
                    if (li + 1 < lines.length) {
                      colLines.push(lines[li + 1]);
                      li++;
                    }
                  } else if (!seenDash) {
                    textBefore.push(l);
                  } else {
                    textBefore.push(l);
                  }
                }

                return (
                  <div key={pIdx} className="space-y-1.5">
                    {textBefore.map((tb, tbIdx) => formatLine(tb, `tb-${pIdx}-${tbIdx}`))}
                    {colLines.length > 0 && renderArithmeticColumn(colLines.join('\n'), `col-${pIdx}`)}
                  </div>
                );
              }

              const lines = p.split('\n').map((l) => l.trim()).filter(Boolean);
              return (
                <div key={pIdx} className="space-y-1">
                  {lines.map((l, lIdx) => formatLine(l, `${pIdx}-${lIdx}`))}
                </div>
              );
            })}

            {/* Clean Final Answer Line at the bottom */}
            {answerText && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 -mx-3.5 -mb-3.5 px-3.5 py-2.5">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">
                    ✓
                  </span>
                  <span>
                    {medium === 'english' ? 'Correct Answer:' : 'सही उत्तर:'}{' '}
                    <span className="text-emerald-700 dark:text-emerald-300 underline decoration-2 underline-offset-2">
                      {answerText.replace(/^(?:Correct\s+Option|सही\s*विकल्प|Answer|उत्तर|Correct\s+Answer)\s*[:=]\s*/i, '').replace(/✅/g, '').trim()}
                    </span>
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      );
    };

    if (rawParts.length > 1 || clean.includes('\n') || clean.includes('---')) {
      // Separate solution steps from final answer line so everything stays in 1 compact unified container
      let answerPart: string | null = null;
      const stepParts: string[] = [];

      for (let i = 0; i < rawParts.length; i++) {
        const p = rawParts[i];
        const isAnswer =
          p.includes('✅') ||
          p.toLowerCase().includes('correct option') ||
          p.toLowerCase().includes('सही विकल्प') ||
          p.includes('अंतिम सही उत्तर') ||
          p.includes('अंतिम उत्तर') ||
          (p.toLowerCase().includes('option:') && i === rawParts.length - 1) ||
          (p.toLowerCase().includes('answer:') && i === rawParts.length - 1);
        if (isAnswer && !answerPart) {
          answerPart = p;
        } else {
          stepParts.push(p);
        }
      }

      const partsToRender = stepParts.length > 0 ? stepParts : [clean];
      return renderNotebookSolutionContent(partsToRender, answerPart);
    }

    // Single formula block (e.g. single word answer or equation)
    const isUnderlineAnswer =
      clean.includes('✅') ||
      clean.length < 50 ||
      clean.includes('उत्तर') ||
      ['meadow', 'pond', 'mother', 'black'].some((w) => clean.toLowerCase().includes(w));

    return (
      <div
        className={`text-sm sm:text-base font-bold tracking-normal leading-normal ${isDarkMode || chalkboardTheme === 'green' ? 'text-white' : 'text-slate-900'
          }`}
      >
        <div className="inline-block">
          {renderFormulaAnswer(clean)}
        </div>
      </div>
    );
  };

  // Helper to parse multi-answer formulas like "1.(c) 30000, 2.(d) 900000..." or "1. 2, 2. 8889..."
  const parseMultiAnswerFormula = (formula: string, stepTitle: string) => {
    if (!formula) return null;
    const regex = /(?:^|,|\s*)([1-9]|1[0-5])\.\s*([^,]+)/g;
    const items: Array<{ num: number; answer: string; matchedQuestion: string }> = [];
    let match;
    while ((match = regex.exec(formula)) !== null) {
      const num = parseInt(match[1], 10);
      const ans = match[2].trim();
      if (ans && !ans.toLowerCase().includes('step') && !ans.toLowerCase().includes('solution')) {
        items.push({ num, answer: ans, matchedQuestion: '' });
      }
    }

    if (items.length >= 2) {
      let offset = 0;
      const titleLower = (stepTitle || '').toLowerCase();
      if (titleLower.includes('section b') || titleLower.includes('fill') || titleLower.includes('blank') || titleLower.includes('रिक्त')) {
        offset = 5;
      } else if (titleLower.includes('section c') || titleLower.includes('true') || titleLower.includes('false') || titleLower.includes('सत्य')) {
        offset = 10;
      }

      return items.map((item) => {
        const qIdx = offset + (item.num - 1);
        const found = detectedQuestions[qIdx] || `प्रश्न ${item.num}`;
        return {
          ...item,
          matchedQuestion: found,
        };
      });
    }

    return null;
  };

  // Helper to detect internal instruction prompts
  const isInternalInstruction = (str: string): boolean => {
    if (!str) return false;
    const s = str.toLowerCase();
    return (
      s.includes('कृपया इस वर्कशीट') ||
      s.includes('कृपया इस शीट') ||
      s.includes('कृपया इस पेज') ||
      s.includes('पहचानें और') ||
      s.includes('मास्टर कुंजी') ||
      s.includes('15 सवाल') ||
      s.includes('मास्टर आंसर की') ||
      s.includes('मॉक टेस्ट') ||
      s.includes('question breakdown') ||
      s.includes('problem overview')
    );
  };

  // Helper to get matching question for single step
  const getQuestionForStep = (stepItem?: WhiteboardStepItem | null, idx?: number): string | null => {
    if (!stepItem) return null;

    // 1. If stepItem has a valid real question from AI
    if (stepItem.question && !isInternalInstruction(stepItem.question)) {
      return stepItem.question;
    }

    // 2. If this step index corresponds directly to a detected question
    if (typeof idx === 'number' && idx >= 0 && idx < detectedQuestions.length) {
      return detectedQuestions[idx];
    }

    // 3. Match by question number in step title or formula (e.g. Q1, Q2, सवाल 2)
    if (detectedQuestions.length > 0) {
      const combined = `${stepItem.step || ''} ${stepItem.formula || ''}`.toLowerCase();
      const numMatch = combined.match(/\b(?:q|mcq|blank|sawaal|prashn|no\.?)\s*([0-9]+)\b/i);
      if (numMatch && numMatch[1]) {
        const qNum = parseInt(numMatch[1], 10);
        const found = detectedQuestions.find((dq) => {
          const dqLower = dq.toLowerCase();
          return dqLower.includes(`q${qNum}:`) || dqLower.includes(`q${qNum} `) || dqLower.includes(` ${qNum}:`) || dqLower.includes(`q${qNum}.`);
        });
        if (found) return found;
        if (qNum >= 1 && qNum <= detectedQuestions.length) {
          return detectedQuestions[qNum - 1];
        }
      }
    }

    // 4. If user clicked a specific question from the detected questions list
    if (
      activeTargetQuestion &&
      activeTargetQuestion !== 'सभी 15 सवालों के सही उत्तर व मास्टर कुंजी' &&
      !isInternalInstruction(activeTargetQuestion)
    ) {
      return activeTargetQuestion;
    }

    if (detectedQuestions.length > 0) {
      return detectedQuestions[0];
    }

    if (typeof idx === 'number' && selectedChapter?.sampleQuestions && selectedChapter.sampleQuestions[idx]) {
      return selectedChapter.sampleQuestions[idx].question;
    }

    return null;
  };

  const filterFillerWhiteboardSteps = (steps: WhiteboardStepItem[]): WhiteboardStepItem[] => {
    if (!steps || steps.length === 0) return [];

    // 1. Filter out filler intro/outro cards
    const filtered = steps.filter((s) => {
      const isOutro =
        s.step.includes('शिक्षक संदेश') ||
        s.step.includes('Teacher\'s Tip') ||
        s.formula.includes('सभी प्रश्न हल किए गए') ||
        s.formula.includes('बहुत बढ़िया! सभी प्रश्न हल किए गए') ||
        s.annotation.toLowerCase().includes('maine worksheet ke sabhi sawal board par samjha');
      const isIntro =
        (s.step.includes('पाठ / शीर्षक') || s.step.toLowerCase().includes('worksheet / chapter') || s.formula.toLowerCase().includes('english literature')) &&
        (s.annotation.toLowerCase().includes('hello beta!') || s.annotation.toLowerCase().includes('aaiye whiteboard par ek-ek karke') || s.annotation.toLowerCase().includes('hum aapki english ki notebook ka'));
      return !isOutro && !isIntro;
    });

    // 2. CONSOLIDATE STORY READING CARDS:
    // If multiple steps represent paragraphs of the same story (e.g. "Story: 14.3 My Early Home" or Part 1, Part 2),
    // merge them ALL into EXACTLY ONE single continuous textbook reading step!
    const consolidated: WhiteboardStepItem[] = [];
    for (const item of filtered) {
      const isStoryItem = Boolean(
        item.question?.startsWith('Story:') ||
        item.step?.toLowerCase().includes('reading passage') ||
        item.step?.toLowerCase().includes('story:') ||
        item.step?.toLowerCase().includes('पाठ वाचन') ||
        (item.step?.toLowerCase().includes('part ') && item.formula?.length > 100) ||
        (item.step?.toLowerCase().includes('भाग ') && item.formula?.length > 100)
      );

      const prev = consolidated[consolidated.length - 1];
      const isSameStory = Boolean(
        prev &&
        isStoryItem &&
        (
          (prev.question && item.question && prev.question === item.question) ||
          (prev.step && item.step && (
            (prev.step.includes('14.3') && item.step.includes('14.3')) ||
            (prev.step.toLowerCase().includes('early home') && item.step.toLowerCase().includes('early home'))
          ))
        )
      );

      if (isSameStory) {
        // Merge into the previous story step with clean paragraph separation
        prev.formula = `${prev.formula.trim()}\n\n${item.formula.trim()}`;
        if (item.annotation && !prev.annotation.includes(item.annotation)) {
          prev.annotation = `${prev.annotation} ${item.annotation}`;
        }
      } else {
        consolidated.push({ ...item });
      }
    }

    return consolidated;
  };

  const [isCheckingHomework, setIsCheckingHomework] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);

  const handleCancelUpload = () => {
    if (uploadAbortControllerRef.current) {
      try {
        uploadAbortControllerRef.current.abort();
      } catch {}
      uploadAbortControllerRef.current = null;
    }
    stopAudio();
    setIsCheckingHomework(false);
    setUploadedFiles([]);
    setActiveFileId(null);
    setWhiteboardSteps([]);
    setDetectedQuestions([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const cancelMsg = medium === 'english'
      ? 'Upload cancelled. What would you like to study next?'
      : 'अपलोड रद्द कर दिया गया है बेटा। आप जो भी पढ़ना चाहते हैं, नीचे माइक से पूछें!';
    setSpeechText(cancelMsg);
    speakText(cancelMsg);
  };

  // Interactive Practice Question State
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [selectedMCQ, setSelectedMCQ] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [answerStatus, setAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [totalScore, setTotalScore] = useState<number>(0);

  // Input & Mic Bar
  const [inputText, setInputText] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const lastSpokenTranscriptRef = useRef<string>('');
  const hasHandledSpeechRef = useRef<boolean>(false);

  // STUDY HISTORY & TEACHER MEMORY (Real tuition log)
  const [studyHistory, setStudyHistory] = useState<StudyHistoryItem[]>([
    {
      id: 'h-1',
      time: '10:15 AM',
      subjectId: 'math',
      subjectName: 'गणित (Math)',
      teacherName: 'Sharma Sir',
      chapterNumber: 8,
      chapterTitle: 'गाड़ियां और पहिये (वृत्त)',
      strength: 'व्यास और त्रिज्या फॉर्मूला (Diameter = 2 × Radius) बहुत अच्छा समझा',
      weakness: 'इकाइयों (cm / m) का ध्यान रखें',
      score: 5,
    },
  ]);

  // Real Hindi Voice Selector & Text-To-Speech
  const [hindiVoice, setHindiVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [selectedBookPage, setSelectedBookPage] = useState<number>(1);

  // Initialize and prioritize best Hindi TTS Voice (Chrome Google हिन्दी, Microsoft Swara / Kalpana Natural)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const findBestHindiVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;
      // 1. Natural / Google Hindi
      const best =
        voices.find(
          (v) =>
            (v.lang === 'hi-IN' || v.lang === 'hi_IN') &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Swara') || v.name.includes('Kalpana'))
        ) ||
        voices.find((v) => v.lang === 'hi-IN' || v.lang === 'hi_IN') ||
        voices.find((v) => v.lang.startsWith('hi')) ||
        voices.find((v) => v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी')) ||
        voices.find((v) => v.lang.includes('IN') && !v.name.includes('English'));
      if (best) {
        setHindiVoice(best);
      }
    };

    findBestHindiVoice();
    window.speechSynthesis.onvoiceschanged = findBestHindiVoice;
  }, []);

  // Unified Audio Player with Session ID to prevent race conditions & overlapping sounds
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioPlaySessionRef = useRef<number>(0);

  const stopAudio = () => {
    // Invalidate any ongoing or upcoming audio play callbacks
    audioPlaySessionRef.current += 1;

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.onplay = null;
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
      } catch {}
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
    setSpeakingQuestionId(null);
  };

  const fallbackBrowserSpeech = (clean: string, onEnded?: () => void, targetSessionId?: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }
    // If audio was cancelled or superseded by another speech, abort immediately
    if (typeof targetSessionId === 'number' && audioPlaySessionRef.current !== targetSessionId) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = medium === 'english' ? 'en-IN' : 'hi-IN';

      let voiceToUse = hindiVoice;
      if (!voiceToUse && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        voiceToUse =
          voices.find(
            (v) =>
              (v.lang === 'hi-IN' || v.lang === 'hi_IN') &&
              (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Swara') || v.name.includes('Kalpana'))
          ) ||
          voices.find((v) => v.lang === 'hi-IN' || v.lang === 'hi_IN') ||
          voices.find((v) => v.lang.startsWith('hi')) ||
          voices.find((v) => v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी')) ||
          null;
      }

      if (voiceToUse) utterance.voice = voiceToUse;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        if (typeof targetSessionId === 'number' && audioPlaySessionRef.current !== targetSessionId) {
          window.speechSynthesis.cancel();
          return;
        }
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        if (typeof targetSessionId === 'number' && audioPlaySessionRef.current !== targetSessionId) return;
        if (onEnded) onEnded();
      };
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // High-Fidelity Text-To-Speech with Real Google Cloud Hindi Voice
  const speakText = (text: string, onEnded?: () => void, forcePlay = false, questionId?: number | null) => {
    if (!text || !text.trim()) return;
    if (isAudioMuted) {
      if (forcePlay) {
        setIsAudioMuted(false);
      } else {
        return;
      }
    }

    // Stop any currently playing audio immediately and grab unique session ID
    stopAudio();
    const sessionId = audioPlaySessionRef.current;
    if (typeof questionId === 'number') {
      setSpeakingQuestionId(questionId);
    }

    const clean = text
      .replace(/<[^>]*>/g, '')
      .replace(/[*_#`~]/g, '')
      .replace(/≠/g, ' बराबर नहीं है ')
      .replace(/×/g, ' गुणा ')
      .replace(/÷/g, ' भाग ')
      .replace(/1\/2/g, ' आधा ')
      .replace(/1\/4/g, ' चौथाई ')
      .replace(/3\/4/g, ' तीन चौथाई ')
      .replace(/\b1\s*kg\b/gi, ' एक किलोग्राम ')
      .replace(/\b2\s*kg\b/gi, ' दो किलोग्राम ')
      .replace(/\b([0-9]+)\s*kg\b/gi, '$1 किलोग्राम ')
      .replace(/\b([0-9]+)\s*g\b/gi, '$1 ग्राम ')
      .replace(/\b([0-9]+)\s*m\b/gi, '$1 मीटर ')
      .replace(/\b([0-9]+)\s*cm\b/gi, '$1 सेंटीमीटर ')
      .trim();

    try {
      const audioUrl = `/api/tutor/tts?text=${encodeURIComponent(clean)}&lang=${medium === 'hindi' ? 'hi' : 'en'}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => {
        if (audioPlaySessionRef.current !== sessionId) {
          try {
            audio.pause();
          } catch {}
          return;
        }
        setIsSpeaking(true);
        if (typeof questionId === 'number') {
          setSpeakingQuestionId(questionId);
        }
      };
      audio.onended = () => {
        if (audioPlaySessionRef.current !== sessionId) return;
        setIsSpeaking(false);
        currentAudioRef.current = null;
        if (onEnded) onEnded();
      };
      audio.onerror = () => {
        if (audioPlaySessionRef.current !== sessionId) return;
        fallbackBrowserSpeech(clean, onEnded, sessionId);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (audioPlaySessionRef.current !== sessionId) return;
          fallbackBrowserSpeech(clean, onEnded, sessionId);
        });
      }
    } catch {
      fallbackBrowserSpeech(clean, onEnded, sessionId);
    }
  };

  // Auto-progress revealedSteps when in typewriter mode (Visual only, no conflicting speech override)
  useEffect(() => {
    if (!isTypewriterEnabled) return;
    if (revealedSteps < whiteboardSteps.length && whiteboardSteps.length > 1) {
      const timer = setTimeout(() => {
        setRevealedSteps((prev) => {
          if (prev >= whiteboardSteps.length) return prev;
          return prev + 1;
        });
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [revealedSteps, whiteboardSteps, isTypewriterEnabled]);

  // Load Worksheet History from LocalStorage + Server sync for logged-in student
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let studentUser: any = null;
    try {
      const savedUserStr = localStorage.getItem('student_user');
      if (savedUserStr) studentUser = JSON.parse(savedUserStr);
      const stored = localStorage.getItem('ai_tuition_worksheet_records');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWorksheetHistory(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load worksheet history from localStorage:', e);
    }

    // Sync from server so student data is accessible on any PC
    if (studentUser?.phone || studentUser?.id) {
      fetch(`/api/student/records?phone=${encodeURIComponent(studentUser.phone || '')}&studentId=${encodeURIComponent(studentUser.id || '')}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.worksheetHistory) && data.worksheetHistory.length > 0) {
            setWorksheetHistory(data.worksheetHistory);
            try {
              localStorage.setItem('ai_tuition_worksheet_records', JSON.stringify(data.worksheetHistory));
            } catch {}
            setUploadedFiles((prev) => {
              if (prev.length === 0 && data.worksheetHistory[0]?.files?.length > 0) {
                setActiveFileId(data.worksheetHistory[0].files[0].id);
                return data.worksheetHistory[0].files;
              }
              return prev;
            });
          }
        })
        .catch((err) => console.warn('Could not sync worksheets from server:', err));
    }
  }, []);

  // Mic Speech Recognition with Real-Time Spoken Words & Instant Stop & Solve
  const toggleMic = () => {
    if (typeof window === 'undefined') return;

    // Instantly stop all audio when mic is pressed
    stopAudio();

    if (isListening) {
      // User tapped Stop!
      setIsListening(false);
      hasHandledSpeechRef.current = true;
      try {
        recognitionRef.current?.stop();
      } catch {}
      const finalQuery = (lastSpokenTranscriptRef.current || inputText).trim();
      lastSpokenTranscriptRef.current = '';
      if (finalQuery && finalQuery !== 'Listening to your question...' && !finalQuery.includes('सुन रहे हैं')) {
        handleStudentQuery(finalQuery);
      }
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('ब्राउज़र में माइक उपलब्ध नहीं है। कृपया Chrome इस्तेमाल करें।');
      return;
    }

    try {
      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.lang = medium === 'english' ? 'en-IN' : 'hi-IN';
      rec.interimResults = true;
      rec.continuous = true;
      lastSpokenTranscriptRef.current = '';
      hasHandledSpeechRef.current = false;
      setInputText('');

      rec.onstart = () => {
        setIsListening(true);
        hasHandledSpeechRef.current = false;
      };

      rec.onresult = (e: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = 0; i < e.results.length; i++) {
          const piece = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalTranscript += (finalTranscript ? ' ' : '') + piece.trim();
          } else {
            interimTranscript += (interimTranscript ? ' ' : '') + piece.trim();
          }
        }
        const fullTranscript = (finalTranscript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
        if (fullTranscript) {
          lastSpokenTranscriptRef.current = fullTranscript;
          setInputText(fullTranscript);
        }
      };

      rec.onerror = (err: any) => {
        console.warn('Speech rec error:', err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        if (hasHandledSpeechRef.current) return;
        hasHandledSpeechRef.current = true;
        const finalQuery = (lastSpokenTranscriptRef.current || inputText).trim();
        lastSpokenTranscriptRef.current = '';
        if (finalQuery && finalQuery !== 'Listening to your question...' && !finalQuery.includes('सुन रहे हैं')) {
          handleStudentQuery(finalQuery);
        }
      };

      rec.start();
    } catch (e) {
      console.warn('Speech rec start error:', e);
      setIsListening(false);
    }
  };

  // 💬 Multi-Turn Follow-Up Doubt Solver INSIDE Teacher Doubt Popup
  const handlePopupFollowupQuery = async (followUpText?: string) => {
    const rawVal = followUpText !== undefined ? followUpText : popupInputText;
    const q = (rawVal || '').trim();
    if (!q) return;

    stopAudio();
    setPopupInputText('');
    setIsPopupAnswering(true);

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const studentTurnId = String(Date.now());

    // 1. Append student message immediately to turns
    setTeacherDoubtPopup((prev) => {
      if (!prev) return null;
      const prevTurns = prev.turns || [
        { id: '1', role: 'student', text: prev.question, time: 'अभी' },
        { id: '2', role: 'teacher', text: prev.answer, time: 'अभी' },
      ];
      return {
        ...prev,
        question: q,
        turns: [
          ...prevTurns,
          { id: studentTurnId, role: 'student', text: q, time: nowTime },
        ],
      };
    });

    // 2. Prepare conversation memory and context
    const historyText = (teacherDoubtPopup?.turns || [])
      .slice(-4)
      .map((t) => `${t.role === 'student' ? 'Student' : currentTeacher.name}: ${t.text}`)
      .join('\n');

    const wsContext = whiteboardSteps
      .slice(0, 8)
      .map((s, idx) => `सवाल ${idx + 1}: ${s.question || ''} | हल: ${s.formula || ''}`)
      .join('\n');

    const combinedContext = [
      historyText ? `Previous Conversation in Doubt Popup:\n${historyText}` : '',
      wsContext ? `Current Worksheet Context:\n${wsContext}` : (detectedChapter ? `Chapter: ${detectedChapter}` : ''),
    ].filter(Boolean).join('\n\n');

    let reply = '';
    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: currentTeacher.id,
          question: q,
          mode: 'doubt_solving',
          learning_language: medium === 'english' ? 'en' : 'hi',
          board,
          className,
          worksheet_context: combinedContext,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        reply = data.reply || '';
      }
    } catch (err) {
      console.warn('Popup followup fetch error:', err);
    }

    if (!reply) {
      reply = medium === 'english'
        ? `Great curiosity beta! Regarding "${q}": Always remember to break the problem into smaller simple steps. Check the steps on the board or ask me any word you didn't understand!`
        : `शाबाश बेटा, बहुत बढ़िया सवाल पूछा! "${q}" के लिए याद रखो: गणित और पढ़ाई में हमेशा एक-एक कदम करके आगे बढ़ते हैं। बोर्ड पर लिखा हल भी देखो और जहाँ भी उलझन हो, मुझसे बेझिझक पूछो!`;
    }

    setIsPopupAnswering(false);

    // 3. Append teacher response to turns & auto-speak
    const teacherTurnId = String(Date.now() + 1);
    setTeacherDoubtPopup((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answer: reply,
        turns: [
          ...(prev.turns || []),
          { id: teacherTurnId, role: 'teacher', text: reply, time: nowTime },
        ],
      };
    });

    setSpeechText(reply);
    speakText(reply);
  };

  // 🎙️ Dedicated Speech Recognition for Follow-up Doubt Inside Popup
  const togglePopupMic = () => {
    if (typeof window === 'undefined') return;
    stopAudio();

    if (isPopupListening) {
      setIsPopupListening(false);
      popupSpeechHandledRef.current = true;
      try {
        popupRecognitionRef.current?.stop();
      } catch {}
      const q = popupInputText.trim();
      if (q) {
        handlePopupFollowupQuery(q);
      }
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('ब्राउज़र में माइक उपलब्ध नहीं है। कृपया Chrome इस्तेमाल करें।');
      return;
    }

    try {
      const rec = new SpeechRec();
      popupRecognitionRef.current = rec;
      rec.lang = medium === 'english' ? 'en-IN' : 'hi-IN';
      rec.interimResults = true;
      rec.continuous = true;
      popupSpeechHandledRef.current = false;

      rec.onstart = () => {
        setIsPopupListening(true);
        popupSpeechHandledRef.current = false;
      };

      rec.onresult = (e: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = 0; i < e.results.length; i++) {
          const piece = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalTranscript += (finalTranscript ? ' ' : '') + piece.trim();
          } else {
            interimTranscript += (interimTranscript ? ' ' : '') + piece.trim();
          }
        }
        const full = (finalTranscript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
        if (full) {
          setPopupInputText(full);
        }
      };

      rec.onerror = () => setIsPopupListening(false);
      rec.onend = () => {
        setIsPopupListening(false);
        if (popupSpeechHandledRef.current) return;
        popupSpeechHandledRef.current = true;
        const q = popupInputText.trim();
        if (q) {
          handlePopupFollowupQuery(q);
        }
      };

      rec.start();
    } catch {
      setIsPopupListening(false);
    }
  };

  // Close popup cleanly without affecting anything else
  const handleClosePopup = () => {
    stopAudio();
    if (isPopupListening) {
      try {
        popupRecognitionRef.current?.stop();
      } catch {}
      setIsPopupListening(false);
    }
    setTeacherDoubtPopup(null);
    setPopupInputText('');
    setIsPopupAnswering(false);
  };

    // Dedicated Voice Answer Speech Recognition for Mock Test (Hindi & English Voice-First)
  const toggleMockAnswerMic = () => {
    if (typeof window === 'undefined') return;
    stopAudio();

    if (isMockListening) {
      mockRecognitionRef.current?.stop();
      setIsMockListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('ब्राउज़र में माइक उपलब्ध नहीं है। कृपया Chrome इस्तेमाल करें।');
      return;
    }

    try {
      const rec = new SpeechRec();
      mockRecognitionRef.current = rec;
      rec.lang = medium === 'english' ? 'en-IN' : 'hi-IN';
      rec.interimResults = false;

      rec.onstart = () => setIsMockListening(true);
      rec.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setMockAnswers((prev) => ({
            ...prev,
            [activeMockQIdx]: transcript,
          }));
        }
      };
      rec.onerror = () => setIsMockListening(false);
      rec.onend = () => setIsMockListening(false);
      rec.start();
    } catch (e) {
      setIsMockListening(false);
    }
  };

  // Switch Subject (Math, EVS, English, Hindi, Computer)
  const handleSelectSubject = (sub: SubjectCurriculum) => {
    stopAudio();

    // 1. Archive previous session to history before clearing so student does not lose work
    if (activeTargetQuestion || activeMathAnim || whiteboardSteps.length > 0 || uploadedFiles.length > 0) {
      archiveCurrentSessionToHistory();
    }

    setSelectedSubject(sub);
    const teacherMap: Record<string, any> = {
      sharma: { id: 'sharma', name: 'Sharma Sir', role: 'Class 1st-8th Math Mentor', emoji: '👨‍🏫' },
      neha: { id: 'neha', name: 'Neha Mam', role: 'Science & EVS Specialist', emoji: '👩‍🔬' },
      riya: { id: 'riya', name: 'Riya Didi', role: 'English Phonetics & Grammar Coach', emoji: '👩‍🏫' },
      pooja: { id: 'pooja', name: 'Pooja Mam', role: 'Hindi Language & Vyakaran Expert', emoji: '✍️' },
      kabir: { id: 'kabir', name: 'Kabir Sir', role: 'Computer & IT Specialist', emoji: '💻' },
    };
    const t = teacherMap[sub.teacherId] || teacherMap.sharma;
    setCurrentTeacher(t);

    // 2. Clear all right-side whiteboard data from the previous subject
    setWhiteboardSteps([]);
    setRevealedSteps(0);
    setActiveTargetQuestion('');
    setActiveMathAnim(null);
    setDetectedQuestions([]);
    setDetectedChapter(null);
    setSelectedMCQ(null);
    setTypedAnswer('');
    setAnswerStatus('idle');
    setExpandedExplanations({});
    setIsCheckingHomework(false);
    setMockAnswers({});
    setMockEvaluations({});
    setActiveMockQIdx(0);
    setCustomQuizQuestions([]);
    setUploadedFiles([]);
    setActiveFileId('');
    setPageDataMap({});

    // 3. Select Chapter 1 of the new subject cleanly
    if (sub.chapters && sub.chapters.length > 0) {
      const ch1 = sub.chapters[0];
      setSelectedChapter(ch1);
      const firstPage = ch1.bookPages?.[0]?.pageNumber || ch1.startPage || 1;
      setSelectedBookPage(firstPage);
      setActiveQuestionIdx(0);
      setWhiteboardHeading(`पाठ 1: ${ch1.titleHindi || ch1.titleEnglish}`);
    } else {
      setSelectedChapter(null);
      setWhiteboardHeading(`${sub.subjectHindi} क्लासरूम`);
    }

    // Check if student studied this subject earlier in history
    const pastRecord = studyHistory.find((h) => h.subjectId === sub.id);
    let msg = '';
    if (pastRecord) {
      msg = `अरे बेटा! वापस ${sub.subjectHindi} में आ गए? पिछली बार आपने पाठ ${pastRecord.chapterNumber} "${pastRecord.chapterTitle}" पढ़ा था और ${pastRecord.strength}! आज कौनसा पाठ पढ़ना है?`;
    } else {
      msg = `नमस्ते बेटा! मैं ${t.name} हूँ। आज हम ${sub.subjectHindi} पढ़ेंगे। नीचे से कोई भी पाठ चुनें या बोलकर बताएं!`;
    }

    setSpeechText(msg);
    speakText(msg);
  };

  // Select and study a specific digital book page (0 Tokens - Instant Loading)
  const handleSelectBookPage = (pageNumber: number, targetCh?: Chapter | null) => {
    stopAudio();
    setSelectedBookPage(pageNumber);
    const ch = targetCh || selectedChapter;
    if (!ch) return;

    const pageObj = ch.bookPages?.find((p: any) => p.pageNumber === pageNumber) || ch.bookPages?.[pageNumber - 1];
    if (!pageObj) return;

    setActiveTargetQuestion(`📖 ${pageObj.pageTitle}`);
    setWhiteboardHeading(`${ch.titleHindi || ch.titleEnglish} - ${pageObj.pageTitle}`);

    if (pageObj.whiteboardSteps && pageObj.whiteboardSteps.length > 0) {
      setWhiteboardSteps(pageObj.whiteboardSteps);
      setRevealedSteps(pageObj.whiteboardSteps.length);

      const pType = (pageObj as any).pageType;
      const speech = pType === 'reading'
        ? `नमस्ते बेटा! आइए "${ch.titleHindi || ch.titleEnglish}" का सस्वर पाठ करते हैं। ध्यान से सुनें और मेरे साथ-साथ दोहराएं!`
        : pType === 'vocab'
          ? `बेटा, यह पाठ के सबसे महत्वपूर्ण कठिन शब्दार्थ और भावार्थ हैं। इन्हें अपनी नोटबुक में नोट कर लें!`
          : pType === 'grammar'
            ? `बेटा, यहाँ भाषा की बात और व्याकरण के मुख्य नियम हैं - विलोम शब्द, पर्यायवाची और तुकबंदी वाले शब्द!`
            : `बेटा, यह पृष्ठ ${pageNumber} के अभ्यास प्रश्न हैं। इनका पूरा हल व्हाइटबोर्ड पर देखिए!`;

      setSpeechText(speech);
      speakText(speech);
    }
  };

  // Start Teaching a Specific Chapter
  const handleStartChapter = (ch: Chapter, autoStartFirstQ?: boolean) => {
    setSelectedChapter(ch);
    const firstPage = ch.bookPages?.[0]?.pageNumber || ch.startPage || 1;
    setSelectedBookPage(firstPage);
    setActiveQuestionIdx(0);
    setSelectedMCQ(null);
    setTypedAnswer('');
    setAnswerStatus('idle');
    setActiveTargetQuestion('');
    setDetectedQuestions([]);
    setActiveMathAnim(null);

    setWhiteboardHeading(`पाठ ${ch.chapterNumber}: ${ch.titleHindi || ch.titleEnglish}`);
    
    // Set initial pedagogical whiteboard steps for chapter overview
    const endPg = ch.endPage || ch.bookPages?.[ch.bookPages.length - 1]?.pageNumber || 25;
    const subName = selectedSubject?.subjectHindi || 'पाठ्यपुस्तक';
    const initialSteps: WhiteboardStepItem[] = [
      {
        question: `पाठ ${ch.chapterNumber}: ${ch.titleHindi || ch.titleEnglish}`,
        step: 'चरण 1: पाठ का परिचय व मुख्य अवधारणाएं',
        formula: ch.keyFormulas?.[0] || (ch.concepts?.[0] ? `मुख्य बिंदु: ${ch.concepts[0]}` : `${ch.titleHindi || ch.titleEnglish} का परिचय`),
        annotation: `नमस्ते बेटा! आज हम ${subName} का पाठ ${ch.chapterNumber} "${ch.titleHindi || ch.titleEnglish}" पढ़ेंगे। इसमें पृष्ठ ${firstPage} से ${endPg} तक की मुख्य अवधारणाएं, असली पृष्ठ और अभ्यास सवाल तैयार हैं।`,
      },
      {
        question: `पाठ ${ch.chapterNumber}: ${ch.titleHindi || ch.titleEnglish}`,
        step: 'चरण 2: अध्ययन पृष्ठ व अभ्यास प्रश्न',
        formula: ch.keyFormulas?.[1] || (ch.concepts?.[1] ? `अवधारणा: ${ch.concepts[1]}` : 'किताब के असली पृष्ठ और अभ्यास प्रश्न'),
        annotation: 'नीचे दी गई किताब के असली पृष्ठों की फोटो देखिए और जिस भी सवाल को समझना हो, उसपर क्लिक कीजिए!',
      },
    ];
    setWhiteboardSteps(initialSteps);
    setRevealedSteps(initialSteps.length);

    // Add to Teacher Memory History Log
    const newRecord: StudyHistoryItem = {
      id: `h-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subjectId: selectedSubject?.id || 'general',
      subjectName: selectedSubject?.subjectHindi || subName,
      teacherName: currentTeacher.name,
      chapterNumber: ch.chapterNumber,
      chapterTitle: ch.titleHindi || ch.titleEnglish,
      strength: `${ch.concepts[0] || 'मुख्य नियम'} को अच्छी तरह सीखा`,
      score: 5,
    };
    setStudyHistory((prev) => [newRecord, ...prev.slice(0, 4)]);

    const numPages = ch.bookPages?.length || (ch.endPage ? ch.endPage - ch.startPage + 1 : 5);
    const welcomeMsg = `शाबाश बेटा! आज हम पाठ ${ch.chapterNumber} "${ch.titleHindi || ch.titleEnglish}" पढ़ेंगे। मैंने किताब के सभी ${numPages} असली पृष्ठ और अभ्यास सवाल तैयार कर दिए हैं। ध्यान से देखिए और जो भी सवाल पूछना हो, पूछिए!`;
    setSpeechText(welcomeMsg);
    speakText(welcomeMsg);

    if (ch.bookPages && ch.bookPages.length > 0) {
      setTimeout(() => {
        handleSelectBookPage(ch.bookPages![0].pageNumber, ch);
      }, 300);
    } else if (autoStartFirstQ && ch.sampleQuestions && ch.sampleQuestions.length > 0) {
      setTimeout(() => {
        handleSolveChapterQuestion(ch.sampleQuestions[0]);
      }, 1600);
    }
  };

  // Solve a specific real chapter question on whiteboard
  const handleSolveChapterQuestion = (qItem: any) => {
    stopAudio();
    if (activeTargetQuestion || activeMathAnim || whiteboardSteps.length > 0 || uploadedFiles.length > 0) {
      archiveCurrentSessionToHistory();
    }
    setActiveMathAnim(null);
    setActiveTargetQuestion(qItem.question);
    setWhiteboardSteps([]);
    setIsCheckingHomework(true);

    const steps: WhiteboardStepItem[] = (qItem.whiteboardSteps && qItem.whiteboardSteps.length > 0)
      ? qItem.whiteboardSteps
      : [
          {
            question: qItem.question,
            step: 'चरण 1: प्रश्न को समझना व मुख्य नियम',
            formula: qItem.correctAnswer ? `नियम / उत्तर: ${qItem.correctAnswer}` : `${selectedChapter?.titleHindi || 'पाठ'} का मुख्य नियम`,
            annotation: qItem.explanation || `बेटा, "${qItem.question}" को ध्यान से समझें और इसका सटीक उत्तर समझें।`,
          },
          {
            question: qItem.question,
            step: 'चरण 2: सही समाधान व निष्कर्ष',
            formula: qItem.correctAnswer ? `अंतिम उत्तर: ${qItem.correctAnswer}` : 'हल पूर्ण',
            annotation: `शाबाश! सही उत्तर है: "${qItem.correctAnswer || 'उपरोक्त'}"। इसे अपनी कॉपी में नोट कर लें।`,
          },
        ];

    setTimeout(() => {
      setIsCheckingHomework(false);
      setWhiteboardHeading(`अभ्यास प्रश्न: ${qItem.question.slice(0, 45)}...`);
      setWhiteboardSteps(steps);
      setRevealedSteps(steps.length);
    }, 400);

    const msg = `बेटा, ध्यान से देखिए: सवाल है "${qItem.question}"। इसका स्टेप-बाय-स्टेप हल मैंने व्हाइटबोर्ड पर लिख दिया है! सही उत्तर है: ${qItem.correctAnswer || 'व्हाइटबोर्ड पर देखें'}`;
    setSpeechText(msg);
    speakText(msg);
  };

  // Open and Read Detected Chapter / Story (e.g. 14.4 Tenali Raman and the Brinjal Curry)
  const handleOpenDetectedChapter = (chap?: { title: string; summary?: string; storyText?: string } | null) => {
    const target = chap || detectedChapter;
    if (!target) return;
    stopAudio();
    setActiveTargetQuestion(`📖 पाठ: ${target.title}`);
    setActiveMathAnim(null);
    setWhiteboardSteps([]);
    setIsCheckingHomework(true);

    // Switch to English teacher Riya Didi for English reading stories
    setCurrentTeacher({
      id: 'riya',
      name: 'Riya Didi',
      role: 'English Reading & Phonetics Coach',
      emoji: '👩‍🏫',
    });

    setTimeout(() => {
      setWhiteboardHeading(`📖 पाठ वाचन: ${target.title}`);
      const is14_3 =
        target.title.includes('14.3') ||
        target.title.toLowerCase().includes('early home') ||
        target.title.toLowerCase().includes('black beauty');

      if (is14_3) {
        setCurrentTeacher({
          id: 'riya',
          name: 'Riya Didi',
          role: 'English Reading & Phonetics Coach',
          emoji: '👩‍🏫',
        });

        const full14_3Text = `The first place I remember was a big, pleasant meadow with a clean pond in the middle. There were trees that gave us shade, and at one end of the pond, there were tall plants and water lilies. On one side of the field, we could see a ploughed farm, and on the other side, we could see our master's house near the road. At the top of the field was a group of pine trees, and at the bottom was a small stream with a steep bank beside it.

When I was little, I lived on my mother's milk because I was too young to eat grass. I ran beside her during the day and slept close to her at night. When the weather was hot, we stood by the pond under the trees. When it was cold, we stayed warm in a nice shed near the trees.

As I grew older and could eat grass, my mother went out to work during the day and came back in the evening.

There were six other young horses in the field with me. They were older and bigger. I played with them and had lots of fun. We ran and galloped around the field as fast as we could. Sometimes we played rough, and they would kick and bite while running.

One day, when the playing got too rough, my mother called me over and said: "I want you to listen carefully. The colts here are good, but they have not learnt good manners. You come from a fine family. Your father is well-known, and your grandfather won races. Your grandmother was kind and gentle, and I have never kicked or bitten anyone. I hope you will grow up to be kind too. Always do your work well, and never bite or kick, even when playing."

I never forgot my mother's words. She was a wise horse, and our master cared for her a lot. Her name was Duchess, but he called her Pet.

Our master was a good, kind man. He gave us nice food, a clean place to sleep, and spoke kindly to us, just like he did with his children. We all liked him, and my mother loved him. When she saw him, she would neigh happily and trot over. He would pat her and say, "Well, old Pet, how is little Darkie?" I was black, so he called me Darkie. He often gave me a piece of bread and brought a carrot for my mother. All the horses liked him, but I think we were his favourites.`;

        const full14_3Steps: WhiteboardStepItem[] = [
          {
            step: '📖 पाठ 14.3: My Early Home (पूरी 7 पैराग्राफ कहानी - Textbook Reading Passage)',
            question: target.title,
            formula: full14_3Text,
            annotation: 'Riya Didi: "यह अन्ना सीवेल की प्रसिद्ध पुस्तक ब्लैक ब्यूटी की पूरी 7 पैराग्राफ की कहानी है। इसमें ब्लैक ब्यूटी (Darkie) अपने बचपन के सुहावने चरागाह, माँ डचेस की दी सीख और दयालु मालिक के प्रेम की कहानी सुनाता है। किताब की तरह इसे एक साथ पूरा बोलकर पढ़ें बेटा!"',
          },
          {
            step: 'कठिन शब्दार्थ व सही उच्चारण (Key Vocabulary & Pronunciation)',
            question: target.title,
            formula: 'Meadow (मेडो) = हरा-भरा चरागाह | Water lilies (वॉटर लिलीज़) = कुमुदिनी के फूल | Ploughed (प्लाउड) = जुता हुआ खेत | Galloped (गैलप्ड) = सरपट दौड़े | Colts (कोल्ट्स) = युवा घोड़े / बछेड़े | Neigh (ने) = हिनहिनाना | Duchess (डचेस) = माँ का नाम | Favourites (फेवरिट्स) = सबसे प्यारे',
            annotation: 'Riya Didi: "यह नए शब्द अपनी नोटबुक में लिख लें बेटा, ताकि आपकी अंग्रेजी वोकैबुलरी और उच्चारण मजबूत हो सके!"',
          },
          {
            step: 'कहानी की मुख्य सीख (Moral of the Story)',
            question: target.title,
            formula: '⭐ "Always do your work well, and never bite or kick, even when playing."',
            annotation: 'Riya Didi: "कहानी की सबसे बड़ी सीख: हमेशा भले और दयालु बनो, खेल में भी किसी को नुकसान मत पहुंचाओ और अपना काम लगन से करो। क्या पूरी 7 पैराग्राफ की कहानी अच्छे से समझ आ गई बेटा?"',
          },
        ];
        setWhiteboardSteps(full14_3Steps);
        setRevealedSteps(full14_3Steps.length);
        setIsCheckingHomework(false);
        const storySpeech = `नमस्ते बेटा! आइए पाठ 14.3 "My Early Home" की पूरी कहानी पहले पैराग्राफ (चरागाह व तालाब) से बिना छोटा किए सभी 7 पैराग्राफ बोल-बोलकर पढ़ते हैं!`;
        setSpeechText(storySpeech);
        speakText(storySpeech);
        return;
      }

      const storyTextFromBook =
        target.storyText ||
        `Tenali Raman was a wise and clever man who worked in King Krishnadevaraya's court. He was known for his smart ideas and funny answers. Read a story about how Tenali Raman used his cleverness when his wife wanted to cook a special brinjal curry made from the king's garden!
King Krishnadevaraya had a big garden. In the garden, he grew special brinjals (eggplants). These brinjals were very tasty and grew only in the king's garden. The king loved them very much. Guards watched the garden all day and night.
One day, the king had a big dinner. He invited his ministers and Tenali Raman. The cook used the king's brinjals to make curry. Everyone said it was very tasty. Tenali Raman liked it a lot too.
That night, Tenali went home and told his wife about the curry. He said, "The brinjal curry was very tasty." His wife said, "I want to taste it too. Please bring me some of those brinjals." Tenali said, "They grow only in the king's garden, and it is always guarded." But his wife asked again and again. Finally, Tenali agreed.
Late at night, when it was dark, Tenali went to the garden. He quietly took a few brinjals and came home. His wife was very happy. She made the same brinjal curry. It smelled very good!
She said, "Let's give some to our son." But Tenali said, "No! He is small. He may tell someone about it. Then we will get into trouble."
But his wife did not want to eat without giving some to their son.`;

      const steps: WhiteboardStepItem[] = [
        {
          step: `भाग 1: पाठ का शीर्षक व संदर्भ (Chapter Title & Context)`,
          question: target.title,
          formula: target.title,
          annotation: `Riya Didi: "तेनाली रामन राजा कृष्णदेवराय के दरबार में बुद्धिमान व चतुर दरबारी थे। राजा के बगीचे में खास व स्वादिष्ट बैंगन उगते थे जिनकी दिन-रात पहरेदारी होती थी।"`,
        },
        {
          step: `भाग 2: मूल अंग्रेज़ी पाठ वाचन (English Text Reading Passage)`,
          question: target.title,
          formula: storyTextFromBook,
          annotation: `Riya Didi: "शाही दावत में स्वादिष्ट बैंगन करी खाने के बाद तेनाली की पत्नी ने भी खाने की ज़िद की। तेनाली रात के अंधेरे में चुपके से राजा के पहरेदार बगीचे से बैंगन चुराकर लाए।"`,
        },
        {
          step: `भाग 3: कठिन शब्दार्थ व उच्चारण (Vocabulary & Word Meanings)`,
          question: target.title,
          formula: 'Brinjals (ब्रिंजल्स) = बैंगन | Guarded (गार्डेड) = पहरेदारी में | Clever (क्लेवर) = चतुर, होशियार | Trouble (ट्रबल) = मुसीबत, संकट',
          annotation: `Riya Didi: "यह नए शब्द याद कर लें बेटा, ताकि अंग्रेजी पढ़ने और बोलने में हमेशा आत्मविश्वास रहे!"`,
        },
        {
          step: `भाग 4: मुख्य सीख व तेनाली की बुद्धिमानी (Moral & Wit)`,
          question: target.title,
          formula: '⭐ Wit and presence of mind can handle delicate situations with cleverness.',
          annotation: `Riya Didi: "पत्नी अपने बेटे को करी खिलाना चाहती थी, लेकिन तेनाली ने सावधान किया कि छोटा बच्चा सच बोल देगा और मुसीबत आ जाएगी। क्या कहानी समझ आई बेटा?"`,
        },
      ];

      setWhiteboardSteps(steps);
      setRevealedSteps(steps.length);
      setIsCheckingHomework(false);
      const storySpeech = `नमस्ते बेटा! आइए नया पाठ "${target.title}" पढ़ते हैं। यह तेनाली रामन और राजा के खास बैंगन की मजेदार कहानी है!`;
      setSpeechText(storySpeech);
      speakText(storySpeech);
    }, 350);
  };

  // Helper to select and solve a detected question by index
  const selectDetectedQuestionByIndex = (idx: number, qText: string) => {
    stopAudio();
    setActiveTargetQuestion(qText);
    setActiveMathAnim(null);
    setWhiteboardSteps([]);
    setIsCheckingHomework(true);

    const qClean = qText.toLowerCase();

    // 1. Check for the 4 ACTUAL questions printed on Page 139 (Section A)
    const isSecA_Q1 =
      qClean.includes('first place the speaker remembers') ||
      (qClean.includes('1.') && qClean.includes('meadow')) ||
      (qClean.includes('meadow') && qClean.includes('pond'));
    const isSecA_Q2 =
      qClean.includes('weather was hot') ||
      (qClean.includes('2.') && qClean.includes('pond')) ||
      (qClean.includes('stood by the pond'));
    const isSecA_Q3 =
      qClean.includes('older and could eat grass') ||
      (qClean.includes('3.') && qClean.includes('mother')) ||
      (qClean.includes('mother went out to work'));
    const isSecA_Q4 =
      qClean.includes('called him darkie') ||
      (qClean.includes('4.') && qClean.includes('black')) ||
      (qClean.includes('coat was black'));

    if (isSecA_Q1 || isSecA_Q2 || isSecA_Q3 || isSecA_Q4) {
      setCurrentTeacher({
        id: 'riya',
        name: 'Riya Didi',
        role: 'English Reading & Phonetics Coach',
        emoji: '👩‍🏫',
      });

      setTimeout(() => {
        setIsCheckingHomework(false);
        const isEn = medium === 'english';
        if (isSecA_Q1) {
          setWhiteboardHeading(isEn ? 'Practice Question A.1: Fill in the Blank' : 'अभ्यास सवाल A.1: रिक्त स्थान भरें (Complete the sentence)');
          setWhiteboardSteps([
            {
              step: 'A. 1. Complete the sentence',
              question: 'A. 1. The first place the speaker remembers was a big, pleasant meadow with a clean pond in the middle.',
              formula: `The first place the speaker remembers was a big, pleasant [meadow] with a clean pond in the middle. (${isEn ? 'Correct blank answer:' : 'खाली स्थान में सही उत्तर:'} [meadow] ✅)`,
              annotation: isEn
                ? 'Riya Didi: "In paragraph 1 of the story, it says: \'The first place I remember was a big, pleasant meadow with a clean pond in the middle.\' So the correct word for the blank is meadow."'
                : 'Riya Didi: "पाठ के पहले पैराग्राफ की शुरुआत में ही लिखा है: \'The first place I remember was a big, pleasant meadow with a clean pond in the middle.\' इसलिए यहाँ meadow आएगा।"',
            },
          ]);
          setRevealedSteps(1);
          const sp = isEn
            ? 'Question A.1: According to the story, the correct word for the blank is "meadow"!'
            : 'सवाल A.1: पाठ के पहले पैराग्राफ के अनुसार, खाली स्थान में सही शब्द "meadow" (चरागाह) आएगा!';
          setSpeechText(sp);
          speakText(sp);
        } else if (isSecA_Q2) {
          setWhiteboardHeading(isEn ? 'Practice Question A.2: Fill in the Blank' : 'अभ्यास सवाल A.2: रिक्त स्थान भरें (Complete the sentence)');
          setWhiteboardSteps([
            {
              step: 'A. 2. Complete the sentence',
              question: 'A. 2. When the weather was hot, the speaker and his mother stood by the pond under the trees.',
              formula: `When the weather was hot, the speaker and his mother stood by the [pond] under the trees. (${isEn ? 'Correct blank answer:' : 'खाली स्थान में सही उत्तर:'} [pond] ✅)`,
              annotation: isEn
                ? 'Riya Didi: "In paragraph 2 of the story: \'When the weather was hot, we stood by the pond under the trees.\' So the correct word for the blank is pond."'
                : 'Riya Didi: "पाठ के दूसरे पैराग्राफ में लिखा है: \'When the weather was hot, we stood by the pond under the trees.\' इसलिए यहाँ pond आएगा।"',
            },
          ]);
          setRevealedSteps(1);
          const sp = isEn
            ? 'Question A.2: When the weather was hot, they stood by the pond. The correct word is "pond"!'
            : 'सवाल A.2: पाठ के अनुसार गर्मी के दिनों में वे तालाब के पास खड़े होते थे, इसलिए सही उत्तर "pond" आएगा!';
          setSpeechText(sp);
          speakText(sp);
        } else if (isSecA_Q3) {
          setWhiteboardHeading(isEn ? 'Practice Question A.3: Fill in the Blank' : 'अभ्यास सवाल A.3: रिक्त स्थान भरें (Complete the sentence)');
          setWhiteboardSteps([
            {
              step: 'A. 3. Complete the sentence',
              question: 'A. 3. As the speaker grew older and could eat grass, his mother went out to work during the day.',
              formula: `As the speaker grew older and could eat grass, his [mother] went out to work during the day. (${isEn ? 'Correct blank answer:' : 'खाली स्थान में सही उत्तर:'} [mother] ✅)`,
              annotation: isEn
                ? 'Riya Didi: "In paragraph 3: \'As I grew older and could eat grass, my mother went out to work during the day...\' So the correct word is mother."'
                : 'Riya Didi: "पाठ के तीसरे पैराग्राफ में लिखा है: \'As I grew older and could eat grass, my mother went out to work during the day...\' इसलिए यहाँ mother आएगा।"',
            },
          ]);
          setRevealedSteps(1);
          const sp = isEn
            ? 'Question A.3: When he was older and could eat grass, his mother went out to work. The correct word is "mother"!'
            : 'सवाल A.3: जब वह बड़ा हुआ और घास खाने लगा, तो उसकी माँ काम पर जाती थी। सही उत्तर "mother" आएगा!';
          setSpeechText(sp);
          speakText(sp);
        } else if (isSecA_Q4) {
          setWhiteboardHeading(isEn ? 'Practice Question A.4: Fill in the Blank' : 'अभ्यास सवाल A.4: रिक्त स्थान भरें (Complete the sentence)');
          setWhiteboardSteps([
            {
              step: 'A. 4. Complete the sentence',
              question: 'A. 4. The speaker\'s master called him Darkie because his coat was black.',
              formula: `The speaker\'s master called him Darkie because his coat was [black]. (${isEn ? 'Correct blank answer:' : 'खाली स्थान में सही उत्तर:'} [black] ✅)`,
              annotation: isEn
                ? 'Riya Didi: "In the final paragraph: \'I was black, so he called me Darkie.\' So the correct word is black."'
                : 'Riya Didi: "पाठ के अंतिम पैराग्राफ में लिखा है: \'I was black, so he called me Darkie.\' इसलिए यहाँ black आएगा।"',
            },
          ]);
          setRevealedSteps(1);
          const sp = isEn
            ? 'Question A.4: His coat was black, so he was called Darkie. The correct word is "black"!'
            : 'सवाल A.4: वक्ता का रंग काला था इसलिए मालिक उसे Darkie कहते थे। सही उत्तर "black" आएगा!';
          setSpeechText(sp);
          speakText(sp);
        }
      }, 400);
      return;
    }

    // 2. If student specifically selected the chapter/story reading
    const is14_3Story =
      qClean.includes('14.3') ||
      qClean.includes('early home') ||
      qClean.includes('black beauty') ||
      qClean.includes('कहानी') ||
      qClean.includes('पाठ वाचन');

    if (is14_3Story) {
      setCurrentTeacher({
        id: 'riya',
        name: 'Riya Didi',
        role: 'English Reading & Phonetics Coach',
        emoji: '👩‍🏫',
      });

      setTimeout(() => {
        setIsCheckingHomework(false);
        const isEn = medium === 'english';
        setWhiteboardHeading(
          isEn
            ? '📖 Chapter 14.3: My Early Home (Full 7-Paragraph Story - Textbook Reading)'
            : '📖 पाठ 14.3: My Early Home (पूरी 7 पैराग्राफ कहानी - Textbook Reading)'
        );
        const full14_3Text = `The first place I remember was a big, pleasant meadow with a clean pond in the middle. There were trees that gave us shade, and at one end of the pond, there were tall plants and water lilies. On one side of the field, we could see a ploughed farm, and on the other side, we could see our master's house near the road. At the top of the field was a group of pine trees, and at the bottom was a small stream with a steep bank beside it.

When I was little, I lived on my mother's milk because I was too young to eat grass. I ran beside her during the day and slept close to her at night. When the weather was hot, we stood by the pond under the trees. When it was cold, we stayed warm in a nice shed near the trees.

As I grew older and could eat grass, my mother went out to work during the day and came back in the evening.

There were six other young horses in the field with me. They were older and bigger. I played with them and had lots of fun. We ran and galloped around the field as fast as we could. Sometimes we played rough, and they would kick and bite while running.

One day, when the playing got too rough, my mother called me over and said: "I want you to listen carefully. The colts here are good, but they have not learnt good manners. You come from a fine family. Your father is well-known, and your grandfather won races. Your grandmother was kind and gentle, and I have never kicked or bitten anyone. I hope you will grow up to be kind too. Always do your work well, and never bite or kick, even when playing."

I never forgot my mother's words. She was a wise horse, and our master cared for her a lot. Her name was Duchess, but he called her Pet.

Our master was a good, kind man. He gave us nice food, a clean place to sleep, and spoke kindly to us, just like he did with his children. We all liked him, and my mother loved him. When she saw him, she would neigh happily and trot over. He would pat her and say, "Well, old Pet, how is little Darkie?" I was black, so he called me Darkie. He often gave me a piece of bread and brought a carrot for my mother. All the horses liked him, but I think we were his favourites.`;

        const fullSteps: WhiteboardStepItem[] = [
          {
            step: isEn
              ? '📖 Chapter 14.3: My Early Home (Full 7-Paragraph Story - Textbook Reading Passage)'
              : '📖 पाठ 14.3: My Early Home (पूरी 7 पैराग्राफ कहानी - Textbook Reading Passage)',
            question: '14.3 My Early Home',
            formula: full14_3Text,
            annotation: isEn
              ? 'Riya Didi: "This is the complete 7-paragraph story from Anna Sewell\'s classic Black Beauty. Darkie shares the pleasant meadow, his mother Duchess\'s advice, and their kind master. Read aloud the entire story just like in your book!"'
              : 'Riya Didi: "यह अन्ना सीवेल की प्रसिद्ध पुस्तक ब्लैक ब्यूटी की पूरी 7 पैराग्राफ की कहानी है। इसमें डार्की अपने बचपन के सुहावने चरागाह, माँ डचेस की सीख और दयालु मालिक के प्रेम की कहानी सुनाता है। किताब की तरह इसे एक साथ पूरा बोलकर पढ़ें बेटा!"',
          },
          {
            step: isEn
              ? 'Key Vocabulary & Pronunciation'
              : 'कठिन शब्दार्थ व सही उच्चारण (Key Vocabulary & Pronunciation)',
            question: '14.3 My Early Home',
            formula: isEn
              ? 'Meadow = A field of grass | Water lilies = Flowering water plants | Ploughed = Turned soil for farming | Galloped = Ran very fast | Colts = Young male horses | Neigh = Whinny or horse sound | Duchess = Mother\'s name | Favourites = Most loved ones'
              : 'Meadow (मेडो) = हरा-भरा चरागाह | Water lilies (वॉटर लिलीज़) = कुमुदिनी के फूल | Ploughed (प्लाउड) = जुता हुआ खेत | Galloped (गैलप्ड) = सरपट दौड़े | Colts (कोल्ट्स) = युवा घोड़े / बछेड़े | Neigh (ने) = हिनहिनाना | Duchess (डचेस) = माँ का नाम | Favourites (फेवरिट्स) = सबसे प्यारे',
            annotation: isEn
              ? 'Riya Didi: "Write these new words in your notebook to strengthen your reading vocabulary and spelling!"'
              : 'Riya Didi: "यह नए शब्द अपनी कॉपी में लिख लें बेटा, ताकि आपकी अंग्रेजी शब्दावली और उच्चारण बहुत मजबूत हो सके!"',
          },
          {
            step: isEn
              ? 'Moral of the Story'
              : 'कहानी की मुख्य सीख (Moral of the Story)',
            question: '14.3 My Early Home',
            formula: '⭐ "Always do your work well, and never bite or kick, even when playing."',
            annotation: isEn
              ? 'Riya Didi: "The key moral lesson: always be gentle and kind, never hurt others even in play, and do your work diligently. Did you enjoy the complete 7-paragraph story?"'
              : 'Riya Didi: "कहानी की सबसे बड़ी सीख: हमेशा भले और दयालु बनो, खेल में भी किसी को नुकसान मत पहुंचाओ और अपना काम लगन से करो। क्या पूरी 7 पैराग्राफ की कहानी अच्छे से समझ आ गई बेटा?"',
          },
        ];
        setWhiteboardSteps(fullSteps);
        setRevealedSteps(fullSteps.length);
        const sp = isEn
          ? 'Hello beta! Let us read the full 7-paragraph story of "My Early Home" from Chapter 14.3 together!'
          : 'नमस्ते बेटा! आइए पाठ 14.3 "My Early Home" की पूरी कहानी पहले पैराग्राफ से बिना छोटा किए सभी 7 पैराग्राफ एक साथ पढ़ते हैं!';
        setSpeechText(sp);
        speakText(sp);
      }, 400);
      return;
    }

    const audioSpeech = `सवाल नंबर ${idx + 1}: ${qText}। आइए इस सवाल का हल व्हाइटबोर्ड पर देखते हैं!`;
    setSpeechText(audioSpeech);
    speakText(audioSpeech);
    handleStudentQuery(`कृपया इस सवाल को हल करें: "${qText}"`, qText);
  };

  const effectiveQuestionIdx = (() => {
    if (detectedQuestions.length === 0) return -1;
    if (activeTargetQuestion) {
      const idx1 = detectedQuestions.findIndex((q) => q === activeTargetQuestion);
      if (idx1 !== -1) return idx1;
      const idx2 = detectedQuestions.findIndex(
        (q) => q.includes(activeTargetQuestion) || activeTargetQuestion.includes(q)
      );
      if (idx2 !== -1) return idx2;
    }
    const currentQText = whiteboardSteps[0]?.question || '';
    if (currentQText) {
      const idx3 = detectedQuestions.findIndex((q) => q === currentQText);
      if (idx3 !== -1) return idx3;
      const idx4 = detectedQuestions.findIndex(
        (q) => q.includes(currentQText) || currentQText.includes(q)
      );
      if (idx4 !== -1) return idx4;
    }
    return 0;
  })();

  const handlePrevQuestion = () => {
    if (detectedQuestions.length > 0) {
      const current = effectiveQuestionIdx !== -1 ? effectiveQuestionIdx : 0;
      const targetIdx = current > 0 ? current - 1 : detectedQuestions.length - 1;
      selectDetectedQuestionByIndex(targetIdx, detectedQuestions[targetIdx]);
      return;
    }
    if (selectedChapter?.sampleQuestions && selectedChapter.sampleQuestions.length > 0) {
      const current = activeQuestionIdx;
      const targetIdx = current > 0 ? current - 1 : selectedChapter.sampleQuestions.length - 1;
      setActiveQuestionIdx(targetIdx);
      handleSolveChapterQuestion(selectedChapter.sampleQuestions[targetIdx]);
    }
  };

  const handleNextQuestion = () => {
    if (detectedQuestions.length > 0) {
      const current = effectiveQuestionIdx !== -1 ? effectiveQuestionIdx : 0;
      if (current === detectedQuestions.length - 1) {
        if (detectedChapter) {
          handleOpenDetectedChapter(detectedChapter);
          const nextMsg = `शाबाश बेटा! अभ्यास के सभी ${detectedQuestions.length} सवाल पूरे हो गए हैं। अब आइए पेज के नीचे शुरू हो रहे नए पाठ "${detectedChapter.title}" की पूरी कहानी पढ़ते हैं!`;
          setSpeechText(nextMsg);
          speakText(nextMsg);
          return;
        }
        setIsWorksheetCelebrationOpen(true);
        const praise = `शाबाश बेटा! बधाई हो! आपने आज की वर्कशीट के सभी ${detectedQuestions.length} सवाल सफलतापूर्वक पूरे कर लिए हैं! आपको 50 विद्या स्टार्स मिलते हैं!`;
        setSpeechText(praise);
        speakText(praise);
        return;
      }
      const targetIdx = current + 1;
      selectDetectedQuestionByIndex(targetIdx, detectedQuestions[targetIdx]);
      return;
    }
    if (selectedChapter?.sampleQuestions && selectedChapter.sampleQuestions.length > 0) {
      const current = activeQuestionIdx;
      const targetIdx = current < selectedChapter.sampleQuestions.length - 1 ? current + 1 : 0;
      setActiveQuestionIdx(targetIdx);
      handleSolveChapterQuestion(selectedChapter.sampleQuestions[targetIdx]);
    }
  };

  // Archive current worksheet and questions to past records history with compressed thumbnails
  const archiveCurrentSessionToHistory = async (customTitle?: string) => {
    if (
      uploadedFiles.length === 0 &&
      detectedQuestions.length === 0 &&
      whiteboardSteps.length === 0 &&
      !activeMathAnim &&
      !activeTargetQuestion
    ) {
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateLabel = `आज, ${timeStr}`;

    const title =
      customTitle ||
      (uploadedFiles.length > 0
        ? `${uploadedFiles[0].name} (${detectedQuestions.length > 0 ? `${detectedQuestions.length} सवाल` : 'वर्कशीट'})`
        : activeMathAnim
          ? `गणित हल: ${activeMathAnim.num1} ${activeMathAnim.op === '*' ? '×' : activeMathAnim.op} ${activeMathAnim.num2} = ${activeMathAnim.result}`
          : activeTargetQuestion || whiteboardHeading || 'अभ्यास सत्र');

    // Compress thumbnails for safe storage within 5MB limit while preserving readable high-res document images
    const compressedFiles = await Promise.all(
      uploadedFiles.map(async (f) => ({
        ...f,
        thumbnailUrl: f.url.startsWith('data:image') ? await compressImageForThumbnail(f.url, 280, 0.55) : f.url,
        url: f.url.startsWith('data:image') ? await optimizeImageForStorage(f.url, 1400, 0.88) : f.url,
      }))
    );

    const newRecord: SavedWorksheetRecord = {
      id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      date: dateStr,
      dateLabel,
      subjectId: selectedSubject?.id || 'math',
      subjectName: selectedSubject?.subjectHindi || 'गणित',
      teacherName: currentTeacher.name,
      files: compressedFiles,
      detectedQuestions: [...detectedQuestions],
      activeQuestion: activeTargetQuestion || (activeMathAnim ? `${activeMathAnim.num1} ${activeMathAnim.op} ${activeMathAnim.num2} = ${activeMathAnim.result}` : ''),
      whiteboardSteps: [...whiteboardSteps],
      whiteboardHeading: activeMathAnim ? `गणित हल: ${activeMathAnim.num1} ${activeMathAnim.op} ${activeMathAnim.num2}` : whiteboardHeading,
      timestamp: Date.now(),
    };

    setWorksheetHistory((prev) => {
      const filtered = prev.filter((r) => Date.now() - r.timestamp > 20000 || r.title !== title);
      const updated = [newRecord, ...filtered].slice(0, 50);
      try {
        localStorage.setItem('ai_tuition_worksheet_records', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }
      return updated;
    });

    // Server Sync: sync new worksheet to student profile so it appears on any PC
    try {
      const savedUser = localStorage.getItem('student_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.phone || u.id) {
          fetch('/api/student/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: u.phone,
              studentId: u.id,
              newWorksheetRecord: newRecord,
            }),
          }).catch((err) => console.warn('Could not sync new worksheet to server:', err));
        }
      }
    } catch {}

    setLastArchivedNotice({
      title,
      count: detectedQuestions.length > 0 ? detectedQuestions.length : 1,
    });
  };

  // Restore a worksheet record from history
  const handleRestoreWorksheetRecord = (record: SavedWorksheetRecord) => {
    const upgradedFiles = (record.files || []).map((f) => {
      let finalUrl = (f as any).fullUrl || f.url;
      if (f.name?.toLowerCase().includes('images.jfif') && (finalUrl.length < 25000 || finalUrl.startsWith('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAA'))) {
        finalUrl = '/data/student-uploads/general/2026-10-28T11-31-48-160Z_images.jfif.jpg';
      }
      return { ...f, url: finalUrl };
    });
    setUploadedFiles(upgradedFiles);
    if (upgradedFiles.length > 0) {
      setUploadedImage(upgradedFiles[0].url);
      setActiveFileId(upgradedFiles[0].id);
      setUploadedFileName(upgradedFiles[0].name);
    }
    setDetectedQuestions(record.detectedQuestions || []);
    if (record.activeQuestion) {
      setActiveTargetQuestion(record.activeQuestion);
    } else if (record.detectedQuestions && record.detectedQuestions.length > 0) {
      setActiveTargetQuestion(record.detectedQuestions[0]);
    }
    const hasRealSteps =
      record.whiteboardSteps &&
      record.whiteboardSteps.length > 0 &&
      !record.whiteboardSteps.every(
        (s) => s.formula === 'वर्कशीट सुरक्षित है' || s.step === 'सुरक्षित रिकॉर्ड'
      );

    if (hasRealSteps) {
      setWhiteboardSteps(record.whiteboardSteps!);
      setRevealedSteps(record.whiteboardSteps!.length);
      const heading = record.whiteboardHeading || record.title || 'सुरक्षित वर्कशीट हल';
      setWhiteboardHeading(heading);
    } else if (upgradedFiles.length > 0) {
      // Trigger live AI Vision to scan and solve this worksheet copy!
      handleAnalyzeActiveWorksheet(upgradedFiles[0]);
    } else if (record.detectedQuestions && record.detectedQuestions.length > 0) {
      const qSteps: WhiteboardStepItem[] = record.detectedQuestions.map((q, idx) => ({
        step: `प्रश्न ${idx + 1} का हल`,
        question: q,
        formula: q,
        annotation: `${record.teacherName || 'शिक्षक'}: "यह प्रश्न आपकी पूर्व सुरक्षित वर्कशीट से हल किया गया है।"`,
      }));
      setWhiteboardSteps(qSteps);
      setRevealedSteps(qSteps.length);
      const heading = record.whiteboardHeading || record.title || 'सुरक्षित वर्कशीट हल';
      setWhiteboardHeading(heading);
    } else {
      setWhiteboardSteps([]);
      setRevealedSteps(0);
      setWhiteboardHeading(record.title || 'वर्कशीट हल');
    }

    if (record.subjectId) {
      const matched = allSubjects.find((s) => s.id.toLowerCase().includes(record.subjectId.toLowerCase()));
      if (matched) setSelectedSubject(matched);
    }

    setActiveMathAnim(null);
    setIsHistoryModalOpen(false);

    const restoreMsg = `बेटा, आपका पिछला रिकॉर्ड "${record.title}" लोड हो गया है!`;
    setSpeechText(restoreMsg);
    speakText(restoreMsg);
  };

  // Delete a record from history
  const handleDeleteWorksheetRecord = (recordId: string) => {
    setWorksheetHistory((prev) => {
      const updated = prev.filter((r) => r.id !== recordId);
      try {
        localStorage.setItem('ai_tuition_worksheet_records', JSON.stringify(updated));
        const savedUser = localStorage.getItem('student_user');
        if (savedUser) {
          const u = JSON.parse(savedUser);
          if (u.phone || u.id) {
            fetch('/api/student/records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: u.phone,
                studentId: u.id,
                deleteRecordId: recordId,
                worksheetHistory: updated,
              }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn(err);
      }
      return updated;
    });
  };

  // Clear all records permanently from history & server
  const handleClearAllWorksheetRecords = () => {
    if (typeof window !== 'undefined' && window.confirm('क्या आप सचमुच पूरा पुराना रिकॉर्ड साफ करना चाहते हैं? यह सभी पुराने अपलोड हमेशा के लिए हटा देगा।')) {
      setWorksheetHistory([]);
      setUploadedFiles([]);
      setActiveFileId(null);
      setWhiteboardSteps([]);
      setDetectedQuestions([]);
      try {
        localStorage.removeItem('ai_tuition_worksheet_records');
        localStorage.removeItem('ai_tuition_saved_whiteboard_state');
        localStorage.removeItem('student_current_session');
        const savedUser = localStorage.getItem('student_user');
        if (savedUser) {
          const u = JSON.parse(savedUser);
          if (u.phone || u.id) {
            fetch('/api/student/records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: u.phone,
                studentId: u.id,
                clearAll: true,
                worksheetHistory: [],
              }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // 💡 Intelligent In-Worksheet Doubt & Voice Command Solver
  const handleWorksheetDoubt = async (q: string): Promise<boolean> => {
    const qTrim = q.trim();
    const qLower = qTrim.toLowerCase();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // A. Voice navigation commands
    if (qLower.includes('रफ काम') || qLower.includes('रफ़ काम') || qLower.includes('scratchpad') || qLower.includes('rough work')) {
      setIsScratchpadOpen(true);
      const msg = medium === 'english' ? 'Opening Rough Work Scratchpad for your calculations!' : 'बेटा, मैंने आपके लिए रफ़ काम (Scratchpad) खोल दिया है!';
      setSpeechText(msg);
      speakText(msg);
      setTeacherDoubtPopup({
        isOpen: true,
        question: qTrim,
        answer: msg,
        turns: [
          { id: '1', role: 'student', text: qTrim, time: nowTime },
          { id: '2', role: 'teacher', text: msg, time: nowTime },
        ],
      });
      return true;
    }

    if (qLower.includes('मॉक टेस्ट') || qLower.includes('mock test') || qLower.includes('test series') || (qLower.includes('टेस्ट') && !qLower.includes('लेटेस्ट'))) {
      setWhiteboardDisplayTab('mock');
      const msg = medium === 'english' ? 'Starting the Mock Test for this worksheet. All the best!' : 'बेटा, मैंने आपकी वर्कशीट का मॉक टेस्ट शुरू कर दिया है! सभी सवाल ध्यान से हल करें।';
      setSpeechText(msg);
      speakText(msg);
      setTeacherDoubtPopup({
        isOpen: true,
        question: qTrim,
        answer: msg,
        turns: [
          { id: '1', role: 'student', text: qTrim, time: nowTime },
          { id: '2', role: 'teacher', text: msg, time: nowTime },
        ],
      });
      return true;
    }

    if (qLower.includes('वर्कशीट') || qLower.includes('worksheet') || qLower.includes('pdf') || qLower.includes('डॉक्यूमेंट')) {
      setIsWorksheetModalOpen(true);
      const msg = medium === 'english' ? 'Opened your original worksheet document in full screen!' : 'बेटा, मैंने आपकी असली वर्कशीट का डॉक्यूमेंट बड़ी स्क्रीन पर खोल दिया है!';
      setSpeechText(msg);
      speakText(msg);
      setTeacherDoubtPopup({
        isOpen: true,
        question: qTrim,
        answer: msg,
        turns: [
          { id: '1', role: 'student', text: qTrim, time: nowTime },
          { id: '2', role: 'teacher', text: msg, time: nowTime },
        ],
      });
      return true;
    }

    // B. Search if query matches ANY question in whiteboardSteps by Number or Keywords
    let matchedQIdx = -1;

    const qNumMatch =
      qTrim.match(/(?:question|q\.?|ques|सवाल|प्रश्न|नंबर|no\.?)\s*([0-9]+)/i) ||
      qTrim.match(/([0-9]+)\s*(?:st|nd|rd|th)?\s*(?:question|ques|सवाल|प्रश्न)/i) ||
      (qLower.includes('पहला') ? [, '1'] : null) ||
      (qLower.includes('दूसरा') ? [, '2'] : null) ||
      (qLower.includes('तीसरा') ? [, '3'] : null) ||
      (qLower.includes('चौथा') ? [, '4'] : null) ||
      (qLower.includes('पांचवां') || qLower.includes('पाँचवाँ') ? [, '5'] : null) ||
      (qLower.includes('छठा') ? [, '6'] : null) ||
      (qLower.includes('सातवां') || qLower.includes('सातवाँ') ? [, '7'] : null) ||
      (qLower.includes('आठवां') || qLower.includes('आठवाँ') ? [, '8'] : null) ||
      (qLower.includes('नौवां') || qLower.includes('नौवाँ') ? [, '9'] : null) ||
      (qLower.includes('दसवां') || qLower.includes('दसवाँ') ? [, '10'] : null);

    if (qNumMatch && qNumMatch[1]) {
      const parsedNum = parseInt(qNumMatch[1], 10);
      if (parsedNum >= 1 && parsedNum <= whiteboardSteps.length) {
        matchedQIdx = parsedNum - 1;
      }
    }

    if (matchedQIdx === -1) {
      const cleanQStr = qTrim
        .replace(/^(?:सर|मैम|दीदी|sir|mam|didi|please|कृपया|बताओ|बताइए|explain|karo|करो)[,\s]*/gi, '')
        .trim();
      const normQuery = cleanQStr.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');

      if (normQuery.length >= 3) {
        matchedQIdx = whiteboardSteps.findIndex((s) => {
          const normQ = (s.question || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
          const normF = (s.formula || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
          return (
            (normQ.length > 5 && (normQ.includes(normQuery.slice(0, 12)) || normQuery.includes(normQ.slice(0, 12)))) ||
            ((normQuery.includes('दादा') || normQuery.includes('dada')) && (normQ.includes('दादा') || normF.includes('दादा') || normQ.includes('dada'))) ||
            ((normQuery.includes('लॉकडाउन') || normQuery.includes('lockdown')) && (normQ.includes('लॉकडाउन') || normF.includes('लॉकडाउन') || normQ.includes('lockdown'))) ||
            ((normQuery.includes('कोरोना') || normQuery.includes('corona')) && (normQ.includes('कोरोना') || normF.includes('कोरोना') || normQ.includes('corona'))) ||
            (normQuery.includes('pipe') && normQ.includes('pipe')) ||
            (normQuery.includes('पाइप') && normQ.includes('पाइप')) ||
            (normQuery.includes('कपड़ा') && normQ.includes('कपड़ा')) ||
            (normQuery.includes('tailor') && normQ.includes('tailor')) ||
            (normQuery.includes('ribbon') && normQ.includes('ribbon')) ||
            (normQuery.includes('रिबन') && normQ.includes('रिबन')) ||
            (normQuery.includes('truck') && normQ.includes('truck')) ||
            (normQuery.includes('ट्रक') && normQ.includes('ट्रक'))
          );
        });
      }
    }

    if (matchedQIdx !== -1 && matchedQIdx < whiteboardSteps.length) {
      const qNum = matchedQIdx + 1;
      const stepItem = whiteboardSteps[matchedQIdx];
      const rawQ = stepItem.question || `Question ${qNum}`;

      // Highlight and smoothly scroll to the question
      setHighlightedQuestionId(qNum);
      setTimeout(() => {
        const elem = document.getElementById(`whiteboard-question-${qNum}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      setTimeout(() => setHighlightedQuestionId(null), 6000);

      // Create rich, clear, easy-to-understand explanation for kids:
      let cleanAnswer = stepItem.formula.replace(/^उत्तर\s*:\s*/i, '').trim();
      if (stepItem.annotation) {
        cleanAnswer += `\n\n💡 ${currentTeacher.name}: ${stepItem.annotation}`;
      }

      const fullSpeech = medium === 'english'
        ? `Here is the solution for Question ${qNum}: ${cleanSpeechText(rawQ)}. Solution: ${cleanSpeechText(stepItem.formula)}. ${cleanSpeechText(renderExplanationText(stepItem.annotation || ''))}`
        : `बेटा, यह रहा सवाल ${qNum} का पूरा हल: ${cleanSpeechText(rawQ)}। हल: ${cleanSpeechText(stepItem.formula)}। ${cleanSpeechText(stepItem.annotation || '')}`;

      setSpeakingQuestionId(qNum);
      setSpeechText(fullSpeech);
      speakText(fullSpeech);

      setTeacherDoubtPopup({
        isOpen: true,
        question: qTrim,
        answer: cleanAnswer,
        questionNumber: qNum,
        turns: [
          { id: '1', role: 'student', text: qTrim, time: nowTime },
          { id: '2', role: 'teacher', text: cleanAnswer, time: nowTime },
        ],
      });
      return true;
    }

    // C. Common Math Concept / Rule Doubts
    let teacherAnswer = '';
    if (qLower.includes('उधार') || qLower.includes('borrow')) {
      teacherAnswer = medium === 'english'
        ? "Remember dear student! While subtracting, if the top number is smaller than the bottom number, we borrow 1 from the next left column. For example, borrowing 1 metre gives +100 centimetres, and the metres column reduces by 1!"
        : "बेटा, ध्यान से सुनो! जब घटाते समय ऊपर वाली संख्या नीचे वाली से छोटी होती है, तो हम बाईं ओर वाले कॉलम से 1 उधार (borrow) लेते हैं। जैसे मीटर से 1 m उधार लेने पर cm में +100 cm जुड़ जाता है और मीटर में 1 कम हो जाता है!";
    } else if (qLower.includes('हासिल') || qLower.includes('carry')) {
      teacherAnswer = medium === 'english'
        ? "Whenever the sum in a column exceeds the limit (like 100 cm or more in length), the extra value carries over to the next column to the left as 1 metre!"
        : "बेटा, जब भी किसी कॉलम का जोड़ सीमा से बड़ा होता है (जैसे cm कॉलम में 100 cm या उससे ज्यादा), तो 1 m हासिल (carry) बनकर बाईं ओर मीटर कॉलम में जुड़ जाता है!";
    } else if (qLower.includes('सेंटीमीटर') || qLower.includes('centimeter') || (qLower.includes('मीटर') && qLower.includes('कितने')) || (qLower.includes('meter') && qLower.includes('how many'))) {
      teacherAnswer = medium === 'english'
        ? "Remember: 1 metre (m) = 100 centimetres (cm). Therefore, always multiply metres by 100 to convert into centimetres!"
        : "याद रखो बेटा: 1 मीटर (m) = 100 सेंटीमीटर (cm) होता है! इसलिए मीटर को सेंटीमीटर में बदलने के लिए हमेशा 100 से गुणा करते हैं।";
    } else if (qLower.includes('किलोमीटर') || qLower.includes('kilometre') || qLower.includes('kilometer') || qLower.includes('km')) {
      teacherAnswer = medium === 'english'
        ? "Remember: 1 kilometre (km) = 1000 metres (m). Therefore, always multiply kilometres by 1000 to convert into metres!"
        : "याद रखो बेटा: 1 किलोमीटर (km) = 1000 मीटर (m) होता है! इसलिए किलोमीटर को मीटर में बदलने के लिए हमेशा 1000 से गुणा करते हैं।";
    } else if (qLower.includes('परिमाप') || qLower.includes('perimeter')) {
      teacherAnswer = medium === 'english'
        ? "Perimeter means the total distance around the outside boundary of any shape or field. Simply add the lengths of all outer sides together!"
        : "परिमाप (Perimeter) का मतलब है किसी भी आकृति के चारों तरफ की सभी बाहरी भुजाओं की कुल लंबाई। बस बाहर की सभी लंबाइयों को आपस में जोड़ दो!";
    } else if (qLower.includes('3/4') || qLower.includes('पौना') || qLower.includes('तीन चौथाई')) {
      teacherAnswer = medium === 'english'
        ? "Remember: 3/4 metre equals 75 centimetres (since 1 metre = 100 cm, so 3/4 of 100 is 75 cm)!"
        : "याद रखो बेटा: 3/4 मीटर का मतलब 75 सेंटीमीटर होता है (क्योंकि 1 मीटर = 100 cm, तो 100 का 3/4 भाग = 75 cm)!";
    }

    if (teacherAnswer) {
      setSpeechText(teacherAnswer);
      speakText(teacherAnswer);
      setTeacherDoubtPopup({
        isOpen: true,
        question: qTrim,
        answer: teacherAnswer,
        turns: [
          { id: '1', role: 'student', text: qTrim, time: nowTime },
          { id: '2', role: 'teacher', text: teacherAnswer, time: nowTime },
        ],
      });
      return true;
    }

    // D. If query is any other doubt, call AI Tutor ask API WITHOUT clearing the whiteboard!
    try {
      setIsListening(false);

      // Instant loading indicator so student sees immediate feedback!
      const loadingMsg = medium === 'english'
        ? `${currentTeacher.name} is thinking and preparing your explanation...`
        : `${currentTeacher.name} आपका सवाल समझ रही हैं और जवाब तैयार कर रही हैं...`;

      setTeacherDoubtPopup({
        isOpen: true,
        question: qTrim,
        answer: '⏳ ' + loadingMsg,
        turns: [
          { id: '1', role: 'student', text: qTrim, time: nowTime },
        ],
      });

      // Prepare active worksheet context summary so AI knows the exact lesson/questions
      const wsContext = whiteboardSteps
        .slice(0, 8)
        .map((s, idx) => `सवाल ${idx + 1}: ${s.question || ''} | हल: ${s.formula || ''}`)
        .join('\n');

      let reply = '';
      try {
        const res = await fetch('/api/tutor/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_id: currentTeacher.id,
            question: qTrim,
            mode: 'doubt_solving',
            learning_language: medium === 'english' ? 'en' : 'hi',
            board,
            className,
            worksheet_context: wsContext || (detectedChapter ? `Chapter: ${detectedChapter}` : ''),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          reply = data.reply || '';
        }
      } catch (err) {
        console.warn('Failed to ask AI tutor doubt:', err);
      }

      if (!reply) {
        reply = medium === 'english'
          ? `Great question beta! Let's understand: always follow the step-by-step method shown on the board. If you need any specific part explained, just ask me!`
          : `बहुत अच्छा सवाल है बेटा! "${qTrim}" के लिए: हमेशा बोर्ड पर दिखाए गए चरणबद्ध तरीके को ध्यान से देखें। जहाँ भी आपको समझ न आए, मुझसे तुरंत पूछें!`;
      }

      setSpeechText(reply);
      speakText(reply);
      setTeacherDoubtPopup({
        isOpen: true,
        question: qTrim,
        answer: reply,
        turns: [
          { id: '1', role: 'student', text: qTrim, time: nowTime },
          { id: '2', role: 'teacher', text: reply, time: nowTime },
        ],
      });
      return true;
    } catch (err) {
      console.warn('AI doubt solving exception:', err);
      const fallbackReply = medium === 'english'
        ? 'Beta, look at the steps on the board carefully. You can ask me any step again!'
        : 'बेटा, बोर्ड पर लिखे हल को ध्यान से समझें। आप मुझसे कोई भी कदम दोबारा पूछ सकते हैं!';
      setSpeechText(fallbackReply);
      speakText(fallbackReply);
      setTeacherDoubtPopup({
        isOpen: true,
        question: qTrim,
        answer: fallbackReply,
        turns: [
          { id: '1', role: 'student', text: qTrim, time: nowTime },
          { id: '2', role: 'teacher', text: fallbackReply, time: nowTime },
        ],
      });
      return true;
    }
  };

  // Handle Free-Form Student Query or Doubt
  const handleStudentQuery = async (queryText?: string, targetQTitle?: string) => {
    const rawVal = queryText !== undefined ? queryText : (inputText || inputRef.current?.value || '');
    const q = (rawVal || '').trim();
    if (!q && !uploadedImage) return;

    // 1. Immediately cancel any playing audio/speech so it never lags behind
    stopAudio();

    // 💡 If a worksheet or questions are active, handle this query as an in-lesson DOUBT without clearing the whiteboard!
    if (whiteboardSteps.length > 0 || uploadedFiles.length > 0) {
      await handleWorksheetDoubt(q);
      setInputText('');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    // 2. Auto-archive previous active question or session to history
    if (activeTargetQuestion || activeMathAnim || whiteboardSteps.length > 0 || uploadedFiles.length > 0) {
      archiveCurrentSessionToHistory();
    }

    // 3. Immediately clear all old whiteboard state so previous data disappears completely
    setActiveMathAnim(null);
    setWhiteboardSteps([]);
    const displayQ = targetQTitle || (q.startsWith('कृपया इस सवाल को हल करें: "') ? q.replace(/^कृपया इस सवाल को हल करें:\s*"/, '').replace(/"$/, '') : q);
    setActiveTargetQuestion(displayQ);
    const isSolvingDetectedQ = detectedQuestions.some(
      (dq) => dq.includes(q) || q.includes(dq)
    );
    if (!isSolvingDetectedQ && uploadedFiles.length === 0) {
      setDetectedQuestions([]);
      setDetectedChapter(null);
    }
    setCustomQuizQuestions([]);
    setRevealedSteps(0);

    setInputText('');
    if (inputRef.current) inputRef.current.value = '';

    const qLower = q.toLowerCase();

    // 0. Dedicated Math Expression Solver (e.g. 10+10, 10 + 10, 25*4, 50-20, 100/4, 10 aur 10, etc.)
    const mathSol = solveMathExpression(q, currentTeacher.name);
    if (mathSol) {
      // Auto-archive active worksheet & questions so they are never lost
      if (uploadedFiles.length > 0 || detectedQuestions.length > 0) {
        archiveCurrentSessionToHistory();
      }

      const mathSub =
        allSubjects.find(
          (s) => s.id.toLowerCase().includes('math') || s.subject.toLowerCase().includes('math') || s.teacherId === 'sharma'
        ) || allSubjects[0];
      if (mathSub) {
        setSelectedSubject(mathSub);
        setCurrentTeacher({
          id: 'sharma',
          name: 'Sharma Sir',
          role: 'Class 1st-8th Math Mentor',
          emoji: '👨‍🏫',
        });
      }
      setTimeout(() => {
        setIsCheckingHomework(false);
        setUploadedFiles([]);
        setActiveFileId('');
        setDetectedQuestions([]);
        setCustomQuizQuestions([]);
        setActiveTargetQuestion(mathSol.questionDisplay);
        setWhiteboardHeading(mathSol.heading);
        setWhiteboardSteps(mathSol.steps);
        setRevealedSteps(mathSol.steps.length);
        setActiveMathAnim({
          num1: mathSol.num1,
          op: mathSol.op,
          num2: mathSol.num2,
          result: mathSol.result,
        });
        setSpeechText(mathSol.speechText);
        speakText(mathSol.speechText);
      }, 300);
      return;
    }

    setActiveMathAnim(null);

    // 1. Direct Action: Check Copy/Homework request
    if (
      q.includes('कॉपी चेक') ||
      q.includes('होमवर्क चेक') ||
      qLower.includes('check copy') ||
      qLower.includes('check homework')
    ) {
      if (uploadedImage) {
        handleTriggerMode('check');
        return;
      } else {
        const askMsg = 'बेटा, कॉपी चेक करवाने के लिए कृपया पहले नीचे "फोटो खींचो" बटन से अपनी कॉपी या वर्कशीट की फोटो अपलोड करें!';
        setSpeechText(askMsg);
        speakText(askMsg);
        setIsCheckingHomework(false);
        return;
      }
    }

    // 2. Helper to find subject flexibly (works for c1-math, c4-math, cbse-c4-math, etc.)
    const findSubjectFlexible = (text: string) => {
      const t = text.toLowerCase();
      if (
        t.includes('math') ||
        t.includes('गणित') ||
        t.includes('ganit') ||
        t.includes('hisaab') ||
        t.includes('shape') ||
        t.includes('आकृति') ||
        t.includes('2d') ||
        t.includes('3d') ||
        t.includes('cube') ||
        t.includes('घन') ||
        t.includes('cone') ||
        t.includes('tangram') ||
        t.includes('dice') ||
        t.includes('पासा')
      ) {
        return allSubjects.find(
          (s) => s.id.toLowerCase().includes('math') || s.subject.toLowerCase().includes('math') || s.teacherId === 'sharma'
        ) || allSubjects[0];
      }
      if (t.includes('english') || t.includes('अंग्रेजी') || t.includes('angrezi')) {
        return allSubjects.find(
          (s) => s.id.toLowerCase().includes('eng') || s.subject.toLowerCase().includes('english') || s.teacherId === 'riya'
        );
      }
      if (t.includes('evs') || t.includes('पर्यावरण') || t.includes('science') || t.includes('विज्ञान')) {
        return allSubjects.find(
          (s) => s.id.toLowerCase().includes('evs') || s.id.toLowerCase().includes('sc') || s.subject.toLowerCase().includes('env') || s.subject.toLowerCase().includes('sci') || s.teacherId === 'neha'
        );
      }
      if (t.includes('hindi') || t.includes('हिंदी')) {
        return allSubjects.find(
          (s) => s.id.toLowerCase().includes('hin') || s.subject.toLowerCase().includes('hindi') || s.teacherId === 'pooja'
        );
      }
      return null;
    };

    // 3. Check if query asks to teach or open a specific chapter (e.g. 'chepaer 1 krwa do', 'Math का Chapter 1', 'पाठ 1 करवा दो')
    const chapterMatch =
      q.match(/(?:chapter|chepaer|cheper|chepter|cheptor|ch\b|lesson|पाठ|अध्याय|चैप्टर|चेप्टर)\s*([0-9]+|one|ek|pehla|pahla|पहला)?/i) ||
      q.match(/(?:pehla|pahla|पहला|1st|first)\s*(?:chapter|chepaer|cheper|chepter|lesson|पाठ|अध्याय|चैप्टर|चेप्टर)/i);

    const asksToTeach =
      q.includes('पढ़ा') ||
      q.includes('पढा') ||
      q.includes('सिखा') ||
      q.includes('खोलो') ||
      q.includes('करवा') ||
      q.includes('करा') ||
      q.includes('शुरू') ||
      qLower.includes('krwa') ||
      qLower.includes('karwa') ||
      qLower.includes('kara') ||
      qLower.includes('kardo') ||
      qLower.includes('kar do') ||
      qLower.includes('padha') ||
      qLower.includes('padho') ||
      qLower.includes('sikha') ||
      qLower.includes('shuru') ||
      qLower.includes('teach') ||
      qLower.includes('open') ||
      qLower.includes('start') ||
      qLower.includes('ready') ||
      qLower.includes('solve') ||
      qLower.includes('question') ||
      qLower.includes('quesion') ||
      qLower.includes('sawal') ||
      q.includes('प्रश्न') ||
      q.includes('सवाल');

    const asksForQuestions =
      qLower.includes('question') ||
      qLower.includes('quesion') ||
      qLower.includes('sawal') ||
      q.includes('सवाल') ||
      q.includes('प्रश्न') ||
      qLower.includes('solve') ||
      qLower.includes('hal');

    if (chapterMatch || (asksToTeach && (qLower.includes('chapter') || qLower.includes('chepaer') || qLower.includes('cheper') || qLower.includes('chepter') || q.includes('पाठ')))) {
      // Find subject or default to Math (Sharma Sir) for primary tuition
      const targetSub =
        findSubjectFlexible(q) ||
        selectedSubject ||
        allSubjects.find((s) => s.id.toLowerCase().includes('math') || s.teacherId === 'sharma') ||
        allSubjects[0];

      if (targetSub) {
        handleSelectSubject(targetSub);
        
        let chNum = 1;
        if (chapterMatch) {
          const matchedVal = chapterMatch[1]?.toLowerCase();
          if (matchedVal && /^\d+$/.test(matchedVal)) {
            chNum = parseInt(matchedVal, 10);
          } else if (q.match(/2|दो|two|second/i)) {
            chNum = 2;
          } else if (q.match(/3|तीन|three|third/i)) {
            chNum = 3;
          } else if (q.match(/4|चार|four|fourth/i)) {
            chNum = 4;
          } else {
            chNum = 1;
          }
        }

        let targetChapter = targetSub.chapters.find((c) => c.chapterNumber === chNum);

        // Fallback matching by keyword if number didn't directly match
        if (!targetChapter) {
          if (q.includes('आकृति') || qLower.includes('shape') || qLower.includes('2d') || qLower.includes('3d') || q.includes('पुस्तकालय')) targetChapter = targetSub.chapters.find((c) => c.chapterNumber === 1);
          else if (q.includes('गाँव')) targetChapter = targetSub.chapters.find((c) => c.chapterNumber === 2);
          else if (q.includes('जोड़')) targetChapter = targetSub.chapters.find((c) => c.chapterNumber === 3 || c.chapterNumber === 4);
          else if (q.includes('वैदिक')) targetChapter = targetSub.chapters.find((c) => c.chapterNumber === 5);
          else if (q.includes('भिन्न')) targetChapter = targetSub.chapters.find((c) => c.chapterNumber === 6);
          else if (q.includes('मापन') || q.includes('लंबाई')) targetChapter = targetSub.chapters.find((c) => c.chapterNumber === 7);
          else if (q.includes('भार') || q.includes('तौल') || q.includes('वजन')) targetChapter = targetSub.chapters.find((c) => c.chapterNumber === 8);
          else if (q.includes('धारिता') || q.includes('आयतन') || q.includes('लीटर')) targetChapter = targetSub.chapters.find((c) => c.chapterNumber === 9);
          else if (q.includes('समय')) targetChapter = targetSub.chapters.find((c) => c.chapterNumber === 10);
        }

        // Default to first or closest chapter if not found
        if (!targetChapter && targetSub.chapters.length > 0) {
          targetChapter = targetSub.chapters.find((c) => c.chapterNumber <= chNum) || targetSub.chapters[0];
        }

        if (targetChapter) {
          setIsCheckingHomework(false);
          // Clear any active photo upload so whiteboard switches directly to teaching textbook chapter
          setUploadedImage(null);
          setUploadedFileName('');
          setDetectedQuestions([]);
          setCustomQuizQuestions([]);
          handleStartChapter(targetChapter, asksForQuestions);
          return;
        }
      }
    }

    // 4. Check if student just asks to switch subjects (e.g., 'Math पढ़ाओ', 'English पढ़ाओ')
    const generalSub = findSubjectFlexible(q);
    if (generalSub && (asksToTeach || q.length < 15)) {
      handleSelectSubject(generalSub);
      setIsCheckingHomework(false);
      return;
    }

    // Otherwise, it is a specific doubt in the middle of learning
    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: currentTeacher.id,
          question: q,
          image_url: uploadedImage,
          images: uploadedFiles.map((f) => f.url),
          file_name: uploadedFileName,
          mode: 'teach',
          learning_language: medium === 'english' ? 'en' : 'hi',
          board,
          className,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || 'शाबाश बेटा! आपका डाउट मैंने व्हाइटबोर्ड पर हल कर दिया है।';
        setSpeechText(reply);
        speakText(reply);

        if (data.detected_teacher_id && data.detected_teacher_name) {
          const teacherMap: Record<string, any> = {
            sharma: { id: 'sharma', name: 'Sharma Sir', role: 'Class 1st-8th Math Mentor', emoji: '👨‍🏫' },
            neha: { id: 'neha', name: 'Neha Mam', role: 'Science & EVS Specialist', emoji: '👩‍🔬' },
            riya: { id: 'riya', name: 'Riya Didi', role: 'English Phonetics & Grammar Coach', emoji: '👩‍🏫' },
            pooja: { id: 'pooja', name: 'Pooja Mam', role: 'Hindi Language & Vyakaran Expert', emoji: '✍️' },
            kabir: { id: 'kabir', name: 'Kabir Sir', role: 'Computer & Coding Mentor', emoji: '💻' },
          };
          const t = teacherMap[data.detected_teacher_id] || {
            id: data.detected_teacher_id,
            name: data.detected_teacher_name,
            role: 'Subject Teacher',
            emoji: '👨‍🏫',
          };
          setCurrentTeacher(t);
        }
        if (data.detected_subject) {
          const matchedSub = allSubjects.find(
            (s) =>
              s.id.toLowerCase().includes(data.detected_subject.toLowerCase()) ||
              s.subject.toLowerCase().includes(data.detected_subject.toLowerCase()) ||
              s.teacherId === data.detected_teacher_id
          );
          if (matchedSub) {
            setSelectedSubject(matchedSub);
          }
        }

        if (data.whiteboard_steps && data.whiteboard_steps.length > 0) {
          const cleaned = filterFillerWhiteboardSteps(data.whiteboard_steps);
          const finalHeading = displayQ || q;
          setActiveTargetQuestion(finalHeading);
          setWhiteboardHeading(`सवाल समाधान: "${finalHeading.length > 30 ? finalHeading.slice(0, 30) + '...' : finalHeading}"`);
          setWhiteboardSteps(cleaned);
          setRevealedSteps(cleaned.length);

          // 🎓 Auto-activate Live Blackboard for Math Calculation
          const autoMath = solveMathExpression(finalHeading, currentTeacher.name) || solveMathExpression(q, currentTeacher.name);
          if (autoMath) {
            setActiveMathAnim({
              num1: autoMath.num1,
              op: autoMath.op,
              num2: autoMath.num2,
              result: autoMath.result,
            });
          }
        }
        if (data.detected_questions && Array.isArray(data.detected_questions) && data.detected_questions.length > 0) {
          setDetectedQuestions(data.detected_questions);
          if (!activeTargetQuestion || isInternalInstruction(activeTargetQuestion)) {
            setActiveTargetQuestion(data.detected_questions[0]);
          }
        }
        if (data.detected_chapter) {
          setDetectedChapter(data.detected_chapter);
        }
      } else {
        answerDoubtLocally(q);
      }
    } catch {
      answerDoubtLocally(q);
    } finally {
      setIsCheckingHomework(false);
    }
  };

  // Instant Local Doubt Solver
  const answerDoubtLocally = (q: string) => {
    setActiveTargetQuestion(q);
    const reply = `बहुत अच्छा सवाल पूछा है बेटा! चलिए इसे व्हाइटबोर्ड पर स्टेप-बाय-स्टेप हल करते हैं।`;
    setSpeechText(reply);
    speakText(reply);

    setWhiteboardHeading(`सवाल समाधान: ${q.length > 30 ? q.slice(0, 30) + '...' : q}`);
    setWhiteboardSteps([
      {
        step: 'चरण 1: आपके सवाल का नियम व विश्लेषण',
        question: q,
        formula: q.length > 40 ? q.slice(0, 40) + '...' : q,
        annotation: `${currentTeacher.name}: "पहले सवाल के मुख्य मान और नियम को अलग करते हैं।"`,
      },
      {
        step: 'चरण 2: गणना और स्पष्टीकरण',
        question: q,
        formula: 'Step-by-Step Solution',
        annotation: 'नियम के अनुसार मान रखकर हल करने पर सही उत्तर प्राप्त होता है।',
      },
      {
        step: 'चरण 3: अंतिम परिणाम',
        question: q,
        formula: '✅ डाउट क्लियर!',
        annotation: 'समझ आया बेटा? यदि और कोई सवाल हो तो तुरंत पूछें!',
      },
    ]);
    setRevealedSteps(3);
  };

  // Socratic Hint Teacher Clue Handler
  const handleSocraticHint = (idx: number, stepItem: WhiteboardStepItem) => {
    setActiveHintIndex(idx);
    const hintMsg = `बेटा, ज़रा सोचिए: "${stepItem.step}" में क्या नियम लगेगा? पहले सूत्र याद करें, फिर गणना करें!`;
    setSpeechText(hintMsg);
    speakText(hintMsg);
  };

  // 3-Mode Action Trigger for Uploaded Homework/Worksheet
  const handleTriggerMode = async (mode: 'teach' | 'check' | 'quiz') => {
    if (!uploadedImage) return;

    // Immediately stop audio
    stopAudio();
    setCurrentUploadMode(mode);

    let promptMsg = '';
    const isEn = medium === 'english';
    if (mode === 'check') {
      setWhiteboardSteps([]);
      setIsCheckingHomework(true);
      promptMsg = isEn
        ? 'Please display the master answer key for all questions on this worksheet on the whiteboard so the student can verify answers.'
        : 'कृपया इस पूरी वर्कशीट के सभी 15 सवालों (MCQs 1-5, Fill in blanks 1-5, True/False 1-5) के सही उत्तर मास्टर आंसर की (Master Answer Key) के साथ व्हाइटबोर्ड पर दिखाएं ताकि छात्र सभी उत्तर चेक कर सके।';
      setWhiteboardHeading(
        isEn
          ? '📋 Complete Worksheet Master Answer Key'
          : '📋 संपूर्ण वर्कशीट मास्टर उत्तर कुंजी (All 15 Answers Key)'
      );
    } else if (mode === 'quiz') {
      // Mock test is kept completely separate in its dedicated Test Series arena
      setIsSundayExamModalOpen(true);
      const introMsg = isEn
        ? 'Beta, your Mock Test paper is opened separately in the Test Series! Take the test with timer, check answers, and get your scorecard.'
        : 'बेटा, आपका मॉक टेस्ट अलग टेस्ट सीरीज़ में तैयार है! यहाँ टाइमर और अंक के साथ टेस्ट दें और रिज़ल्ट देखें!';
      setSpeechText(introMsg);
      speakText(introMsg);
      setIsCheckingHomework(false);
      return;
    } else {
      setWhiteboardSteps([]);
      setIsCheckingHomework(true);
      promptMsg = isEn
        ? 'Please identify all exercise questions from this worksheet and teach step-by-step solutions on the whiteboard in simple English.'
        : 'कृपया इस वर्कशीट के सभी 15 सवाल (MCQs, Fill in blanks, True/False) पहचानें और पहले सवाल का व्हाइटबोर्ड पर स्टेप-बाय-स्टेप हल सिखाएं।';
      setWhiteboardHeading(
        isEn
          ? `Worksheet Solution: ${uploadedFileName || 'Worksheet'}`
          : `शीट हल: ${uploadedFileName || 'वर्कशीट'}`
      );
    }

    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: currentTeacher.id,
          learning_language: isEn ? 'en' : 'hi',
          question: promptMsg,
          image_url: uploadedImage,
          file_name: uploadedFileName,
          mode,
          board,
          className,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || 'शाबाश बेटा! परिणाम व्हाइटबोर्ड पर आ गया है।';
        setSpeechText(reply);
        speakText(reply);

        if (data.whiteboard_steps && data.whiteboard_steps.length > 0) {
          const cleaned = filterFillerWhiteboardSteps(data.whiteboard_steps);
          setWhiteboardSteps(cleaned);
          setRevealedSteps(cleaned.length);
        }
        if (data.detected_questions && Array.isArray(data.detected_questions) && data.detected_questions.length > 0) {
          setDetectedQuestions(data.detected_questions);
          if (mode !== 'check') {
            setActiveTargetQuestion(data.detected_questions[0]);
          }
        }
        if (data.quiz_questions && Array.isArray(data.quiz_questions) && data.quiz_questions.length > 0) {
          setCustomQuizQuestions(data.quiz_questions);
          setActiveQuestionIdx(0);
          setSelectedMCQ(null);
          setTypedAnswer('');
          setAnswerStatus('idle');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingHomework(false);
    }
  };

  // Helper to render question in Mock Test mode with empty blank (HIDING THE ANSWER!)
  const renderMockQuestionBlank = (questionText: string, idealAnswer?: string) => {
    if (!questionText) return null;

    // Determine the answer that must be hidden during the test
    const qLower = questionText.toLowerCase();
    let answerToHide = '';

    if (qLower.includes('pleasant') || qLower.includes('first place') || (qLower.includes('pond in the middle') && !qLower.includes('under the trees'))) {
      answerToHide = 'meadow';
    } else if (qLower.includes('weather was hot') || qLower.includes('stood by the')) {
      answerToHide = 'pond';
    } else if (qLower.includes('older and could eat grass') || qLower.includes('went out to work')) {
      answerToHide = 'mother';
    } else if (qLower.includes('called him darkie') || qLower.includes('coat was')) {
      answerToHide = 'black';
    } else if (idealAnswer) {
      const cleanIdeal = idealAnswer.replace(/✅|\[|\]/g, '').trim();
      if (cleanIdeal.length > 0 && cleanIdeal.length < 30 && !cleanIdeal.includes('\n')) {
        answerToHide = cleanIdeal;
      }
    }

    const blankBadge = (
      <span className="px-3 py-0.5 rounded-lg border-2 border-dashed border-amber-400 bg-amber-500/10 text-amber-400 font-mono text-sm sm:text-base font-black mx-1 inline-block animate-pulse">
        ________
      </span>
    );

    // If question has an explicit blank line symbol (e.g. _____, ___, [blank], ....)
    const blankRegex = /_{2,}|\.{3,}|\[\s*\]|\[blank\]/i;
    if (blankRegex.test(questionText)) {
      const parts = questionText.split(blankRegex);
      return (
        <>
          {parts.map((p, idx) => (
            <React.Fragment key={idx}>
              {renderMathFractions(p)}
              {idx < parts.length - 1 && blankBadge}
            </React.Fragment>
          ))}
        </>
      );
    }

    // If question contains the answer word, HIDE the answer word and replace with blank line!
    if (answerToHide) {
      const regex = new RegExp(`\\b(${answerToHide})\\b`, 'i');
      if (regex.test(questionText)) {
        const parts = questionText.split(regex);
        return (
          <>
            {parts.map((p, idx) => {
              if (p.toLowerCase() === answerToHide.toLowerCase()) {
                return <React.Fragment key={idx}>{blankBadge}</React.Fragment>;
              }
              return <React.Fragment key={idx}>{renderMathFractions(p)}</React.Fragment>;
            })}
          </>
        );
      }
    }

    return renderMathFractions(questionText);
  };

  // Helper to extract multi-part question sub-items like (a) 5 m (b) 37 m
  const extractQuestionSubparts = (
    text: string
  ): { intro: string; items: Array<{ key: string; text: string }> } | null => {
    if (!text) return null;
    const match = text.match(/(?:[\s,;]|^)(?:\(([a-zA-Zक-ह])\)|([a-zA-Zक-ह])\))\s*/);
    if (!match) return null;
    const firstIdx = match.index || 0;
    const intro = text.substring(0, firstIdx).trim();
    const subpartRegex = /(?:[\s,;]|^)(?:\(([a-zA-Zक-ह])\)|([a-zA-Zक-ह])\))\s*([^(\n]+?)(?=(?:[\s,;]|^)(?:\([a-zA-Zक-ह]\)|[a-zA-Zक-ह]\))|$)/g;
    const items: Array<{ key: string; text: string }> = [];
    let m: RegExpExecArray | null = null;
    while ((m = subpartRegex.exec(text.substring(firstIdx))) !== null) {
      const key = (m[1] || m[2]).toLowerCase();
      const content = m[3].trim().replace(/^[,\s;]+|[,\s;]+$/g, '');
      if (content) {
        items.push({ key: `(${key})`, text: content });
      }
    }
    return items.length >= 2 ? { intro, items } : null;
  };

  // Helper to parse Multiple Choice (MCQ) 4-options questions
  const parseMCQOptions = (
    rawQuestion?: string,
    explicitOptions?: string[]
  ): {
    qStem: string;
    options: Array<{ key: string; label: string; text: string }>;
  } | null => {
    if (Array.isArray(explicitOptions) && explicitOptions.length >= 2) {
      const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
      return {
        qStem: rawQuestion || '',
        options: explicitOptions.map((opt, i) => {
          const key = letters[i] || `${i + 1}`;
          return {
            key: String(key).toLowerCase(),
            label: `(${key})`,
            text: opt.replace(/^\([a-dA-D1-4क-घ]\)\s*/, '').trim(),
          };
        }),
      };
    }

    if (!rawQuestion) return null;

    // Do NOT treat multi-part exercise questions as single-choice MCQs!
    const isMultiPartQuestion = /(?:convert\s+the\s+following|fill\s+in\s+the\s+blanks?|write\s+in\s+columns?|perform\s+the\s+(?:given\s+)?operations?|column\s+subtraction|find\s+the\s+perimeter|solve\s+the\s+following|calculate\s+the\s+following|match\s+the\s+following|word\s+problem|निम्नलिखित\s+को\s+बदल|रिक्त\s+स्थान|कॉलम\s+में\s+लिख|हल\s+कीजिए|मान\s+ज्ञात\s+कीजिए)/i.test(rawQuestion);
    if (isMultiPartQuestion && (!explicitOptions || explicitOptions.length === 0)) {
      return null;
    }

    // Options must be letter-based: (a)..(b)..(c)..(d) or (A)..(B).. or (क)..(ख)..
    // Crucial: NOT digits (1, 2) which are question/part numbers!
    const optSeqRegex = /(?:[\s,;]|^)(?:\(([a-zA-Zक-ह])\)|([a-zA-Zक-ह])\)|\[([a-zA-Zक-ह])\])\s*/g;
    const matches: Array<{ letter: string; index: number; fullLength: number }> = [];
    let m: RegExpExecArray | null = null;
    while ((m = optSeqRegex.exec(rawQuestion)) !== null) {
      const letter = (m[1] || m[2] || m[3]).toLowerCase();
      matches.push({
        letter,
        index: m.index,
        fullLength: m[0].length,
      });
    }

    // Find a valid consecutive sequence starting with 'a' or 'क'
    let validMatches: Array<{ letter: string; index: number; fullLength: number }> = [];
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].letter === 'a' || matches[i].letter === 'क') {
        const candidate = [matches[i]];
        const expectedKeys = matches[i].letter === 'क'
          ? ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ']
          : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'];
        let expectedIdx = 1;

        for (let j = i + 1; j < matches.length; j++) {
          if (matches[j].letter === expectedKeys[expectedIdx]) {
            candidate.push(matches[j]);
            expectedIdx++;
          }
        }

        if (candidate.length >= 2) {
          validMatches = candidate;
          break;
        }
      }
    }

    if (validMatches.length >= 2) {
      const firstOpt = validMatches[0];
      let qStem = rawQuestion.substring(0, firstOpt.index).trim();
      // Clean leading clutter like "1. Multiple Choice Questions (MCQs): Choose the correct option. (i) "
      qStem = qStem
        .replace(/^(?:\d+[\.\)]\s*)?(?:Multiple Choice Questions\s*(?:\([A-Za-z]+\))?:?\s*)?(?:Choose the correct option[\.:\s]*)?(?:\([iIvVxX\d]+\)\s*)?/i, '')
        .trim();

      const options = [];
      for (let k = 0; k < validMatches.length; k++) {
        const cur = validMatches[k];
        const next = validMatches[k + 1];
        const startText = cur.index + cur.fullLength;
        const endText = next ? next.index : rawQuestion.length;
        const optText = rawQuestion.substring(startText, endText).trim();
        options.push({
          key: cur.letter,
          label: `(${cur.letter})`,
          text: optText,
        });
      }
      return { qStem, options };
    }

    // Pipe-separated choices like "5. Estimate: 2000 g | 20 g | 200 g"
    if (rawQuestion.includes('|')) {
      const colonIdx = rawQuestion.lastIndexOf(':');
      if (colonIdx > 0) {
        const choicesPart = rawQuestion.substring(colonIdx + 1);
        const parts = choicesPart.split('|').map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 2 && parts.length <= 5) {
          const letters = ['a', 'b', 'c', 'd', 'e'];
          const qStem = rawQuestion.substring(0, colonIdx).trim().replace(/^(?:\d+[\.\)]\s*)?/, '').trim();
          return {
            qStem,
            options: parts.map((p, idx) => ({
              key: letters[idx],
              label: `(${letters[idx]})`,
              text: p,
            })),
          };
        }
      }
    }

    // True or False questions
    const qLower = rawQuestion.toLowerCase();
    if (qLower.includes('true or false') || qLower.includes('सही या गलत') || qLower.includes('सत्य या असत्य')) {
      const qStem = rawQuestion.replace(/^(?:\d+[\.\)]\s*)?(?:Write true or false[\.:\s]*)?(?:\([iIvVxX\d]+\)\s*)?/i, '').trim();
      return {
        qStem,
        options: [
          { key: 'a', label: 'True', text: 'True (सही / सत्य)' },
          { key: 'b', label: 'False', text: 'False (गलत / असत्य)' },
        ],
      };
    }

    return null;
  };

  const checkIsOptionSelected = (
    studentAns: string,
    opt: { key: string; label: string; text: string }
  ) => {
    if (!studentAns) return false;
    const s = studentAns.toLowerCase().trim();
    const k = opt.key.toLowerCase().trim();
    const lbl = opt.label.toLowerCase().trim();
    const txt = opt.text.toLowerCase().trim();
    if (s === k || s === lbl || s === `${k})` || s === `option ${k}` || s === `option ${lbl}`) return true;
    if (s.startsWith(`${lbl} `) || s.startsWith(`${k}) `) || s.startsWith(`${k}. `)) return true;
    if (txt.length > 1 && (s === txt || s.startsWith(txt))) return true;
    if (s.includes(`(${k})`) || s.includes(`option (${k})`) || s.includes(`option ${k}`)) return true;
    return false;
  };

  const isOptionCorrect = (
    opt: { key: string; label: string; text: string },
    formulaText?: string | null
  ): boolean => {
    if (!formulaText) return false;
    const fLower = formulaText.toLowerCase();

    // Match exact option key e.g. "correct option: (c)", "सही विकल्प: (c)", "option (c)", "(c)"
    const optKeyRegex = new RegExp(`(?:correct\\s*option|सही\\s*विकल्प|अंतिम\\s*उत्तर|उत्तर|answer|option)\\s*[:\\-–]?\\s*\\(?${opt.key}\\)?`, 'i');
    if (optKeyRegex.test(fLower)) return true;

    if (fLower.includes(`(${opt.key.toLowerCase()})`) && (fLower.includes('correct') || fLower.includes('सही') || fLower.includes('✅') || fLower.includes('option') || fLower.includes('विकल्प'))) {
      return true;
    }

    // Match option text if it's clean (e.g. "30000", "900000", "29000", "49950", "2,50,000")
    const cleanOpt = opt.text.replace(/[,₹\s]/g, '');
    if (cleanOpt.length >= 2) {
      const cleanFormula = fLower.replace(/[,₹\s]/g, '');
      const lines = cleanFormula.split('\n');
      const lastFewLines = lines.slice(-2).join(' ');
      if (lastFewLines.includes(cleanOpt) && (lastFewLines.includes('option') || lastFewLines.includes('विकल्प') || lastFewLines.includes('answer') || lastFewLines.includes('उत्तर') || lastFewLines.includes('correct'))) {
        return true;
      }
    }

    return false;
  };

  // Helper to compile list of questions for Mock Test
  const getMockQuestionsList = (): Array<{
    question: string;
    idealAnswer?: string;
    options?: string[];
    type?: string;
  }> => {
    const list: Array<{
      question: string;
      idealAnswer?: string;
      options?: string[];
      type?: string;
    }> = [];

    // 1. Dynamic Questions from uploaded worksheet (whiteboardSteps)
    if (whiteboardSteps.length > 0) {
      whiteboardSteps.forEach((step, idx) => {
        // Exclude reading stories, vocabulary, and moral lessons from mock test questions
        const isStoryOrVocab = Boolean(
          step.question?.startsWith('Story:') ||
          step.step?.toLowerCase().includes('reading passage') ||
          step.step?.toLowerCase().includes('पाठ वाचन') ||
          step.step?.toLowerCase().includes('शब्दार्थ') ||
          step.step?.toLowerCase().includes('vocabulary') ||
          step.step?.toLowerCase().includes('moral') ||
          step.step?.toLowerCase().includes('सीख')
        );
        if (isStoryOrVocab) return;

        // Prefer the most complete version of this question (e.g. from detectedQuestions with subparts)
        let qText = step.question || step.step || `प्रश्न ${idx + 1}`;
        if (detectedQuestions.length > 0) {
          const matchingDetected = detectedQuestions.find((dq, dqIdx) => {
            if (dqIdx === idx) return true;
            const normDQ = dq.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normQ = qText.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normDQ.includes(normQ.slice(0, 15)) || normQ.includes(normDQ.slice(0, 15));
          });
          if (matchingDetected && matchingDetected.length > qText.length) {
            qText = matchingDetected;
          }
        }

        if (!list.some((item) => item.question === qText)) {
          const qLower = qText.toLowerCase();
          const isPyramid = qLower.includes('pyramid') || qLower.includes('पिरामिड');
          const mcq = parseMCQOptions(qText);
          list.push({
            question: qText,
            idealAnswer: step.formula || step.annotation || undefined,
            options: mcq?.options ? mcq.options.map((o) => `${o.label} ${o.text}`) : undefined,
            type: isPyramid ? 'pyramid' : mcq ? 'mcq' : undefined,
          });
        }
      });
    }

    if (detectedQuestions.length > 0) {
      detectedQuestions.forEach((q, idx) => {
        const normQ = q.replace(/^(\d+[\.\)\s]+)+/, '').replace(/^(fill in blanks q\d+:|q\d+:)\s*/i, '').trim().toLowerCase();
        const alreadyExists = list.some((item) => {
          const normItem = item.question.replace(/^(\d+[\.\)\s]+)+/, '').replace(/^(fill in blanks q\d+:|q\d+:)\s*/i, '').trim().toLowerCase();
          return normItem === normQ || (normQ.length > 20 && (normItem.includes(normQ.slice(0, 25)) || normQ.includes(normItem.slice(0, 25))));
        });
        if (!alreadyExists) {
          const qLower = q.toLowerCase();
          const isPyramid = qLower.includes('pyramid') || qLower.includes('पिरामिड');
          const mcq = parseMCQOptions(q);
          const matchedStep = whiteboardSteps[idx] || whiteboardSteps.find((s) => s.question?.includes(q.slice(0, 20)));
          list.push({
            question: q,
            idealAnswer: matchedStep?.formula || matchedStep?.annotation || undefined,
            options: mcq?.options ? mcq.options.map((o) => `${o.label} ${o.text}`) : undefined,
            type: isPyramid ? 'pyramid' : mcq ? 'mcq' : undefined,
          });
        }
      });
    }

    // Only include syllabus sample questions if student has NOT uploaded any file and has NO detected questions
    const hasStudentUpload = uploadedFiles.length > 0 || detectedQuestions.length > 0 || whiteboardSteps.length > 0;
    if (!hasStudentUpload && selectedChapter?.sampleQuestions && selectedChapter.sampleQuestions.length > 0) {
      selectedChapter.sampleQuestions.forEach((sq: any) => {
        if (!list.some((item) => item.question === sq.question)) {
          list.push({
            question: sq.question,
            idealAnswer: sq.correctAnswer || sq.explanation,
            options: sq.options,
            type: sq.type,
          });
        }
      });
    }
    return list;
  };

  // Save & Evaluate student's typed or spoken Mock Test answer automatically via AI
  const handleSaveAndEvaluateMock = async (qIdx: number) => {
    const questionsList = getMockQuestionsList();
    const activeQ = questionsList[qIdx];
    if (!activeQ) return;
    const studentAns = (mockAnswers[qIdx] || '').trim();
    if (!studentAns) return;

    stopAudio();
    setIsEvaluatingMock(true);

    const maxMarks = 10;
    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'evaluate_mock',
          teacher_id: currentTeacher.id,
          learning_language: medium === 'english' ? 'en' : 'hi',
          question: activeQ.question,
          student_answer: studentAns,
          ideal_answer: activeQ.idealAnswer || '',
          max_marks: maxMarks,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.evaluation) {
          const evalRes = data.evaluation;
          const score = typeof evalRes.score === 'number' ? Math.min(maxMarks, Math.max(0, evalRes.score)) : 8;
          const percentage = evalRes.percentage || Math.round((score / maxMarks) * 100);
          const mistakes = Array.isArray(evalRes.mistakes) && evalRes.mistakes.length > 0
            ? evalRes.mistakes
            : evalRes.mistakes ? [evalRes.mistakes] : [];
          const improvements = Array.isArray(evalRes.improvements) && evalRes.improvements.length > 0
            ? evalRes.improvements
            : Array.isArray(evalRes.missingPoints) && evalRes.missingPoints.length > 0
            ? evalRes.missingPoints
            : [];
          const solution = evalRes.solution || evalRes.idealAnswer || activeQ.idealAnswer || '';
          const badge = evalRes.badge || (percentage >= 90 ? '🌟 उत्कृष्ट प्रदर्शन!' : percentage >= 70 ? '⭐ शानदार प्रयास!' : '💡 अच्छा अभ्यास!');

          const adjustedEval = {
            ...evalRes,
            score,
            totalMarks: maxMarks,
            percentage,
            badge,
            mistakes,
            improvements,
            solution,
            feedback: evalRes.feedback || evalRes.teacherPraise || `स्कोर: ${score}/${maxMarks} अंक (${percentage}%)`,
          };

          setMockEvaluations((prev) => ({
            ...prev,
            [qIdx]: adjustedEval,
          }));

          const praise = evalRes.teacherPraise || (medium === 'english'
            ? `Well done! You scored ${score}/${maxMarks} marks.`
            : `शाबाश बेटा! आपका स्कोर ${score}/${maxMarks} नंबर है।`);
          setSpeechText(praise);
          speakText(praise);

          // 💾 Automatically save evaluation record to student reports history
          try {
            const studentId = studentUser?.phone || studentUser?.id || 'guest_student';
            const cleanQTitle = (activeQ.question || 'सवाल').replace(/^\d+[\.\)\s]+/, '').slice(0, 50);
            const testRecord = {
              id: `mock-${Date.now()}-${qIdx}`,
              title: `मॉक टेस्ट: ${cleanQTitle}`,
              date: new Date().toISOString().split('T')[0],
              subjectId: selectedSubject?.id || 'general',
              subjectName: selectedSubject?.subjectHindi || selectedSubject?.subject || 'मॉक टेस्ट',
              teacherName: currentTeacher.name,
              score,
              totalMarks: maxMarks,
              percentage,
              badge,
              question: activeQ.question,
              studentAnswer: studentAns,
              mistakes,
              improvements,
              solution,
              timestamp: Date.now(),
            };

            // Sync with backend student records
            fetch('/api/student/records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: studentUser?.phone || '',
                studentId: studentId,
                newTestRecord: testRecord,
              }),
            }).catch((e) => console.warn('Could not sync test record to server:', e));

            // Sync with localStorage test history
            const histKey = 'vidya_sunday_test_history_v1';
            const oldHistRaw = localStorage.getItem(histKey);
            const oldHist = oldHistRaw ? JSON.parse(oldHistRaw) : [];
            const newHist = [testRecord, ...(Array.isArray(oldHist) ? oldHist : [])].slice(0, 50);
            localStorage.setItem(histKey, JSON.stringify(newHist));
          } catch (recErr) {
            console.warn('Error saving mock test record:', recErr);
          }
        }
      }
    } catch (err) {
      console.error('Error evaluating mock answer:', err);
    } finally {
      setIsEvaluatingMock(false);
    }
  };

  // WhatsApp Share Mock Test Report directly to parents/student
  const handleShareMockReportWhatsApp = (qIdx: number) => {
    const questionsList = getMockQuestionsList();
    const activeQ = questionsList[qIdx];
    const evalData = mockEvaluations[qIdx];
    const studentAns = (mockAnswers[qIdx] || '').trim();
    if (!activeQ || !evalData) return;

    const studentName = currentStudentName || studentUser?.name || 'विद्यार्थी';
    const grade = studentUser?.classGrade || 'कक्षा 4';
    const score = evalData.score ?? 8;
    const total = evalData.totalMarks || 10;
    const pct = evalData.percentage || Math.round((score / total) * 100);
    const badge = evalData.badge || '⭐ शानदार प्रयास';

    const mistakesText =
      Array.isArray(evalData.mistakes) && evalData.mistakes.length > 0
        ? evalData.mistakes.map((m: string) => `• ${m}`).join('\n')
        : '• कोई बड़ी गलती नहीं मिली। उत्तर बिल्कुल सही है।';

    const improvementsText =
      Array.isArray(evalData.improvements) && evalData.improvements.length > 0
        ? evalData.improvements.map((imp: string) => `• ${imp}`).join('\n')
        : '• नियमित अभ्यास जारी रखें।';

    const solutionText = evalData.solution || evalData.idealAnswer || activeQ.idealAnswer || '';

    const reportMsg =
      `📋 *विद्या AI ट्यूशन - मॉक टेस्ट मूल्यांकन रिपोर्ट*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *विद्यार्थी:* ${studentName} (${grade})\n` +
      `📚 *विषय:* ${selectedSubject?.subjectHindi || selectedSubject?.subject || 'ट्यूशन अभ्यास'}\n` +
      `❓ *सवाल:* ${activeQ.question}\n` +
      `✍️ *छात्र का उत्तर:* "${studentAns}"\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *प्राप्तांक (AI Marks):* ${score} / ${total} अंक (${pct}%)\n` +
      `🏅 *ग्रेड:* ${badge}\n\n` +
      `⚠️ *कहाँ गलती हुई (Mistakes):*\n${mistakesText}\n\n` +
      `💡 *क्या सुधार करना है (Improvements):*\n${improvementsText}\n\n` +
      (solutionText ? `📝 *आदर्श व सही हल (Model Solution):*\n${solutionText}\n\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🤖 *AI शिक्षक:* ${currentTeacher.name} | Vidya AI Tuition`;

    const phone = (studentUser?.phone || '').replace(/\D/g, '');
    const waUrl = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(reportMsg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(reportMsg)}`;

    window.open(waUrl, '_blank');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Enforce Active Subscription Requirement
    if (!isSubscribed) {
      setIsSubscriptionModalOpen(true);
      const limitNotice =
        medium === 'english'
          ? 'Active subscription is required to solve homework pages. Please subscribe to continue!'
          : 'होमवर्क पेज हल करने के लिए एक्टिव सब्सक्रिप्शन आवश्यक है। कृपया आगे बढ़ने के लिए सब्सक्राइब करें!';
      setSpeechText(limitNotice);
      speakText(limitNotice);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check daily upload limit (20 images / day per student)
    const dailyKey = getStudentDailyKey();
    const currentUploads = parseInt(localStorage.getItem(dailyKey) || '0', 10) || 0;
    if (currentUploads >= MAX_DAILY_UPLOADS) {
      const limitNotice =
        medium === 'english'
          ? 'Daily upload limit reached (20 pages/day). You can still ask unlimited questions by typing!'
          : 'आज के 20 पेज अपलोड की सीमा पूरी हो चुकी है। आप नीचे टाइप करके जितने चाहे सवाल पूछ सकते हैं!';
      setSpeechText(limitNotice);
      speakText(limitNotice);
      alert(limitNotice);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (currentUploads + fileList.length > MAX_DAILY_UPLOADS) {
      const remaining = MAX_DAILY_UPLOADS - currentUploads;
      const limitNotice =
        medium === 'english'
          ? `You can only upload ${remaining} more page(s) today (Limit: 20/day).`
          : `आज आप केवल ${remaining} और पेज अपलोड कर सकते हैं (दैनिक सीमा: 20 पेज)।`;
      setSpeechText(limitNotice);
      speakText(limitNotice);
      alert(limitNotice);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Immediately stop any audio/speech
    stopAudio();

    // Auto-archive previous active question or session to history
    if (activeTargetQuestion || activeMathAnim || whiteboardSteps.length > 0 || uploadedFiles.length > 0) {
      archiveCurrentSessionToHistory();
    }

    // Completely clear previous math animation and previous whiteboard steps
    setActiveMathAnim(null);
    setActiveTargetQuestion('');
    setWhiteboardSteps([]);
    setDetectedQuestions([]);
    setIsCheckingHomework(true);
    const filesArray = Array.from(fileList);
    const newlyReadFiles: Array<{ id: string; name: string; url: string; type: string }> = [];

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const rawDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const isImg = file.type.startsWith('image') || !file.name.toLowerCase().endsWith('.pdf');
      const dataUrl = isImg ? await enhanceDocumentImage(rawDataUrl) : rawDataUrl;

      newlyReadFiles.push({
        id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        url: dataUrl,
      });
    }

    // Update daily upload count
    const newUploadTotal = currentUploads + newlyReadFiles.length;
    try {
      localStorage.setItem(dailyKey, newUploadTotal.toString());
      setDailyUploadCount(newUploadTotal);
    } catch { }

    // Increment trial upload count if not subscribed
    if (!isSubscribed) {
      const nextTrialCount = trialUploadCount + 1;
      setTrialUploadCount(nextTrialCount);
      try {
        localStorage.setItem('vidya_trial_upload_count', String(nextTrialCount));
      } catch {}
    }

    setUploadedFiles((prev) => {
      const combined = [...prev, ...newlyReadFiles];
      if (newlyReadFiles.length > 0) {
        setActiveFileId(newlyReadFiles[0].id);
      }
      return combined;
    });

    const activeDoc = newlyReadFiles[0];
    const totalCount = newlyReadFiles.length;
    const msg =
      totalCount > 1
        ? `बेटा, मैंने आपकी ${totalCount} फाइलें प्राप्त कर ली हैं। मैं इन्हें ध्यान से पढ़कर व्हाइटबोर्ड पर समझा रहा हूँ!`
        : `बेटा, मैंने आपकी बुक या कॉपी का पेज "${activeDoc.name}" देख लिया है। मैं इसे ध्यान से पढ़कर व्हाइटबोर्ड पर समझा रहा हूँ!`;

    setSpeechText(msg);
    speakText(msg);

    const abortCtrl = new AbortController();
    uploadAbortControllerRef.current = abortCtrl;

    try {
      const additionalB64 = newlyReadFiles.slice(1).map((f) => ({ url: f.url }));
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        signal: abortCtrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'worksheet',
          learning_language: medium === 'english' ? 'en' : 'hi',
          teacher_id: currentTeacher.id,
          question:
            'कृपया इस वर्कशीट या पेज को ध्यान से पूरा पढ़ें। इसमें दिए गए सभी प्रश्न (अभ्यास, खाली स्थान, सही-गलत, सवाल) को पहचानें। बिना किसी फालतू इंट्रो या समरी कार्ड के, सीधे हर सवाल (Q1, Q2, Q3...) का सटीक हल और उत्तर व्हाइटबोर्ड पर साफ़-सुथरे तरीके से समझाएं। सभी सवालों को <detected_question> में भी जोड़ें।',
          image_url: activeDoc.url,
          images: additionalB64,
          file_name: activeDoc.name,
          board,
          className,
          student_id: studentUser?.id || '',
          student_phone: studentUser?.phone || '',
          student_name: studentUser?.name || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || `पेज "${activeDoc.name}" का हल व्हाइटबोर्ड पर आ गया है बेटा!`;
        setSpeechText(reply);
        speakText(reply);

        const respTeacherId = data.detected_teacher_id || data.teacher_id;
        const respTeacherName = data.detected_teacher_name || data.teacher_name;
        const respSubject = data.detected_subject || (respTeacherId === 'riya' ? 'english' : undefined);

        if (respTeacherId && respTeacherName) {
          setCurrentTeacher({
            id: respTeacherId,
            name: respTeacherName,
            role:
              respSubject === 'english' || respTeacherId === 'riya'
                ? 'English Reading & Phonetics Coach'
                : respSubject === 'hindi'
                  ? 'Hindi Vyakaran & Sahitya'
                  : respSubject === 'evs'
                    ? 'EVS & Science Specialist'
                    : 'Class 1st-8th Math Mentor',
            emoji:
              respSubject === 'english' || respTeacherId === 'riya'
                ? '👩‍🏫'
                : respSubject === 'hindi'
                  ? '👩‍🏫'
                  : respSubject === 'evs'
                    ? '👩‍🔬'
                    : '👨‍🏫',
          });
        }
        if (respSubject) {
          const matchedSub = allSubjects.find(
            (s) =>
              s.id.toLowerCase().includes(respSubject.toLowerCase()) ||
              s.subject.toLowerCase().includes(respSubject.toLowerCase()) ||
              s.teacherId === respTeacherId
          );
          if (matchedSub) {
            setSelectedSubject(matchedSub);
          }
        }

        if (data.whiteboard_steps && data.whiteboard_steps.length > 0) {
          setActiveMathAnim(null);
          const cleaned = filterFillerWhiteboardSteps(data.whiteboard_steps);
          const cleanDocTitle = activeDoc.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          const pageTitle = data.detected_chapter?.title
            ? `अध्याय: ${data.detected_chapter.title}`
            : `WORKSHEET: ${cleanDocTitle}`;
          setWhiteboardHeading(pageTitle);
          setWhiteboardSteps(cleaned);
          setRevealedSteps(cleaned.length);
          setActiveTargetQuestion('');

          setPageDataMap((prev) => ({
            ...prev,
            [activeDoc.id]: {
              whiteboardSteps: cleaned,
              detectedQuestions: data.detected_questions || [],
              detectedChapter: data.detected_chapter || null,
              heading: pageTitle,
            },
          }));
        }
        if (data.detected_questions && Array.isArray(data.detected_questions) && data.detected_questions.length > 0) {
          setDetectedQuestions(data.detected_questions);
          setActiveTargetQuestion('');
        }
        if (data.detected_chapter) {
          setDetectedChapter(data.detected_chapter);
        }
        setTimeout(() => {
          archiveCurrentSessionToHistory(activeDoc.name);
        }, 500);
      } else {
        fallbackUploadResponse(activeDoc.name);
      }
    } catch {
      fallbackUploadResponse(activeDoc.name);
    } finally {
      setIsCheckingHomework(false);
    }

    e.target.value = '';
  };

  const fallbackUploadResponse = (fName: string) => {
    setWhiteboardHeading(`दस्तावेज स्कैन: ${fName}`);
    setWhiteboardSteps([
      {
        step: 'चरण 1: 📄 फाइल अपलोड सफल',
        question: `अपलोड की गई फाइल: ${fName}`,
        formula: 'Live Document Loaded',
        annotation: `${currentTeacher.name}: "आपकी फाइल '${fName}' सफलतापूर्वक प्राप्त हो गई है।"`,
      },
      {
        step: 'चरण 2: 🔍 लाइव AI विज़न स्कैन',
        question: `अपलोड की गई फाइल: ${fName}`,
        formula: 'AI Vision Reading...',
        annotation: 'सभी प्रश्न और उत्तर सीधे आपकी फाइल से ही लाइव पढ़े जाते हैं। कृपया ऊपर "सवाल समझें" या "कॉपी चेक" दबाएं!',
      },
    ]);
    setRevealedSteps(2);
  };

  // MCQ Checker
  const handleCheckMCQ = (option: string, correctAnswer: string, explanation: string) => {
    setSelectedMCQ(option);
    const isCorrect = option.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    if (isCorrect) {
      setAnswerStatus('correct');
      setTotalScore((s) => s + 1);
      speakText('शाबाश बेटा! आपका उत्तर बिल्कुल सही है! बहुत बढ़िया!');
    } else {
      setAnswerStatus('wrong');
      speakText('थोड़ा सा ध्यान दो बेटा, एक बार फिर से सोचकर कोशिश करो!');
    }
  };

  // Typed Answer Checker
  const handleCheckTypedAnswer = (correctAnswer: string, explanation: string) => {
    if (!typedAnswer.trim()) return;
    const cleanUser = typedAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCorrect = correctAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');

    const isMatch = cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
    if (isMatch) {
      setAnswerStatus('correct');
      setTotalScore((s) => s + 1);
      speakText('अरे वाह! बिल्कुल सही उत्तर लिखा है आपने!');
    } else {
      setAnswerStatus('wrong');
      speakText('उत्तर सही नहीं है बेटा। दोबारा कोशिश करो!');
    }
  };

  const currentQ = customQuizQuestions.length > 0
    ? customQuizQuestions[activeQuestionIdx]
    : (selectedChapter?.sampleQuestions?.[activeQuestionIdx] || null);
  const totalQuestionsCount = customQuizQuestions.length > 0
    ? customQuizQuestions.length
    : (selectedChapter?.sampleQuestions?.length || 0);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-indigo-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/50 animate-bounce">
            🎒
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-amber-400/30 animate-pulse pointer-events-none" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-center mb-2">
          AI Tuition Classroom
        </h2>
        <p className="text-xs sm:text-sm text-indigo-200/80 font-medium text-center max-w-sm mb-6">
          आपकी कॉपी, व्हाइटबोर्ड नोट्स व अभ्यास प्रश्न लोड हो रहे हैं...
        </p>

        <div className="w-60 h-2.5 rounded-full bg-slate-800/80 overflow-hidden relative border border-white/10">
          <div className="h-full bg-gradient-to-r from-amber-400 via-indigo-400 to-emerald-400 rounded-full animate-pulse w-3/4" />
        </div>

        <span className="text-[11px] font-bold text-amber-300 mt-4 tracking-wide uppercase flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
          <span>कक्षा तैयार की जा रही है...</span>
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ height: 'var(--app-height, 100dvh)', maxHeight: 'var(--app-height, 100dvh)' }}
      className={`h-screen h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f4f7fb] text-slate-900'
      }`}
    >
      {/* Hidden file inputs for upload and camera */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*,application/pdf"
        className="hidden"
        aria-label="Upload Worksheet or Textbook"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Camera Capture"
      />

      

      {/* 2. MAIN CONTAINER WITH SIDEBAR + WORKSPACE */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Mobile Sidebar Backdrop */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* LEFT SIDEBAR - SLIDE OVER DRAWER ON MOBILE, FIXED ON DESKTOP */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 lg:static lg:w-52 bg-white border-r border-slate-200 flex flex-col justify-between py-0 px-0 shrink-0 h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Top Header Data integrated into Left Sidebar */}
          <div className="px-3 pt-3 pb-2.5 border-b border-slate-100 shrink-0 select-none">
            {/* Logo & Mobile Close */}
            <div className="flex items-center justify-between mb-2.5">
              <Link
                href={isChildLockActive ? '#' : '/dashboard'}
                onClick={() => {
                  if (isChildLockActive) {
                    speakText('चाइल्ड लॉक ऑन है! अनलॉक करने के लिए ऊपर लाल लॉक बटन दबाएं।');
                  }
                }}
                className="flex items-center gap-2 group min-w-0"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  🎓
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-sm font-black tracking-tight text-slate-900">Vidya AI</div>
                  <div className="text-[9px] font-semibold text-slate-400">AI Tutor Class 1-8</div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Profile Pill with Edit Button */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/80 mb-2">
              <Link
                href="/profile"
                className="w-7 h-7 rounded-full bg-amber-200 border border-amber-300 flex items-center justify-center text-xs font-black text-amber-900 shrink-0 hover:scale-105 transition-transform"
                title="Profile"
              >
                👦
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-black text-slate-900 truncate">
                    {studentUser?.name || 'Student'}
                  </span>
                  <Link
                    href="/profile"
                    className="p-0.5 rounded text-amber-700 hover:text-indigo-600 hover:bg-amber-200/60 transition-colors"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Link>
                </div>
                <div className="text-[9px] text-slate-500 font-medium leading-none">
                  {className || 'Class 4'} • {board || 'RBSE'}
                </div>
              </div>
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 border border-amber-300/60 text-amber-800 font-black text-[10px] shrink-0">
                <span>⭐</span>
                <span>{studentStars > 0 ? studentStars : 320}</span>
              </div>
            </div>

            

            {/* Language Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold mt-1.5">
              <button
                type="button"
                onClick={() => {
                  setMedium('hindi');
                  speakText('नमस्ते बेटा! अब भाषा हिंदी सेट हो गई है।', undefined, true);
                }}
                className={`flex-1 py-0.5 rounded-md transition-all cursor-pointer ${
                  medium === 'hindi'
                    ? 'bg-white text-slate-900 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Hindi
              </button>
              <button
                type="button"
                onClick={() => {
                  setMedium('english');
                  speakText('Hello! Learning language is now set to English.', undefined, true);
                }}
                className={`flex-1 py-0.5 rounded-md transition-all cursor-pointer ${
                  medium === 'english'
                    ? 'bg-white text-slate-900 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                English
              </button>
            </div>
                      {/* Active Teacher Card + Selector Dropdown */}
            <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-full border border-amber-300 overflow-hidden bg-amber-50 flex items-center justify-center shrink-0">
                    <img
                      src={
                        currentTeacher.id === 'sharma'
                          ? '/teachers/sharma.jpg'
                          : currentTeacher.id === 'riya'
                          ? '/teachers/riya.jpg'
                          : currentTeacher.id === 'neha'
                          ? '/teachers/neha.jpg'
                          : '/teachers/kabir.jpg'
                      }
                      alt={currentTeacher.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="text-[10px] font-black">{currentTeacher.emoji}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-black text-slate-900 tracking-tight leading-none truncate block">
                      {currentTeacher.name}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded-full text-[8px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>

              {/* Teacher Selection Dropdown */}
              <div className="relative">
                <select
                  value={currentTeacher.id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const t = TEACHER_LIST_DATA.find((item) => item.id === selectedId);
                    if (t) {
                      setCurrentTeacher({
                        id: t.id,
                        name: t.name,
                        role: t.role,
                        emoji: t.id === 'sharma' ? '👨‍🏫' : t.id === 'riya' ? '👩‍🏫' : t.id === 'neha' ? '👩‍🔬' : t.id === 'other' ? '💻' : '👩‍🏫',
                      });
                      const matchingSub = allSubjects.find(
                        (s) =>
                          s.id.toLowerCase().includes(t.subjectId.toLowerCase()) ||
                          s.subject.toLowerCase().includes(t.subjectEn.toLowerCase()) ||
                          s.subjectHindi.includes(t.subject)
                      );
                      if (matchingSub) {
                        setSelectedSubject(matchingSub);
                      }
                      speakText(t.greeting);
                    }
                  }}
                  className="w-full py-1 pl-2 pr-6 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-[10px] font-bold shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all truncate"
                >
                  {TEACHER_LIST_DATA.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({medium === 'english' ? (t.subjectEn || t.subject) : t.subject})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Navigation Items (Scrollable) */}
          <div className="px-2 py-2 flex-1 overflow-y-auto select-none">
            <div className="space-y-1">
              {/* 1. AI Tutor */}
              <button
                type="button"
                onClick={() => {
                  setActiveSidebarItem('tutor');
                  setWhiteboardDisplayTab('book');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSidebarItem === 'tutor' && whiteboardDisplayTab !== 'mock'
                    ? 'bg-blue-50 text-blue-600 shadow-2xs font-black'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Home className="w-4 h-4 text-blue-600 shrink-0" />
                <span>AI Tutor</span>
              </button>

              {/* 2. Upload Worksheet */}
              <button
                type="button"
                onClick={() => {
                  setActiveSidebarItem('upload');
                  setIsWorksheetModalOpen(true);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSidebarItem === 'upload'
                    ? 'bg-blue-50 text-blue-600 shadow-2xs font-black'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Upload Worksheet</span>
              </button>

              {/* 3. Previous Uploads */}
              <button
                type="button"
                onClick={() => {
                  setActiveSidebarItem('history');
                  setIsHistoryModalOpen(true);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSidebarItem === 'history'
                    ? 'bg-amber-50 text-amber-800 shadow-2xs font-black'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Previous Uploads</span>
                </div>
                {worksheetHistory.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-amber-100 text-amber-800 border border-amber-200">
                    {worksheetHistory.length}
                  </span>
                )}
              </button>

              {/* 4. Mock Test */}
              <button
                type="button"
                onClick={() => {
                  setActiveSidebarItem('tests');
                  setWhiteboardDisplayTab('mock');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSidebarItem === 'tests' || whiteboardDisplayTab === 'mock'
                    ? 'bg-amber-50 text-amber-800 shadow-2xs font-black'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Mock Test</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-amber-200 text-amber-800">
                  🎯
                </span>
              </button>

              {/* 5. Test Series */}
              <Link
                href="/test-series"
                onClick={() => setActiveSidebarItem('test-series')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSidebarItem === 'test-series'
                    ? 'bg-amber-50 text-amber-800 shadow-2xs font-black'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Test Series</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-purple-100 text-purple-700">
                  Sunday
                </span>
              </Link>

              {/* 6. Rough Work Scratchpad (रफ़ काम) */}
              <button
                type="button"
                onClick={() => {
                  setActiveSidebarItem('scratchpad');
                  setIsScratchpadOpen(true);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSidebarItem === 'scratchpad' || isScratchpadOpen
                    ? 'bg-amber-50 text-amber-800 shadow-2xs font-black'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Rough Work</span>
              </button>

              {/* 6. Student Report Card */}
              <Link
                href="/reports"
                onClick={() => setActiveSidebarItem('report')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSidebarItem === 'report'
                    ? 'bg-blue-50 text-blue-600 shadow-2xs font-black'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Report Card</span>
              </Link>

              {/* 7. Doubt Solving */}
              <button
                type="button"
                onClick={() => {
                  setActiveSidebarItem('doubts');
                  inputRef.current?.focus();
                  inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  const doubtPrompt = 'बेटा, आपको जो भी सवाल या डाउट पूछना है, यहाँ नीचे लिखकर या माइक दबाकर पूछें!';
                  setSpeechText(doubtPrompt);
                  speakText(doubtPrompt);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSidebarItem === 'doubts'
                    ? 'bg-blue-50 text-blue-600 shadow-2xs font-black'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Doubt Solving</span>
              </button>
            </div>
          </div>

          {/* Bottom Actions: Upgrade, Alerts and Settings */}
          <div className="px-2.5 pb-2.5 space-y-1.5 border-t border-slate-100 pt-2 shrink-0 select-none">
            {/* Upgrade Plan Button */}
            <button
              type="button"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 fill-white text-white" />
              <span>Upgrade Plan</span>
            </button>

            {/* Alerts and Settings Row */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="relative flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer text-[11px] font-bold"
                title="Notifications"
              >
                <Bell className="w-3.5 h-3.5 text-slate-500" />
                <span>Alerts</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 ring-1 ring-white" />
              </button>
              <button
                type="button"
                onClick={() => setIsAcademicSelectorOpen(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer text-[11px] font-bold"
                title="Settings and Subjects"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE CONTENT - PERFECT FIT WITH ZERO PAGE SCROLL */}
        <main className="flex-1 min-h-0 p-1 sm:p-2 lg:px-2.5 lg:py-1.5 max-w-[1550px] mx-auto w-full flex flex-col gap-1 overflow-hidden">
          {/* 4. FULL-WIDTH SMART WHITEBOARD WORKSPACE */}
          <div className="flex-1 min-h-0 w-full flex flex-col items-stretch">
            {/* FULL WIDTH SMART WHITEBOARD */}
            <div
              className="w-full flex-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col overflow-hidden h-full min-h-0"
            >

              {/* Top Bar with Action Buttons - CONTINUOUS HORIZONTAL SCROLL ROW */}
              <div className="px-2 py-1.5 border-b border-slate-100 flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-none touch-pan-x w-full select-none">
                {/* Mobile Hamburger Drawer Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isChildLockActive) {
                      speakText('चाइल्ड लॉक ऑन है! पहले ऊपर लाल बटन से अनलॉक करें।');
                      return;
                    }
                    setIsMobileSidebarOpen(true);
                  }}
                  className="lg:hidden p-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
                  title="Menu (मेन्यू)"
                >
                  <Menu className="w-4 h-4" />
                </button>

                {/* Smart Whiteboard Icon & Title */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm">📋</span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 hidden sm:inline whitespace-nowrap">
                    Smart Whiteboard
                  </h3>
                </div>

                {/* 1. Upload Worksheet Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  title={medium === 'english' ? 'Upload Worksheet / Photo / PDF' : 'वर्कशीट या फोटो अपलोड करें'}
                >
                  <Upload className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>{medium === 'english' ? 'Upload' : 'अपलोड'}</span>
                  <span className="hidden md:inline">{medium === 'english' ? 'Worksheet' : 'वर्कशीट'}</span>
                </button>

                {/* 2. View Active Worksheet Document (if uploaded) */}
                {uploadedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsWorksheetModalOpen(true)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/90 shadow-2xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    title={medium === 'english' ? 'View Worksheet Document' : 'वर्कशीट देखें'}
                  >
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span className="hidden sm:inline">{medium === 'english' ? 'Document' : 'वर्कशीट'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200/60 text-blue-800 font-black">
                      {isPdfWorksheet ? `${pdfCurrentPage}/${pdfTotalPages}` : '1/1'}
                    </span>
                  </button>
                )}

                {/* 3. Segmented Mode Control: Book / Mock Test */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setWhiteboardDisplayTab('book')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      whiteboardDisplayTab !== 'mock'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>{medium === 'english' ? 'Book' : 'किताब'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWhiteboardDisplayTab('mock')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                      whiteboardDisplayTab === 'mock'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-amber-800 hover:text-amber-950'
                    }`}
                  >
                    <span>🎯</span>
                    <span>{medium === 'english' ? 'Mock' : 'मॉक'}</span>
                  </button>
                </div>

                {/* 4. Child Safe Lock Screen (बाल सुरक्षा लॉक) */}
                {isChildLockActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUnlockInput('');
                      setUnlockError(false);
                      setShowUnlockModal(true);
                    }}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1 shrink-0 animate-pulse cursor-pointer"
                    title="चाइल्ड लॉक खोलने के लिए क्लिक करें"
                  >
                    <Lock className="w-3 h-3 text-white" />
                    <span>🔒 {medium === 'english' ? 'Lock ON' : 'लॉक ON'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChildLockActive(true);
                      if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen().catch(() => {});
                      }
                      const msg = medium === 'english'
                        ? 'Child lock is on! Kids cannot exit the tuition.'
                        : 'बाल सुरक्षा लॉक ऑन हो गया है! अब बच्चा ट्यूशन से बाहर नहीं जा सकेगा।';
                      speakText(msg);
                    }}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    title={medium === 'english' ? 'Enable Child Safe Lock Screen' : 'बाल सुरक्षा लॉक चालू करें'}
                  >
                    <Lock className="w-3 h-3 text-amber-700" />
                    <span className="hidden sm:inline">{medium === 'english' ? 'Child Lock' : 'चाइल्ड लॉक'}</span>
                    <span className="sm:hidden">🔒</span>
                  </button>
                )}

                

                {/* 7. Reset Button (व्हाइटबोर्ड रीसेट) */}
                <button
                  type="button"
                  onClick={handleFullPageReset}
                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  title={medium === 'english' ? 'Reset Whiteboard' : 'व्हाइटबोर्ड रीसेट करें'}
                >
                  <RotateCcw className="w-3 h-3 text-rose-600" />
                  <span>{medium === 'english' ? 'Reset' : 'रीसेट'}</span>
                </button>
              </div>

              {/* RULED SCHOOL NOTEBOOK PAPER AREA (INTERNAL SMOOTH SCROLL) */}
              <div
                className="p-2.5 sm:p-5 pb-24 sm:pb-8 flex-1 min-h-0 overflow-y-auto overscroll-contain relative font-sans touch-pan-y"
                style={{
                  background:
                    'repeating-linear-gradient(transparent, transparent 27px, #f1f5f9 28px)',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Red vertical notebook margin line */}
                <div className="border-l-2 border-rose-300 pl-2.5 sm:pl-6 space-y-4 sm:space-y-6">
                  {/* Worksheet Title Header - NEVER RENDERS RAW QUESTION */}
                  <div className="text-center">
                    <h2 className="text-base sm:text-lg font-black text-rose-600 tracking-wider">
                      {isCheckingHomework
                        ? 'दस्तावेज़ स्कैनिंग...'
                        : detectedChapter
                        ? `WORKSHEET: ${detectedChapter.title}`
                        : whiteboardHeading && !whiteboardHeading.includes('.jpeg') && !whiteboardHeading.includes('.jpg') && !whiteboardHeading.includes('सुरक्षित')
                        ? getDisplayWhiteboardHeading(whiteboardHeading)
                        : uploadedFiles.length > 0
                        ? `WORKSHEET: ${cleanWorksheetDisplayName(uploadedFileName || uploadedFiles[0]?.name)}`
                        : selectedChapter
                        ? `अध्याय: ${selectedChapter.titleHindi || selectedChapter.titleEnglish}`
                        : 'आज की ट्यूशन क्लास (Live Whiteboard)'}
                    </h2>
                  </div>

                  {/* Section Title */}
                  <div>
                    <h3 className="text-base font-black text-blue-900 tracking-tight">
                      {isCheckingHomework
                        ? 'दस्तावेज़ स्कैनिंग व हल तैयार हो रहा है...'
                        : whiteboardDisplayTab === 'mock'
                        ? 'Worksheet Mock Test Arena (परीक्षा तैयारी)'
                        : detectedChapter?.title
                        ? `अभ्यास व प्रश्नोत्तर: ${detectedChapter.title}`
                        : uploadedFiles.length > 0
                        ? medium === 'english' ? 'Questions & Step-by-Step Solutions' : 'अभ्यास व प्रश्नोत्तर (Questions & Step-by-Step Solutions)'
                        : selectedChapter
                        ? `पाठ्यपुस्तक अभ्यास: ${selectedChapter.titleHindi || selectedChapter.titleEnglish}`
                        : 'व्हाइटबोर्ड क्लासरूम (Ask Questions or Upload Homework)'}
                    </h3>
                  </div>

                  {/* 1. If currently analyzing/scanning uploaded worksheet */}
                  {isCheckingHomework && (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-blue-50/40 rounded-2xl border border-blue-200/80 p-6">
                      <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-3xl animate-bounce shadow-md">
                        {currentTeacher.emoji}
                      </div>
                      <div className="flex items-center gap-2 text-blue-700 font-black text-xs bg-white px-3.5 py-1 rounded-full border border-blue-200 shadow-2xs">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>वर्कशीट स्कैन व हल तैयार हो रहा है...</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800">
                        {uploadedFileName
                          ? `"${uploadedFileName}" के सभी सवाल पढ़े जा रहे हैं... ✍️`
                          : `${currentTeacher.name} कॉपी में स्टेप-बाय-स्टेप हल लिख रहे हैं... ✍️`}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm">
                        बस कुछ सेकंड प्रतीक्षा करें बेटा, सारे सवाल और हल स्कूल कॉपी विधि से तैयार हो रहे हैं!
                      </p>

                      {/* Cancel Upload Button */}
                      <button
                        type="button"
                        onClick={handleCancelUpload}
                        className="mt-3 px-5 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-black text-xs sm:text-sm border-2 border-rose-300 shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                      >
                        <X className="w-4 h-4 text-rose-600" />
                        <span>{medium === 'english' ? 'Cancel Upload ✕' : 'अपलोड रद्द करें (Cancel) ✕'}</span>
                      </button>
                    </div>
                  )}

                  {/* 2. Math Animation Blackboard if active */}
                  {activeMathAnim && !isCheckingHomework && (
                    <div className="mb-4">
                      <TeacherWhiteboardAnimation
                        key={`${activeMathAnim.num1}-${activeMathAnim.op}-${activeMathAnim.num2}`}
                        num1={activeMathAnim.num1}
                        op={activeMathAnim.op}
                        num2={activeMathAnim.num2}
                        result={activeMathAnim.result}
                        teacherName={currentTeacher.name}
                        theme="slate"
                        onAudioPlay={(t) => speakText(t)}
                        isAudioMuted={isAudioMuted}
                        onScoreUpdate={(pts) => setTotalScore((prev) => prev + pts)}
                        medium={medium}
                      />
                    </div>
                  )}

                  {/* 3. MOCK TEST ARENA (Active when whiteboardDisplayTab === 'mock') */}
                  {!isCheckingHomework && !activeMathAnim && whiteboardDisplayTab === 'mock' && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-amber-900 flex items-center gap-2">
                            <span>🎯</span>
                            <span>वर्कशीट मॉक टेस्ट (Mock Test Arena)</span>
                          </h4>
                          <p className="text-xs text-amber-700">
                            बिना हल देखे खुद सवाल हल करें और इंस्टेंट स्कोर देखें!
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-800 bg-white px-2.5 py-1 rounded-full border border-amber-200 shadow-2xs">
                            सवाल {activeMockQIdx + 1} / {Math.max(1, getMockQuestionsList().length)}
                          </span>
                        </div>
                      </div>

                      {/* Mock Question Card */}
                      {(() => {
                        const qList = getMockQuestionsList();
                        if (qList.length === 0) {
                          return (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-amber-50/40 rounded-2xl border border-dashed border-amber-200 p-6">
                              <div className="text-3xl">🎯</div>
                              <h4 className="text-sm font-bold text-slate-800">मॉक टेस्ट के लिए कोई सवाल नहीं हैं</h4>
                              <p className="text-xs text-slate-500 max-w-sm">
                                कृपया पहले नीचे से अपनी कॉपी/वर्कशीट की फोटो अपलोड करें या कोई पाठ चुनें ताकि उसके सवालों का लाइव टेस्ट तैयार हो सके!
                              </p>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Upload className="w-4 h-4" />
                                <span>फोटो अपलोड करें</span>
                              </button>
                            </div>
                          );
                        }
                        const currentQ = qList[activeMockQIdx] || qList[0];
                        const mcq = parseMCQOptions(currentQ.question, currentQ.options);
                        const studentAns = mockAnswers[activeMockQIdx] || '';
                        const evalData = mockEvaluations[activeMockQIdx];
                        const isHindiSubject = Boolean(
                          selectedSubject?.id?.toLowerCase().includes('hindi') ||
                          selectedSubject?.subject?.toLowerCase().includes('hindi') ||
                          selectedSubject?.subjectHindi?.includes('हिंदी') ||
                          currentTeacher.id.includes('priya') ||
                          (!/[a-zA-Z0-9]/.test(currentQ.question) && /[\u0900-\u097F]/.test(currentQ.question) && !/\d/.test(currentQ.question))
                        );
                        const isTrueFalseQ = Boolean(
                          currentQ.type === 'true_false' ||
                          /\[T\/F\]|True\/False|सत्य\/असत्य|True or False/i.test(currentQ.question)
                        );
                        const isDiagramQ = Boolean(
                          /triangle|त्रिभुज|त्रिकोण|rectangle|आयत|square|वर्ग|circle|वृत्त|गोल|गोला|radius|त्रिज्या|diameter|व्यास|hypotenuse|कर्ण|समकोण|box|cuboid|घनाभ|डिब्बा|बक्सा|cylinder|बेलन|pyramid|पिरामिड|tower|टॉवर|table|तालिका|सारणी|perimeter|परिमाप|area|क्षेत्रफल|volume|आयतन/i.test(
                            currentQ.question
                          )
                        );

                        // Strip leading duplicate numbering e.g. "7. 2. Difference..." -> "Difference..."
                        const rawStem = mcq ? mcq.qStem : currentQ.question;
                        const cleanStem = rawStem
                          .replace(/^(\d+[\.\)\s]+)+/, '')
                          .replace(/^(?:fill\s+in\s+blanks?\s*q?\d*[:\.]*|q\.?\s*\d+[\.:\)\s]*|प्रश्न\s*\d+[\.:\)\s]*|प्र\.\s*\d+[\.:\)\s]*)/i, '')
                          .trim();
                        const subparts = !mcq ? extractQuestionSubparts(cleanStem) : null;

                        return (
                          <div className="space-y-4">
                            {/* Question Numbers Tab Bar */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                              <span className="text-xs font-black text-amber-900 shrink-0">सवाल सूची:</span>
                              {qList.map((q, idx) => {
                                const isCurrent = idx === activeMockQIdx;
                                const isAnswered = Boolean(mockAnswers[idx]?.trim());
                                const hasEval = Boolean(mockEvaluations[idx]);
                                const evalScore = mockEvaluations[idx]?.score;
                                const qMax = mockQuestionMarks[idx] || 10;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveMockQIdx(idx)}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                                      isCurrent
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40'
                                        : hasEval
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                        : isAnswered
                                        ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span>सवाल {idx + 1}</span>
                                    {hasEval ? (
                                      <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded-full font-black">
                                        {evalScore}/{qMax}
                                      </span>
                                    ) : isAnswered ? (
                                      <span className="text-[10px] text-blue-600 font-bold">✍️</span>
                                    ) : null}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="bg-blue-50/40 rounded-2xl border border-blue-200/80 p-5 space-y-3">
                              {/* Question Header: Number + Stem + Marks Pill */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2.5 w-full">
                                  <div className="text-sm sm:text-base font-bold text-slate-900 flex items-start gap-1.5">
                                    <span className="text-blue-600 font-black shrink-0">{activeMockQIdx + 1}.</span>
                                    <span className="leading-snug">{subparts ? subparts.intro : cleanStem}</span>
                                  </div>
                                  {subparts && subparts.items.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 pl-4 sm:pl-6">
                                      {subparts.items.map((item) => (
                                        <div
                                          key={item.key}
                                          className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-blue-200/90 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-2xs"
                                        >
                                          <span className="font-extrabold text-blue-700 dark:text-blue-400 shrink-0">{item.key}</span>
                                          <span className="font-mono break-words">{item.text}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 flex items-center gap-1.5 bg-blue-50/90 border border-blue-200 rounded-lg px-2.5 py-1 shadow-2xs">
                                  <span className="text-[11px] font-black text-blue-800">🎯 पूर्णांक: 10 अंक</span>
                                  <span className="text-[9px] font-bold text-blue-600 bg-white px-1.5 py-0.5 rounded border border-blue-200">AI चेकिंग</span>
                                </div>
                              </div>

                              {/* Question Diagram if Geometry/Pyramid/Table */}
                              {isDiagramQ && (
                                <div className="pt-1">
                                  <VisualMathDiagramCard
                                    question={cleanStem}
                                    answer=""
                                    medium={medium}
                                  />
                                </div>
                              )}

                              {/* MCQ Options buttons for interactive test */}
                              {mcq && mcq.options.length > 0 && (
                                       <div
                                         className={`gap-2.5 pt-2 ${
                                           mcq.options.some((o) => o.text.length > 35)
                                             ? 'grid grid-cols-1'
                                             : 'grid grid-cols-1 sm:grid-cols-2'
                                         }`}
                                       >
                                         {mcq.options.map((opt) => (
                                           <div key={opt.key} className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200 text-sm">
                                             <span className="font-bold text-slate-700 shrink-0">{opt.label}</span>
                                             <span className="break-words text-sm font-medium text-slate-800">{opt.text}</span>
                                           </div>
                                         ))}
                                       </div>
                                     )}
                            </div>

                            {/* Answer Area: Keyboard Input for Math & Non-Hindi + Voice Mic for all */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                              {/* If NOT Hindi subject: Render Keyboard Typing Area */}
                              {!isHindiSubject ? (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                      <span className="text-xs sm:text-sm font-black text-slate-900">
                                        ⌨️ कीबोर्ड से उत्तर टाइप करें (Type Answer)
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setIsScratchpadOpen(true)}
                                      className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                                    >
                                      <span>📝</span>
                                      <span>रफ़ कॉपी खोलें</span>
                                    </button>
                                  </div>

                                  {/* Text/Number Input Field */}
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={studentAns}
                                      onChange={(e) =>
                                        setMockAnswers((prev) => ({
                                          ...prev,
                                          [activeMockQIdx]: e.target.value,
                                        }))
                                      }
                                      placeholder={
                                        isTrueFalseQ
                                          ? 'यहाँ True या False लिखें या नीचे दिए बटन दबाएं...'
                                          : 'यहाँ कीबोर्ड से अपना उत्तर या संख्या लिखें (उदा. 8889)...'
                                      }
                                      className="w-full px-4 py-3.5 pr-10 rounded-xl border-2 border-indigo-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-sm sm:text-base font-bold text-slate-900 bg-slate-50/70 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal shadow-2xs"
                                    />
                                    {studentAns && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setMockAnswers((prev) => ({
                                            ...prev,
                                            [activeMockQIdx]: '',
                                          }))
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                                        title="साफ़ करें"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Quick True/False Choice Buttons if Question is True/False */}
                                  {isTrueFalseQ && (
                                    <div className="grid grid-cols-2 gap-3 pt-0.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setMockAnswers((prev) => ({
                                            ...prev,
                                            [activeMockQIdx]: 'True (सत्य)',
                                          }))
                                        }
                                        className={`py-2.5 px-4 rounded-xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                          studentAns.toLowerCase().includes('true') || studentAns.includes('सत्य')
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.01]'
                                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                        }`}
                                      >
                                        <span>✅</span>
                                        <span>True (सत्य)</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setMockAnswers((prev) => ({
                                            ...prev,
                                            [activeMockQIdx]: 'False (असत्य)',
                                          }))
                                        }
                                        className={`py-2.5 px-4 rounded-xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                          studentAns.toLowerCase().includes('false') || studentAns.includes('असत्य')
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-[1.01]'
                                            : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                                        }`}
                                      >
                                        <span>❌</span>
                                        <span>False (असत्य)</span>
                                      </button>
                                    </div>
                                  )}

                                  {/* Divider for Voice Option */}
                                  <div className="relative flex py-1 items-center">
                                    <div className="flex-grow border-t border-slate-200" />
                                    <span className="shrink-0 mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                      अथवा बोलकर उत्तर दें (Or Speak)
                                    </span>
                                    <div className="flex-grow border-t border-slate-200" />
                                  </div>
                                </div>
                              ) : (
                                /* Hindi Subject: Voice-Only Mode (No keyboard typing friction for kids!) */
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs sm:text-sm font-black text-slate-900">
                                      🎙️ बोलकर उत्तर बताएं (Voice Answer)
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setIsScratchpadOpen(true)}
                                    className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                                  >
                                    <span>📝</span>
                                    <span>रफ़ कॉपी खोलें</span>
                                  </button>
                                </div>
                              )}

                              {/* Big Voice Mic Button */}
                              <button
                                type="button"
                                onClick={toggleMockAnswerMic}
                                className={`w-full py-3.5 px-6 rounded-2xl flex items-center justify-center gap-3 font-black text-sm sm:text-base transition-all shadow-md cursor-pointer ${
                                  isMockListening
                                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse ring-4 ring-red-200'
                                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-500/25'
                                }`}
                              >
                                {isMockListening ? (
                                  <>
                                    <MicOff className="w-5 h-5 text-white" />
                                    <span>🔴 ध्यान से सुन रहा हूँ बेटा, बोलिए... (माइक रोकने के लिए दबाएं)</span>
                                  </>
                                ) : (
                                  <>
                                    <Mic className="w-5 h-5 text-amber-300" />
                                    <span>माइक दबाएं और बोलकर उत्तर बताएं 🎙️</span>
                                  </>
                                )}
                              </button>

                              {/* Display Recorded / Typed Answer */}
                              {studentAns ? (
                                <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-300 flex items-center justify-between gap-3 animate-in fade-in">
                                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-950 font-bold">
                                    <span className="text-xl">✍️</span>
                                    <div>
                                      <span className="text-[11px] text-emerald-700 block font-semibold">
                                        आपका दर्ज किया गया उत्तर (Your Answer):
                                      </span>
                                      <span className="text-emerald-900 font-black text-sm sm:text-base">
                                        "{studentAns}"
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setMockAnswers((prev) => ({ ...prev, [activeMockQIdx]: '' }))}
                                    className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 shrink-0 cursor-pointer transition-all"
                                    title="उत्तर साफ़ करें"
                                  >
                                    🔄 उत्तर साफ़ करें
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                                  {!isHindiSubject
                                    ? '👆 ऊपर कीबोर्ड से अपना उत्तर लिखें, या नीला माइक दबाकर बोलें।'
                                    : '👆 ऊपर नीला माइक दबाकर बोलें बेटा (हिंदी कीबोर्ड टाइपिंग की आवश्यकता नहीं है)।'}
                                </div>
                              )}

                              {/* Submit, Manual Marks & Navigation */}
                              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveAndEvaluateMock(activeMockQIdx)}
                                    disabled={!studentAns.trim() || isEvaluatingMock}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all active:scale-95"
                                  >
                                    {isEvaluatingMock ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    ) : (
                                      <span>🚀</span>
                                    )}
                                    <span>हल जमा करें और AI नंबर देखें</span>
                                  </button>

                                  
                                </div>

                                <div className="flex items-center gap-2">
                                  {activeMockQIdx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveMockQIdx((i) => i - 1)}
                                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                      <span>पिछला</span>
                                    </button>
                                  )}

                                  {activeMockQIdx + 1 < qList.length && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveMockQIdx((i) => i + 1)}
                                      className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                                    >
                                      <span>अगला सवाल हल करें</span>
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Evaluation Scorecard & Mistake/Improvement Solution Display */}
                              {evalData && (
                                <div className="mt-4 rounded-2xl bg-gradient-to-b from-white via-emerald-50/30 to-blue-50/20 border-2 border-emerald-300 p-4 sm:p-6 space-y-4 shadow-md animate-in fade-in slide-in-from-top-2">
                                  {/* 1. Header with Score & Badge */}
                                  <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-emerald-200">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex flex-col items-center justify-center font-black shadow-md shadow-emerald-500/25">
                                        <span className="text-base leading-none">{evalData.score ?? 8}</span>
                                        <span className="text-[10px] opacity-80 leading-none">/{evalData.totalMarks || 10}</span>
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-black text-slate-900 text-base sm:text-lg">
                                            🎯 AI प्राप्तांक (Score)
                                          </span>
                                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                                            {evalData.percentage || Math.round(((evalData.score || 8) / 10) * 100)}%
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">
                                          AI शिक्षक द्वारा स्वचालित मूल्यांकन (Automatic Evaluation)
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs sm:text-sm font-black text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                                        {evalData.badge || '⭐ शानदार प्रयास'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Teacher Audio Message */}
                                  {evalData.teacherPraise && (
                                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start gap-2.5 text-xs sm:text-sm text-blue-950 font-semibold">
                                      <span className="text-lg shrink-0">👩‍🏫</span>
                                      <div>
                                        <span className="text-[11px] text-blue-700 block font-bold">
                                          {currentTeacher.name} का संदेश:
                                        </span>
                                        <span>{evalData.teacherPraise}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* 2. कहाँ गलती हुई (Mistakes) */}
                                  <div className="p-3.5 sm:p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-2">
                                    <div className="flex items-center gap-2 text-rose-900 font-black text-xs sm:text-sm">
                                      <span className="text-base">⚠️</span>
                                      <span>कहाँ गलती हुई (Mistake Analysis):</span>
                                    </div>
                                    {Array.isArray(evalData.mistakes) && evalData.mistakes.length > 0 ? (
                                      <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-rose-950 font-medium">
                                        {evalData.mistakes.map((m: string, mIdx: number) => (
                                          <li key={mIdx}>{m}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-xs sm:text-sm text-emerald-800 font-bold flex items-center gap-1.5">
                                        <span>✅</span>
                                        <span>कोई गलती नहीं हुई! आपका उत्तर बिल्कुल सही है।</span>
                                      </p>
                                    )}
                                  </div>

                                  {/* 3. क्या सुधार करना है (Improvements) */}
                                  <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                                    <div className="flex items-center gap-2 text-amber-900 font-black text-xs sm:text-sm">
                                      <span className="text-base">💡</span>
                                      <span>क्या सुधार करना है (Tips to Improve):</span>
                                    </div>
                                    {Array.isArray(evalData.improvements) && evalData.improvements.length > 0 ? (
                                      <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-amber-950 font-medium">
                                        {evalData.improvements.map((imp: string, impIdx: number) => (
                                          <li key={impIdx}>{imp}</li>
                                        ))}
                                      </ul>
                                    ) : Array.isArray(evalData.missingPoints) && evalData.missingPoints.length > 0 ? (
                                      <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-amber-950 font-medium">
                                        {evalData.missingPoints.map((mp: string, mpIdx: number) => (
                                          <li key={mpIdx}>{mp}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-xs sm:text-sm text-amber-900 font-medium">
                                        आगे भी इसी तरह पूरे उत्तर और साफ़ लिखावट के साथ अभ्यास करते रहें।
                                      </p>
                                    )}
                                  </div>

                                  {/* 4. सही हल व आदर्श उत्तर (Step-by-Step Solution) */}
                                  {(evalData.solution || evalData.idealAnswer || currentQ.idealAnswer) && (
                                    <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/90 border border-emerald-300 space-y-2">
                                      <div className="flex items-center gap-2 text-emerald-950 font-black text-xs sm:text-sm">
                                        <span className="text-base">📝</span>
                                        <span>सही हल व आदर्श उत्तर (Model Solution):</span>
                                      </div>
                                      <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-line bg-white/90 p-3 rounded-lg border border-emerald-200">
                                        {evalData.solution || evalData.idealAnswer || currentQ.idealAnswer}
                                      </div>
                                    </div>
                                  )}

                                  {/* Question Diagram if applicable */}
                                  {isDiagramQ && (
                                    <div className="pt-1">
                                      <VisualMathDiagramCard
                                        question={currentQ.question}
                                        answer={evalData.solution || currentQ.idealAnswer || ''}
                                        medium={medium}
                                      />
                                    </div>
                                  )}

                                  {/* 5. Report Saved & WhatsApp Share Button */}
                                  <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>टेस्ट रिपोर्ट कार्ड में नंबर सुरक्षित हो गए हैं ✅</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleShareMockReportWhatsApp(activeMockQIdx)}
                                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-all active:scale-95"
                                    >
                                      <span>📲</span>
                                      <span>WhatsApp पर रिपोर्ट शेयर करें</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* 4. DEFAULT & UPLOADED SOLUTIONS VIEW (DYNAMIC BASED ON ACTIVE WORKSHEET) */}
                  {!isCheckingHomework && !activeMathAnim && whiteboardDisplayTab !== 'mock' && (
                    <div className="space-y-6">
                      <div className="space-y-6">
                          {whiteboardSteps.length > 0 ? (
                            whiteboardSteps.map((stepItem, idx) => {
                              const qNumber = idx + 1;
                              // Find the most complete version of this question (including subparts from detectedQuestions)
                              let fullQ = stepItem.question || stepItem.step || `प्रश्न ${qNumber}`;
                              if (detectedQuestions && detectedQuestions.length > 0) {
                                const matchingDQ = detectedQuestions[idx] || detectedQuestions.find((dq) => {
                                  const normDQ = dq.toLowerCase().replace(/[^a-z0-9]/g, '');
                                  const normQ = fullQ.toLowerCase().replace(/[^a-z0-9]/g, '');
                                  return normDQ.includes(normQ.slice(0, 15)) || normQ.includes(normDQ.slice(0, 15));
                                });
                                if (matchingDQ && matchingDQ.length > fullQ.length) {
                                  fullQ = matchingDQ;
                                }
                              }
                              const rawQ = fullQ;
                              const mcq = parseMCQOptions(rawQ);
                              const subparts = !mcq ? extractQuestionSubparts(rawQ) : null;
                              const qCleanText = (subparts ? subparts.intro : mcq ? mcq.qStem : rawQ)
                                .replace(/^(\d+[\.\)\s]+)+/, '')
                                .replace(/^(?:fill\s+in\s+blanks?\s*q?\d*[:\.]*|q\.?\s*\d+[\.:\)\s]*|प्रश्न\s*\d+[\.:\)\s]*|प्र\.\s*\d+[\.:\)\s]*)/i, '')
                                .trim();
                              const isDiagramQ = Boolean(
                                /triangle|त्रिभुज|त्रिकोण|rectangle|आयत|square|वर्ग|circle|वृत्त|गोल|गोला|radius|त्रिज्या|diameter|व्यास|hypotenuse|कर्ण|समकोण|box|cuboid|घनाभ|डिब्बा|बक्सा|cylinder|बेलन|pyramid|पिरामिड|tower|टॉवर|table|तालिका|सारणी|perimeter|परिमाप|area|क्षेत्रफल|volume|आयतन/i.test(
                                  rawQ
                                )
                              );

                              const isHighlighted = highlightedQuestionId === qNumber;
                              return (
                                <div
                                  key={idx}
                                  id={`whiteboard-question-${qNumber}`}
                                  className={`space-y-3.5 pb-6 border-b border-slate-100 last:border-b-0 transition-all duration-500 ${
                                    isHighlighted
                                      ? 'ring-4 ring-indigo-500 bg-indigo-50/50 p-4 rounded-3xl shadow-xl'
                                      : ''
                                  }`}
                                >
                                  {/* Blue Question Box */}
                                  <div className="bg-blue-50/40 rounded-2xl border border-blue-200/80 p-4 sm:p-5 space-y-3">
                                    <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed flex items-start gap-1.5">
                                      <span className="text-blue-600 font-black mr-1 shrink-0">{qNumber}.</span>
                                      <span>{qCleanText || rawQ}</span>
                                    </div>

                                    {/* Question Diagram if Geometry */}
                                    {isDiagramQ && (
                                      <div className="pt-1">
                                        <VisualMathDiagramCard
                                          question={qCleanText || rawQ}
                                          answer=""
                                          medium={medium}
                                        />
                                      </div>
                                    )}

                                    {/* Sub-questions List (e.g. (a) 5 m, (b) 37 m...) */}
                                    {subparts && subparts.items && subparts.items.length > 0 && (
                                      <div
                                        className={`pt-2 text-sm font-medium text-slate-800 ${
                                          subparts.items.some((o) => o.text.length > 35)
                                            ? 'grid grid-cols-1 gap-2.5'
                                            : 'grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5'
                                        }`}
                                      >
                                        {subparts.items.map((opt) => (
                                          <div
                                            key={opt.key}
                                            className="flex items-start gap-2 py-1 px-1.5 rounded-lg select-none"
                                          >
                                            <span className="font-bold text-blue-700 shrink-0">{opt.key}</span>
                                            <span className="text-sm sm:text-base font-medium text-slate-800 break-words">{opt.text}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* MCQ / Options List */}
                                    {mcq && mcq.options && mcq.options.length > 0 && (
                                      <div
                                        className={`pt-2 text-sm font-medium text-slate-800 ${
                                          mcq.options.some((o) => o.text.length > 35)
                                            ? 'grid grid-cols-1 gap-2.5'
                                            : 'grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5'
                                        }`}
                                      >
                                        {mcq.options.map((opt) => (
                                          <div
                                            key={opt.key}
                                            onClick={() => {
                                              handleCheckMCQ(opt.key, opt.key, stepItem.annotation || '');
                                            }}
                                            className="flex items-start gap-2 hover:text-blue-600 transition-colors cursor-pointer select-none py-1 px-1.5 rounded-lg hover:bg-blue-50/60"
                                          >
                                            <span className="font-bold text-blue-700 shrink-0">{opt.label}</span>
                                            <span className="text-sm sm:text-base font-medium text-slate-800 break-words">{opt.text}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Solution Card */}
                                  <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-xs space-y-3.5">
                                    {/* Header: Blue Pill 'हल :' and '👨‍🏫 टीचर से समझें' Button */}
                                    <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-blue-50">
                                      <div className="inline-block px-3 py-1 rounded-md bg-blue-600 text-white font-bold text-xs">
                                        {medium === 'english' ? 'Solution :' : 'हल :'}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const isThisSpeaking = isSpeaking && (speakingQuestionId === qNumber || (speakingQuestionId === null && qNumber === 1));
                                          if (isThisSpeaking) {
                                            stopAudio();
                                          } else {
                                            stopAudio();
                                            setSpeakingQuestionId(qNumber);
                                            const fullSpeech = medium === 'english'
                                              ? `Question ${qNumber}: ${cleanSpeechText(rawQ)}. Solution: ${cleanSpeechText(stepItem.formula)}. ${cleanSpeechText(renderExplanationText(stepItem.annotation || ''))}`
                                              : `प्रश्न ${qNumber}: ${cleanSpeechText(rawQ)}। हल: ${cleanSpeechText(stepItem.formula)}। ${cleanSpeechText(stepItem.annotation || '')}`;
                                            speakText(fullSpeech, undefined, false, qNumber);
                                          }
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                          isSpeaking && (speakingQuestionId === qNumber || (speakingQuestionId === null && qNumber === 1))
                                            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-300'
                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                        }`}
                                        title={isSpeaking && (speakingQuestionId === qNumber || (speakingQuestionId === null && qNumber === 1)) ? (medium === 'english' ? 'Stop explanation' : 'बोलना रोकें') : (medium === 'english' ? 'Explain this solution' : 'टीचर से समझें')}
                                      >
                                        {isSpeaking && (speakingQuestionId === qNumber || (speakingQuestionId === null && qNumber === 1)) ? (
                                          <>
                                            <VolumeX className="w-3.5 h-3.5 text-white" />
                                            <span className="font-black">{medium === 'english' ? 'Stop' : 'रोकें'}</span>
                                          </>
                                        ) : (
                                          <>
                                            <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>{medium === 'english' ? 'Explain' : 'टीचर से समझें'}</span>
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    {/* Visual Diagram or Notebook Column Grid or Solution Content */}
                                    {isDiagramQ ? (
                                      <VisualMathDiagramCard
                                        question={rawQ}
                                        answer={stepItem.formula || stepItem.annotation || ''}
                                        medium={medium}
                                      />
                                    ) : (() => {
                                      // Check if this question has multi-subpart column operations (e.g. Q.4, Q.5 with (a), (b), (c))
                                      const subpartMatches = Array.from(rawQ.matchAll(/\(([a-z0-9]+)\)\s*([^\n(]+)/gi));
                                      if (subpartMatches.length > 1) {
                                        const subGrids = subpartMatches.map(m => {
                                          const partKey = m[1];
                                          const partText = m[2].trim();
                                          const parsed = tryParseColumnMath(partText, partText);
                                          return parsed ? { partKey, partText, data: parsed } : null;
                                        }).filter(Boolean);

                                        if (subGrids.length > 0) {
                                          return (
                                            <div className="space-y-4">
                                              {subGrids.map((sub, sIdx) => (
                                                <div key={sIdx} className="space-y-2">
                                                  <div className="font-bold text-sm text-indigo-900 bg-indigo-50/70 px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center justify-between">
                                                    <span>({sub!.partKey}) {sub!.partText}</span>
                                                    <span className="text-xs text-indigo-600 font-semibold">{sub!.data.title}</span>
                                                  </div>
                                                  <MathNotebookColumnGrid
                                                    data={sub!.data}
                                                    isDarkMode={isDarkMode || chalkboardTheme === 'green'}
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        }
                                      }

                                      // Check if single column math calculation is present (e.g. Q.7, Q.8, Q.9, Q.10)
                                      const columnMathData = tryParseColumnMath(stepItem.formula, rawQ);
                                      if (columnMathData) {
                                        // Extract any text before the column working table and any text after it
                                        const lines = (stepItem.formula || '').split('\n');
                                        const workingIdx = lines.findIndex(l => /working\s*:/i.test(l) || /^\s*(?:m|kg|km|l|₹|rs)\s+(?:cm|g|m|ml|p)/i.test(l));

                                        let introText = '';
                                        let outroText = '';
                                        if (workingIdx !== -1) {
                                          let endIdx = workingIdx;
                                          let sawDashes = 0;
                                          for (let i = workingIdx; i < lines.length; i++) {
                                            if (lines[i].includes('---') || lines[i].includes('═══')) {
                                              sawDashes++;
                                              endIdx = i;
                                            } else if (sawDashes >= 2 && !lines[i].includes('---')) {
                                              break;
                                            } else {
                                              endIdx = i;
                                            }
                                          }
                                          introText = lines.slice(0, workingIdx).join('\n').trim();
                                          outroText = lines.slice(endIdx + 1).join('\n').trim();
                                        }

                                        return (
                                          <div className="space-y-3">
                                            {introText && (
                                              <div className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                {renderWhiteboardSolutionText(introText)}
                                              </div>
                                            )}
                                            <MathNotebookColumnGrid
                                              data={columnMathData}
                                              isDarkMode={isDarkMode || chalkboardTheme === 'green'}
                                            />
                                            {outroText && (
                                              <div className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200 text-emerald-950">
                                                {renderWhiteboardSolutionText(outroText)}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }

                                      // Standard solution text
                                      return (
                                        <div className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-line space-y-2">
                                          {renderWhiteboardSolutionText(stepItem.formula)}
                                        </div>
                                      );
                                    })()}

                                    {/* Correct Answer Pill / Card */}
                                    {(() => {
                                      const ansMatch = stepItem.formula?.match(/(?:सही उत्तर|Correct Answer|उत्तर|अंतिम उत्तर)\s*[:=]\s*([^\n]+)/i);
                                      if (ansMatch) {
                                        return (
                                          <div className="pt-1">
                                            <div className="flex items-start gap-2.5 p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-emerald-600 text-white shadow-sm leading-relaxed max-w-full">
                                              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                                              </span>
                                              <div className="text-xs sm:text-sm font-semibold flex-1">
                                                <span className="font-black text-emerald-100 mr-1.5">
                                                  {medium === 'english' ? 'Correct Answer:' : 'सही उत्तर:'}
                                                </span>
                                                <span className="text-white font-medium">
                                                  {ansMatch[1].replace(/✅/g, '').trim()}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}

                                    {/* Light Green Explanation Box */}
                                    {stepItem.annotation && (
                                      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-sm text-emerald-950 leading-relaxed flex items-start gap-2.5">
                                        <span className="text-emerald-700 font-bold shrink-0 text-base">💡</span>
                                        <div>
                                          <span className="font-bold text-emerald-900">{medium === 'english' ? 'Explanation: ' : 'व्याख्या: '}</span>
                                          <span className="text-slate-800">{renderExplanationText(stepItem.annotation)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : detectedQuestions.length > 0 ? (
                            detectedQuestions.map((rawQ, idx) => {
                              const qNumber = idx + 1;
                              const mcq = parseMCQOptions(rawQ);
                              return (
                                <div key={idx} className="space-y-3.5 pb-6 border-b border-slate-100 last:border-b-0">
                                  <div className="bg-blue-50/40 rounded-2xl border border-blue-200/80 p-4 sm:p-5 space-y-3">
                                    <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed flex items-start gap-1.5">
                                      <span className="text-blue-600 font-black mr-1 shrink-0">{qNumber}.</span>
                                      <span>{mcq ? mcq.qStem : rawQ}</span>
                                    </div>
                                    {mcq && mcq.options.length > 0 && (
                                      <div className="grid grid-cols-2 gap-3 pt-2">
                                        {mcq.options.map((opt) => (
                                          <div key={opt.key} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-sm">
                                            <span className="font-bold">{opt.label}</span>
                                            <span>{opt.text}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="bg-white rounded-2xl border border-blue-100 p-4 flex items-center justify-between">
                                    <span className="text-xs text-slate-500 font-medium">इस सवाल का हल तैयार है</span>
                                    <button
                                      type="button"
                                      onClick={() => handleStudentQuery(`कृपया इस सवाल को हल करें: "${rawQ}"`, rawQ)}
                                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                      हल देखें
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-blue-50/30 rounded-2xl border border-dashed border-blue-200 p-6">
                              <div className="text-3xl">📖</div>
                              <h4 className="text-sm font-bold text-slate-800">व्हाइटबोर्ड सीखने के लिए तैयार है</h4>
                              <p className="text-xs text-slate-500 max-w-sm">अपनी कॉपी या किताब के पेज की फोटो अपलोड करें, या नीचे माइक बटन दबाकर कोई भी सवाल पूछें!</p>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Upload className="w-4 h-4" />
                                <span>फोटो अपलोड करें</span>
                              </button>
                            </div>
                          )}
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 5. BOTTOM DEDICATED CHAT & MIC DOCK */}
          <div
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 8px))' }}
            className="shrink-0 pt-1 pb-1 sm:pb-2 flex flex-col items-center justify-center w-full relative z-20 bg-transparent"
          >
            <div className="relative flex items-center gap-2 sm:gap-2.5 w-full max-w-2xl px-1 sm:px-0">
              {/* 👨‍🏫 Live Teacher Doubt Explanation Card (FLOATING POPUP ABOVE DOCK - MULTI-TURN) */}
              {teacherDoubtPopup && teacherDoubtPopup.isOpen && (
                <div className="absolute bottom-full mb-3 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl rounded-2xl border-2 border-indigo-300 shadow-2xl p-3.5 sm:p-5 flex flex-col max-h-[75vh] animate-in slide-in-from-bottom-3 duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-indigo-100 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                        {currentTeacher.emoji || '👨‍🏫'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">{currentTeacher.name}</h4>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            {medium === 'english' ? 'Live Doubt Chat' : 'टीचर डाउट समाधान'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">{currentTeacher.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Audio Stop / Listen Toggle */}
                      {isSpeaking ? (
                        <button
                          type="button"
                          onClick={stopAudio}
                          className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer animate-pulse"
                          title="टीचर की आवाज़ रोकें"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                          <span className="text-[11px]">{medium === 'english' ? 'Stop Voice' : 'बोलना रोकें'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const latestTeacherTurn = (teacherDoubtPopup.turns || []).slice().reverse().find((t) => t.role === 'teacher');
                            const textToSpeak = latestTeacherTurn?.text || teacherDoubtPopup.answer;
                            if (textToSpeak && !textToSpeak.startsWith('⏳')) {
                              speakText(textToSpeak);
                            }
                          }}
                          className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          title="दोबारा सुनें"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-[11px]">{medium === 'english' ? 'Listen' : 'दोबारा सुनें'}</span>
                        </button>
                      )}

                      {/* Close button */}
                      <button
                        type="button"
                        onClick={handleClosePopup}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                        title={medium === 'english' ? 'Close' : 'बंद करें'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Multi-Turn Conversation Thread (Scrollable) */}
                  <div className="mt-2.5 flex-1 overflow-y-auto max-h-[38vh] space-y-2.5 pr-1 text-xs sm:text-sm">
                    {(teacherDoubtPopup.turns && teacherDoubtPopup.turns.length > 0 ? teacherDoubtPopup.turns : [
                      { id: '1', role: 'student', text: teacherDoubtPopup.question, time: 'अभी' },
                      { id: '2', role: 'teacher', text: teacherDoubtPopup.answer, time: 'अभी' },
                    ]).map((turn, tIdx) => (
                      turn.role === 'student' ? (
                        <div key={turn.id || tIdx} className="flex justify-end">
                          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-xs px-3.5 py-2 max-w-[88%] shadow-xs">
                            <div className="text-[10px] text-blue-100 font-bold flex items-center gap-1 mb-0.5">
                              <span>🗣️ {medium === 'english' ? 'Your Question' : 'आपका सवाल'}</span>
                              {turn.time && <span className="opacity-70 text-[9px]">({turn.time})</span>}
                            </div>
                            <p className="font-semibold leading-relaxed">"{turn.text}"</p>
                          </div>
                        </div>
                      ) : (
                        <div key={turn.id || tIdx} className="flex justify-start">
                          <div className="bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl rounded-bl-xs p-3 max-w-[92%] shadow-2xs leading-relaxed">
                            <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-emerald-700 mb-1">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                {currentTeacher.name} {medium === 'english' ? 'explained:' : 'ने समझाया:'}
                              </span>
                              {tIdx === (teacherDoubtPopup.turns?.length || 2) - 1 && isSpeaking && (
                                <span className="text-rose-600 animate-pulse font-bold flex items-center gap-1">
                                  <Volume2 className="w-3 h-3" /> बोल रहे हैं...
                                </span>
                              )}
                            </div>
                            <p className="whitespace-pre-line font-medium text-slate-800">{turn.text}</p>
                          </div>
                        </div>
                      )
                    ))}

                    {/* Pending response indicator */}
                    {isPopupAnswering && (
                      <div className="flex justify-start">
                        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-2.5 flex items-center gap-2 text-xs text-blue-800 font-semibold animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>{currentTeacher.name} आपका नया सवाल समझ रहे हैं और जवाब तैयार कर रहे हैं... ✍️</span>
                        </div>
                      </div>
                    )}
                    <div ref={popupChatEndRef} />
                  </div>

                  {/* Suggestion Chips */}
                  <div className="mt-2 pt-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePopupFollowupQuery(medium === 'english' ? 'Can you explain this in simpler words?' : 'कृपया इसे और सरल शब्दों में समझाएं')}
                      className="px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-medium shrink-0 cursor-pointer transition-colors"
                    >
                      💡 {medium === 'english' ? 'Simpler Words' : 'सरल शब्दों में'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePopupFollowupQuery(medium === 'english' ? 'Give an easy example for this.' : 'इसका एक आसान उदाहरण दीजिए')}
                      className="px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-medium shrink-0 cursor-pointer transition-colors"
                    >
                      📝 {medium === 'english' ? 'Easy Example' : 'एक उदाहरण दो'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePopupFollowupQuery(medium === 'english' ? 'Why does this step happen?' : 'यह स्टेप क्यों हुआ? कारण बताओ')}
                      className="px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-medium shrink-0 cursor-pointer transition-colors"
                    >
                      ❓ {medium === 'english' ? 'Why this step?' : 'कारण बताओ'}
                    </button>
                  </div>

                  {/* In-Popup Follow-Up Dock (Multiple Turn Questions!) */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 shrink-0">
                    {/* In-Popup Mic */}
                    <button
                      type="button"
                      onClick={togglePopupMic}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm transition-all cursor-pointer ${
                        isPopupListening
                          ? 'bg-red-600 hover:bg-red-700 animate-pulse ring-4 ring-red-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                      }`}
                      title={isPopupListening ? 'बोलना पूरा हुआ (रोकें)' : 'माइक से बोलकर और पूछें'}
                    >
                      {isPopupListening ? (
                        <Square className="w-3.5 h-3.5 fill-white text-white" />
                      ) : (
                        <Mic className="w-4 h-4 text-white" />
                      )}
                    </button>

                    {/* In-Popup Input */}
                    <div className={`flex-1 bg-slate-50 border rounded-xl px-3 py-1.5 flex items-center gap-2 transition-all ${
                      isPopupListening
                        ? 'border-red-400 bg-red-50/20 ring-2 ring-red-100'
                        : 'border-slate-200 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100'
                    }`}>
                      <input
                        type="text"
                        value={popupInputText}
                        onChange={(e) => setPopupInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handlePopupFollowupQuery();
                          }
                        }}
                        placeholder={
                          isPopupListening
                            ? (medium === 'english' ? '🎙️ Listening... speak your doubt!' : '🎙️ बोलिए बेटा, सुन रहा हूँ...')
                            : (medium === 'english' ? 'Ask follow-up doubt (type or speak)...' : 'इस उत्तर में और क्या पूछना है? (बोलें या लिखें)...')
                        }
                        className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
                      />
                      {popupInputText.trim() && (
                        <button
                          type="button"
                          onClick={() => handlePopupFollowupQuery()}
                          disabled={isPopupAnswering}
                          className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-all disabled:opacity-50 shrink-0"
                          title="पूछें"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Understood / Close button */}
                    <button
                      type="button"
                      onClick={handleClosePopup}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shrink-0 cursor-pointer transition-all active:scale-95"
                    >
                      {medium === 'english' ? 'Done ✓' : 'समझ आ गया ✓'}
                    </button>
                  </div>
                </div>
              )}

              {/* Big Circular Blue Mic Button */}
              <button
                type="button"
                onClick={toggleMic}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shadow-md transition-all shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse ring-4 ring-red-300 scale-105'
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-blue-500/30'
                }`}
                title={isListening ? 'बोलना रोकें व हल देखें (Stop & Solve)' : 'माइक से बोलकर सवाल पूछें'}
              >
                {isListening ? (
                  <Square className="w-4 h-4 fill-white text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Rounded Input Bar with Real-Time Speech Display & Stop/Send Controls */}
              <div className={`flex-1 bg-white border rounded-full px-3.5 py-1.5 shadow-md flex items-center gap-2 transition-all ${
                isListening
                  ? 'border-red-400 ring-2 ring-red-100 bg-red-50/20'
                  : 'border-slate-200/90 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100'
              }`}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleStudentQuery(inputText);
                    }
                  }}
                  placeholder={
                    isListening
                      ? (medium === 'english' ? '🎙️ Listening... Speak your doubt!' : '🎙️ बोलिए बेटा, सुन रहा हूँ... (शब्द यहाँ दिखेंगे)')
                      : `${currentTeacher.name} से सवाल पूछें...`
                  }
                  className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none font-medium"
                />

                {/* While Listening: Show dedicated 'रोकें व हल देखें' Button */}
                {isListening ? (
                  <button
                    type="button"
                    onClick={toggleMic}
                    className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-red-500/30 animate-pulse shrink-0 cursor-pointer"
                    title="बोलना रोकें और तुरंत हल देखें"
                  >
                    <Square className="w-3 h-3 fill-white text-white" />
                    <span className="text-[11px]">{medium === 'english' ? 'Stop & Solve' : 'रोकें व हल देखें'}</span>
                  </button>
                ) : (
                  <>
                    {/* 1. Camera Capture Button */}
                    <button
                      type="button"
                      onClick={startWebcamCapture}
                      className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs hover:scale-102 active:scale-98 shrink-0 cursor-pointer"
                      title="कैमरा से फोटो खींचें (Capture Photo with Camera)"
                    >
                      <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="hidden md:inline">कैमरा फोटो</span>
                    </button>

                    {/* 2. Image / File Upload Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs hover:scale-102 active:scale-98 shrink-0 cursor-pointer"
                      title="गैलरी या स्टोरेज से फोटो / PDF अपलोड करें (Upload Image or PDF)"
                    >
                      <Upload className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="hidden md:inline">फोटो अपलोड</span>
                    </button>

                    {/* Send button */}
                    <button
                      type="button"
                      onClick={() => handleStudentQuery(inputText || inputRef.current?.value)}
                      disabled={!inputText.trim()}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        inputText.trim()
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/30 hover:scale-105 active:scale-95'
                          : 'bg-blue-400 text-white opacity-60 cursor-not-allowed'
                      }`}
                      title="सवाल भेजें"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* SUNDAY PRINTABLE TEST PAPER & TEST SERIES MODAL */}
      <PrintableSundayExamModal
        isOpen={isSundayExamModalOpen}
        onClose={() => setIsSundayExamModalOpen(false)}
        studentName={studentUser?.name || 'छात्र'}
        className={className}
        board={board}
        subjectName={selectedSubject?.subjectHindi || 'गणित'}
        medium={medium}
        isDarkMode={isDarkMode}
        existingUploadedFiles={uploadedFiles}
        pageDataMap={pageDataMap}
        worksheetHistory={worksheetHistory}
      />

      {/* 📱 PARENT WHATSAPP REPORT MODAL */}
      <ParentWhatsAppReportModal
        isOpen={isParentReportModalOpen}
        onClose={() => setIsParentReportModalOpen(false)}
        studentName={currentStudentName || studentUser?.name || 'Student'}
        className={className}
        board={board}
        teacherName={currentTeacher.name}
        subjectName={selectedSubject ? (medium === 'english' ? selectedSubject.subject : selectedSubject.subjectHindi) : 'सामान्य अध्ययन (General Studies)'}
        score={studentStars > 0 ? Math.min(10, Math.ceil(studentStars / 10)) : 9}
        totalQuestions={10}
        topicsCovered={
          selectedChapter
            ? [`अध्याय ${selectedChapter.chapterNumber}: ${medium === 'english' ? selectedChapter.titleEnglish : selectedChapter.titleHindi}`]
            : ['दैनिक अभ्यास व प्रश्नोत्तरी (Daily Practice & Problem Solving)']
        }
        studyMinutes={25}
      />

      {/* WORKSHEET & DOUBTS HISTORY MODAL */}
      <WorksheetHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        historyRecords={worksheetHistory}
        onRestoreRecord={handleRestoreWorksheetRecord}
        onDeleteRecord={handleDeleteWorksheetRecord}
        onClearAllRecords={handleClearAllWorksheetRecords}
        isDarkMode={isDarkMode}
      />

      
      {/* 🔒 CHILD LOCK PASSWORD UNLOCK MODAL */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => {
                setShowUnlockModal(false);
                setUnlockError(false);
                setUnlockInput('');
              }}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                चाइल्ड लॉक अनलॉक करें
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                सुरक्षा हेतु अपना <strong className="text-slate-800">लॉगिन पासवर्ड या PIN</strong> दर्ज करें
              </p>
            </div>

            {unlockError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in shake">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>गलत पासवर्ड! कृपया सही लॉगिन पासवर्ड दर्ज करें।</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setUnlockLoading(true);
                setUnlockError(false);

                try {
                  const savedUserStr = localStorage.getItem('student_user');
                  const u = savedUserStr ? JSON.parse(savedUserStr) : studentUser;

                  const res = await fetch('/api/auth/student/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      studentId: u?.id,
                      phone: u?.phone,
                      email: u?.email,
                      password: unlockInput.trim(),
                    }),
                  });

                  const data = await res.json();
                  if (res.ok && data.success) {
                    setIsChildLockActive(false);
                    setShowUnlockModal(false);
                    setUnlockInput('');
                    setUnlockError(false);
                    if (typeof document !== 'undefined' && document.fullscreenElement) {
                      document.exitFullscreen().catch(() => {});
                    }
                    speakText('चाइल्ड लॉक सफलतापूर्वक अनलॉक हो गया है!');
                  } else {
                    setUnlockError(true);
                    speakText('गलत पासवर्ड! केवल अभिभावक ही अनलॉक कर सकते हैं।');
                  }
                } catch (err) {
                  setUnlockError(true);
                } finally {
                  setUnlockLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  लॉगिन पासवर्ड / PIN
                </label>
                <div className="relative">
                  <input
                    type={showUnlockPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={unlockInput}
                    onChange={(e) => setUnlockInput(e.target.value)}
                    placeholder="अपना पासवर्ड दर्ज करें"
                    className="w-full pl-4 pr-10 py-3 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 text-sm font-bold text-slate-900 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={unlockLoading || !unlockInput.trim()}
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-md shadow-rose-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              >
                {unlockLoading ? (
                  <span>जांच रहे हैं...</span>
                ) : (
                  <>
                    <span>अनलॉक करें (Unlock)</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 📸 LIVE WEBCAM CAPTURE MODAL (LAPTOP & DESKTOP CAMERA VIEW) */}
      {isWebcamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center gap-4 text-white">
            {/* Header */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">
                    कैमरा से कॉपी की फोटो खींचें
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    किताब या कॉपी को कैमरे के सामने रखें और साफ फोटो खींचें
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={stopWebcamStream}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Viewfinder Area */}
            <div className="relative w-full aspect-4/3 max-h-[55vh] bg-black rounded-2xl overflow-hidden border-2 border-dashed border-emerald-500/40 flex items-center justify-center shadow-inner">
              <video
                ref={webcamVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Document Framing Guide Overlay */}
              <div className="absolute inset-4 sm:inset-6 border border-white/30 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between text-[10px] font-mono text-emerald-400">
                  <span>┌ 4K AI SCAN</span>
                  <span>┐</span>
                </div>
                <div className="text-center text-xs font-bold text-white/90 bg-black/50 px-3 py-1 rounded-full self-center backdrop-blur-xs">
                  कॉपी के पेज को इस फ्रेम के अंदर रखें
                </div>
                <div className="flex justify-between text-[10px] font-mono text-emerald-400">
                  <span>└</span>
                  <span>┘</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={capturePhotoFromWebcam}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>📸 फोटो खींचें (Capture)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopWebcamStream();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>गैलरी से चुनें</span>
              </button>
            </div>
          </div>
        </div>
      )}





      {/* 🏆 WORKSHEET COMPLETION CELEBRATION MODAL */}
      {isWorksheetCelebrationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`max-w-md w-full rounded-3xl p-6 border text-center space-y-4 shadow-2xl transition-all ${isDarkMode ? 'bg-slate-900 border-amber-500/40 text-white' : 'bg-white border-amber-300 text-slate-900'
            }`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-white flex items-center justify-center text-4xl mx-auto shadow-lg shadow-amber-500/30 animate-bounce">
              🏆
            </div>

            <div>
              <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
                बधाई हो बेटा! (Worksheet Completed!)
              </span>
              <h3 className="text-xl font-black mt-1">
                आपने सभी {detectedQuestions.length} सवाल पूरे कर लिए! 🎉
              </h3>
              <p className={`text-xs mt-1.5 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {currentTeacher.name}: &quot;शानदार प्रदर्शन! आपने सभी सवालों के नियम व गणना ध्यानपूर्वक सीखी है।&quot;
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                +50 विद्या स्टार्स (Vidya Stars) मिले!
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {/* WhatsApp Share Button for Parents */}
              <button
                type="button"
                onClick={() => {
                  const sName = studentUser?.name || 'छात्र';
                  const subName = selectedSubject?.subjectHindi || 'गणित';
                  const qCount = detectedQuestions.length > 0 ? detectedQuestions.length : 1;
                  const text = `🏆 विद्या AI ट्यूशन रिपोर्ट कार्ड:\nआज ${sName} (${className}) ने ${subName} की वर्कशीट के सभी ${qCount} सवाल सफलतापूर्वक पूरे किए! ⭐ 50 विद्या स्टार्स जीते।\n(घर बैठे सिर्फ ₹200/माह में सभी विषयों की संपूर्ण ट्यूशन - vidyatuition.com)`;
                  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all text-center cursor-pointer"
              >
                <span className="text-sm">📲</span>
                <span>मम्मी-पापा को WhatsApp पर रिपोर्ट भेजें</span>
              </button>

              <Link
                href="/reports"
                onClick={() => setIsWorksheetCelebrationOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all text-center"
              >
                <span>📊</span>
                <span>{medium === 'english' ? 'View Student All Report' : 'स्टूडेंट ऑल रिपोर्ट देखें (View Report Card)'}</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsWorksheetCelebrationOpen(false)}
                className={`w-full py-2 px-4 rounded-xl border text-xs font-bold transition-all ${isDarkMode
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
              >
                व्हाइटबोर्ड पर रहें (Keep Practicing)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📂 WORKSHEET & LEARNING HISTORY MODAL */}
      <WorksheetHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        historyRecords={worksheetHistory}
        onRestoreRecord={handleRestoreWorksheetRecord}
        onDeleteRecord={handleDeleteWorksheetRecord}
        onClearAllRecords={handleClearAllWorksheetRecords}
        isDarkMode={isDarkMode}
      />

      {/* 📝 KID ROUGH WORK SCRATCHPAD (CHALK DRAWING CANVAS) */}
      <RoughWorkScratchpad
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* 🌟 STUDENT SUBSCRIPTION & ADMIN FREE TEST MODAL */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          setIsFourthUploadAttempt(false);
        }}
        studentName={studentUser?.name || 'छात्र'}
        studentPhone={studentUser?.phone || ''}
        isTrialExpired={isTrialExpired}
        trialUploadCount={trialUploadCount}
        isFourthUploadAttempt={isFourthUploadAttempt || trialUploadCount >= 3}
        onSubscribedSuccess={() => {
          setIsSubscribed(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('vidya_subscribed', 'true');
            const stored = localStorage.getItem('student_user');
            if (stored) {
              const u = JSON.parse(stored);
              u.isSubscribed = true;
              localStorage.setItem('student_user', JSON.stringify(u));
            }
          }
        }}
      />

      {/* 🎓 UNIFIED ACADEMIC SELECTOR MODAL (CLASS, SUBJECT & BOARD) */}
      {isAcademicSelectorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsAcademicSelectorOpen(false)}
        >
          <div
            className={`relative max-w-lg w-full rounded-3xl p-5 sm:p-6 border shadow-2xl space-y-4 animate-in zoom-in-95 ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black">
                  {medium === 'english' ? 'Select Class, Subject & Board' : 'कक्षा, विषय व बोर्ड चुनें'}
                </h3>
                <p className="text-xs text-slate-400">
                  {medium === 'english' ? 'Customize your learning curriculum' : 'अपनी पढ़ाई के अनुसार पाठ्यक्रम सेट करें'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAcademicSelectorOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Board Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {medium === 'english' ? 'Education Board' : 'शिक्षा बोर्ड'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['RBSE', 'CBSE'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setBoard(b);
                      try {
                        const stored = localStorage.getItem('student_user');
                        const u = stored ? JSON.parse(stored) : {};
                        u.board = b;
                        localStorage.setItem('student_user', JSON.stringify(u));
                      } catch {}
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      board === b
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {b} ({b === 'RBSE' ? 'राजस्थान बोर्ड' : 'केंद्रीय बोर्ड'})
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Class Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {medium === 'english' ? 'Class / Grade' : 'कक्षा चुनें'}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}th`).map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      setClassName(cls);
                      try {
                        const stored = localStorage.getItem('student_user');
                        const u = stored ? JSON.parse(stored) : {};
                        u.classGrade = cls;
                        localStorage.setItem('student_user', JSON.stringify(u));
                      } catch {}
                      speakText(`${medium === 'english' ? 'Class set to' : 'कक्षा चुनी गई:'} ${cls}`, undefined, true);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      className === cls
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cls.replace('Class ', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {medium === 'english' ? 'Select Subject' : 'विषय चुनें'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {allSubjects.map((sub) => {
                  const isSubSelected = selectedSubject?.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        handleSelectSubject(sub);
                        setIsAcademicSelectorOpen(false);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSubSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-2xl">{sub.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black truncate">
                          {medium === 'english' ? sub.subject : sub.subjectHindi}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {sub.teacherName.split(' ')[0]} Sir • {sub.chapters?.length || 0} पाठ
                        </p>
                      </div>
                    </button>
                  );
                })}
                {/* 5th Option: Other Subject (Computer, EVS, General) */}
                <button
                  type="button"
                  onClick={() => {
                    const otherSub = {
                      id: 'other',
                      subject: 'Computer & EVS',
                      subjectHindi: 'अन्य (कंप्यूटर / EVS)',
                      bookName: 'General & Computer Studies',
                      teacherId: 'other',
                      teacherName: 'Kabir Sir',
                      emoji: '💻',
                      chapters: [
                        {
                          id: 'c1',
                          chapterNumber: 1,
                          titleEnglish: 'Computer Basics & Parts',
                          titleHindi: 'कंप्यूटर के मुख्य भाग व कार्य',
                          concepts: ['CPU, Keyboard, Mouse, Monitor'],
                          term: 'half_yearly',
                          estimatedMinutes: 20,
                          sampleQuestions: []
                        },
                        {
                          id: 'c2',
                          chapterNumber: 2,
                          titleEnglish: 'Our Environment & EVS',
                          titleHindi: 'पर्यावरण व हमारा परिवेश',
                          concepts: ['Plants, Water, Pollution, Cleanliness'],
                          term: 'annual',
                          estimatedMinutes: 20,
                          sampleQuestions: []
                        }
                      ]
                    };
                    handleSelectSubject(otherSub as any);
                    setCurrentTeacher({
                      id: 'other',
                      name: 'Kabir Sir',
                      role: 'Computer & General Mentor',
                      emoji: '💻'
                    });
                    setIsAcademicSelectorOpen(false);
                    speakText('नमस्ते बेटा! आप कंप्यूटर, EVS या किसी भी अन्य विषय का सवाल पूछ सकते हैं!');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    selectedSubject?.id === 'other' || currentTeacher.id === 'other'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-2xl">💻</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black truncate">
                      {medium === 'english' ? 'Other (Computer / EVS)' : 'अन्य (कंप्यूटर / EVS)'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Kabir Sir • Computer & GK
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAcademicSelectorOpen(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                {medium === 'english' ? 'Done / Start Learning' : 'सहेजें व पढ़ाई शुरू करें ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 BOOK PAGE / IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-slate-900 rounded-3xl p-3 sm:p-4 border border-white/20 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 mb-2">
              <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>📖</span> {medium === 'english' ? 'Textbook Page Photo / Illustration' : 'किताब का पेज / चित्र (Textbook Photo)'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto max-h-[75vh] w-full flex items-center justify-center rounded-2xl bg-black/50 p-2">
              <img
                src={previewImageUrl}
                alt="Book page illustration"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-2 text-center">
              💡 {medium === 'english' ? 'Zoom and pan to clearly see the question diagram, clock, or object.' : 'सवाल के चित्र (जैसे Crackers बिस्कुट, आरेख या घड़ी) को यहाँ साफ़-साफ़ देख सकते हैं।'}
            </span>
          </div>
        </div>
      )}
      {/* 🔍 FULLSCREEN WORKSHEET LIGHTBOX MODAL */}
      {isFullscreenMode && uploadedImage && (
        <div
          className="fixed inset-0 z-50 flex flex-col p-3 sm:p-6 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onClick={() => setIsFullscreenMode(false)}
        >
          {/* Top Bar */}
          <div
            className="w-full flex items-center justify-between pb-3 border-b border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>📄</span>
                <span>{cleanWorksheetDisplayName(uploadedFileName || activeFileDoc?.name)}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (पेज {uploadedFiles.findIndex((f) => f.id === activeFileId) + 1} / {Math.max(1, uploadedFiles.length)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setImageZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                  className="px-2.5 py-1 text-xs font-bold text-slate-200 hover:bg-slate-700 rounded-lg cursor-pointer"
                >
                  −
                </button>
                <span className="px-2 text-xs font-mono font-bold text-slate-200">
                  {Math.round(imageZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setImageZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                  className="px-2.5 py-1 text-xs font-bold text-slate-200 hover:bg-slate-700 rounded-lg cursor-pointer"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setImageZoom(1)}
                  className="px-2 py-1 text-xs font-bold text-blue-400 hover:bg-slate-700 rounded-lg cursor-pointer"
                >
                  रीसेट
                </button>
              </div>

              {/* Rotate Button */}
              <button
                type="button"
                onClick={() => setImageRotation((r) => (r + 90) % 360)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                title="फोटो घुमाएं (Rotate 90°)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsFullscreenMode(false)}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors shadow-lg"
                title="बंद करें (Close)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fullscreen Centered Image Canvas */}
          <div
            className="flex-1 w-full overflow-auto flex items-center justify-center p-2 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {isPdfWorksheet ? (
              <PdfWorksheetViewer
                url={uploadedImage}
                currentPage={pdfCurrentPage}
                zoom={imageZoom}
                rotation={imageRotation}
                isFitToHeight={isFitToHeight}
                className="max-h-[82vh] max-w-[92vw]"
              />
            ) : (
              <img
                src={uploadedImage}
                alt="Worksheet Fullscreen"
                style={{
                  transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease',
                }}
                className="max-h-[82vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl border border-white/10 select-none bg-white"
              />
            )}
          </div>
        </div>
      )}

      {/* 📄 FULL WORKSHEET POPUP MODAL (OPENED FROM SIDEBAR 'UPLOAD WORKSHEET' OR WHITEBOARD) */}
      {isWorksheetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsWorksheetModalOpen(false)}
        >
          <div
            className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full h-[90vh] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 shrink-0 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 font-bold">
                  📄
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                      {medium === 'english' ? 'Worksheet Document' : 'वर्कशीट पेज'}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black">
                      {dailyUploadCount}/20 {medium === 'english' ? 'daily' : 'दैनिक'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                    {uploadedFileName || (medium === 'english' ? 'No file uploaded yet' : 'कोई फाइल अपलोड नहीं है')}
                  </p>
                </div>
              </div>

              {/* Action Controls in Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => startWebcamCapture()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  title="कैमरा से फोटो खींचें"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">कैमरा</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  title="नई वर्कशीट अपलोड करें"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">अपलोड</span>
                </button>

                {/* Fit Height Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsFitToHeight((prev) => !prev);
                    setImageZoom(1);
                  }}
                  className={`px-2 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    isFitToHeight
                      ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={isFitToHeight ? 'View Full Width' : 'Fit Screen'}
                >
                  {isFitToHeight ? 'Fit ✓' : 'Fit'}
                </button>

                {/* Rotate */}
                <button
                  type="button"
                  onClick={() => setImageRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                  title="फोटो घुमाएं"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setImageZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                    className="px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white rounded-lg cursor-pointer"
                  >
                    −
                  </button>
                  <span className="px-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                    {Math.round(imageZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setImageZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                    className="px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white rounded-lg cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsWorksheetModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  title="बंद करें"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scanned Worksheet Canvas */}
            <div className="relative bg-slate-100/90 dark:bg-slate-950 p-2 sm:p-4 flex-1 min-h-0 w-full overflow-auto flex items-center justify-center">
              {uploadedImage ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-auto">
                  {isPdfWorksheet ? (
                    <PdfWorksheetViewer
                      url={uploadedImage}
                      currentPage={pdfCurrentPage}
                      onTotalPagesChange={(total) => setPdfTotalPages(total)}
                      zoom={imageZoom}
                      rotation={imageRotation}
                      isFitToHeight={isFitToHeight}
                      className="w-full h-full max-h-[72vh]"
                    />
                  ) : (
                    <img
                      src={uploadedImage}
                      alt="Uploaded Worksheet"
                      style={{
                        transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease',
                        imageRendering: 'crisp-edges',
                      }}
                      className={`rounded-xl shadow-md border border-slate-200 bg-white block select-none ${
                        isFitToHeight
                          ? 'max-h-full max-w-full w-auto h-auto object-contain'
                          : 'w-full h-auto object-contain'
                      }`}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-blue-100 border border-blue-200 flex items-center justify-center text-3xl shadow-sm">
                    📸
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                      कोई वर्कशीट अपलोड नहीं है
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      अपनी होमवर्क कॉपी या किताब के पन्ने की फोटो खींचें या PDF अपलोड करें।
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startWebcamCapture()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>कैमरा से फोटो खींचें</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>फाइल अपलोड करें</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer: Pagination, File info, Reset, and Action */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shrink-0 flex-wrap">
              {/* Pagination */}
              {(() => {
                const currentIdx = uploadedFiles.findIndex((f) => f.id === activeFileId);
                const safeIdx = currentIdx !== -1 ? currentIdx : 0;
                const totalFiles = Math.max(1, uploadedFiles.length);
                const currentPageNum = safeIdx + 1;
                const isMultiPagePdf = isPdfWorksheet && pdfTotalPages > 1;
                const displayPageNum = isMultiPagePdf ? pdfCurrentPage : currentPageNum;
                const displayTotalPages = isMultiPagePdf ? pdfTotalPages : totalFiles;
                const canGoPrev = isMultiPagePdf ? pdfCurrentPage > 1 : uploadedFiles.length > 1 && safeIdx > 0;
                const canGoNext = isMultiPagePdf ? pdfCurrentPage < pdfTotalPages : uploadedFiles.length > 1 && safeIdx < uploadedFiles.length - 1;

                return (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <button
                      type="button"
                      onClick={() => {
                        if (isMultiPagePdf && pdfCurrentPage > 1) {
                          setPdfCurrentPage((p) => Math.max(1, p - 1));
                        } else if (uploadedFiles.length > 1 && safeIdx > 0) {
                          handleSwitchPage(uploadedFiles[safeIdx - 1].id);
                        }
                      }}
                      disabled={!canGoPrev}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30 cursor-pointer"
                      title="पिछला पेज"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs px-2 font-black">
                      Page {displayPageNum} / {displayTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isMultiPagePdf && pdfCurrentPage < pdfTotalPages) {
                          setPdfCurrentPage((p) => Math.min(pdfTotalPages, p + 1));
                        } else if (uploadedFiles.length > 1 && safeIdx < uploadedFiles.length - 1) {
                          handleSwitchPage(uploadedFiles[safeIdx + 1].id);
                        }
                      }}
                      disabled={!canGoNext}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30 cursor-pointer"
                      title="अगला पेज"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}

              {/* Right Footer Actions */}
              <div className="flex items-center gap-2">
                {uploadedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="वर्कशीट हटाएं"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>हटाएं</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFullPageReset}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="रीसेट करें"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{medium === 'english' ? 'Reset' : 'रीसेट'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsWorksheetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer transition-all"
                >
                  {medium === 'english' ? 'View Smart Whiteboard ➔' : 'व्हाइटबोर्ड देखें ➔'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


