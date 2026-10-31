'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Printer,
  Download,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Camera,
  Upload,
  Mic,
  MicOff,
  Edit3,
  FileText,
  TrendingUp,
  Check,
  AlertCircle,
  Trash2,
  Share2,
  HelpCircle,
  Eye,
  Loader2,
  Volume2,
  VolumeX,
  Plus,
  RefreshCw,
  CheckSquare,
  Square,
  Search,
  List,
  Grid,
  Filter,
  ArrowLeft,
} from 'lucide-react';
import { getCurriculum, Chapter, SubjectCurriculum, fetchDynamicCurriculum } from '@/lib/curriculum-data';

export interface TestResultRecord {
  id: string;
  timestamp: number;
  dateLabel: string;
  studentName: string;
  subjectName: string;
  classGrade: string;
  selectedChapters: Array<{ chapterNumber: number; title: string }>;
  mode: 'typing' | 'upload';
  totalMaxMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  badge: string;
  teacherFeedback: string;
  questionEvaluations: Array<{
    questionId: string;
    question: string;
    type: string;
    studentAnswer: string;
    correctAnswer: string;
    marksAwarded: number;
    maxMarks: number;
    isCorrect: boolean;
    explanation: string;
    teacherNote: string;
  }>;
  uploadedPagesCount?: number;
}

export interface SelectableExamFile {
  id: string;
  name: string;
  url: string;
  sourceType: 'session' | 'history' | 'custom_upload';
  detectedQuestions?: string[];
  chapterTitle?: string;
}

interface SundayTestSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  className?: string;
  board?: 'RBSE' | 'CBSE';
  medium?: 'hindi' | 'english';
  initialSubjectId?: string;
  onTestCompleted?: (result: TestResultRecord) => void;
  isDarkMode?: boolean;
  existingUploadedFiles?: Array<{ id: string; name: string; url: string; type?: string }>;
  pageDataMap?: Record<string, { whiteboardSteps?: any[]; detectedQuestions?: string[]; detectedChapter?: any; heading?: string }>;
  worksheetHistory?: any[];
  isFullPage?: boolean;
}

interface TestQuestion {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  section: 'A' | 'B' | 'C';
  sectionTitle: string;
  type: 'mcq' | 'fill' | 'solve';
  marks: number;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  sourceTag?: string;
}

const STORAGE_KEY = 'vidya_sunday_test_history_v1';

export interface DetectedQuestionItem {
  id: string;
  fileId: string;
  rawText: string;
  cleanText: string;
  type: 'mcq' | 'fill' | 'solve';
  marks: number;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  selected: boolean;
}

// Check if raw text is actually a question rather than a heading or pure instruction
function isValidQuestionText(raw: string): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (trimmed.length < 4) return false;

  // Filter out pure image/WhatsApp/camera file names
  if (/whatsapp|screenshot|img[-_0-9]|image[-_0-9]|\.jpe?g|\.png|\.webp/i.test(trimmed)) return false;

  // Filter out pure chapter titles or book headings without question content
  if (
    /^(chapter|story|अध्याय|पाठ|unit|इकाई|page|पेज|class|कक्षा)\s*#?\d*[:\-–]?\s*[^?]{0,35}$/i.test(trimmed) &&
    !trimmed.includes('?') &&
    !/what|why|how|who|where|when|define|describe|explain|कहाँ|कैसे|क्यों|क्या|किस|ज्ञात|हल/i.test(trimmed)
  ) {
    return false;
  }

  // Filter out pure instruction titles
  if (
    /^(निम्नलिखित प्रश्नों के उत्तर (दीजिए|लिखिए)|answer the following questions?|solve the following|fill in the blanks?|tick the correct option|match the following)\s*[:\.]?$/i.test(
      trimmed
    )
  ) {
    return false;
  }

  return true;
}

function cleanQuestionText(raw: string): string {
  if (!raw) return '';
  let text = raw.trim();
  // Strip file tags like [WhatsApp Image...] or [पेज #1]
  text = text.replace(/\[\s*(?:whatsapp|image|img|screenshot|पेज|page)[^\]]*\]/gi, '').trim();
  // Strip leading question markers: e.g. "Q.1", "Q1:", "प्रश्न 1:", "#1", "1)", "1.", "(1)"
  text = text.replace(/^(?:प्रश्न\s*\d+|q\s*\.?\s*\d+|\#\d+|\(?\d+[\.\)]|\([0-9a-zA-Z]\))\s*[:\-–]?\s*/i, '').trim();
  // Strip redundant heading prefixes e.g. "पेज #1: पेज #1 हल:" or "पेज #1 हल:" or "गणित हल:"
  text = text.replace(/^(?:पेज\s*#?\d*\s*[:\-–]?\s*)?(?:पेज\s*#?\d*\s*हल|गणित\s*हल|शीट\s*हल|वर्कशीट\s*हल)\s*[:\-–]\s*/i, '').trim();
  // Remove wrapping quotes
  text = text.replace(/^["'“](.*)["'”]$/, '$1').trim();
  return text;
}

function classifyQuestion(text: string): {
  type: 'mcq' | 'fill' | 'solve';
  marks: number;
  options?: string[];
  correctAnswer?: string;
} {
  const isTrueFalse = /\b(true\s*\/\s*false|सत्य\s*[\/या]\s*असत्य|सही\s*[\/या]\s*गलत)\b/i.test(text);
  if (isTrueFalse) {
    return {
      type: 'mcq',
      marks: 1,
      options: ['सत्य (True)', 'असत्य (False)'],
      correctAnswer: 'सत्य (True)',
    };
  }

  const optionMatches = text.match(/(?:[a-dक-घA-D][\.\)]|\([a-dक-घA-D]\))\s*[^a-dक-घA-D\(\)]+/g);
  if (optionMatches && optionMatches.length >= 2) {
    const parsedOpts = optionMatches.map((o) => o.replace(/^[a-dक-घA-D\(\)\.\s]+/, '').trim()).filter(Boolean);
    return {
      type: 'mcq',
      marks: 1,
      options: parsedOpts,
      correctAnswer: parsedOpts[0] || 'सही विकल्प',
    };
  }

  const isLong =
    text.length > 70 ||
    /explain|describe|calculate|solve|step|विस्तार|सिद्ध|विधि|कार्यप्रणाली|अंतर स्पष्ट|वर्णन/i.test(text);
  if (isLong) {
    return {
      type: 'solve',
      marks: 5,
      correctAnswer: 'चरणबद्ध विस्तृत हल एवं उत्तर।',
    };
  }

  return {
    type: 'fill',
    marks: 2,
    correctAnswer: 'मुख्य बिंदु एवं संक्षिप्त उत्तर।',
  };
}

// Student-friendly page label cleaner (ensures page names are strictly short labels like "पेज #1", never full questions)
function getStudentFriendlyPageName(rawName?: string, index: number = 0, heading?: string): string {
  if (
    heading &&
    heading.trim().length > 2 &&
    heading.trim().length <= 30 &&
    !/[?¿]/.test(heading) &&
    !/whatsapp|screenshot|img[-_0-9]|image[-_0-9]|choose the|find the|calculate|solve|multiply|divide|answer the|हल:/i.test(heading)
  ) {
    let cleanHeading = heading
      .replace(/^(Story|Chapter|अध्याय|पाठ|पेज\s*#?\d*|शीट\s*#?\d*)\s*(हल)?\s*[:\-–]\s*/i, '')
      .replace(/^पेज\s*#?\d*\s*(हल)?\s*[:\-–]?\s*/i, '')
      .trim();
    if (cleanHeading.length > 0 && cleanHeading.length <= 22) {
      return `पेज #${index + 1}: ${cleanHeading}`;
    }
  }
  if (!rawName) return `पेज #${index + 1}`;
  if (/whatsapp|screenshot|img[-_0-9]|image[-_0-9]|\.jpe?g|\.png|\.webp/i.test(rawName)) {
    return `पेज #${index + 1} (अपलोड कॉपी)`;
  }
  const clean = rawName.replace(/\.[^/.]+$/, '').trim();
  if (clean.length > 22) return `पेज #${index + 1}`;
  return clean;
}

export default function SundayTestSeriesModal({
  isOpen,
  onClose,
  studentName = 'छात्र',
  className = 'Class 4th',
  board = 'RBSE',
  medium = 'hindi',
  initialSubjectId,
  onTestCompleted,
  isDarkMode = false,
  existingUploadedFiles,
  pageDataMap,
  worksheetHistory,
  isFullPage = false,
}: SundayTestSeriesModalProps) {
  // Navigation tabs in modal: 'configure' | 'exam' | 'result' | 'history'
  const [activeTab, setActiveTab] = useState<'configure' | 'exam' | 'result' | 'history'>('configure');

  // Test Source Mode: 'chapters' (Syllabus) | 'uploaded' (Worksheets/Notes) | 'both'
  const [testSourceMode, setTestSourceMode] = useState<'chapters' | 'uploaded' | 'both'>('chapters');

  // Locally uploaded files inside this modal
  const [modalUploadedFiles, setModalUploadedFiles] = useState<SelectableExamFile[]>([]);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Question-level selection and editing per uploaded file
  const [fileQuestionsMap, setFileQuestionsMap] = useState<Record<string, DetectedQuestionItem[]>>({});
  const [isScanningFiles, setIsScanningFiles] = useState<boolean>(false);
  const [newQuestionInputs, setNewQuestionInputs] = useState<Record<string, string>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState<string>('');

  // Enhanced multi-file management states (for 17+ uploaded files)
  const [fileSearchQuery, setFileSearchQuery] = useState<string>('');
  const [fileViewMode, setFileViewMode] = useState<'grid' | 'compact'>('grid');
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    fileName: string;
  } | null>(null);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(5);

  // Combine files from props + localStorage + modal uploads
  const availableExamFiles = useMemo<SelectableExamFile[]>(() => {
    const list: SelectableExamFile[] = [];
    const seen = new Set<string>();

    // 1. Files from current session (props)
    if (existingUploadedFiles && Array.isArray(existingUploadedFiles)) {
      existingUploadedFiles.forEach((f, idx) => {
        if (f.id && !seen.has(f.id)) {
          seen.add(f.id);
          const cached = pageDataMap?.[f.id];
          const friendlyName = getStudentFriendlyPageName(f.name, idx, cached?.heading || cached?.detectedChapter?.title);
          list.push({
            id: f.id,
            name: friendlyName,
            url: f.url,
            sourceType: 'session',
            detectedQuestions: cached?.detectedQuestions || [],
            chapterTitle: cached?.heading || cached?.detectedChapter?.title || friendlyName,
          });
        }
      });
    }

    // 2. Files from modal uploads
    modalUploadedFiles.forEach((f, idx) => {
      if (f.id && !seen.has(f.id)) {
        seen.add(f.id);
        const friendlyName = getStudentFriendlyPageName(f.name, idx);
        list.push({
          ...f,
          name: friendlyName,
        });
      }
    });

    // 3. Fallback: check localStorage for current session files if props were empty
    if (list.length === 0 && typeof window !== 'undefined') {
      try {
        const sessionStr = localStorage.getItem('vidya_current_session');
        if (sessionStr) {
          const s = JSON.parse(sessionStr);
          if (Array.isArray(s.uploadedFiles)) {
            s.uploadedFiles.forEach((f: any, idx: number) => {
              if (f.id && !seen.has(f.id)) {
                seen.add(f.id);
                const cached = s.pageDataMap?.[f.id];
                const friendlyName = getStudentFriendlyPageName(f.name, idx, cached?.heading || cached?.detectedChapter?.title);
                list.push({
                  id: f.id,
                  name: friendlyName,
                  url: f.url,
                  sourceType: 'session',
                  detectedQuestions: cached?.detectedQuestions || [],
                  chapterTitle: cached?.heading || cached?.detectedChapter?.title || friendlyName,
                });
              }
            });
          }
        }
      } catch {}
    }

    // 4. Files from worksheet history (props or localStorage)
    const historyList = worksheetHistory && Array.isArray(worksheetHistory) && worksheetHistory.length > 0
      ? worksheetHistory
      : (() => {
          if (typeof window === 'undefined') return [];
          try {
            const h = localStorage.getItem('vidya_worksheet_history_v1');
            return h ? JSON.parse(h) : [];
          } catch {
            return [];
          }
        })();

    if (Array.isArray(historyList)) {
      historyList.forEach((rec: any) => {
        if (rec && Array.isArray(rec.files)) {
          rec.files.forEach((f: any, fIdx: number) => {
            const key = f.id || `hist_${rec.id}_${fIdx}`;
            if (!seen.has(key)) {
              seen.add(key);
              const friendlyName = getStudentFriendlyPageName(f.name, fIdx, rec.title || rec.subjectName);
              list.push({
                id: key,
                name: friendlyName,
                url: f.url,
                sourceType: 'history',
                detectedQuestions: rec.detectedQuestions || [],
                chapterTitle: rec.title || rec.subjectName || friendlyName,
              });
            }
          });
        }
      });
    }

    return list;
  }, [existingUploadedFiles, pageDataMap, worksheetHistory, modalUploadedFiles]);

  // Synchronize detected questions for available files
  useEffect(() => {
    setFileQuestionsMap((prev) => {
      let changed = false;
      const updated = { ...prev };

      availableExamFiles.forEach((f) => {
        if (!updated[f.id]) {
          const rawList = [
            ...(f.detectedQuestions || []),
            ...(pageDataMap?.[f.id]?.detectedQuestions || []),
          ];

          // Also fall back to whiteboard step questions if detected questions are empty
          if (rawList.length === 0 && pageDataMap?.[f.id]?.whiteboardSteps) {
            pageDataMap[f.id].whiteboardSteps.forEach((st: any) => {
              if (st.question && isValidQuestionText(st.question)) rawList.push(st.question);
              else if (st.step && isValidQuestionText(st.step)) rawList.push(st.step);
            });
          }

          const parsedItems: DetectedQuestionItem[] = [];
          const seenQ = new Set<string>();

          rawList.forEach((rq, qIdx) => {
            if (isValidQuestionText(rq)) {
              const cleaned = cleanQuestionText(rq);
              if (cleaned.length >= 4 && !seenQ.has(cleaned.toLowerCase())) {
                seenQ.add(cleaned.toLowerCase());
                const info = classifyQuestion(cleaned);
                parsedItems.push({
                  id: `${f.id}_q_${qIdx}`,
                  fileId: f.id,
                  rawText: rq,
                  cleanText: cleaned,
                  type: info.type,
                  marks: info.marks,
                  options: info.options,
                  correctAnswer: info.correctAnswer,
                  selected: true,
                });
              }
            }
          });

          updated[f.id] = parsedItems;
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [availableExamFiles, pageDataMap]);

  // Selected file IDs for test generation
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // --- PREVIOUS WORKS (पिछला काम) SYSTEM: e.g. 19 saved works ---
  const historyWorks = useMemo(() => {
    let rawList: any[] = [];
    if (worksheetHistory && Array.isArray(worksheetHistory) && worksheetHistory.length > 0) {
      rawList = worksheetHistory;
    } else if (typeof window !== 'undefined') {
      try {
        const h = localStorage.getItem('vidya_worksheet_history_v1');
        if (h) rawList = JSON.parse(h);
      } catch {}
    }

    if (!Array.isArray(rawList)) return [];

    // Sort chronologically ascending so work #1 is oldest and work #N is latest (e.g. #19)
    const sorted = [...rawList].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    return sorted.map((rec, idx) => {
      const workNumber = idx + 1; // 1 to 19

      const rawQ: string[] = [
        ...(rec.detectedQuestions || []),
      ];
      if (rec.activeQuestion && isValidQuestionText(rec.activeQuestion)) {
        rawQ.push(rec.activeQuestion);
      }
      if (rawQ.length === 0 && Array.isArray(rec.whiteboardSteps)) {
        rec.whiteboardSteps.forEach((st: any) => {
          if (st.question && isValidQuestionText(st.question)) rawQ.push(st.question);
          else if (st.step && isValidQuestionText(st.step)) rawQ.push(st.step);
        });
      }
      if (rawQ.length === 0 && rec.whiteboardHeading && isValidQuestionText(rec.whiteboardHeading)) {
        rawQ.push(rec.whiteboardHeading);
      }

      const seenQ = new Set<string>();
      const parsedQuestions: DetectedQuestionItem[] = [];
      rawQ.forEach((rq, qIdx) => {
        if (isValidQuestionText(rq)) {
          const cleaned = cleanQuestionText(rq);
          if (cleaned.length >= 4 && !seenQ.has(cleaned.toLowerCase())) {
            seenQ.add(cleaned.toLowerCase());
            const info = classifyQuestion(cleaned);
            parsedQuestions.push({
              id: `${rec.id}_q_${qIdx}`,
              fileId: rec.id,
              rawText: rq,
              cleanText: cleaned,
              type: info.type,
              marks: info.marks,
              options: info.options,
              correctAnswer: info.correctAnswer,
              selected: true,
            });
          }
        }
      });

      return {
        ...rec,
        workNumber,
        parsedQuestions,
      };
    });
  }, [worksheetHistory]);

  // Selected History Record IDs (काम #1 to #19)
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  // Sub-view toggle under Uploaded/History source: 'history' (Default if history records exist) | 'pages'
  const [uploadSubTab, setUploadSubTab] = useState<'history' | 'pages'>('history');

  // Auto-select latest history work (#19) by default when available
  useEffect(() => {
    if (historyWorks.length > 0) {
      setSelectedHistoryIds((prev) => {
        if (prev.length > 0) return prev;
        // Default to latest work (e.g. Work #19)
        return [historyWorks[historyWorks.length - 1].id];
      });
    }
  }, [historyWorks]);

  const handleToggleHistoryWork = (id: string) => {
    setSelectedHistoryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectOnlyHistoryWork = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedHistoryIds([id]);
  };

  const handleSelectAllHistoryWorks = () => {
    setSelectedHistoryIds(historyWorks.map((w) => w.id));
  };

  const handleDeselectAllHistoryWorks = () => {
    setSelectedHistoryIds([]);
  };

  // Helper to select specific numbered work, e.g. 18 or 19
  const handleSelectWorkByNumber = (workNum: number) => {
    const found = historyWorks.find((w) => w.workNumber === workNum);
    if (found) setSelectedHistoryIds([found.id]);
  };

  // Helper to select both 18 and 19 together
  const handleSelectWorksBoth = (num1: number, num2: number) => {
    const ids: string[] = [];
    const w1 = historyWorks.find((w) => w.workNumber === num1);
    const w2 = historyWorks.find((w) => w.workNumber === num2);
    if (w1) ids.push(w1.id);
    if (w2) ids.push(w2.id);
    if (ids.length > 0) setSelectedHistoryIds(ids);
  };

  // Helper to select latest N works
  const handleSelectLatestHistoryWorks = (count: number) => {
    if (historyWorks.length === 0) return;
    const latest = historyWorks.slice(-count).map((w) => w.id);
    setSelectedHistoryIds(latest);
  };

  // Automatically select existing files when available - if many files (e.g. 17-18), default to latest 3 to prevent overwhelming
  useEffect(() => {
    if (availableExamFiles.length > 0) {
      setSelectedFileIds((prev) => {
        if (prev.length > 0) return prev;
        if (availableExamFiles.length > 5) {
          return availableExamFiles.slice(-3).map((f) => f.id);
        }
        return availableExamFiles.map((f) => f.id);
      });
    }
  }, [availableExamFiles]);

  const handleToggleFileSelection = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 1-Click: Select ONLY this file and deselect all other 17 files
  const handleSelectOnlyFile = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedFileIds([id]);
  };

  const handleSelectAllFiles = () => {
    setSelectedFileIds(availableExamFiles.map((f) => f.id));
  };

  const handleDeselectAllFiles = () => {
    setSelectedFileIds([]);
  };

  // Select latest N files (e.g., latest 1, latest 3, latest 5)
  const handleSelectLatestFiles = (count: number) => {
    if (availableExamFiles.length === 0) return;
    const latest = availableExamFiles.slice(-count).map((f) => f.id);
    setSelectedFileIds(latest);
  };

  // Select a range of files (e.g. pages 1 to 5)
  const handleSelectRangeFiles = (startIdx: number, endIdx: number) => {
    if (availableExamFiles.length === 0) return;
    const min = Math.max(0, Math.min(startIdx - 1, availableExamFiles.length - 1));
    const max = Math.max(min, Math.min(endIdx - 1, availableExamFiles.length - 1));
    const rangeIds = availableExamFiles.slice(min, max + 1).map((f) => f.id);
    setSelectedFileIds(rangeIds);
  };

  // Invert current file selection
  const handleInvertFileSelection = () => {
    const currentSet = new Set(selectedFileIds);
    const inverted = availableExamFiles.filter((f) => !currentSet.has(f.id)).map((f) => f.id);
    setSelectedFileIds(inverted);
  };

  // Filtered available files based on search query (for finding 1 page out of 17+)
  const filteredAvailableFiles = useMemo(() => {
    if (!fileSearchQuery.trim()) return availableExamFiles;
    const q = fileSearchQuery.toLowerCase().trim();
    return availableExamFiles.filter((f, idx) => {
      const pageNumStr = `${idx + 1}`;
      const nameMatch = f.name?.toLowerCase().includes(q);
      const chapterMatch = f.chapterTitle?.toLowerCase().includes(q);
      const numMatch =
        pageNumStr === q ||
        `पेज ${pageNumStr}`.toLowerCase().includes(q) ||
        `पेज #${pageNumStr}`.toLowerCase().includes(q) ||
        `page ${pageNumStr}`.toLowerCase().includes(q);
      return nameMatch || chapterMatch || numMatch;
    });
  }, [availableExamFiles, fileSearchQuery]);

  // Upload handler with AI Vision OCR scanning for exact question detection (supports 17+ bulk uploads)
  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: SelectableExamFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const fileId = `modal_upload_${Date.now()}_${i}`;
        newFiles.push({
          id: fileId,
          name: file.name || `नया अपलोड पेज ${modalUploadedFiles.length + i + 1}`,
          url: dataUrl,
          sourceType: 'custom_upload',
          chapterTitle: file.name.replace(/\.[^/.]+$/, ''),
        });
      } catch (err) {
        console.error('File read error:', err);
      }
    }

    if (newFiles.length > 0) {
      setModalUploadedFiles((prev) => [...prev, ...newFiles]);
      // Select the newly uploaded files
      setSelectedFileIds(newFiles.map((f) => f.id));
      setTestSourceMode('uploaded');

      // AI Reading: Scan new files with live progress tracking
      setIsScanningFiles(true);
      for (let i = 0; i < newFiles.length; i++) {
        const nf = newFiles[i];
        if (!nf.url) continue;

        setUploadProgress({
          current: i + 1,
          total: newFiles.length,
          fileName: nf.name || `पेज #${i + 1}`,
        });

        try {
          const askRes = await fetch('/api/tutor/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'worksheet',
              learning_language: medium === 'english' ? 'en' : 'hi',
              question:
                'कृपया इस अपलोड पेज को ध्यान से पूरा पढ़ें। इसमें दिए गए सभी प्रश्न (अभ्यास, खाली स्थान, सही-गलत, लघु/दीर्घ सवाल) को पहचानें। हर वास्तविक सवाल को <detected_question text="..." /> में दें। हेडिंग या चैप्टर का नाम सवाल नहीं है।',
              image_url: nf.url,
              file_name: nf.name,
              board,
              className,
            }),
          });

          if (askRes.ok) {
            const data = await askRes.json();
            const rawQuestions: string[] = Array.isArray(data.detected_questions)
              ? data.detected_questions
              : [];

            if (rawQuestions.length === 0 && Array.isArray(data.whiteboard_steps)) {
              data.whiteboard_steps.forEach((st: any) => {
                if (st.question && isValidQuestionText(st.question)) rawQuestions.push(st.question);
                else if (st.step && isValidQuestionText(st.step)) rawQuestions.push(st.step);
              });
            }

            const validItems: DetectedQuestionItem[] = [];
            const seenQ = new Set<string>();

            rawQuestions.forEach((rq, qIdx) => {
              if (isValidQuestionText(rq)) {
                const cleaned = cleanQuestionText(rq);
                if (cleaned.length >= 4 && !seenQ.has(cleaned.toLowerCase())) {
                  seenQ.add(cleaned.toLowerCase());
                  const info = classifyQuestion(cleaned);
                  validItems.push({
                    id: `${nf.id}_q_${qIdx}_${Date.now()}`,
                    fileId: nf.id,
                    rawText: rq,
                    cleanText: cleaned,
                    type: info.type,
                    marks: info.marks,
                    options: info.options,
                    correctAnswer: info.correctAnswer,
                    selected: true,
                  });
                }
              }
            });

            if (validItems.length > 0) {
              setFileQuestionsMap((prev) => ({
                ...prev,
                [nf.id]: validItems,
              }));
            }
          }
        } catch (scanErr) {
          console.error('Scan error for file:', nf.id, scanErr);
        }
      }
      setUploadProgress(null);
      setIsScanningFiles(false);
    }

    if (modalFileInputRef.current) {
      modalFileInputRef.current.value = '';
    }
  };

  // Re-scan a file on demand using Vision AI
  const handleRescanFile = async (f: SelectableExamFile) => {
    if (!f.url) return;
    setIsScanningFiles(true);
    try {
      const askRes = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'worksheet',
          learning_language: medium === 'english' ? 'en' : 'hi',
          question:
            'कृपया इस अपलोड पेज को ध्यान से पूरा पढ़ें। इसमें दिए गए सभी प्रश्न (अभ्यास, खाली स्थान, सही-गलत, लघु/दीर्घ सवाल) को पहचानें। हर वास्तविक सवाल को <detected_question text="..." /> में दें। हेडिंग या चैप्टर का नाम सवाल नहीं है।',
          image_url: f.url,
          file_name: f.name,
          board,
          className,
        }),
      });

      if (askRes.ok) {
        const data = await askRes.json();
        const rawQuestions: string[] = Array.isArray(data.detected_questions)
          ? data.detected_questions
          : [];

        if (rawQuestions.length === 0 && Array.isArray(data.whiteboard_steps)) {
          data.whiteboard_steps.forEach((st: any) => {
            if (st.question && isValidQuestionText(st.question)) rawQuestions.push(st.question);
            else if (st.step && isValidQuestionText(st.step)) rawQuestions.push(st.step);
          });
        }

        const validItems: DetectedQuestionItem[] = [];
        const seenQ = new Set<string>();

        rawQuestions.forEach((rq, qIdx) => {
          if (isValidQuestionText(rq)) {
            const cleaned = cleanQuestionText(rq);
            if (cleaned.length >= 4 && !seenQ.has(cleaned.toLowerCase())) {
              seenQ.add(cleaned.toLowerCase());
              const info = classifyQuestion(cleaned);
              validItems.push({
                id: `${f.id}_q_${qIdx}_${Date.now()}`,
                fileId: f.id,
                rawText: rq,
                cleanText: cleaned,
                type: info.type,
                marks: info.marks,
                options: info.options,
                correctAnswer: info.correctAnswer,
                selected: true,
              });
            }
          }
        });

        if (validItems.length > 0) {
          setFileQuestionsMap((prev) => ({
            ...prev,
            [f.id]: validItems,
          }));
        }
      }
    } catch (err) {
      console.error('Rescan error:', err);
    } finally {
      setIsScanningFiles(false);
    }
  };

  // Question selection & editing handlers ("konnsa question dena h")
  const handleToggleQuestion = (fileId: string, qId: string) => {
    setFileQuestionsMap((prev) => {
      const list = prev[fileId] || [];
      return {
        ...prev,
        [fileId]: list.map((q) => (q.id === qId ? { ...q, selected: !q.selected } : q)),
      };
    });
  };

  const handleSelectAllQuestions = (fileId: string) => {
    setFileQuestionsMap((prev) => {
      const list = prev[fileId] || [];
      return {
        ...prev,
        [fileId]: list.map((q) => ({ ...q, selected: true })),
      };
    });
  };

  const handleDeselectAllQuestions = (fileId: string) => {
    setFileQuestionsMap((prev) => {
      const list = prev[fileId] || [];
      return {
        ...prev,
        [fileId]: list.map((q) => ({ ...q, selected: false })),
      };
    });
  };

  const handleDeleteQuestion = (fileId: string, qId: string) => {
    setFileQuestionsMap((prev) => {
      const list = prev[fileId] || [];
      return {
        ...prev,
        [fileId]: list.filter((q) => q.id !== qId),
      };
    });
  };

  const handleAddQuestion = (fileId: string) => {
    const text = (newQuestionInputs[fileId] || '').trim();
    if (!text) return;
    const info = classifyQuestion(text);
    const newItem: DetectedQuestionItem = {
      id: `${fileId}_custom_${Date.now()}`,
      fileId,
      rawText: text,
      cleanText: text,
      type: info.type,
      marks: info.marks,
      options: info.options,
      correctAnswer: info.correctAnswer,
      selected: true,
    };

    setFileQuestionsMap((prev) => ({
      ...prev,
      [fileId]: [...(prev[fileId] || []), newItem],
    }));

    setNewQuestionInputs((prev) => ({ ...prev, [fileId]: '' }));
  };

  const handleStartEditQuestion = (item: DetectedQuestionItem) => {
    setEditingQuestionId(item.id);
    setEditingQuestionText(item.cleanText);
  };

  const handleSaveEditQuestion = (fileId: string, qId: string) => {
    if (!editingQuestionText.trim()) return;
    setFileQuestionsMap((prev) => {
      const list = prev[fileId] || [];
      return {
        ...prev,
        [fileId]: list.map((q) =>
          q.id === qId ? { ...q, cleanText: editingQuestionText.trim() } : q
        ),
      };
    });
    setEditingQuestionId(null);
    setEditingQuestionText('');
  };

  // Subjects & Chapters Selection State (Local seed + Live server sync)
  const initialSubjects = useMemo(() => {
    return getCurriculum(board, className, medium);
  }, [board, className, medium]);

  const [subjects, setSubjects] = useState<SubjectCurriculum[]>(initialSubjects);

  // Sync fresh curriculum from backend on load
  useEffect(() => {
    fetchDynamicCurriculum(board, className).then((live) => {
      if (live && Array.isArray(live) && live.length > 0) {
        setSubjects(live);
      }
    });
  }, [board, className]);

  useEffect(() => {
    setSubjects(getCurriculum(board, className, medium));
  }, [board, className, medium]);

  // Dynamic student name from profile / localStorage
  const [activeStudentName, setActiveStudentName] = useState<string>(studentName);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('student_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name && u.name.trim()) {
          setActiveStudentName(u.name.trim());
          return;
        }
      }
    } catch {}
    if (studentName) {
      setActiveStudentName(studentName);
    }
  }, [studentName]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    return initialSubjectId || initialSubjects[0]?.id || 'c4-math';
  });

  const activeSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  }, [subjects, selectedSubjectId]);

  // Multiple Chapters Selection State
  const [selectedChapterNumbers, setSelectedChapterNumbers] = useState<number[]>([]);

  // Default select first two chapters when subject changes
  useEffect(() => {
    if (activeSubject?.chapters && activeSubject.chapters.length > 0) {
      const defaultChs = activeSubject.chapters.slice(0, Math.min(2, activeSubject.chapters.length)).map((c) => c.chapterNumber);
      setSelectedChapterNumbers(defaultChs);
    }
  }, [activeSubject]);

  // Exam taking mode: 'typing' | 'upload'
  const [examMode, setExamMode] = useState<'typing' | 'upload'>('typing');

  // Generated Questions for the test
  const [generatedQuestions, setGeneratedQuestions] = useState<TestQuestion[]>([]);
  const [totalExamMarks, setTotalExamMarks] = useState<number>(25);

  // Student Answers (for typing mode)
  const [typedAnswers, setTypedAnswers] = useState<Record<string, string>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Uploaded Pages (for manual written mode)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Speech to Text Voice Typing State
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Rough Scratchpad Toggle inside Exam
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);
  const scratchCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Test Evaluation & History State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<TestResultRecord | null>(null);
  const [testHistory, setTestHistory] = useState<TestResultRecord[]>([]);

  // 40-Minute Countdown Timer for Test Series (40 minutes = 2400 seconds)
  const EXAM_DURATION_SECONDS = 40 * 60; // 40 minutes (2400 seconds)
  const [examTimeLeft, setExamTimeLeft] = useState<number>(EXAM_DURATION_SECONDS);

  // Auto-countdown timer when student is taking the exam in 'exam' tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'exam') return;

    const timerId = setInterval(() => {
      setExamTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          // Automatic submission after 40 minutes!
          setTimeout(() => {
            handleSubmitTest(true);
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isOpen, activeTab]);

  const formatExamTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Load Test History from localStorage + Backend Server Sync based on student login
  useEffect(() => {
    let studentUser: any = null;
    try {
      const savedUser = localStorage.getItem('student_user');
      if (savedUser) studentUser = JSON.parse(savedUser);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTestHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load test history:', e);
    }

    // Server Sync: fetch past test records for this student from any PC
    if (studentUser?.phone || studentUser?.id) {
      fetch(`/api/student/records?phone=${encodeURIComponent(studentUser.phone || '')}&studentId=${encodeURIComponent(studentUser.id || '')}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.testHistory) && data.testHistory.length > 0) {
            setTestHistory(data.testHistory);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.testHistory));
            } catch {}
          }
        })
        .catch((err) => console.warn('Could not sync test history from server:', err));
    }

    // Auto-restore ongoing weekly test on page refresh
    try {
      const ongoing = localStorage.getItem('vidya_active_weekly_test');
      if (ongoing) {
        const parsed = JSON.parse(ongoing);
        if (parsed.generatedQuestions && Array.isArray(parsed.generatedQuestions) && parsed.generatedQuestions.length > 0) {
          setGeneratedQuestions(parsed.generatedQuestions);
          if (parsed.typedAnswers && typeof parsed.typedAnswers === 'object') {
            setTypedAnswers(parsed.typedAnswers);
          }
          if (typeof parsed.activeQuestionIndex === 'number') {
            setActiveQuestionIndex(parsed.activeQuestionIndex);
          }
          if (parsed.totalExamMarks) setTotalExamMarks(parsed.totalExamMarks);
          if (parsed.examMode) setExamMode(parsed.examMode);
          if (parsed.selectedSubjectId) setSelectedSubjectId(parsed.selectedSubjectId);
          if (parsed.activeTab === 'exam') setActiveTab('exam');
        }
      }
    } catch (e) {
      console.warn('Could not restore ongoing weekly test:', e);
    }
  }, []);

  // Continuous auto-save of weekly test answers & questions
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeTab === 'exam' && generatedQuestions.length > 0) {
      try {
        localStorage.setItem(
          'vidya_active_weekly_test',
          JSON.stringify({
            generatedQuestions,
            typedAnswers,
            activeQuestionIndex,
            totalExamMarks,
            examMode,
            selectedSubjectId,
            activeTab: 'exam',
            timestamp: Date.now(),
          })
        );
      } catch {}
    }
  }, [activeTab, generatedQuestions, typedAnswers, activeQuestionIndex, totalExamMarks, examMode, selectedSubjectId]);

  // Save Test History to localStorage + Server Database
  const saveToHistory = (record: TestResultRecord) => {
    try {
      const updated = [record, ...testHistory];
      setTestHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Sync to Server Database so it shows on any PC when student logs in
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
              newTestRecord: record,
            }),
          }).catch((err) => console.warn('Failed to sync new test record to server:', err));
        }
      }
    } catch (e) {
      console.warn('Could not save test history:', e);
    }
  };

  // Toggle chapter selection (supports multiple chapters!)
  const handleToggleChapter = (chNum: number) => {
    setSelectedChapterNumbers((prev) => {
      if (prev.includes(chNum)) {
        if (prev.length === 1) return prev; // Keep at least 1 chapter
        return prev.filter((n) => n !== chNum);
      } else {
        return [...prev, chNum].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAllChapters = () => {
    if (!activeSubject?.chapters) return;
    setSelectedChapterNumbers(activeSubject.chapters.map((c) => c.chapterNumber));
  };

  const handleDeselectAllChapters = () => {
    if (!activeSubject?.chapters || activeSubject.chapters.length === 0) return;
    setSelectedChapterNumbers([activeSubject.chapters[0].chapterNumber]);
  };

  // 1. GENERATE TEST PAPER FROM SELECTED CHAPTERS, PREVIOUS WORKS (#18, #19), AND/OR UPLOADED FILES
  const handleGenerateExam = () => {
    const isUsingChapters = testSourceMode === 'chapters' || testSourceMode === 'both';
    const isUsingUploaded = testSourceMode === 'uploaded' || testSourceMode === 'both';

    const hasHistorySelected = selectedHistoryIds.length > 0;
    const hasFilesSelected = selectedFileIds.length > 0;

    if (isUsingChapters && selectedChapterNumbers.length === 0 && !isUsingUploaded) {
      alert('कृपया कम से कम एक अध्याय चुनें।');
      return;
    }
    if (isUsingUploaded && !hasHistorySelected && !hasFilesSelected && !isUsingChapters) {
      alert('कृपया कम से कम एक पिछला काम (#18, #19 आदि) या अपलोड किया गया पेज चुनें।');
      return;
    }

    const selectedUploadedQuestionsCount = isUsingUploaded
      ? (hasHistorySelected ? selectedHistoryIds.length : selectedFileIds.reduce((acc, fid) => acc + (fileQuestionsMap[fid]?.filter((q) => q.selected).length || 0), 0))
      : 0;

    if (isUsingUploaded && !isUsingChapters && !hasHistorySelected && selectedUploadedQuestionsCount === 0) {
      alert('कृपया अपलोड किए गए पेजों में से कम से कम एक सवाल चुनें (चेकबॉक्स टिक करें) जिसे आप टेस्ट में देना चाहते हैं।');
      return;
    }

    const questions: TestQuestion[] = [];
    let qIdCounter = 1;

    // --- PART 1: QUESTIONS FROM CHAPTERS ---
    if (isUsingChapters && activeSubject && selectedChapterNumbers.length > 0) {
      const chosenChapters = activeSubject.chapters.filter((c) =>
        selectedChapterNumbers.includes(c.chapterNumber)
      );

      // Section A: MCQs (1 Mark each)
      chosenChapters.forEach((ch) => {
        const mcqs = ch.sampleQuestions?.filter((sq) => sq.type === 'mcq') || [];
        mcqs.forEach((q) => {
          questions.push({
            id: `q_${qIdCounter++}`,
            chapterNumber: ch.chapterNumber,
            chapterTitle: ch.titleHindi || ch.titleEnglish,
            section: 'A',
            sectionTitle: "खंड 'क' : बहुविकल्पीय प्रश्न (Multiple Choice)",
            type: 'mcq',
            marks: 1,
            question: q.question,
            options: q.options || ['विकल्प 1', 'विकल्प 2', 'विकल्प 3', 'विकल्प 4'],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'पाठ्यपुस्तक के अनुसार।',
            sourceTag: `अध्याय ${ch.chapterNumber}`,
          });
        });

        // If chapter has fewer than 4 MCQs, generate conceptual MCQs from concepts and formulas
        if (mcqs.length < 4 && ch.concepts && ch.concepts.length > 0) {
          const needed = 4 - mcqs.length;
          ch.concepts.slice(0, needed).forEach((c, cIdx) => {
            questions.push({
              id: `q_${qIdCounter++}`,
              chapterNumber: ch.chapterNumber,
              chapterTitle: ch.titleHindi || ch.titleEnglish,
              section: 'A',
              sectionTitle: "खंड 'क' : बहुविकल्पीय प्रश्न (Multiple Choice)",
              type: 'mcq',
              marks: 1,
              question: `अध्याय "${ch.titleHindi}" के अनुसार: "${c}" से संबंधित सही विकल्प चुनें:`,
              options: [
                c,
                'इनमें से कोई नहीं',
                ch.concepts[(cIdx + 1) % ch.concepts.length] !== c ? ch.concepts[(cIdx + 1) % ch.concepts.length] : 'सामान्य नियम',
                'उपरोक्त दोनों'
              ],
              correctAnswer: c,
              explanation: `पाठ्यपुस्तक के अनुसार यह "${ch.titleHindi}" का मुख्य सिद्धांत है।`,
              sourceTag: `अध्याय ${ch.chapterNumber}`,
            });
          });
        }
      });

      // Section B: Fill in blanks / Short Answers (2 Marks each)
      chosenChapters.forEach((ch) => {
        const fills = ch.sampleQuestions?.filter((sq) => sq.type === 'fill') || [];
        fills.forEach((q) => {
          questions.push({
            id: `q_${qIdCounter++}`,
            chapterNumber: ch.chapterNumber,
            chapterTitle: ch.titleHindi || ch.titleEnglish,
            section: 'B',
            sectionTitle: "खंड 'ख' : रिक्त स्थान एवं लघु उत्तरीय प्रश्न (Short Answer)",
            type: 'fill',
            marks: 2,
            question: q.question,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'पाठ्यपुस्तक के अनुसार।',
            sourceTag: `अध्याय ${ch.chapterNumber}`,
          });
        });

        if (fills.length < 3 && ch.keyFormulas && ch.keyFormulas.length > 0) {
          const needed = 3 - fills.length;
          ch.keyFormulas.slice(0, needed).forEach((kf) => {
            questions.push({
              id: `q_${qIdCounter++}`,
              chapterNumber: ch.chapterNumber,
              chapterTitle: ch.titleHindi || ch.titleEnglish,
              section: 'B',
              sectionTitle: "खंड 'ख' : रिक्त स्थान एवं लघु उत्तरीय प्रश्न (Short Answer)",
              type: 'fill',
              marks: 2,
              question: `रिक्त स्थान भरें या संक्षेप में लिखें: [ ${kf.split(':')[0]} ] के नियम को स्पष्ट करें।`,
              correctAnswer: kf,
              explanation: `${ch.titleHindi} का आवश्यक सूत्र।`,
              sourceTag: `अध्याय ${ch.chapterNumber}`,
            });
          });
        } else if (fills.length === 0 && ch.concepts && ch.concepts.length > 1) {
          questions.push({
            id: `q_${qIdCounter++}`,
            chapterNumber: ch.chapterNumber,
            chapterTitle: ch.titleHindi || ch.titleEnglish,
            section: 'B',
            sectionTitle: "खंड 'ख' : रिक्त स्थान एवं लघु उत्तरीय प्रश्न (Short Answer)",
            type: 'fill',
            marks: 2,
            question: `संक्षेप में समझाएं: "${ch.concepts[1] || ch.concepts[0]}" से आप क्या समझते हैं?`,
            correctAnswer: ch.concepts[1] || ch.concepts[0],
            explanation: `${ch.titleHindi} के अनुसार महत्वपूर्ण सिद्धांत।`,
            sourceTag: `अध्याय ${ch.chapterNumber}`,
          });
        }
      });

      // Section C: Long Answer / Step-by-Step Solve (5 Marks each)
      chosenChapters.forEach((ch) => {
        const solves = ch.sampleQuestions?.filter((sq) => sq.type === 'solve') || [];
        solves.forEach((q) => {
          questions.push({
            id: `q_${qIdCounter++}`,
            chapterNumber: ch.chapterNumber,
            chapterTitle: ch.titleHindi || ch.titleEnglish,
            section: 'C',
            sectionTitle: "खंड 'ग' : विस्तृत एवं हल करने योग्य सवाल (Solve with Steps)",
            type: 'solve',
            marks: 5,
            question: q.question,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'चरणबद्ध हल प्रस्तुत करें।',
            sourceTag: `अध्याय ${ch.chapterNumber}`,
          });
        });

        if (solves.length === 0) {
          questions.push({
            id: `q_${qIdCounter++}`,
            chapterNumber: ch.chapterNumber,
            chapterTitle: ch.titleHindi || ch.titleEnglish,
            section: 'C',
            sectionTitle: "खंड 'ग' : विस्तृत एवं हल करने योग्य सवाल (Solve with Steps)",
            type: 'solve',
            marks: 5,
            question: `अभ्यास प्रश्न: ${ch.titleHindi} के मुख्य उदाहरण को चरणबद्ध तरीके से अपनी भाषा में हल करें व समझाएं।`,
            correctAnswer: ch.keyFormulas?.[0] || ch.concepts?.[0] || 'विस्तृत हल',
            explanation: `${ch.titleHindi} का मुख्य अनुप्रयोग।`,
            sourceTag: `अध्याय ${ch.chapterNumber}`,
          });
        }
      });
    }

    // --- PART 2A: QUESTIONS FROM SELECTED PREVIOUS WORKS (पिछला काम - e.g. काम #18, काम #19) ---
    if (isUsingUploaded && selectedHistoryIds.length > 0) {
      const chosenWorks = historyWorks.filter((w) => selectedHistoryIds.includes(w.id));

      chosenWorks.forEach((work) => {
        const workTag = `काम #${work.workNumber}`;
        const workTitle = work.title || work.subjectName || workTag;

        let addedCount = 0;
        work.parsedQuestions.forEach((item) => {
          if (!item.selected) return;
          addedCount++;

          const section = item.type === 'mcq'
            ? 'A'
            : item.type === 'fill'
            ? 'B'
            : 'C';

          const sectionTitle = item.type === 'mcq'
            ? (item.options?.length === 2 && item.options.includes('सत्य (True)')
                ? "खंड 'क' : सही या गलत (True / False)"
                : "खंड 'क' : बहुविकल्पीय प्रश्न (Multiple Choice)")
            : item.type === 'fill'
            ? "खंड 'ख' : रिक्त स्थान एवं लघु उत्तरीय प्रश्न (Short Answer)"
            : "खंड 'ग' : विस्तृत एवं हल करने योग्य सवाल (Solve with Steps)";

          questions.push({
            id: `q_hw_${qIdCounter++}`,
            chapterNumber: work.workNumber,
            chapterTitle: workTitle,
            section,
            sectionTitle,
            type: item.type,
            marks: item.marks,
            question: item.cleanText,
            options: item.options,
            correctAnswer: item.correctAnswer || (item.type === 'solve' ? 'चरणबद्ध विस्तृत हल एवं उत्तर।' : 'मुख्य बिंदु एवं व्याख्या।'),
            explanation: `यह प्रश्न आपके पिछले काम #${work.workNumber} (${workTitle}) से है।`,
            sourceTag: workTag,
          });
        });

        if (addedCount === 0) {
          questions.push({
            id: `q_hw_${qIdCounter++}`,
            chapterNumber: work.workNumber,
            chapterTitle: workTitle,
            section: 'C',
            sectionTitle: "खंड 'ग' : विस्तृत एवं हल करने योग्य सवाल (Solve with Steps)",
            type: 'solve',
            marks: 5,
            question: `काम #${work.workNumber} अभ्यास: "${workTitle}" के मुख्य प्रश्न व उदाहरण को चरणबद्ध तरीके से हल करें।`,
            correctAnswer: 'चरणबद्ध विस्तृत हल एवं उत्तर।',
            explanation: `यह प्रश्न आपके पिछले काम #${work.workNumber} से है।`,
            sourceTag: workTag,
          });
        }
      });
    }

    // --- PART 2B: QUESTIONS FROM SELECTED UPLOADED FILES ---
    if (isUsingUploaded && (uploadSubTab === 'pages' || selectedHistoryIds.length === 0) && selectedFileIds.length > 0) {
      const chosenFiles = availableExamFiles.filter((f) => selectedFileIds.includes(f.id));

      chosenFiles.forEach((f, fIdx) => {
        const cleanTitle = getStudentFriendlyPageName(f.name, fIdx, f.chapterTitle || pageDataMap?.[f.id]?.heading);
        const selectedItems = (fileQuestionsMap[f.id] || []).filter((item) => item.selected);

        if (selectedItems.length > 0) {
          selectedItems.forEach((item) => {
            const section = item.type === 'mcq'
              ? 'A'
              : item.type === 'fill'
              ? 'B'
              : 'C';

            const sectionTitle = item.type === 'mcq'
              ? (item.options?.length === 2 && item.options.includes('सत्य (True)')
                  ? "खंड 'क' : सही या गलत (True / False)"
                  : "खंड 'क' : बहुविकल्पीय प्रश्न (Multiple Choice)")
              : item.type === 'fill'
              ? "खंड 'ख' : लघु उत्तरीय प्रश्न (Short Answer)"
              : "खंड 'ग' : विस्तृत एवं हल करने योग्य सवाल (Solve with Steps)";

            questions.push({
              id: `q_up_${qIdCounter++}`,
              chapterNumber: fIdx + 1,
              chapterTitle: cleanTitle,
              section,
              sectionTitle,
              type: item.type,
              marks: item.marks,
              question: item.cleanText,
              options: item.options,
              correctAnswer: item.correctAnswer || (item.type === 'solve' ? 'चरणबद्ध विस्तृत हल एवं उत्तर।' : 'मुख्य बिंदु एवं व्याख्या।'),
              explanation: `यह प्रश्न आपके द्वारा अपलोड किए गए ${cleanTitle} से है।`,
              sourceTag: `पेज #${fIdx + 1}`,
            });
          });
        }
      });
    }

    if (questions.length === 0) {
      alert('कृपया कम से कम एक अध्याय, पिछला काम (#18, #19 आदि) या अपलोड किया गया पेज चुनें।');
      return;
    }

    // Calculate total marks
    const total = questions.reduce((acc, q) => acc + q.marks, 0);
    setTotalExamMarks(total);
    setGeneratedQuestions(questions);
    setTypedAnswers({});
    setActiveQuestionIndex(0);
    setUploadedImages([]);
    setExamTimeLeft(EXAM_DURATION_SECONDS);
    setActiveTab('exam');
  };

  // Voice Typing Speech Recognition setup
  const toggleVoiceTyping = (questionId: string) => {
    if (typeof window === 'undefined') return;

    if (isVoiceListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVoiceListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('आपके ब्राउज़र में बोलकर लिखने की सुविधा उपलब्ध नहीं है। कृपया गूगल क्रोम या एज का उपयोग करें।');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = medium === 'english' ? 'en-IN' : 'hi-IN';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsVoiceListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      if (transcript) {
        setTypedAnswers((prev) => ({
          ...prev,
          [questionId]: prev[questionId] ? `${prev[questionId]} ${transcript}` : transcript,
        }));
      }
      setIsVoiceListening(false);
    };

    recognition.onerror = () => {
      setIsVoiceListening(false);
    };

    recognition.onend = () => {
      setIsVoiceListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Insert Quick Math Symbols into active answer
  const handleInsertSymbol = (questionId: string, sym: string) => {
    setTypedAnswers((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || '') + sym,
    }));
  };

  // Handle Photo Upload (for manual written copy)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setUploadedImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Scratchpad drawing logic
  useEffect(() => {
    if (!isScratchpadOpen) return;
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4f46e5';
  }, [isScratchpadOpen]);

  const handleClearScratchpad = () => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // 2. SUBMIT TEST & GET AI RESULT (Supports Auto-Submit when 40-minute timer expires)
  const handleSubmitTest = async (isAutoSubmit: boolean = false) => {
    if (!isAutoSubmit) {
      if (examMode === 'upload' && uploadedImages.length === 0) {
        alert('कृपया अपनी लिखी हुई उत्तर-पुस्तिका (कॉपी) का फोटो अपलोड करें।');
        return;
      }

      if (examMode === 'typing') {
        const answeredCount = Object.values(typedAnswers).filter((a) => a.trim().length > 0).length;
        if (answeredCount === 0) {
          alert('कृपया कम से कम एक प्रश्न का उत्तर टाइप करें।');
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const chosenChapters = (testSourceMode === 'uploaded')
        ? availableExamFiles.filter((f) => selectedFileIds.includes(f.id)).map((f, i) => ({
            chapterNumber: i + 1,
            title: f.name,
          }))
        : (testSourceMode === 'both')
        ? [
            ...activeSubject.chapters
              .filter((c) => selectedChapterNumbers.includes(c.chapterNumber))
              .map((c) => ({
                chapterNumber: c.chapterNumber,
                title: c.titleHindi || c.titleEnglish,
              })),
            ...availableExamFiles.filter((f) => selectedFileIds.includes(f.id)).map((f, i) => ({
              chapterNumber: 100 + i + 1,
              title: f.name,
            })),
          ]
        : activeSubject.chapters
            .filter((c) => selectedChapterNumbers.includes(c.chapterNumber))
            .map((c) => ({
              chapterNumber: c.chapterNumber,
              title: c.titleHindi || c.titleEnglish,
            }));

      const res = await fetch('/api/test/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: activeStudentName,
          subjectName: activeSubject.subjectHindi || activeSubject.subject,
          classGrade: className,
          selectedChapters: chosenChapters,
          mode: examMode,
          questions: generatedQuestions,
          typedAnswers,
          uploadedImages,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'टेस्ट चेक करने में समस्या हुई।');
      }

      setCurrentResult(data.result);
      saveToHistory(data.result);
      try {
        localStorage.removeItem('vidya_active_weekly_test');
      } catch {}
      if (onTestCompleted) {
        onTestCompleted(data.result);
      }
      setActiveTab('result');
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert(err?.message || 'सबमिशन असफल रहा। कृपया पुनः प्रयास करें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintTestPaper = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      className={
        isFullPage
          ? 'h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col w-full print:h-auto print:overflow-visible print:bg-white print:text-slate-900'
          : 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0'
      }
    >
      <div
        className={
          isFullPage
            ? 'flex-1 flex flex-col w-full bg-slate-50 text-slate-900 overflow-hidden print:bg-white print:overflow-visible'
            : 'bg-white text-slate-900 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative my-4 sm:my-6 flex flex-col max-h-[92vh] print:max-h-none print:m-0 print:shadow-none print:w-full print:rounded-none'
        }
      >
        {/* ================= MODAL / PAGE HEADER (Hidden in Print) ================= */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-white/10 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            {isFullPage && (
              <Link
                href="/tutor"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all mr-1 hover:scale-105 active:scale-95"
                title="ट्यूटर पर वापस जाएं"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">ट्यूटर पर वापस जाएं</span>
              </Link>
            )}
            <span className="text-2xl">📝</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black">
                  साप्ताहिक टेस्ट सीरीज़ (Test Series)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {board} • {className}
                </span>
                {isFullPage && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    छात्र: {studentName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-indigo-200">
                अध्याय चुनें • ऑनलाइन टाइप करें या प्रिंट निकालकर कॉपी अपलोड करें
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab navigation buttons */}
            <div className="hidden sm:flex items-center bg-white/10 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('configure')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'configure' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                1. सिलेबस व अध्याय
              </button>
              <button
                type="button"
                onClick={() => {
                  if (generatedQuestions.length > 0) setActiveTab('exam');
                  else handleGenerateExam();
                }}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'exam' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                2. टेस्ट पेपर
              </button>
              {currentResult && (
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'result' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  3. रिज़ल्ट कार्ड
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'history' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>📊 स्कोर व हिस्ट्री</span>
                {testHistory.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] flex items-center justify-center font-bold">
                    {testHistory.length}
                  </span>
                )}
              </button>
            </div>

            {/* Link to Dedicated Worksheet Mock Test */}
            <Link
              href="/mock-test"
              className="px-3 py-1 rounded-lg border border-amber-400/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-1"
              title="वर्कशीट मॉक टेस्ट खोलें"
            >
              <span>🎯</span>
              <span>मॉक टेस्ट</span>
            </Link>

            {!isFullPage ? (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all ml-1 cursor-pointer"
                title="बंद करें"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <Link
                href="/tutor"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all ml-1 cursor-pointer"
                title="ट्यूटर पर जाएं"
              >
                <X className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="sm:hidden flex border-b border-slate-200 bg-slate-100 text-xs font-bold px-2 py-1.5 gap-1 overflow-x-auto print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('configure')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${
              activeTab === 'configure' ? 'bg-indigo-600 text-white' : 'text-slate-700'
            }`}
          >
            अध्याय चयन
          </button>
          <button
            type="button"
            onClick={() => {
              if (generatedQuestions.length > 0) setActiveTab('exam');
              else handleGenerateExam();
            }}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${
              activeTab === 'exam' ? 'bg-indigo-600 text-white' : 'text-slate-700'
            }`}
          >
            टेस्ट पेपर
          </button>
          {currentResult && (
            <button
              type="button"
              onClick={() => setActiveTab('result')}
              className={`px-3 py-1.5 rounded-lg shrink-0 ${
                activeTab === 'result' ? 'bg-emerald-600 text-white' : 'text-slate-700'
              }`}
            >
              रिज़ल्ट
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${
              activeTab === 'history' ? 'bg-amber-500 text-slate-950' : 'text-slate-700'
            }`}
          >
            स्कोर ({testHistory.length})
          </button>
        </div>

        {/* ================= MODAL / PAGE BODY ================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 bg-slate-50 print:p-0 print:bg-white print:overflow-visible">
          {/* ================= TAB 1: CONFIGURE & SELECT CHAPTERS / UPLOADED PAGES ================= */}
          {activeTab === 'configure' && (
            <div className={`space-y-4 ${isFullPage ? 'max-w-5xl' : 'max-w-3xl'} mx-auto`}>
              {/* Step Title */}
              <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-3 sm:p-3.5 flex items-start gap-3">
                <span className="text-3xl">🎯</span>
                <div className="flex-1">
                  <h4 className="text-base font-black text-indigo-950">
                    साप्ताहिक टेस्ट पेपर तैयार करें (Weekly Test Creator)
                  </h4>
                  <p className="text-xs text-indigo-800/80 mt-0.5">
                    आप किताब के अध्यायों से, अपने अपलोड किए गए पेजों/नोट्स से, या दोनों को मिलाकर एक साथ टेस्ट तैयार कर सकते हैं!
                  </p>
                </div>
              </div>

              {/* 1. TEST SOURCE PICKER */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>1. टेस्ट का स्रोत चुनें (Test Source):</span>
                  </label>
                  {availableExamFiles.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      📸 {availableExamFiles.length} पेज उपलब्ध
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTestSourceMode('chapters')}
                    className={`p-3 rounded-xl border text-left font-bold text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                      testSourceMode === 'chapters'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/30'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">📚</span>
                    <div className="min-w-0">
                      <div className="font-black text-xs">किताब के अध्याय</div>
                      <div className={`text-[10px] truncate ${testSourceMode === 'chapters' ? 'text-indigo-200' : 'text-slate-500'}`}>
                        सिलेबस के चैप्टर्स से टेस्ट
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestSourceMode('uploaded')}
                    className={`p-3 rounded-xl border text-left font-bold text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                      testSourceMode === 'uploaded'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/30'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">🗂️</span>
                    <div className="min-w-0">
                      <div className="font-black text-xs flex items-center gap-1.5">
                        <span>पिछला काम व अपलोड पेज</span>
                        {historyWorks.length > 0 ? (
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            testSourceMode === 'uploaded' ? 'bg-white text-indigo-700' : 'bg-emerald-600 text-white'
                          }`}>
                            {historyWorks.length} काम
                          </span>
                        ) : availableExamFiles.length > 0 ? (
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            testSourceMode === 'uploaded' ? 'bg-white text-indigo-700' : 'bg-emerald-600 text-white'
                          }`}>
                            {availableExamFiles.length}
                          </span>
                        ) : null}
                      </div>
                      <div className={`text-[10px] truncate ${testSourceMode === 'uploaded' ? 'text-indigo-200' : 'text-slate-500'}`}>
                        पिछला काम (#18, #19 आदि) या कॉपी पेज
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestSourceMode('both')}
                    className={`p-3 rounded-xl border text-left font-bold text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                      testSourceMode === 'both'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/30'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">🌟</span>
                    <div className="min-w-0">
                      <div className="font-black text-xs">दोनों मिलाकर (Hybrid)</div>
                      <div className={`text-[10px] truncate ${testSourceMode === 'both' ? 'text-indigo-200' : 'text-slate-500'}`}>
                        अध्याय + अपलोड किए पेज
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. UPLOADED PAGES & NOTES SELECTION (When 'uploaded' or 'both' mode active) */}
              {(testSourceMode === 'uploaded' || testSourceMode === 'both') && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
                  {/* Header & Upload Action */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2.5">
                    <div>
                      <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>{uploadSubTab === 'history' ? '🗂️ पिछला काम (वर्कशीट/सेशन)' : '📸 अपलोड किए गए पेज व नोट्स'}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                          {uploadSubTab === 'history'
                            ? `${selectedHistoryIds.length} / ${historyWorks.length} काम चुने गए`
                            : `${selectedFileIds.length} / ${availableExamFiles.length} पेज चुने गए`}
                        </span>
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        {uploadSubTab === 'history'
                          ? 'आप काम #18, काम #19 या दोनों को एक साथ चुनकर सीधे टेस्ट बना सकते हैं!'
                          : 'पहले से अपलोड किए पेज चुनें या नया फोटो जोड़ें — AI इन्हीं पेजों से टेस्ट बनाएगा!'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        ref={modalFileInputRef}
                        accept="image/*,application/pdf"
                        multiple
                        onChange={handleModalFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => modalFileInputRef.current?.click()}
                        className="text-xs font-black text-white px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 shadow-sm flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                        title="एक साथ 1 से 20+ फोटो या पेज अपलोड करें"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>+ नया फोटो/पेज जोड़ें (17+ बल्क अपलोड)</span>
                      </button>

                      {/* View Mode Toggle (Active when viewing raw pages) */}
                      {uploadSubTab === 'pages' && availableExamFiles.length > 0 && (
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-slate-600">
                          <button
                            type="button"
                            onClick={() => setFileViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${
                              fileViewMode === 'grid'
                                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                                : 'hover:text-slate-900'
                            }`}
                            title="ग्रिड कार्ड व्यू (Grid View)"
                          >
                            <Grid className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFileViewMode('compact')}
                            className={`p-1.5 rounded-lg transition-all ${
                              fileViewMode === 'compact'
                                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                                : 'hover:text-slate-900'
                            }`}
                            title="कॉम्पैक्ट लिस्ट व्यू (Compact Table View)"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sub-Tab Selector: 'history' (पिछला काम) vs 'pages' (पेज दर पेज) */}
                  {historyWorks.length > 0 && (
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setUploadSubTab('history')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          uploadSubTab === 'history'
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30'
                            : 'bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-sm">📂</span>
                        <span>पिछला काम से चुनें</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          uploadSubTab === 'history' ? 'bg-indigo-900 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {selectedHistoryIds.length} / {historyWorks.length} काम चुने
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUploadSubTab('pages')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          uploadSubTab === 'pages'
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30'
                            : 'bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-sm">📸</span>
                        <span>पेज दर पेज चुनें</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          uploadSubTab === 'pages' ? 'bg-indigo-900 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {selectedFileIds.length} / {availableExamFiles.length} पेज
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Bulk Upload Scanning Progress Bar */}
                  {uploadProgress && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 text-indigo-950 space-y-2 animate-pulse">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                          <span>
                            AI स्कैनिंग जारी: {uploadProgress.current} / {uploadProgress.total} फोटो ({uploadProgress.fileName})
                          </span>
                        </span>
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                          {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-indigo-700">
                        कृपया प्रतीक्षा करें, AI आपके सभी पेजों से प्रश्नों को पढ़ रहा है...
                      </p>
                    </div>
                  )}

                  {/* --- SUB-VIEW 1: PREVIOUS WORKS (पिछला काम - e.g. 19 works) --- */}
                  {uploadSubTab === 'history' && historyWorks.length > 0 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Presets Toolbar for Previous Works */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 flex-wrap gap-2">
                          <span className="flex items-center gap-1.5 text-indigo-900 font-black">
                            <span>⚡</span>
                            <span>क्विक सेलेक्शन (काम #18, #19 या दोनों):</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            कुल {historyWorks.length} पिछले काम उपलब्ध हैं
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* 1. Only #19 (Latest) */}
                          <button
                            type="button"
                            onClick={() => handleSelectWorkByNumber(historyWorks.length)}
                            className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              selectedHistoryIds.length === 1 &&
                              selectedHistoryIds[0] === historyWorks[historyWorks.length - 1]?.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                            }`}
                            title="सिर्फ सबसे नया काम चुनें"
                          >
                            ⚡ सिर्फ काम #{historyWorks.length}
                          </button>

                          {/* 2. Only #18 (Previous) */}
                          {historyWorks.length >= 2 && (
                            <button
                              type="button"
                              onClick={() => handleSelectWorkByNumber(historyWorks.length - 1)}
                              className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                                selectedHistoryIds.length === 1 &&
                                selectedHistoryIds[0] === historyWorks[historyWorks.length - 2]?.id
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                              }`}
                              title="सिर्फ पिछला काम चुनें"
                            >
                              ⚡ सिर्फ काम #{historyWorks.length - 1}
                            </button>
                          )}

                          {/* 3. BOTH #18 and #19 Together */}
                          {historyWorks.length >= 2 && (
                            <button
                              type="button"
                              onClick={() => handleSelectWorksBoth(historyWorks.length - 1, historyWorks.length)}
                              className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                                selectedHistoryIds.length === 2 &&
                                selectedHistoryIds.includes(historyWorks[historyWorks.length - 1]?.id) &&
                                selectedHistoryIds.includes(historyWorks[historyWorks.length - 2]?.id)
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                              }`}
                              title="काम #18 और #19 दोनों को मिलाकर टेस्ट लें"
                            >
                              ⚡ काम #{historyWorks.length - 1} और #{historyWorks.length} दोनों
                            </button>
                          )}

                          {/* 4. Latest 3 Works */}
                          {historyWorks.length >= 3 && (
                            <button
                              type="button"
                              onClick={() => handleSelectLatestHistoryWorks(3)}
                              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                              title="आख़िरी 3 काम चुनें"
                            >
                              ⚡ आख़िरी 3 काम
                            </button>
                          )}

                          {/* 5. Select All */}
                          <button
                            type="button"
                            onClick={handleSelectAllHistoryWorks}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              selectedHistoryIds.length === historyWorks.length
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                            }`}
                          >
                            ⭐ सभी चुनें ({historyWorks.length})
                          </button>

                          {/* 6. Deselect All */}
                          <button
                            type="button"
                            onClick={handleDeselectAllHistoryWorks}
                            className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 cursor-pointer"
                          >
                            🚫 सब हटाएं
                          </button>
                        </div>
                      </div>

                      {/* History Works Grid (Displayed in reverse order so latest #19, #18 are at top) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[30rem] overflow-y-auto pr-1">
                        {[...historyWorks].reverse().map((work) => {
                          const isSelected = selectedHistoryIds.includes(work.id);
                          return (
                            <div
                              key={work.id}
                              onClick={() => handleToggleHistoryWork(work.id)}
                              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 select-none ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-400/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                                  }`}>
                                    <span>{isSelected ? '✓' : '○'}</span>
                                    <span>काम #{work.workNumber}</span>
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {work.dateLabel || work.date}
                                  </span>
                                </div>

                                <h6 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                                  {work.title || work.subjectName}
                                </h6>

                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                    📚 {work.subjectName || 'सामान्य'}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {work.parsedQuestions.length} सवाल उपलब्ध
                                  </span>
                                </div>
                              </div>

                              <div className="pt-2.5 border-t border-black/5 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={(e) => handleSelectOnlyHistoryWork(work.id, e)}
                                  className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                                  title={`सिर्फ काम #${work.workNumber} चुनें`}
                                >
                                  <span>⭐ सिर्फ यह काम</span>
                                </button>
                                <span className={`text-xs font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                  {isSelected ? 'चुना गया है ✓' : 'क्लिक करके चुनें'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Selected History Works Question Preview */}
                      {selectedHistoryIds.length > 0 && (
                        <div className="pt-3 border-t border-slate-200/80 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h6 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                              <span>📋 चुने गए पिछले काम के सवाल (टेस्ट में शामिल होंगे):</span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                {historyWorks
                                  .filter((w) => selectedHistoryIds.includes(w.id))
                                  .reduce((acc, w) => acc + w.parsedQuestions.length, 0)}{' '}
                                सवाल तैयार हैं
                              </span>
                            </h6>
                          </div>

                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {historyWorks
                              .filter((w) => selectedHistoryIds.includes(w.id))
                              .map((work) => (
                                <div
                                  key={work.id}
                                  className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2"
                                >
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1.5 border-b border-indigo-100/80">
                                    <span className="text-indigo-900 font-black">
                                      📁 काम #{work.workNumber}: {work.title || work.subjectName}
                                    </span>
                                    <span className="text-[11px] text-indigo-700">
                                      {work.parsedQuestions.length} सवाल
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    {work.parsedQuestions.map((pq, pIdx) => (
                                      <div
                                        key={pq.id || pIdx}
                                        className="text-xs text-slate-700 font-medium flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-slate-100"
                                      >
                                        <span className="font-bold text-indigo-600 shrink-0">
                                          {pIdx + 1}.
                                        </span>
                                        <span className="leading-snug">{pq.cleanText}</span>
                                      </div>
                                    ))}
                                    {work.parsedQuestions.length === 0 && (
                                      <div className="text-xs text-slate-500 italic p-1">
                                        इस काम के मुख्य अभ्यास से अभ्यास प्रश्न टेस्ट में तैयार किए जाएंगे।
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- SUB-VIEW 2: RAW PAGES VIEW --- */}
                  {(uploadSubTab === 'pages' || historyWorks.length === 0) && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {availableExamFiles.length > 0 && (
                        <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          {/* Search Bar + Presets */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative flex-1 min-w-[180px]">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                value={fileSearchQuery}
                                onChange={(e) => setFileSearchQuery(e.target.value)}
                                placeholder="🔍 पेज नंबर या नाम खोजें (उदा. 3, WhatsApp...)"
                                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-400"
                              />
                              {fileSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setFileSearchQuery('')}
                                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Presets Chips (Clean & Simple) */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={handleSelectAllFiles}
                                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                  selectedFileIds.length === availableExamFiles.length
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                                }`}
                              >
                                ⭐ सभी चुनें ({availableExamFiles.length})
                              </button>
                              <button
                                type="button"
                                onClick={handleInvertFileSelection}
                                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                                title="उल्टा चयन करें"
                              >
                                🔄 उल्टा
                              </button>
                              <button
                                type="button"
                                onClick={handleDeselectAllFiles}
                                className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 cursor-pointer"
                              >
                                🚫 सब हटाएं
                              </button>
                            </div>
                          </div>

                          {/* Quick Range Selection for 10+ / 17+ pages */}
                          {availableExamFiles.length >= 6 && (
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 flex-wrap text-xs text-slate-600">
                              <span className="font-bold text-[11px] text-slate-500">📑 त्वरित रेंज (Quick Range):</span>
                              <button
                                type="button"
                                onClick={() => handleSelectRangeFiles(1, 5)}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-300 hover:border-indigo-400 font-bold text-[11px] hover:text-indigo-600"
                              >
                                पेज 1 - 5
                              </button>
                              {availableExamFiles.length >= 10 && (
                                <button
                                  type="button"
                                  onClick={() => handleSelectRangeFiles(6, 10)}
                                  className="px-2 py-0.5 rounded-md bg-white border border-slate-300 hover:border-indigo-400 font-bold text-[11px] hover:text-indigo-600"
                                >
                                  पेज 6 - 10
                                </button>
                              )}
                              {availableExamFiles.length >= 15 && (
                                <button
                                  type="button"
                                  onClick={() => handleSelectRangeFiles(11, 15)}
                                  className="px-2 py-0.5 rounded-md bg-white border border-slate-300 hover:border-indigo-400 font-bold text-[11px] hover:text-indigo-600"
                                >
                                  पेज 11 - 15
                                </button>
                              )}
                              {availableExamFiles.length >= 16 && (
                                <button
                                  type="button"
                                  onClick={() => handleSelectRangeFiles(16, availableExamFiles.length)}
                                  className="px-2 py-0.5 rounded-md bg-white border border-slate-300 hover:border-indigo-400 font-bold text-[11px] hover:text-indigo-600"
                                >
                                  पेज 16 - {availableExamFiles.length}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                  {/* Empty State */}
                  {availableExamFiles.length === 0 ? (
                    <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center bg-slate-50">
                      <Upload className="w-10 h-10 text-slate-400 mb-2" />
                      <h6 className="text-sm font-bold text-slate-700">अभी कोई पेज उपलब्ध नहीं है</h6>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        अपनी कॉपी, किताब का पन्ना, या होमवर्क नोट्स का फोटो खींचें या अपलोड करें। AI उनसे टेस्ट पेपर तैयार करेगा!
                      </p>
                      <button
                        type="button"
                        onClick={() => modalFileInputRef.current?.click()}
                        className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>फोटो अपलोड करें</span>
                      </button>
                    </div>
                  ) : filteredAvailableFiles.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                      '{fileSearchQuery}' से मेल खाता कोई पेज नहीं मिला।{' '}
                      <button
                        type="button"
                        onClick={() => setFileSearchQuery('')}
                        className="text-indigo-600 font-bold underline ml-1"
                      >
                        सर्च रीसेट करें
                      </button>
                    </div>
                  ) : fileViewMode === 'compact' ? (
                    /* COMPACT LIST VIEW - BEST FOR 17+ FILES */
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-96 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10 font-bold">
                          <tr>
                            <th className="py-2.5 px-3 w-10">चुनें</th>
                            <th className="py-2.5 px-2 w-14">फोटो</th>
                            <th className="py-2.5 px-3">पेज विवरण</th>
                            <th className="py-2.5 px-3 text-center">सवाल</th>
                            <th className="py-2.5 px-3 text-right">त्वरित चयन</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAvailableFiles.map((f, idx) => {
                            const isSelected = selectedFileIds.includes(f.id);
                            const qCount = f.detectedQuestions?.length || 0;
                            return (
                              <tr
                                key={f.id}
                                onClick={() => handleToggleFileSelection(f.id)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected ? 'bg-indigo-50/70 hover:bg-indigo-50' : 'hover:bg-slate-50'
                                }`}
                              >
                                <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleFileSelection(f.id)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  {f.url ? (
                                    <img
                                      src={f.url}
                                      alt={f.name}
                                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-slate-100"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-slate-400" />
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-black text-slate-900 truncate max-w-xs">{f.name}</div>
                                  <div className="text-[10px] text-slate-500 truncate">
                                    {f.chapterTitle || `पेज #${idx + 1}`}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {qCount > 0 ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                      {qCount} सवाल
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={(e) => handleSelectOnlyFile(f.id, e)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                      isSelected && selectedFileIds.length === 1
                                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                                        : 'bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-800 border border-slate-200'
                                    }`}
                                    title="बाकी सभी को हटाकर केवल इस पेज से टेस्ट बनाएं"
                                  >
                                    ⭐ सिर्फ यह चुनें
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* GRID VIEW WITH "ONLY THIS" BUTTON ON EVERY CARD */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[28rem] overflow-y-auto pr-1">
                      {filteredAvailableFiles.map((f, idx) => {
                        const isSelected = selectedFileIds.includes(f.id);
                        const qCount = f.detectedQuestions?.length || 0;
                        return (
                          <div
                            key={f.id}
                            onClick={() => handleToggleFileSelection(f.id)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 select-none ${
                              isSelected
                                ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 shadow-sm ring-2 ring-indigo-400/30'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleFileSelection(f.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 mt-1 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                              />
                              {f.url ? (
                                <img
                                  src={f.url}
                                  alt={f.name}
                                  className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-slate-100 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-black truncate">{f.name}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                  {f.chapterTitle || `पेज #${idx + 1}`}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  {qCount > 0 ? (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                      {qCount} सवाल उपलब्ध
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px]">
                                      {f.sourceType === 'history' ? 'पिछला काम' : f.sourceType === 'custom_upload' ? 'नया अपलोड' : 'सत्र पेज'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Bar with "Select Only This" */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100/80" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[10px] text-slate-400 font-medium">
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleSelectOnlyFile(f.id, e)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  isSelected && selectedFileIds.length === 1
                                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-800 border border-slate-200'
                                }`}
                                title="बाकी सभी को हटाकर केवल इस पेज से टेस्ट बनाएं"
                              >
                                ⭐ सिर्फ यह
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Interactive Question Inspector & Selector ("konnsa question dena h") */}
                  {selectedFileIds.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h6 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span>📋 पहचाने गए सवाल (चुनें कि कौन-से टेस्ट में देने हैं):</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {selectedFileIds.reduce(
                                (acc, fid) =>
                                  acc +
                                  (fileQuestionsMap[fid]?.filter((q) => q.selected).length || 0),
                                0
                              )}{' '}
                              सवाल चुने गए
                            </span>
                          </h6>
                          <p className="text-[11px] text-slate-500">
                            AI ने आपके पन्नों से सवाल पहचान लिए हैं। जिसे टेस्ट में देना है उस पर टिक (✓) रखें, बाकियों को हटा सकते हैं।
                          </p>
                        </div>
                      </div>

                      {/* Scanning Banner */}
                      {isScanningFiles && (
                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-2.5 animate-pulse">
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold">AI पेज को ध्यान से पढ़ रहा है...</span>{' '}
                            <span className="text-[11px] text-indigo-700">
                              सवालों और अभ्यासों की पहचान की जा रही है...
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {selectedFileIds.map((fileId) => {
                          const f = availableExamFiles.find((item) => item.id === fileId);
                          if (!f) return null;
                          const qList = fileQuestionsMap[fileId] || [];
                          const selCount = qList.filter((q) => q.selected).length;
                          const totalMarks = qList
                            .filter((q) => q.selected)
                            .reduce((acc, q) => acc + q.marks, 0);

                          return (
                            <div
                              key={fileId}
                              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  {f.url ? (
                                    <img
                                      src={f.url}
                                      alt={f.name}
                                      className="w-7 h-7 object-cover rounded-md border border-slate-200"
                                    />
                                  ) : (
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                  )}
                                  <span className="text-xs font-black text-slate-800">
                                    {f.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    ({selCount}/{qList.length} चुने • {totalMarks} अंक)
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectAllQuestions(fileId)}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 px-2 py-0.5 rounded bg-white border border-indigo-200 cursor-pointer"
                                  >
                                    सभी चुनें
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeselectAllQuestions(fileId)}
                                    className="text-[10px] font-bold text-slate-600 hover:text-slate-700 px-2 py-0.5 rounded bg-white border border-slate-200 cursor-pointer"
                                  >
                                    सभी हटाएं
                                  </button>
                                  {f.url && (
                                    <button
                                      type="button"
                                      onClick={() => handleRescanFile(f)}
                                      disabled={isScanningFiles}
                                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-0.5 rounded bg-white border border-emerald-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      title="AI से इस पेज को दोबारा स्कैन करवाएं"
                                    >
                                      <RefreshCw
                                        className={`w-3 h-3 ${isScanningFiles ? 'animate-spin' : ''}`}
                                      />
                                      <span>पुनः स्कैन</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {qList.length === 0 ? (
                                <div className="py-3 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-200">
                                  <span>इस पेज पर अभी कोई सवाल नहीं मिला। </span>
                                  <span className="font-bold text-indigo-600">
                                    ऊपर 'पुनः स्कैन' दबाएं या नीचे नया सवाल जोड़ें।
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {qList.map((item, qIdx) => {
                                    const isEditing = editingQuestionId === item.id;
                                    return (
                                      <div
                                        key={item.id}
                                        className={`p-2 rounded-lg border transition-all flex items-start gap-2 ${
                                          item.selected
                                            ? 'bg-white border-emerald-300 text-slate-900 shadow-2xs'
                                            : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-60'
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => handleToggleQuestion(fileId, item.id)}
                                          className="mt-0.5 shrink-0 cursor-pointer focus:outline-hidden"
                                        >
                                          {item.selected ? (
                                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                                          ) : (
                                            <Square className="w-4 h-4 text-slate-400" />
                                          )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                            <span className="text-[10px] font-black text-slate-500">
                                              Q.{qIdx + 1}
                                            </span>
                                            <span
                                              className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                                item.type === 'mcq'
                                                  ? 'bg-amber-100 text-amber-800'
                                                  : item.type === 'solve'
                                                  ? 'bg-purple-100 text-purple-800'
                                                  : 'bg-blue-100 text-blue-800'
                                              }`}
                                            >
                                              {item.type === 'mcq'
                                                ? 'MCQ • 1 अंक'
                                                : item.type === 'solve'
                                                ? 'विस्तृत हल • 5 अंक'
                                                : 'लघु उत्तरीय • 2 अंक'}
                                            </span>
                                          </div>

                                          {isEditing ? (
                                            <div className="flex items-center gap-1.5 mt-1">
                                              <input
                                                type="text"
                                                value={editingQuestionText}
                                                onChange={(e) =>
                                                  setEditingQuestionText(e.target.value)
                                                }
                                                className="flex-1 p-1 rounded border border-indigo-400 text-xs font-medium text-slate-900 bg-white"
                                                autoFocus
                                              />
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleSaveEditQuestion(fileId, item.id)
                                                }
                                                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold"
                                              >
                                                सेव
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingQuestionId(null)}
                                                className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                                              >
                                                रद्द
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="text-xs font-medium leading-relaxed">
                                              {item.cleanText}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                          {!isEditing && (
                                            <button
                                              type="button"
                                              onClick={() => handleStartEditQuestion(item)}
                                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                              title="सवाल बदलें"
                                            >
                                              <Edit3 className="w-3 h-3" />
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteQuestion(fileId, item.id)}
                                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                            title="यह सवाल हटाएं"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              <div className="pt-1.5 flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="इस पेज से कोई सवाल जोड़ें..."
                                  value={newQuestionInputs[fileId] || ''}
                                  onChange={(e) =>
                                    setNewQuestionInputs((prev) => ({
                                      ...prev,
                                      [fileId]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddQuestion(fileId);
                                    }
                                  }}
                                  className="flex-1 p-1.5 rounded-lg border border-slate-200 text-xs bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddQuestion(fileId)}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>जोड़ें</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* End of Sub-View 2: Raw Pages */}
                    </div>
                  )}
                </div>
              )}

              {/* 3. SYLLABUS & CHAPTER SELECTION (When 'chapters' or 'both' mode active) */}
              {(testSourceMode === 'chapters' || testSourceMode === 'both') && (
                <>
                  {/* Subject Selection Tabs */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      {testSourceMode === 'both' ? '2. विषय चुनें (Select Subject):' : 'विषय चुनें (Select Subject):'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                      {subjects.map((sub) => {
                        const isSelected = sub.id === selectedSubjectId;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setSelectedSubjectId(sub.id)}
                            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{sub.emoji}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </div>
                            <div className="mt-2">
                              <div className="text-xs font-black line-clamp-1">
                                {sub.subjectHindi || sub.subject}
                              </div>
                              <div
                                className={`text-[10px] mt-0.5 ${
                                  isSelected ? 'text-indigo-200' : 'text-slate-500'
                                }`}
                              >
                                {sub.chapters?.length || 0} अध्याय • {sub.teacherName}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Multiple Chapter Selection Checkboxes */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                      <div>
                        <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <span>{activeSubject?.subjectHindi || activeSubject?.subject} के चैप्टर्स चुनें</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                            {selectedChapterNumbers.length} चुने गए
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          मल्टीपल चैप्टर्स चुन सकते हैं (उदा. अध्याय 3 और 4 दोनों एक साथ)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllChapters}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200"
                        >
                          सभी चुनें
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllChapters}
                          className="text-xs font-bold text-slate-600 hover:text-slate-700 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200"
                        >
                          रीसेट
                        </button>
                      </div>
                    </div>

                    {/* Chapter list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {activeSubject?.chapters?.map((ch) => {
                        const isChecked = selectedChapterNumbers.includes(ch.chapterNumber);
                        return (
                          <label
                            key={ch.id}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                              isChecked
                                ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleChapter(ch.chapterNumber)}
                              className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-black flex items-center gap-1.5">
                                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px]">
                                  अध्याय {ch.chapterNumber}
                                </span>
                                <span className="truncate">{ch.titleHindi || ch.titleEnglish}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {ch.concepts?.slice(0, 2).join(' • ') || 'महत्वपूर्ण अवधारणाएं'}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Bottom Generate Action Button */}
              {(() => {
                const selHistoryWorks = historyWorks.filter((w) => selectedHistoryIds.includes(w.id));
                const selHistoryQCount = selHistoryWorks.reduce(
                  (acc, w) => acc + (w.parsedQuestions.length > 0 ? w.parsedQuestions.length : 1),
                  0
                );
                const selHistoryMarks = selHistoryWorks.reduce(
                  (acc, w) =>
                    acc +
                    (w.parsedQuestions.length > 0
                      ? w.parsedQuestions.reduce((m, q) => m + q.marks, 0)
                      : 5),
                  0
                );

                const selFileQCount = selectedFileIds.reduce(
                  (acc, fid) =>
                    acc + (fileQuestionsMap[fid]?.filter((q) => q.selected).length || 0),
                  0
                );
                const selFileMarks = selectedFileIds.reduce(
                  (acc, fid) =>
                    acc +
                    (fileQuestionsMap[fid]
                      ?.filter((q) => q.selected)
                      .reduce((m, q) => m + q.marks, 0) || 0),
                  0
                );

                const totalUploadedOrHistoryQCount = selHistoryQCount + selFileQCount;
                const totalUploadedOrHistoryMarks = selHistoryMarks + selFileMarks;
                const hasAnyUploadedOrHistory =
                  selectedHistoryIds.length > 0 || selectedFileIds.length > 0;

                const isGenerateDisabled =
                  (testSourceMode === 'chapters' && selectedChapterNumbers.length === 0) ||
                  (testSourceMode === 'uploaded' &&
                    (!hasAnyUploadedOrHistory || totalUploadedOrHistoryQCount === 0)) ||
                  (testSourceMode === 'both' &&
                    selectedChapterNumbers.length === 0 &&
                    (!hasAnyUploadedOrHistory || totalUploadedOrHistoryQCount === 0));

                return (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleGenerateExam}
                      disabled={isGenerateDisabled}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <FileText className="w-5 h-5" />
                      <span>
                        {testSourceMode === 'uploaded'
                          ? `चुने गए ${totalUploadedOrHistoryQCount} सवालों से टेस्ट बनाएं (${totalUploadedOrHistoryMarks} अंक) →`
                          : testSourceMode === 'both'
                          ? `अध्याय + ${totalUploadedOrHistoryQCount} काम/पेज सवालों से कंबाइंड टेस्ट बनाएं →`
                          : 'व्हाइट पेपर टेस्ट पेपर तैयार करें (Generate Test Paper) →'}
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ================= TAB 2: EXAM PAPER (WHITE PAPER + TYPING & UPLOAD) ================= */}
          {activeTab === 'exam' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Exam Options & Mode Selector Bar (Hidden in Print) */}
              <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700">परीक्षा देने का तरीका:</span>
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setExamMode('typing')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                        examMode === 'typing'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>⌨️ ऑनलाइन टाइपिंग</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamMode('upload')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                        examMode === 'upload'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>🖨️ प्रिंट निकालें व कॉपी अपलोड करें</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* ⏱️ 40-Minute Countdown Timer Badge */}
                  <div
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-black shadow-xs transition-all ${
                      examTimeLeft <= 300
                        ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                        : examTimeLeft <= 600
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    }`}
                    title="40 मिनट पूरे होते ही परीक्षा अपने-आप सबमिट हो जाएगी"
                  >
                    <Clock className={`w-4 h-4 ${examTimeLeft <= 300 ? 'text-rose-600 animate-spin' : 'text-emerald-600'}`} />
                    <span className="tabular-nums font-mono text-sm">
                      ⏱️ {formatExamTimer(examTimeLeft)}
                    </span>
                    <span className="text-[10px] font-bold opacity-80">(40 मिनट ऑटो-सबमिट)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrintTestPaper}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>प्रिंट पेपर (A4 PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('configure')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>चैप्टर बदलें</span>
                  </button>
                </div>
              </div>

              {/* 🖨️ AUTHENTIC WHITE PAPER TEST SHEET */}
              <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-md border border-slate-200 font-serif space-y-6 print:border-none print:shadow-none print:p-0 print:m-0">
                {/* Official School Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <div className="text-xs uppercase tracking-widest font-sans font-bold text-slate-500">
                    {board} बोर्ड पाठ्यक्रमानुसार • परीक्षा सत्र 2026-27
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                    राजकीय प्राथमिक एवं उच्च प्राथमिक विद्यालय
                  </h2>
                  <h3 className="text-sm sm:text-base font-bold text-indigo-950 font-sans">
                    साप्ताहिक मूल्यांकन टेस्ट परीक्षा (Practice Test Paper)
                  </h3>
                  <div className="flex items-center justify-between text-xs font-bold pt-2 px-1 font-sans border-t border-slate-200 mt-2 text-slate-700">
                    <span>विषय: {activeSubject?.subjectHindi || activeSubject?.subject}</span>
                    <span>{className}</span>
                    <span>समय: 45 मिनट</span>
                    <span>पूर्णांक (Max Marks): {totalExamMarks}</span>
                  </div>
                </div>

                {/* Student Details Sheet Box */}
                <div className="border border-slate-800 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold bg-slate-50 font-sans gap-2 print:bg-transparent">
                  <div>
                    छात्र का नाम: <span className="font-mono text-sm underline decoration-dotted">{activeStudentName}</span>
                  </div>
                  <div>रोल नंबर: [ .................... ]</div>
                  <div>दिनांक: {new Date().toLocaleDateString('hi-IN')}</div>
                  <div>
                    सिलेबस / स्रोत:{' '}
                    <span className="text-indigo-700">
                      {testSourceMode === 'uploaded'
                        ? `अपलोड किए गए ${selectedFileIds.length} पेज`
                        : testSourceMode === 'both'
                        ? `अध्याय ${selectedChapterNumbers.join(', ')} + ${selectedFileIds.length} अपलोड पेज`
                        : `अध्याय ${selectedChapterNumbers.join(', ')}`}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-[11px] text-slate-600 font-sans bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60 print:hidden">
                  <span className="font-bold text-amber-900">निर्देश:</span> सभी प्रश्न हल करना अनिवार्य है। दाहिनी ओर अंक दिए गए हैं। आप नीचे सीधे टाइप कर सकते हैं या ऊपर &quot;प्रिंट पेपर&quot; दबाकर पेन से हल कर फोटो अपलोड कर सकते हैं।
                </div>

                {/* QUESTIONS LISTING */}
                <div className="space-y-6">
                  {generatedQuestions.map((q, idx) => {
                    const studentAns = typedAnswers[q.id] || '';
                    const isAnswered = studentAns.trim().length > 0;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border transition-all ${
                          examMode === 'typing' && activeQuestionIndex === idx
                            ? 'border-indigo-400 bg-indigo-50/20 shadow-xs'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        {/* Question Meta Header */}
                        <div className="flex items-center justify-between text-xs font-sans pb-2 border-b border-slate-100 gap-2">
                          <div className="flex items-center gap-1.5 font-bold flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px]">
                              प्रश्न {idx + 1}
                            </span>
                            <span className="text-indigo-700 text-[11px]">{q.sectionTitle}</span>
                            {q.sourceTag ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                                📸 {q.sourceTag}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px] hidden sm:inline">
                                (अध्याय {q.chapterNumber}: {q.chapterTitle})
                              </span>
                            )}
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[11px] shrink-0">
                            [{q.marks} अंक]
                          </span>
                        </div>

                        {/* Question Text */}
                        <div className="pt-2.5 text-sm sm:text-base font-semibold leading-relaxed text-slate-900 font-serif">
                          {q.question}
                        </div>

                        {/* MCQ OPTIONS DISPLAY */}
                        {q.type === 'mcq' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 font-sans">
                            {q.options.map((opt, optIdx) => {
                              const letters = ['(क)', '(ख)', '(ग)', '(घ)'];
                              const isSelected = studentAns === opt || studentAns === letters[optIdx];
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => {
                                    setTypedAnswers((prev) => ({ ...prev, [q.id]: opt }));
                                  }}
                                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-2 ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="font-bold opacity-80">{letters[optIdx]}</span>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* TYPING INPUT BOX (Shown when in Typing Mode and for Fill / Solve questions) */}
                        {examMode === 'typing' && q.type !== 'mcq' && (
                          <div className="mt-3 space-y-2 font-sans print:hidden">
                            {/* Rich Toolbar: Voice Typing + Math Symbols */}
                            <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-t-xl border border-b-0 border-slate-200 flex-wrap gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-bold text-slate-600 mr-1">
                                  गणित चिन्ह:
                                </span>
                                {['+', '-', '×', '÷', '=', '₹', '½', '²', '√', '°'].map((sym) => (
                                  <button
                                    key={sym}
                                    type="button"
                                    onClick={() => handleInsertSymbol(q.id, sym)}
                                    className="px-2 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-800 font-bold text-xs hover:border-indigo-400"
                                    title={`जोड़ें ${sym}`}
                                  >
                                    {sym}
                                  </button>
                                ))}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleVoiceTyping(q.id)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                    isVoiceListening
                                      ? 'bg-rose-600 text-white animate-pulse'
                                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                  }`}
                                  title="बोलकर टाइप करें (Hindi/English Voice Typing)"
                                >
                                  {isVoiceListening ? (
                                    <>
                                      <MicOff className="w-3.5 h-3.5" /> <span>सुन रहा हूँ...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Mic className="w-3.5 h-3.5" /> <span>बोलकर लिखें</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Main Typing Textarea */}
                            <textarea
                              rows={q.type === 'solve' ? 4 : 2}
                              value={studentAns}
                              onChange={(e) =>
                                setTypedAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                              }
                              placeholder={
                                q.type === 'solve'
                                  ? 'यहाँ अपना चरणबद्ध हल (Step-by-step) टाइप करें...'
                                  : 'यहाँ सही उत्तर लिखें...'
                              }
                              className="w-full p-3 rounded-b-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400"
                            />
                          </div>
                        )}

                        {/* Print Lines (Printed sheets have blank lines to write with pen) */}
                        <div className="hidden print:block pt-4 space-y-3 font-mono text-slate-300">
                          <div className="border-b border-dashed border-slate-400 h-6"></div>
                          {q.type === 'solve' && (
                            <>
                              <div className="border-b border-dashed border-slate-400 h-6"></div>
                              <div className="border-b border-dashed border-slate-400 h-6"></div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Signatures Row */}
                <div className="pt-6 border-t-2 border-slate-900 flex items-center justify-between text-xs font-bold font-sans">
                  <div>अभिभावक (Parent) के हस्ताक्षर: ....................</div>
                  <div>जांचकर्ता शिक्षक: विद्या AI मेंटर</div>
                  <div>प्राप्तांक: ............ / {totalExamMarks}</div>
                </div>
              </div>

              {/* UPLOAD MANUAL HANDWRITTEN COPY SECTION (Shown when examMode === 'upload') */}
              {examMode === 'upload' && (
                <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-md space-y-4 print:hidden">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">📸</span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        हाथ से लिखी उत्तर-पुस्तिका (कॉपी) का फोटो अपलोड करें
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        आपने जो पेपर प्रिंट करके पेन से हल किया है, उसके पृष्ठों की फोटो खींचकर यहाँ जोड़ें। AI शिक्षक तुरंत जांच कर अंक देगा!
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />

                  {/* Upload Drop Area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-indigo-50/30 hover:bg-indigo-50/70"
                  >
                    <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-800">
                      क्लिक करके फोटो अपलोड करें या कैमरा चालू करें
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      (PNG, JPG, JPEG - एक से अधिक पृष्ठ जोड़ सकते हैं)
                    </p>
                  </div>

                  {/* Uploaded Previews Grid */}
                  {uploadedImages.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-black text-slate-700">
                        अपलोड किए गए पृष्ठ ({uploadedImages.length}):
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {uploadedImages.map((img, i) => (
                          <div
                            key={i}
                            className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-3/4 shadow-2xs"
                          >
                            <img
                              src={img}
                              alt={`Page ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(i);
                                }}
                                className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 shadow"
                                title="हटाएं"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-bold">
                              पेज {i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BOTTOM SUBMISSION ACTION BAR (Hidden in print) */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl print:hidden">
                <div className="text-xs">
                  <div className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {examMode === 'typing'
                        ? `कुल ${generatedQuestions.length} में से ${
                            Object.values(typedAnswers).filter((a) => a.trim().length > 0).length
                          } प्रश्न हल किए गए`
                        : `${uploadedImages.length} कॉपी पृष्ठ अपलोड किए गए`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold ${
                      examTimeLeft <= 300
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : examTimeLeft <= 600
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      ⏱️ {formatExamTimer(examTimeLeft)} शेष (40 मिनट बाद स्वतः सबमिट)
                    </span>
                    <span className="text-[11px] text-slate-400">सबमिट करते ही AI शिक्षक द्वारा अंकों की जांच व रिज़ल्ट तैयार होगा।</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmitTest(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI कॉपी जांच रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      <span>परीक्षा जमा करें और रिज़ल्ट देखें →</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 3: RESULT & REPORT CARD ================= */}
          {activeTab === 'result' && currentResult && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Top Result Banner */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 text-center sm:text-left">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 inline-block">
                      {currentResult.badge}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black">
                      साप्ताहिक रविवार टेस्ट रिज़ल्ट कार्ड
                    </h3>
                    <p className="text-xs text-indigo-200">
                      {currentResult.subjectName} • {currentResult.classGrade} • {currentResult.dateLabel}
                    </p>
                    <p className="text-xs text-indigo-100 max-w-md pt-1 italic">
                      &quot;{currentResult.teacherFeedback}&quot;
                    </p>
                  </div>

                  {/* Score Circle Card */}
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0 min-w-36">
                    <div className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold">
                      कुल प्राप्तांक
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-amber-300 mt-1">
                      {currentResult.obtainedMarks} / {currentResult.totalMaxMarks}
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-white">
                        {currentResult.percentage}%
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950">
                        ग्रेड {currentResult.grade}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Exact WhatsApp Report Card Share requested by user */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = `🏆 विद्या AI ट्यूशन रिपोर्ट कार्ड:\nआज ${currentResult.studentName} (${currentResult.classGrade}) ने ${currentResult.subjectName} के टेस्ट में ${currentResult.obtainedMarks} में से ${currentResult.totalMaxMarks} अंक (${currentResult.percentage}% - Grade ${currentResult.grade}) प्राप्त किए! ⭐ ${currentResult.obtainedMarks} संडे स्टार्स जीते।\n(घर बैठे सिर्फ ₹200/माह में सभी विषयों की संपूर्ण ट्यूशन - vidyatuition.com)`;
                      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="text-sm">📲</span>
                    <span>मम्मी-पापा को WhatsApp पर रिपोर्ट भेजें</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintTestPaper}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span>रिज़ल्ट कार्ड प्रिंट करें</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <span>📊 टेस्ट हिस्ट्री देखें</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('configure')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>नया टेस्ट दें</span>
                  </button>
                </div>
              </div>

              {/* Detailed Question-by-Question Evaluation Review */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>प्रश्नानुसार विस्तृत समाधान एवं अंक (Step-by-Step Analysis)</span>
                  <span className="text-xs font-normal text-slate-500">
                    {currentResult.questionEvaluations.length} प्रश्न
                  </span>
                </h4>

                <div className="space-y-4">
                  {currentResult.questionEvaluations.map((evalItem, idx) => (
                    <div
                      key={evalItem.questionId || idx}
                      className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                        evalItem.isCorrect
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : evalItem.marksAwarded > 0
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              evalItem.isCorrect
                                ? 'bg-emerald-600 text-white'
                                : evalItem.marksAwarded > 0
                                ? 'bg-amber-500 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            Q{idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 line-clamp-1">
                            {evalItem.question}
                          </span>
                        </div>

                        <span className="px-2.5 py-1 rounded-full font-black text-xs shrink-0 bg-white border shadow-2xs">
                          {evalItem.marksAwarded} / {evalItem.maxMarks} अंक
                        </span>
                      </div>

                      {/* Answers Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans">
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            छात्र का उत्तर:
                          </span>
                          <span className="font-medium text-slate-900 mt-0.5 block">
                            {evalItem.studentAnswer || '(अनुत्तरित)'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-200">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase block">
                            आदर्श / सही उत्तर:
                          </span>
                          <span className="font-medium text-indigo-950 mt-0.5 block">
                            {evalItem.correctAnswer}
                          </span>
                        </div>
                      </div>

                      {/* Teacher Note & Explanation */}
                      <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 space-y-1">
                        <div>
                          <span className="font-bold text-indigo-700">{medium === 'english' ? 'Teacher Review: ' : 'शिक्षक समीक्षा: '}</span>
                          <span>{evalItem.teacherNote}</span>
                        </div>
                        {evalItem.explanation && (
                          <div className="text-slate-500">
                            <span className="font-semibold">{medium === 'english' ? 'Explanation: ' : 'व्याख्या: '}</span>
                            <span>{evalItem.explanation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: TEST HISTORY & SCORES ================= */}
          {activeTab === 'history' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Overall Score Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-500">कुल दिए गए टेस्ट</div>
                  <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
                    {testHistory.length}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-500">सर्वश्रेष्ठ स्कोर</div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                    {testHistory.length > 0
                      ? `${Math.max(...testHistory.map((h) => h.percentage))}%`
                      : '0%'}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-500">औसत प्रतिशत</div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-1">
                    {testHistory.length > 0
                      ? `${Math.round(
                          testHistory.reduce((acc, h) => acc + h.percentage, 0) / testHistory.length
                        )}%`
                      : '0%'}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-500">कुल संडे सितारे</div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
                    {testHistory.reduce((acc, h) => acc + (h.obtainedMarks || 0), 0)} ⭐
                  </div>
                </div>
              </div>

              {/* History Records List */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>साप्ताहिक टेस्ट इतिहास (Past Tests)</span>
                  </h4>

                  {testHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('क्या आप टेस्ट इतिहास साफ़ करना चाहते हैं?')) {
                          setTestHistory([]);
                          localStorage.removeItem(STORAGE_KEY);
                          const savedUser = localStorage.getItem('student_user');
                          if (savedUser) {
                            try {
                              const u = JSON.parse(savedUser);
                              if (u.phone || u.id) {
                                fetch('/api/student/records', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    phone: u.phone,
                                    studentId: u.id,
                                    testHistory: [],
                                  }),
                                }).catch(() => {});
                              }
                            } catch {}
                          }
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                    >
                      इतिहास साफ़ करें
                    </button>
                  )}
                </div>

                {testHistory.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <span className="text-4xl">📝</span>
                    <div className="text-sm font-bold text-slate-700">अभी तक कोई टेस्ट नहीं दिया गया है।</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      अध्याय 3 व 4 या किसी भी अध्याय का चयन करके पहला टेस्ट दें!
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('configure')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                    >
                      पहला टेस्ट शुरू करें →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {testHistory.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              {rec.subjectName}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              {rec.selectedChapters?.map((c) => `Ch ${c.chapterNumber}`).join(', ') || 'टेस्ट'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {rec.mode === 'typing' ? '⌨️ ऑनलाइन टाइपिंग' : '📸 कॉपी फोटो'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {rec.dateLabel} • {rec.badge}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-black text-slate-900">
                              {rec.obtainedMarks} / {rec.totalMaxMarks} अंक
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600">
                              {rec.percentage}% (ग्रेड {rec.grade})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setCurrentResult(rec);
                              setActiveTab('result');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-2xs"
                          >
                            परिणाम देखें
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
