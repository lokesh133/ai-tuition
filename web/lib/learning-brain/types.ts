// ==============================================================================
// AI TUITION - LEARNING BRAIN & ADAPTIVE PRACTICE ENGINE TYPES
// Core domain interfaces for Evidence-Based Mastery, Mistake Detective & Adaptive Practice
// ==============================================================================

export type BoardType = 'CBSE' | 'RBSE' | 'UP_BOARD' | 'ICSE';
export type MediumType = 'HINDI' | 'ENGLISH' | 'HINGLISH';
export type ClassGradeType =
  | 'Class 1st'
  | 'Class 2nd'
  | 'Class 3rd'
  | 'Class 4th'
  | 'Class 5th'
  | 'Class 6th'
  | 'Class 7th'
  | 'Class 8th'
  | 'Class 9th'
  | 'Class 10th';

export type SubjectId = 'math' | 'science' | 'english' | 'sst' | 'hindi';

export type TeacherId = 'sharma_sir' | 'neha_mam' | 'riya_didi' | 'kabir_sir' | 'pooja_mam';

export type MistakeCategory =
  | 'CONCEPTUAL'    // e.g. doesn't understand fraction addition requires common denominator
  | 'CALCULATION'   // e.g. 7 + 8 written as 14, arithmetic slip
  | 'FORMULA'       // e.g. used 2*(l+b) instead of l*b for area
  | 'READING'       // e.g. misread "how many left" as "how many in total"
  | 'CARELESS';     // e.g. missed negative sign or forgot unit (cm vs m)

export type MasteryLevel = 'NOVICE' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

// Evidence Record for concept mastery
export interface MasteryEvidence {
  id: string;
  timestamp: number;
  questionSnippet: string;
  isCorrect: boolean;
  wasIndependent: boolean; // TRUE only if student solved without viewing full solution
  hintsUsedCount: number;  // 0, 1, or 2
  timeTakenSeconds?: number;
}

// Concept Mastery per chapter topic
export interface ConceptScore {
  conceptKey: string;           // e.g. "math_c4_fractions_addition"
  conceptTitle: string;         // e.g. "Fractions Addition with Like Denominators"
  subjectId: SubjectId;
  chapterNumber: number;
  score: number;                // 0 to 100 percentage
  masteryLevel: MasteryLevel;
  totalAttempts: number;
  independentCorrectCount: number;
  evidence: MasteryEvidence[];
  lastAssessedAt: number;
}

// Active Weak Concept with diagnosed misconception
export interface WeakConcept {
  id: string;
  conceptKey: string;
  conceptTitle: string;
  subjectId: SubjectId;
  chapterNumber: number;
  misconception: string;        // Child-friendly description of the error pattern
  mistakeType: MistakeCategory;
  occurrences: number;
  firstIdentifiedAt: number;
  lastTestedAt: number;
  status: 'ACTIVE' | 'IMPROVING' | 'RESOLVED';
  remediationCount: number;
}

// Spaced Repetition Item (Leitner / SuperMemo schedule)
export interface RevisionScheduleItem {
  id: string;
  conceptKey: string;
  conceptTitle: string;
  subjectId: SubjectId;
  chapterNumber: number;
  boxLevel: number;             // 1 (next day), 2 (3 days), 3 (7 days), 4 (14 days), 5 (30 days)
  nextDueDate: string;          // YYYY-MM-DD
  isOverdue: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: string;
}

// Daily personalized learning task
export interface DailyStudyAction {
  id: string;
  type: 'REVISION' | 'PRACTICE_WEAK' | 'NEW_CONCEPT' | 'SUNDAY_TEST_PREP';
  title: string;
  description: string;
  subjectId: SubjectId;
  teacherId: TeacherId;
  teacherName: string;
  estimatedMinutes: number;
  priority: 'URGENT' | 'RECOMMENDED' | 'OPTIONAL';
  conceptKey?: string;
  completed: boolean;
}

// Complete Persistent Learning Profile
export interface StudentLearningProfile {
  studentId: string;
  studentPhone: string;
  studentName: string;
  classGrade: ClassGradeType;
  board: BoardType;
  medium: MediumType;
  city?: string;
  updatedAt: number;
  createdAt: number;

  // Concept scores keyed by conceptKey
  conceptMastery: Record<string, ConceptScore>;

  // Diagnosed weak areas
  weakConcepts: WeakConcept[];

  // Spaced repetition schedule
  revisionSchedule: RevisionScheduleItem[];

  // Daily study plan
  todayStudyPlan: DailyStudyAction[];

  // Stats
  stats: {
    totalQuestionsAttempted: number;
    totalIndependentSolved: number;
    totalMistakesDiagnosed: number;
    totalRemediationsCompleted: number;
    studyStreakDays: number;
    lastStudyDate: string;
    weeklyTimeSpentMinutes: number;
  };
}

// -----------------------------------------------------------------------------
// MODULE 2: MISTAKE DETECTIVE TYPES
// -----------------------------------------------------------------------------

export interface ExtractedWorkingStep {
  stepNumber: number;
  rawText: string;
  normalizedExpression?: string;
  isCorrect: boolean;
  errorComment?: string;
}

export interface MistakeDetectiveResult {
  success: boolean;
  clarificationNeeded?: boolean;
  clarificationPrompt?: string; // Polite guidance when handwriting is blurry/ambiguous

  detectedSubject: SubjectId;
  detectedChapter?: string;
  conceptKey: string;
  conceptTitle: string;

  questionText: string;
  expectedFinalAnswer: string;
  studentFinalAnswer?: string;

  workingSteps: ExtractedWorkingStep[];
  earliestWrongStepIndex: number; // -1 if entirely correct, 0-indexed if mistake found

  mistakeType: MistakeCategory;
  isCorrect: boolean;

  // Educational Explanations
  whyMistakeOccurred: string;    // "Yahan galti isliye hui..."
  teacherEncouragement: string;  // Warm, patient tone

  // Progressive 2-tier hints
  progressiveHints: {
    level1Socratic: string;      // Guiding question without giving the answer
    level2RuleFormula: string;   // Rule/formula reminder
    level3FullStepSolution: string; // The step-by-step fix
  };

  // Immediate Remediation (Similar question for independent proof of mastery)
  remediationQuestion: {
    questionId: string;
    questionText: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
    stepGuide?: string[];
  };
}

// Remediation Submission from student
export interface RemediationSubmission {
  studentId: string;
  conceptKey: string;
  questionId: string;
  studentAnswer: string;
  hintsViewedCount: number;
  timeTakenSeconds?: number;
}

// -----------------------------------------------------------------------------
// MODULE 3: ADAPTIVE PRACTICE ENGINE TYPES
// -----------------------------------------------------------------------------

export interface AdaptivePracticeQuestion {
  id: string;
  subjectId: SubjectId;
  chapterNumber: number;
  conceptKey: string;
  conceptTitle: string;
  difficulty: DifficultyLevel;
  type: 'mcq' | 'solve' | 'fill_in_the_blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  prerequisiteRefresher?: string; // Provided if student is struggling with prerequisite concepts
  hints: string[];
}

export interface AdaptivePracticeSession {
  sessionId: string;
  studentId: string;
  subjectId: SubjectId;
  chapterNumber: number;
  targetConceptKey: string;
  currentDifficulty: DifficultyLevel;
  questions: AdaptivePracticeQuestion[];
  completedQuestions: Array<{
    questionId: string;
    studentAnswer: string;
    isCorrect: boolean;
    hintsUsed: number;
  }>;
  sessionScore: number;
}
