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
} from 'lucide-react';
import ParentWhatsAppReportModal from '@/components/ParentWhatsAppReportModal';
import PrintableSundayExamModal from '@/components/PrintableSundayExamModal';
import TeacherWhiteboardAnimation from '@/components/TeacherWhiteboardAnimation';
import { WorksheetHistoryModal, SavedWorksheetRecord } from '@/components/WorksheetHistoryModal';
import { enhanceDocumentImage, compressImageForThumbnail } from '@/lib/image-enhancer';
import { RoughWorkScratchpad } from '@/components/RoughWorkScratchpad';
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

  // Sync with live changes or board/class switch
  useEffect(() => {
    const localData = getCurriculum(board, className, medium);
    setAllSubjects(localData);

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
      .catch(() => {});
  }, [board, className, medium]);

  // Active Selected Subject & Chapter (Null by default so child chooses or asks!)
  const [selectedSubject, setSelectedSubject] = useState<SubjectCurriculum | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

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

  // Voice & Speech States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [speechText, setSpeechText] = useState<string>(
    'नमस्ते बेटा! आज की ट्यूशन में आपका स्वागत है। आप आज कौन सा विषय पढ़ना चाहते हैं? नीचे से विषय चुनें (जैसे Math, English, EVS, Hindi) या बोलकर बताएं (जैसे: "Math का Chapter 8" या "English का Chapter 5")!'
  );

  // Homework Multi-File & Document Upload State
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string; url: string; type: string }>>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [activeMathAnim, setActiveMathAnim] = useState<{ num1: number; op: string; num2: number; result: number } | null>(null);

  // Computed values for active uploaded file
  const activeFileDoc = uploadedFiles.find((f) => f.id === activeFileId) || uploadedFiles[0] || null;
  const uploadedImage = activeFileDoc?.url || null;
  const uploadedFileName = activeFileDoc?.name || '';

  const setUploadedImage = (url: string | null) => {
    if (!url) {
      setUploadedFiles([]);
      setActiveFileId('');
    }
  };
  const setUploadedFileName = (_name: string) => {};

  const handleRemoveFile = (idToRemove: string) => {
    setUploadedFiles((prev) => {
      const next = prev.filter((f) => f.id !== idToRemove);
      if (next.length === 0) {
        setActiveFileId('');
        setDetectedQuestions([]);
        setCustomQuizQuestions([]);
      } else if (activeFileId === idToRemove) {
        setActiveFileId(next[0]?.id || '');
      }
      return next;
    });
  };

  const handleClearAllFiles = () => {
    setUploadedFiles([]);
    setActiveFileId('');
    setDetectedQuestions([]);
    setCustomQuizQuestions([]);
    setCurrentUploadMode('teach');
  };
  const [detectedQuestions, setDetectedQuestions] = useState<string[]>([]);
  const [customQuizQuestions, setCustomQuizQuestions] = useState<any[]>([]);
  const [currentUploadMode, setCurrentUploadMode] = useState<'teach' | 'check' | 'quiz'>('teach');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSundayExamModalOpen, setIsSundayExamModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [worksheetHistory, setWorksheetHistory] = useState<SavedWorksheetRecord[]>([]);
  const [lastArchivedNotice, setLastArchivedNotice] = useState<{ title: string; count: number } | null>(null);
  const [isWorksheetCelebrationOpen, setIsWorksheetCelebrationOpen] = useState<boolean>(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [chalkboardTheme, setChalkboardTheme] = useState<'slate' | 'green'>('slate');
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);
  const [isTypewriterEnabled, setIsTypewriterEnabled] = useState<boolean>(true);

  // Chalk / Dry-Erase Marker Typewriter Component with Realistic Handwriting Pacing
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
    enabled = true,
    onComplete,
    className = '',
    showCursor = true,
    isChalkboard = false,
  }) => {
    const [displayedText, setDisplayedText] = useState(enabled ? '' : text);
    const [isDone, setIsDone] = useState(!enabled);

    useEffect(() => {
      if (!enabled) {
        setDisplayedText(text);
        setIsDone(true);
        return;
      }

      const chars = Array.from(text || '');
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
              className={`inline-block w-1.5 h-4 rounded-xs ${
                isChalkboard
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
      .replace(/\\rightarrow/gi, ' → ')
      .replace(/\\leftarrow/gi, ' ← ')
      .replace(/\\Rightarrow/gi, ' ⇒ ')
      .replace(/\\times/gi, ' × ')
      .replace(/\\div/gi, ' ÷ ')
      .replace(/\\approx/gi, ' ≈ ')
      .replace(/\\pm/gi, ' ± ')
      .replace(/\\/g, '')
      .trim();
  };

  const renderFormulaBlocks = (formula: string) => {
    const clean = formatFormula(formula);
    const rawParts = clean.split(/[,|\n]/).map((p) => p.trim()).filter(Boolean);

    if (rawParts.length > 1) {
      return (
        <div className="space-y-2 pt-1 font-mono text-sm sm:text-base">
          {rawParts.map((part, pIdx) => {
            const isFinal =
              part.includes('✅') ||
              part.toLowerCase().includes('option') ||
              part.includes('उत्तर') ||
              part.includes('सही') ||
              pIdx === rawParts.length - 1;

            return (
              <div
                key={pIdx}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-sm sm:text-base font-bold transition-all ${
                  isFinal
                    ? isDarkMode || chalkboardTheme === 'green'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                    : isDarkMode || chalkboardTheme === 'green'
                    ? 'bg-slate-900/80 border-slate-800 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isFinal ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                  />
                  <div className="leading-relaxed">
                    <ChalkTypewriter
                      text={part.replace(/\[|\]/g, '')}
                      speed={22}
                      delay={isTypewriterEnabled ? pIdx * 350 : 0}
                      enabled={isTypewriterEnabled}
                      isChalkboard={chalkboardTheme === 'green'}
                    />
                  </div>
                </div>
                {isFinal && (
                  <span className="text-xs bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded-full shadow-xs shrink-0 animate-in fade-in duration-500">
                    उत्तर ✅
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div
        className={`text-base sm:text-xl font-bold tracking-wide leading-relaxed font-mono ${
          isDarkMode || chalkboardTheme === 'green' ? 'text-white' : 'text-slate-900'
        }`}
      >
        <ChalkTypewriter
          text={clean}
          speed={22}
          enabled={isTypewriterEnabled}
          isChalkboard={chalkboardTheme === 'green'}
        />
      </div>
    );
  };
  const [activeTargetQuestion, setActiveTargetQuestion] = useState<string>('');

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
  const getQuestionForStep = (stepItem: WhiteboardStepItem, idx: number): string | null => {
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
      const combined = `${stepItem.step} ${stepItem.formula}`.toLowerCase();
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
      return detectedQuestions[0];
    }

    if (selectedChapter?.sampleQuestions && selectedChapter.sampleQuestions[idx]) {
      return selectedChapter.sampleQuestions[idx].question;
    }

    return null;
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
  const speakText = (text: string, onEnded?: () => void) => {
    if (isAudioMuted || !text.trim()) return;

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
      const audioUrl = `/api/tutor/tts?text=${encodeURIComponent(clean)}&lang=hi`;
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

  // Load Worksheet History from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('ai_tuition_worksheet_records');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWorksheetHistory(parsed);
          return;
        }
      }
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const initialSeeds: SavedWorksheetRecord[] = [
        {
          id: 'ws-seed-1',
          title: 'कक्षा 4 गणित: निकटतम हज़ार (Nearest Thousand Round Off) वर्कशीट',
          date: todayStr,
          dateLabel: 'आज, 11:20 AM',
          subjectId: 'cbse-c4-math',
          subjectName: 'गणित (Math)',
          teacherName: 'Sharma Sir',
          files: [],
          detectedQuestions: [
            '[MCQ] Q1: Estimate of difference of 423516 and 453729 by rounding to nearest thousands is : (a) 20000 (b) 50000 (c) 30000 (d) 40000',
            '[MCQ] Q2: Difference of place value of 5s in 375059 is : (a) 49950 (b) 49500 (c) 49900 (d) 4900',
            '[True/False] Q3: Subtraction of a smaller number from a greater number is always positive',
          ],
          activeQuestion: '[MCQ] Q1: Estimate of difference of 423516 and 453729 by rounding to nearest thousands is : (a) 20000 (b) 50000 (c) 30000 (d) 40000',
          timestamp: Date.now() - 3600000,
        },
        {
          id: 'ws-seed-2',
          title: 'पर्यावरण / EVS: जल संरक्षण व पौधे (Plants & Water) अभ्यास',
          date: yesterdayStr,
          dateLabel: 'कल, 04:45 PM',
          subjectId: 'cbse-c4-evs',
          subjectName: 'पर्यावरण (EVS)',
          teacherName: 'Neha Maam',
          files: [],
          detectedQuestions: [
            'Q1: Which part of the plant absorbs water from the soil?',
            'Q2: Why do desert plants like cactus have spines instead of leaves?',
          ],
          timestamp: Date.now() - 86400000,
        },
      ];
      setWorksheetHistory(initialSeeds);
      localStorage.setItem('ai_tuition_worksheet_records', JSON.stringify(initialSeeds));
    } catch (e) {
      console.warn('Failed to load worksheet history:', e);
    }
  }, []);

  // Mic Speech Recognition
  const toggleMic = () => {
    if (typeof window === 'undefined') return;

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

  // Switch Subject (Math, EVS, English, Hindi)
  const handleSelectSubject = (sub: SubjectCurriculum) => {
    setSelectedSubject(sub);
    const teacherMap: Record<string, any> = {
      sharma: { id: 'sharma', name: 'Sharma Sir', role: 'Class 1st-8th Math Mentor', emoji: '👨‍🏫' },
      neha: { id: 'neha', name: 'Neha Mam', role: 'Science & EVS Specialist', emoji: '👩‍🔬' },
      riya: { id: 'riya', name: 'Riya Didi', role: 'English Phonetics & Grammar Coach', emoji: '👩‍🏫' },
      pooja: { id: 'pooja', name: 'Pooja Mam', role: 'Hindi Language & Vyakaran Expert', emoji: '✍️' },
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

    // If chapter has sample questions with whiteboard steps
    if (ch.sampleQuestions && ch.sampleQuestions.length > 0 && ch.sampleQuestions[0]?.whiteboardSteps) {
      setActiveTargetQuestion(ch.sampleQuestions[0].question);
      setWhiteboardSteps(ch.sampleQuestions[0].whiteboardSteps);
      setRevealedSteps(ch.sampleQuestions[0].whiteboardSteps.length);
    } else {
      // Dynamic concept introduction
      setWhiteboardSteps([
        {
          step: `चरण 1: पाठ ${ch.chapterNumber} का परिचय`,
          formula: ch.titleHindi,
          annotation: `मुख्य बिंदु: ${ch.concepts.join(', ')}`,
        },
        {
          step: 'चरण 2: महत्वपूर्ण नियम / सूत्र',
          formula: ch.keyFormulas?.[0] || 'नियम को ध्यानपूर्वक याद करें',
          annotation: 'इस नियम पर आधारित प्रश्न परीक्षा में पूछे जाते हैं।',
        },
        {
          step: 'चरण 3: शिक्षक का मार्गदर्शन',
          formula: '✅ अभ्यास शुरू करें',
          annotation: 'नीचे दिया गया अभ्यास प्रश्न हल करें या मुझसे कोई भी डाउट पूछें!',
        },
      ]);
      setRevealedSteps(3);
    }

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
    setActiveTargetQuestion(qItem.question);
    if (qItem.whiteboardSteps && qItem.whiteboardSteps.length > 0) {
      setWhiteboardSteps(qItem.whiteboardSteps);
      setRevealedSteps(1); // Progressive slow typewriter handwriting
    } else {
      handleStudentQuery(`कृपया पाठ ${selectedChapter?.chapterNumber || ''} का यह प्रश्न हल कराएं: "${qItem.question}"`);
      return;
    }
    const msg = `बेटा, ध्यान से देखिए: सवाल है "${qItem.question}"। इसका स्टेप-बाय-स्टेप हल मैंने व्हाइटबोर्ड पर लिख दिया है!`;
    setSpeechText(msg);
    speakText(msg);
  };

  // Helper to select and solve a detected question by index
  const selectDetectedQuestionByIndex = (idx: number, qText: string) => {
    setActiveTargetQuestion(qText);
    setActiveMathAnim(null);
    const audioSpeech = `सवाल नंबर ${idx + 1}: ${qText}। आइए इस सवाल का हल व्हाइटबोर्ड पर देखते हैं!`;
    setSpeechText(audioSpeech);
    speakText(audioSpeech);
    handleStudentQuery(`कृपया इस सवाल को हल करें: "${qText}"`);
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
    if (uploadedFiles.length === 0 && detectedQuestions.length === 0 && whiteboardSteps.length === 0) {
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
      activeQuestion: activeTargetQuestion,
      whiteboardSteps: [...whiteboardSteps],
      whiteboardHeading,
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
    if (record.whiteboardSteps && record.whiteboardSteps.length > 0) {
      setWhiteboardSteps(record.whiteboardSteps);
      setRevealedSteps(record.whiteboardSteps.length);
    }
    if (record.whiteboardHeading) {
      setWhiteboardHeading(record.whiteboardHeading);
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
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Handle Free-Form Student Query or Doubt
  const handleStudentQuery = async (queryText?: string) => {
    const rawVal = queryText !== undefined ? queryText : (inputText || inputRef.current?.value || '');
    const q = (rawVal || '').trim();
    if (!q && !uploadedImage) return;

    setInputText('');
    if (inputRef.current) inputRef.current.value = '';
    setIsCheckingHomework(true);

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
          board,
          className,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || 'शाबाश बेटा! आपका डाउट मैंने व्हाइटबोर्ड पर हल कर दिया है।';
        setSpeechText(reply);
        speakText(reply);

        if (data.whiteboard_steps && data.whiteboard_steps.length > 0) {
          setWhiteboardHeading(`सवाल समाधान: "${q.length > 30 ? q.slice(0, 30) + '...' : q}"`);
          setWhiteboardSteps(data.whiteboard_steps);
          setRevealedSteps(1); // Progressive slow typewriter handwriting
        }
        if (data.detected_questions && Array.isArray(data.detected_questions) && data.detected_questions.length > 0) {
          setDetectedQuestions(data.detected_questions);
          if (!activeTargetQuestion || isInternalInstruction(activeTargetQuestion)) {
            setActiveTargetQuestion(data.detected_questions[0]);
          }
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
    setRevealedSteps(1);
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
    setCurrentUploadMode(mode);
    setIsCheckingHomework(true);

    let promptMsg = '';
    if (mode === 'check') {
      promptMsg = 'कृपया इस पूरी वर्कशीट के सभी 15 सवालों (MCQs 1-5, Fill in blanks 1-5, True/False 1-5) के सही उत्तर मास्टर आंसर की (Master Answer Key) के साथ व्हाइटबोर्ड पर दिखाएं ताकि बच्चा और पेरेंट्स सभी उत्तर चेक कर सकें।';
      setWhiteboardHeading('📋 संपूर्ण वर्कशीट मास्टर उत्तर कुंजी (All 15 Answers Key)');
    } else if (mode === 'quiz') {
      promptMsg = 'कृपया इस शीट के सभी सवालों को एक इंटरैक्टिव मॉक टेस्ट में बदलें ताकि बच्चा परीक्षा की तैयारी कर सके।';
      setWhiteboardHeading('🎯 परीक्षा तैयारी: वर्कशीट मॉक टेस्ट (15 सवाल)');
    } else {
      promptMsg = 'कृपया इस वर्कशीट के सभी 15 सवाल (MCQs, Fill in blanks, True/False) पहचानें और पहले सवाल का व्हाइटबोर्ड पर स्टेप-बाय-स्टेप हल सिखाएं।';
      setWhiteboardHeading(`शीट हल: ${uploadedFileName || 'वर्कशीट'}`);
    }

    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: currentTeacher.id,
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
          setWhiteboardSteps(data.whiteboard_steps);
          setRevealedSteps(1);
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

  // Multi-File Upload Handler (Book Pages / Homework)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

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
          teacher_id: currentTeacher.id,
          question:
            'कृपया इस वर्कशीट या पेज के सभी सवाल (MCQs, खाली स्थान / Fill in blanks, सही-गलत / True-False) पहचानें और हर सवाल को <detected_question> टैग में शामिल करें ताकि बच्चा किसी भी सवाल पर क्लिक करके उसका हल देख सके। और पहले सवाल का व्हाइटबोर्ड पर स्टेप-बाय-स्टेप हल सिखाएं।',
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

        if (data.whiteboard_steps && data.whiteboard_steps.length > 0) {
          setWhiteboardHeading(`पेज हल: ${activeDoc.name}`);
          setWhiteboardSteps(data.whiteboard_steps);
          setRevealedSteps(data.whiteboard_steps.length);
        }
        if (data.detected_questions && Array.isArray(data.detected_questions) && data.detected_questions.length > 0) {
          setDetectedQuestions(data.detected_questions);
          setActiveTargetQuestion(data.detected_questions[0]);
        }
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
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      {/* 1. TOP HEADER */}
      <header className={`backdrop-blur-md border-b px-4 md:px-8 py-3 flex items-center justify-between gap-3 sticky top-0 z-30 transition-colors duration-200 ${
        isDarkMode
          ? 'bg-slate-900/90 border-slate-800 shadow-md text-white'
          : 'bg-white/95 border-slate-200 shadow-xs text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold border ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">डैशबोर्ड</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-lg shadow-md shrink-0">
              ✏️
            </span>
            <div>
              <h1 className="text-base md:text-lg font-black tracking-tight flex items-center gap-2">
                AI Tuition Studio
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Live
                </span>
              </h1>
              <p className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {board} • {className} ({medium === 'hindi' ? 'हिंदी माध्यम' : 'English Medium'})
              </p>
            </div>
          </div>
        </div>

        {/* Streak, WhatsApp Report, Theme Toggle & Controls */}
        <div className="flex items-center gap-2">
          {/* Duolingo Streak */}
          <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black shadow-xs ${
            isDarkMode
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
            <span>7 दिन स्ट्रीक</span>
          </div>

          {/* ☀️ / 🌙 THEME TOGGLE: 1-Click Classroom Light vs Midnight Dark */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 shadow-xs ${
              isDarkMode
                ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
            }`}
            title="आंखों के आराम के लिए थीम बदलें"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            <span className="hidden md:inline">{isDarkMode ? '☀️ क्लासरूम' : '🌙 डार्क'}</span>
          </button>

          {/* Previous Records & Worksheet History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 shadow-xs ${
              isDarkMode
                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
            }`}
            title="पिछला रिकॉर्ड व वर्कशीट इतिहास देखें (Subject व Date Filter सहित)"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">पिछला रिकॉर्ड</span>
            <span className="sm:hidden">रिकॉर्ड</span>
            {worksheetHistory.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                {worksheetHistory.length}
              </span>
            )}
          </button>

          {/* Sunday Test Paper Button */}
          <button
            onClick={() => setIsSundayExamModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 shadow-xs ${
              isDarkMode
                ? 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300 hover:text-white'
                : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">संडे टेस्ट</span>
          </button>

          {/* Parent WhatsApp Report Card Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">पेरेंट रिपोर्ट</span>
            <span className="sm:hidden">रिपोर्ट</span>
          </button>

          {/* Board Selector */}
          <div className={`p-1 rounded-xl border flex items-center text-xs font-bold ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['RBSE', 'CBSE'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBoard(b)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  board === b
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              if (!isAudioMuted && typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }
              setIsAudioMuted(!isAudioMuted);
            }}
            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isAudioMuted
                ? isDarkMode
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
                : isDarkMode
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-500 animate-pulse" />}
            <span className="hidden md:inline">{isAudioMuted ? 'Muted' : 'Sound ON'}</span>
          </button>
        </div>
      </header>

      {/* 2. 4 CORE SUBJECTS SELECTOR RIBBON (Math, EVS, English, Hindi) */}
      <div className={`border-b px-4 md:px-8 py-2.5 transition-colors duration-200 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black uppercase mr-2 shrink-0 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              विषय चुनें (4 Subjects):
            </span>
            {allSubjects.map((sub) => {
              const isSelected = selectedSubject?.id === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => handleSelectSubject(sub)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border whitespace-nowrap shadow-xs ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-400 scale-105 shadow-indigo-600/30'
                      : isDarkMode
                      ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                  }`}
                >
                  <span className="text-base">{sub.emoji}</span>
                  <span>{sub.subjectHindi}</span>
                  <span className="text-[10px] opacity-75 font-normal">({sub.teacherName.split(' ')[0]})</span>
                </button>
              );
            })}
          </div>

          <div className={`text-xs font-extrabold px-3 py-1 rounded-xl border shrink-0 ${
            isDarkMode
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              : 'text-amber-800 bg-amber-50 border-amber-200'
          }`}>
            ⭐ कुल स्कोर: {totalScore}
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Animated Character Guide, Copy Scanner, & Student History Memory (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* TEACHER CHARACTER GUIDE */}
          <div className={`rounded-3xl p-5 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
            isDarkMode
              ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-indigo-500/30 shadow-2xl text-white'
              : 'bg-white border-slate-200 shadow-sm text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-emerald-500 animate-ping' : isListening ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className={`text-xs font-black tracking-wider uppercase ${
                  isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                }`}>
                  {isSpeaking ? 'बोल रहे हैं' : isListening ? 'सुन रहे हैं' : 'तैयार हैं (Ready)'}
                </span>
              </div>

              <button
                onClick={() => speakText(speechText)}
                className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/20 text-indigo-200 border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-indigo-700 border-slate-200 shadow-2xs'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <div className={`w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-amber-400 via-indigo-500 to-emerald-400 shadow-lg transition-all transform ${isSpeaking ? 'scale-105' : ''}`}>
                <div className={`w-full h-full rounded-[22px] flex flex-col items-center justify-center border ${
                  isDarkMode ? 'bg-slate-900 border-white/20' : 'bg-indigo-50/80 border-indigo-100'
                }`}>
                  <span className="text-5xl">{currentTeacher.emoji}</span>
                </div>
              </div>

              <h3 className={`text-lg font-black mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {currentTeacher.name}
              </h3>
              <p className={`text-xs font-semibold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                {currentTeacher.role}
              </p>

              {/* Waveform */}
              <div className="flex items-center gap-1.5 h-5 mt-2">
                {[30, 60, 90, 45, 80, 50, 75, 40].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isSpeaking
                        ? 'bg-indigo-500 shadow-[0_0_6px_#818cf8]'
                        : isDarkMode
                        ? 'bg-slate-700'
                        : 'bg-slate-200'
                    }`}
                    style={{ height: isSpeaking ? `${Math.max(4, h * 0.22)}px` : '4px' }}
                  />
                ))}
              </div>
            </div>

            {/* Speech Bubble */}
            <div className={`mt-3 rounded-2xl p-3.5 border transition-all ${
              isDarkMode
                ? 'bg-slate-800/80 border-white/10 text-slate-200 backdrop-blur-md'
                : 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
            }`}>
              <div className="flex items-start gap-2">
                <Smile className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed font-medium">
                  {speechText}
                </p>
              </div>
            </div>
          </div>

          {/* HOMEWORK & COPY SCANNER */}
          <div className={`rounded-3xl p-5 border transition-all duration-200 space-y-3 ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800 shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase flex items-center gap-1.5 ${
                isDarkMode ? 'text-amber-400' : 'text-indigo-700'
              }`}>
                <Camera className="w-4 h-4" />
                होमवर्क / कॉपी चेक करवाएं
              </span>
              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                1-Click Scan
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
              <div className={`rounded-2xl border p-3.5 space-y-3 ${
                isDarkMode ? 'border-emerald-500/50 bg-slate-950' : 'border-emerald-300 bg-slate-50'
              }`}>
                {/* Multi-File Header with Add More & Clear All */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-black flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{uploadedFiles.length} पेज / फाइलें अपलोड</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 rounded-lg text-[11px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1 transition-all"
                      title="और फोटो या पेज जोड़ें"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ और जोड़ें</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="px-2 py-1 rounded-lg text-[11px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 flex items-center gap-1 transition-all"
                      title="पिछला रिकॉर्ड देखें"
                    >
                      <Clock className="w-3 h-3" />
                      <span>इतिहास</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllFiles}
                      className="px-2 py-1 rounded-lg text-[11px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 flex items-center gap-1 transition-all"
                      title="सभी अपलोड की गई फाइलें हटाएं"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>सभी हटाएं</span>
                    </button>
                  </div>
                </div>

                {/* Horizontal Thumbnails Carousel if multiple files */}
                {uploadedFiles.length > 1 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">
                      अपलोड किए गए पेज (क्लिक करके पेज बदलें):
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {uploadedFiles.map((file, idx) => {
                        const isThisActive = (activeFileDoc?.id || uploadedFiles[0]?.id) === file.id;
                        const isPdf = file.name.toLowerCase().endsWith('.pdf');

                        return (
                          <div
                            key={file.id}
                            onClick={() => setActiveFileId(file.id)}
                            className={`relative shrink-0 w-20 h-20 rounded-xl border-2 cursor-pointer transition-all overflow-hidden group ${
                              isThisActive
                                ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-md scale-102'
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
                              पेज #{idx + 1}
                            </span>
                            {/* Individual Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(file.id);
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs shadow-md opacity-90 hover:opacity-100 hover:scale-110 transition-all z-10"
                              title="यह पेज हटाएं"
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
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-rose-950/40 via-indigo-950/50 to-slate-900 border-rose-500/30 text-white'
                        : 'bg-white border-rose-200 text-slate-800 shadow-2xs'
                    }`}>
                      <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-500 flex items-center justify-center text-2xl shrink-0 font-bold">
                        📑
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-black tracking-wider text-rose-500 block">
                          PDF दस्तावेज़ (Live Document)
                        </span>
                        <h4 className={`text-xs font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {uploadedFileName}
                        </h4>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                          ✓ लाइव AI विज़न से सीधे प्रश्न व उत्तर स्कैन होंगे
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(activeFileDoc?.id || '')}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all"
                        title="हटाएं"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img
                        src={uploadedImage || ''}
                        alt="Uploaded Homework"
                        className="w-full h-36 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(activeFileDoc?.id || '')}
                        className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-all"
                        title="यह फोटो हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>हटाएं</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[200px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {uploadedFileName || 'बुक / कॉपी का पेज'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(activeFileDoc?.id || '')}
                    className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>हटाएं (Remove)</span>
                  </button>
                </div>

                {/* 3-Action Mode Bar (Parents & Student Superpower) */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => handleTriggerMode('teach')}
                    disabled={isCheckingHomework}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-black border transition-all flex items-center justify-center gap-1 ${
                      currentUploadMode === 'teach'
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : isDarkMode
                        ? 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                    }`}
                  >
                    {isCheckingHomework && currentUploadMode === 'teach' ? (
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : (
                      <span>📖</span>
                    )}
                    <span>सवाल समझें</span>
                  </button>

                  <button
                    onClick={() => handleTriggerMode('check')}
                    disabled={isCheckingHomework}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-black border transition-all flex items-center justify-center gap-1 ${
                      currentUploadMode === 'check'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                        : isDarkMode
                        ? 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    {isCheckingHomework && currentUploadMode === 'check' ? (
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : (
                      <span>✍️</span>
                    )}
                    <span>कॉपी चेक</span>
                  </button>

                  <button
                    onClick={() => handleTriggerMode('quiz')}
                    disabled={isCheckingHomework}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-black border transition-all flex items-center justify-center gap-1 ${
                      currentUploadMode === 'quiz'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30'
                        : isDarkMode
                        ? 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                    }`}
                  >
                    {isCheckingHomework && currentUploadMode === 'quiz' ? (
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : (
                      <span>🎯</span>
                    )}
                    <span>मॉक टेस्ट</span>
                  </button>
                </div>

                {/* 1-Click WhatsApp Parent Share Button */}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>📱 मम्मी-पापा को व्हाट्सएप पर रिपोर्ट शेयर करें</span>
                </button>

                {detectedQuestions.length > 0 ? (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-black flex items-center gap-1.5 ${
                        isDarkMode ? 'text-amber-300' : 'text-indigo-700'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        शीट के सवाल (क्लिक करके हल देखें):
                      </span>
                      <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {detectedQuestions.length} सवाल मिले
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTargetQuestion('सभी 15 सवालों के सही उत्तर व मास्टर कुंजी');
                        handleTriggerMode('check');
                      }}
                      disabled={isCheckingHomework}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-80"
                    >
                      {isCheckingHomework && activeTargetQuestion === 'सभी 15 सवालों के सही उत्तर व मास्टर कुंजी' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <span>📋</span>
                      )}
                      <span>पूरी शीट के सभी उत्तर एक साथ देखें</span>
                    </button>

                    {/* Quick Question Next/Prev Switcher Bar in Sidebar */}
                    <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handlePrevQuestion}
                        disabled={isCheckingHomework}
                        className="py-1 px-2.5 rounded-lg text-[11px] font-black bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1 shadow-2xs transition-all disabled:opacity-50"
                        title="पिछला सवाल (Previous Question)"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>पिछला</span>
                      </button>

                      <span className="text-[11px] font-black text-indigo-700 dark:text-amber-300 px-1">
                        सवाल {effectiveQuestionIdx !== -1 ? effectiveQuestionIdx + 1 : 1} / {detectedQuestions.length}
                      </span>

                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        disabled={isCheckingHomework}
                        className="py-1 px-2.5 rounded-lg text-[11px] font-black bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-xs transition-all disabled:opacity-50"
                        title="अगला सवाल (Next Question)"
                      >
                        <span>अगला</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                      {detectedQuestions.map((qText, idx) => {
                        const isThisActive = activeTargetQuestion === qText;
                        const isThisLoading = isCheckingHomework && isThisActive;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setActiveTargetQuestion(qText);
                              setActiveMathAnim(null);
                              const audioSpeech = `सवाल नंबर ${idx + 1}: ${qText}। आइए इस सवाल का हल व्हाइटबोर्ड पर देखते हैं!`;
                              setSpeechText(audioSpeech);
                              speakText(audioSpeech);
                              handleStudentQuery(`कृपया इस सवाल को हल करें: "${qText}"`);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left border transition-all group flex items-start justify-between gap-2 shadow-xs cursor-pointer ${
                              isThisActive
                                ? isDarkMode
                                  ? 'bg-indigo-950/80 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                                  : 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold shadow-xs'
                                : isDarkMode
                                ? 'bg-slate-900 hover:bg-indigo-900/40 border-slate-800 hover:border-indigo-500/50 text-slate-200'
                                : 'bg-white hover:bg-indigo-50/60 border-slate-200 hover:border-indigo-300 text-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className={`text-xs shrink-0 font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                                isThisLoading
                                  ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 animate-pulse'
                                  : isThisActive
                                  ? 'bg-indigo-600 text-white border-indigo-500'
                                  : isDarkMode
                                  ? 'text-amber-400 group-hover:text-amber-300 bg-amber-500/10 border-amber-500/20'
                                  : 'text-amber-700 group-hover:text-amber-800 bg-amber-50 border-amber-200'
                              }`}>
                                {isThisLoading && <Loader2 className="w-3 h-3 animate-spin text-amber-500" />}
                                #{idx + 1}
                              </span>
                              <span className={`text-xs font-medium line-clamp-2 leading-relaxed ${
                                isThisActive
                                  ? isDarkMode ? 'text-white' : 'text-indigo-950'
                                  : isDarkMode ? 'group-hover:text-white' : 'group-hover:text-slate-900'
                              }`}>
                                {qText}
                              </span>
                            </div>

                            {/* Speaker button to listen only to question without re-fetching */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const speech = `सवाल नंबर ${idx + 1}: ${qText}`;
                                setSpeechText(speech);
                                speakText(speech);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-all shrink-0"
                              title="यह सवाल बोलकर सुनें"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={`pt-2 p-3 rounded-2xl border text-center space-y-1 ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      📄 {uploadedFileName || 'दस्तावेज़'} अपलोड हो गया है
                    </p>
                    <p className={`text-[11px] ${isDarkMode ? 'text-amber-300' : 'text-indigo-600 font-semibold'}`}>
                      लाइव प्रश्न व उत्तर देखने के लिए ऊपर "सवाल समझें" या "कॉपी चेक" दबाएं।
                    </p>
                  </div>
                )}

                {isCheckingHomework && (
                  <div className={`p-3 rounded-2xl border text-center space-y-1.5 shadow-lg animate-in fade-in ${
                    isDarkMode
                      ? 'bg-indigo-950/80 border-indigo-500/40 shadow-indigo-950/50'
                      : 'bg-indigo-50 border-indigo-200 shadow-indigo-100'
                  }`}>
                    <div className={`flex items-center justify-center gap-2 text-xs font-black ${
                      isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                    }`}>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      <span>{currentTeacher.name} लाइव AI विज़न से पढ़ रहे हैं...</span>
                    </div>
                    <div className={`w-full rounded-full h-1.5 overflow-hidden ${
                      isDarkMode ? 'bg-slate-900' : 'bg-indigo-200/50'
                    }`}>
                      <div className="bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400 h-full rounded-full animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label
                htmlFor="homework-upload-input"
                className={`w-full py-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group ${
                  isDarkMode
                    ? 'border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300'
                    : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 text-indigo-700'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  isDarkMode ? 'bg-indigo-600/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className={`text-xs font-black block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    📸 बुक या कॉपी का पेज अपलोड करें
                  </span>
                  <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    यहाँ क्लिक करें या फोटो खींचें
                  </span>
                </div>
              </label>
            )}

            {worksheetHistory.length > 0 && uploadedFiles.length === 0 && (
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>📂 पिछला रिकॉर्ड देखें ({worksheetHistory.length} वर्कशीट सुरक्षित)</span>
              </button>
            )}
          </div>

          {/* STUDENT LEARNING HISTORY & TEACHER MEMORY (Real Tuition Record) */}
          <div className={`rounded-3xl p-5 border transition-all duration-200 space-y-3 ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800 shadow-xl'
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase flex items-center gap-1.5 ${
                isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
              }`}>
                <Brain className="w-4 h-4 text-indigo-500" />
                टीचर डायरी (Learning History & Memory)
              </span>
              <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Live Memory</span>
            </div>

            <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              जैसे असली ट्यूटर को याद रहता है कि बच्चे ने क्या पढ़ा, उसकी मजबूती और कमजोरी क्या है:
            </p>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {studyHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all text-xs space-y-1.5 ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-800/80 hover:border-indigo-500/40 text-slate-300'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-700 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-black flex items-center gap-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      <span>{item.subjectName}</span>
                      <span className={`font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>| पाठ {item.chapterNumber}</span>
                    </span>
                    <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{item.time}</span>
                  </div>

                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    💪 <span className="font-bold">मजबूती:</span> {item.strength}
                  </div>

                  {item.weakness && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-300 font-medium">
                      ⚠️ <span className="font-bold">सुधार:</span> {item.weakness}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const sub = allSubjects.find((s) => s.id === item.subjectId);
                      if (sub) {
                        handleSelectSubject(sub);
                        const ch = sub.chapters.find((c) => c.chapterNumber === item.chapterNumber);
                        if (ch) handleStartChapter(ch);
                      }
                    }}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-1 pt-1"
                  >
                    <span>वापस इस पाठ पर जाएं →</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Whiteboard, Chapter Picker, & Interactive Doubts (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* CHAPTER PICKER CARD (If subject is selected) */}
          {selectedSubject ? (
            <div className={`rounded-3xl p-5 border transition-all duration-200 space-y-3 ${
              isDarkMode
                ? 'bg-slate-900 border-slate-800 shadow-xl'
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm md:text-base font-black flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {selectedSubject.subjectHindi} के चैप्टर्स
                    <span className={`text-xs font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      ({selectedSubject.bookName})
                    </span>
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    शर्मा सर / नेहा मैम से जो भी पाठ पढ़ना हो, उसपर क्लिक करें या बोलें:
                  </p>
                </div>

                <button
                  onClick={() => setSelectedSubject(null)}
                  className={`text-xs underline font-bold ${
                    isDarkMode ? 'text-slate-400 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'
                  }`}
                >
                  सारे विषय देखें
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {selectedSubject.chapters.map((ch) => {
                  const isChSelected = selectedChapter?.id === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => handleStartChapter(ch)}
                      className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all flex flex-col justify-between ${
                        isChSelected
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border-amber-400 text-white shadow-md'
                            : 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-xs'
                          : isDarkMode
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                          : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-black uppercase ${
                          isDarkMode ? 'text-amber-400' : 'text-indigo-700'
                        }`}>
                          पाठ {ch.chapterNumber}
                        </span>
                        <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {ch.term === 'half_yearly' ? 'अर्धवार्षिक' : 'वार्षिक'}
                        </span>
                      </div>
                      <span className={`text-xs font-black truncate ${
                        isChSelected && !isDarkMode ? 'text-indigo-950' : ''
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
          ) : (
            /* WELCOME SUBJECT LAUNCHPAD IF NO SUBJECT CLICKED YET */
            <div className={`rounded-3xl p-6 border text-center space-y-4 transition-all duration-200 ${
              isDarkMode
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-2xl mx-auto">
                {allSubjects.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubject(sub)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group shadow-xs ${
                      isDarkMode
                        ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 hover:border-indigo-400 text-white'
                        : 'bg-slate-50 hover:bg-indigo-50/70 border-slate-200 hover:border-indigo-300 text-slate-800'
                    }`}
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{sub.emoji}</span>
                    <span className="text-xs font-black">{sub.subjectHindi}</span>
                    <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{sub.teacherName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* REAL 5 BOOK PAGES VIEWER & CHAPTER EXERCISE SOLVER */}
          {selectedChapter && (
            <div className={`rounded-3xl p-5 border transition-all duration-200 space-y-4 ${
              isDarkMode
                ? 'bg-slate-900 border-slate-800 shadow-xl'
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0">
                    📖
                  </div>
                  <div>
                    <h3 className={`text-sm md:text-base font-black flex items-center gap-2 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      पाठ {selectedChapter.chapterNumber}: पाठ्यपुस्तक के 5 असली पृष्ठ (Real Book Pages)
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {selectedSubject?.bookName} — पृष्ठ 1 से 5 व अंत के असली अभ्यास प्रश्न
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    isDarkMode ? 'bg-indigo-950/60 border-indigo-700/50 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
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
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 ${
                        isPageActive
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
                      <span className={`text-[10px] font-black uppercase ${
                        isEndPage ? 'text-amber-500 font-extrabold' : isDarkMode ? 'text-slate-400' : 'text-slate-500'
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
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black flex items-center gap-1.5 ${
                        selectedBookPage === 5 ? 'text-amber-500' : isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
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
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                                isTarget
                                  ? isDarkMode
                                    ? 'bg-amber-950/40 border-amber-400/60 shadow-md'
                                    : 'bg-amber-50 border-amber-300 shadow-xs'
                                  : isDarkMode
                                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                  : 'bg-white border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              <div className="flex-1">
                                <span className={`text-[10px] font-black uppercase block ${
                                  isEndQ ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400'
                                }`}>
                                  {isEndQ ? '🎯 किताब के अंत का असली प्रश्न' : `प्रश्न ${qIdx + 1}`}
                                </span>
                                <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {qItem.question}
                                </p>
                              </div>

                              <button
                                onClick={() => handleSolveChapterQuestion(qItem)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1 self-start sm:self-auto ${
                                  isTarget
                                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                                }`}
                              >
                                <span>{isTarget ? '✓ हल देख रहे हैं' : 'व्हाइटबोर्ड पर हल करें →'}</span>
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

          {/* DIGITAL WHITEBOARD (Properly Types & Solves Doubts) */}
          <div className={`rounded-3xl border overflow-hidden flex flex-col transition-all duration-200 ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800 shadow-2xl'
              : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className={`px-5 py-3 border-b flex items-center justify-between transition-colors ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className={`text-xs font-black uppercase ${
                  isDarkMode ? 'text-emerald-400' : 'text-indigo-700'
                }`}>
                  डिजिटल व्हाइटबोर्ड (Digital Blackboard)
                </span>
                <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>|</span>
                <span className={`text-xs font-bold truncate max-w-xs ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {whiteboardHeading}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* 📝 Kid Scratchpad / Rough Work Notebook Button */}
                <button
                  type="button"
                  onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-black border flex items-center gap-1.5 transition-all shadow-xs ${
                    isScratchpadOpen
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                      : isDarkMode
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                  title="बच्चे की रफ़ कॉपी खोलें (हाथ या माउस से गुणा-भाग करें)"
                >
                  <span>📝 रफ़ कॉपी</span>
                  {isScratchpadOpen && <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />}
                </button>

                <button
                  onClick={() => setChalkboardTheme(chalkboardTheme === 'green' ? 'slate' : 'green')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                  }`}
                >
                  <span>{chalkboardTheme === 'green' ? '🟩 ग्रीन बोर्ड' : '⬜ व्हाइटबोर्ड'}</span>
                </button>

                {/* Chalk Typewriter Live Animation Toggle */}
                <button
                  onClick={() => setIsTypewriterEnabled(!isTypewriterEnabled)}
                  title={isTypewriterEnabled ? 'फास्ट मोड चालू करें' : 'रियल चॉक राइटिंग चालू करें'}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all ${
                    isTypewriterEnabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                      : isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  <span>{isTypewriterEnabled ? '✍️ चॉक राइटिंग (Live)' : '⚡ तुरंत देखें'}</span>
                </button>

                {whiteboardSteps.length > 0 && (
                  <>
                    {/* Skip / Show Full Solution Immediately */}
                    {revealedSteps < whiteboardSteps.length && (
                      <button
                        onClick={() => setRevealedSteps(whiteboardSteps.length)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all ${
                          isDarkMode
                            ? 'bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border-indigo-700/50'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        <span>⏩ तुरंत पूरा हल</span>
                      </button>
                    )}

                    <button
                      onClick={() => setRevealedSteps(1)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                        isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
                      }`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>शुरू से देखें</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* WORKSHEET QUESTION NAVIGATOR RIBBON */}
            {detectedQuestions.length > 0 && (
              <div className={`px-4 py-2.5 border-b flex items-center gap-2 overflow-x-auto scrollbar-none transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/80 border-slate-200'
              }`}>
                <span className={`text-[11px] font-black uppercase shrink-0 flex items-center gap-1 ${
                  isDarkMode ? 'text-amber-400' : 'text-indigo-700'
                }`}>
                  <span>🎯</span> सवाल चुनें:
                </span>

                {/* Master Answer Key Button */}
                <button
                  onClick={() => {
                    setActiveTargetQuestion('सभी 15 सवालों के सही उत्तर व मास्टर कुंजी');
                    handleTriggerMode('check');
                  }}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shrink-0 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 whitespace-nowrap"
                >
                  <span>📋</span>
                  <span>सभी 15 उत्तर (Master Key)</span>
                </button>

                {detectedQuestions.map((qText, idx) => {
                  const isMCQ = qText.toLowerCase().includes('choice') || qText.toLowerCase().includes('mcq');
                  const isFill = qText.toLowerCase().includes('blank') || qText.toLowerCase().includes('fill');
                  const isTF = qText.toLowerCase().includes('true') || qText.toLowerCase().includes('false');
                  const label = isMCQ ? `MCQ ${idx + 1}` : isFill ? `Fill ${idx - 4}` : isTF ? `T/F ${idx - 9}` : `Q${idx + 1}`;
                  const isThisActive = activeTargetQuestion === qText;
                  const isThisLoading = isCheckingHomework && isThisActive;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveTargetQuestion(qText);
                        setActiveMathAnim(null);
                        const audioSpeech = `सवाल नंबर ${idx + 1}: ${qText}। आइए इस सवाल का हल व्हाइटबोर्ड पर देखते हैं!`;
                        setSpeechText(audioSpeech);
                        speakText(audioSpeech);
                        handleStudentQuery(`कृपया इस सवाल को व्हाइटबोर्ड पर हल करें: "${qText}"`);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 shadow-2xs whitespace-nowrap ${
                        isThisActive
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white border-amber-300 shadow-md shadow-amber-500/20 scale-105'
                            : 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105'
                          : isDarkMode
                          ? 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border-slate-700/80 hover:border-indigo-400'
                          : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {isThisLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <span className={isThisActive ? 'text-white' : isDarkMode ? 'text-amber-300' : 'text-indigo-600'}>#{idx + 1}</span>
                      )}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className={`p-6 space-y-4 transition-all duration-300 min-h-[220px] ${
                !isDarkMode
                  ? chalkboardTheme === 'green'
                    ? 'bg-[#0f2e1d] text-white shadow-inner'
                    : 'bg-white text-slate-900'
                  : chalkboardTheme === 'green'
                  ? 'bg-gradient-to-b from-[#0b2416] via-[#0d2a1b] to-[#07190f] border-emerald-900/40 shadow-inner text-white'
                  : 'bg-gradient-to-b from-slate-950/80 to-slate-900 text-white'
              }`}>
              {isCheckingHomework ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
                  {/* Glowing Radar & Teacher Avatar */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 border-2 border-indigo-400/50 flex items-center justify-center shadow-[0_0_35px_rgba(99,102,241,0.4)] animate-pulse">
                      <span className="text-4xl animate-bounce">{currentTeacher.emoji}</span>
                    </div>
                    <div className="absolute -inset-2 rounded-3xl border border-amber-400/40 animate-spin border-t-transparent" />
                  </div>

                  {/* Loader Headings */}
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs font-black uppercase tracking-wider">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      <span>लाइव AI विज़न एक्टिव (Scanning Live)</span>
                    </div>

                    <h4 className={`text-base sm:text-lg font-black ${isDarkMode || chalkboardTheme === 'green' ? 'text-white' : 'text-slate-900'}`}>
                      {activeTargetQuestion && activeTargetQuestion !== 'सभी 15 सवालों के सही उत्तर व मास्टर कुंजी'
                        ? 'सवाल का हल तैयार किया जा रहा है... ✍️'
                        : uploadedFileName
                        ? `दस्तावेज़ "${uploadedFileName}" से सवाल पढ़े जा रहे हैं... 🔍`
                        : `${currentTeacher.name} व्हाइटबोर्ड पर हल तैयार कर रहे हैं... ⏳`}
                    </h4>

                    {activeTargetQuestion && activeTargetQuestion !== 'सभी 15 सवालों के सही उत्तर व मास्टर कुंजी' && (
                      <p className={`text-xs font-semibold line-clamp-2 px-3 py-1.5 rounded-xl border ${
                        isDarkMode || chalkboardTheme === 'green'
                          ? 'text-amber-300 bg-slate-900/90 border-slate-800'
                          : 'text-indigo-900 bg-indigo-50 border-indigo-200'
                      }`}>
                        {activeTargetQuestion}
                      </p>
                    )}

                    <p className={`text-xs ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-500'}`}>
                      कृपया कुछ सेकंड प्रतीक्षा करें। सभी प्रश्न सीधे आपकी इमेज/PDF से लाइव निकाले जा रहे हैं।
                    </p>
                  </div>

                  {/* Pulsing Skeleton Step Cards */}
                  <div className="w-full max-w-md space-y-2 pt-2">
                    <div className={`p-3.5 rounded-2xl border flex items-center gap-3 animate-pulse ${
                      isDarkMode || chalkboardTheme === 'green'
                        ? 'bg-slate-900/80 border-slate-800/80'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className={`text-xs font-bold ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-600'}`}>चरण 1: प्रश्न व दिया गया मान</span>
                      <div className={`h-2 rounded w-1/3 ml-auto ${isDarkMode || chalkboardTheme === 'green' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    </div>
                    <div className={`p-3.5 rounded-2xl border flex items-center gap-3 animate-pulse delay-150 ${
                      isDarkMode || chalkboardTheme === 'green'
                        ? 'bg-slate-900/80 border-slate-800/80'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                      <span className={`text-xs font-bold ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-600'}`}>चरण 2: गणना व नियम</span>
                      <div className={`h-2 rounded w-1/4 ml-auto ${isDarkMode || chalkboardTheme === 'green' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    </div>
                    <div className={`p-3.5 rounded-2xl border flex items-center gap-3 animate-pulse delay-300 ${
                      isDarkMode || chalkboardTheme === 'green'
                        ? 'bg-slate-900/80 border-slate-800/80'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className={`text-xs font-bold ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-600'}`}>चरण 3: अंतिम उत्तर व विकल्प</span>
                      <div className={`h-2 rounded w-1/5 ml-auto ${isDarkMode || chalkboardTheme === 'green' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    </div>
                  </div>
                </div>
              ) : whiteboardSteps.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-3xl">📝</span>
                  <p className={`text-xs ${isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-500'}`}>
                    व्हाइटबोर्ड अभी खाली है। कोई भी पाठ चुनें, कॉपी की फोटो भेजें, या माइक से सवाल पूछें!
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
                      <TeacherWhiteboardAnimation
                        num1={activeMathAnim.num1}
                        op={activeMathAnim.op}
                        num2={activeMathAnim.num2}
                        result={activeMathAnim.result}
                        teacherName={currentTeacher.name}
                        theme={chalkboardTheme}
                        onAudioPlay={(t) => speakText(t)}
                        isAudioMuted={isAudioMuted}
                      />
                    </div>
                  )}

                  {/* Top Active Question Banner with Next & Prev Controls */}
                  {activeTargetQuestion && activeTargetQuestion !== 'सभी 15 सवालों के सही उत्तर व मास्टर कुंजी' && (
                    <div className={`p-4 rounded-2xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
                      !isDarkMode && chalkboardTheme !== 'green'
                        ? 'bg-amber-50 border-amber-300 text-slate-900'
                        : 'bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 border-amber-500/40 text-white shadow-lg'
                    }`}>
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-2xl shrink-0">🎯</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-black uppercase ${
                              !isDarkMode && chalkboardTheme !== 'green' ? 'text-amber-800' : 'text-amber-400'
                            }`}>
                              अभी हल किया जा रहा सवाल (Current Question In Focus):
                            </span>
                            {detectedQuestions.length > 0 && effectiveQuestionIdx !== -1 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                                सवाल {effectiveQuestionIdx + 1} / {detectedQuestions.length}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm sm:text-base font-extrabold leading-relaxed ${
                            !isDarkMode && chalkboardTheme !== 'green' ? 'text-slate-900' : 'text-white'
                          }`}>
                            {activeTargetQuestion}
                          </p>
                        </div>
                      </div>

                      {/* Next & Prev Question Navigation Buttons */}
                      {detectedQuestions.length > 0 && (
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-amber-200 dark:border-white/10 w-full md:w-auto justify-between md:justify-end">
                          <button
                            type="button"
                            onClick={handlePrevQuestion}
                            disabled={isCheckingHomework}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1 shadow-xs ${
                              !isDarkMode && chalkboardTheme !== 'green'
                                ? 'bg-white hover:bg-amber-100 text-slate-800 border-amber-300'
                                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                            }`}
                            title="पिछला सवाल (Previous Question)"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>पिछला (Prev)</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(`सवाल: ${activeTargetQuestion}`);
                            }}
                            className={`p-1.5 rounded-xl border transition-all ${
                              !isDarkMode && chalkboardTheme !== 'green'
                                ? 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'
                                : 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20'
                            }`}
                            title="सवाल बोलकर सुनें (Listen Question)"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={handleNextQuestion}
                            disabled={isCheckingHomework}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black transition-all flex items-center gap-1 shadow-md shadow-indigo-600/30"
                            title="अगला सवाल (Next Question)"
                          >
                            <span>अगला (Next)</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {whiteboardSteps.slice(0, revealedSteps).map((stepItem, idx) => {
                    const multiItems = parseMultiAnswerFormula(stepItem.formula, stepItem.step);
                    const singleQuestion = getQuestionForStep(stepItem, idx);

                    return (
                      <div
                        key={idx}
                        className={`p-4 md:p-5 rounded-3xl border transition-all ${
                          stepItem.isMistake
                            ? isDarkMode || chalkboardTheme === 'green'
                              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                              : 'bg-rose-50 border-rose-200 text-rose-950'
                            : idx === revealedSteps - 1
                            ? isDarkMode || chalkboardTheme === 'green'
                              ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                              : 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                            : isDarkMode || chalkboardTheme === 'green'
                            ? 'bg-slate-950/90 border-slate-800 text-slate-300'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        {/* Header: Step Label & Controls */}
                        <div className={`flex items-center justify-between pb-2 border-b ${
                          isDarkMode || chalkboardTheme === 'green' ? 'border-white/5' : 'border-slate-200'
                        }`}>
                          <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                            isDarkMode || chalkboardTheme === 'green' ? 'text-amber-400' : 'text-indigo-700'
                          }`}>
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            {stepItem.step}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSocraticHint(idx, stepItem)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1 transition-all ${
                                isDarkMode || chalkboardTheme === 'green'
                                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/20'
                                  : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
                              }`}
                            >
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                              <span>हिंट लो</span>
                            </button>
                            <button
                              onClick={() => speakText(`${stepItem.step}: ${stepItem.formula}. ${stepItem.annotation}`)}
                              className={`p-1.5 rounded-lg transition-all ${
                                isDarkMode || chalkboardTheme === 'green'
                                  ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs'
                              }`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* CASE A: Multi-Question Master Key (e.g. 1.(c) 30000, 2.(d) 900000...) */}
                        {multiItems && multiItems.length > 0 ? (
                          <div className="mt-3 space-y-2.5">
                            <span className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                              isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              <span>📋</span> हर सवाल व उसका सही उत्तर (Question & Answer Breakdown):
                            </span>
                            <div className="grid grid-cols-1 gap-2">
                              {multiItems.map((item, mIdx) => (
                                <div
                                  key={mIdx}
                                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs ${
                                    isDarkMode || chalkboardTheme === 'green'
                                      ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50'
                                      : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5 flex-1">
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-md border shrink-0 ${
                                      isDarkMode || chalkboardTheme === 'green'
                                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                                        : 'text-amber-800 bg-amber-50 border-amber-200'
                                    }`}>
                                      #{item.num}
                                    </span>
                                    <p className={`text-xs sm:text-sm font-bold leading-relaxed ${
                                      isDarkMode || chalkboardTheme === 'green' ? 'text-white' : 'text-slate-900'
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
                                  <div className="flex items-center gap-2 sm:self-center shrink-0 pl-7 sm:pl-0">
                                    <span className={`text-[10px] font-bold uppercase ${
                                      isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-slate-500'
                                    }`}>सही उत्तर:</span>
                                    <span className={`text-xs md:text-sm font-black px-3 py-1 rounded-xl border shadow-xs flex items-center gap-1 ${
                                      isDarkMode || chalkboardTheme === 'green'
                                        ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40'
                                        : 'text-emerald-800 bg-emerald-50 border-emerald-300'
                                    }`}>
                                      <span>{item.answer}</span>
                                      <span>✅</span>
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* CASE B: Single Question Step */
                          <div className="mt-3">
                            {/* ❓ PROMINENT QUESTION BOX */}
                            {singleQuestion && (
                              <div className={`mb-3 p-3.5 rounded-2xl border-2 shadow-xs ${
                                !isDarkMode && chalkboardTheme !== 'green'
                                  ? 'bg-amber-50/90 border-amber-200 text-slate-900'
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200 shadow-md'
                              }`}>
                                <div className={`flex items-center justify-between flex-wrap gap-2 text-xs font-black uppercase mb-2 ${
                                  !isDarkMode && chalkboardTheme !== 'green' ? 'text-amber-800' : 'text-amber-400'
                                }`}>
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                    ❓ सवाल (Original Question):
                                  </span>

                                  {/* Quick Switcher Controls: Prev, Count, Next, Audio */}
                                  <div className="flex items-center gap-1.5">
                                    {(detectedQuestions.length > 1 || (selectedChapter?.sampleQuestions && selectedChapter.sampleQuestions.length > 1)) && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePrevQuestion();
                                          }}
                                          disabled={isCheckingHomework}
                                          className={`px-2.5 py-1 rounded-xl border text-[11px] font-black transition-all flex items-center gap-1 shadow-2xs ${
                                            !isDarkMode && chalkboardTheme !== 'green'
                                              ? 'bg-white hover:bg-amber-100 text-slate-800 border-amber-300'
                                              : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                                          }`}
                                          title="पिछला सवाल (Previous Question)"
                                        >
                                          <ChevronLeft className="w-3.5 h-3.5" />
                                          <span>पिछला (Prev)</span>
                                        </button>

                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                          !isDarkMode && chalkboardTheme !== 'green'
                                            ? 'bg-amber-200/60 text-amber-900 border-amber-300'
                                            : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                                        }`}>
                                          {detectedQuestions.length > 0
                                            ? `सवाल ${effectiveQuestionIdx !== -1 ? effectiveQuestionIdx + 1 : 1} / ${detectedQuestions.length}`
                                            : `सवाल ${activeQuestionIdx + 1} / ${selectedChapter?.sampleQuestions?.length || 1}`}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleNextQuestion();
                                          }}
                                          disabled={isCheckingHomework}
                                          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-[11px] font-black transition-all flex items-center gap-1 shadow-xs"
                                          title="अगला सवाल (Next Question)"
                                        >
                                          <span>अगला (Next)</span>
                                          <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        speakText(`सवाल: ${singleQuestion}`);
                                      }}
                                      className={`p-1.5 rounded-xl border transition-all ${
                                        !isDarkMode && chalkboardTheme !== 'green'
                                          ? 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'
                                          : 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20'
                                      }`}
                                      title="सवाल बोलकर सुनें (Listen Question)"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <p className={`text-sm sm:text-base md:text-lg font-bold leading-relaxed ${
                                  !isDarkMode && chalkboardTheme !== 'green' ? 'text-slate-900' : 'text-white'
                                }`}>
                                  <ChalkTypewriter
                                    text={singleQuestion}
                                    speed={20}
                                    enabled={isTypewriterEnabled}
                                    isChalkboard={chalkboardTheme === 'green'}
                                  />
                                </p>

                                {/* Bottom Prev/Next Navigation in Question Box */}
                                {(detectedQuestions.length > 1 || (selectedChapter?.sampleQuestions && selectedChapter.sampleQuestions.length > 1)) && (
                                  <div className="mt-3 pt-2.5 border-t border-amber-300/40 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrevQuestion();
                                      }}
                                      disabled={isCheckingHomework}
                                      className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs ${
                                        !isDarkMode && chalkboardTheme !== 'green'
                                          ? 'bg-white hover:bg-amber-100 text-slate-800 border-amber-300'
                                          : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                                      }`}
                                      title="पिछला सवाल हल करें"
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                      <span>◀ पिछला सवाल (Prev Question)</span>
                                    </button>

                                    <span className={`text-[11px] font-black px-3 py-1 rounded-full ${
                                      !isDarkMode && chalkboardTheme !== 'green' ? 'text-amber-900 bg-amber-200/50' : 'text-amber-300 bg-amber-500/20'
                                    }`}>
                                      {detectedQuestions.length > 0
                                        ? `सवाल ${effectiveQuestionIdx !== -1 ? effectiveQuestionIdx + 1 : 1} of ${detectedQuestions.length}`
                                        : `सवाल ${activeQuestionIdx + 1} of ${selectedChapter?.sampleQuestions?.length || 1}`}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNextQuestion();
                                      }}
                                      disabled={isCheckingHomework}
                                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                                      title="अगला सवाल हल करें"
                                    >
                                      <span>अगला सवाल (Next Question) ▶</span>
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 📐 FORMULA / CALCULATION / ANSWER */}
                            <div className={`p-4 rounded-2xl border shadow-inner ${
                              isDarkMode || chalkboardTheme === 'green'
                                ? 'bg-slate-950/90 border-white/5'
                                : 'bg-white border-slate-200 shadow-xs'
                            }`}>
                              <span className={`text-[10px] uppercase font-black block mb-2 ${
                                isDarkMode || chalkboardTheme === 'green' ? 'text-slate-400' : 'text-indigo-700'
                              }`}>
                                ✅ सही हल व गणना (Solution & Answer Steps):
                              </span>
                              <div>
                                {renderFormulaBlocks(stepItem.formula)}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Teacher Annotation */}
                        <div className={`mt-3 p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                          isDarkMode || chalkboardTheme === 'green'
                            ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                            : 'bg-indigo-50/50 border-indigo-100 text-slate-800 shadow-2xs'
                        }`}>
                          <span className="text-xl shrink-0">{currentTeacher.emoji}</span>
                          <div>
                            <span className={`text-xs font-black block mb-0.5 ${
                              isDarkMode || chalkboardTheme === 'green' ? 'text-amber-300' : 'text-indigo-800'
                            }`}>
                              {currentTeacher.name} का स्पष्टीकरण:
                            </span>
                            <p className="text-xs sm:text-sm font-medium leading-relaxed">
                              <ChalkTypewriter
                                text={stepItem.annotation}
                                speed={18}
                                delay={isTypewriterEnabled ? 200 : 0}
                                enabled={isTypewriterEnabled}
                                isChalkboard={chalkboardTheme === 'green'}
                              />
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {revealedSteps < whiteboardSteps.length && (
                    <button
                      onClick={() => {
                        const next = revealedSteps + 1;
                        setRevealedSteps(next);
                        const s = whiteboardSteps[revealedSteps];
                        if (s) speakText(`${s.step}: ${s.formula}. ${s.annotation}`);
                      }}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-xs md:text-sm shadow-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <span>अगला कदम समझें (Next Step)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {/* Bottom Next & Prev Question Navigation Footer */}
                  {detectedQuestions.length > 0 && (
                    <div className={`p-4 rounded-3xl border-2 flex items-center justify-between gap-3 shadow-lg mt-4 ${
                      !isDarkMode && chalkboardTheme !== 'green'
                        ? 'bg-gradient-to-r from-amber-50 via-white to-indigo-50 border-indigo-200 text-slate-900'
                        : 'bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-white/10 text-white'
                    }`}>
                      <button
                        type="button"
                        onClick={handlePrevQuestion}
                        disabled={isCheckingHomework}
                        className={`px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-xs ${
                          !isDarkMode && chalkboardTheme !== 'green'
                            ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>पिछला सवाल (Prev)</span>
                      </button>

                      <div className="text-center px-2">
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-0.5">
                          सवाल नेविगेशन
                        </span>
                        <span className={`text-xs sm:text-sm font-black ${
                          !isDarkMode && chalkboardTheme !== 'green' ? 'text-indigo-950' : 'text-amber-300'
                        }`}>
                          सवाल {effectiveQuestionIdx !== -1 ? effectiveQuestionIdx + 1 : 1} / {detectedQuestions.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        disabled={isCheckingHomework}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                      >
                        <span>अगला सवाल (Next)</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* INTERACTIVE PRACTICE QUESTION (If chapter is loaded) */}
          {currentQ && (
            <div className={`rounded-3xl p-6 border transition-all duration-200 space-y-4 ${
              isDarkMode
                ? 'bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border-indigo-500/30 shadow-2xl'
                : 'bg-white border-slate-200 shadow-sm text-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                  isDarkMode
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

              <h3 className={`text-base md:text-lg font-bold leading-relaxed ${
                isDarkMode ? 'text-white' : 'text-slate-900'
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
                        className={`p-3.5 rounded-2xl border text-left font-bold text-xs md:text-sm transition-all flex items-center justify-between ${
                          isCorrect
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
                      className={`flex-1 border-2 rounded-2xl px-5 py-3 text-sm outline-none transition-all ${
                        isDarkMode
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
                <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                  isDarkMode
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
                <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
                  isDarkMode
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
      <footer className={`sticky bottom-0 backdrop-blur-md border-t p-3 md:p-4 z-20 transition-colors duration-200 ${
        isDarkMode
          ? 'bg-slate-900/95 border-slate-800 shadow-2xl'
          : 'bg-white/95 border-slate-200 shadow-lg'
      }`}>
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={toggleMic}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all transform active:scale-95 shrink-0 ${
              isListening
                ? 'bg-rose-600 animate-pulse ring-4 ring-rose-500/40'
                : 'bg-gradient-to-tr from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 shadow-indigo-600/40 hover:scale-105'
            }`}
            title="माइक से बोलें"
          >
            {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'सुन रहे हैं... बोलिए बेटा!' : 'माइक दबाकर बोलें या सवाल यहाँ टाइप करें...'}
              className={`w-full border rounded-2xl px-5 py-3.5 text-xs md:text-sm outline-none transition-all pr-12 ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-700 focus:border-indigo-400 text-white placeholder-slate-500'
                  : 'bg-slate-100 border-slate-300 focus:border-indigo-500 focus:bg-white text-slate-900 placeholder-slate-400'
              }`}
              onKeyDown={(e) => e.key === 'Enter' && handleStudentQuery(inputText || inputRef.current?.value)}
            />
            <button
              type="button"
              onClick={() => handleStudentQuery(inputText || inputRef.current?.value)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <label
            htmlFor="homework-upload-input"
            className={`p-3.5 rounded-2xl border flex items-center gap-1.5 text-xs font-bold shrink-0 transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-2xs'
            }`}
            title="होमवर्क या बुक पेज की फोटो खींचें"
          >
            <Camera className="w-5 h-5 text-amber-500" />
            <span className="hidden sm:inline">फोटो खींचो</span>
          </label>
        </div>

        {/* Quick Suggestion Chips for Switching Subjects */}
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none mt-2 pt-1 text-[11px]">
          <span className={`font-bold shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>सुझाव:</span>
          {[
            '10 + 10 = ?',
            'Math का Chapter 8 पढ़ाओ',
            '25 + 35 हल करो',
            'English का Chapter 5 पढ़ाओ',
            'त्रिज्या और व्यास में क्या फर्क है?',
            'मेरी कॉपी चेक करो',
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(chip);
                handleStudentQuery(chip);
              }}
              className={`px-3 py-1 rounded-full border transition-all shrink-0 whitespace-nowrap ${
                isDarkMode
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </footer>
      {/* PARENT WHATSAPP REPORT MODAL */}
      <ParentWhatsAppReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        studentName="राहुल कुमावत"
        className={className}
        board={board}
        teacherName={currentTeacher.name}
        subjectName={selectedSubject?.subjectHindi || 'गणित (Mathematics)'}
        score={
          detectedQuestions.length > 0
            ? Math.max(1, detectedQuestions.length - 1)
            : totalScore || 9
        }
        totalQuestions={detectedQuestions.length > 0 ? detectedQuestions.length : 10}
        topicsCovered={
          detectedQuestions.length > 0
            ? [
                `वर्कशीट: ${uploadedFileName || 'वर्कशीट'} (${detectedQuestions.length} सवाल हल किए)`,
                `मुख्य प्रश्न: "${detectedQuestions[0].slice(0, 50)}..."`,
                `${currentTeacher.name} द्वारा व्हाइटबोर्ड पर स्टेप-बाय-स्टेप हल व नियम स्पष्ट किए गए`,
              ]
            : undefined
        }
      />

      {/* SUNDAY PRINTABLE TEST PAPER MODAL */}
      <PrintableSundayExamModal
        isOpen={isSundayExamModalOpen}
        onClose={() => setIsSundayExamModalOpen(false)}
        studentName="राहुल कुमावत"
        className={className}
        board={board}
        subjectName={selectedSubject?.subjectHindi || 'गणित'}
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
          <div className={`max-w-md w-full rounded-3xl p-6 border text-center space-y-4 shadow-2xl transition-all ${
            isDarkMode ? 'bg-slate-900 border-amber-500/40 text-white' : 'bg-white border-amber-300 text-slate-900'
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
              <button
                type="button"
                onClick={() => {
                  setIsWorksheetCelebrationOpen(false);
                  setIsReportModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>📱 मम्मी-पापा को खुशखबरी व्हाट्सएप पर भेजें</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWorksheetCelebrationOpen(false)}
                className={`w-full py-2 px-4 rounded-xl border text-xs font-bold transition-all ${
                  isDarkMode
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
      {detectedQuestions.length > 1 && (
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
    </div>
  );
}
