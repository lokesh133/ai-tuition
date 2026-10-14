import multer from 'multer';

// In-Memory Storage for fast processing and sending to Gemini Vision API without disk I/O
const storage = multer.memoryStorage();

export const uploadHomework = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes maximum
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP image files are supported for homework scans!'));
    }
  },
});
