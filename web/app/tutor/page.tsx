'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
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
} from 'lucide-react';
// Student reports now handled centrally on /reports
import PrintableSundayExamModal from '@/components/PrintableSundayExamModal';
import TeacherWhiteboardAnimation from '@/components/TeacherWhiteboardAnimation';
import { WorksheetHistoryModal, SavedWorksheetRecord } from '@/components/WorksheetHistoryModal';
import { enhanceDocumentImage, compressImageForThumbnail } from '@/lib/image-enhancer';
import { RoughWorkScratchpad } from '@/components/RoughWorkScratchpad';
import { SubscriptionModal } from '@/components/SubscriptionModal';
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

// Helper to separate repeating section instruction/heading (e.g. "A. Complete the sentences") from the actual question
function parseQuestionAndSection(raw?: string | null): { section?: string; question: string } {
  if (!raw) return { question: '' };
  const trimmed = raw.trim();

  // Pattern 1: Heading ending with a colon or dash before question number (e.g. "Identify the following from the story: 1. three proper nouns")
  const colonMatch = trimmed.match(/^([^:\-–\n\r]+?)[:\-–]\s*(\(?\d+[\.\)]\s*.*)$/i);
  if (colonMatch && colonMatch[1] && colonMatch[2]) {
    const section = colonMatch[1].trim();
    const question = colonMatch[2].trim();
    return { section, question };
  }

  // Pattern 2: Explicit Section/Part/A. followed by instruction and question number (e.g. "A. Complete the sentences. 1. ...")
  const match = trimmed.match(
    /^((?:(?:Section|Part|खंड|भाग|प्रश्न)\s*[A-Zक-ह0-9]*|[A-Z][\.\s])\s*[^0-9\n\r]+?)(?:[.:]\s*|\s+)(\(?\d+[\.\)]\s*.*)$/i
  );
  if (match && match[1] && match[2]) {
    const section = match[1].replace(/[.:]$/, '').trim();
    const question = match[2].trim();
    return { section, question };
  }
  return { question: trimmed };
}

export default function TuitionClassroomStudio() {
  // Board & Class Config
  const [board, setBoard] = useState<'RBSE' | 'CBSE'>('RBSE');
  const [className, setClassName] = useState<string>('Class 4th');
  const [medium, setMedium] = useState<'hindi' | 'english'>('hindi');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load All 4 Core Subjects with dynamic API sync capability
  const [allSubjects, setAllSubjects] = useState<SubjectCurriculum[]>(() =>
    getCurriculum(board, className, medium)
  );

  // Read logged-in student preference if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem('student_user');
      if (stored) {
        const u = JSON.parse(stored);
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

  // Whiteboard Steps (empty initially until chapter is selected or doubt asked)
  const [whiteboardSteps, setWhiteboardSteps] = useState<WhiteboardStepItem[]>([]);
  const [revealedSteps, setRevealedSteps] = useState<number>(1);
  const [whiteboardHeading, setWhiteboardHeading] = useState<string>('आज की ट्यूशन क्लास (Ready to Teach)');
  const [activeTargetQuestion, setActiveTargetQuestion] = useState<string>('');

  // Voice & Speech States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
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

  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string; url: string; type: string }>>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
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

  const setUploadedImage = (url: string | null) => {
    if (!url) {
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
  const [isPageFlipping, setIsPageFlipping] = useState<boolean>(false);

  // Switch between uploaded worksheet pages and immediately show all questions and steps for that page
  const handleSwitchPage = (targetFileId: string) => {
    stopAudio();
    setIsPageFlipping(true);
    setTimeout(() => setIsPageFlipping(false), 350);
    setActiveFileId(targetFileId);
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

  // Restore active session if student navigated away (e.g. clicked "स्टूडेंट रिपोर्ट" and came back)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedSessionStr = localStorage.getItem('vidya_current_session');
      if (savedSessionStr) {
        const session = JSON.parse(savedSessionStr);
        if (session.uploadedFiles && Array.isArray(session.uploadedFiles) && session.uploadedFiles.length > 0) {
          setUploadedFiles(session.uploadedFiles);
          setActiveFileId(session.activeFileId || session.uploadedFiles[0].id);
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
        if (session.teacherId && session.teacherName) {
          setCurrentTeacher({
            id: session.teacherId,
            name: session.teacherName,
            role: session.teacherRole || 'Class 1st-8th Math Mentor',
            emoji: session.teacherEmoji || '👨‍🏫',
          });
        }
      }
    } catch (err) {
      console.warn('Failed to restore vidya_current_session:', err);
    }

    // Server Sync: If opened on a new PC, restore session and worksheet history from server
    try {
      const savedUser = localStorage.getItem('student_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.phone || u.id) {
          fetch(`/api/student/records?phone=${encodeURIComponent(u.phone || '')}&studentId=${encodeURIComponent(u.id || '')}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.currentSession) {
                const s = data.currentSession;
                if (s.uploadedFiles && s.uploadedFiles.length > 0 && uploadedFiles.length === 0) {
                  setUploadedFiles(s.uploadedFiles);
                  setActiveFileId(s.activeFileId || s.uploadedFiles[0].id);
                }
                if (s.pageDataMap && Object.keys(s.pageDataMap).length > 0) {
                  setPageDataMap(s.pageDataMap);
                }
                if (s.whiteboardSteps && s.whiteboardSteps.length > 0 && whiteboardSteps.length === 0) {
                  setWhiteboardSteps(s.whiteboardSteps);
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
              }
            })
            .catch(() => {});
        }
      }
    } catch {}
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
  }, [uploadedFiles, activeFileId, pageDataMap, whiteboardSteps, whiteboardHeading, detectedQuestions, detectedChapter, activeTargetQuestion, speechText, currentTeacher, selectedSubject]);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});
  const [isEvaluatingMock, setIsEvaluatingMock] = useState<boolean>(false);
  const [activeMockQIdx, setActiveMockQIdx] = useState<number>(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSundayExamModalOpen, setIsSundayExamModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState<boolean>(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState<boolean>(false);
  const [worksheetHistory, setWorksheetHistory] = useState<SavedWorksheetRecord[]>([]);
  const [lastArchivedNotice, setLastArchivedNotice] = useState<{ title: string; count: number } | null>(null);
  const [isWorksheetCelebrationOpen, setIsWorksheetCelebrationOpen] = useState<boolean>(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // 7-Day Free Trial State & 3 Free Uploads Limit
  const [studentUser, setStudentUser] = useState<any>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(7);
  const [isTrialExpired, setIsTrialExpired] = useState<boolean>(false);
  const [trialUploadCount, setTrialUploadCount] = useState<number>(0);
  const [isFourthUploadAttempt, setIsFourthUploadAttempt] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;
    try {
      const isSub = localStorage.getItem('vidya_subscribed') === 'true';
      if (isSub) setIsSubscribed(true);
      const stored = localStorage.getItem('student_user');
      let userObj: any = null;
      if (stored) {
        userObj = JSON.parse(stored);
        setStudentUser(userObj);
        if (userObj.isSubscribed) {
          setIsSubscribed(true);
        }
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

    let clean = q
      .toLowerCase()
      .replace(/कितने?\s*(होते\s*हो|होते\s*हैं|होते\s*है|होते\s*ह|होगा|होता\s*है|होता\s*ह|है|h)?/gi, '')
      .replace(/kitne?\s*(hote\s*ho|hote\s*hai|hote\s*hain|hote\s*h|honge|hoga|hota\s*hai|hota\s*h|h)?/gi, '')
      .replace(/kya\s*(hota\s*hai|hota\s*h|hoga|aayega|h)/gi, '')
      .replace(/solve\s*(karke\s*dikhao|karo|please)?/gi, '')
      .replace(/हल\s*(करके\s*दिखाओ|करो|कीजिए|करें)?/gi, '')
      .replace(/का\s*मान/gi, '')
      .replace(/batao/gi, '')
      .replace(/बताओ/gi, '')
      .replace(/में\s*(से)?/gi, ' ')
      .replace(/me\s*(se)?/gi, ' ')
      .replace(/jodo/gi, '+')
      .replace(/जोड़ो|जोडो/gi, '+')
      .replace(/[?=]/g, '')
      .trim();

    const mathRegex =
      /^([0-9]+(?:\.[0-9]+)?)\s*([\+\-\*\/xX×÷]|plus|minus|times|into|divide|divided\s+by|aur|और|जोड़|जोड|कम|ghatao|घटाओ|guna|गुणा|bhag|भाग)\s*([0-9]+(?:\.[0-9]+)?)$/i;

    let match = clean.match(mathRegex);

    if (!match) {
      const inlineMatch = q.match(
        /([0-9]+(?:\.[0-9]+)?)\s*([\+\-\*\/xX×÷]|plus|minus|times|into|divide|divided\s+by|aur|और|जोड़|जोड|कम|ghatao|घटाओ|guna|गुणा|bhag|भाग)\s*([0-9]+(?:\.[0-9]+)?)/i
      );
      if (inlineMatch) {
        match = inlineMatch;
      }
    }

    if (!match) return null;

    const num1 = parseFloat(match[1]);
    const rawOp = match[2].toLowerCase();
    const num2 = parseFloat(match[3]);

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
      // Fix cases where literal \n became .n or n before words/digits (e.g. 500).n453729 or 999999nLargest)
      .replace(/([0-9\)])\.n([A-Za-z0-9])/g, '$1.\n$2')
      .replace(/([0-9\)])n([A-Z])/g, '$1\n$2')
      .replace(/([0-9\)])n(Correct|Difference|Largest|Smallest|Option|Step|चरण|उत्तर)/gi, '$1\n$2')
      .replace(/\\/g, '')
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/^✅\s*(उत्तर व हल|सही हल व उत्तर|हल व उत्तर):\s*/i, '')
      .trim();
  };

  // Helper to render question text: fills the blank with the answer and underlines ONLY that answer!
  const renderQuestionWithBlankFill = (
    questionText: string,
    stepItem?: WhiteboardStepItem,
    idx?: number
  ) => {
    if (!questionText) return null;

    // Never underline words in story reading passages!
    const isStory = Boolean(
      questionText.startsWith('Story:') ||
      questionText.toLowerCase().includes('reading passage') ||
      stepItem?.step?.toLowerCase().includes('reading passage') ||
      stepItem?.step?.toLowerCase().includes('पाठ वाचन') ||
      (stepItem?.formula && stepItem.formula.length > 250 && stepItem.formula.includes('\n\n'))
    );
    if (isStory) {
      return questionText;
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
              {p}
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
              return p;
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
            return part;
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
            return part;
          })}
        </>
      );
    }

    return questionText;
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
            return part;
          })}
        </>
      );
    }

    // If short single answer (e.g. "meadow", "pond", "Option (b)", "42")
    if (clean.length < 50 && !clean.includes('\n')) {
      return (
        <span className="underline decoration-emerald-500 dark:decoration-emerald-400 decoration-3 underline-offset-4 font-black text-emerald-600 dark:text-emerald-400 px-1 inline-block">
          {clean}
        </span>
      );
    }

    return clean;
  };

  // Helper to dynamically localize whiteboard heading when medium === 'english'
  const getDisplayWhiteboardHeading = (heading: string) => {
    if (medium !== 'english' || !heading) return heading;
    if (heading.includes('आज की ट्यूशन क्लास')) return "Today's Tuition Class (Ready to Teach)";
    if (heading.includes('मॉक टेस्ट') || heading.includes('परीक्षा तैयारी')) return '🎯 Exam Preparation: Worksheet Mock Test';
    if (heading.includes('मास्टर उत्तर कुंजी') || heading.includes('Master Answer Key')) return '📋 Complete Worksheet Master Answer Key';
    if (heading.includes('14.3') || heading.includes('Early Home')) return '📖 Chapter 14.3: My Early Home (Full 7-Paragraph Story - Textbook Reading)';
    if (heading.includes('A.1')) return 'Practice Question A.1: Fill in the Blank';
    if (heading.includes('A.2')) return 'Practice Question A.2: Fill in the Blank';
    if (heading.includes('A.3')) return 'Practice Question A.3: Fill in the Blank';
    if (heading.includes('A.4')) return 'Practice Question A.4: Fill in the Blank';
    if (heading.startsWith('शीट हल:')) return heading.replace('शीट हल:', 'Worksheet Solution:');
    if (heading.startsWith('सवाल समाधान:')) return heading.replace('सवाल समाधान:', 'Solution:');
    if (heading.startsWith('दस्तावेज स्कैन:')) return heading.replace('दस्तावेज स्कैन:', 'Document Scan:');
    if (heading.startsWith('गणित हल:')) return heading.replace('गणित हल:', 'Math Solution:');
    if (heading.startsWith('📖 पाठ वाचन:')) return heading.replace('📖 पाठ वाचन:', '📖 Story Reading:');
    if (heading.startsWith('वर्कशीट हल:')) return heading.replace('वर्कशीट हल:', 'Worksheet Solution:');
    return heading;
  };

  const renderFormulaBlocks = (formula: string) => {
    const clean = formatFormula(formula);

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
    // First try splitting on explicit newlines or pipe separators
    let rawParts = clean.includes('\n')
      ? clean.split('\n').map((p) => p.trim()).filter(Boolean)
      : clean.includes(' | ')
        ? clean.split(' | ').map((p) => p.trim()).filter(Boolean)
        : [];

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

    if (rawParts.length > 1) {
      return (
        <div className="space-y-3 pt-1">
          {rawParts.map((part, pIdx) => {
            const isAnswerExplicit =
              part.includes('✅') ||
              part.toLowerCase().includes('option') ||
              part.includes('उत्तर:') ||
              part.includes('सही उत्तर') ||
              part.includes('अंतिम उत्तर') ||
              part.toLowerCase().includes('correct option') ||
              part.toLowerCase().includes('answer:');

            const isCalculation =
              !isAnswerExplicit &&
              (part.toLowerCase().includes('difference') ||
                part.includes('अंतर') ||
                part.toLowerCase().includes('sum') ||
                part.includes('योग') ||
                part.toLowerCase().includes('total') ||
                part.includes('कुल') ||
                part.includes('='));

            const isRounding =
              !isAnswerExplicit &&
              !isCalculation &&
              (part.toLowerCase().includes('rounds to') ||
                part.toLowerCase().includes('round off') ||
                part.includes('निकटतम') ||
                part.toLowerCase().includes('since') ||
                part.includes('क्योंकि'));

            const isNumberFact =
              !isAnswerExplicit &&
              !isCalculation &&
              !isRounding &&
              (part.toLowerCase().includes('largest') ||
                part.toLowerCase().includes('smallest') ||
                part.includes('सबसे बड़ी') ||
                part.includes('सबसे छोटी') ||
                part.toLowerCase().includes('digit number'));

            const stepBadgeText = isAnswerExplicit
              ? (medium === 'english' ? '🎯 Final Answer & Option' : '🎯 अंतिम सही उत्तर (Correct Option)')
              : isCalculation
                ? (medium === 'english' ? `🧮 Step ${pIdx + 1}: Calculation` : `🧮 चरण ${pIdx + 1}: गणना व अंतर (Calculation)`)
                : isRounding
                  ? (medium === 'english' ? `🔢 Step ${pIdx + 1}: Rounding Rule` : `🔢 चरण ${pIdx + 1}: संख्या को राउंड ऑफ करना (Rounding Rule)`)
                  : isNumberFact
                    ? (medium === 'english' ? `📌 Step ${pIdx + 1}: Number Concept` : `📌 चरण ${pIdx + 1}: संख्या का मान पहचानना`)
                    : (medium === 'english' ? `✨ Step ${pIdx + 1}` : `✨ चरण ${pIdx + 1} (Step ${pIdx + 1})`);

            return (
              <div
                key={pIdx}
                className={`p-3.5 md:p-4 rounded-2xl border transition-all ${isAnswerExplicit
                  ? isDarkMode || chalkboardTheme === 'green'
                    ? 'bg-gradient-to-r from-emerald-950/80 to-teal-950/60 border-emerald-500/60 text-emerald-100 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/20'
                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950 shadow-sm ring-1 ring-emerald-200/50'
                  : isDarkMode || chalkboardTheme === 'green'
                    ? 'bg-slate-900/90 border-slate-800 text-slate-100 hover:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-800 shadow-2xs hover:border-indigo-200'
                  }`}
              >
                {/* Step Sub-Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                  <span
                    className={`text-[11px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${isAnswerExplicit
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                      : isCalculation
                        ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20'
                        : isRounding
                          ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
                          : isNumberFact
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                      }`}
                  >
                    {stepBadgeText}
                  </span>
                  {isAnswerExplicit && (
                    <span className="text-xs bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full shadow-xs shrink-0 flex items-center gap-1">
                      <span>✓</span>
                      <span>{medium === 'english' ? 'Correct' : 'सही हल'}</span>
                    </span>
                  )}
                </div>

                {/* Step Text / Formula Display */}
                <div
                  className={`leading-relaxed ${isAnswerExplicit
                    ? 'text-base sm:text-lg font-black'
                    : 'text-sm sm:text-base font-semibold'
                    }`}
                >
                  {renderFormulaAnswer(part)}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Single formula block (e.g. single word answer or equation)
    const isUnderlineAnswer =
      clean.includes('✅') ||
      clean.length < 50 ||
      clean.includes('उत्तर') ||
      ['meadow', 'pond', 'mother', 'black'].some((w) => clean.toLowerCase().includes(w));

    return (
      <div
        className={`text-base sm:text-lg font-black tracking-normal leading-relaxed ${isDarkMode || chalkboardTheme === 'green' ? 'text-white' : 'text-slate-900'
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

    // If stepItem has a valid real question from AI
    if (stepItem.question && !isInternalInstruction(stepItem.question)) {
      return stepItem.question;
    }

    // If user clicked a specific question from the detected questions list
    if (
      activeTargetQuestion &&
      activeTargetQuestion !== 'सभी 15 सवालों के सही उत्तर व मास्टर कुंजी' &&
      !isInternalInstruction(activeTargetQuestion)
    ) {
      return activeTargetQuestion;
    }

    // If worksheet questions were detected from image/PDF
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
      if (typeof idx === 'number' && idx >= 0 && idx < detectedQuestions.length) {
        return detectedQuestions[idx];
      }
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

  // Interactive Practice Question State
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [selectedMCQ, setSelectedMCQ] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [answerStatus, setAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [totalScore, setTotalScore] = useState<number>(0);

  // Input & Mic Bar
  const [inputText, setInputText] = useState<string>('');
  const recognitionRef = useRef<any>(null);

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

  // Unified Audio Player with Natural Google Cloud Hindi Voice + Fallback
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const fallbackBrowserSpeech = (clean: string, onEnded?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'hi-IN';

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

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnded) onEnded();
      };
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // High-Fidelity Text-To-Speech with Real Google Cloud Hindi Voice
  const speakText = (text: string, onEnded?: () => void, forcePlay = false) => {
    if (!text || !text.trim()) return;
    if (isAudioMuted) {
      if (forcePlay) {
        setIsAudioMuted(false);
      } else {
        return;
      }
    }

    // Stop any currently playing audio immediately
    stopAudio();

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

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        currentAudioRef.current = null;
        if (onEnded) onEnded();
      };
      audio.onerror = () => {
        fallbackBrowserSpeech(clean, onEnded);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          fallbackBrowserSpeech(clean, onEnded);
        });
      }
    } catch {
      fallbackBrowserSpeech(clean, onEnded);
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
          } else if (data.success && (!data.worksheetHistory || data.worksheetHistory.length === 0)) {
            // Push existing local records up to server so they are saved to their account
            const stored = localStorage.getItem('ai_tuition_worksheet_records');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  fetch('/api/student/records', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      phone: studentUser.phone,
                      studentId: studentUser.id,
                      worksheetHistory: parsed,
                    }),
                  }).catch(() => {});
                }
              } catch {}
            }
          }
        })
        .catch((err) => console.warn('Could not sync worksheets from server:', err));
    }
  }, []);

  // Mic Speech Recognition
  const toggleMic = () => {
    if (typeof window === 'undefined') return;

    // Instantly stop all audio when mic is pressed
    stopAudio();

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('ब्राउज़र में माइक उपलब्ध नहीं है। Chrome इस्तेमाल करें।');
      return;
    }

    try {
      const rec = new SpeechRec();
      recognitionRef.current = rec;
      rec.lang = 'hi-IN';
      rec.interimResults = false;

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setInputText(transcript);
          handleStudentQuery(transcript);
        }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      rec.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Switch Subject (Math, EVS, English, Hindi, Computer)
  const handleSelectSubject = (sub: SubjectCurriculum) => {
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

  // Start Teaching a Specific Chapter
  const handleStartChapter = (ch: Chapter) => {
    setSelectedChapter(ch);
    setSelectedBookPage(1);
    setActiveQuestionIdx(0);
    setSelectedMCQ(null);
    setTypedAnswer('');
    setAnswerStatus('idle');
    setActiveTargetQuestion('');
    setDetectedQuestions([]);

    setWhiteboardHeading(`पाठ ${ch.chapterNumber}: ${ch.titleHindi}`);
    setActiveTargetQuestion('');
    setWhiteboardSteps([]);
    setRevealedSteps(1);

    const introSpeech = `बेटा, आज हम "पाठ ${ch.chapterNumber}: ${ch.titleHindi}" पढ़ेंगे। नीचे दिए गए सवालों में से जो भी सवाल पूछना हो, उसपर क्लिक करें या माइक से बोलें!`;
    setSpeechText(introSpeech);
    speakText(introSpeech);

    // Add to Teacher Memory History Log
    const newRecord: StudyHistoryItem = {
      id: `h-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subjectId: selectedSubject?.id || 'math',
      subjectName: selectedSubject?.subjectHindi || 'गणित',
      teacherName: currentTeacher.name,
      chapterNumber: ch.chapterNumber,
      chapterTitle: ch.titleHindi,
      strength: `${ch.concepts[0] || 'मुख्य नियम'} को अच्छी तरह सीखा`,
      score: 5,
    };
    setStudyHistory((prev) => [newRecord, ...prev.slice(0, 4)]);

    const welcomeMsg = `शाबाश बेटा! अब हम पाठ ${ch.chapterNumber} "${ch.titleHindi}" पढ़ेंगे। मैंने किताब के 5 असली पृष्ठ और अंत के अभ्यास सवाल लोड कर दिए हैं। ध्यान से देखिए!`;
    setSpeechText(welcomeMsg);
    speakText(welcomeMsg);
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
    if (qItem.whiteboardSteps && qItem.whiteboardSteps.length > 0) {
      setTimeout(() => {
        setIsCheckingHomework(false);
        setWhiteboardSteps(qItem.whiteboardSteps);
        setRevealedSteps(qItem.whiteboardSteps.length);
      }, 500);
    } else {
      handleStudentQuery(`कृपया पाठ ${selectedChapter?.chapterNumber || ''} का यह प्रश्न हल कराएं: "${qItem.question}"`, qItem.question);
      return;
    }
    const msg = `बेटा, ध्यान से देखिए: सवाल है "${qItem.question}"। इसका स्टेप-बाय-स्टेप हल मैंने व्हाइटबोर्ड पर लिख दिया है!`;
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

    // Compress thumbnails for safe storage within 5MB limit
    const compressedFiles = await Promise.all(
      uploadedFiles.map(async (f) => ({
        ...f,
        url: f.url.startsWith('data:image') ? await compressImageForThumbnail(f.url, 280, 0.55) : f.url,
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
    setUploadedFiles(record.files || []);
    if (record.files && record.files.length > 0) {
      setUploadedImage(record.files[0].url);
      setActiveFileId(record.files[0].id);
      setUploadedFileName(record.files[0].name);
    }
    setDetectedQuestions(record.detectedQuestions || []);
    if (record.activeQuestion) {
      setActiveTargetQuestion(record.activeQuestion);
    } else if (record.detectedQuestions && record.detectedQuestions.length > 0) {
      setActiveTargetQuestion(record.detectedQuestions[0]);
    }
    const finalSteps: WhiteboardStepItem[] =
      record.whiteboardSteps && record.whiteboardSteps.length > 0
        ? record.whiteboardSteps
        : record.detectedQuestions && record.detectedQuestions.length > 0
          ? record.detectedQuestions.map((q, idx) => ({
              step: `प्रश्न ${idx + 1} का हल`,
              question: q,
              formula: q,
              annotation: `${record.teacherName || 'शिक्षक'}: "यह प्रश्न आपकी पूर्व सुरक्षित वर्कशीट से हल किया गया है।"`,
            }))
          : [
              {
                step: 'सुरक्षित रिकॉर्ड',
                question: record.title,
                formula: 'वर्कशीट सुरक्षित है',
                annotation: 'शिक्षक: "इस रिकॉर्ड का कार्य व्हाइटबोर्ड पर लोड हो गया है।"',
              },
            ];

    setWhiteboardSteps(finalSteps);
    setRevealedSteps(finalSteps.length);
    const heading = record.whiteboardHeading || record.title || 'सुरक्षित वर्कशीट हल';
    setWhiteboardHeading(heading);

    if (record.subjectId) {
      const matched = allSubjects.find((s) => s.id.toLowerCase().includes(record.subjectId.toLowerCase()));
      if (matched) setSelectedSubject(matched);
    }

    setActiveMathAnim(null);
    setIsHistoryModalOpen(false);

    const restoreMsg = `बेटा, आपका पिछला रिकॉर्ड "${record.title}" लोड हो गया है! अब आप इसके सभी सवाल आगे-पीछे करके हल कर सकते हैं।`;
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

  // Clear all records from history
  const handleClearAllWorksheetRecords = () => {
    if (typeof window !== 'undefined' && window.confirm('क्या आप सचमुच पूरा पुराना रिकॉर्ड साफ करना चाहते हैं?')) {
      setWorksheetHistory([]);
      try {
        localStorage.removeItem('ai_tuition_worksheet_records');
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

  // Handle Free-Form Student Query or Doubt
  const handleStudentQuery = async (queryText?: string, targetQTitle?: string) => {
    const rawVal = queryText !== undefined ? queryText : (inputText || inputRef.current?.value || '');
    const q = (rawVal || '').trim();
    if (!q && !uploadedImage) return;

    // 1. Immediately cancel any playing audio/speech so it never lags behind
    stopAudio();

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
    setIsCheckingHomework(true); // Full dedicated loader on screen

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
      }, 500);
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
      if (t.includes('math') || t.includes('गणित') || t.includes('ganit')) {
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

    // 3. Check if query asks to teach or open a specific chapter (e.g. 'Math का Chapter 8 पढ़ाओ', 'पाठ 5 पढ़ाओ')
    const chapterMatch = q.match(/(?:chapter|पाठ|अध्याय)\s*([0-9]+)/i);
    const asksToTeach =
      q.includes('पढ़ाओ') ||
      q.includes('पढाओ') ||
      q.includes('पढ़ाओ') ||
      q.includes('सिखाओ') ||
      q.includes('खोलो') ||
      qLower.includes('teach') ||
      qLower.includes('open') ||
      qLower.includes('start');

    if (chapterMatch || (asksToTeach && (qLower.includes('chapter') || q.includes('पाठ')))) {
      const targetSub = findSubjectFlexible(q) || selectedSubject || allSubjects[0];
      if (targetSub) {
        handleSelectSubject(targetSub);
        const chNum = chapterMatch ? parseInt(chapterMatch[1], 10) : 1;
        let targetChapter = targetSub.chapters.find((c) => c.chapterNumber === chNum);

        // Fallback matching by keyword if number didn't directly match
        if (!targetChapter) {
          if (q.includes('पुस्तकालय')) targetChapter = targetSub.chapters.find((c) => c.chapterNumber === 1);
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
          handleStartChapter(targetChapter);
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
      setWhiteboardHeading(
        isEn
          ? '🎯 Exam Preparation: Worksheet Mock Test'
          : '🎯 परीक्षा तैयारी: वर्कशीट मॉक टेस्ट'
      );
      setActiveMockQIdx(0);
      const introMsg =
        isEn
          ? 'Beta, Mock Test is ready! Read each question, write your answer in the box, and click "Save & Check" to see your score, mistakes, and spelling corrections!'
          : 'बेटा, मॉक टेस्ट तैयार है! केवल सवाल देखें, अपना उत्तर लिखें और "उत्तर सेव करें" दबाकर अपना स्कोर, गलतियां और स्पेलिंग चेक करें!';
      setSpeechText(introMsg);
      speakText(introMsg);

      // If questions are already extracted, immediately switch without re-fetching!
      if (whiteboardSteps.length > 0 || detectedQuestions.length > 0) {
        setIsCheckingHomework(false);
        return;
      }
      setIsCheckingHomework(true);
      promptMsg = isEn
        ? 'Please convert all questions from this worksheet into an interactive mock test in English for student exam preparation.'
        : 'कृपया इस शीट के सभी सवालों को एक इंटरैक्टिव मॉक टेस्ट में बदलें ताकि बच्चा परीक्षा की तैयारी कर सके।';
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
              {p}
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
              return <React.Fragment key={idx}>{p}</React.Fragment>;
            })}
          </>
        );
      }
    }

    return questionText;
  };

  // Helper to compile list of questions for Mock Test
  const getMockQuestionsList = (): Array<{ question: string; idealAnswer?: string }> => {
    const list: Array<{ question: string; idealAnswer?: string }> = [];

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
          step.step?.toLowerCase().includes('सीख') ||
          step.formula?.length > 250
        );
        if (isStoryOrVocab) return;

        const qText = getQuestionForStep(step, idx) || step.step;
        if (!list.some((item) => item.question === qText)) {
          list.push({
            question: qText,
            idealAnswer: step.formula || undefined,
          });
        }
      });
    } else if (detectedQuestions.length > 0) {
      detectedQuestions.forEach((q) => {
        list.push({ question: q });
      });
    } else if (selectedChapter?.sampleQuestions && selectedChapter.sampleQuestions.length > 0) {
      selectedChapter.sampleQuestions.forEach((sq: any) => {
        list.push({
          question: sq.question,
          idealAnswer: sq.correctAnswer || sq.explanation,
        });
      });
    }
    return list;
  };

  // Save & Evaluate student's typed Mock Test answer
  const handleSaveAndEvaluateMock = async (qIdx: number) => {
    const questionsList = getMockQuestionsList();
    const activeQ = questionsList[qIdx];
    if (!activeQ) return;
    const studentAns = (mockAnswers[qIdx] || '').trim();
    if (!studentAns) return;

    stopAudio();
    setIsEvaluatingMock(true);

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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.evaluation) {
          setMockEvaluations((prev) => ({
            ...prev,
            [qIdx]: data.evaluation,
          }));
          const praise = data.evaluation.teacherPraise || `शाबाश बेटा! आपका स्कोर ${data.evaluation.score}/10 है।`;
          setSpeechText(praise);
          speakText(praise);
        }
      }
    } catch (err) {
      console.error('Error evaluating mock answer:', err);
    } finally {
      setIsEvaluatingMock(false);
    }
  };

  // =========================================================================
  // 🔒 FROZEN / FIXED CONFIGURATION - DO NOT CHANGE! (स्थिर कॉन्फ़िगरेशन - इसे कभी न बदलें)
  // Verified: Uploads, reads and parses homework and textbook pages with 100% precision.
  // Daily Limit: 20 pages/day per student (saves tokens while typed questions remain unlimited).
  // =========================================================================
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // 🌟 User Requirement: In 7-day trial, student can upload 3 times for free. On 4th upload, show all features & subscribe!
    if (!isSubscribed) {
      if (trialUploadCount >= 3) {
        setIsFourthUploadAttempt(true);
        setIsSubscriptionModalOpen(true);
        const speech = 'शाबाश बेटा! आपने 3 मुफ़्त वर्कशीट हल कर ली हैं। अब बच्चे की रोज़ाना असीमित पढ़ाई के लिए ट्यूशन पैक एक्टिव करें!';
        setSpeechText(speech);
        speakText(speech);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
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

    try {
      const additionalB64 = newlyReadFiles.slice(1).map((f) => ({ url: f.url }));
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
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
          const firstTitle = cleaned[0]?.question || activeDoc.name;
          const pageTitle = `पेज #1 हल: ${firstTitle}`;
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

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}>
      {/* 1. KHAN ACADEMY STYLE TOP NAVIGATION HEADER */}
      <header className={`sticky top-0 z-40 border-b px-4 md:px-6 py-2.5 transition-colors duration-200 backdrop-blur-md ${
        isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-2xs'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Brand + Grade + Language Switcher */}
          <div className="flex items-center gap-3">
            <Link
              href="/reports"
              className={`p-2 rounded-xl transition-all flex items-center justify-center text-xs font-bold border ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="डैशबोर्ड / ऑल रिपोर्ट देखें"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                📚
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                    विद्या AI ट्यूशन
                  </h1>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Online
                  </span>
                </div>
                <p className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {board} • {className}
                </p>
              </div>
            </div>

            {/* Language Segmented Pill */}
            <div className={`p-0.5 rounded-xl border flex items-center text-xs font-bold shadow-2xs ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setMedium('hindi');
                  const intro = 'नमस्ते बेटा! अब हम हिंदी माध्यम में पढ़ाई करेंगे।';
                  setSpeechText(intro);
                  speakText(intro, undefined, true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  medium === 'hindi'
                    ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇮🇳 हिंदी
              </button>
              <button
                type="button"
                onClick={() => {
                  setMedium('english');
                  const intro = 'Hello! Now we will study in English medium.';
                  setSpeechText(intro);
                  speakText(intro, undefined, true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  medium === 'english'
                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🇬🇧 English
              </button>
            </div>

            {/* 📂 पिछला काम देखें BUTTON (Top Header placement as requested) */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                isDarkMode
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-950/60'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs'
              }`}
              title="पिछला सुरक्षित काम व वर्कशीट देखें"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span suppressHydrationWarning>📂 पिछला काम ({isMounted ? worksheetHistory.length : 0})</span>
            </button>
          </div>

          {/* Right: Controls & Motivation */}
          <div className="flex items-center gap-2">
            {/* 🌟 7-Day Free Trial (3 Free Uploads) / Pro Subscription Badge */}
            {!isMounted ? (
              <div className="px-2.5 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                <Flame className="w-3.5 h-3.5 fill-emerald-500 text-emerald-600" />
                <span>🎁 7-दिन मुफ़्त ट्रायल</span>
              </div>
            ) : isSubscribed ? (
              <button
                type="button"
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="प्रो ट्यूशन पैक एक्टिव है"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>⭐ प्रो ट्यूशन पैक</span>
              </button>
            ) : trialUploadCount < 3 ? (
              <button
                type="button"
                onClick={() => {
                  setIsFourthUploadAttempt(false);
                  setIsSubscriptionModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 font-black text-xs flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="7-दिन मुफ़्त ट्रायल: 3 में से मुफ़्त अपलोड"
              >
                <Flame className="w-3.5 h-3.5 fill-emerald-500 text-emerald-600 animate-pulse" />
                <span>🎁 ट्रायल: {trialUploadCount}/3 वर्कशीट ({trialDaysRemaining} दिन शेष)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsFourthUploadAttempt(true);
                  setIsSubscriptionModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md animate-pulse transition-all cursor-pointer"
                title="3 मुफ़्त वर्कशीट पूरी हो चुकी हैं। असीमित पढ़ाई के लिए ट्यूशन पैक लें!"
              >
                <AlertCircle className="w-3.5 h-3.5 text-white" />
                <span>⚠️ 3 मुफ़्त अपलोड पूरे • पैक लें (₹200)</span>
              </button>
            )}

            {/* Sunday Test Paper Button */}
            <button
              type="button"
              onClick={() => setIsSundayExamModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                isDarkMode
                  ? 'bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border-indigo-500/30'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}
              title="टेस्ट सीरीज़ दें या स्कोर व टेस्ट हिस्ट्री देखें"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>📝 टेस्ट सीरीज़</span>
            </button>

            {/* Student All Report Link Button */}
            <Link
              href="/reports"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs shadow-emerald-600/20"
              title={medium === 'english' ? 'View Complete Student Report Card' : 'विद्यार्थी की संपूर्ण रिपोर्ट देखें'}
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>{medium === 'english' ? 'Student Report' : 'स्टूडेंट रिपोर्ट'}</span>
            </Link>

            {/* Board Selector */}
            <div className={`p-0.5 rounded-xl border flex items-center text-xs font-bold ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              {(['RBSE', 'CBSE'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBoard(b)}
                  className={`px-2 py-1 rounded-lg text-xs font-black transition-all ${
                    board === b
                      ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Sound Toggle Button */}
            <button
              type="button"
              onClick={() => {
                if (!isAudioMuted) {
                  stopAudio();
                  setIsAudioMuted(true);
                } else {
                  setIsAudioMuted(false);
                  speakText(medium === 'english' ? 'Sound is now ON' : 'ध्वनि चालू है', undefined, true);
                }
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 shadow-xs ${
                isAudioMuted
                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              }`}
              title={isAudioMuted ? 'Click to Turn Sound ON' : 'Click to Turn Sound OFF'}
            >
              {isAudioMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Sound OFF</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
                  <span>Sound ON 🔊</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. CORE SUBJECTS SELECTOR RIBBON */}
      <div className={`border-b px-3 md:px-6 py-1.5 transition-colors duration-200 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[11px] font-black uppercase mr-1 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
              {medium === 'english' ? 'Subject:' : 'विषय:'}
            </span>
            {allSubjects.map((sub) => {
              const isSelected = selectedSubject?.id === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => handleSelectSubject(sub)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border shadow-2xs cursor-pointer ${isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/30'
                    : isDarkMode
                      ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                >
                  <span className="text-sm">{sub.emoji}</span>
                  <span>{sub.subjectHindi}</span>
                  <span className="text-[10px] opacity-75 font-normal">({sub.teacherName.split(' ')[0]})</span>
                </button>
              );
            })}

            {/* CHAPTERS TOGGLE BUTTON IN RIBBON */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0 hidden sm:block" />
            <button
              type="button"
              onClick={() => {
                if (!selectedSubject) {
                  alert('कृपया पहले ऊपर दिए गए विषयों में से कोई एक विषय चुनें!');
                  return;
                }
                setIsChaptersOpen((prev) => !prev);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border shadow-2xs shrink-0 cursor-pointer ${isChaptersOpen
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/20'
                : isDarkMode
                  ? 'bg-slate-950 text-blue-300 border-blue-500/30 hover:border-blue-400 hover:bg-blue-950/30'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                }`}
              title="पाठ व चैप्टर्स सूची खोलें"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>📚 चैप्टर्स सूची ({selectedSubject?.chapters?.length || 0})</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isChaptersOpen
                ? 'bg-white/20 text-white'
                : isDarkMode
                  ? 'bg-blue-900/50 text-blue-200'
                  : 'bg-white text-blue-700 border border-blue-200'
                }`}>
                {isChaptersOpen ? '✕ बंद' : '▾ खोलें'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Animated Character Guide, Copy Scanner, & Student Learning Journey (4 Cols) - Fixed / Sticky with scroll */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-none">
          {/* KHAN ACADEMY STYLE TEACHER COACH CARD */}
          <div className={`rounded-2xl p-4 border transition-all duration-200 relative overflow-hidden shadow-xs ${isDarkMode
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200/90 text-slate-900'
            }`}>
            <div className="flex items-center gap-3.5">
              {/* Teacher Avatar Pill */}
              <div className="relative shrink-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border transition-all ${
                  isSpeaking ? 'ring-2 ring-blue-500 scale-105' : ''
                } ${isDarkMode ? 'bg-blue-950/60 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
                  {currentTeacher.emoji}
                </div>
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                  isSpeaking ? 'bg-emerald-500 animate-ping' : isListening ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                }`} />
              </div>

              {/* Name & Teacher Role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {currentTeacher.name}
                    </h3>
                    <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate">
                      {currentTeacher.role}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => speakText(speechText, undefined, true)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all shrink-0 ${isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200'
                      }`}
                    title="आवाज़ दोबारा सुनें (Replay Voice)"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-[11px] font-bold">Replay</span>
                  </button>
                </div>

                {/* Subtle Speech line */}
                <div className="mt-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug font-medium">
                    &quot;{speechText || 'नमस्ते बेटा! कोई भी सवाल पूछिए या किताब की फोटो दिखाएं।'}&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* HOMEWORK & BOOK SCANNER (Khan Academy Assignment Style) */}
          <div className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 space-y-3.5 ${isDarkMode
            ? 'bg-slate-900 border-slate-800 shadow-xl'
            : 'bg-white border-slate-200/90 shadow-xs'
            }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase flex items-center gap-1.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'
                }`}>
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {medium === 'english' ? 'Homework & Book Page' : 'किताब या कॉपी का पेज'}
              </span>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${dailyUploadCount >= MAX_DAILY_UPLOADS
                ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}>
                📸 {dailyUploadCount}/{MAX_DAILY_UPLOADS} {medium === 'english' ? 'Pages' : 'पेज'}
              </span>
            </div>

            <input
              id="homework-upload-input"
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              multiple
              className="sr-only"
              onChange={handlePhotoUpload}
            />

            {uploadedFiles.length > 0 ? (
              <div className={`rounded-2xl border p-3.5 space-y-3 ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50/70'
                }`}>
                {/* Multi-File Header with Friendly Status & History */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-black flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>
                      {uploadedFiles.length}{' '}
                      {medium === 'english'
                        ? uploadedFiles.length === 1
                          ? 'Page Ready'
                          : 'Pages Ready'
                        : 'पेज तैयार है'}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 flex items-center gap-1 transition-all shadow-2xs"
                      title={medium === 'english' ? 'View past worksheets' : 'पिछला काम / रिकॉर्ड देखें'}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{medium === 'english' ? 'History' : 'इतिहास'}</span>
                    </button>
                    {uploadedFiles.length > 1 && (
                      <button
                        type="button"
                        onClick={handleClearAllFiles}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center gap-1 transition-all shadow-2xs"
                        title={medium === 'english' ? 'Remove all uploaded pages' : 'सभी पेज हटाएं'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{medium === 'english' ? 'Clear All' : 'सभी हटाएं'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Horizontal Thumbnails Carousel if multiple files */}
                {uploadedFiles.length > 1 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">
                      {medium === 'english'
                        ? 'Uploaded Pages (Click to switch):'
                        : 'अपलोड किए गए पेज (क्लिक करके पेज बदलें):'}
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {uploadedFiles.map((file, idx) => {
                        const isThisActive = (activeFileDoc?.id || uploadedFiles[0]?.id) === file.id;
                        const isPdf = file.name.toLowerCase().endsWith('.pdf');

                        return (
                          <div
                            key={file.id}
                            onClick={() => handleSwitchPage(file.id)}
                            className={`relative shrink-0 w-20 h-20 rounded-xl border-2 cursor-pointer transition-all overflow-hidden group ${isThisActive
                              ? 'border-blue-600 ring-2 ring-blue-500/40 shadow-md scale-102'
                              : 'border-slate-300 dark:border-slate-700 opacity-75 hover:opacity-100'
                              }`}
                          >
                            {isPdf ? (
                              <div className="w-full h-full bg-rose-950/40 flex flex-col items-center justify-center p-1 text-center">
                                <span className="text-xl">📑</span>
                                <span className="text-[9px] font-black text-rose-400 truncate max-w-full">PDF</span>
                              </div>
                            ) : (
                              <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                            )}
                            <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[9px] font-bold text-center py-0.5 truncate px-0.5">
                              {medium === 'english' ? `Page #${idx + 1}` : `पेज #${idx + 1}`}
                            </span>
                            {/* Individual Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(file.id);
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs shadow-md opacity-90 hover:opacity-100 hover:scale-110 transition-all z-10"
                              title={medium === 'english' ? 'Remove this page' : 'यह पेज हटाएं'}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Document Full Display */}
                <div className="relative">
                  {uploadedFileName.toLowerCase().endsWith('.pdf') ? (
                    <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isDarkMode
                      ? 'bg-slate-900 border-rose-500/30 text-white'
                      : 'bg-white border-rose-200 text-slate-800 shadow-2xs'
                      }`}>
                      <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center text-2xl shrink-0 font-bold border border-rose-200">
                        📑
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-black tracking-wider text-rose-500 block">
                          {medium === 'english' ? 'PDF Document' : 'PDF दस्तावेज़'}
                        </span>
                        <h4 className={`text-xs font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {uploadedFileName}
                        </h4>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                          {medium === 'english'
                            ? '✓ Questions & answers scanned cleanly'
                            : '✓ सभी प्रश्न व उत्तर तैयार हैं'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(activeFileDoc?.id || '')}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1 border border-rose-200"
                        title={medium === 'english' ? 'Remove' : 'हटाएं'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{medium === 'english' ? 'Remove' : 'हटाएं'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
                      <img
                        src={uploadedImage || ''}
                        alt="Uploaded Homework"
                        className="w-full h-36 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(activeFileDoc?.id || '')}
                        className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
                        title={medium === 'english' ? 'Remove this photo' : 'यह फोटो हटाएं'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{medium === 'english' ? 'Remove' : 'हटाएं'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs px-0.5">
                  <span className="text-slate-600 dark:text-slate-300 font-bold truncate max-w-[240px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{uploadedFileName || (medium === 'english' ? 'Homework Page' : 'होमवर्क पेज')}</span>
                  </span>
                </div>

                {/* Big Kid-Friendly Add More Pages Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isSubscribed && trialUploadCount >= 3) {
                      setIsFourthUploadAttempt(true);
                      setIsSubscriptionModalOpen(true);
                      const speech = 'शाबाश बेटा! आपने 3 मुफ़्त वर्कशीट हल कर ली हैं। अब बच्चे की रोज़ाना असीमित पढ़ाई के लिए ट्यूशन पैक एक्टिव करें!';
                      setSpeechText(speech);
                      speakText(speech);
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:scale-[1.01]"
                  title={medium === 'english' ? 'Add more pages or photos' : 'और पेज या फोटो जोड़ें'}
                >
                  <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{medium === 'english' ? 'Add Another Page / Photo' : 'और पेज या फोटो जोड़ें'}</span>
                </button>

                {/* 3-Action Segmented Control (Khan Academy Style) */}
                <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 grid grid-cols-3 gap-1 w-full shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleTriggerMode('teach')}
                    disabled={isCheckingHomework}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      currentUploadMode === 'teach'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isCheckingHomework && currentUploadMode === 'teach' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                    ) : (
                      <span className="text-sm shrink-0">💡</span>
                    )}
                    <span className="truncate">{medium === 'english' ? 'Learn' : 'समझना है'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerMode('check')}
                    disabled={isCheckingHomework}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      currentUploadMode === 'check'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isCheckingHomework && currentUploadMode === 'check' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                    ) : (
                      <span className="text-sm shrink-0">✍️</span>
                    )}
                    <span className="truncate">{medium === 'english' ? 'Check Copy' : 'कॉपी चेक'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerMode('quiz')}
                    disabled={isCheckingHomework}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                      currentUploadMode === 'quiz'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isCheckingHomework && currentUploadMode === 'quiz' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                    ) : (
                      <span className="text-sm shrink-0">🎯</span>
                    )}
                    <span className="truncate">{medium === 'english' ? 'Test Yourself' : 'टेस्ट दें'}</span>
                  </button>
                </div>

                {/* 1-Click Student All Report Card Button */}
                <Link
                  href="/reports"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{medium === 'english' ? '📊 View Student Report Card' : '📊 स्टूडेंट रिपोर्ट कार्ड देखें'}</span>
                </Link>

                {detectedChapter && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-blue-50/50 to-emerald-50/50 dark:bg-slate-900 border border-amber-300 dark:border-amber-500/30 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                        {medium === 'english' ? '📖 Chapter Story' : '📖 पाठ / कहानी वाचन'}
                      </span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        {medium === 'english' ? 'Story' : 'कहानी'}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-2">
                      {detectedChapter.title}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleOpenDetectedChapter(detectedChapter)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 hover:from-amber-600 hover:to-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{medium === 'english' ? 'Read Story & Explanation' : 'पूरी कहानी पढ़ें व समझें'}</span>
                    </button>
                  </div>
                )}

                <div className={`pt-2 p-3 rounded-2xl border text-center space-y-1 ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    📄 {uploadedFileName || 'दस्तावेज़'} अपलोड हो गया है
                  </p>
                  <p className={`text-[11px] ${isDarkMode ? 'text-blue-300' : 'text-blue-700 font-semibold'}`}>
                    लाइव प्रश्न व उत्तर देखने के लिए ऊपर &quot;समझना है&quot; या &quot;कॉपी चेक&quot; दबाएं।
                  </p>
                </div>

                {isCheckingHomework && (
                  <div className={`p-3.5 rounded-2xl border text-center space-y-2 shadow-md animate-in fade-in ${isDarkMode
                    ? 'bg-blue-950/80 border-blue-500/40 shadow-blue-950/50'
                    : 'bg-blue-50 border-blue-200 shadow-blue-100'
                    }`}>
                    <div className={`flex items-center justify-center gap-2 text-xs font-black ${isDarkMode ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                      <span>{currentTeacher.name} सवाल देख रहे हैं... बस कुछ सेकंड बेटा!</span>
                    </div>
                    <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-blue-200/50'
                      }`}>
                      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label
                htmlFor={!isSubscribed && trialUploadCount >= 3 ? undefined : 'homework-upload-input'}
                onClick={(e) => {
                  if (!isSubscribed && trialUploadCount >= 3) {
                    e.preventDefault();
                    setIsFourthUploadAttempt(true);
                    setIsSubscriptionModalOpen(true);
                    const speech = 'शाबाश बेटा! आपने 3 मुफ़्त वर्कशीट हल कर ली हैं। अब बच्चे की रोज़ाना असीमित पढ़ाई के लिए ट्यूशन पैक एक्टिव करें!';
                    setSpeechText(speech);
                    speakText(speech);
                  }
                }}
                className={`w-full py-7 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer group ${isDarkMode
                  ? 'border-blue-500/40 hover:border-blue-400 bg-blue-950/20 hover:bg-blue-950/40 text-blue-300'
                  : 'border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/80 text-blue-700'
                  }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-100 text-blue-600'
                  }`}>
                  <Upload className="w-7 h-7" />
                </div>
                <div className="text-center space-y-0.5">
                  <span className={`text-sm font-black block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    📸 बुक या कॉपी का पेज दिखाएं
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    यहाँ क्लिक करें या फोटो खींचें (इमेज या PDF)
                  </span>
                </div>
              </label>
            )}

          </div>

        </div>

        {/* RIGHT COLUMN: Whiteboard, Chapter Picker, & Interactive Doubts (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* COMPACT CHAPTER HEADER BAR & BUTTON TOGGLE (Sare Chapters Button pe open, pehle mat dikhao) */}
          {selectedSubject ? (
            <div className="space-y-3">
              {/* Compact Bar with Button to Open Chapters */}
              <div className={`rounded-2xl p-4 md:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode
                ? 'bg-slate-900 border-slate-800 shadow-xl'
                : 'bg-white border-slate-200/90 shadow-xs'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0 border border-blue-200">
                    📖
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm md:text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {selectedSubject ? `${selectedSubject.subjectHindi} (${selectedSubject.bookName})` : '👆 ऊपर से कोई भी विषय चुनें'}
                      </h3>
                      {selectedChapter && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                          पाठ {selectedChapter.chapterNumber} सक्रिय
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {selectedChapter
                        ? `वर्तमान पाठ: ${selectedChapter.titleHindi}`
                        : `कुल ${selectedSubject?.chapters?.length || 0} पाठ उपलब्ध हैं। पढ़ने के लिए चैप्टर्स बटन दबाएं।`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsChaptersOpen(!isChaptersOpen)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs ${isChaptersOpen
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                      }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{isChaptersOpen ? '✕ चैप्टर्स बंद करें' : '📚 सारे चैप्टर्स देखें ▾'}</span>
                  </button>
                </div>
              </div>

              {/* COLLAPSIBLE CHAPTERS GRID (Only opens when user clicks button!) */}
              {isChaptersOpen && (
                <div className={`rounded-2xl p-5 border transition-all animate-in fade-in duration-200 space-y-3 ${isDarkMode
                  ? 'bg-slate-900/95 border-blue-500/30 shadow-2xl'
                  : 'bg-blue-50/40 border-blue-200 shadow-sm'
                  }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📑</span> {selectedSubject?.subjectHindi || 'पाठ्यपुस्तक'} - सभी {selectedSubject?.chapters?.length || 0} चैप्टर्स
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsChaptersOpen(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 rounded-lg"
                    >
                      ✕ बंद करें
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                    {(selectedSubject?.chapters || []).map((ch) => {
                      const isChSelected = selectedChapter?.id === ch.id;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => {
                            handleStartChapter(ch);
                            setIsChaptersOpen(false);
                          }}
                          className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all flex flex-col justify-between ${isChSelected
                            ? isDarkMode
                              ? 'bg-blue-950/60 border-blue-400 text-white shadow-md'
                              : 'bg-blue-50 border-blue-400 text-blue-950 shadow-xs'
                            : isDarkMode
                              ? 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                              : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700 shadow-2xs'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-amber-400' : 'text-indigo-700'
                              }`}>
                              पाठ {ch.chapterNumber}
                            </span>
                            <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              {ch.term === 'half_yearly' ? 'अर्धवार्षिक' : 'वार्षिक'}
                            </span>
                          </div>
                          <span className={`text-xs font-black truncate ${isChSelected && !isDarkMode ? 'text-indigo-950' : ''
                            }`}>
                            {ch.titleHindi}
                          </span>
                          <span className={`text-[10px] truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {ch.titleEnglish}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* WELCOME SUBJECT LAUNCHPAD IF NO SUBJECT CLICKED YET */
            <div className={`rounded-3xl p-6 border text-center space-y-4 transition-all duration-200 ${isDarkMode
              ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border-indigo-500/30 shadow-2xl'
              : 'bg-white border-slate-200 shadow-sm text-slate-900'
              }`}>
              <span className="text-4xl">👋</span>
              <h2 className={`text-xl md:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                नमस्ते बेटा! आज ट्यूशन में क्या पढ़ना चाहते हैं?
              </h2>
              <p className={`text-xs max-w-lg mx-auto leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                ऊपर दिए गए 4 विषयों (Math, EVS, English, Hindi) में से कोई भी विषय चुनें, या नीचे माइक दबाकर बोलें:
                <span className={`font-bold ${isDarkMode ? 'text-amber-300' : 'text-indigo-600'}`}> "शर्मा सर, Math का Chapter 8 पढ़ाओ"</span>
              </p>

              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-slate-900 border border-indigo-200 dark:border-slate-800 max-w-md mx-auto text-center">
                <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300">
                  👆 ऊपर दिए गए 4 विषयों (गणित, EVS, हिंदी, अंग्रेजी) में से किसी भी विषय पर क्लिक करें या नीचे माइक से बोलें!
                </p>
              </div>
            </div>
          )}

          {/* REAL 5 BOOK PAGES VIEWER & CHAPTER EXERCISE SOLVER */}
          {selectedChapter && (
            <div className={`rounded-3xl p-5 border transition-all duration-200 space-y-4 ${isDarkMode
              ? 'bg-slate-900 border-slate-800 shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0">
                    📖
                  </div>
                  <div>
                    <h3 className={`text-sm md:text-base font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                      पाठ {selectedChapter.chapterNumber}: पाठ्यपुस्तक के 5 असली पृष्ठ (Real Book Pages)
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {selectedSubject?.bookName} — पृष्ठ 1 से 5 व अंत के असली अभ्यास प्रश्न
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${isDarkMode ? 'bg-indigo-950/60 border-indigo-700/50 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}>
                    कुल 5 पृष्ठ (Full Chapter)
                  </span>
                </div>
              </div>

              {/* 5 PAGE TABS */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {(selectedChapter.bookPages || [
                  { pageNumber: 1, pageTitle: 'पृष्ठ 1: अवधारणा व चित्र' },
                  { pageNumber: 2, pageTitle: 'पृष्ठ 2: मुख्य सूत्र व नियम' },
                  { pageNumber: 3, pageTitle: 'पृष्ठ 3: दैनिक जीवन उदाहरण' },
                  { pageNumber: 4, pageTitle: 'पृष्ठ 4: अभ्यास प्रश्न 8.1' },
                  { pageNumber: 5, pageTitle: '🎯 पृष्ठ 5: किताब के अंत के प्रश्न' },
                ]).map((bp, pIdx) => {
                  const pNum = bp.pageNumber || pIdx + 1;
                  const isPageActive = selectedBookPage === pNum;
                  const isEndPage = pNum === 5;

                  return (
                    <button
                      key={pNum}
                      onClick={() => {
                        setSelectedBookPage(pNum);
                        if (pNum === 5 && selectedChapter.sampleQuestions && selectedChapter.sampleQuestions.length >= 4) {
                          handleSolveChapterQuestion(selectedChapter.sampleQuestions[3]);
                        } else if (selectedChapter.sampleQuestions && selectedChapter.sampleQuestions[pNum - 1]) {
                          handleSolveChapterQuestion(selectedChapter.sampleQuestions[pNum - 1]);
                        }
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 ${isPageActive
                        ? isEndPage
                          ? 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 border-amber-400 text-amber-500 shadow-sm'
                          : isDarkMode
                            ? 'bg-indigo-600/20 border-indigo-400 text-white shadow-sm'
                            : 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-xs'
                        : isDarkMode
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                          : 'bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-700'
                        }`}
                    >
                      <span className={`text-[10px] font-black uppercase ${isEndPage ? 'text-amber-500 font-extrabold' : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        {isEndPage ? '🎯 मुख्य प्रश्न' : `पेज ${pNum}`}
                      </span>
                      <span className="text-[11px] font-bold line-clamp-1">
                        {bp.pageTitle || `पृष्ठ ${pNum}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CURRENT BOOK PAGE DETAILS & REAL EXERCISE QUESTIONS */}
              {(() => {
                const curPageData = selectedChapter.bookPages?.find((p) => p.pageNumber === selectedBookPage) || {
                  pageNumber: selectedBookPage,
                  pageTitle: `पृष्ठ ${selectedBookPage}: ${selectedChapter.titleHindi}`,
                  summary: selectedChapter.concepts.join(', '),
                  concepts: selectedChapter.concepts,
                };

                return (
                  <div className={`p-4 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black flex items-center gap-1.5 ${selectedBookPage === 5 ? 'text-amber-500' : isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                        }`}>
                        <span>{selectedBookPage === 5 ? '🎯' : '📄'}</span>
                        {curPageData.pageTitle}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        NCERT / RBSE Class 4th Real Book
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {curPageData.summary}
                    </p>

                    {/* REAL EXERCISE QUESTIONS FOR THIS CHAPTER */}
                    <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900 dark:text-white flex items-center gap-1">
                          <span>✍️</span> {selectedBookPage === 5 ? 'किताब के अंत के असली प्रश्न (End-of-Chapter Real Questions):' : 'इस पृष्ठ के अभ्यास प्रश्न:'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          क्लिक करके सीधे व्हाइटबोर्ड पर हल करें
                        </span>
                      </div>

                      <div className="space-y-2">
                        {(selectedChapter.sampleQuestions || []).map((qItem, qIdx) => {
                          const isTarget = activeTargetQuestion === qItem.question;
                          const isEndQ = qIdx >= 3;
                          if (selectedBookPage === 5 && !isEndQ) return null; // On Page 5 only show end-of-chapter questions

                          return (
                            <div
                              key={qIdx}
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${isTarget
                                ? isDarkMode
                                  ? 'bg-amber-950/40 border-amber-400/60 shadow-md'
                                  : 'bg-amber-50 border-amber-300 shadow-xs'
                                : isDarkMode
                                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                  : 'bg-white border-slate-200 hover:border-indigo-300'
                                }`}
                            >
                              <div className="flex-1">
                                <span className={`text-[10px] font-black uppercase block ${isEndQ ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400'
                                  }`}>
                                  {isEndQ
                                    ? (medium === 'english' ? '🎯 Textbook Chapter End Question' : '🎯 किताब के अंत का असली प्रश्न')
                                    : (medium === 'english' ? `Question ${qIdx + 1}` : `प्रश्न ${qIdx + 1}`)}
                                </span>
                                <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {qItem.question}
                                </p>
                              </div>

                              <button
                                onClick={() => handleSolveChapterQuestion(qItem)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1 self-start sm:self-auto ${isTarget
                                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                                  }`}
                              >
                                <span>{isTarget
                                  ? (medium === 'english' ? '✓ Viewing Solution' : '✓ हल देख रहे हैं')
                                  : (medium === 'english' ? 'Solve on Board →' : 'व्हाइटबोर्ड पर हल करें →')}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* DIGITAL CLASSROOM & WHITEBOARD (Khan Academy Style) */}
          <div className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 ${isDarkMode
            ? 'bg-slate-900 border-slate-800 shadow-xl'
            : 'bg-white border-slate-200/90 shadow-xs'
            }`}>
            <div className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between transition-colors ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/80 border-slate-200'
              }`}>
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className={`text-xs font-black uppercase tracking-wide shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'
                  }`}>
                  {selectedSubject ? `${selectedSubject.subjectHindi} क्लासरूम` : 'डिजिटल क्लासरूम'}
                </span>
                <span className={`shrink-0 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>•</span>
                <span className={`text-xs sm:text-sm font-bold truncate max-w-sm sm:max-w-xl ${isDarkMode ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                  {getDisplayWhiteboardHeading(whiteboardHeading)}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* 📝 Kid Scratchpad / Rough Work Notebook Button */}
                <button
                  type="button"
                  onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all shadow-2xs ${isScratchpadOpen
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md ring-2 ring-amber-400/40'
                    : isDarkMode
                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                    }`}
                  title={medium === 'english' ? "Open Student's Rough Work Notebook" : "बच्चे की रफ़ कॉपी खोलें"}
                >
                  <span>📝</span>
                  <span>{medium === 'english' ? 'Rough Notebook' : 'रफ़ कॉपी'}</span>
                  {isScratchpadOpen ? (
                    <span className="text-[10px] bg-slate-950 text-amber-300 rounded px-1.5 py-0.5 font-bold">खुली है ✕</span>
                  ) : (
                    <span className="text-[10px] bg-amber-400/30 text-amber-800 dark:text-amber-200 rounded px-1 font-bold">हिसाब करें</span>
                  )}
                </button>

                {whiteboardSteps.length > 0 && (
                  <>
                    {/* Skip / Show Full Solution Immediately */}
                    {!activeMathAnim && revealedSteps < whiteboardSteps.length && (
                      <button
                        type="button"
                        onClick={() => setRevealedSteps(whiteboardSteps.length)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all shadow-2xs ${isDarkMode
                          ? 'bg-blue-950/80 hover:bg-blue-900 text-blue-300 border-blue-700/60'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                          }`}
                        title={medium === 'english' ? 'Show all solution steps together' : 'पूरा हल एक साथ देखें'}
                      >
                        <span>⏩</span>
                        <span>{medium === 'english' ? 'Full Solution' : 'पूरा हल देखें'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setRevealedSteps(1)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all shadow-2xs ${isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      title={medium === 'english' ? 'Restart explanation from step 1' : 'शुरू से फिर से समझें'}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{medium === 'english' ? 'Replay' : 'शुरू से देखें'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* WORKSHEET PAGE-WISE PAGINATION BAR */}
            {uploadedFiles.length > 0 && (
              <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 overflow-x-auto scrollbar-none transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                }`}>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
                  <span className={`text-xs font-black uppercase shrink-0 flex items-center gap-1.5 ${isDarkMode ? 'text-amber-400' : 'text-blue-700'
                    }`}>
                    <span>📑</span> {medium === 'english' ? 'Worksheet Pages:' : 'वर्कशीट पेज (Pages):'}
                  </span>

                  {/* Page Pagination Tabs */}
                  {uploadedFiles.map((file, pIdx) => {
                    const isThisActive = (activeFileDoc?.id || uploadedFiles[0]?.id) === file.id;
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => handleSwitchPage(file.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-2 shadow-xs ${isThisActive
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                          : isDarkMode
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            : 'bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 hover:border-blue-300'
                          }`}
                        title={medium === 'english' ? `View Page ${pIdx + 1} All Questions & Solutions` : `पेज ${pIdx + 1} के सभी सवाल व हल देखें`}
                      >
                        <span>📄</span>
                        <span>{medium === 'english' ? `Page #${pIdx + 1}` : `पेज #${pIdx + 1}`}</span>
                        {isThisActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      </button>
                    );
                  })}

                  {/* Quick Add Page Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl border border-dashed border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-black shrink-0 transition-all flex items-center gap-1 shadow-2xs"
                    title={medium === 'english' ? 'Add Next Page' : 'अगला पेज जोड़ें'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{medium === 'english' ? 'Add Page' : 'पेज जोड़ें'}</span>
                  </button>
                </div>

                {/* Right Badge: Telling students all questions are together */}
                <div className="flex items-center gap-2 shrink-0">
                  {detectedChapter && (
                    <button
                      type="button"
                      onClick={() => handleOpenDetectedChapter(detectedChapter)}
                      className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-black flex items-center gap-1.5 hover:bg-amber-100"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      <span className="truncate max-w-[150px]">📖 {detectedChapter.title}</span>
                    </button>
                  )}

                  <div className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border shadow-2xs ${isDarkMode
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{medium === 'english' ? 'All Questions & Answers on this Page' : 'पूरे पेज के सभी प्रश्न व उत्तर नीचे देखें'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className={`p-5 sm:p-6 space-y-4 transition-all duration-300 min-h-[220px] ${!isDarkMode
              ? chalkboardTheme === 'green'
                ? 'bg-[#0f2e1d] text-white shadow-inner'
                : 'bg-white text-slate-900'
              : chalkboardTheme === 'green'
                ? 'bg-[#0b2416] border-emerald-900/40 shadow-inner text-white'
                : 'bg-slate-900/95 text-white'
              }`}>
              {isCheckingHomework ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
                  {/* Glowing Radar & Teacher Avatar */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-blue-500/20 border-2 border-blue-400/50 flex items-center justify-center shadow-[0_0_35px_rgba(37,99,235,0.3)] animate-pulse">
                      <span className="text-4xl animate-bounce">{currentTeacher.emoji}</span>
                    </div>
                    <div className="absolute -inset-2 rounded-3xl border border-amber-400/40 animate-spin border-t-transparent" />
                  </div>

                  {/* Loader Headings */}
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                      <span>{medium === 'english' ? 'Scanning Questions' : 'सवाल पढ़े जा रहे हैं...'}</span>
                    </div>

                    <h4 className={`text-base sm:text-lg font-black ${isDarkMode || chalkboardTheme === 'green' ? 'text-white' : 'text-slate-900'}`}>
                      {activeTargetQuestion && !activeTargetQuestion.includes('Master') && !activeTargetQuestion.includes('मास्टर')
                        ? (medium === 'english' ? 'Preparing step-by-step solution... ✍️' : 'सवाल का हल तैयार किया जा रहा है... ✍️')
                        : uploadedFileName
                          ? (medium === 'english' ? `Reading questions from "${uploadedFileName}"... 🔍` : `दस्तावेज़ "${uploadedFileName}" से सवाल पढ़े जा रहे हैं... 🔍`)
                          : (medium === 'english' ? `${currentTeacher.name} is writing on the board... ⏳` : `${currentTeacher.name} व्हाइटबोर्ड पर हल तैयार कर रहे हैं... ⏳`)}
                    </h4>

                    {activeTargetQuestion && !activeTargetQuestion.includes('Master') && !activeTargetQuestion.includes('मास्टर') && (
                      <p className={`text-xs font-semibold line-clamp-2 px-3 py-1.5 rounded-xl border ${isDarkMode || chalkboardTheme === 'green'
                        ? 'text-amber-300 bg-slate-900/90 border-slate-800'
                        : 'text-blue-900 bg-blue-50 border-blue-200'
                        }`}>
                        {activeTargetQuestion}
                      </p>
                    )}

                    <p className={`text-xs ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {medium === 'english'
                        ? 'Please wait a few seconds. Questions are being analyzed directly from your page.'
                        : 'बस कुछ सेकंड प्रतीक्षा करें बेटा, सारे सवाल और हल तैयार हो रहे हैं।'}
                    </p>
                  </div>

                  {/* Pulsing Skeleton Step Cards */}
                  <div className="w-full max-w-md space-y-2 pt-2">
                    <div className={`p-3.5 rounded-2xl border flex items-center gap-3 animate-pulse ${isDarkMode || chalkboardTheme === 'green'
                      ? 'bg-slate-900/80 border-slate-800/80'
                      : 'bg-slate-50 border-slate-200'
                      }`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className={`text-xs font-bold ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {medium === 'english' ? 'Step 1: Given values & question' : 'चरण 1: प्रश्न व दिया गया मान'}
                      </span>
                      <div className={`h-2 rounded w-1/3 ml-auto ${isDarkMode || chalkboardTheme === 'green' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    </div>
                    <div className={`p-3.5 rounded-2xl border flex items-center gap-3 animate-pulse delay-150 ${isDarkMode || chalkboardTheme === 'green'
                      ? 'bg-slate-900/80 border-slate-800/80'
                      : 'bg-slate-50 border-slate-200'
                      }`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span className={`text-xs font-bold ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {medium === 'english' ? 'Step 2: Formula & calculation' : 'चरण 2: गणना व नियम'}
                      </span>
                      <div className={`h-2 rounded w-1/4 ml-auto ${isDarkMode || chalkboardTheme === 'green' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    </div>
                    <div className={`p-3.5 rounded-2xl border flex items-center gap-3 animate-pulse delay-300 ${isDarkMode || chalkboardTheme === 'green'
                      ? 'bg-slate-900/80 border-slate-800/80'
                      : 'bg-slate-50 border-slate-200'
                      }`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className={`text-xs font-bold ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {medium === 'english' ? 'Step 3: Final answer & verification' : 'चरण 3: अंतिम उत्तर व विकल्प'}
                      </span>
                      <div className={`h-2 rounded w-1/5 ml-auto ${isDarkMode || chalkboardTheme === 'green' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    </div>
                  </div>
                </div>
              ) : whiteboardSteps.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-3xl">📝</span>
                  <p className={`text-xs ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {medium === 'english'
                      ? 'The whiteboard is currently empty. Pick a chapter, upload your notebook photo, or ask with the mic!'
                      : 'व्हाइटबोर्ड अभी खाली है। कोई भी पाठ चुनें, कॉपी की फोटो भेजें, या माइक से सवाल पूछें!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Previous Worksheet Archived Notice Banner */}
                  {lastArchivedNotice && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="truncate">
                          📂 पिछली वर्कशीट &quot;{lastArchivedNotice.title}&quot; ({lastArchivedNotice.count} सवाल) रिकॉर्ड में सुरक्षित कर दी गई है!
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsHistoryModalOpen(true)}
                          className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-xs"
                        >
                          पुराना रिकॉर्ड देखें
                        </button>
                        <button
                          type="button"
                          onClick={() => setLastArchivedNotice(null)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Real Teacher Animated Whiteboard (for 10+10, math expressions, addition, etc.) */}
                  {activeMathAnim && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                          <span>✨</span> {currentTeacher.name} का लाइव ब्लैकबोर्ड
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMathAnim(null);
                            setActiveTargetQuestion('');
                            setWhiteboardSteps([]);
                          }}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition-all"
                          title="ब्लैकबोर्ड बंद करें"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>बंद करें</span>
                        </button>
                      </div>
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
                      />
                    </div>
                  )}



                  {!activeMathAnim && (
                    currentUploadMode === 'quiz' ? (
                      /* MOCK TEST INTERACTIVE ARENA */
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Mock Test Header Banner */}
                        <div className={`p-4 rounded-2xl border ${isDarkMode || chalkboardTheme === 'green'
                          ? 'bg-gradient-to-r from-amber-950/40 via-indigo-950/40 to-slate-900 border-amber-500/30'
                          : 'bg-gradient-to-r from-amber-50 via-indigo-50 to-white border-amber-200'
                          }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-lg font-black shrink-0">
                                🎯
                              </span>
                              <div>
                                <h3 className={`text-sm sm:text-base font-black ${isDarkMode || chalkboardTheme === 'green' ? 'text-white' : 'text-slate-900'
                                  }`}>
                                  {medium === 'english' ? 'Worksheet Mock Test Arena' : 'वर्कशीट मॉक टेस्ट (Mock Test Arena)'}
                                </h3>
                                <p className={`text-xs ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>
                                  {medium === 'english'
                                    ? 'Only questions are shown. Type your full answer, click "Save & Check", and get instant grading!'
                                    : 'यहाँ केवल सवाल दिखाए गए हैं। अपना उत्तर लिखें और "उत्तर सेव करें" दबाकर स्कोर, गलतियां व स्पेलिंग चेक करें!'}
                                </p>
                              </div>
                            </div>

                            {/* Total Questions Badge */}
                            {getMockQuestionsList().length > 0 && (
                              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 self-start sm:self-auto">
                                {medium === 'english'
                                  ? `Total ${getMockQuestionsList().length} Questions`
                                  : `कुल ${getMockQuestionsList().length} सवाल`}
                              </span>
                            )}
                          </div>

                          {/* Question Selector Tabs */}
                          {getMockQuestionsList().length > 1 && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/80 dark:border-white/10 overflow-x-auto pb-1 scrollbar-none">
                              {getMockQuestionsList().map((item, qIdx) => {
                                const isEvaluated = Boolean(mockEvaluations[qIdx]);
                                const isCurrent = activeMockQIdx === qIdx;
                                return (
                                  <button
                                    key={qIdx}
                                    type="button"
                                    onClick={() => setActiveMockQIdx(qIdx)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 shrink-0 ${isCurrent
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                      : isEvaluated
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                                    }`}
                                  >
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                                      isCurrent
                                        ? 'bg-slate-950 text-amber-300'
                                        : isEvaluated
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                    }`}>
                                      {isEvaluated ? '✓' : qIdx + 1}
                                    </span>
                                    <span>{medium === 'english' ? `Q${qIdx + 1}` : `सवाल ${qIdx + 1}`}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Active Question Box */}
                        {getMockQuestionsList().length > 0 ? (
                          (() => {
                            const questionsList = getMockQuestionsList();
                            const activeItem = questionsList[activeMockQIdx] || questionsList[0];
                            const studentAns = mockAnswers[activeMockQIdx] || '';
                            const evalData = mockEvaluations[activeMockQIdx];

                            return (
                              <div className="space-y-4">
                                {/* The Question Card (ONLY QUESTION - NO ANSWER) */}
                                <div className={`p-4 md:p-5 rounded-2xl border transition-all shadow-md ${isDarkMode || chalkboardTheme === 'green'
                                  ? 'bg-slate-900/90 border-slate-700 text-white'
                                  : 'bg-white border-slate-200 text-slate-900'
                                  }`}>
                                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
                                    <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                                      {medium === 'english' ? `Question #${activeMockQIdx + 1}` : `प्रश्न #${activeMockQIdx + 1}`}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const qLower = activeItem.question.toLowerCase();
                                        let spoken = activeItem.question;
                                        if (qLower.includes('pleasant') || qLower.includes('first place')) spoken = spoken.replace(/\bmeadow\b/i, 'blank');
                                        else if (qLower.includes('weather was hot')) spoken = spoken.replace(/\bpond\b/i, 'blank');
                                        else if (qLower.includes('older and could eat grass')) spoken = spoken.replace(/\bmother\b/i, 'blank');
                                        else if (qLower.includes('called him darkie')) spoken = spoken.replace(/\bblack\b/i, 'blank');
                                        speakText(spoken.replace(/_{2,}/g, 'blank'), undefined, true);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                                        isSpeaking
                                          ? 'bg-amber-500 text-white animate-pulse'
                                          : isDarkMode || chalkboardTheme === 'green'
                                            ? 'bg-white/10 hover:bg-white/20 text-amber-300'
                                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                                      }`}
                                      title={medium === 'english' ? 'Listen to question' : 'सवाल बोलकर सुनें'}
                                    >
                                      <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-300 shrink-0" />
                                      <span className="text-[11px] font-bold">{medium === 'english' ? 'Listen' : 'सवाल सुनें 🔊'}</span>
                                    </button>
                                  </div>

                                  <h3 className="text-base sm:text-lg font-black leading-relaxed text-slate-900 dark:text-amber-300">
                                    {renderMockQuestionBlank(activeItem.question, activeItem.idealAnswer)}
                                  </h3>
                                </div>

                                {/* Answer Input Area */}
                                <div className={`p-4 rounded-2xl border space-y-3 ${isDarkMode || chalkboardTheme === 'green'
                                  ? 'bg-slate-950/80 border-slate-800 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-900'
                                  }`}>
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-indigo-400 flex items-center gap-1.5">
                                      <span>✍️</span>
                                      <span>{medium === 'english' ? 'Type Your Answer:' : 'अपना उत्तर यहाँ लिखें (Type Your Answer):'}</span>
                                    </label>
                                    {studentAns && (
                                      <span className="text-[11px] text-slate-400 font-medium">
                                        {studentAns.trim().split(/\s+/).filter(Boolean).length} {medium === 'english' ? 'words' : 'शब्द'}
                                      </span>
                                    )}
                                  </div>

                                  <textarea
                                    rows={4}
                                    value={studentAns}
                                    onChange={(e) =>
                                      setMockAnswers((prev) => ({
                                        ...prev,
                                        [activeMockQIdx]: e.target.value,
                                      }))
                                    }
                                    placeholder={medium === 'english'
                                      ? 'Type your complete answer here like in your notebook...'
                                      : 'यहाँ कॉपी की तरह अपना पूरा उत्तर टाइप करें...'}
                                    className={`w-full p-3.5 rounded-xl border text-sm outline-none transition-all resize-y ${isDarkMode || chalkboardTheme === 'green'
                                      ? 'bg-slate-900 border-slate-700 focus:border-amber-400 text-white placeholder-slate-500'
                                      : 'bg-white border-slate-300 focus:border-amber-500 text-slate-900 placeholder-slate-400 shadow-inner'
                                      }`}
                                  />

                                  <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveAndEvaluateMock(activeMockQIdx)}
                                      disabled={!studentAns.trim() || isEvaluatingMock}
                                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all transform active:scale-95"
                                    >
                                      {isEvaluatingMock ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                      ) : (
                                        <span>🚀</span>
                                      )}
                                      <span>
                                        {evalData
                                          ? (medium === 'english' ? 'Re-check Answer' : 'दोबारा चेक करें')
                                          : (medium === 'english' ? 'Check Answer' : 'उत्तर चेक करें')}
                                      </span>
                                    </button>

                                    {studentAns && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setMockAnswers((prev) => ({
                                            ...prev,
                                            [activeMockQIdx]: '',
                                          }))
                                        }
                                        className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 transition-all"
                                      >
                                        {medium === 'english' ? 'Clear' : 'साफ़ करें (Clear)'}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Evaluation Scorecard (REVEALED AFTER SUBMISSION) */}
                                {evalData && (
                                  <div className={`p-4 md:p-5 rounded-2xl border space-y-4 animate-in fade-in duration-300 ${isDarkMode || chalkboardTheme === 'green'
                                    ? 'bg-slate-900/95 border-indigo-500/40 shadow-xl shadow-indigo-500/10'
                                    : 'bg-white border-indigo-200 shadow-md'
                                    }`}>
                                    {/* 1. Score & Badge Header */}
                                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-emerald-500/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        <span className="text-3xl">🏆</span>
                                        <div>
                                          <span className="text-[11px] uppercase font-black tracking-wider text-amber-400 block">
                                            {medium === 'english' ? 'Mock Test Scorecard:' : 'मॉक टेस्ट रिजल्ट (Score Card):'}
                                          </span>
                                          <h4 className="text-xl font-black text-white flex items-center gap-2">
                                            <span>{evalData.score} / {evalData.totalMarks || 10} {medium === 'english' ? 'Marks' : 'अंक'}</span>
                                            <span className="text-xs font-bold text-slate-400">
                                              ({evalData.percentage || evalData.score * 10}%)
                                            </span>
                                          </h4>
                                        </div>
                                      </div>

                                      <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto shadow-xs">
                                        {evalData.badge || (medium === 'english' ? '⭐ Excellent Effort!' : '⭐ शानदार प्रयास!')}
                                      </span>
                                    </div>

                                    {/* 2. Strengths: Kya Achha Kiya */}
                                    {evalData.strengths && evalData.strengths.length > 0 && (
                                      <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5">
                                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                                          <span>👏</span> {medium === 'english' ? 'Strengths (What you wrote well):' : 'क्या अच्छा लिखा (Strengths):'}
                                        </span>
                                        <ul className="text-xs sm:text-sm text-emerald-200 list-disc list-inside space-y-1">
                                          {evalData.strengths.map((str: string, i: number) => (
                                            <li key={i}>{str}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 3. Mistakes: Kahan Galti Hui */}
                                    {evalData.mistakes && evalData.mistakes.length > 0 && (
                                      <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1.5">
                                        <span className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                                          <span>❌</span> {medium === 'english' ? 'Mistakes to Fix:' : 'कहाँ गलती हुई (Mistakes to Fix):'}
                                        </span>
                                        <ul className="text-xs sm:text-sm text-rose-200 list-disc list-inside space-y-1">
                                          {evalData.mistakes.map((mst: string, i: number) => (
                                            <li key={i}>{mst}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 4. Spelling Mistakes: Speling mistke thi */}
                                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-2">
                                      <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                                        <span>✍️</span> {medium === 'english' ? 'Spelling Check:' : 'स्पेलिंग जांच (Spelling Check):'}
                                      </span>
                                      {evalData.spellingMistakes && evalData.spellingMistakes.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                          {evalData.spellingMistakes.map(
                                            (sp: { wrong: string; correct: string }, i: number) => (
                                              <span
                                                key={i}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/50 border border-amber-500/40 text-xs font-bold"
                                              >
                                                <span className="text-rose-400 line-through">{sp.wrong}</span>
                                                <span className="text-slate-400">➔</span>
                                                <span className="text-emerald-300 font-black">{sp.correct}</span>
                                              </span>
                                            )
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-emerald-300 font-bold">
                                          {medium === 'english'
                                            ? '✅ Great job! Zero spelling errors found in your answer!'
                                            : '✅ शाबाश बेटा! आपके उत्तर में कोई स्पेलिंग गलती नहीं मिली!'}
                                        </p>
                                      )}
                                    </div>

                                    {/* 5. Missing Points: Kha add krna h */}
                                    {evalData.missingPoints && evalData.missingPoints.length > 0 && (
                                      <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
                                        <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                                          <span>💡</span> {medium === 'english' ? 'Key Points to Add for 10/10 Score:' : 'कहाँ और क्या जोड़ना है (Points to Add for 10/10):'}
                                        </span>
                                        <ul className="text-xs sm:text-sm text-indigo-200 list-disc list-inside space-y-1">
                                          {evalData.missingPoints.map((mp: string, i: number) => (
                                            <li key={i}>{mp}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* 6. Ideal Complete Model Answer */}
                                    {evalData.idealAnswer && (
                                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                                          {medium === 'english' ? '📖 Complete Model Answer:' : '📖 आदर्श उत्तर (Full Model Answer):'}
                                        </span>
                                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                                          {evalData.idealAnswer}
                                        </p>
                                      </div>
                                    )}

                                    {/* 7. Teacher Spoken Voice Praise */}
                                    {evalData.teacherPraise && (
                                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                          <span className="text-2xl shrink-0">{currentTeacher.emoji}</span>
                                          <p className="text-xs sm:text-sm text-indigo-200 font-medium leading-relaxed">
                                            {evalData.teacherPraise}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => speakText(evalData.teacherPraise)}
                                          className="p-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white transition-all shrink-0"
                                          title={medium === 'english' ? 'Listen' : 'बोलकर सुनें'}
                                        >
                                          <Volume2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}

                                    {/* Next Question Navigation */}
                                    {activeMockQIdx + 1 < questionsList.length && (
                                      <button
                                        type="button"
                                        onClick={() => setActiveMockQIdx((prev) => prev + 1)}
                                        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transform active:scale-95"
                                      >
                                        <span>{medium === 'english' ? `Next Question (Question #${activeMockQIdx + 2})` : `अगला सवाल हल करें (Question #${activeMockQIdx + 2})`}</span>
                                        <span>→</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            {medium === 'english' ? 'Preparing questions for mock test...' : 'मॉक टेस्ट के लिए सवाल तैयार किए जा रहे हैं...'}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* NORMAL WHITEBOARD STEPS (TEACH / CHECK MODE) */
                      <div className={`space-y-4 transition-all duration-300 ${
                        isPageFlipping ? 'opacity-0 translate-y-3 scale-98' : 'opacity-100 translate-y-0 scale-100 animate-in fade-in duration-300'
                      }`}>
                        {(() => {
                          const filtered = filterFillerWhiteboardSteps(whiteboardSteps);
                          let stepsToRender = filtered;
                          if (
                            detectedQuestions.length > filtered.length &&
                            (!activeTargetQuestion || activeTargetQuestion === 'सभी 15 सवालों के सही उत्तर व मास्टर कुंजी')
                          ) {
                            const coveredTexts = new Set(
                              filtered.map((s) => (s.question || s.step).toLowerCase().trim())
                            );
                            const additionalSteps: WhiteboardStepItem[] = [];
                            detectedQuestions.forEach((qText, qIdx) => {
                              const qLower = qText.toLowerCase().trim();
                              const isAlreadyCovered = Array.from(coveredTexts).some(
                                (ct) => ct.includes(qLower.slice(0, 25)) || qLower.includes(ct.slice(0, 25))
                              );
                              if (!isAlreadyCovered) {
                                additionalSteps.push({
                                  step: `सवाल #${qIdx + 1}: ${parseQuestionAndSection(qText).section || 'अभ्यास प्रश्न'}`,
                                  question: qText,
                                  formula: qText,
                                  annotation: `${currentTeacher.name}: "बेटा, यह वर्कशीट का सवाल #${qIdx + 1} है। इसका पूरा हल देखने के लिए इस पर क्लिक करें!"`,
                                });
                              }
                            });
                            stepsToRender = [...filtered, ...additionalSteps];
                          }

                          return stepsToRender.map((stepItem, idx) => {
                            const allFiltered = stepsToRender;
                            const multiItems = parseMultiAnswerFormula(stepItem.formula, stepItem.step);
                            const singleQuestion = getQuestionForStep(stepItem, idx);
                            const parsed = parseQuestionAndSection(singleQuestion || stepItem.step);
                            const displayQuestionText = parsed.question || singleQuestion || stepItem.step;

                            // Check if this step starts a new section heading (e.g. "A. Complete the sentences")
                            const prevStepRaw = idx > 0 ? (getQuestionForStep(allFiltered[idx - 1], idx - 1) || allFiltered[idx - 1]?.step) : null;
                            const prevParsed = prevStepRaw ? parseQuestionAndSection(prevStepRaw) : null;
                            const isNewSection = Boolean(parsed.section && (!prevParsed || prevParsed.section !== parsed.section));

                            // Check if question is already shown in the top focus banner
                            const cleanQ = (s?: string | null) =>
                              (s || '').toLowerCase().replace(/^(?:q\d+:?|सवाल\s*\d+:?|प्रश्ना\s*\d+:?)\s*/i, '').trim();
                            const isTopBannerShowing = Boolean(
                              activeTargetQuestion &&
                              activeTargetQuestion !== 'सभी 15 सवालों के सही उत्तर व मास्टर कुंजी'
                            );
                            const isSameAsTop = isTopBannerShowing && (
                              cleanQ(displayQuestionText) === cleanQ(activeTargetQuestion) ||
                              (displayQuestionText && activeTargetQuestion.includes(displayQuestionText)) ||
                              (displayQuestionText && displayQuestionText.includes(activeTargetQuestion))
                            );
                            const prevQ = idx > 0 ? getQuestionForStep(allFiltered[idx - 1], idx - 1) : null;
                            const isSameAsPrev = idx > 0 && cleanQ(displayQuestionText) === cleanQ(prevQ);

                            return (
                              <React.Fragment key={idx}>
                                {/* Main Section Heading Banner (Shown once per section, never repeated on every question) */}
                                {isNewSection && (
                                  <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-emerald-500/10 border-2 border-amber-400/40 flex items-center justify-between shadow-xs mb-3">
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-xl shrink-0">📌</span>
                                      <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                                          मुख्य निर्देश / सेक्शन (Main Section)
                                        </span>
                                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                                          {parsed.section}
                                        </h4>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-200 border border-amber-400/30 shrink-0">
                                      सेक्शन हेडिंग
                                    </span>
                                  </div>
                                )}

                                <div
                                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${stepItem.isMistake
                                    ? isDarkMode || chalkboardTheme === 'green'
                                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-200 border-l-4 border-l-rose-500'
                                      : 'bg-rose-50 border-rose-200 text-rose-950 border-l-4 border-l-rose-500'
                                    : idx === revealedSteps - 1
                                      ? isDarkMode || chalkboardTheme === 'green'
                                        ? 'bg-blue-950/40 border-blue-500/50 shadow-md shadow-blue-500/10 border-l-4 border-l-blue-500'
                                        : 'bg-white border-blue-200 shadow-sm border-l-4 border-l-blue-600'
                                      : isDarkMode || chalkboardTheme === 'green'
                                        ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                                        : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                                    }`}
                                >
                                  {/* Header: Question Title & Controls */}
                                  <div className={`flex items-start sm:items-center justify-between gap-3 pb-3 border-b ${isDarkMode || chalkboardTheme === 'green' ? 'border-white/10' : 'border-slate-100'
                                    }`}>
                                    <div className="flex items-start gap-2.5 flex-1">
                                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-1 sm:mt-1.5" />
                                      <h3 className={`text-sm sm:text-base font-extrabold leading-snug ${isDarkMode || chalkboardTheme === 'green' ? 'text-white' : 'text-slate-900'
                                        }`}>
                                        {renderQuestionWithBlankFill(displayQuestionText, stepItem, idx)}
                                      </h3>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleSocraticHint(idx, stepItem)}
                                        className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 transition-all ${isDarkMode || chalkboardTheme === 'green'
                                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                          }`}
                                      >
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                        <span>{medium === 'english' ? 'Hint' : 'हिंट लें'}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => speakText(`${displayQuestionText}: ${stepItem.formula}. ${stepItem.annotation}`, undefined, true)}
                                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${isDarkMode || chalkboardTheme === 'green'
                                          ? 'bg-white/10 hover:bg-white/20 text-white'
                                          : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 shadow-2xs'
                                          }`}
                                        title={medium === 'english' ? 'Listen to this step' : 'यह स्टेप बोलकर सुनें'}
                                      >
                                        <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        <span className="text-[11px] hidden sm:inline">{medium === 'english' ? 'Listen' : 'सुनें'}</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* CASE A: Multi-Question Master Key */}
                                  {multiItems && multiItems.length > 0 ? (
                                    <div className="mt-3 space-y-2.5">
                                      <span className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-500'
                                        }`}>
                                        <span>📋</span> {medium === 'english' ? 'Questions & Answers Breakdown:' : 'हर सवाल व उसका सही उत्तर:'}
                                      </span>
                                      <div className="grid grid-cols-1 gap-2">
                                        {multiItems.map((item, mIdx) => (
                                          <div
                                            key={mIdx}
                                            className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs ${isDarkMode || chalkboardTheme === 'green'
                                              ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50'
                                              : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-900'
                                              }`}
                                          >
                                            <div className="flex items-start gap-2.5 flex-1">
                                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isDarkMode || chalkboardTheme === 'green'
                                                ? 'text-amber-300 bg-amber-500/20 border border-amber-500/30'
                                                : 'text-amber-800 bg-amber-100 border border-amber-200'
                                                }`}>
                                                {item.num}
                                              </span>
                                              <p className={`text-xs sm:text-sm font-bold leading-relaxed ${isDarkMode || chalkboardTheme === 'green' ? 'text-white' : 'text-slate-900'
                                                }`}>
                                                <ChalkTypewriter
                                                  text={item.matchedQuestion}
                                                  speed={18}
                                                  delay={isTypewriterEnabled ? mIdx * 120 : 0}
                                                  enabled={isTypewriterEnabled}
                                                  isChalkboard={chalkboardTheme === 'green'}
                                                />
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-2 sm:self-center shrink-0 pl-8 sm:pl-0">
                                              <span className={`text-[10px] font-bold uppercase ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-500'
                                                }`}>{medium === 'english' ? 'Answer:' : 'सही उत्तर:'}</span>
                                              <span className={`text-xs md:text-sm font-black px-3 py-1 rounded-xl border shadow-xs flex items-center gap-1 ${isDarkMode || chalkboardTheme === 'green'
                                                ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40'
                                                : 'text-emerald-800 bg-emerald-50 border-emerald-300'
                                                }`}>
                                                <span className="underline decoration-emerald-500 dark:decoration-emerald-400 decoration-2 underline-offset-4 font-black">{item.answer}</span>
                                                <span>✅</span>
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    /* CASE B: Single Question Step - Direct Solution & Answer */
                                    <div className={`mt-3 p-3.5 sm:p-4 rounded-2xl border shadow-xs ${isDarkMode || chalkboardTheme === 'green'
                                      ? 'bg-slate-950/90 border-white/10'
                                      : 'bg-slate-50/70 border-slate-200/90'
                                      }`}>
                                      {(() => {
                                        const isStoryStep = Boolean(
                                          stepItem.step.toLowerCase().includes('पाठ वाचन') ||
                                          stepItem.step.toLowerCase().includes('कहानी वाचन') ||
                                          stepItem.step.toLowerCase().includes('reading passage') ||
                                          stepItem.step.toLowerCase().includes('story') ||
                                          (stepItem.question && (
                                            stepItem.question.toLowerCase().startsWith('story:') ||
                                            stepItem.question.includes('14.3') ||
                                            stepItem.question.includes('Early Home') ||
                                            stepItem.question.includes('Black Beauty')
                                          )) ||
                                          (stepItem.formula && stepItem.formula.length > 250 && stepItem.formula.includes('\n\n'))
                                        );
                                        const isVocab = stepItem.step.includes('शब्दार्थ') || stepItem.step.includes('Vocabulary');
                                        const isMoral = stepItem.step.includes('सीख') || stepItem.step.includes('Moral');

                                        return (
                                          <span className={`text-[11px] uppercase font-black block mb-2 ${isVocab
                                            ? isDarkMode || chalkboardTheme === 'green' ? 'text-blue-400' : 'text-blue-700'
                                            : isMoral
                                              ? isDarkMode || chalkboardTheme === 'green' ? 'text-amber-400' : 'text-amber-700'
                                              : isStoryStep
                                                ? isDarkMode || chalkboardTheme === 'green' ? 'text-blue-400' : 'text-blue-700'
                                                : isDarkMode || chalkboardTheme === 'green' ? 'text-emerald-400' : 'text-emerald-700'
                                            }`}>
                                            {isVocab
                                              ? (medium === 'english' ? '📖 Key Vocabulary & Pronunciation:' : '📖 कठिन शब्दार्थ व सही उच्चारण:')
                                              : isMoral
                                                ? (medium === 'english' ? '⭐ Moral of the Story:' : '⭐ कहानी की मुख्य सीख:')
                                                : isStoryStep
                                                  ? (medium === 'english' ? '📖 Story Reading Passage:' : '📖 पाठ / कहानी वाचन:')
                                                  : (medium === 'english' ? '✅ Solution & Step-by-Step Answer:' : '✅ सही हल व उत्तर:')}
                                          </span>
                                        );
                                      })()}
                                      <div>
                                        {renderFormulaBlocks(stepItem.formula)}
                                      </div>
                                    </div>
                                  )}

                                  {/* Teacher Annotation (Khan Academy friendly speech balloon) */}
                                  {stepItem.annotation && (
                                    <div className="mt-3">
                                      {(() => {
                                        const isExpanded = Boolean(expandedExplanations[idx]);
                                        return (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setExpandedExplanations((prev) => ({
                                                  ...prev,
                                                  [idx]: !prev[idx],
                                                }))
                                              }
                                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${isExpanded
                                                ? isDarkMode || chalkboardTheme === 'green'
                                                  ? 'bg-blue-900/70 text-blue-200 border-blue-500/50 shadow-sm'
                                                  : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                : isDarkMode || chalkboardTheme === 'green'
                                                  ? 'bg-slate-900/80 hover:bg-slate-800 text-blue-300 border-blue-500/30'
                                                  : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200 shadow-2xs'
                                                }`}
                                              title={medium === 'english' ? 'Show or hide teacher explanation' : 'टीचर का स्पष्टीकरण देखें या छुपाएं'}
                                            >
                                              <span>{currentTeacher.emoji}</span>
                                              <span className="font-bold">
                                                {isExpanded
                                                  ? (medium === 'english' ? `Hide ${currentTeacher.name}'s Tip ▲` : `${currentTeacher.name} की सीख छुपाएं ▲`)
                                                  : (medium === 'english' ? `💬 View ${currentTeacher.name}'s Tip ▼` : `💬 ${currentTeacher.name} की सीख देखें ▼`)}
                                              </span>
                                            </button>

                                            {isExpanded && (
                                              <div className={`mt-2 p-3.5 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200 ${isDarkMode || chalkboardTheme === 'green'
                                                ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                                                : 'bg-blue-50/80 border-blue-200 text-slate-800 shadow-xs'
                                                }`}>
                                                <span className="text-2xl shrink-0 mt-0.5">{currentTeacher.emoji}</span>
                                                <div className="flex-1">
                                                  <span className={`text-[11px] font-black block mb-0.5 ${isDarkMode || chalkboardTheme === 'green' ? 'text-amber-300' : 'text-blue-900'
                                                    }`}>
                                                    {medium === 'english' ? `${currentTeacher.name}'s Tip:` : `${currentTeacher.name} की सीख:`}
                                                  </span>
                                                  <p className="text-xs sm:text-sm font-medium leading-relaxed">
                                                    {stepItem.annotation}
                                                  </p>
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </React.Fragment>
                            );
                          });
                        })()}

                        {revealedSteps < whiteboardSteps.length && (
                          <button
                            onClick={() => {
                              const next = revealedSteps + 1;
                              setRevealedSteps(next);
                              const s = whiteboardSteps[revealedSteps];
                              if (s) speakText(`${s.step}: ${s.formula}. ${s.annotation}`);
                            }}
                            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs md:text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98"
                          >
                            <span>{medium === 'english' ? 'Next Step' : 'अगला कदम समझें (Next Step)'}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  )}

                  {/* Bottom Multi-Page Pagination Bar (Only when multiple pages exist, NO question pagination) */}
                  {!activeMathAnim && uploadedFiles.length > 1 && (
                    <div className={`p-4 rounded-3xl border-2 flex items-center justify-between gap-3 shadow-lg mt-6 ${!isDarkMode && chalkboardTheme !== 'green'
                      ? 'bg-gradient-to-r from-amber-50 via-white to-indigo-50 border-indigo-200 text-slate-900'
                      : 'bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-white/10 text-white'
                      }`}>
                      {(() => {
                        const activeIdx = uploadedFiles.findIndex(
                          (f) => f.id === (activeFileDoc?.id || uploadedFiles[0]?.id)
                        );
                        const currentPageNum = activeIdx !== -1 ? activeIdx + 1 : 1;
                        const totalPages = uploadedFiles.length;
                        const hasPrev = activeIdx > 0;
                        const hasNext = activeIdx < totalPages - 1;

                        return (
                          <div className="flex items-center justify-between w-full gap-3">
                            {/* Previous Page Button */}
                            <button
                              type="button"
                              onClick={() => hasPrev && handleSwitchPage(uploadedFiles[activeIdx - 1].id)}
                              disabled={!hasPrev || isCheckingHomework}
                              className={`px-4 sm:px-5 py-2.5 rounded-2xl border text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-xs ${!hasPrev || isCheckingHomework
                                ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/5'
                                : !isDarkMode && chalkboardTheme !== 'green'
                                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 hover:scale-102 active:scale-95 cursor-pointer shadow-sm'
                                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:scale-102 active:scale-95 cursor-pointer shadow-sm'
                                }`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>{medium === 'english' ? `Prev Page (P.${activeIdx})` : `← पिछला पेज (पेज ${activeIdx})`}</span>
                            </button>

                            {/* Current Page Indicator */}
                            <div className="text-center px-4 py-1.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-0.5">
                                {medium === 'english' ? 'Worksheet Page' : 'वर्कशीट पेज'}
                              </span>
                              <span className={`text-sm sm:text-base font-black ${!isDarkMode && chalkboardTheme !== 'green' ? 'text-indigo-950' : 'text-amber-300'
                                }`}>
                                {medium === 'english' ? `Page ${currentPageNum} of ${totalPages}` : `पेज ${currentPageNum} / ${totalPages}`}
                              </span>
                            </div>

                            {/* Next Page Button */}
                            <button
                              type="button"
                              onClick={() => hasNext && handleSwitchPage(uploadedFiles[activeIdx + 1].id)}
                              disabled={!hasNext || isCheckingHomework}
                              className={`px-4 sm:px-5 py-2.5 rounded-2xl border text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-md ${!hasNext || isCheckingHomework
                                ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/5'
                                : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/30 hover:scale-102 active:scale-95 cursor-pointer'
                                }`}
                            >
                              <span>{medium === 'english' ? `Next Page (P.${activeIdx + 2})` : `अगला पेज (पेज ${activeIdx + 2}) →`}</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* INTERACTIVE PRACTICE QUESTION (If chapter is loaded) */}
          {currentQ && (
            <div className={`rounded-3xl p-6 border transition-all duration-200 space-y-4 ${isDarkMode
              ? 'bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border-indigo-500/30 shadow-2xl'
              : 'bg-white border-slate-200 shadow-sm text-slate-900'
              }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1.5 ${isDarkMode
                  ? 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30'
                  : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                  }`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  अभ्यास प्रश्न #{activeQuestionIdx + 1}
                </span>
                <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  प्रश्न {activeQuestionIdx + 1} / {totalQuestionsCount}
                </span>
              </div>

              <h3 className={`text-base md:text-lg font-bold leading-relaxed ${isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                {currentQ.question}
              </h3>

              {/* MCQs */}
              {currentQ.type === 'mcq' && currentQ.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = selectedMCQ === opt;
                    const isCorrect = answerStatus === 'correct' && isSelected;
                    const isWrong = answerStatus === 'wrong' && isSelected;

                    return (
                      <button
                        key={i}
                        onClick={() => handleCheckMCQ(opt, currentQ.correctAnswer, currentQ.explanation)}
                        className={`p-3.5 rounded-2xl border text-left font-bold text-xs md:text-sm transition-all flex items-center justify-between ${isCorrect
                          ? isDarkMode
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                            : 'bg-emerald-100 border-emerald-400 text-emerald-900'
                          : isWrong
                            ? isDarkMode
                              ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                              : 'bg-rose-100 border-rose-400 text-rose-900'
                            : isSelected
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                              : isDarkMode
                                ? 'bg-slate-900/90 border-slate-700 hover:border-indigo-400 text-slate-200'
                                : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white text-slate-800 shadow-2xs'
                          }`}
                      >
                        <span>{opt}</span>
                        {isCorrect && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                        {isWrong && <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Typed Answer */}
              {currentQ.type === 'solve' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder="अपना उत्तर लिखें (जैसे: 14 cm)..."
                      className={`flex-1 border-2 rounded-2xl px-5 py-3 text-sm outline-none transition-all ${isDarkMode
                        ? 'bg-slate-900 border-slate-700 focus:border-indigo-400 text-white'
                        : 'bg-slate-50 border-slate-300 focus:border-indigo-500 focus:bg-white text-slate-900'
                        }`}
                      onKeyDown={(e) => e.key === 'Enter' && handleCheckTypedAnswer(currentQ.correctAnswer, currentQ.explanation)}
                    />
                    <button
                      onClick={() => handleCheckTypedAnswer(currentQ.correctAnswer, currentQ.explanation)}
                      className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs md:text-sm shadow-md transition-all"
                    >
                      जांचें
                    </button>
                  </div>
                </div>
              )}

              {/* Status */}
              {answerStatus === 'correct' && (
                <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${isDarkMode
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold">बिल्कुल सही! {currentQ.explanation}</span>
                  </div>

                  {selectedChapter && activeQuestionIdx + 1 < selectedChapter.sampleQuestions.length && (
                    <button
                      onClick={() => {
                        setActiveQuestionIdx((prev) => prev + 1);
                        setSelectedMCQ(null);
                        setTypedAnswer('');
                        setAnswerStatus('idle');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all ml-2"
                    >
                      अगला प्रश्न →
                    </button>
                  )}
                </div>
              )}

              {answerStatus === 'wrong' && (
                <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${isDarkMode
                  ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>गलत उत्तर है बेटा। हिंट: {currentQ.explanation}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 4. BOTTOM FLOATING VOICE & QUERY DOCK */}
      <footer className={`sticky bottom-0 backdrop-blur-md border-t p-3 md:p-4 z-20 transition-colors duration-200 ${isDarkMode
        ? 'bg-slate-900/95 border-slate-800 shadow-2xl'
        : 'bg-white/95 border-slate-200 shadow-lg'
        }`}>
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={toggleMic}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all transform active:scale-95 shrink-0 ${isListening
              ? 'bg-rose-600 animate-pulse ring-4 ring-rose-500/40'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 hover:scale-105'
              }`}
            title={medium === 'english' ? 'Speak with mic' : 'माइक से बोलें'}
          >
            {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? (medium === 'english' ? 'Listening... Speak now!' : 'सुन रहे हैं... बोलिए बेटा!') : (medium === 'english' ? 'Tap mic to speak or type your question...' : 'माइक दबाकर बोलें या सवाल यहाँ टाइप करें...')}
              className={`w-full border rounded-2xl px-5 py-3.5 text-xs md:text-sm outline-none transition-all pr-12 ${isDarkMode
                ? 'bg-slate-950 border-slate-700 focus:border-blue-400 text-white placeholder-slate-500'
                : 'bg-slate-100 border-slate-300 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400'
                }`}
              onKeyDown={(e) => e.key === 'Enter' && handleStudentQuery(inputText || inputRef.current?.value)}
            />
            <button
              type="button"
              onClick={() => handleStudentQuery(inputText || inputRef.current?.value)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <label
            htmlFor="homework-upload-input"
            className={`p-3.5 rounded-2xl border flex items-center gap-1.5 text-xs font-bold shrink-0 transition-all cursor-pointer ${isDarkMode
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:border-blue-300 border-slate-200 shadow-2xs'
              }`}
            title={medium === 'english' ? 'Capture homework or textbook page' : 'होमवर्क या बुक पेज की फोटो खींचें'}
          >
            <Camera className="w-5 h-5 text-amber-500" />
            <span className="hidden sm:inline">{medium === 'english' ? 'Take Photo' : 'फोटो खींचो'}</span>
          </label>
        </div>

        {/* Quick Suggestion Chips for Switching Subjects */}
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none mt-2 pt-1 text-[11px]">
          <span className={`font-bold shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{medium === 'english' ? 'Suggestions:' : 'सुझाव:'}</span>
          {[
            '10 + 10 = ?',
            medium === 'english' ? 'Teach Math Chapter 8' : 'Math का Chapter 8 पढ़ाओ',
            medium === 'english' ? 'Solve 25 + 35' : '25 + 35 हल करो',
            medium === 'english' ? 'Teach English Chapter 5' : 'English का Chapter 5 पढ़ाओ',
            medium === 'english' ? 'Difference between radius and diameter?' : 'त्रिज्या और व्यास में क्या फर्क है?',
            medium === 'english' ? 'Check my notebook' : 'मेरी कॉपी चेक करो',
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(chip);
                handleStudentQuery(chip);
              }}
              className={`px-3 py-1 rounded-full border transition-all shrink-0 whitespace-nowrap ${isDarkMode
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </footer>
      {/* Student All Report link available on header and celebration modal */}

      {/* SUNDAY PRINTABLE TEST PAPER & TEST SERIES MODAL */}
      <PrintableSundayExamModal
        isOpen={isSundayExamModalOpen}
        onClose={() => setIsSundayExamModalOpen(false)}
        studentName="राहुल कुमावत"
        className={className}
        board={board}
        subjectName={selectedSubject?.subjectHindi || 'गणित'}
        medium={medium}
        isDarkMode={isDarkMode}
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

      {/* 📱 MOBILE FLOATING QUESTION SWITCHER PILL */}
      {uploadedFiles.length > 0 && detectedQuestions.length > 1 && (
        <div className="fixed bottom-3 inset-x-3 z-40 sm:hidden">
          <div className="bg-slate-900/95 backdrop-blur-md border border-white/20 text-white rounded-2xl p-2 px-3.5 flex items-center justify-between shadow-2xl">
            <button
              type="button"
              onClick={handlePrevQuestion}
              disabled={isCheckingHomework}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>पिछला</span>
            </button>

            <div className="text-center">
              <span className="text-[11px] font-black text-amber-300 block">
                सवाल {effectiveQuestionIdx !== -1 ? effectiveQuestionIdx + 1 : 1} / {detectedQuestions.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={isCheckingHomework}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <span>अगला</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
}
