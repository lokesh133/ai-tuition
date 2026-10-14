import { Router } from 'express';
import { askTeacherHandler, voiceStreamHandler } from '../controllers/tutorController';
import { createVideoAvatarSession } from '../controllers/videoAvatarController';
import { uploadHomework } from '../middleware/upload';

const router = Router();

// Multimodal Q&A route: Accepts question text + optional scanned notebook image file
router.post('/ask', uploadHomework.single('homework_image'), askTeacherHandler);

// Live voice audio transcript stream route
router.post('/voice-stream', voiceStreamHandler);

// Video Online Teacher Avatar session route
router.post('/video-avatar/session', createVideoAvatarSession);

export default router;
