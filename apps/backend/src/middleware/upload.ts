import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';

// In-Memory Storage for fast processing and sending to Gemini Vision API without disk I/O
const storage = multer.memoryStorage();

export const uploadHomework = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes maximum
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP images and PDF documents are supported!'));
    }
  },
});

