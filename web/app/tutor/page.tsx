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
} from 'lucide-react';
import ParentWhatsAppReportModal from '@/components/ParentWhatsAppReportModal';
import PrintableSundayExamModal from '@/components/PrintableSundayExamModal';
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

  // Homework Photo Upload
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [detectedQuestions, setDetectedQuestions] = useState<string[]>([]);
  const [customQuizQuestions, setCustomQuizQuestions] = useState<any[]>([]);
  const [currentUploadMode, setCurrentUploadMode] = useState<'teach' | 'check' | 'quiz'>('teach');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSundayExamModalOpen, setIsSundayExamModalOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [chalkboardTheme, setChalkboardTheme] = useState<'slate' | 'green'>('slate');
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);

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
        <div className="space-y-2 pt-1">
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
                    ? isDarkMode
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                    : isDarkMode
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
                  <span className="leading-relaxed">{part.replace(/\[|\]/g, '')}</span>
                </div>
                {isFinal && (
                  <span className="text-xs bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded-full shadow-xs shrink-0">
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
      <div className={`text-base sm:text-xl font-bold tracking-wide leading-relaxed ${
        isDarkMode ? 'text-white' : 'text-slate-900'
      }`}>
        {clean}
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

  // Text-To-Speech
  const speakText = (text: string) => {
    if (isAudioMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text
        .replace(/<[^>]*>/g, '')
        .replace(/[*_#]/g, '')
        .replace(/≠/g, ' बराबर नहीं है ')
        .replace(/×/g, ' गुणा ')
        .replace(/÷/g, ' भाग ')
        .replace(/1\/2/g, ' आधा ')
        .replace(/1\/4/g, ' चौथाई ');

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.85;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
      setIsSpeaking(false);
    }
  };

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
    setActiveQuestionIdx(0);
    setSelectedMCQ(null);
    setTypedAnswer('');
    setAnswerStatus('idle');

    setWhiteboardHeading(`पाठ ${ch.chapterNumber}: ${ch.titleHindi}`);

    // If chapter has sample questions with whiteboard steps
    if (ch.sampleQuestions && ch.sampleQuestions[0]?.whiteboardSteps) {
      setWhiteboardSteps(ch.sampleQuestions[0].whiteboardSteps);
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
    }

    setRevealedSteps(1);

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

    const welcomeMsg = `शाबाश बेटा! अब हम पाठ ${ch.chapterNumber} "${ch.titleHindi}" पढ़ेंगे। मैंने व्हाइटबोर्ड पर पहला स्टेप लिख दिया है, ध्यान से देखिए!`;
    setSpeechText(welcomeMsg);
    speakText(welcomeMsg);
  };

  // Handle Free-Form Student Query or Doubt
  const handleStudentQuery = async (queryText?: string) => {
    const q = (queryText || inputText).trim();
    if (!q && !uploadedImage) return;

    setInputText('');
    setIsCheckingHomework(true);

    // If no image is uploaded, check if user explicitly requested a textbook chapter
    if (!uploadedImage) {
      const qLower = q.toLowerCase();
      if (qLower.includes('math') || q.includes('गणित')) {
        const mathSub = allSubjects.find((s) => s.id === 'math');
        if (mathSub) setSelectedSubject(mathSub);
      } else if (qLower.includes('english') || q.includes('अंग्रेजी')) {
        const engSub = allSubjects.find((s) => s.id === 'english');
        if (engSub) setSelectedSubject(engSub);
      } else if (qLower.includes('evs') || q.includes('पर्यावरण')) {
        const evsSub = allSubjects.find((s) => s.id === 'evs');
        if (evsSub) setSelectedSubject(evsSub);
      } else if (qLower.includes('hindi') || q.includes('हिंदी')) {
        const hinSub = allSubjects.find((s) => s.id === 'hindi');
        if (hinSub) setSelectedSubject(hinSub);
      }

      // Check if query explicitly asks for textbook chapters (e.g. 'पाठ 1', 'chapter 3')
      const mathSub = allSubjects.find((s) => s.id === 'math');
      if (mathSub) {
        if (q.includes('पाठ 1') || q.includes('chapter 1') || q.includes('पुस्तकालय')) {
          setSelectedSubject(mathSub);
          const ch = mathSub.chapters.find((c) => c.chapterNumber === 1);
          if (ch) { setIsCheckingHomework(false); handleStartChapter(ch); return; }
        }
        if (q.includes('पाठ 2') || q.includes('chapter 2') || q.includes('जनक का गाँव')) {
          setSelectedSubject(mathSub);
          const ch = mathSub.chapters.find((c) => c.chapterNumber === 2);
          if (ch) { setIsCheckingHomework(false); handleStartChapter(ch); return; }
        }
        if (q.includes('पाठ 3') || q.includes('chapter 3') || q.includes('संख्याओं में जोड़')) {
          setSelectedSubject(mathSub);
          const ch = mathSub.chapters.find((c) => c.chapterNumber === 3);
          if (ch) { setIsCheckingHomework(false); handleStartChapter(ch); return; }
        }
        if (q.includes('पाठ 4') || q.includes('chapter 4') || q.includes('जोड़-घटाव')) {
          setSelectedSubject(mathSub);
          const ch = mathSub.chapters.find((c) => c.chapterNumber === 4);
          if (ch) { setIsCheckingHomework(false); handleStartChapter(ch); return; }
        }
        if (q.includes('पाठ 5') || q.includes('chapter 5') || q.includes('वैदिक गणित')) {
          setSelectedSubject(mathSub);
          const ch = mathSub.chapters.find((c) => c.chapterNumber === 5);
          if (ch) { setIsCheckingHomework(false); handleStartChapter(ch); return; }
        }
        if (q.includes('पाठ 6') || q.includes('chapter 6') || q.includes('आकृतियाँ')) {
          setSelectedSubject(mathSub);
          const ch = mathSub.chapters.find((c) => c.chapterNumber === 6);
          if (ch) { setIsCheckingHomework(false); handleStartChapter(ch); return; }
        }
        if (q.includes('पाठ 7') || q.includes('chapter 7') || q.includes('सममिति')) {
          setSelectedSubject(mathSub);
          const ch = mathSub.chapters.find((c) => c.chapterNumber === 7);
          if (ch) { setIsCheckingHomework(false); handleStartChapter(ch); return; }
        }
        if (q.includes('पाठ 8') || q.includes('chapter 8') || q.includes('पहाड़े बनाएँ')) {
          setSelectedSubject(mathSub);
          const ch = mathSub.chapters.find((c) => c.chapterNumber === 8);
          if (ch) { setIsCheckingHomework(false); handleStartChapter(ch); return; }
        }
      }

      if ((q.includes('पाठ 5') || q.includes('chapter 5')) && (qLower.includes('english') || q.includes('helen'))) {
        const engSub = allSubjects.find((s) => s.id === 'english');
        if (engSub) {
          setSelectedSubject(engSub);
          const ch5 = engSub.chapters.find((c) => c.chapterNumber === 5);
          if (ch5) {
            setIsCheckingHomework(false);
            handleStartChapter(ch5);
            return;
          }
        }
      }

      if ((q.includes('पाठ 11') || q.includes('chapter 11')) && (qLower.includes('evs') || q.includes('फूल') || q.includes('valley'))) {
        const evsSub = allSubjects.find((s) => s.id === 'evs');
        if (evsSub) {
          setSelectedSubject(evsSub);
          const ch11 = evsSub.chapters.find((c) => c.chapterNumber === 11);
          if (ch11) {
            setIsCheckingHomework(false);
            handleStartChapter(ch11);
            return;
          }
        }
      }
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
          setRevealedSteps(data.whiteboard_steps.length);
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

  // Photo Upload Handler (Book Page / Homework)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsCheckingHomework(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setUploadedImage(b64);
      const msg = `बेटा, मैंने आपकी बुक या कॉपी का पेज "${file.name}" देख लिया है। मैं इसे ध्यान से पढ़कर व्हाइटबोर्ड पर समझा रहा हूँ!`;
      setSpeechText(msg);
      speakText(msg);

      try {
        const res = await fetch('/api/tutor/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_id: currentTeacher.id,
            question: 'कृपया इस वर्कशीट या पेज के सभी 15 सवाल (MCQs, खाली स्थान / Fill in blanks, सही-गलत / True-False) पहचानें और हर सवाल को <detected_question> टैग में शामिल करें ताकि बच्चा किसी भी सवाल पर क्लिक करके उसका हल देख सके। और पहले सवाल का व्हाइटबोर्ड पर स्टेप-बाय-स्टेप हल सिखाएं।',
            image_url: b64,
            file_name: file.name,
            board,
            className,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.reply || `पेज "${file.name}" का हल व्हाइटबोर्ड पर आ गया है बेटा!`;
          setSpeechText(reply);
          speakText(reply);

          if (data.whiteboard_steps && data.whiteboard_steps.length > 0) {
            setWhiteboardHeading(`पेज हल: ${file.name}`);
            setWhiteboardSteps(data.whiteboard_steps);
            setRevealedSteps(data.whiteboard_steps.length);
          }
          if (data.detected_questions && Array.isArray(data.detected_questions) && data.detected_questions.length > 0) {
            setDetectedQuestions(data.detected_questions);
            setActiveTargetQuestion(data.detected_questions[0]);
          }
        } else {
          fallbackUploadResponse(file.name);
        }
      } catch {
        fallbackUploadResponse(file.name);
      } finally {
        setIsCheckingHomework(false);
      }
    };
    reader.readAsDataURL(file);

    // Reset input value so selecting the same or another file triggers onChange
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
              className="sr-only"
              onChange={handlePhotoUpload}
            />

            {uploadedImage ? (
              <div className={`rounded-2xl border p-3 space-y-2.5 ${
                isDarkMode ? 'border-emerald-500/50 bg-slate-950' : 'border-emerald-300 bg-slate-50'
              }`}>
                {uploadedFileName.toLowerCase().endsWith('.pdf') ? (
                  <div className={`p-3 rounded-xl border flex items-center gap-3 ${
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
                  </div>
                ) : (
                  <img
                    src={uploadedImage}
                    alt="Uploaded Homework"
                    className="w-full h-36 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                  />
                )}

                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[180px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {uploadedFileName || 'बुक / कॉपी का पेज'}
                  </span>
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setUploadedFileName('');
                      setDetectedQuestions([]);
                      setCustomQuizQuestions([]);
                      setCurrentUploadMode('teach');
                    }}
                    className="text-slate-400 hover:text-rose-500 text-xs font-bold"
                  >
                    हटाएं (Clear)
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
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                      {detectedQuestions.map((qText, idx) => {
                        const isThisActive = activeTargetQuestion === qText;
                        const isThisLoading = isCheckingHomework && isThisActive;

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveTargetQuestion(qText);
                              handleStudentQuery(`कृपया इस सवाल को हल करें: "${qText}"`);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left border transition-all group flex items-start gap-2 shadow-xs ${
                              isThisActive
                                ? isDarkMode
                                  ? 'bg-indigo-950/80 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                                  : 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold shadow-xs'
                                : isDarkMode
                                ? 'bg-slate-900 hover:bg-indigo-900/40 border-slate-800 hover:border-indigo-500/50 text-slate-200'
                                : 'bg-white hover:bg-indigo-50/60 border-slate-200 hover:border-indigo-300 text-slate-700'
                            }`}
                          >
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
                          </button>
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

              {whiteboardSteps.length > 0 && (
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
                  {/* Top Active Question Banner if user selected a question */}
                  {activeTargetQuestion && activeTargetQuestion !== 'सभी 15 सवालों के सही उत्तर व मास्टर कुंजी' && (
                    <div className={`p-4 rounded-2xl border-2 flex items-start gap-3 shadow-xs ${
                      !isDarkMode && chalkboardTheme !== 'green'
                        ? 'bg-amber-50 border-amber-300 text-slate-900'
                        : 'bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 border-amber-500/40 text-white shadow-lg'
                    }`}>
                      <span className="text-2xl shrink-0">🎯</span>
                      <div className="flex-1">
                        <span className={`text-[10px] font-black uppercase block mb-1 ${
                          !isDarkMode && chalkboardTheme !== 'green' ? 'text-amber-800' : 'text-amber-400'
                        }`}>
                          अभी हल किया जा रहा सवाल (Current Question In Focus):
                        </span>
                        <p className={`text-sm sm:text-base font-extrabold leading-relaxed ${
                          !isDarkMode && chalkboardTheme !== 'green' ? 'text-slate-900' : 'text-white'
                        }`}>
                          {activeTargetQuestion}
                        </p>
                      </div>
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
                                      {item.matchedQuestion}
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
                                <div className={`flex items-center justify-between text-xs font-black uppercase mb-1 ${
                                  !isDarkMode && chalkboardTheme !== 'green' ? 'text-amber-800' : 'text-amber-400'
                                }`}>
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                    ❓ सवाल (Original Question):
                                  </span>
                                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                                    !isDarkMode && chalkboardTheme !== 'green'
                                      ? 'bg-amber-200/60 text-amber-900 border-amber-300'
                                      : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                                  }`}>
                                    Question Text
                                  </span>
                                </div>
                                <p className={`text-sm sm:text-base md:text-lg font-bold leading-relaxed ${
                                  !isDarkMode && chalkboardTheme !== 'green' ? 'text-slate-900' : 'text-white'
                                }`}>
                                  {singleQuestion}
                                </p>
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
                              {stepItem.annotation}
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
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'सुन रहे हैं... बोलिए बेटा!' : 'माइक दबाकर बोलें या सवाल यहाँ टाइप करें...'}
              className={`w-full border rounded-2xl px-5 py-3.5 text-xs md:text-sm outline-none transition-all pr-12 ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-700 focus:border-indigo-400 text-white placeholder-slate-500'
                  : 'bg-slate-100 border-slate-300 focus:border-indigo-500 focus:bg-white text-slate-900 placeholder-slate-400'
              }`}
              onKeyDown={(e) => e.key === 'Enter' && handleStudentQuery()}
            />
            <button
              onClick={() => handleStudentQuery()}
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
            'Math का Chapter 8 पढ़ाओ',
            'English का Chapter 5 पढ़ाओ',
            'EVS का Chapter 11 पढ़ाओ',
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
        score={totalScore || 8}
        totalQuestions={10}
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
    </div>
  );
}
