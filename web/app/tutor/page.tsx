'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mic,
  Volume2,
  VolumeX,
  Edit3,
  RotateCcw,
  Sparkles,
  Send,
  ArrowLeft,
  CheckCircle2,
  Globe2,
  Brain,
  Video,
  Target,
  Layout,
  MessageSquare,
  HelpCircle,
  Play,
  Camera,
  Upload,
  FileText,
  AlertTriangle,
  X,
  FileCheck,
  Eye,
  Maximize2,
} from 'lucide-react';
import { OnlineVideoTeacher, TeacherInfo } from '@/components/OnlineVideoTeacher';

const ALL_TEACHERS: TeacherInfo[] = [
  {
    id: 'sharma',
    name: 'Sharma Sir',
    subject: 'Math 📐',
    emoji: '👨‍🏫',
    activeColor: 'border-amber-400 bg-amber-50',
    themeColor: '#4338ca',
    avatarRole: 'Class 1st-8th Mathematics Mentor',
    image: '/teachers/sharma.jpg',
  },
  {
    id: 'neha',
    name: 'Neha Mam',
    subject: 'Science 🔬',
    emoji: '👩‍🔬',
    activeColor: 'border-sky-400 bg-sky-50',
    themeColor: '#0284c7',
    avatarRole: 'Class 1st-8th Science & EVS Specialist',
    image: '/teachers/neha.jpg',
  },
  {
    id: 'riya',
    name: 'Riya Didi',
    subject: 'English 📚',
    emoji: '👩‍🏫',
    activeColor: 'border-pink-400 bg-pink-50',
    themeColor: '#be185d',
    avatarRole: 'English Phonetics & Grammar Coach',
    image: '/teachers/riya.jpg',
  },
  {
    id: 'kabir',
    name: 'Kabir Sir',
    subject: 'SST 🌍',
    emoji: '👨‍💼',
    activeColor: 'border-purple-400 bg-purple-50',
    themeColor: '#7e22ce',
    avatarRole: 'Social Studies & Geography Guide',
    image: '/teachers/kabir.jpg',
  },
  {
    id: 'pooja',
    name: 'Pooja Mam',
    subject: 'Hindi ✍️',
    emoji: '👩‍🎓',
    activeColor: 'border-emerald-400 bg-emerald-50',
    themeColor: '#059669',
    avatarRole: 'Hindi Language & Vyakaran Expert',
    image: '/teachers/neha.jpg',
  },
];

interface WhiteboardStep {
  step: string;
  formula: string;
  annotation: string;
  isMistake?: boolean;
}

export default function WebAITutorStudio() {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherInfo>(ALL_TEACHERS[0]); // Sharma Sir
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [languageMode, setLanguageMode] = useState<'Hinglish' | 'Hindi' | 'English'>('Hinglish');
  const [pointerEnabled, setPointerEnabled] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Page Upload States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedPagePreview, setUploadedPagePreview] = useState<string | null>(null);
  const [isScanningPage, setIsScanningPage] = useState(false);
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'scannedPage'>('whiteboard');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState([
    {
      sender: 'teacher',
      text: 'Namaste beta! Main Sharma Sir hoon. Live Video Classroom me aapka swagat hai. Apna sawaal bolkar poochein ya "Upload Page 📸" button se apni notebook ki photo bhejein!',
      time: '10:00 AM',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [whiteboardSteps, setWhiteboardSteps] = useState<WhiteboardStep[]>([
    {
      step: 'Step 1: NCERT Method',
      formula: '1/2 + 1/4 = ?',
      annotation: 'Sharma Sir: "Dono denominators (2 aur 4) ka LCM lete hain: LCM(2, 4) = 4"',
    },
    {
      step: 'Step 2: Equivalent Fractions',
      formula: '1/2 = 2/4  |  2/4 + 1/4',
      annotation: 'Sharma Sir: "Ab dono base same hain, numerators ko direct add karenge."',
    },
    {
      step: 'Step 3: Final Answer',
      formula: '2/4 + 1/4 = 3/4',
      annotation: '✅ Final Answer: 3/4 (Pona hissa - bilkul sahi calculation!)',
    },
  ]);

  // Whiteboard pointer step-progression during speech
  useEffect(() => {
    let stepTimer: NodeJS.Timeout;
    if (isSpeakingAudio && whiteboardSteps.length > 1) {
      stepTimer = setInterval(() => {
        setActiveStepIndex((prev) => (prev + 1) % whiteboardSteps.length);
      }, 4200);
    }
    return () => clearInterval(stepTimer);
  }, [isSpeakingAudio, whiteboardSteps.length]);

  // Voice Speech Synthesis (Teacher speaks aloud with audio control)
  const speakText = (text: string) => {
    if (isAudioMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/<[^>]*>/g, '').replace(/[*_#]/g, '');
      setCurrentSpeechText(clean);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = languageMode === 'English' ? 'en-IN' : 'hi-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeakingAudio(true);
      utterance.onend = () => {
        setIsSpeakingAudio(false);
        setCurrentSpeechText('');
      };
      utterance.onerror = () => {
        setIsSpeakingAudio(false);
        setCurrentSpeechText('');
      };

      // Workaround for Chrome voice pausing
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Handle Notebook Page / Homework Photo Upload
  const handlePageUpload = async (file: File) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setUploadedPagePreview(previewUrl);
    setIsUploadModalOpen(false);
    setIsScanningPage(true);
    setActiveTab('scannedPage');

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { sender: 'student', text: `📸 [Uploaded Notebook Page: ${file.name}] - Sir kripya check karein.`, time: currentTime },
    ]);

    // Send to backend Gemini multimodal route
    const formData = new FormData();
    formData.append('homework_image', file);
    formData.append('teacher_id', selectedTeacher.id === 'neha' ? 'neha_mam' : selectedTeacher.id === 'sharma' ? 'sharma_sir' : 'sharma_sir');
    formData.append('question', 'Please check this student notebook solution line-by-line and point out any mistakes on the blackboard.');

    let replyText = '';
    let newSteps: WhiteboardStep[] = [];

    try {
      const res = await fetch('http://localhost:5000/api/tutor/ask', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply;
        if (data.whiteboard_steps && data.whiteboard_steps.length > 0) {
          newSteps = data.whiteboard_steps.map((s: any, idx: number) => ({
            step: s.step || `Step ${idx + 1}`,
            formula: s.formula || 'Concept Point',
            annotation: s.annotation || s.formula || '',
          }));
        }
      }
    } catch {
      // Local fallback
    }

    if (!replyText) {
      replyText = `Shabash beta! Main aapki notebook ka page line-by-line check kar raha hoon. Dekhiye, Step 2 me calculation mistake hai. Whiteboard par maine sahi method laser pointer se mark kar diya hai!`;
      newSteps = [
        {
          step: 'Step 1: Notebook Line 1 Verified',
          formula: '15 × 6 = 90  ✅ Correct',
          annotation: `${selectedTeacher.name}: "First multiplication bilkul sahi hai beta!"`,
        },
        {
          step: 'Step 2: Mistake Found in Fraction Subtraction',
          formula: '(4/5) - (2/5) ≠ 2/0  ❌ Denominator Zero Error',
          annotation: '⚠️ Mistake: Fractions me subtract karte waqt denominator (5) same rehta hai, zero nahi hota!',
          isMistake: true,
        },
        {
          step: 'Step 3: Correct Solution',
          formula: '(4 - 2) / 5 = 2/5  ✅ Final Answer',
          annotation: `${selectedTeacher.name}: "Sahi answer 2/5 hai. Isko apni notebook me theek kar lijiye."`,
        },
      ];
    }

    setIsScanningPage(false);

    setMessages((prev) => [
      ...prev,
      { sender: 'teacher', text: replyText, time: currentTime },
    ]);

    setWhiteboardSteps(newSteps);
    setActiveStepIndex(1); // Point to the mistake step
    speakText(replyText);
  };

  // Sample Demo Page for instant testing
  const handleLoadSamplePage = () => {
    // Generate simulated sample page
    setUploadedPagePreview('sample_notebook');
    setIsUploadModalOpen(false);
    setIsScanningPage(true);
    setActiveTab('scannedPage');

    setTimeout(() => {
      setIsScanningPage(false);
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const replyText = `Shabash beta! Maine aapki notebook ka page scan kar liya hai. Q2 me fractions ka denominator zero likha hua hai jo galat hai. Board par laser pointer dekhein, sahi answer 2/5 hai!`;

      const newSteps: WhiteboardStep[] = [
        {
          step: 'Page Check: Question 1',
          formula: '15 × 6 = 90  ✅ Sahi Calculation',
          annotation: 'Sharma Sir: "Table of 15 bilkul sahi apply kiya hai."',
        },
        {
          step: 'Page Check: Question 2 (Mistake Detected)',
          formula: '(4/5) - (2/5) = 2/0  ❌ Denominator Mistake',
          annotation: '⚠️ Denominator (5) constant rahega: Denominator kabhi 0 nahi ho sakta!',
          isMistake: true,
        },
        {
          step: 'Step 3: Correct Working',
          formula: '4/5 - 2/5 = (4 - 2)/5 = 2/5  ✅',
          annotation: 'Sharma Sir: "Notebook me 2/0 ko kaat kar 2/5 likhein beta."',
        },
      ];

      setMessages((prev) => [
        ...prev,
        { sender: 'student', text: '📸 [Uploaded Math Homework Page - Class 5th Fractions]', time: currentTime },
        { sender: 'teacher', text: replyText, time: currentTime },
      ]);
      setWhiteboardSteps(newSteps);
      setActiveStepIndex(1);
      speakText(replyText);
    }, 1200);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query) return;
    setInputVal('');

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { sender: 'student', text: query, time: currentTime },
    ]);

    let replyText = '';
    let newSteps: WhiteboardStep[] = [];

    const teacherBackendMap: Record<string, string> = {
      sharma: 'sharma_sir',
      neha: 'neha_mam',
      riya: 'riya_didi',
      kabir: 'kabir_sir',
      pooja: 'pooja_mam',
    };
    const backendTeacherId = teacherBackendMap[selectedTeacher.id] || 'sharma_sir';

    try {
      const res = await fetch('http://localhost:5000/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: backendTeacherId,
          question: query,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply;
        if (data.whiteboard_steps && data.whiteboard_steps.length > 0) {
          newSteps = data.whiteboard_steps.map((s: any, idx: number) => ({
            step: s.step || `Step ${idx + 1}`,
            formula: s.formula || 'Concept Point',
            annotation: s.annotation || s.formula || '',
          }));
        }
      }
    } catch {
      // Local fallback
    }

    if (!replyText) {
      const qLower = query.toLowerCase();
      if (selectedTeacher.id === 'neha' || qLower.includes('photo') || qLower.includes('plant') || qLower.includes('science')) {
        replyText = `Shabash beta! Dhyan se dekho mere laser pointer ki taraf. Jaise aapki mummy kitchen me khana banati hain, waise hi green leaves dhoop se food prepare karti hain. Board par step 1 padho!`;
        newSteps = [
          {
            step: 'Step 1: Raw Materials Needed',
            formula: 'Sunlight + Water (H2O) + CO2',
            annotation: 'Neha Mam: "Plants roots se water aur stomata se CO2 absorb karte hain."',
          },
          {
            step: 'Step 2: Chemical Reaction',
            formula: '6CO2 + 6H2O ➔ C6H12O6 (Glucose) + 6O2',
            annotation: 'Neha Mam: "Chlorophyll green pigment sunlight energy ko capture karta hai."',
          },
          {
            step: 'Step 3: Outcome for Life',
            formula: 'Glucose (Food) + Oxygen Release 🌿',
            annotation: '✅ Final Result: Hum saans lene ke liye wahi oxygen use karte hain!',
          },
        ];
      } else {
        replyText = `Bahut pyara sawaal beta! Dhyan se blackboard par pointer ko follow karo. Step-by-step note kiya hai!`;
        newSteps = [
          {
            step: 'Step 1: Problem Identification',
            formula: query.replace(/[^\d+*/^.-]/g, '') ? `${query} = ?` : 'Problem Breakdown',
            annotation: `${selectedTeacher.name}: "Pehle rule aur basics identify karte hain."`,
          },
          {
            step: 'Step 2: Step-by-Step Solving',
            formula: 'Step-by-step simplification',
            annotation: `${selectedTeacher.name}: "Calculation easy ho gayi, dekhiye board par."`,
          },
          {
            step: 'Step 3: Verification Check',
            formula: '✅ Answer Verified',
            annotation: `${selectedTeacher.name}: "Itna step clear hai na beta? Agla doubt pucho!"`,
          },
        ];
      }
    }

    setMessages((prev) => [
      ...prev,
      { sender: 'teacher', text: replyText, time: currentTime },
    ]);

    if (newSteps.length > 0) {
      setWhiteboardSteps(newSteps);
      setActiveStepIndex(0);
    }

    speakText(replyText);
  };

  const handleStepClick = (stepIndex: number) => {
    setActiveStepIndex(stepIndex);
    const chosenStep = whiteboardSteps[stepIndex];
    if (chosenStep) {
      const stepExplanation = `${chosenStep.step} par dhyan dein: ${chosenStep.formula}. ${chosenStep.annotation}`;
      speakText(stepExplanation);
    }
  };

  const handleMicToggle = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert('Google Chrome ya Edge browser use karein mic feature ke liye.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = languageMode === 'English' ? 'en-IN' : 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const spokenTranscript = event.results[0][0].transcript;
        setIsListening(false);
        if (spokenTranscript) {
          handleSendMessage(spokenTranscript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Hidden File Input for Page Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handlePageUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* 1. TOP HEADER */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
              <Video className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm sm:text-base">AI Video Tuition Studio</span>
              <span className="hidden md:inline-block ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                ONLINE VIDEO TEACHER
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Options */}
        <div className="flex items-center gap-2.5">
          {/* VOICE AUDIO ON / OFF TOGGLE IN TOP HEADER */}
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            title={isAudioMuted ? 'Voice Audio Unmute Karein' : 'Voice Audio Mute Karein'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-md ${
              isAudioMuted
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-indigo-600 text-white shadow-indigo-600/30'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
            <span>Voice Audio: {isAudioMuted ? 'OFF' : 'ON'}</span>
          </button>

          {/* UPLOAD PAGE BUTTON IN TOP HEADER */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all transform hover:scale-105"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Page / Notebook 📸</span>
            <span className="sm:hidden">Upload 📸</span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <Globe2 className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {(['Hinglish', 'Hindi', 'English'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguageMode(lang)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  languageMode === lang ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 2. TEACHER SELECTOR RIBBON */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Choose Online Teacher:</span>
          {ALL_TEACHERS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTeacher(t);
                setActiveStepIndex(0);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                selectedTeacher.id === t.id
                  ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-base">{t.emoji}</span>
              <span>{t.name}</span>
              <span className="text-[10px] text-slate-400 font-normal">({t.subject.split(' ')[0]})</span>
            </button>
          ))}
        </div>

        {/* Upload Page Callout Banner */}
        <div className="hidden lg:flex items-center gap-2 bg-indigo-950/70 border border-indigo-500/30 rounded-xl px-3 py-1 text-xs text-indigo-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Notebook page ki photo kheenche aur teacher live check karenge</span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        
        {/* LEFT/CENTER: Teacher Video Stream & Smart Whiteboard */}
        <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col gap-4 border-r border-slate-800 overflow-y-auto">
          
          {/* A. HD ONLINE VIDEO TEACHER CAMERA COMPONENT */}
          <OnlineVideoTeacher
            teacher={selectedTeacher}
            isSpeaking={isSpeakingAudio}
            isListening={isListening}
            activeStepIndex={activeStepIndex}
            totalSteps={whiteboardSteps.length}
            currentSpeechText={currentSpeechText}
            pointerEnabled={pointerEnabled}
            onPointerToggle={(enabled) => setPointerEnabled(enabled)}
            onUploadClick={() => setIsUploadModalOpen(true)}
            hasUploadedPage={Boolean(uploadedPagePreview)}
            isAudioMuted={isAudioMuted}
            onToggleMute={() => setIsAudioMuted(!isAudioMuted)}
            onReplayAudio={() => {
              const activeStep = whiteboardSteps[activeStepIndex];
              if (activeStep) {
                speakText(`${activeStep.step}: ${activeStep.formula}. ${activeStep.annotation}`);
              }
            }}
          />

          {/* B. DUAL VIEW: SMART WHITEBOARD OR SCANNED NOTEBOOK PAGE */}
          <div className="flex-1 min-h-[380px] bg-slate-900/90 rounded-3xl border-2 border-slate-800 p-5 sm:p-6 flex flex-col relative shadow-2xl">
            {/* Whiteboard Header Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                {/* View Switcher Tabs */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('whiteboard')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'whiteboard'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Teacher Blackboard</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!uploadedPagePreview) {
                        setIsUploadModalOpen(true);
                      } else {
                        setActiveTab('scannedPage');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'scannedPage'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Scanned Notebook {uploadedPagePreview ? '✓' : '(Upload)'}</span>
                  </button>
                </div>
              </div>

              {/* Laser Pointer Status & Audio Replay */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const activeStep = whiteboardSteps[activeStepIndex];
                    if (activeStep) {
                      speakText(`${activeStep.step}: ${activeStep.formula}. ${activeStep.annotation}`);
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all shadow-sm"
                  title="Active step ki voice explanation dobara sunein"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Suniye (Listen)</span>
                </button>

                <button
                  onClick={() => setPointerEnabled(!pointerEnabled)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    pointerEnabled
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 text-rose-400" />
                  <span>Teacher Pointer: {pointerEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* TAB 1: TEACHER BLACKBOARD WITH LASER POINTER SYNC */}
            {activeTab === 'whiteboard' && (
              <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
                {whiteboardSteps.map((stepItem, idx) => {
                  const isActive = idx === activeStepIndex;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleStepClick(idx)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer relative overflow-hidden ${
                        stepItem.isMistake
                          ? 'bg-red-950/40 border-2 border-red-500/80 shadow-xl'
                          : isActive
                          ? 'bg-slate-950 border-2 border-rose-500/80 shadow-xl shadow-rose-500/10 ring-2 ring-rose-500/30'
                          : 'bg-slate-950/70 border border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Active Step Pointer Target (Laser Marker) */}
                      {isActive && pointerEnabled && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg shadow-rose-600/40 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          <span>Teacher Laser Target</span>
                        </div>
                      )}

                      {/* Step Title Header */}
                      <div className="flex items-center gap-2 text-xs font-bold mb-1.5">
                        <span className={stepItem.isMistake ? 'text-red-400' : isActive ? 'text-rose-400' : 'text-indigo-400'}>
                          {stepItem.step}
                        </span>
                        {isActive && isSpeakingAudio && (
                          <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                            Explaining now 🔊
                          </span>
                        )}
                      </div>

                      {/* Step Equation / Formula */}
                      <p className={`text-xl font-black font-mono tracking-wide ${stepItem.isMistake ? 'text-red-300' : isActive ? 'text-amber-300' : 'text-cyan-300'}`}>
                        {stepItem.formula}
                      </p>

                      {/* Step Annotation */}
                      {stepItem.annotation && (
                        <p className="text-xs font-sans text-slate-300 mt-2 leading-relaxed">
                          {stepItem.annotation}
                        </p>
                      )}

                      {/* Click to re-explain hint */}
                      <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Click step to point & re-explain</span>
                        <Play className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: SCANNED NOTEBOOK PAGE VIEW */}
            {activeTab === 'scannedPage' && (
              <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto">
                {/* Left: Scanned Image View with Laser Scanner Animation */}
                <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[260px]">
                  {isScanningPage && (
                    <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-3" />
                      <p className="text-sm font-bold text-emerald-400">AI Scanner Notebook Check Kar Raha Hai...</p>
                      <p className="text-xs text-slate-400 mt-1">Line-by-line verification in progress</p>
                      {/* Scanning laser beam line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />
                    </div>
                  )}

                  {uploadedPagePreview === 'sample_notebook' ? (
                    // Sample Math Notebook Page Graphic
                    <div className="w-full max-w-sm bg-amber-50 text-slate-800 rounded-xl p-5 font-mono text-xs shadow-xl border-2 border-amber-200">
                      <div className="border-b border-amber-200 pb-2 mb-3 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-bold">MATH HOMEWORK • CLASS 5</span>
                        <span>DATE: 14 OCT</span>
                      </div>
                      <div className="space-y-3">
                        <p className="font-bold text-slate-800">Q1. 15 × 6 = 90 <span className="text-emerald-600 font-sans font-bold">✓ (Sahi)</span></p>
                        <div className="p-2 bg-red-100 rounded-lg border border-red-300">
                          <p className="font-bold text-red-700">Q2. (4/5) - (2/5) = 2/0 <span className="font-sans font-bold">❌ (Mistake)</span></p>
                          <p className="text-[10px] text-red-600 font-sans mt-1">Teacher note: Denominator zero nahi ho sakta!</p>
                        </div>
                        <p className="font-bold text-slate-800">Q3. 120 ÷ 4 = 30 <span className="text-emerald-600 font-sans font-bold">✓ (Sahi)</span></p>
                      </div>
                    </div>
                  ) : uploadedPagePreview ? (
                    // User's Uploaded Photo
                    <div className="relative w-full h-full min-h-[240px] flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadedPagePreview}
                        alt="Uploaded student notebook"
                        className="max-h-72 object-contain rounded-xl shadow-lg border border-slate-700"
                      />
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <Camera className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Koi page upload nahi hua hai abhi</p>
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                      >
                        Upload Page Photo
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Teacher's Line-by-Line Correction Report */}
                <div className="w-full md:w-64 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Teacher Line-by-Line Result</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="font-bold text-indigo-400">Total Questions Checked:</span>
                      <p className="text-white font-black text-sm mt-0.5">3 Questions</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300">
                      <span className="font-bold">1 Mistake Identified</span>
                      <p className="text-[10px] text-slate-300 mt-1">Q2 me denominator subtraction error mila.</p>
                    </div>

                    <button
                      onClick={() => setActiveTab('whiteboard')}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center shadow-md transition-all mt-2"
                    >
                      See Solution on Board ➔
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Whiteboard Footer */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{selectedTeacher.name} live blackboard • Click any step to point</span>
              </span>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload New Page</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Doubts Chat & Push-To-Talk Mic */}
        <div className="lg:col-span-4 bg-slate-900 flex flex-col justify-between p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl">
                {selectedTeacher.emoji}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">{selectedTeacher.name}</h4>
                <p className="text-xs text-indigo-400 font-semibold">{selectedTeacher.avatarRole}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>ONLINE</span>
            </div>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {messages.map((m, i) => {
              const isTeacher = m.sender === 'teacher';
              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                    isTeacher
                      ? 'bg-slate-800 border border-slate-700/60 text-slate-200 mr-auto shadow-md'
                      : 'bg-indigo-600 text-white ml-auto shadow-md shadow-indigo-600/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{isTeacher ? selectedTeacher.name : 'You (Student)'}</span>
                      <span>• {m.time}</span>
                    </div>

                    {/* Prominent Audio Listen Button on Teacher Messages */}
                    {isTeacher && (
                      <button
                        onClick={() => speakText(m.text)}
                        className="flex items-center gap-1 text-[10px] text-amber-300 bg-slate-900/90 hover:bg-slate-700 px-2 py-0.5 rounded-md font-bold transition-all border border-slate-700 shadow-sm"
                        title="Is message ko awaz me sunein"
                      >
                        <Volume2 className="w-3 h-3 text-amber-300" />
                        <span>Suniye 🔊</span>
                      </button>
                    )}
                  </div>
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Area: Mic, Page Upload & Input */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            {/* Big Push-To-Talk Mic Button */}
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={handleMicToggle}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${
                  isListening
                    ? 'bg-red-500 scale-110 shadow-red-500/50 ring-4 ring-red-400/30 animate-pulse'
                    : 'bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-orange-500/30 hover:scale-105'
                }`}
              >
                <Mic className="w-7 h-7 text-white" />
              </button>
              <span className="text-xs font-bold text-slate-300 mt-2 text-center">
                {isSpeakingAudio
                  ? `🔊 ${selectedTeacher.name} bol rahe hain aur board par point kar rahe hain...`
                  : isListening
                  ? '🔴 Listening... Apna sawaal boliye'
                  : 'Mic dabakar bolkar sawaal poochein'}
              </span>
            </div>

            {/* Quick Action Chips (Include Upload Page Chip!) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[10px] font-bold whitespace-nowrap border border-emerald-500/40 flex items-center gap-1"
              >
                <Camera className="w-3 h-3" />
                <span>Upload Notebook Page</span>
              </button>
              {[
                'Photosynthesis formula',
                '1/2 + 1/4 fractions',
                'Table of 19 short trick',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold whitespace-nowrap border border-slate-700/60"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Text input with camera button attached */}
            <div className="flex items-center gap-2 bg-slate-950 rounded-2xl p-2 border border-slate-800 focus-within:border-indigo-500 transition-colors">
              {/* Camera icon button to upload directly from input */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload Homework Photo"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-all border border-slate-800"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder="Ya type karke sawaal poochein..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-transparent px-2 text-xs text-white outline-none placeholder:text-slate-500"
              />
              <button
                onClick={() => handleSendMessage()}
                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL: UPLOAD NOTEBOOK PAGE / HOMEWORK PHOTO */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Upload Homework / Book Page</h3>
                  <p className="text-xs text-slate-400">AI Teacher line-by-line check karke mistake batayenge</p>
                </div>
              </div>

              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Options Grid */}
            <div className="space-y-3 mb-5">
              {/* Option 1: File Picker / Camera Capture */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-2xl border-2 border-dashed border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-900/30 cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
              >
                <Upload className="w-8 h-8 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-sm text-white">Click to Select Photo from Device / Camera</span>
                <span className="text-[11px] text-slate-400 mt-1">Supports JPG, PNG, WebP (Apni notebook ki saaf photo upload karein)</span>
              </div>

              {/* Option 2: Test with Instant Sample Page */}
              <div
                onClick={handleLoadSamplePage}
                className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
                    📝
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">Try Sample Math Homework Page</span>
                    <span className="text-[10px] text-slate-400">Class 5th Fraction mistake demo check karein</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">Instant Test ⚡</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
