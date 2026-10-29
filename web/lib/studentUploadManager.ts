import fs from 'fs';
import path from 'path';
import { getStudentProfile, saveStudentProfile } from './learning-brain/profileManager';

const UPLOADS_BASE_DIR = path.join(process.cwd(), 'data', 'student-uploads');
const DATASET_FILE = path.join(process.cwd(), 'data', 'gemini_tuition_tuning.jsonl');
const UPLOADS_LOG_FILE = path.join(UPLOADS_BASE_DIR, 'uploads_log.jsonl');
const RECORDS_DIR = path.join(process.cwd(), 'data', 'student-records');

async function ensureDir(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  } catch (err) {
    console.error('Error ensuring dir:', dirPath, err);
  }
}

export interface StudentUploadRecord {
  id: string;
  studentId: string;
  studentPhone: string;
  studentName: string;
  timestamp: number;
  isoDate: string;
  fileName: string;
  fileMime: string;
  savedRelativePath: string;
  fileSizeKb: number;
  classGrade?: string;
  board?: string;
  subject?: string;
  mode?: string;
  detectedQuestions?: string[];
  teacherReplySummary?: string;
}

/**
 * Saves uploaded student homework / worksheet files to disk and logs metadata for personalization & training.
 */
export async function saveStudentUpload(params: {
  studentId?: string;
  studentPhone?: string;
  studentName?: string;
  fileName?: string;
  fileMime?: string;
  fileBufferBase64?: string | null;
  additionalImages?: Array<{ mime: string; base64: string }>;
  classGrade?: string;
  board?: string;
  subject?: string;
  mode?: string;
  detectedQuestions?: string[];
  teacherReplySummary?: string;
}): Promise<StudentUploadRecord | null> {
  const {
    studentId = 'guest',
    studentPhone = '',
    studentName = 'Student',
    fileName = 'homework_page.jpg',
    fileMime = 'image/jpeg',
    fileBufferBase64,
    additionalImages = [],
    classGrade = '',
    board = '',
    subject = '',
    mode = 'worksheet',
    detectedQuestions = [],
    teacherReplySummary = '',
  } = params;

  if (!fileBufferBase64 && additionalImages.length === 0) {
    return null;
  }

  try {
    // 1. Sanitize student folder name
    const cleanPhone = (studentPhone || '').replace(/\D/g, '');
    const cleanId = (studentId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const folderKey = cleanPhone || cleanId || 'general';

    const targetStudentDir = path.join(UPLOADS_BASE_DIR, folderKey);
    await ensureDir(targetStudentDir);

    const now = Date.now();
    const timestampStr = new Date(now).toISOString().replace(/[:.]/g, '-');
    const safeBaseName = (fileName || 'page').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const extension = fileMime.includes('pdf')
      ? '.pdf'
      : fileMime.includes('png')
      ? '.png'
      : fileMime.includes('webp')
      ? '.webp'
      : '.jpg';

    const finalFileName = `${timestampStr}_${safeBaseName.endsWith(extension) ? safeBaseName : safeBaseName + extension}`;
    const destinationPath = path.join(targetStudentDir, finalFileName);

    let fileSizeKb = 0;
    if (fileBufferBase64) {
      const buffer = Buffer.from(fileBufferBase64, 'base64');
      await fs.promises.writeFile(destinationPath, buffer);
      fileSizeKb = Math.round(buffer.length / 1024);
    }

    // Save any additional pages
    if (additionalImages && additionalImages.length > 0) {
      for (let i = 0; i < additionalImages.length; i++) {
        const item = additionalImages[i];
        if (!item?.base64) continue;
        const extraExt = item.mime.includes('pdf') ? '.pdf' : item.mime.includes('png') ? '.png' : '.jpg';
        const extraName = `${timestampStr}_page${i + 2}_${safeBaseName}${extraExt}`;
        const extraPath = path.join(targetStudentDir, extraName);
        const extraBuf = Buffer.from(item.base64, 'base64');
        await fs.promises.writeFile(extraPath, extraBuf);
      }
    }

    const savedRelativePath = `/data/student-uploads/${folderKey}/${finalFileName}`;

    const record: StudentUploadRecord = {
      id: `upload-${now}-${Math.random().toString(36).substring(2, 7)}`,
      studentId: cleanId || folderKey,
      studentPhone: cleanPhone || '',
      studentName,
      timestamp: now,
      isoDate: new Date(now).toISOString(),
      fileName: fileName || finalFileName,
      fileMime,
      savedRelativePath,
      fileSizeKb,
      classGrade,
      board,
      subject,
      mode,
      detectedQuestions: detectedQuestions.slice(0, 20),
      teacherReplySummary: teacherReplySummary ? teacherReplySummary.slice(0, 300) : '',
    };

    // 2. Append to master uploads log
    await ensureDir(UPLOADS_BASE_DIR);
    await fs.promises.appendFile(UPLOADS_LOG_FILE, JSON.stringify(record) + '\n', 'utf-8');

    // 3. Update student records file
    const studentRecordPath = path.join(RECORDS_DIR, `${folderKey}.json`);
    await ensureDir(RECORDS_DIR);

    let existingRecord: any = { worksheetHistory: [], testHistory: [], uploads: [] };
    if (fs.existsSync(studentRecordPath)) {
      try {
        const raw = await fs.promises.readFile(studentRecordPath, 'utf-8');
        existingRecord = JSON.parse(raw);
        if (!Array.isArray(existingRecord.uploads)) existingRecord.uploads = [];
      } catch (err) {
        console.error('Error reading student record:', err);
      }
    }

    existingRecord.uploads = [record, ...(existingRecord.uploads || [])].slice(0, 100);

    const sub = subject || '';
    const subLower = sub.toLowerCase();
    const subjectId = subLower.includes('eng')
      ? 'english'
      : subLower.includes('hindi')
      ? 'hindi'
      : subLower.includes('evs') || subLower.includes('sc')
      ? 'evs'
      : subLower.includes('math') || subLower.includes('गणित')
      ? 'math'
      : '';
    const teacherName =
      subjectId === 'english'
        ? 'Riya Didi'
        : subjectId === 'hindi'
        ? 'Pooja Mam'
        : subjectId === 'evs'
        ? 'Neha Mam'
        : subjectId === 'math'
        ? 'Sharma Sir'
        : 'AI शिक्षक';

    // Also sync directly to worksheetHistory so it immediately appears in all student devices/laptops
    const wsRecord = {
      id: record.id,
      title: sub ? `${fileName} (${sub})` : `वर्कशीट: ${fileName}`,
      date: new Date(now).toISOString().split('T')[0],
      dateLabel: `आज, ${new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      subjectId,
      subjectName: sub || 'वर्कशीट',
      teacherName,
      files: [
        {
          id: `file-${now}-0`,
          name: fileName,
          url: savedRelativePath,
          thumbnailUrl: savedRelativePath,
          type: fileMime,
        },
      ],
      detectedQuestions: detectedQuestions || [],
      whiteboardSteps: [],
      timestamp: now,
    };

    if (!Array.isArray(existingRecord.worksheetHistory)) existingRecord.worksheetHistory = [];
    const filteredWs = existingRecord.worksheetHistory.filter((w: any) => w.id !== wsRecord.id && w.title !== wsRecord.title);
    existingRecord.worksheetHistory = [wsRecord, ...filteredWs].slice(0, 100);

    existingRecord.updatedAt = now;
    existingRecord.studentName = studentName || existingRecord.studentName;
    existingRecord.studentPhone = cleanPhone || existingRecord.studentPhone;
    existingRecord.classGrade = classGrade || existingRecord.classGrade;
    existingRecord.board = board || existingRecord.board;

    await fs.promises.writeFile(studentRecordPath, JSON.stringify(existingRecord, null, 2), 'utf-8');

    // 4. Update Student Personalization Learning Brain Profile
    try {
      const studentProfile = await getStudentProfile(folderKey);
      if (studentProfile) {
        studentProfile.studentName = studentName || studentProfile.studentName;
        studentProfile.classGrade = (classGrade as any) || studentProfile.classGrade;
        studentProfile.board = (board as any) || studentProfile.board;
        studentProfile.updatedAt = now;
        await saveStudentProfile(studentProfile);
      }
    } catch (profErr) {
      console.warn('Learning brain profile sync notice:', profErr);
    }

    console.log(`[Student Upload] Successfully saved ${finalFileName} (${fileSizeKb} KB) for student ${studentName} (${folderKey})`);
    return record;
  } catch (error) {
    console.error('Failed to save student upload:', error);
    return null;
  }
}
