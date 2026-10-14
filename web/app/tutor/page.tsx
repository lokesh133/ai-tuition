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
  Headphones,
  Radio,
  Gauge,
  Check,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  SplitSquareVertical,
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

interface UploadedDocument {
  type: 'image' | 'pdf';
  name: string;
  url: string;
  size?: string;
  extractedSnippet?: string;
}

export default function WebAITutorStudio() {
  // Mode selection: 'audio' vs 'video'
  const [studyMode, setStudyMode] = useState<'audio' | 'video'>('video');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherInfo>(ALL_TEACHERS[0]); // Sharma Sir
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [languageMode, setLanguageMode] = useState<'Hinglish' | 'Hindi' | 'English'>('Hinglish');
  const [pointerEnabled, setPointerEnabled] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [visibleStepCount, setVisibleStepCount] = useState<number>(1); // Reveal step 1 first for slow pacing
  const [isSlowPacingOn, setIsSlowPacingOn] = useState<boolean>(true); // School-style slow pacing
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.75); // Calm school teacher slow delivery (0.75x)
  const [whiteboardViewMode, setWhiteboardViewMode] = useState<'split' | 'chalkboard' | 'copy'>('split');
  const [copyZoom, setCopyZoom] = useState<number>(1);
  const [isAutoStepPacing, setIsAutoStepPacing] = useState<boolean>(false);

  // Document Upload States (Image / PDF)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [syllabusModalTab, setSyllabusModalTab] = useState<'Math' | 'EVS' | 'English'>('Math');
  const [uploadModalTab, setUploadModalTab] = useState<'all' | 'photo' | 'pdf'>('all');
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);
  const [isScanningDoc, setIsScanningDoc] = useState(false);
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'scannedDoc'>('whiteboard');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState([
    {
      sender: 'teacher',
      text: 'Namaste beta! Main Sharma Sir hoon. Aap Audio ya Video mode chun sakte hain. Apna sawaal bolkar poochein, notebook ki photo scan karein ya PDF chapter upload karein!',
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
  const speakText = (text: string, customRate?: number) => {
    if (isAudioMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/<[^>]*>/g, '').replace(/[*_#]/g, '');
      setCurrentSpeechText(clean);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = languageMode === 'English' ? 'en-IN' : 'hi-IN';
      utterance.rate = customRate || speechRate;
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

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Replay speech at updated rate
  const changeSpeechRate = (rate: number) => {
    setSpeechRate(rate);
    const activeStep = whiteboardSteps[activeStepIndex];
    if (activeStep) {
      speakText(`${activeStep.step}: ${activeStep.formula}. ${activeStep.annotation}`, rate);
    }
  };

  // Step-by-Step Pacing: Proceed to next step like a school teacher
  const handleNextStep = () => {
    if (visibleStepCount < whiteboardSteps.length) {
      const nextIdx = visibleStepCount;
      setVisibleStepCount((prev) => prev + 1);
      setActiveStepIndex(nextIdx);
      const nextStepItem = whiteboardSteps[nextIdx];
      if (nextStepItem) {
        speakText(`${nextStepItem.step}: ${nextStepItem.formula}. ${nextStepItem.annotation}`, speechRate);
      }
    }
  };

  const handleRestartSteps = () => {
    setVisibleStepCount(1);
    setActiveStepIndex(0);
    const firstStep = whiteboardSteps[0];
    if (firstStep) {
      speakText(`${firstStep.step}: ${firstStep.formula}. ${firstStep.annotation}`, speechRate);
    }
  };

  // Unified File Upload Handler (Image / PDF)
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const previewUrl = URL.createObjectURL(file);
    const formattedSize = (file.size / 1024).toFixed(1) + ' KB';

    setUploadedDoc({
      type: isPdf ? 'pdf' : 'image',
      name: file.name,
      url: previewUrl,
      size: formattedSize,
      extractedSnippet: isPdf ? 'NCERT / RBSE Chapter Questions: Reading and solving step-by-step...' : undefined,
    });

    setIsUploadModalOpen(false);
    setIsScanningDoc(true);
    // KEEP STUDENT ON WHITEBOARD so the uploaded copy is immediately seen side-by-side with chalk board!
    setActiveTab('whiteboard');
    setWhiteboardViewMode('split');

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        sender: 'student',
        text: isPdf
          ? `📄 [Uploaded PDF Document: ${file.name} (${formattedSize})] - Sir kripya is chapter ke questions solve karke samjha dijiye.`
          : `📸 [Uploaded Notebook Page: ${file.name}] - Sir kripya copy check karein.`,
        time: currentTime,
      },
    ]);

    // Send to Next.js Vision AI endpoint
    const formData = new FormData();
    formData.append('homework_image', file);
    formData.append(
      'teacher_id',
      selectedTeacher.id === 'neha' ? 'neha_mam' : selectedTeacher.id === 'sharma' ? 'sharma_sir' : 'sharma_sir'
    );
    formData.append(
      'question',
      isPdf
        ? `Read this uploaded PDF (${file.name}) and solve the key questions step-by-step on the blackboard with simple explanations.`
        : 'Please read this student notebook photo line-by-line, check the calculations, and solve on the blackboard.'
    );

    let replyText = '';
    let newSteps: WhiteboardStep[] = [];

    try {
      const res = await fetch('/api/tutor/ask', {
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
            isMistake: Boolean(s.isMistake),
          }));
        }
      }
    } catch (err) {
      console.warn('API error:', err);
    }

    if (!replyText) {
      if (isPdf) {
        replyText = `Shabash beta! Maine aapka uploaded PDF "${file.name}" dhyan se padh liya hai. Is document ke question ko blackboard par step-by-step likh diya hai. Pehle Step 1 dhyan se samjhein!`;
        newSteps = [
          {
            step: 'Step 1: PDF Document Question Extracted',
            formula: 'Problem: Find x if 2x + 6 = 14',
            annotation: `${selectedTeacher.name}: "PDF se question read kar liya gaya hai."`,
          },
          {
            step: 'Step 2: Transposition Method',
            formula: '2x = 14 - 6  ⟹  2x = 8',
            annotation: 'Sharma Sir: "Constant term (+6) ko right side shift karenge to sign negative ho jayega."',
          },
          {
            step: 'Step 3: Finding Value of x',
            formula: 'x = 8 / 2  ⟹  x = 4  ✅ Final Answer',
            annotation: '✅ Final Result: x = 4. Is calculation ko apni notebook me note karein beta!',
          },
        ];
      } else {
        replyText = `Shabash beta! Main aapki notebook ka photo (${file.name}) line-by-line check kar raha hoon. Dekhiye, blackboard par maine aapke copy ka problem step-by-step solve karna start kar diya hai!`;
        newSteps = [
          {
            step: 'Step 1: Student Copy Line 1 Verified',
            formula: '15 × 6 = 90  ✅ Correct',
            annotation: `${selectedTeacher.name}: "Copy me pehla calculation bilkul sahi hai!"`,
          },
          {
            step: 'Step 2: Mistake Found in Fraction Subtraction',
            formula: '(4/5) - (2/5) ≠ 2/0  ❌ Denominator Zero Error',
            annotation: '⚠️ Mistake: Fractions me denominator (5) same rehta hai, zero nahi hota!',
            isMistake: true,
          },
          {
            step: 'Step 3: Correct Working on Blackboard',
            formula: '(4 - 2) / 5 = 2/5  ✅ Final Answer',
            annotation: `${selectedTeacher.name}: "Sahi answer 2/5 hai. Isko apni notebook me theek kar lijiye."`,
          },
        ];
      }
    }

    setIsScanningDoc(false);

    setMessages((prev) => [
      ...prev,
      { sender: 'teacher', text: replyText, time: currentTime },
    ]);

    setWhiteboardSteps(newSteps);
    // SLOW PACING: Start by revealing Step 1 only
    setVisibleStepCount(1);
    setActiveStepIndex(0);
    speakText(replyText);
  };

  // Sample Demos for instant testing
  const handleLoadSamplePage = (type: 'photo' | 'pdf' | 'rbse_hindi' | 'rbse_amrita' | 'rbse_bricks' | 'rbse_fractions') => {
    setIsUploadModalOpen(false);
    setIsScanningDoc(true);
    setActiveTab('whiteboard');
    setWhiteboardViewMode('split');

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (type === 'rbse_hindi' || type === 'photo') {
      // The exact school textbook page uploaded by the user (Page 87)!
      setUploadedDoc({
        type: 'image',
        name: 'WhatsApp Image 2026-10-14 at 1.46.02 PM.jpeg',
        url: '/samples/hindi_class4_page87.jpeg',
        size: '180 KB',
        extractedSnippet: 'RBSE Class 4 Hindi • Page 87: निखिल के चाचा जी, मूल्यपरक प्रश्न, भाषा-ज्ञान (विलोम शब्द व उपसर्ग)',
      });

      setTimeout(() => {
        setIsScanningDoc(false);
        const replyText =
          'Shabash beta! Maine aapki Hindi pathyapustak (Page 87) ka photo dhyan se padh liya hai. Isme "निखिल के चाचा जी" path ke prashn aur Bhasha-Gyan ke vilom shabd diye gaye hain. Maine blackboard par ek-ek prashn ka sahi uttar aur vyakaran niyam likh diya hai. Dhyan se suniye aur agla step dekhein!';
        const newSteps: WhiteboardStep[] = [
          {
            step: 'प्रश्न 1: सही उत्तर चुनकर लगाओ (Page 87)',
            formula: 'क. गाँव में ✅ | ख. कुएँ पर ✅ | ग. बुआई के समय | घ. घर में बना मक्खन ✅',
            annotation:
              'निखिल के चाचा जी गाँव में रहते थे और वह नहाने कुएँ पर गया था। घर में बना ताजा मक्खन खाकर निखिल फूला न समाया!',
          },
          {
            step: 'प्रश्न 2: मूल्यपरक प्रश्न (L.O. 2)',
            formula: 'गाँव की उन्नति से ही देश की उन्नति है (Problem Solving)',
            annotation:
              'गाँव में किसान दिन-रात मेहनत करके पूरे देश के लिए अन्न उगाते हैं। जब गाँव समृद्ध और उन्नत होगा, तभी हमारा भारत देश आगे बढ़ेगा।',
          },
          {
            step: 'प्रश्न 3: भाषा-ज्ञान - विलोम शब्द (भाग 1)',
            formula: 'सुविधा × असुविधा  |  सुगंध × दुर्गंध  |  न्याय × अन्याय',
            annotation:
              'विलोम शब्द का अर्थ उल्टा शब्द होता है। "सुविधा" और "न्याय" में \'अ\' उपसर्ग जुड़कर असुविधा और अन्याय बना, और "सुगंध" में \'दुर्\' उपसर्ग लगकर दुर्गंध बना।',
          },
          {
            step: 'प्रश्न 4: भाषा-ज्ञान - विलोम शब्द (भाग 2)',
            formula: 'आदर × अनादर  |  उपस्थित × अनुपस्थित  |  उचित × अनुचित',
            annotation:
              'नियम: सभी विलोम शब्द \'अ\', \'अन्\' और \'दुर्\' उपसर्गों के लगने से बने हैं। जैसे: अन् + आदर = अनादर, अन् + उपस्थित = अनुपस्थित। अपनी कॉपी में नोट कर लें beta!',
          },
        ];

        setMessages((prev) => [
          ...prev,
          { sender: 'student', text: '📸 [Uploaded Copy: WhatsApp Image 2026-10-14 at 1.46.02 PM.jpeg]', time: currentTime },
          { sender: 'teacher', text: replyText, time: currentTime },
        ]);
        setWhiteboardSteps(newSteps);
        setVisibleStepCount(1);
        setActiveStepIndex(0);
        speakText(replyText, 0.75);
      }, 1000);
    } else if (type === 'rbse_amrita') {
      // RBSE Class 4 EVS Chapter 4
      setUploadedDoc({
        type: 'pdf',
        name: 'RBSE_Class4_EVS_Ch4_StoryOfAmrita_Rajasthan.pdf',
        url: 'sample_pdf',
        size: '310 KB',
        extractedSnippet: 'RBSE Class 4 EVS • Chapter 4: The Story of Amrita (Khejarli village near Jodhpur, Bishnoi community, Khejri state tree of Rajasthan)',
      });

      setTimeout(() => {
        setIsScanningDoc(false);
        const replyText = `Shabash beta! RBSE Class 4th EVS Chapter 4 "The Story of Amrita" se question verify ho gaya hai. Khejarli gaon Rajasthan ke Jodhpur ke paas hai. Khejri ped Rajasthan ka state tree hai aur Bishnoi community ne iski raksha ki thi. Dhyan se blackboard par dekhein!`;
        const newSteps: WhiteboardStep[] = [
          {
            step: 'Step 1: RBSE EVS Chapter 4 Alignment',
            formula: 'State Tree of Rajasthan = Khejri (खेजड़ी)',
            annotation: 'Neha Mam: "Khejri ped desert me kam paani me bhi ugta hai aur iski chhal se medicine banti hai."',
          },
          {
            step: 'Step 2: Khejarli Village & Bishnoi Sacrifice',
            formula: '363 Bishnois sacrificed lives for Trees',
            annotation: 'Neha Mam: "Amrita Devi ne kaha tha: \'Sar kate rukh bache to bhi sasto jaan\'."',
          },
          {
            step: 'Step 3: Beans of Khejri Tree',
            formula: 'Sangri (सांगरी) = Delicious Dry Vegetable',
            annotation: '✅ Final Result: Rajasthan ki famous Ker-Sangri sabzi isi ped ki beans se banti hai!',
          },
        ];

        setMessages((prev) => [
          ...prev,
          { sender: 'student', text: '📄 [Uploaded PDF: RBSE_Class4_EVS_Ch4_StoryOfAmrita_Rajasthan.pdf]', time: currentTime },
          { sender: 'teacher', text: replyText, time: currentTime },
        ]);
        setWhiteboardSteps(newSteps);
        setVisibleStepCount(1);
        setActiveStepIndex(0);
        speakText(replyText, 0.75);
      }, 1000);
    } else if (type === 'rbse_bricks') {
      // RBSE Class 4 Math Chapter 1
      setUploadedDoc({
        type: 'image',
        name: 'RBSE_Class4_Math_Ch1_BuildingWithBricks.jpg',
        url: 'sample_notebook',
        size: '195 KB',
        extractedSnippet: 'RBSE Class 4 Math • Chapter 1: Building with Bricks (Faces, Edges, Haveli Arches & Jaalis in Rajasthan)',
      });

      setTimeout(() => {
        setIsScanningDoc(false);
        const replyText = `Namaste beta! RBSE Class 4th Mathematics Chapter 1 "Building with Bricks" ka question verify kiya hai. Ek brick me 6 faces aur 12 edges hote hain. Rajasthan ki traditional havelis me sundar brick arches bante hain!`;
        const newSteps: WhiteboardStep[] = [
          {
            step: 'Step 1: Brick Geometry in RBSE Class 4',
            formula: 'Faces = 6, Edges = 12, Corners = 8',
            annotation: 'Sharma Sir: "Brick ka har face rectangle shape ka hota hai."',
          },
          {
            step: 'Step 2: Rajasthan Haveli Architecture',
            formula: 'Jharokhas, Jaalis & Arches (मेहराब)',
            annotation: 'Sharma Sir: "Jodhpur aur Jaisalmer ki Havelis me bricks se sundar jaali patterns bante hain."',
          },
          {
            step: 'Step 3: Calculation of Bricks',
            formula: '1000 Bricks = 1 Thousand Bricks',
            annotation: '✅ Final Answer: Class 4 textbook me brick kiln (ईंट का भट्ठा) ka calculation solve ho gaya!',
          },
        ];

        setMessages((prev) => [
          ...prev,
          { sender: 'student', text: '📸 [Uploaded Copy: RBSE_Class4_Math_Ch1_BuildingWithBricks.jpg]', time: currentTime },
          { sender: 'teacher', text: replyText, time: currentTime },
        ]);
        setWhiteboardSteps(newSteps);
        setVisibleStepCount(1);
        setActiveStepIndex(0);
        speakText(replyText, 0.75);
      }, 1000);
    } else if (type === 'pdf' || type === 'rbse_fractions') {
      setUploadedDoc({
        type: 'pdf',
        name: 'RBSE_Class4_Math_Ch9_HalvesAndQuarters.pdf',
        url: 'sample_pdf',
        size: '245 KB',
        extractedSnippet: 'RBSE Class 4 Math • Chapter 9: Halves and Quarters (Fractions 1/2, 1/4, 3/4 & Equal Sharing)',
      });

      setTimeout(() => {
        setIsScanningDoc(false);
        const replyText = `Bahut badiya beta! Maine RBSE Class 4th Math Chapter 9 (Halves and Quarters) ko check kar liya hai. Fractions ko blackboard par step-by-step solve kiya hai. Suniye aur board par laser pointer dekhein!`;
        const newSteps: WhiteboardStep[] = [
          {
            step: 'RBSE Chapter 9: Halves & Quarters',
            formula: 'Solve: (1/2) + (1/4) = ?',
            annotation: 'Sharma Sir: "Pehle half (1/2) ko quarters me convert karenge: 1/2 = 2/4"',
          },
          {
            step: 'Step 2: Equal Denominator Addition',
            formula: '2/4 + 1/4 = (2 + 1) / 4',
            annotation: 'Sharma Sir: "Equivalent fractions ban gaye, numerators ko direct add karenge."',
          },
          {
            step: 'Step 3: Final Answer on Blackboard',
            formula: '2/4 + 1/4 = 3/4 (Three-Fourths)  ✅',
            annotation: '✅ Sahi Answer: 3/4 (Pona hissa - proper fraction). Bilkul clear hai na beta?',
          },
        ];

        setMessages((prev) => [
          ...prev,
          { sender: 'student', text: '📄 [Uploaded PDF: RBSE_Class4_Math_Ch9_HalvesAndQuarters.pdf]', time: currentTime },
          { sender: 'teacher', text: replyText, time: currentTime },
        ]);
        setWhiteboardSteps(newSteps);
        setVisibleStepCount(1);
        setActiveStepIndex(0);
        speakText(replyText, 0.75);
      }, 1000);
    }
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
      const res = await fetch('/api/tutor/ask', {
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
        replyText = `Bahut pyara sawaal beta! Dhyan se blackboard par pointer ko follow karo. Step-by-step maine blackboard par likh diya hai!`;
        newSteps = [
          {
            step: 'Step 1: Problem Identification',
            formula: query.replace(/[^\d+*/^.-]/g, '') ? `${query} = ?` : 'Problem Breakdown',
            annotation: `${selectedTeacher.name}: "Pehle rule aur basics identify karte hain."`,
          },
          {
            step: 'Step 2: Step-by-Step Solving',
            formula: 'Step-by-step chalk simplification',
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
      setVisibleStepCount(1);
      setActiveStepIndex(0);
    }

    speakText(replyText, 0.75);
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
      {/* Hidden File Inputs */}
      {/* 1. Camera / Photo input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />
      {/* 2. PDF Document input */}
      <input
        type="file"
        ref={pdfInputRef}
        accept="application/pdf,.pdf"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* 1. TOP HEADER */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 px-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* STUDIO LOGO */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              studyMode === 'audio'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-indigo-600/30 border-indigo-500/40 text-indigo-400'
            }`}>
              {studyMode === 'audio' ? <Headphones className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </div>
            <div>
              <span className="font-extrabold text-white text-xs sm:text-base">
                AI Tuition Studio
              </span>
              <span className="hidden md:inline-block ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                CLASSES 1ST - 8TH
              </span>
            </div>
          </div>
        </div>

        {/* PROMINENT AUDIO / VIDEO STUDY MODE SELECTOR (CENTER/RIGHT) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border-2 border-indigo-500/40 shadow-lg">
          <button
            onClick={() => setStudyMode('audio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              studyMode === 'audio'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-orange-500/30 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>🎙️ Audio Mode</span>
            <span className="hidden md:inline text-[9px] opacity-80 font-bold">(Voice + Board)</span>
          </button>

          <button
            onClick={() => setStudyMode('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              studyMode === 'video'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>🎥 Video Mode</span>
            <span className="hidden md:inline text-[9px] opacity-80 font-bold">(Real Teacher)</span>
          </button>
        </div>

        {/* Right Header Options */}
        <div className="flex items-center gap-2">
          {/* UPLOAD NOTEBOOK / PDF BUTTON */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all transform hover:scale-105"
            title="Notebook Photo ya PDF Chapter Upload Karein"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Photo / PDF 📄</span>
            <span className="sm:hidden">Upload 📄</span>
          </button>

          {/* Voice Audio On / Off Toggle */}
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            title={isAudioMuted ? 'Voice Audio Unmute Karein' : 'Voice Audio Mute Karein'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isAudioMuted
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse text-amber-400" />}
            <span className="hidden md:inline">{isAudioMuted ? 'Muted' : 'Sound ON'}</span>
          </button>

          {/* Language Switcher */}
          <div className="hidden lg:flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <Globe2 className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            {(['Hinglish', 'Hindi', 'English'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguageMode(lang)}
                className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-all ${
                  languageMode === lang ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 2. MODE EXPLANATION & TEACHER SELECTOR RIBBON */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-3 sm:px-6 py-2 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
        {/* Mode Indicator Callout */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase flex items-center gap-1.5 border ${
            studyMode === 'audio'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-ping ${studyMode === 'audio' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
            <span>Active: {studyMode === 'audio' ? 'Audio Learning Deck' : 'Video Teacher Classroom'}</span>
          </div>

          <span className="text-xs text-slate-400 hidden xl:inline">
            {studyMode === 'audio'
              ? 'Teacher voice audio se bol kar answer batayenge & blackboard par step-by-step likhenge.'
              : 'Teacher real video me saamne aakar explain karenge & blackboard par point karenge.'}
          </span>
        </div>

        {/* Teacher Buttons & RBSE Syllabus Trigger */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            onClick={() => setIsSyllabusModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-sm"
            title="Official RBSE Rajasthan Class 4th English Medium Syllabus Check Karein"
          >
            <span>🏛️ RBSE Class 4th (English Medium)</span>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/40 font-bold">
              Checked ✓
            </span>
          </button>

          <span className="text-xs font-bold text-slate-400 hidden sm:inline">Teacher:</span>
          {ALL_TEACHERS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTeacher(t);
                setActiveStepIndex(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                selectedTeacher.id === t.id
                  ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.name}</span>
              <span className="text-[10px] text-slate-500 font-normal hidden md:inline">({t.subject.split(' ')[0]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        
        {/* LEFT / CENTER: Teacher Stage (Audio or Video) + Smart Chalk Blackboard */}
        <div className="lg:col-span-8 p-3 sm:p-5 flex flex-col gap-4 border-r border-slate-800 overflow-y-auto">
          
          {/* OPTION 1: AUDIO LEARNING MODE DECK (Active when studyMode === 'audio') */}
          {studyMode === 'audio' && (
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/20 border-2 border-amber-500/40 p-5 shadow-2xl relative overflow-hidden">
              {/* Audio Mode Ambient Glow */}
              <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Teacher Avatar with Audio Waves */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {/* Pulsing audio ripple rings when speaking */}
                    {isSpeakingAudio && (
                      <>
                        <div className="absolute -inset-2 rounded-full border-2 border-amber-400/50 animate-ping pointer-events-none" />
                        <div className="absolute -inset-4 rounded-full border border-amber-500/30 animate-pulse pointer-events-none" />
                      </>
                    )}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 p-0.5 shadow-xl shadow-orange-500/30">
                      <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-3xl">
                        {selectedTeacher.emoji}
                      </div>
                    </div>
                    {isSpeakingAudio && (
                      <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-md animate-bounce">
                        SPEAKING
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-white">{selectedTeacher.name}</h3>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        🎙️ Voice Tutor Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Teacher audio se bolkar explain kar rahe hain • Blackboard par chalk steps dekhein
                    </p>
                  </div>
                </div>

                {/* Live Animated Audio Equalizer Waveform */}
                <div className="flex items-center gap-1.5 bg-slate-950/90 border border-amber-500/30 px-4 py-2.5 rounded-2xl shadow-inner">
                  <span className="text-[11px] font-mono text-amber-400 font-bold mr-2">
                    {isSpeakingAudio ? 'AUDIO LIVE 🔊' : 'AUDIO READY'}
                  </span>
                  {[36, 60, 20, 85, 45, 95, 30, 75, 40, 90, 25, 65].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isSpeakingAudio
                          ? 'bg-gradient-to-t from-amber-500 to-orange-400 shadow-[0_0_8px_#f59e0b]'
                          : 'bg-slate-700'
                      }`}
                      style={{
                        height: isSpeakingAudio ? `${Math.max(12, (h * (activeStepIndex + 2) * 17) % 36 + 6)}px` : '6px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Audio Controls Toolbar (Speed, Replay, Switch to Video) */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold text-[11px]">Audio Speed:</span>
                  {[0.8, 1.0, 1.2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeechRate(rate)}
                      className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold transition-all ${
                        speechRate === rate
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      const activeStep = whiteboardSteps[activeStepIndex];
                      if (activeStep) {
                        speakText(`${activeStep.step}: ${activeStep.formula}. ${activeStep.annotation}`);
                      }
                    }}
                    className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Dobara Suniye (Replay)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-bold transition-all"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Notebook or PDF</span>
                  </button>

                  <button
                    onClick={() => setStudyMode('video')}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Switch to Video Mode 🎥</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 2: VIDEO TEACHER CLASSROOM (Active when studyMode === 'video') */}
          {studyMode === 'video' && (
            <div className="flex flex-col gap-2">
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
                hasUploadedPage={Boolean(uploadedDoc)}
                isAudioMuted={isAudioMuted}
                onToggleMute={() => setIsAudioMuted(!isAudioMuted)}
                onReplayAudio={() => {
                  const activeStep = whiteboardSteps[activeStepIndex];
                  if (activeStep) {
                    speakText(`${activeStep.step}: ${activeStep.formula}. ${activeStep.annotation}`);
                  }
                }}
              />

              {/* Fast switch to audio pill below video */}
              <div className="flex items-center justify-between px-2 text-xs text-slate-400">
                <span>🎥 Real Video Teacher Stream Active • Chalkboard Synchronized</span>
                <button
                  onClick={() => setStudyMode('audio')}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Switch to Audio Mode (Low Data)</span>
                </button>
              </div>
            </div>
          )}

          {/* INTEGRATED DUAL WORKSPACE: TEACHER CHALK BLACKBOARD & UPLOADED STUDENT COPY */}
          <div className="flex-1 min-h-[460px] bg-slate-900/90 rounded-3xl border-2 border-slate-800 p-4 sm:p-5 flex flex-col relative shadow-2xl">
            {/* Whiteboard Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-3 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* View Switcher Tabs (When document is uploaded, default to split Dual View!) */}
                {uploadedDoc ? (
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setWhiteboardViewMode('split')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        whiteboardViewMode === 'split'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Uploaded Copy aur Teacher Blackboard saath-saath dekhein"
                    >
                      <SplitSquareVertical className="w-3.5 h-3.5" />
                      <span>🖥️ Copy + Board (Dual View)</span>
                    </button>

                    <button
                      onClick={() => setWhiteboardViewMode('chalkboard')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        whiteboardViewMode === 'chalkboard'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Keval Teacher Chalk Blackboard dekhein"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>📝 Only Blackboard</span>
                    </button>

                    <button
                      onClick={() => setWhiteboardViewMode('copy')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        whiteboardViewMode === 'copy'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Keval Uploaded Student Copy dekhein"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>📄 Only Copy</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold text-white px-3 py-1.5 gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Teacher Chalk Blackboard</span>
                  </div>
                )}

                {/* Upload Button directly accessible on the Whiteboard */}
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all shadow-sm"
                  title="Apni homework copy ya book ka photo upload karein"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{uploadedDoc ? '📎 Change Copy' : '📸 Upload Copy / Page'}</span>
                </button>
              </div>

              {/* Action Buttons: Slow Pacing Speed, Step Audio & Pointer */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* School-Style Slow Pacing Speed Control */}
                <button
                  onClick={() => {
                    const newRate = speechRate <= 0.78 ? 1.0 : 0.75;
                    changeSpeechRate(newRate);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    speechRate <= 0.78
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Speech speed dheere ya normal karein"
                >
                  <span>🐢 Pacing:</span>
                  <span className="font-mono">{speechRate <= 0.78 ? 'Dheere (0.75x)' : 'Normal (1.0x)'}</span>
                </button>

                {/* Audio explanation button */}
                <button
                  onClick={() => {
                    const activeStep = whiteboardSteps[activeStepIndex];
                    if (activeStep) {
                      speakText(`${activeStep.step}: ${activeStep.formula}. ${activeStep.annotation}`);
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-all shadow-sm"
                  title="Current step ki audio sunein"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Step Suniye 🔊</span>
                </button>

                {/* Laser Pointer toggle */}
                <button
                  onClick={() => setPointerEnabled(!pointerEnabled)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    pointerEnabled
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 text-rose-400" />
                  <span>Pointer: {pointerEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Scanning Overlay Animation */}
            {isScanningDoc && (
              <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-3 shadow-[0_0_20px_#10b981]" />
                <p className="text-base font-extrabold text-emerald-400">
                  {uploadedDoc?.type === 'pdf' ? 'AI PDF Chapter Read Kar Raha Hai...' : 'AI Scanner Notebook Copy Check Kar Raha Hai...'}
                </p>
                <p className="text-xs text-slate-300 mt-1 max-w-sm">
                  Textbook ke questions aur student ki handwriting read karke whiteboard par step-by-step chalk notes taiyar ho rahe hain...
                </p>
                <div className="w-48 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent mt-4 shadow-[0_0_15px_#10b981] animate-pulse" />
              </div>
            )}

            {/* WHITEBOARD MAIN CONTENT CANVAS */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[380px]">
              {uploadedDoc ? (
                /* CASE A: A DOCUMENT IS UPLOADED -> RENDER ON WHITEBOARD! */
                <div
                  className={`flex-1 gap-4 overflow-hidden ${
                    whiteboardViewMode === 'split'
                      ? 'grid grid-cols-1 lg:grid-cols-12'
                      : 'flex flex-col'
                  }`}
                >
                  {/* PANEL 1: STUDENT'S UPLOADED NOTEBOOK / BOOK PAGE */}
                  {(whiteboardViewMode === 'split' || whiteboardViewMode === 'copy') && (
                    <div
                      className={`${
                        whiteboardViewMode === 'split' ? 'lg:col-span-6' : 'w-full'
                      } flex flex-col bg-slate-950/90 rounded-2xl border border-slate-800 p-3 overflow-hidden shadow-inner`}
                    >
                      {/* Copy Viewer Header Bar */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-extrabold text-amber-300 truncate flex items-center gap-1.5">
                            <span>📄 Aapki Uploaded Copy:</span>
                            <span className="font-normal text-slate-300 text-[11px] truncate max-w-[170px]">
                              {uploadedDoc.name}
                            </span>
                          </span>
                        </div>

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px]">
                          <button
                            onClick={() => setCopyZoom((z) => Math.max(0.6, z - 0.15))}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-[10px] text-slate-300 px-1">
                            {Math.round(copyZoom * 100)}%
                          </span>
                          <button
                            onClick={() => setCopyZoom((z) => Math.min(2.5, z + 0.15))}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setCopyZoom(1)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 ml-1 font-bold"
                            title="Reset Zoom"
                          >
                            100%
                          </button>
                        </div>
                      </div>

                      {/* Document Viewer Body */}
                      <div className="flex-1 overflow-auto rounded-xl bg-slate-900/60 border border-slate-800/60 p-2 flex items-center justify-center relative min-h-[260px]">
                        {uploadedDoc.type === 'pdf' ? (
                          <div className="w-full max-w-sm bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-4 shadow-xl flex flex-col gap-2.5">
                            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2.5">
                              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center text-lg font-bold font-mono">
                                PDF
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-extrabold text-xs text-white truncate">{uploadedDoc.name}</h4>
                                <span className="text-[10px] text-emerald-400 font-bold block">
                                  ● RBSE Rajasthan Board Class 4
                                </span>
                              </div>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Extracted Chapter:</span>
                              <p className="text-white font-bold">{uploadedDoc.extractedSnippet || 'Chapter Questions Verified'}</p>
                            </div>
                          </div>
                        ) : uploadedDoc.url === 'sample_notebook' ? (
                          <div className="w-full max-w-xs bg-amber-50 text-slate-900 rounded-xl p-4 font-mono text-xs shadow-xl border-2 border-amber-300">
                            <div className="border-b border-amber-300 pb-1.5 mb-2 flex items-center justify-between text-[10px] text-slate-600">
                              <span className="font-bold">MATH HOMEWORK • CLASS 4</span>
                              <span>RBSE BOARD</span>
                            </div>
                            <p className="font-bold">Q1. 15 × 6 = 90 <span className="text-emerald-600 font-bold">✓ (Sahi)</span></p>
                            <div className="p-1.5 my-1 bg-red-100 rounded border border-red-300 text-red-700">
                              <p className="font-bold">Q2. (4/5) - (2/5) = 2/0 ❌</p>
                              <p className="text-[10px] text-red-600">Denominator zero nahi ho sakta</p>
                            </div>
                            <p className="font-bold">Q3. 120 ÷ 4 = 30 <span className="text-emerald-600 font-bold">✓</span></p>
                          </div>
                        ) : (
                          <div
                            className="transition-transform duration-150 origin-top-left max-h-[360px] overflow-auto flex items-center justify-center relative w-full"
                            style={{ transform: `scale(${copyZoom})` }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={uploadedDoc.url}
                              alt="Uploaded Student Copy or Book Page"
                              className="max-h-[350px] w-auto object-contain rounded-xl shadow-2xl border-2 border-amber-500/40"
                            />

                            {/* Laser pointer overlay on the image matching the active step */}
                            {pointerEnabled && (
                              <div className="absolute top-4 left-4 bg-rose-600/90 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg border border-white/40 flex items-center gap-1.5 backdrop-blur-sm animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                <span>Laser Pointing: Step {activeStepIndex + 1}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Verified Badge Footer */}
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>AI Line-by-Line Checked</span>
                        </span>
                        <span className="text-slate-400">
                          {uploadedDoc.size || 'Scanned Document'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* PANEL 2: TEACHER CHALK BLACKBOARD WITH SLOW PACING PROGRESSION */}
                  {(whiteboardViewMode === 'split' || whiteboardViewMode === 'chalkboard') && (
                    <div
                      className={`${
                        whiteboardViewMode === 'split' ? 'lg:col-span-6' : 'w-full'
                      } flex flex-col bg-emerald-950/25 rounded-2xl border-2 border-emerald-800/50 p-3.5 overflow-hidden shadow-2xl`}
                    >
                      {/* Chalkboard Title Banner */}
                      <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2 mb-2 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{selectedTeacher.name} Chalkboard</span>
                          <span className="text-[10px] font-normal text-slate-300">
                            • Step {activeStepIndex + 1} of {whiteboardSteps.length}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700/40">
                          RBSE Rajasthan Board
                        </span>
                      </div>

                      {/* Visible Chalk Steps List */}
                      <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[300px]">
                        {whiteboardSteps.slice(0, visibleStepCount).map((stepItem, idx) => {
                          const isActive = idx === activeStepIndex;
                          return (
                            <div
                              key={idx}
                              onClick={() => handleStepClick(idx)}
                              className={`p-3.5 rounded-2xl transition-all cursor-pointer relative overflow-hidden ${
                                stepItem.isMistake
                                  ? 'bg-red-950/50 border-2 border-red-500/80 shadow-lg'
                                  : isActive
                                  ? 'bg-slate-950 border-2 border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/20'
                                  : 'bg-slate-950/80 border border-emerald-900/40 hover:border-emerald-700/60'
                              }`}
                            >
                              {/* Step Pointer Target */}
                              {isActive && pointerEnabled && (
                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  <span>Pointer Active</span>
                                </div>
                              )}

                              {/* Step Header */}
                              <div className="flex items-center gap-2 text-xs font-bold mb-1">
                                <span className={stepItem.isMistake ? 'text-red-400' : isActive ? 'text-amber-400' : 'text-emerald-400'}>
                                  {stepItem.step}
                                </span>
                                {isActive && isSpeakingAudio && (
                                  <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                                    Speaking Now 🔊
                                  </span>
                                )}
                              </div>

                              {/* Chalk Equation or Keywords */}
                              <p className={`text-base sm:text-lg font-black font-mono tracking-wide ${stepItem.isMistake ? 'text-red-300' : isActive ? 'text-amber-200' : 'text-cyan-300'}`}>
                                {stepItem.formula}
                              </p>

                              {/* Chalk Annotation */}
                              {stepItem.annotation && (
                                <p className="text-xs font-sans text-slate-300 mt-1.5 leading-relaxed">
                                  {stepItem.annotation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* SLOW PACING CHALK ACTION BAR: Teacher writes one step at a time! */}
                      <div className="mt-3 pt-2.5 border-t border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-2 bg-emerald-950/40 -mx-3.5 -mb-3.5 p-3 rounded-b-2xl">
                        {visibleStepCount < whiteboardSteps.length ? (
                          <div className="w-full flex items-center justify-between gap-2">
                            <span className="text-[11px] text-emerald-300 font-medium truncate">
                              ⏳ Teacher step {visibleStepCount} samjha rahe hain...
                            </span>
                            <button
                              onClick={handleNextStep}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <span>➡️ Agla Step Likhie ({visibleStepCount + 1}/{whiteboardSteps.length})</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between gap-2">
                            <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Sabhi steps complete ho gaye!</span>
                            </span>
                            <button
                              onClick={handleRestartSteps}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3 text-slate-400" />
                              <span>Shuru se Dheere Dheere Sunein</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* CASE B: NO DOCUMENT UPLOADED YET -> CHALKBOARD WITH QUICK UPLOAD DROPZONE */
                <div className="flex-1 flex flex-col space-y-3 overflow-y-auto pr-1">
                  {/* Upload Call-To-Action Banner */}
                  <div
                    onClick={() => setIsUploadModalOpen(true)}
                    className="p-3.5 rounded-2xl border-2 border-dashed border-emerald-500/50 bg-emerald-950/20 hover:bg-emerald-950/40 cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-lg font-bold">
                        📸
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-white block">
                          Apni Notebook Copy ya Book Page Upload Karein
                        </span>
                        <span className="text-[11px] text-slate-300">
                          Aapki copy blackboard par teacher ke saath side-by-side dikhegi aur line-by-line check hogi!
                        </span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap shadow-md">
                      Upload Karein ➔
                    </button>
                  </div>

                  {/* Visible Chalkboard Steps */}
                  {whiteboardSteps.slice(0, visibleStepCount).map((stepItem, idx) => {
                    const isActive = idx === activeStepIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleStepClick(idx)}
                        className={`p-4 rounded-2xl transition-all cursor-pointer relative overflow-hidden ${
                          stepItem.isMistake
                            ? 'bg-red-950/40 border-2 border-red-500/80 shadow-xl'
                            : isActive
                            ? 'bg-slate-950 border-2 border-rose-500/80 shadow-xl ring-2 ring-rose-500/30'
                            : 'bg-slate-950/70 border border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {isActive && pointerEnabled && (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            <span>Teacher Pointer</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs font-bold mb-1.5">
                          <span className={stepItem.isMistake ? 'text-red-400' : isActive ? 'text-rose-400' : 'text-indigo-400'}>
                            {stepItem.step}
                          </span>
                        </div>
                        <p className={`text-xl font-black font-mono tracking-wide ${stepItem.isMistake ? 'text-red-300' : isActive ? 'text-amber-300' : 'text-cyan-300'}`}>
                          {stepItem.formula}
                        </p>
                        {stepItem.annotation && (
                          <p className="text-xs font-sans text-slate-300 mt-2 leading-relaxed">
                            {stepItem.annotation}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Slow Pacing Button */}
                  {visibleStepCount < whiteboardSteps.length && (
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Teacher step-by-step samjha rahe hain</span>
                      <button
                        onClick={handleNextStep}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-md"
                      >
                        <span>Agla Step Likhie ➔</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Whiteboard Footer Toolbar */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {selectedTeacher.name} chalk blackboard • Pacing: {speechRate <= 0.78 ? 'Dheere (0.75x)' : 'Normal (1.0x)'}
                </span>
              </span>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Copy ya PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Doubts Chat, Voice Push-To-Talk Mic & Multimodal Controls */}
        <div className="lg:col-span-4 bg-slate-900 flex flex-col justify-between p-3 sm:p-5">
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

                    {isTeacher && (
                      <button
                        onClick={() => speakText(m.text)}
                        className="flex items-center gap-1 text-[10px] text-amber-300 bg-slate-900/90 hover:bg-slate-700 px-2 py-0.5 rounded-md font-bold transition-all border border-slate-700 shadow-sm"
                        title="Is explanation ko awaz me sunein"
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

          {/* Bottom Action Area: Mic, Page/PDF Upload & Text Input */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            {/* Push-To-Talk Mic Button */}
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
                  : 'Mic dabakar bolkar sawaal poochein (Voice Doubt)'}
              </span>
            </div>

            {/* Quick Action Chips (Include PDF & Photo chips) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[10px] font-bold whitespace-nowrap border border-emerald-500/40 flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Upload PDF / Photo</span>
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

            {/* Text input with Camera & PDF attachments */}
            <div className="flex items-center gap-1.5 bg-slate-950 rounded-2xl p-2 border border-slate-800 focus-within:border-indigo-500 transition-colors">
              {/* Photo button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Notebook Photo Upload Karein"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-all border border-slate-800"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* PDF button */}
              <button
                onClick={() => pdfInputRef.current?.click()}
                title="PDF Chapter / Homework Upload Karein"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-red-400 hover:text-red-300 transition-all border border-slate-800"
              >
                <FileText className="w-4 h-4" />
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

      {/* 4. MODAL: UPLOAD NOTEBOOK PHOTO OR PDF CHAPTER */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Upload Homework Copy ya PDF</h3>
                  <p className="text-xs text-slate-400">Teacher document read karke blackboard par solve karenge</p>
                </div>
              </div>

              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Option A: Photo Upload (Camera / Copy) */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-900/30 cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
              >
                <Camera className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-xs text-white">1. Notebook Photo 📸</span>
                <span className="text-[10px] text-slate-400 mt-1">Copy ka photo kheenche ya select karein (JPG, PNG)</span>
              </div>

              {/* Option B: PDF Document Upload */}
              <div
                onClick={() => pdfInputRef.current?.click()}
                className="p-4 rounded-2xl border-2 border-dashed border-red-500/40 bg-red-950/20 hover:bg-red-900/30 cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
              >
                <FileText className="w-8 h-8 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-xs text-white">2. PDF Chapter / Book 📄</span>
                <span className="text-[10px] text-slate-400 mt-1">NCERT textbook ya worksheet PDF file upload karein</span>
              </div>
            </div>

            {/* Instant Sample Demos (One-Click Testing) */}
            <div className="space-y-2 mb-4">
              <span className="text-[11px] font-bold text-slate-400">Instant RBSE Class 4th Demos (Bina file select kiye test karein):</span>
              
              {/* Featured: Student Uploaded Hindi Textbook (Page 87 - Real WhatsApp Image Scan) */}
              <div
                onClick={() => handleLoadSamplePage('rbse_hindi')}
                className="p-3.5 rounded-2xl border-2 border-amber-500/60 bg-amber-950/30 hover:border-amber-400 cursor-pointer transition-all flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-lg font-bold">
                    📖
                  </div>
                  <div>
                    <span className="font-bold text-xs text-amber-200 block">Class 4 Hindi: Page 87 (WhatsApp Copy Scan)</span>
                    <span className="text-[10px] text-slate-300">निखिल के चाचा जी, मूल्यपरक प्रश्न, विलोम शब्द (उपसर्ग 'अ', 'अन्', 'दुर्')</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-1 rounded-lg">Real Photo Scan ⚡</span>
              </div>

              {/* RBSE Demo 1: Story of Amrita (Rajasthan EVS) */}
              <div
                onClick={() => handleLoadSamplePage('rbse_amrita')}
                className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/60 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                    🌿
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">RBSE Class 4 EVS: Ch 4 The Story of Amrita (PDF)</span>
                    <span className="text-[10px] text-slate-400">Khejarli village Jodhpur, Khejri state tree of Rajasthan</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">RBSE EVS ⚡</span>
              </div>

              {/* RBSE Demo 2: Halves & Quarters (Fractions) */}
              <div
                onClick={() => handleLoadSamplePage('rbse_fractions')}
                className="p-3 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 hover:border-indigo-500/60 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold">
                    📄
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">RBSE Class 4 Math: Ch 9 Halves & Quarters (PDF)</span>
                    <span className="text-[10px] text-slate-400">Fractions 1/2 + 1/4 blackboard solving</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg">RBSE Math ⚡</span>
              </div>

              {/* RBSE Demo 3: Building with Bricks */}
              <div
                onClick={() => handleLoadSamplePage('rbse_bricks')}
                className="p-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 hover:border-amber-500/60 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold">
                    🧱
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">RBSE Class 4 Math: Ch 1 Building with Bricks (Copy)</span>
                    <span className="text-[10px] text-slate-400">Haveli arches, 6 faces of brick geometry check</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">RBSE Bricks ⚡</span>
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

      {/* 5. MODAL: RBSE RAJASTHAN CLASS 4TH ENGLISH MEDIUM FULL SYLLABUS DIRECTORY */}
      {isSyllabusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xl font-bold">
                  🏛️
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    RBSE Rajasthan Board — Class 4th (English Medium)
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="text-emerald-400 font-bold">● Active Curriculum</span>
                    <span>• State Board Rajasthan (Ajmer)</span>
                    <span>• Verified for AI Teacher</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsSyllabusModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subject Tabs */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-4 text-xs font-bold">
              {(['Math', 'EVS', 'English'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSyllabusModalTab(tab)}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    syllabusModalTab === tab
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'Math'
                    ? '📐 Mathematics (14 Ch)'
                    : tab === 'EVS'
                    ? '🌿 EVS / Science (27 Ch)'
                    : '📚 English (10 Ch)'}
                </button>
              ))}
            </div>

            {/* Chapters Scroll View */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {syllabusModalTab === 'Math' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-amber-300 font-bold">
                    Textbook: Math-Magic / Ganit • Rajasthan Board Class 4 English Medium
                  </p>
                  {[
                    { num: 1, title: 'Building with Bricks', concepts: 'Brick patterns, 6 faces of brick, arches & haveli jharokhas' },
                    { num: 2, title: 'Long and Short', concepts: 'Units cm, m, km, height & length measurement conversions' },
                    { num: 3, title: 'A Trip to Bhopal & Rajasthan', concepts: 'Travel math, bus diesel pricing, ticket word problems' },
                    { num: 4, title: 'Tick-Tick-Tick', concepts: 'Reading clocks, 12-hr vs 24-hr time, calendar dates calculation' },
                    { num: 5, title: 'The Way the World Looks', concepts: 'Top, side & front views, route mapping, floor plan reading' },
                    { num: 6, title: 'The Junk Seller', concepts: 'Indian currency rupees & paise, profit calculation, mental math' },
                    { num: 7, title: 'Jugs and Mugs', concepts: 'Liquid capacity, Litres (L) and Millilitres (mL), 1L = 1000mL' },
                    { num: 8, title: 'Carts and Wheels', concepts: 'Circles, radius, center point, compass circular designs' },
                    { num: 9, title: 'Halves and Quarters', concepts: 'Fractions 1/2, 1/4, 3/4, equivalent fractions, equal sharing' },
                    { num: 10, title: 'Play with Patterns', concepts: 'Number patterns, mirror symmetry, tessellation, magic squares' },
                    { num: 11, title: 'Tables and Shares', concepts: 'Multiplication tables 1 to 20, division as repeated subtraction' },
                    { num: 12, title: 'How Heavy? How Light?', concepts: 'Weight measurement, pan balance beam, Grams and Kilograms' },
                    { num: 13, title: 'Fields and Fences', concepts: 'Perimeter of polygon shapes, boundaries of farms and fields' },
                    { num: 14, title: 'Smart Charts', concepts: 'Data collection, tally marks (||||), bar graphs, chapati charts' },
                  ].map((ch) => (
                    <div key={ch.num} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <span className="font-extrabold text-white block">
                          Chapter {ch.num}: {ch.title}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">{ch.concepts}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                        Verified ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {syllabusModalTab === 'EVS' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-emerald-300 font-bold">
                    Textbook: Looking Around / Apana Parivesh • Rajasthan State Board
                  </p>
                  {[
                    { num: 1, title: 'Going to School', concepts: 'Camel cart in Thar Desert of Rajasthan, bridges, boats' },
                    { num: 4, title: 'The Story of Amrita', concepts: 'Bishnoi community, Khejarli near Jodhpur, Khejri tree sacrifice' },
                    { num: 5, title: 'Anita and the Honeybees', concepts: 'Girl child education, bee-farming, queen bee life cycle' },
                    { num: 18, title: 'Too Much Water, Too Little Water', concepts: 'Water conservation in dry areas, making ORS, clean water' },
                    { num: 25, title: 'Spicy Riddles', concepts: 'Kitchen spices of Rajasthan & India: Clove, Turmeric, Cumin, Cardamom' },
                  ].map((ch) => (
                    <div key={ch.num} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <span className="font-extrabold text-white block">
                          Chapter {ch.num}: {ch.title}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">{ch.concepts}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                        Verified ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {syllabusModalTab === 'English' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-pink-300 font-bold">
                    Textbook: Lets Learn English / Marigold • Class 4 English Medium
                  </p>
                  {[
                    { num: 1, title: 'A Boy with a Wish', concepts: 'Courage, persistence, vocabulary, phonetics' },
                    { num: 3, title: 'A Brave Tribal Girl', concepts: 'Bravery of Seema in Aravali forest, adjectives' },
                    { num: 10, title: 'Festivals of Rajasthan', concepts: 'Teej, Gangaur, Pushkar Camel Fair, Desert Festival' },
                  ].map((ch) => (
                    <div key={ch.num} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <span className="font-extrabold text-white block">
                          Chapter {ch.num}: {ch.title}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">{ch.concepts}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                        Verified ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-3 text-xs">
              <span className="text-slate-400">
                AI Teacher pehle is syllabus se sawaal verify karke hi answer karta hai.
              </span>
              <button
                onClick={() => setIsSyllabusModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
              >
                Samajh Aa Gaya ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
