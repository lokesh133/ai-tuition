// ==============================================================================
// TEACHER PERSONA BRIDGE & UNIFIED STUDENT MEMORY
// Sharma Sir, Neha Mam, Riya Didi, Kabir Sir, Pooja Mam
// Shared Learning Profile with distinct subject personalities & age-appropriate tone.
// ==============================================================================

import { TeacherId, SubjectId, StudentLearningProfile } from './types';

export interface TeacherPersona {
  id: TeacherId;
  name: string;
  subject: string;
  subjectId: SubjectId;
  emoji: string;
  avatarColor: string;
  tagline: string;
}

export const TEACHER_PERSONAS: Record<TeacherId, TeacherPersona> = {
  sharma_sir: {
    id: 'sharma_sir',
    name: 'Sharma Sir',
    subject: 'Mathematics',
    subjectId: 'math',
    emoji: '👨‍🏫',
    avatarColor: 'from-amber-500 to-orange-600',
    tagline: 'Step-by-step calculations, column math aur mental shortcuts',
  },
  neha_mam: {
    id: 'neha_mam',
    name: 'Neha Mam',
    subject: 'Science & EVS',
    subjectId: 'science',
    emoji: '👩‍🔬',
    avatarColor: 'from-sky-500 to-blue-600',
    tagline: 'Visual experiments, diagrams aur nature ke wonders',
  },
  riya_didi: {
    id: 'riya_didi',
    name: 'Riya Didi',
    subject: 'English',
    subjectId: 'english',
    emoji: '👩‍🏫',
    avatarColor: 'from-pink-500 to-rose-600',
    tagline: 'Grammar, vocabulary, dictation aur sentence building',
  },
  kabir_sir: {
    id: 'kabir_sir',
    name: 'Kabir Sir',
    subject: 'Social Studies',
    subjectId: 'sst',
    emoji: '👨‍💼',
    avatarColor: 'from-purple-500 to-indigo-600',
    tagline: 'Itihas ki kahaniyan aur geography ke rochak facts',
  },
  pooja_mam: {
    id: 'pooja_mam',
    name: 'Pooja Mam',
    subject: 'Hindi & Vyakaran',
    subjectId: 'hindi',
    emoji: '👩‍🎓',
    avatarColor: 'from-emerald-500 to-teal-600',
    tagline: 'Shuddh uchharan, kavitaayein aur vyakaran ke saral niyam',
  },
};

/**
 * Generates teacher greeting infused with real student memory
 */
export function getContextualTeacherGreeting(
  teacherId: TeacherId,
  profile: StudentLearningProfile,
  language: 'hi' | 'en' = 'hi'
): { greeting: string; focusTopic?: string } {
  const teacher = TEACHER_PERSONAS[teacherId] || TEACHER_PERSONAS.sharma_sir;
  const studentName = profile.studentName || 'Beta';

  // Check if student has weak concepts in this teacher's subject
  const subjectWeak = profile.weakConcepts.filter(
    (w) => w.subjectId === teacher.subjectId && w.status === 'ACTIVE'
  );

  // Check if student has overdue revisions in this subject
  const todayStr = new Date().toISOString().split('T')[0];
  const dueRevision = profile.revisionSchedule.find(
    (r) => r.subjectId === teacher.subjectId && r.nextDueDate <= todayStr
  );

  if (dueRevision) {
    if (language === 'en') {
      return {
        greeting: `Hello ${studentName}! ${teacher.name} here. Today is your scheduled revision for "${dueRevision.conceptTitle}". Let's solve 2 quick problems together!`,
        focusTopic: dueRevision.conceptTitle,
      };
    }
    return {
      greeting: `Namaste ${studentName}! ${teacher.name} bol raha hoon. Aaj aapka "${dueRevision.conceptTitle}" revise karne ka din hai. Chalo 2 minute me ise pakka karte hain!`,
      focusTopic: dueRevision.conceptTitle,
    };
  }

  if (subjectWeak.length > 0) {
    const weak = subjectWeak[0];
    if (language === 'en') {
      return {
        greeting: `Welcome back ${studentName}! In our last session, we noticed a small slip in "${weak.conceptTitle}". Let's master it step-by-step today!`,
        focusTopic: weak.conceptTitle,
      };
    }
    return {
      greeting: `Arey ${studentName}! ${teacher.name} ki class me swagat hai. Pichli baar "${weak.conceptTitle}" me thodi chook hui thi na? Chalo aaj bina kisi darr ke use 100% sahi solve karna seekhte hain!`,
      focusTopic: weak.conceptTitle,
    };
  }

  // General high-mastery encouragement
  if (language === 'en') {
    return {
      greeting: `Great to see you, ${studentName}! Your learning streak is strong. Ready for today's lesson with ${teacher.name}?`,
    };
  }
  return {
    greeting: `Shabaash ${studentName}! Aapki padhai ka streak bohot accha chal raha hai. Aaj ${teacher.name} ke saath kya naya seekhna chahte ho?`,
  };
}
