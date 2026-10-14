import { Request, Response } from 'express';

export const getParentAnalyticsHandler = async (req: Request, res: Response) => {
  const { childId } = req.params;

  // Mocked localized production payload for Class 5 student
  const analyticsData = {
    child_id: childId || 'aarav-sharma-5b',
    student_name: 'Aarav Sharma',
    class_standard: 'Class 5th B',
    streak_days: 7,
    weekly_study_time_minutes: 265, // ~4h 25m
    daily_screen_time_limit: 45,
    total_doubts_asked_this_week: 42,
    accuracy_percentage: 86,
    active_subscription: {
      plan_name: 'All-in-One Tuition Pass',
      price_inr: 200,
      currency: 'INR',
      status: 'ACTIVE',
      next_renewal_date: '2026-11-10T00:00:00.000Z',
    },
    subject_competency: [
      { subject: 'Mathematics', accuracy: 92, teacher: 'Sharma Sir', doubts_count: 18, status: 'Strongest' },
      { subject: 'Science', accuracy: 88, teacher: 'Neha Mam', doubts_count: 12, status: 'Very Good' },
      { subject: 'English', accuracy: 76, teacher: 'Riya Didi', doubts_count: 7, status: 'Improving' },
      { subject: 'Social Studies', accuracy: 64, teacher: 'Kabir Sir', doubts_count: 5, status: 'Needs Focus' },
    ],
    recent_homework_scans: [
      {
        id: 'scan-01',
        timestamp: new Date().toISOString(),
        subject: 'Math',
        question: 'Fractions simplification',
        feedback: 'Step 1 is correct. Corrected missing negative sign in Step 2.',
        teacher: 'Sharma Sir',
        status: 'Corrected',
      },
      {
        id: 'scan-02',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        subject: 'Science',
        question: 'Photosynthesis chemical equation',
        feedback: 'All stages explained correctly. Neha Mam awarded 20 Star Points.',
        teacher: 'Neha Mam',
        status: '100% Correct',
      },
    ],
  };

  return res.status(200).json({
    success: true,
    data: analyticsData,
  });
};
