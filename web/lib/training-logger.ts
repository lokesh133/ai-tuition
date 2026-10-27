import fs from 'fs';
import path from 'path';

export interface TrainingSample {
  systemInstruction: {
    parts: Array<{ text: string }>;
  };
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
}

/**
 * Continuously logs high-value question & explanation pairs into Gemini Fine-Tuning JSONL format.
 * Format adheres strictly to Google AI Studio & Vertex AI Tuning specifications.
 */
export async function recordTuitionTrainingInteraction(params: {
  teacherName: string;
  teacherSubject?: string;
  studentQuestion: string;
  teacherAnswer: string;
  classGrade?: string;
  board?: string;
}) {
  const { teacherName, teacherSubject = 'General', studentQuestion, teacherAnswer } = params;

  if (!studentQuestion || !teacherAnswer || studentQuestion.trim().length < 3 || teacherAnswer.trim().length < 5) {
    return;
  }

  // Sanitize text
  const cleanQ = studentQuestion.trim().replace(/\s+/g, ' ');
  const cleanA = teacherAnswer.trim();

  const systemPrompt = `You are 'AI Tuition Guru', an affectionate, encouraging Indian home tutor teaching Class 1-8 students (CBSE/RBSE). For Math questions, you act as 'Sharma Sir' (breaking down additions/subtractions step-by-step with carry/borrowing and friendly Hindi tips). For English and Spellings, you act as 'Riya Didi' (explaining word meanings with fun phonics and sentence usage). For EVS and Science, you act as 'Neha Mam' (giving real-life everyday village/town examples like watermelons, trees, and domestic animals). For Hindi, you act as 'Pooja Mam'. Always reply in friendly Hinglish, keep language super clear, positive, and motivating.`;

  const newEntry: TrainingSample = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: cleanQ }],
      },
      {
        role: 'model',
        parts: [{ text: cleanA }],
      },
    ],
  };

  const line = JSON.stringify(newEntry) + '\n';

  // Target paths: root monorepo gemini_tuition_tuning.jsonl & web local copy
  const potentialPaths = [
    path.resolve(process.cwd(), '..', 'gemini_tuition_tuning.jsonl'),
    path.resolve(process.cwd(), 'gemini_tuition_tuning.jsonl'),
    path.resolve(process.cwd(), 'data', 'gemini_tuition_tuning.jsonl'),
  ];

  for (const filePath of potentialPaths) {
    try {
      const dir = path.dirname(filePath);
      if (fs.existsSync(dir)) {
        fs.appendFileSync(filePath, line, 'utf8');
      }
    } catch (err) {
      // Non-blocking background log
      console.warn(`[Training Logger] Notice appending to ${filePath}:`, err);
    }
  }
}
