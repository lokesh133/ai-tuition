'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import { getCurriculum, Chapter, SubjectCurriculum } from '@/lib/curriculum-data';

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
}

const STORAGE_KEY = 'vidya_sunday_test_history_v1';

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
}: SundayTestSeriesModalProps) {
  // Navigation tabs in modal: 'configure' | 'exam' | 'result' | 'history'
  const [activeTab, setActiveTab] = useState<'configure' | 'exam' | 'result' | 'history'>('configure');

  // Subjects & Chapters Selection State
  const subjects = useMemo(() => {
    return getCurriculum(board, className, medium);
  }, [board, className, medium]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    return initialSubjectId || subjects[0]?.id || 'c4-math';
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
  }, []);

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

  // 1. GENERATE TEST PAPER FROM SELECTED CHAPTERS
  const handleGenerateExam = () => {
    if (!activeSubject || selectedChapterNumbers.length === 0) return;

    const chosenChapters = activeSubject.chapters.filter((c) =>
      selectedChapterNumbers.includes(c.chapterNumber)
    );

    const questions: TestQuestion[] = [];
    let qIdCounter = 1;

    // Collect Section A: MCQs (1 Mark each)
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
        });
      });

      // If chapter doesn't have MCQs, generate a conceptual MCQ
      if (mcqs.length === 0 && ch.concepts && ch.concepts.length > 0) {
        questions.push({
          id: `q_${qIdCounter++}`,
          chapterNumber: ch.chapterNumber,
          chapterTitle: ch.titleHindi || ch.titleEnglish,
          section: 'A',
          sectionTitle: "खंड 'क' : बहुविकल्पीय प्रश्न (Multiple Choice)",
          type: 'mcq',
          marks: 1,
          question: `${ch.titleHindi} का मुख्य नियम/विचार कौन सा है?`,
          options: [ch.concepts[0], 'उपरोक्त में से कोई नहीं', 'नियम 2', 'नियम 3'],
          correctAnswer: ch.concepts[0],
          explanation: `${ch.titleHindi} में मुख्य रूप से "${ch.concepts[0]}" सिखाया गया है।`,
        });
      }
    });

    // Collect Section B: Fill in blanks / Short Answers (2 Marks each)
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
        });
      });

      if (fills.length === 0 && ch.concepts && ch.concepts.length > 1) {
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
        });
      }
    });

    // Collect Section C: Long Answer / Step-by-Step Solve (5 Marks each)
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
        });
      }
    });

    // Calculate total marks
    const total = questions.reduce((acc, q) => acc + q.marks, 0);
    setTotalExamMarks(total);
    setGeneratedQuestions(questions);
    setTypedAnswers({});
    setActiveQuestionIndex(0);
    setUploadedImages([]);
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

  // 2. SUBMIT TEST & GET AI RESULT
  const handleSubmitTest = async () => {
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

    setIsSubmitting(true);

    try {
      const chosenChapters = activeSubject.chapters
        .filter((c) => selectedChapterNumbers.includes(c.chapterNumber))
        .map((c) => ({
          chapterNumber: c.chapterNumber,
          title: c.titleHindi || c.titleEnglish,
        }));

      const res = await fetch('/api/test/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative my-4 sm:my-6 flex flex-col max-h-[92vh] print:max-h-none print:m-0 print:shadow-none print:w-full print:rounded-none">
        {/* ================= MODAL HEADER (Hidden in Print) ================= */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-white/10 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black">
                  साप्ताहिक टेस्ट सीरीज़ (Test Series)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {board} • {className}
                </span>
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

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all ml-1"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
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

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 print:p-0 print:bg-white print:overflow-visible">
          {/* ================= TAB 1: CONFIGURE & SELECT CHAPTERS ================= */}
          {activeTab === 'configure' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Step Title */}
              <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-3.5">
                <span className="text-3xl">🎯</span>
                <div>
                  <h4 className="text-base font-black text-indigo-950">
                    विषय और चैप्टर्स (अध्याय) का चयन करें
                  </h4>
                  <p className="text-xs text-indigo-800/80 mt-0.5">
                    आप जितने चाहें उतने चैप्टर्स चुन सकते हैं (उदा. सिर्फ अध्याय 3 और 4, या 1 से 5 तक)। AI उन सभी अध्यायों से वास्तविक प्रश्न पत्र तैयार करेगा!
                  </p>
                </div>
              </div>

              {/* Subject Selection Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  1. विषय चुनें (Select Subject):
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
                      <span>2. {activeSubject?.subjectHindi || activeSubject?.subject} के चैप्टर्स चुनें</span>
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

              {/* Bottom Generate Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateExam}
                  disabled={selectedChapterNumbers.length === 0}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  <FileText className="w-5 h-5" />
                  <span>व्हाइट पेपर टेस्ट पेपर तैयार करें (Generate Test Paper) →</span>
                </button>
              </div>
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

                <div className="flex items-center gap-2">
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
                    छात्र का नाम: <span className="font-mono text-sm underline decoration-dotted">{studentName}</span>
                  </div>
                  <div>रोल नंबर: [ .................... ]</div>
                  <div>दिनांक: {new Date().toLocaleDateString('hi-IN')}</div>
                  <div>
                    सिलेबस:{' '}
                    <span className="text-indigo-700">
                      अध्याय {selectedChapterNumbers.join(', ')}
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
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px]">
                              प्रश्न {idx + 1}
                            </span>
                            <span className="text-indigo-700 text-[11px]">{q.sectionTitle}</span>
                            <span className="text-slate-400 text-[10px] hidden sm:inline">
                              (अध्याय {q.chapterNumber}: {q.chapterTitle})
                            </span>
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
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    सबमिट करते ही AI शिक्षक द्वारा अंकों की जांच व रिज़ल्ट तैयार होगा।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitTest}
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
                          <span className="font-bold text-indigo-700">शिक्षक समीक्षा: </span>
                          <span>{evalItem.teacherNote}</span>
                        </div>
                        {evalItem.explanation && (
                          <div className="text-slate-500">
                            <span className="font-semibold">व्याख्या: </span>
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
