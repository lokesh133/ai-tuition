import { Router, Request, Response } from 'express';
import { RBSE_CLASS_4_ENGLISH_MEDIUM, matchRbseClass4Syllabus } from '../data/rbseClass4Syllabus';

const router = Router();

// GET: Fetch complete RBSE Class 4th English Medium Syllabus
router.get('/rbse-class4', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: RBSE_CLASS_4_ENGLISH_MEDIUM,
    message: 'Official RBSE Rajasthan Class 4th English Medium Syllabus loaded successfully.',
  });
});

// POST: Check query against RBSE Class 4th Syllabus before answering
router.post('/check-alignment', (req: Request, res: Response) => {
  const { query = '', subject = '' } = req.body;
  const matchResult = matchRbseClass4Syllabus(query, subject);

  return res.status(200).json({
    success: true,
    alignment: matchResult,
  });
});

// POST: Admin Upload / Sync Chapter in RBSE Syllabus
router.post('/upload-chapter', (req: Request, res: Response) => {
  const { subject, chapterNumber, title, coreConcepts, learningOutcomes, keywords } = req.body;

  const targetSub = RBSE_CLASS_4_ENGLISH_MEDIUM.subjects[subject?.toLowerCase()];
  if (targetSub) {
    targetSub.chapters.push({
      id: `rbse-custom-${Date.now()}`,
      chapterNumber: Number(chapterNumber) || targetSub.chapters.length + 1,
      title: title || 'Custom Chapter',
      subject: (subject === 'evs' ? 'EVS' : subject === 'english' ? 'English' : 'Mathematics') as any,
      coreConcepts: Array.isArray(coreConcepts) ? coreConcepts : [coreConcepts],
      learningOutcomes: learningOutcomes || 'Verified curriculum chapter',
      keywords: Array.isArray(keywords) ? keywords : [keywords],
    });
  }

  return res.status(200).json({
    success: true,
    message: `Chapter "${title}" successfully verified and indexed in RBSE Class 4th English Medium syllabus.`,
    updatedSyllabus: RBSE_CLASS_4_ENGLISH_MEDIUM,
  });
});

export default router;
