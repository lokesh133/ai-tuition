import { create } from 'zustand';

export type TeacherId = 'neha' | 'sharma' | 'riya' | 'kabir' | 'pooja';
export type EmotionState = 'Greeting' | 'Listening' | 'Thinking' | 'Speaking' | 'Idle';
export type LanguageMode = 'Hinglish' | 'Hindi' | 'English';

export interface Message {
  id: string;
  sender: 'student' | 'teacher';
  text: string;
  timestamp: string;
  audioUrl?: string;
}

export interface WhiteboardStep {
  id: string;
  type: 'text' | 'formula' | 'diagram' | 'highlight';
  content: string;
  annotation?: string;
  color?: string;
}

export interface AnnotationItem {
  id: string;
  yPercent: number; // Position percentage on scanned image
  type: 'correct' | 'mistake' | 'tip';
  feedbackText: string;
  hintFormula?: string;
}

interface AppState {
  // Student Profile
  studentName: string;
  studentClass: string;
  streakCount: number;
  starPoints: number;

  // Selected AI Teacher
  selectedTeacherId: TeacherId;
  setSelectedTeacher: (id: TeacherId) => void;

  // AI Tutor Studio State
  teacherEmotion: EmotionState;
  setTeacherEmotion: (emotion: EmotionState) => void;
  isPushToTalkActive: boolean;
  setIsPushToTalkActive: (active: boolean) => void;
  audioLevels: number[];
  setAudioLevels: (levels: number[]) => void;
  languageMode: LanguageMode;
  setLanguageMode: (mode: LanguageMode) => void;

  // Studio Chat & Whiteboard
  studioMessages: Message[];
  addStudioMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  whiteboardSteps: WhiteboardStep[];
  addWhiteboardStep: (step: WhiteboardStep) => void;
  clearWhiteboard: () => void;

  // Homework Scanner State
  capturedImageUri: string | null;
  setCapturedImageUri: (uri: string | null) => void;
  isAnalyzingHomework: boolean;
  setIsAnalyzingHomework: (analyzing: boolean) => void;
  homeworkAnnotations: AnnotationItem[];
  setHomeworkAnnotations: (items: AnnotationItem[]) => void;

  // Gamification Actions
  incrementStars: (amount: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  studentName: 'Aarav Sharma',
  studentClass: 'Class 5th B',
  streakCount: 7,
  starPoints: 480,

  selectedTeacherId: 'sharma',
  setSelectedTeacher: (id) => set({ selectedTeacherId: id }),

  teacherEmotion: 'Greeting',
  setTeacherEmotion: (emotion) => set({ teacherEmotion: emotion }),

  isPushToTalkActive: false,
  setIsPushToTalkActive: (active) => set({ isPushToTalkActive: active }),

  audioLevels: [25, 45, 60, 80, 50, 70, 90, 40, 30],
  setAudioLevels: (levels) => set({ audioLevels: levels }),

  languageMode: 'Hinglish',
  setLanguageMode: (mode) => set({ languageMode: mode }),

  studioMessages: [
    {
      id: '1',
      sender: 'teacher',
      text: 'Namaste Aarav beta! Aaj hum Fractions & Decimals ka concept seekhenge. Kaho, kya doubt hai?',
      timestamp: '09:15 AM',
    },
  ],
  addStudioMessage: (msg) =>
    set((state) => ({
      studioMessages: [
        ...state.studioMessages,
        {
          ...msg,
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    })),

  whiteboardSteps: [
    {
      id: 'step-1',
      type: 'formula',
      content: '1/2 + 1/4 = ?',
      annotation: 'Pehle common denominator 4 banayenge!',
      color: '#4F46E5',
    },
    {
      id: 'step-2',
      type: 'text',
      content: '2/4 + 1/4 = 3/4 (Three-Fourths / Pona)',
      annotation: 'Step 2: Numerators ko add karo (2 + 1 = 3)',
      color: '#06D6A0',
    },
  ],
  addWhiteboardStep: (step) =>
    set((state) => ({ whiteboardSteps: [...state.whiteboardSteps, step] })),
  clearWhiteboard: () => set({ whiteboardSteps: [] }),

  capturedImageUri: null,
  setCapturedImageUri: (uri) => set({ capturedImageUri: uri }),
  isAnalyzingHomework: false,
  setIsAnalyzingHomework: (analyzing) => set({ isAnalyzingHomework: analyzing }),
  homeworkAnnotations: [
    {
      id: 'ann-1',
      yPercent: 32,
      type: 'correct',
      feedbackText: 'Shabash! 12 × 4 = 48 calculation bilkul sahi hai.',
    },
    {
      id: 'ann-2',
      yPercent: 58,
      type: 'mistake',
      feedbackText: 'Yahan fraction cross-multiply karte waqt minus sign chhut gaya!',
      hintFormula: '- (3/7) × 14 = -6',
    },
    {
      id: 'ann-3',
      yPercent: 78,
      type: 'tip',
      feedbackText: 'Tip: Final answer ko hamesha simplified form me likhein.',
    },
  ],
  setHomeworkAnnotations: (items) => set({ homeworkAnnotations: items }),

  incrementStars: (amount) =>
    set((state) => ({ starPoints: state.starPoints + amount })),
}));
