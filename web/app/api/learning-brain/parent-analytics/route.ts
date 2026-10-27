import { NextRequest, NextResponse } from 'next/server';
import { getStudentProfile } from '@/lib/learning-brain/profileManager';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || searchParams.get('id') || searchParams.get('phone') || '9610328630';

    const profile = await getStudentProfile(studentId);

    // Compute verified metrics
    const conceptEntries = Object.values(profile.conceptMastery || {});
    const strongConcepts = conceptEntries.filter(
      (c) => c.masteryLevel === 'MASTERED' || c.masteryLevel === 'PROFICIENT'
    );
    const developingConcepts = conceptEntries.filter((c) => c.masteryLevel === 'DEVELOPING');
    const noviceConcepts = conceptEntries.filter((c) => c.masteryLevel === 'NOVICE');

    const activeWeak = profile.weakConcepts.filter((w) => w.status === 'ACTIVE');
    const resolvedWeak = profile.weakConcepts.filter((w) => w.status === 'RESOLVED');

    const totalAttempted = profile.stats.totalQuestionsAttempted || 0;
    const totalIndependent = profile.stats.totalIndependentSolved || 0;
    const independentAccuracy = totalAttempted > 0 ? Math.round((totalIndependent / totalAttempted) * 100) : 0;

    // Generate Weekly Parent Recommendations
    const weeklyRecommendations: string[] = [];
    if (activeWeak.length > 0) {
      weeklyRecommendations.push(
        `Sharma Sir / Teacher ke saath "${activeWeak[0].conceptTitle}" ke 3 practice sawaal solve karwayein.`
      );
    }
    if (profile.revisionSchedule.length > 0) {
      weeklyRecommendations.push(
        `Spaced Repetition: ${profile.revisionSchedule[0].conceptTitle} ki revision kal zaroor karwayein.`
      );
    }
    weeklyRecommendations.push('Agla Sunday Mock Test paper print karke ghar par offline practice karwayein.');

    // WhatsApp Message Text
    const studentName = profile.studentName || 'Bacha';
    const whatsAppMessage = `📊 *AI Tuition Weekly Progress Report - ${studentName}*\n\n` +
      `📅 Class: ${profile.classGrade} (${profile.board})\n` +
      `🔥 Study Streak: ${profile.stats.studyStreakDays} Days\n` +
      `⏱️ Total Study Time: ${profile.stats.weeklyTimeSpentMinutes} Mins\n` +
      `✅ Independent Accuracy: ${independentAccuracy}%\n\n` +
      `💪 *Strong Topics:* ${strongConcepts.map((c) => c.conceptTitle).slice(0, 3).join(', ') || 'Place Value & Basic Arithmetic'}\n` +
      `⚠️ *Topics Needing Revision:* ${activeWeak.map((w) => w.conceptTitle).slice(0, 2).join(', ') || 'Multiplication Carry-over'}\n\n` +
      `📌 *Teacher Advice:* ${weeklyRecommendations[0] || 'Keep regular practice'}\n\n` +
      `👉 View detailed live breakdown: https://aituition.com/reports`;

    return NextResponse.json({
      success: true,
      analytics: {
        studentId: profile.studentId,
        studentName: profile.studentName,
        classGrade: profile.classGrade,
        board: profile.board,
        totalAttempted,
        totalIndependent,
        independentAccuracy,
        strongConceptsCount: strongConcepts.length,
        strongConcepts: strongConcepts.map((c) => ({
          title: c.conceptTitle,
          score: c.score,
          level: c.masteryLevel,
        })),
        weakConceptsCount: activeWeak.length,
        activeWeakConcepts: activeWeak.map((w) => ({
          title: w.conceptTitle,
          misconception: w.misconception,
          mistakeType: w.mistakeType,
          occurrences: w.occurrences,
        })),
        resolvedMistakesCount: resolvedWeak.length,
        spacedRepetitionDueCount: profile.revisionSchedule.filter((r) => r.isOverdue).length,
        weeklyRecommendations,
        whatsAppMessage,
        screenTimeMinutes: profile.stats.weeklyTimeSpentMinutes,
        dailyScreenTimeLimitMinutes: 45,
      },
    });
  } catch (error: any) {
    console.error('GET /api/learning-brain/parent-analytics error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error generating parent analytics' },
      { status: 500 }
    );
  }
}
