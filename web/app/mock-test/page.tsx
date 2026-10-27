'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Check,
  RotateCcw,
  Sparkles,
  Loader2,
  ChevronDown,
  Pin,
  HelpCircle,
  Award,
  Sun,
  Moon,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { MathSymbolEditorToolbar } from '@/components/MathSymbolEditorToolbar';
import { MathPyramidWidget } from '@/components/MathPyramidWidget';

interface MockQuestionItem {
  question: string;
  idealAnswer?: string;
  options?: string[];
  type?: string;
  source?: string;
}

interface EvaluationResult {
  score: number;
  totalMarks?: number;
  percentage?: number;
  badge?: string;
  teacherPraise?: string;
  strengths?: string[];
  mistakes?: string[];
  spellingMistakes?: Array<{ wrong: string; correct: string }>;
  missingPoints?: string[];
  idealAnswer?: string;
}

// Fallback high-quality practice questions for standard mock test
const DEFAULT_MOCK_QUESTIONS: MockQuestionItem[] = [
  {
    question: '1. घटाव कीजिए (Subtract with borrow): 742 - 289 = ?',
    idealAnswer: '453',
    type: 'solve',
    source: 'Worksheet 19',
  },
  {
    question: '2. एक डिब्बे में 450 टॉफियाँ थीं। 175 टॉफियाँ बाँट दी गईं। अब डिब्बे में कितनी टॉफियाँ बचीं?',
    idealAnswer: '450 - 175 = 275 टॉफियाँ बचीं।',
    type: 'word_problem',
    source: 'Worksheet 19',
  },
  {
    question: '3. सही विकल्प चुनें (Choose correct option): 8 × 7 का मान क्या होगा? (a) 54 (b) 56 (c) 64 (d) 48',
    options: ['(a) 54', '(b) 56', '(c) 64', '(d) 48'],
    idealAnswer: '(b) 56',
    type: 'mcq',
    source: 'Worksheet 18',
  },
  {
    question: '4. संख्या पिरामिड पहेली हल करें (Solve the Number Pyramid where topmost is 50, and bottom row has 4 and 6).',
    idealAnswer: 'शीर्ष = 50, दूसरी पंक्ति = 28, 22, तीसरी पंक्ति = 16, 12, 10, निचली पंक्ति = 4, 12, 0, 6',
    type: 'pyramid',
    source: 'Worksheet 18',
  },
  {
    question: '5. संख्या 950 में 5 का स्थानीय मान (Place Value) क्या है? (a) 5 (b) 50 (c) 500 (d) 0',
    options: ['(a) 5', '(b) 50', '(c) 500', '(d) 0'],
    idealAnswer: '(b) 50',
    type: 'mcq',
    source: 'Practice Set',
  },
];

export default function WorksheetMockTestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [medium, setMedium] = useState<'hindi' | 'english'>('hindi');
  const [className, setClassName] = useState<string>('कक्षा 4');
  const [board, setBoard] = useState<string>('RBSE');
  const [subjectName, setSubjectName] = useState<string>('गणित (Mathematics)');
  const [teacherName, setTeacherName] = useState<string>('Sharma Sir');

  // Question & Answering State
  const [questionsList, setQuestionsList] = useState<MockQuestionItem[]>([]);
  const [activeMockQIdx, setActiveMockQIdx] = useState<number>(0);
  const [mockAnswers, setMockAnswers] = useState<Record<number, string>>({});
  const [mockEvaluations, setMockEvaluations] = useState<Record<number, EvaluationResult>>({});
  const [isEvaluatingMock, setIsEvaluatingMock] = useState<boolean>(false);
  const [isQuestionPinned, setIsQuestionPinned] = useState<boolean>(false);
  const [showMcqSteps, setShowMcqSteps] = useState<Record<number, boolean>>({});

  const mockAnswerTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 1. Load Session & Worksheet Data
  useEffect(() => {
    async function loadData() {
      try {
        let phone: string | null = null;
        let studentUser: any = null;

        if (typeof window !== 'undefined') {
          try {
            const rawUser = localStorage.getItem('ai_tuition_student_user') || localStorage.getItem('student_user');
            if (rawUser) {
              studentUser = JSON.parse(rawUser);
              if (studentUser.phone) phone = studentUser.phone;
              if (studentUser.className) setClassName(studentUser.className);
              if (studentUser.board) setBoard(studentUser.board);
              if (studentUser.medium) setMedium(studentUser.medium);
            }

            const rawTheme = localStorage.getItem('vidya_theme');
            if (rawTheme === 'dark') setIsDarkMode(true);

            // Read session data
            const rawSession = localStorage.getItem('vidya_current_session');
            if (rawSession) {
              const session = JSON.parse(rawSession);
              if (session.teacherName) setTeacherName(session.teacherName);
              const compiled = extractQuestionsFromSession(session);
              if (compiled.length > 0) {
                setQuestionsList(compiled);
                return;
              }
            }

            // Read worksheet history
            const rawHist = localStorage.getItem('vidya_worksheet_history_v1');
            if (rawHist) {
              const hist = JSON.parse(rawHist);
              if (Array.isArray(hist) && hist.length > 0) {
                const compiled = extractQuestionsFromHistory(hist);
                if (compiled.length > 0) {
                  setQuestionsList(compiled);
                  return;
                }
              }
            }
          } catch (e) {
            console.warn('LocalStorage parse error in mock test:', e);
          }
        }

        // Try API for saved student records
        if (phone) {
          try {
            const res = await fetch(`/api/student/records?phone=${phone}`);
            if (res.ok) {
              const json = await res.json();
              if (json.success && json.record) {
                const rec = json.record;
                if (rec.currentSession) {
                  const compiled = extractQuestionsFromSession(rec.currentSession);
                  if (compiled.length > 0) {
                    setQuestionsList(compiled);
                    return;
                  }
                }
                if (Array.isArray(rec.worksheetHistory) && rec.worksheetHistory.length > 0) {
                  const compiled = extractQuestionsFromHistory(rec.worksheetHistory);
                  if (compiled.length > 0) {
                    setQuestionsList(compiled);
                    return;
                  }
                }
              }
            }
          } catch (apiErr) {
            console.warn('API fetch error in mock test:', apiErr);
          }
        }

        // Fallback default questions if no session questions found
        setQuestionsList(DEFAULT_MOCK_QUESTIONS);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Helper to extract questions from session
  const extractQuestionsFromSession = (session: any): MockQuestionItem[] => {
    const list: MockQuestionItem[] = [];

    if (Array.isArray(session.whiteboardSteps) && session.whiteboardSteps.length > 0) {
      session.whiteboardSteps.forEach((step: any, idx: number) => {
        const isStoryOrVocab = Boolean(
          step.question?.startsWith('Story:') ||
          step.step?.toLowerCase().includes('reading passage') ||
          step.step?.toLowerCase().includes('पाठ वाचन') ||
          step.step?.toLowerCase().includes('शब्दार्थ') ||
          step.step?.toLowerCase().includes('vocabulary') ||
          step.step?.toLowerCase().includes('moral') ||
          step.step?.toLowerCase().includes('सीख') ||
          (step.formula && step.formula.length > 250)
        );
        if (isStoryOrVocab) return;

        const qText = step.question || step.step || `Question ${idx + 1}`;
        if (!list.some((item) => item.question === qText)) {
          const qLower = qText.toLowerCase();
          const isPyramid = qLower.includes('pyramid') || qLower.includes('पिरामिड');
          list.push({
            question: qText,
            idealAnswer: step.formula || undefined,
            type: isPyramid ? 'pyramid' : undefined,
            source: 'वर्कशीट सत्र',
          });
        }
      });
    }

    if (Array.isArray(session.detectedQuestions) && session.detectedQuestions.length > 0) {
      session.detectedQuestions.forEach((q: string) => {
        if (!list.some((item) => item.question === q)) {
          const qLower = q.toLowerCase();
          const isPyramid = qLower.includes('pyramid') || qLower.includes('पिरामिड');
          list.push({
            question: q,
            type: isPyramid ? 'pyramid' : undefined,
            source: 'डिटेक्टेड सवाल',
          });
        }
      });
    }

    return list;
  };

  // Helper to extract questions from worksheet history
  const extractQuestionsFromHistory = (hist: any[]): MockQuestionItem[] => {
    const list: MockQuestionItem[] = [];
    hist.slice(0, 3).forEach((item: any, hIdx: number) => {
      const sourceName = item.sheetTitle || `वर्कशीट #${hIdx + 1}`;
      if (Array.isArray(item.steps)) {
        item.steps.forEach((s: any, sIdx: number) => {
          const qText = s.question || s.step || `Question ${sIdx + 1}`;
          if (!list.some((existing) => existing.question === qText)) {
            const qLower = qText.toLowerCase();
            const isPyramid = qLower.includes('pyramid') || qLower.includes('पिरामिड');
            list.push({
              question: qText,
              idealAnswer: s.formula || undefined,
              type: isPyramid ? 'pyramid' : undefined,
              source: sourceName,
            });
          }
        });
      }
    });
    return list;
  };

  // TTS Speech helper
  const speakText = (text: string) => {
    if (isAudioMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_`]/g, '').trim();
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = medium === 'english' ? 'en-IN' : 'hi-IN';
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error in mock test:', e);
      setIsSpeaking(false);
    }
  };

  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
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

    const optSeqRegex = /(?:[\s,;]|^)(?:\(([a-dA-Dक-घ])\)|([a-dA-Dक-घ])\)|\[([a-dA-Dक-घ])\])\s+/g;
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

    let validMatches: Array<{ letter: string; index: number; fullLength: number }> = [];
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].letter === 'a' || matches[i].letter === 'क') {
        const candidate = [matches[i]];
        const expectedKeys = matches[i].letter === 'क' ? ['क', 'ख', 'ग', 'घ'] : ['a', 'b', 'c', 'd'];
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

    // Pipe-separated choices like "Estimate: 2000 g | 20 g | 200 g"
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

  // Helper to render blank placeholders in question prompt
  const renderMockQuestionBlank = (questionText: string, idealAnswer?: string) => {
    const blankBadge = (
      <span className="px-3 py-0.5 rounded-lg border-2 border-dashed border-amber-400 bg-amber-500/10 text-amber-500 font-mono text-xs sm:text-sm font-black mx-1 inline-block animate-pulse">
        ________
      </span>
    );

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

    return questionText;
  };

  // Evaluate student's typed Mock Test answer with teacher AI
  const handleSaveAndEvaluateMock = async (qIdx: number) => {
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
          teacher_id: 'sharma',
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
          speakText(praise);
        }
      }
    } catch (err) {
      console.error('Error evaluating mock answer:', err);
    } finally {
      setIsEvaluatingMock(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <span className="text-sm font-bold">🎯 वर्कशीट मॉक टेस्ट तैयार हो रहा है...</span>
        </div>
      </div>
    );
  }

  const activeItem = questionsList[activeMockQIdx] || questionsList[0];
  const studentAns = mockAnswers[activeMockQIdx] || '';
  const evalData = mockEvaluations[activeMockQIdx];

  const qTextLower = (activeItem?.question || '').toLowerCase();
  const isPyramidQuestion = Boolean(
    activeItem?.type === 'pyramid' ||
    qTextLower.includes('pyramid') ||
    qTextLower.includes('पिरामिड') ||
    (qTextLower.includes('topmost') && qTextLower.includes('row'))
  );
  const isPyramid2 = Boolean(
    qTextLower.includes('40') ||
    qTextLower.includes(' 9') ||
    qTextLower.includes(' 5') ||
    qTextLower.includes(' 7')
  );

  const mcqData = parseMCQOptions(activeItem?.question, activeItem?.options);
  const isMcq = Boolean(mcqData && mcqData.options && mcqData.options.length >= 2);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      {/* 1. TOP HEADER NAVIGATION */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors px-3 sm:px-6 py-2.5 ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200/90 shadow-2xs'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back to Tutor Classroom */}
          <div className="flex items-center gap-3">
            <Link
              href="/tutor"
              className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer hover:scale-105 active:scale-95 ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="डिजिटल क्लासरूम में वापस जाएं"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{medium === 'english' ? 'Back to Classroom' : '← क्लासरूम में वापस'}</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center text-base font-black shrink-0">
                🎯
              </span>
              <div>
                <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {medium === 'english' ? 'Worksheet Mock Test Arena' : 'वर्कशीट मॉक टेस्ट (Mock Test Arena)'}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold truncate">
                  {board} • {className} • {subjectName}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Link to Sunday Test Series & Controls */}
          <div className="flex items-center gap-2">
            {/* Link to Weekly Test Series */}
            <Link
              href="/test-series"
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer hover:scale-105 active:scale-95 ${
                isDarkMode
                  ? 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border-indigo-700'
                  : 'bg-indigo-50/90 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}
              title="साप्ताहिक टेस्ट सीरीज़ (25 Marks Exam) खोलें"
            >
              <span className="text-sm shrink-0">📝</span>
              <span className="font-extrabold">{medium === 'english' ? 'Weekly Test Series' : 'साप्ताहिक टेस्ट सीरीज़'}</span>
            </Link>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!isAudioMuted) {
                  stopAudio();
                  setIsAudioMuted(true);
                } else {
                  setIsAudioMuted(false);
                  speakText(medium === 'english' ? 'Sound is now ON' : 'ध्वनि चालू है');
                }
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                isAudioMuted
                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              }`}
              title={isAudioMuted ? 'Turn Sound ON' : 'Turn Sound OFF'}
            >
              {isAudioMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Sound OFF</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span className="hidden sm:inline">Sound ON</span>
                </>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all ${
                isDarkMode
                  ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Theme Toggle"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN MOCK TEST WORKSPACE */}
      <main className="max-w-5xl mx-auto p-3 sm:p-6 space-y-4">
        {/* Banner with Instructions */}
        <div className={`p-4 rounded-3xl border shadow-xs ${
          isDarkMode
            ? 'bg-gradient-to-r from-amber-950/40 via-indigo-950/30 to-slate-900 border-amber-500/30'
            : 'bg-gradient-to-r from-amber-50/90 via-indigo-50/50 to-white border-amber-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center text-xl font-black shrink-0">
                🎯
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {medium === 'english' ? 'Self-Practice & Evaluation Arena' : 'वर्कशीट मॉक टेस्ट एवं लाइव उत्तर जांच'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {medium === 'english'
                    ? 'Only questions are shown. Type or select your answer, click "Check Answer", and get instant AI grading out of 10!'
                    : 'यहाँ वर्कशीट के सवाल दिए गए हैं। उत्तर लिखें या विकल्प चुनें और "उत्तर चेक करें" दबाकर तुरंत AI शिक्षक से स्कोर व सुधार देखें!'}
                </p>
              </div>
            </div>

            {/* Total Badge & Progress */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                {medium === 'english'
                  ? `Total ${questionsList.length} Questions`
                  : `कुल ${questionsList.length} सवाल`}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                {Object.keys(mockEvaluations).length}/{questionsList.length} {medium === 'english' ? 'Checked' : 'जांचे गए'}
              </span>
            </div>
          </div>

          {/* Question Selector Tabs */}
          {questionsList.length > 1 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/80 dark:border-white/10 overflow-x-auto pb-1 scrollbar-none">
              {questionsList.map((item, qIdx) => {
                const isEvaluated = Boolean(mockEvaluations[qIdx]);
                const isCurrent = activeMockQIdx === qIdx;
                return (
                  <button
                    key={qIdx}
                    type="button"
                    onClick={() => setActiveMockQIdx(qIdx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : isEvaluated
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                        : isDarkMode
                        ? 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-400/50'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 shadow-2xs'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isCurrent
                        ? 'bg-slate-950 text-amber-300'
                        : isEvaluated
                        ? 'bg-emerald-500 text-white'
                        : isDarkMode
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-100 text-slate-600'
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

        {/* 3. ACTIVE QUESTION CARD */}
        {activeItem && (
          <div className="space-y-4">
            <div className={`p-4 sm:p-5 rounded-3xl border backdrop-blur-md transition-all ${
              isQuestionPinned ? 'sticky top-16 z-20 shadow-md ring-1 ring-amber-300' : 'relative shadow-xs'
            } ${isDarkMode
              ? 'bg-slate-900/95 border-amber-500/40 text-white shadow-xl'
              : 'bg-white/95 border-amber-300 text-slate-900 shadow-sm ring-1 ring-amber-100'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    {medium === 'english' ? `Question #${activeMockQIdx + 1}` : `प्रश्न #${activeMockQIdx + 1}`}
                  </span>
                  {activeItem.source && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {activeItem.source}
                    </span>
                  )}
                  {isMcq && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      MCQ ({mcqData?.options.length} {medium === 'english' ? 'Options' : 'विकल्प'})
                    </span>
                  )}
                  {isPyramidQuestion && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                      🔺 {medium === 'english' ? 'Pyramid Puzzle' : 'पिरामिड पहेली'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuestionPinned((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer border ${
                      isQuestionPinned
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs ring-1 ring-amber-300'
                        : isDarkMode
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                    title={isQuestionPinned ? 'स्क्रीन से अनपिन करें' : 'स्क्रीन पर फिक्स करें'}
                  >
                    <span>📌</span>
                    <span>
                      {isQuestionPinned
                        ? medium === 'english'
                          ? 'Pinned on Top ✓'
                          : 'स्क्रीन पर फिक्स है ✓'
                        : medium === 'english'
                        ? 'Pin on Top'
                        : 'स्क्रीन पर फिक्स करें'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rawToSpeak = isMcq && mcqData ? mcqData.qStem : activeItem.question;
                      speakText(rawToSpeak);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                      isSpeaking
                        ? 'bg-amber-500 text-white animate-pulse'
                        : isDarkMode
                        ? 'bg-white/10 hover:bg-white/20 text-amber-300'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                    title="सवाल बोलकर सुनें"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300 shrink-0" />
                    <span className="text-[10px] font-bold">{medium === 'english' ? 'Listen' : 'बोलकर सुनें'}</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-sm sm:text-base font-extrabold leading-snug text-slate-900 dark:text-amber-200">
                {renderMockQuestionBlank(isMcq && mcqData ? mcqData.qStem : activeItem.question, activeItem.idealAnswer)}
              </h3>
            </div>

            {/* 4. ANSWER INPUT AREA */}
            <div className={`p-4 sm:p-6 rounded-3xl border space-y-4 transition-all shadow-xs ${
              isDarkMode
                ? 'bg-slate-950/90 border-slate-800 text-white shadow-xl'
                : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
            }`}>
              {/* TYPE 1: MULTIPLE CHOICE OPTIONS (MCQ) */}
              {isMcq && mcqData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/10">
                    <label className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <span>🔘</span>
                      <span>{medium === 'english' ? 'Choose the Correct Option (MCQ):' : 'सही विकल्प चुनें (Choose the Correct Option):'}</span>
                    </label>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                      {studentAns ? (medium === 'english' ? 'Option Selected ✓' : 'विकल्प चुना गया ✓') : (medium === 'english' ? 'Tap an option' : 'विकल्प पर क्लिक करें')}
                    </span>
                  </div>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {mcqData.options.map((opt) => {
                      const isSelected = checkIsOptionSelected(studentAns, opt);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            const formatted = `${opt.label} ${opt.text}`;
                            setMockAnswers((prev) => ({
                              ...prev,
                              [activeMockQIdx]: formatted,
                            }));
                            setTimeout(() => {
                              const el = mockAnswerTextareaRef.current;
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = `${Math.max(100, el.scrollHeight)}px`;
                              }
                            }, 20);
                          }}
                          className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer group transform active:scale-[0.98] ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 dark:border-emerald-400 shadow-md ring-2 ring-emerald-400/30'
                              : isDarkMode
                              ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 hover:border-amber-400/60 text-slate-200'
                              : 'bg-white hover:bg-amber-50/50 border-slate-200 hover:border-amber-300 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black shrink-0 transition-all ${
                              isSelected
                                ? 'bg-emerald-500 text-white shadow-xs scale-105'
                                : isDarkMode
                                ? 'bg-slate-800 text-amber-300 border border-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950'
                                : 'bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-amber-400 group-hover:text-slate-950'
                            }`}
                          >
                            {opt.key.toUpperCase()}
                          </span>

                          <div className="flex-1 min-w-0 pt-0.5">
                            <span
                              className={`text-xs sm:text-sm font-extrabold block leading-snug ${
                                isSelected
                                  ? 'text-emerald-900 dark:text-emerald-100'
                                  : isDarkMode
                                  ? 'text-slate-100'
                                  : 'text-slate-800'
                              }`}
                            >
                              {opt.text}
                            </span>
                          </div>

                          <div className="shrink-0 pt-0.5">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional Solution Steps Toggle */}
                  <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setShowMcqSteps((prev) => ({
                          ...prev,
                          [activeMockQIdx]: !prev[activeMockQIdx],
                        }))
                      }
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>✍️</span>
                      <span>
                        {showMcqSteps[activeMockQIdx]
                          ? (medium === 'english' ? 'Hide Solution Steps / Rough Work' : 'हल व स्टेप्स छुपाएं')
                          : (medium === 'english' ? 'Show Solution Steps / Rough Work (Optional)' : 'हल या रफ़ स्टेप्स भी लिखें (वैकल्पिक)')}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          showMcqSteps[activeMockQIdx] ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {studentAns && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ {studentAns.split('\n')[0]}
                      </span>
                    )}
                  </div>

                  {showMcqSteps[activeMockQIdx] && (
                    <div className="pt-2 space-y-3 animate-in fade-in duration-200">
                      <MathSymbolEditorToolbar
                        textareaRef={mockAnswerTextareaRef}
                        currentValue={studentAns}
                        onValueChange={(newVal) => {
                          setMockAnswers((prev) => ({
                            ...prev,
                            [activeMockQIdx]: newVal,
                          }));
                        }}
                        isDarkMode={isDarkMode}
                        medium={medium}
                        activeQuestionText={activeItem?.question}
                      />

                      <textarea
                        ref={mockAnswerTextareaRef}
                        rows={3}
                        value={studentAns}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMockAnswers((prev) => ({
                            ...prev,
                            [activeMockQIdx]: val,
                          }));
                          e.target.style.height = 'auto';
                          e.target.style.height = `${Math.max(100, e.target.scrollHeight)}px`;
                        }}
                        placeholder={medium === 'english'
                          ? 'Type your calculations or explanation here...'
                          : 'यहाँ अपना हल, गणना या रफ़ कार्य टाइप करें...'}
                        className={`w-full p-4 rounded-2xl border text-sm sm:text-base font-mono outline-none transition-all leading-relaxed resize-none overflow-hidden min-h-[100px] ${
                          isDarkMode
                            ? 'bg-slate-900 border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 shadow-inner'
                            : 'bg-slate-50/50 border-slate-300 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 shadow-inner'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TYPE 2: INTERACTIVE PYRAMID PUZZLE */}
              {!isMcq && isPyramidQuestion && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/10">
                    <label className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <span>🔺</span>
                      <span>{medium === 'english' ? 'Solve Number Pyramid in Editor:' : 'पिरामिड पहेली के खाली डिब्बे यहाँ भरें:'}</span>
                    </label>
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-300 dark:border-indigo-700">
                      {medium === 'english' ? 'Interactive Puzzle' : 'लाइव पहेली एडिटर'}
                    </span>
                  </div>

                  <MathPyramidWidget
                    presetType={isPyramid2 ? 'pyramid2' : 'pyramid1'}
                    isEditable={true}
                    onInsertToAnswer={(pyramidText) => {
                      setMockAnswers((prev) => {
                        const existing = (prev[activeMockQIdx] || '').trim();
                        const nextVal = existing ? `${existing}\n\n${pyramidText}` : pyramidText;
                        return {
                          ...prev,
                          [activeMockQIdx]: nextVal,
                        };
                      });
                    }}
                    onAutoUpdate={(pyramidText) => {
                      setMockAnswers((prev) => ({
                        ...prev,
                        [activeMockQIdx]: pyramidText,
                      }));
                    }}
                    isDarkMode={isDarkMode}
                    medium={medium}
                  />

                  <div className="pt-1 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span>📝</span>
                      <span>{medium === 'english' ? 'Pyramid Formatted Solution:' : 'पिरामिड हल का स्वरूप:'}</span>
                    </label>
                    <textarea
                      ref={mockAnswerTextareaRef}
                      rows={4}
                      value={studentAns}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMockAnswers((prev) => ({
                          ...prev,
                          [activeMockQIdx]: val,
                        }));
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.max(120, e.target.scrollHeight)}px`;
                      }}
                      placeholder="ऊपर पिरामिड के डिब्बों में संख्याएँ भरें, हल यहाँ स्वतः आ जाएगा..."
                      className={`w-full p-4 rounded-2xl border text-sm sm:text-base font-mono outline-none transition-all leading-relaxed resize-none overflow-hidden min-h-[120px] ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 shadow-inner'
                          : 'bg-slate-50/50 border-slate-300 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 shadow-inner'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* TYPE 3: STANDARD DESCRIPTIVE / SOLVE / FILL QUESTIONS */}
              {!isMcq && !isPyramidQuestion && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-1">
                    <label className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <span>✍️</span>
                      <span>{medium === 'english' ? 'Type Your Answer / Solution Steps:' : 'अपना उत्तर या हल यहाँ लिखें (Type Your Answer):'}</span>
                    </label>
                    {studentAns && (
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                        {studentAns.trim().split(/\s+/).filter(Boolean).length} {medium === 'english' ? 'words' : 'शब्द'}
                      </span>
                    )}
                  </div>

                  {/* Math Symbols & Powers Toolbar */}
                  <MathSymbolEditorToolbar
                    textareaRef={mockAnswerTextareaRef}
                    currentValue={studentAns}
                    onValueChange={(newVal) => {
                      setMockAnswers((prev) => ({
                        ...prev,
                        [activeMockQIdx]: newVal,
                      }));
                      setTimeout(() => {
                        const el = mockAnswerTextareaRef.current;
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = `${Math.max(140, el.scrollHeight)}px`;
                        }
                      }, 15);
                    }}
                    isDarkMode={isDarkMode}
                    medium={medium}
                    activeQuestionText={activeItem?.question}
                    isPyramidActive={isPyramidQuestion}
                  />

                  {/* Expanding Textarea */}
                  <textarea
                    ref={mockAnswerTextareaRef}
                    rows={4}
                    value={studentAns}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMockAnswers((prev) => ({
                        ...prev,
                        [activeMockQIdx]: val,
                      }));
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.max(140, e.target.scrollHeight)}px`;
                    }}
                    placeholder={medium === 'english'
                      ? 'Type your step-by-step solution here (e.g. 742 - 289 = 453)... Use toolbar above for symbols!'
                      : 'यहाँ कॉपी की तरह पूरा हल या उत्तर टाइप करें (जैसे 742 - 289 = 453)... चिन्हों के लिए ऊपर टूलबार का उपयोग करें!'}
                    className={`w-full p-4 rounded-2xl border text-sm sm:text-base font-mono outline-none transition-all leading-relaxed resize-none overflow-hidden min-h-[140px] ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 shadow-inner'
                        : 'bg-slate-50/50 border-slate-300 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 shadow-inner'
                    }`}
                  />
                </div>
              )}

              {/* Action Buttons: Check Answer, Clear */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveAndEvaluateMock(activeMockQIdx)}
                  disabled={!studentAns.trim() || isEvaluatingMock}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95 cursor-pointer"
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

                <div className="flex items-center gap-2">
                  {studentAns && (
                    <button
                      type="button"
                      onClick={() =>
                        setMockAnswers((prev) => ({
                          ...prev,
                          [activeMockQIdx]: '',
                        }))
                      }
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-all border border-transparent hover:border-rose-200 cursor-pointer"
                    >
                      {medium === 'english' ? 'Clear' : 'साफ़ करें (Clear)'}
                    </button>
                  )}

                  {/* Next Question Navigation */}
                  {activeMockQIdx < questionsList.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveMockQIdx((prev) => prev + 1)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      <span>{medium === 'english' ? 'Next Question' : 'अगला सवाल'}</span>
                      <span>➔</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 5. EVALUATION SCORECARD */}
            {evalData && (
              <div className={`p-4 md:p-6 rounded-3xl border space-y-4 animate-in fade-in duration-300 ${
                isDarkMode
                  ? 'bg-slate-900/95 border-indigo-500/30 shadow-xl'
                  : 'bg-white border-slate-200/90 shadow-md ring-1 ring-slate-100'
              }`}>
                {/* Score & Badge Header */}
                <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-amber-950/50 via-indigo-950/40 to-slate-900 border-amber-500/40'
                    : 'bg-gradient-to-r from-amber-50/80 via-indigo-50/50 to-white border-amber-300 shadow-2xs'
                }`}>
                  <div className="flex items-center gap-3.5">
                    <span className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-400/30 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                      🏆
                    </span>
                    <div>
                      <span className="text-[11px] uppercase font-black tracking-wider text-amber-700 dark:text-amber-400 block">
                        {medium === 'english' ? 'Mock Test Scorecard:' : 'मॉक टेस्ट रिजल्ट (Score Card):'}
                      </span>
                      <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{evalData.score} / {evalData.totalMarks || 10} {medium === 'english' ? 'Marks' : 'अंक'}</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          ({evalData.percentage || evalData.score * 10}%)
                        </span>
                      </h4>
                    </div>
                  </div>

                  <span className="px-4 py-1.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 self-start sm:self-auto shadow-xs">
                    {evalData.badge || (medium === 'english' ? '⭐ Excellent Effort!' : '⭐ शानदार प्रयास!')}
                  </span>
                </div>

                {/* Strengths: Kya Achha Kiya */}
                {evalData.strengths && evalData.strengths.length > 0 && (
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-2xs'
                  }`}>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <span>👏</span> {medium === 'english' ? 'Strengths (What you wrote well):' : 'क्या अच्छा लिखा (Strengths):'}
                    </span>
                    <ul className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 list-disc list-inside space-y-1 font-medium">
                      {evalData.strengths.map((str: string, i: number) => (
                        <li key={i}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mistakes: Kahan Galti Hui */}
                {evalData.mistakes && evalData.mistakes.length > 0 && (
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950 shadow-2xs'
                  }`}>
                    <span className="text-xs font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <span>❌</span> {medium === 'english' ? 'Mistakes to Fix:' : 'कहाँ गलती हुई (Mistakes to Fix):'}
                    </span>
                    <ul className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 list-disc list-inside space-y-1 font-medium">
                      {evalData.mistakes.map((mst: string, i: number) => (
                        <li key={i}>{mst}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Spelling Mistakes */}
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  isDarkMode
                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950 shadow-2xs'
                }`}>
                  <span className="text-xs font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>✍️</span> {medium === 'english' ? 'Spelling Check:' : 'स्पेलिंग जांच (Spelling Check):'}
                  </span>
                  {evalData.spellingMistakes && evalData.spellingMistakes.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {evalData.spellingMistakes.map(
                        (sp: { wrong: string; correct: string }, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-black/50 border border-amber-300 dark:border-amber-500/40 text-xs font-bold shadow-2xs"
                          >
                            <span className="text-rose-600 dark:text-rose-400 line-through">{sp.wrong}</span>
                            <span className="text-slate-400">➔</span>
                            <span className="text-emerald-700 dark:text-emerald-300 font-black">{sp.correct}</span>
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                      {medium === 'english'
                        ? '✅ Great job! Zero spelling errors found in your answer!'
                        : '✅ शाबाश बेटा! आपके उत्तर में कोई स्पेलिंग गलती नहीं मिली!'}
                    </p>
                  )}
                </div>

                {/* Missing Points: Points to add */}
                {evalData.missingPoints && evalData.missingPoints.length > 0 && (
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
                      : 'bg-indigo-50/80 border-indigo-200 text-indigo-950 shadow-2xs'
                  }`}>
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <span>💡</span> {medium === 'english' ? 'Key Points to Add for 10/10 Score:' : 'कहाँ और क्या जोड़ना है (Points to Add for 10/10):'}
                    </span>
                    <ul className="text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 list-disc list-inside space-y-1 font-medium">
                      {evalData.missingPoints.map((mp: string, i: number) => (
                        <li key={i}>{mp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Model Answer */}
                {evalData.idealAnswer && (
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : 'bg-slate-100 border-slate-200 text-slate-900 shadow-2xs'
                  }`}>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      {medium === 'english' ? '📖 Complete Model Answer:' : '📖 आदर्श उत्तर (Full Model Answer):'}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                      {evalData.idealAnswer}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
