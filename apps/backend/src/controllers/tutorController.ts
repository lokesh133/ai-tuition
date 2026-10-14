import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService';

export const askTeacherHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teacher_id = 'sharma_sir', question = '' } = req.body;
    const homeworkFile = req.file;

    if (!question && !homeworkFile) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a question text or a homework image to scan.',
      });
    }

    const aiResult = await aiService.askTeacher(
      teacher_id,
      question,
      homeworkFile?.buffer,
      homeworkFile?.mimetype
    );

    return res.status(200).json({
      success: true,
      teacher_id,
      reply: aiResult.reply,
      whiteboard_steps: aiResult.whiteboardSteps,
      audio_url: `/api/tutor/tts-stream?teacher=${teacher_id}&text=${encodeURIComponent(aiResult.reply.slice(0, 100))}`,
      cached: aiResult.cached,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const voiceStreamHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teacher_id = 'sharma_sir', audio_transcript } = req.body;

    const aiResult = await aiService.askTeacher(
      teacher_id,
      audio_transcript || 'Namaste Sir, please guide me with today\'s topic.'
    );

    return res.status(200).json({
      success: true,
      teacher_id,
      transcript_recognized: audio_transcript,
      reply: aiResult.reply,
      whiteboard_steps: aiResult.whiteboardSteps,
      cached: aiResult.cached,
    });
  } catch (error) {
    next(error);
  }
};
