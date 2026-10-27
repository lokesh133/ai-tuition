// ==============================================================================
// AUTOMATED TEST SUITE: AI LEARNING BRAIN, MISTAKE DETECTIVE & ADAPTIVE PRACTICE
// Validates end-to-end vertical slice:
// Attempt -> Mistake Detection -> Guided Progressive Hints -> Remediation -> Mastery Update
// ==============================================================================

const fs = require('fs');
const path = require('path');

// Test utilities
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING AI LEARNING BRAIN END-TO-END TEST SUITE');
  console.log('======================================================\n');

  // TEST 1: Deterministic Math Verifier
  console.log('--- TEST 1: Deterministic Math Verifier ---');
  const { verifyMathSteps, evaluateSimpleArithmetic, verifyLanguageOrScienceAnswer } = require('../lib/learning-brain/deterministicVerifier');

  const evalVal = evaluateSimpleArithmetic('25 + 37');
  assert(evalVal === 62, 'evaluateSimpleArithmetic correctly calculates 25 + 37 = 62');

  const fractionVal = evaluateSimpleArithmetic('12 * 4 + 2');
  assert(fractionVal === 50, 'evaluateSimpleArithmetic correctly respects precedence: 12 * 4 + 2 = 50');

  // Verify multi-step calculation with a mistake on step 2
  const steps = [
    '402 - 178',
    '12 - 8 = 4',
    '30 - 17 = 23', // Mistake: 39 - 17 = 22, student wrote 23
    'Answer = 234'
  ];
  const mathVerification = verifyMathSteps(steps, '224');
  assert(!mathVerification.isVerified, 'verifyMathSteps correctly caught calculation error');
  assert(mathVerification.earliestWrongStep === 2, `verifyMathSteps pinned earliest wrong step at index 2 (actual: ${mathVerification.earliestWrongStep})`);

  // Language answer verification
  const langCheck = verifyLanguageOrScienceAnswer('photosynthesis', ['Photosynthesis', 'Prakash Sanshleshan']);
  assert(langCheck.isCorrect, 'verifyLanguageOrScienceAnswer verified science term case-insensitively');

  // TEST 2: Mistake Detective
  console.log('\n--- TEST 2: Mistake Detective Diagnostic ---');
  const { runTextMistakeDetective } = require('../lib/learning-brain/mistakeDetective');

  const diagnosis = runTextMistakeDetective({
    subjectId: 'math',
    questionText: '25 * 12 = ?',
    expectedAnswer: '300',
    studentAnswerText: '25 * 10 = 250\n25 * 2 = 40\nTotal = 290', // Mistake: 25 * 2 = 50, wrote 40
  });

  assert(diagnosis.success, 'Mistake Detective returned successful diagnosis');
  assert(!diagnosis.isCorrect, 'Mistake Detective correctly flagged incorrect attempt');
  assert(diagnosis.earliestWrongStepIndex === 1, `Earliest wrong step identified at step 2 (index: ${diagnosis.earliestWrongStepIndex})`);
  assert(diagnosis.mistakeType === 'CALCULATION', `Mistake classified as CALCULATION (actual: ${diagnosis.mistakeType})`);
  assert(Boolean(diagnosis.progressiveHints.level1Socratic), 'Progressive Hint 1 (Socratic) generated');
  assert(Boolean(diagnosis.progressiveHints.level2RuleFormula), 'Progressive Hint 2 (Rule/Formula) generated');
  assert(Boolean(diagnosis.remediationQuestion), 'Immediate Remediation Question generated');

  // TEST 3: Evidence-Based Mastery Update & Spaced Repetition
  console.log('\n--- TEST 3: Learning Profile & Spaced Repetition ---');
  const {
    createDefaultProfile,
    calculateMastery,
    recordMasteryAttempt,
    recordDiagnosedMistake,
    getStudentProfile,
  } = require('../lib/learning-brain/profileManager');

  const testPhone = '9999988888';
  const defaultProf = createDefaultProfile(testPhone, testPhone, 'Arjun Sharma', 'Class 4th', 'RBSE', 'HINDI');
  assert(defaultProf.studentName === 'Arjun Sharma', 'Profile created with student name');
  assert(defaultProf.todayStudyPlan.length >= 2, 'Today Study Plan dynamically seeded');

  // Test strict mastery progression
  const noviceMastery = calculateMastery(40, 0, 1);
  assert(noviceMastery === 'NOVICE', 'Score 40% with 0 independent correct is NOVICE');

  const devMastery = calculateMastery(65, 1, 2);
  assert(devMastery === 'DEVELOPING', 'Score 65% with 1 independent correct is DEVELOPING');

  const profMastery = calculateMastery(80, 2, 3);
  assert(profMastery === 'PROFICIENT', 'Score 80% with 2 independent correct is PROFICIENT');

  const highMastery = calculateMastery(95, 3, 4);
  assert(highMastery === 'MASTERED', 'Score 95% with 3 independent correct is MASTERED');

  // Record a diagnosed mistake into profile
  const profileAfterMistake = await recordDiagnosedMistake(testPhone, {
    conceptKey: 'math_subtraction_borrow',
    conceptTitle: 'Subtraction with Borrow',
    subjectId: 'math',
    chapterNumber: 2,
    misconception: 'Zero se borrow lene par hundreds digit ko reduce nahi kiya.',
    mistakeType: 'CONCEPTUAL',
  });

  const weakItem = profileAfterMistake.weakConcepts.find((w) => w.conceptKey === 'math_subtraction_borrow');
  assert(Boolean(weakItem), 'Diagnosed mistake recorded as active weak concept in profile');
  assert(weakItem.status === 'ACTIVE', 'Weak concept status is ACTIVE');

  // Verify spaced repetition box 1 was scheduled
  const revItem = profileAfterMistake.revisionSchedule.find((r) => r.conceptKey === 'math_subtraction_borrow');
  assert(Boolean(revItem), 'Spaced repetition schedule created for concept');
  assert(revItem.boxLevel === 1, 'Mistake placed concept into Leitner Box 1 (Review Tomorrow)');

  // TEST 4: Independent Remediation Proof of Mastery
  console.log('\n--- TEST 4: Independent Remediation Submission Loop ---');
  // Student independently solves the remediation problem correctly!
  const profileAfterRemediation = await recordMasteryAttempt(testPhone, {
    conceptKey: 'math_subtraction_borrow',
    conceptTitle: 'Subtraction with Borrow',
    subjectId: 'math',
    chapterNumber: 2,
    questionSnippet: '503 - 247 = ?',
    isCorrect: true,
    wasIndependent: true,
    hintsUsedCount: 0,
    timeTakenSeconds: 22,
  });

  const updatedScore = profileAfterRemediation.conceptMastery['math_subtraction_borrow'];
  assert(updatedScore.score >= 50, `Concept score increased after independent correct answer (score: ${updatedScore.score})`);
  assert(updatedScore.independentCorrectCount === 1, 'Independent correct count incremented');

  const updatedRev = profileAfterRemediation.revisionSchedule.find((r) => r.conceptKey === 'math_subtraction_borrow');
  assert(updatedRev.boxLevel === 2, `Spaced repetition advanced to Box 2 on verified correct answer (actual: ${updatedRev.boxLevel})`);

  // TEST 5: Adaptive Practice Engine
  console.log('\n--- TEST 5: Adaptive Practice Engine ---');
  const { generateAdaptiveQuestions } = require('../lib/learning-brain/adaptiveEngine');

  const adaptiveSession = generateAdaptiveQuestions({
    subjectId: 'math',
    chapterNumber: 1,
    profile: profileAfterRemediation,
    count: 3,
  });

  assert(adaptiveSession.questions.length === 3, 'Adaptive session generated 3 calibrated questions');
  assert(Boolean(adaptiveSession.questions[0].question), 'Question text is non-empty');
  assert(Boolean(adaptiveSession.questions[0].correctAnswer), 'Correct answer provided');
  assert(adaptiveSession.questions[0].hints.length > 0, 'Step-by-step hints attached');

  // TEST 6: Teacher Persona Bridge
  console.log('\n--- TEST 6: Teacher Persona Bridge & Shared Memory ---');
  const { getContextualTeacherGreeting } = require('../lib/learning-brain/teacherPersonaBridge');

  const greeting = getContextualTeacherGreeting('sharma_sir', profileAfterMistake, 'hi');
  assert(Boolean(greeting.greeting), 'Teacher greeting generated');
  console.log('Teacher greeting with memory:\n ', greeting.greeting);

  console.log('\n======================================================');
  console.log('🎉 ALL 6 TEST SUITES PASSED FLAWLESSLY!');
  console.log('======================================================\n');
}

runTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
