// ==============================================================================
// STUDENT LEARNING BRAIN - PROFILE & MASTERY MANAGER
// Persistent structured learning profile, evidence-based mastery engine,
// spaced repetition scheduler, and daily study plan generator.
// ==============================================================================

import fs from 'fs';
import path from 'path';
import {
  StudentLearningProfile,
  ConceptScore,
  WeakConcept,
  RevisionScheduleItem,
  DailyStudyAction,
  MasteryEvidence,
  MistakeCategory,
  MasteryLevel,
  SubjectId,
  TeacherId,
} from './types';

const RECORDS_DIR = path.join(process.cwd(), 'data', 'student-records');

// In-memory cache to minimize disk I/O
const profileCache: Map<string, StudentLearningProfile> = new Map();

async function ensureDir() {
  try {
    if (!fs.existsSync(RECORDS_DIR)) {
      await fs.promises.mkdir(RECORDS_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Error creating student-records dir:', err);
  }
}

function getProfilePath(studentIdOrPhone: string): string {
  const clean = studentIdOrPhone.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(RECORDS_DIR, `${clean}-learning-profile.json`);
}

/**
 * Calculates Mastery Level strictly from verifiable evidence
 */
export function calculateMastery(
  score: number,
  independentCorrectCount: number,
  totalAttempts: number
): MasteryLevel {
  if (totalAttempts === 0) return 'NOVICE';
  if (score >= 90 && independentCorrectCount >= 3) return 'MASTERED';
  if (score >= 75 && independentCorrectCount >= 2) return 'PROFICIENT';
  if (score >= 50 && independentCorrectCount >= 1) return 'DEVELOPING';
  return 'NOVICE';
}

/**
 * Creates a brand-new empty profile with standard starter curriculum targets
 */
export function createDefaultProfile(
  studentId: string,
  studentPhone: string,
  studentName = 'Student',
  classGrade = 'Class 4th' as any,
  board = 'RBSE' as any,
  medium = 'HINDI' as any
): StudentLearningProfile {
  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];

  const defaultProfile: StudentLearningProfile = {
    studentId,
    studentPhone,
    studentName,
    classGrade,
    board,
    medium,
    updatedAt: now,
    createdAt: now,
    conceptMastery: {},
    weakConcepts: [],
    revisionSchedule: [],
    todayStudyPlan: [
      {
        id: `plan-scan-${now}`,
        type: 'PRACTICE_WEAK',
        title: 'Scan Aaj Ka School Homework',
        description: 'Apni copy ki photo kheechein aur Sharma Sir ya Neha Mam se step-by-step check karwayein.',
        subjectId: 'math',
        teacherId: 'sharma_sir',
        teacherName: 'Sharma Sir',
        estimatedMinutes: 10,
        priority: 'URGENT',
        completed: false,
      },
      {
        id: 'plan-math-revision',
        type: 'REVISION',
        title: 'Math: Place Value & 4-Digit Addition Practice',
        description: 'Sharma Sir ke saath 3 practice sawaal solve karein aur concept pakka karein.',
        subjectId: 'math',
        teacherId: 'sharma_sir',
        teacherName: 'Sharma Sir',
        estimatedMinutes: 15,
        priority: 'RECOMMENDED',
        conceptKey: 'math_c1_place_value',
        completed: false,
      },
      {
        id: 'plan-english-dictation',
        type: 'NEW_CONCEPT',
        title: 'English: Hard Words Dictation (श्रुतलेख)',
        description: 'Riya Didi se 5 new words sunkar spelling likhein.',
        subjectId: 'english',
        teacherId: 'riya_didi',
        teacherName: 'Riya Didi',
        estimatedMinutes: 10,
        priority: 'RECOMMENDED',
        conceptKey: 'eng_c1_vocabulary',
        completed: false,
      },
    ],
    stats: {
      totalQuestionsAttempted: 0,
      totalIndependentSolved: 0,
      totalMistakesDiagnosed: 0,
      totalRemediationsCompleted: 0,
      studyStreakDays: 1,
      lastStudyDate: todayStr,
      weeklyTimeSpentMinutes: 25,
    },
  };

  return defaultProfile;
}

/**
 * Load or initialize Student Learning Profile
 */
export async function getStudentProfile(
  studentIdOrPhone: string,
  fallbackDetails?: { name?: string; classGrade?: string; board?: string; medium?: string }
): Promise<StudentLearningProfile> {
  const key = studentIdOrPhone.trim();
  if (profileCache.has(key)) {
    return profileCache.get(key)!;
  }

  await ensureDir();
  const filePath = getProfilePath(key);

  if (fs.existsSync(filePath)) {
    try {
      const raw = await fs.promises.readFile(filePath, 'utf-8');
      const parsed: StudentLearningProfile = JSON.parse(raw);
      refreshStudyPlan(parsed);
      profileCache.set(key, parsed);
      return parsed;
    } catch (e) {
      console.warn('Error reading learning profile file, resetting cache:', e);
    }
  }

  // Create new profile
  const profile = createDefaultProfile(
    key,
    key,
    fallbackDetails?.name || 'Student',
    (fallbackDetails?.classGrade as any) || 'Class 4th',
    (fallbackDetails?.board as any) || 'RBSE',
    (fallbackDetails?.medium as any) || 'HINDI'
  );

  await saveStudentProfile(profile);
  return profile;
}

/**
 * Persist Student Learning Profile to disk and cache
 */
export async function saveStudentProfile(profile: StudentLearningProfile): Promise<boolean> {
  try {
    await ensureDir();
    profile.updatedAt = Date.now();
    const filePath = getProfilePath(profile.studentId || profile.studentPhone);
    await fs.promises.writeFile(filePath, JSON.stringify(profile, null, 2), 'utf-8');
    profileCache.set(profile.studentId, profile);
    if (profile.studentPhone) {
      profileCache.set(profile.studentPhone, profile);
    }
    return true;
  } catch (err) {
    console.error('Error saving student learning profile:', err);
    return false;
  }
}

/**
 * EVIDENCE-BASED MASTERY UPDATE:
 * Only updates mastery when student provides verifiable proof (independent answers).
 */
export async function recordMasteryAttempt(
  studentIdOrPhone: string,
  params: {
    conceptKey: string;
    conceptTitle: string;
    subjectId: SubjectId;
    chapterNumber: number;
    questionSnippet: string;
    isCorrect: boolean;
    wasIndependent: boolean;
    hintsUsedCount: number;
    timeTakenSeconds?: number;
  }
): Promise<StudentLearningProfile> {
  const profile = await getStudentProfile(studentIdOrPhone);
  const now = Date.now();

  const evidence: MasteryEvidence = {
    id: `ev-${now}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: now,
    questionSnippet: params.questionSnippet,
    isCorrect: params.isCorrect,
    wasIndependent: params.wasIndependent,
    hintsUsedCount: params.hintsUsedCount,
    timeTakenSeconds: params.timeTakenSeconds,
  };

  profile.stats.totalQuestionsAttempted += 1;
  if (params.isCorrect && params.wasIndependent) {
    profile.stats.totalIndependentSolved += 1;
  }

  // Get or initialize concept score
  let cScore = profile.conceptMastery[params.conceptKey];
  if (!cScore) {
    cScore = {
      conceptKey: params.conceptKey,
      conceptTitle: params.conceptTitle,
      subjectId: params.subjectId,
      chapterNumber: params.chapterNumber,
      score: 50,
      masteryLevel: 'DEVELOPING',
      totalAttempts: 0,
      independentCorrectCount: 0,
      evidence: [],
      lastAssessedAt: now,
    };
    profile.conceptMastery[params.conceptKey] = cScore;
  }

  cScore.totalAttempts += 1;
  cScore.lastAssessedAt = now;
  cScore.evidence.push(evidence);
  if (cScore.evidence.length > 20) {
    cScore.evidence.shift(); // Keep latest 20 evidence points
  }

  // Strict Mastery Calculation
  if (params.isCorrect && params.wasIndependent) {
    cScore.independentCorrectCount += 1;
    // Step up score
    cScore.score = Math.min(100, Math.round(cScore.score * 0.7 + 100 * 0.3));

    // Resolve or improve weak concept if active
    const weakIdx = profile.weakConcepts.findIndex((w) => w.conceptKey === params.conceptKey);
    if (weakIdx !== -1) {
      profile.weakConcepts[weakIdx].remediationCount += 1;
      if (cScore.independentCorrectCount >= 2) {
        profile.weakConcepts[weakIdx].status = 'RESOLVED';
      } else {
        profile.weakConcepts[weakIdx].status = 'IMPROVING';
      }
    }

    // Advance spaced repetition
    updateSpacedRepetition(profile, params.conceptKey, params.conceptTitle, params.subjectId, params.chapterNumber, true);
  } else if (!params.isCorrect) {
    // Score decay on incorrect attempt
    cScore.score = Math.max(10, Math.round(cScore.score * 0.7 + 20 * 0.3));
    cScore.independentCorrectCount = Math.max(0, cScore.independentCorrectCount - 1);

    // Schedule immediate review tomorrow
    updateSpacedRepetition(profile, params.conceptKey, params.conceptTitle, params.subjectId, params.chapterNumber, false);
  }

  cScore.masteryLevel = calculateMastery(cScore.score, cScore.independentCorrectCount, cScore.totalAttempts);

  refreshStudyPlan(profile);
  await saveStudentProfile(profile);
  return profile;
}

/**
 * Record a diagnosed mistake from Mistake Detective
 */
export async function recordDiagnosedMistake(
  studentIdOrPhone: string,
  params: {
    conceptKey: string;
    conceptTitle: string;
    subjectId: SubjectId;
    chapterNumber: number;
    misconception: string;
    mistakeType: MistakeCategory;
  }
): Promise<StudentLearningProfile> {
  const profile = await getStudentProfile(studentIdOrPhone);
  const now = Date.now();

  profile.stats.totalMistakesDiagnosed += 1;

  // Find or insert weak concept
  const existingIdx = profile.weakConcepts.findIndex((w) => w.conceptKey === params.conceptKey);
  if (existingIdx !== -1) {
    profile.weakConcepts[existingIdx].occurrences += 1;
    profile.weakConcepts[existingIdx].misconception = params.misconception;
    profile.weakConcepts[existingIdx].mistakeType = params.mistakeType;
    profile.weakConcepts[existingIdx].lastTestedAt = now;
    profile.weakConcepts[existingIdx].status = 'ACTIVE';
  } else {
    profile.weakConcepts.unshift({
      id: `weak-${now}-${Math.random().toString(36).slice(2, 6)}`,
      conceptKey: params.conceptKey,
      conceptTitle: params.conceptTitle,
      subjectId: params.subjectId,
      chapterNumber: params.chapterNumber,
      misconception: params.misconception,
      mistakeType: params.mistakeType,
      occurrences: 1,
      firstIdentifiedAt: now,
      lastTestedAt: now,
      status: 'ACTIVE',
      remediationCount: 0,
    });
  }

  // Update spaced repetition to Box 1 (Review Tomorrow)
  updateSpacedRepetition(profile, params.conceptKey, params.conceptTitle, params.subjectId, params.chapterNumber, false);

  refreshStudyPlan(profile);
  await saveStudentProfile(profile);
  return profile;
}

/**
 * Spaced Repetition Logic (Leitner Intervals: 1d -> 3d -> 7d -> 14d -> 30d)
 */
function updateSpacedRepetition(
  profile: StudentLearningProfile,
  conceptKey: string,
  conceptTitle: string,
  subjectId: SubjectId,
  chapterNumber: number,
  success: boolean
) {
  const intervals = [1, 3, 7, 14, 30]; // Days per box
  const now = Date.now();

  let item = profile.revisionSchedule.find((r) => r.conceptKey === conceptKey);
  if (!item) {
    item = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conceptKey,
      conceptTitle,
      subjectId,
      chapterNumber,
      boxLevel: 1,
      nextDueDate: getFutureDateString(1),
      isOverdue: false,
      priority: 'HIGH',
      recommendedAction: `Spaced Revision: ${conceptTitle}`,
    };
    profile.revisionSchedule.push(item);
  } else {
    if (success) {
      item.boxLevel = Math.min(5, item.boxLevel + 1);
    } else {
      item.boxLevel = 1; // Reset to box 1 on error
    }
    const daysToAdd = intervals[item.boxLevel - 1] || 1;
    item.nextDueDate = getFutureDateString(daysToAdd);
    item.isOverdue = false;
    item.priority = item.boxLevel <= 2 ? 'HIGH' : item.boxLevel === 3 ? 'MEDIUM' : 'LOW';
  }
}

function getFutureDateString(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

/**
 * Regenerates Today's Study Plan dynamically from active profile data
 */
export function refreshStudyPlan(profile: StudentLearningProfile) {
  const todayStr = new Date().toISOString().split('T')[0];
  const actions: DailyStudyAction[] = [];

  // 1. Check overdue / due revisions
  const dueRevisions = profile.revisionSchedule.filter((r) => {
    r.isOverdue = r.nextDueDate <= todayStr;
    return r.isOverdue;
  });

  for (const rev of dueRevisions.slice(0, 2)) {
    const teacherId: TeacherId =
      rev.subjectId === 'math'
        ? 'sharma_sir'
        : rev.subjectId === 'science'
        ? 'neha_mam'
        : rev.subjectId === 'english'
        ? 'riya_didi'
        : rev.subjectId === 'sst'
        ? 'kabir_sir'
        : 'pooja_mam';

    const teacherName =
      teacherId === 'sharma_sir'
        ? 'Sharma Sir'
        : teacherId === 'neha_mam'
        ? 'Neha Mam'
        : teacherId === 'riya_didi'
        ? 'Riya Didi'
        : teacherId === 'kabir_sir'
        ? 'Kabir Sir'
        : 'Pooja Mam';

    actions.push({
      id: `act-rev-${rev.conceptKey}`,
      type: 'REVISION',
      title: `Revision: ${rev.conceptTitle}`,
      description: `Spaced repetition time! Is topic ko 5 minute me revise karein taaki hamesha yaad rahe.`,
      subjectId: rev.subjectId,
      teacherId,
      teacherName,
      estimatedMinutes: 8,
      priority: 'URGENT',
      conceptKey: rev.conceptKey,
      completed: false,
    });
  }

  // 2. Add top active weak concept remediation
  const activeWeak = profile.weakConcepts.filter((w) => w.status === 'ACTIVE');
  if (activeWeak.length > 0) {
    const topWeak = activeWeak[0];
    actions.push({
      id: `act-weak-${topWeak.conceptKey}`,
      type: 'PRACTICE_WEAK',
      title: `Weak Concept Fix: ${topWeak.conceptTitle}`,
      description: topWeak.misconception || 'Sharma Sir ke guided hints ke saath 2 practice sawaal solve karein.',
      subjectId: topWeak.subjectId,
      teacherId: 'sharma_sir',
      teacherName: 'Sharma Sir',
      estimatedMinutes: 10,
      priority: 'RECOMMENDED',
      conceptKey: topWeak.conceptKey,
      completed: false,
    });
  }

  // 3. Keep standard scan homework task
  actions.push({
    id: `act-scan-${todayStr}`,
    type: 'PRACTICE_WEAK',
    title: 'Scan Homework & Instant Mistake Check',
    description: 'School copy ya textbook ki photo kheenche aur turant check karwayein.',
    subjectId: 'math',
    teacherId: 'sharma_sir',
    teacherName: 'Sharma Sir',
    estimatedMinutes: 10,
    priority: 'RECOMMENDED',
    completed: false,
  });

  profile.todayStudyPlan = actions;
}
