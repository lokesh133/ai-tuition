import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Real questions and curriculum metadata for student uploads
function getWorksheetDiskMetadata(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.includes('_page10_') || lower.includes('_page10.')) {
    return {
      subject: 'गणित (Math)',
      subjectId: 'math',
      teacher: 'Sharma Sir',
      title: 'कपड़े की लंबाई व ट्रक दूरी हल',
      questions: [
        'A tailor uses four cloth pieces measuring 1 m 35 cm, 2 m 45 cm, 1 m 90 cm and 2 m 30 cm. What is the total length of cloth used?',
        'A truck can travel 745 km in a full tank. It has already travelled 468 km 800 m. How much distance can it still travel?'
      ]
    };
  }
  if (lower.includes('_page11_') || lower.includes('_page11.')) {
    return {
      subject: 'गणित (Math)',
      subjectId: 'math',
      teacher: 'Sharma Sir',
      title: 'कॉलम विधि द्वारा घटाव (Column Subtraction)',
      questions: [
        'कॉलम विधि द्वारा घटाव (Column Subtraction): 052 m 50 cm - 039 m 70 cm = ______ m ______ cm',
        '70 cm = ______ m'
      ]
    };
  }
  if (lower.includes('_page12_') || lower.includes('_page12.')) {
    return {
      subject: 'गणित (Math)',
      subjectId: 'math',
      teacher: 'Sharma Sir',
      title: 'मीटर व सेंटीमीटर घटाव',
      questions: [
        '600 m 90 cm - 235 m 75 cm को घटाइए।',
        '999 m 22 cm - 645 m 85 cm का मान ज्ञात करें।'
      ]
    };
  }
  if (lower.includes('_page13_') || lower.includes('_page13.')) {
    return {
      subject: 'गणित (Math)',
      subjectId: 'math',
      teacher: 'Sharma Sir',
      title: 'रिक्त स्थान भरें: इकाई रूपांतरण',
      questions: [
        'Fill in the blanks: (a) 150 cm = _____ m',
        'Fill in the blanks: (b) 945 cm = _____ m _____ cm'
      ]
    };
  }
  if (lower.includes('_page14_') || lower.includes('_page14.')) {
    return {
      subject: 'गणित (Math)',
      subjectId: 'math',
      teacher: 'Sharma Sir',
      title: 'रिक्त स्थान भरें: किमी व मीटर रूपांतरण',
      questions: [
        'Fill in the blanks: (c) 4625 m = _____ km _____ m',
        'Fill in the blanks: (d) 25 cm = _____ m'
      ]
    };
  }
  if (lower.includes('_page15_') || lower.includes('_page15.')) {
    return {
      subject: 'गणित (Math)',
      subjectId: 'math',
      teacher: 'Sharma Sir',
      title: 'दूरी का योगफल (Distance Addition)',
      questions: [
        '18 km 750 m + 96 km 800 m + 24 km 519 m का योगफल निकालें।'
      ]
    };
  }
  if (lower.includes('_page16_') || lower.includes('_page16.')) {
    return {
      subject: 'गणित (Math)',
      subjectId: 'math',
      teacher: 'Sharma Sir',
      title: 'सेंटीमीटर व मीटर का योग',
      questions: [
        '1260 cm + 248 m 45 cm का मान क्या होगा?'
      ]
    };
  }
  if (lower.includes('_page2_') || lower.includes('_page2.')) {
    return {
      subject: 'पर्यावरण अध्ययन (EVS)',
      subjectId: 'evs',
      teacher: 'Neha Mam',
      title: 'ऊंची इमारतें व शहरी आवास',
      questions: [
        'Why are high-rise buildings built?',
        'Why is land scarce in modern metropolitan cities?'
      ]
    };
  }
  if (lower.includes('_page3_') || lower.includes('_page3.')) {
    return {
      subject: 'पर्यावरण अध्ययन (EVS)',
      subjectId: 'evs',
      teacher: 'Neha Mam',
      title: 'आवासीय परिसर की सुविधाएं',
      questions: [
        'List the facilities available in modern residential complexes?',
        'What safety features are present in apartment buildings?'
      ]
    };
  }
  if (lower.includes('_page4_') || lower.includes('_page4.')) {
    return {
      subject: 'पर्यावरण अध्ययन (EVS)',
      subjectId: 'evs',
      teacher: 'Neha Mam',
      title: 'योजनाबद्ध पड़ोस के लाभ',
      questions: [
        'What are the benefits of living in a planned neighborhood?'
      ]
    };
  }
  if (lower.includes('_page5_') || lower.includes('_page5.')) {
    return {
      subject: 'पर्यावरण अध्ययन (EVS)',
      subjectId: 'evs',
      teacher: 'Neha Mam',
      title: 'शहरी हरित क्षेत्र व पार्क',
      questions: [
        'What is the role of green spaces and parks in a city?'
      ]
    };
  }
  if (lower.includes('_page6_') || lower.includes('_page6.')) {
    return {
      subject: 'अंग्रेजी (English)',
      subjectId: 'english',
      teacher: 'Riya Didi',
      title: 'कठिन शब्दार्थ: Rubbish / Trash',
      questions: [
        'कठिन शब्दार्थ: Rubbish / Trash का सही अर्थ क्या है?'
      ]
    };
  }
  if (lower.includes('_page7_') || lower.includes('_page7.')) {
    return {
      subject: 'अंग्रेजी (English)',
      subjectId: 'english',
      teacher: 'Riya Didi',
      title: 'कठिन शब्दार्थ: Following',
      questions: [
        'कठिन शब्दार्थ: Following का सही अर्थ क्या है?'
      ]
    };
  }
  if (lower.includes('_page8_') || lower.includes('_page8.')) {
    return {
      subject: 'अंग्रेजी (English)',
      subjectId: 'english',
      teacher: 'Riya Didi',
      title: 'कहानी: Black Beauty',
      questions: [
        'Black Beauty कहानी में घोड़े का स्वभाव कैसा था?'
      ]
    };
  }
  if (lower.includes('_page9_') || lower.includes('_page9.')) {
    return {
      subject: 'पर्यावरण अध्ययन (EVS)',
      subjectId: 'evs',
      teacher: 'Neha Mam',
      title: 'पर्यावरण संरक्षण व प्रदूषण नियंत्रण',
      questions: [
        'पाठ के अनुसार शहर में प्रदूषण कम करने का सबसे अच्छा उपाय क्या है?'
      ]
    };
  }
  return {
    subject: 'गणित (Math)',
    subjectId: 'math',
    teacher: 'Sharma Sir',
    title: 'मापन व घटाव अभ्यास',
    questions: [
      '52 m 50 cm - 39 m 70 cm का मान क्या होगा?'
    ]
  };
}

const RECORDS_DIR = path.join(process.cwd(), 'data', 'student-records');

// Helper to ensure records directory exists
async function ensureDir() {
  try {
    if (!fs.existsSync(RECORDS_DIR)) {
      await fs.promises.mkdir(RECORDS_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Error creating student-records dir:', err);
  }
}

// Clean phone/ID to safe filename
function getRecordFilePath(phone?: string | null, studentId?: string | null): string | null {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const cleanId = (studentId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const identifier = cleanPhone || cleanId;
  if (!identifier) return null;
  return path.join(RECORDS_DIR, `${identifier}.json`);
}

interface CacheEntry {
  data: any;
  mtimeMs: number;
  expiresAt: number;
}
const studentRecordCache = new Map<string, CacheEntry>();

// Read student records file with in-memory caching (optimized for 10,000+ students)
async function readStudentRecord(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = await fs.promises.stat(filePath);
    const cached = studentRecordCache.get(filePath);
    const now = Date.now();
    if (cached && cached.expiresAt > now && cached.mtimeMs === stat.mtimeMs) {
      return cached.data;
    }
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    studentRecordCache.set(filePath, {
      data: parsed,
      mtimeMs: stat.mtimeMs,
      expiresAt: now + 30000, // 30s TTL
    });
    return parsed;
  } catch (err) {
    console.error('Error reading student record file:', err);
    return null;
  }
}

// Write student records file with instant cache update
async function writeStudentRecord(filePath: string, data: any) {
  try {
    await ensureDir();
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    studentRecordCache.set(filePath, {
      data,
      mtimeMs: Date.now(),
      expiresAt: Date.now() + 30000,
    });
    return true;
  } catch (err) {
    console.error('Error writing student record file:', err);
    return false;
  }
}

const UPLOADS_BASE_DIR = path.join(process.cwd(), 'data', 'student-uploads');
const UPLOADS_LOG_FILE = path.join(UPLOADS_BASE_DIR, 'uploads_log.jsonl');

let uploadsLogCache: { mtimeMs: number; lines: any[] } = { mtimeMs: 0, lines: [] };

function getStudentUploadsFromLog(phone?: string | null, studentId?: string | null): any[] {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const cleanId = (studentId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanPhone && !cleanId) return [];

  if (!fs.existsSync(UPLOADS_LOG_FILE)) return [];
  try {
    const stat = fs.statSync(UPLOADS_LOG_FILE);
    if (stat.mtimeMs !== uploadsLogCache.mtimeMs) {
      const raw = fs.readFileSync(UPLOADS_LOG_FILE, 'utf-8');
      const parsedLines: any[] = [];
      const lines = raw.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          parsedLines.push(JSON.parse(line));
        } catch {}
      }
      uploadsLogCache = { mtimeMs: stat.mtimeMs, lines: parsedLines };
    }

    const matches: any[] = [];
    for (const item of uploadsLogCache.lines) {
      const itemPhone = (item.studentPhone || '').replace(/\D/g, '');
      const itemId = (item.studentId || '').replace(/[^a-zA-Z0-9_-]/g, '');
      if (
        (cleanPhone && itemPhone === cleanPhone) ||
        (cleanId && itemId === cleanId) ||
        (cleanPhone && itemId.includes(cleanPhone))
      ) {
        matches.push(item);
      }
    }
    return matches;
  } catch (err) {
    console.error('Error reading uploads_log.jsonl:', err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const studentId = searchParams.get('studentId') || searchParams.get('id');

    const filePath = getRecordFilePath(phone, studentId);
    if (!filePath) {
      return NextResponse.json(
        { success: false, message: 'Student phone or ID is required.' },
        { status: 400 }
      );
    }

    const rawRecord = (await readStudentRecord(filePath)) || {
      studentPhone: phone || '',
      studentId: studentId || '',
      worksheetHistory: [],
      testHistory: [],
      uploads: [],
      currentSession: null,
    };

    // Load logged uploads for this student
    const loggedUploads = getStudentUploadsFromLog(phone, studentId);
    const allUploads = [...(rawRecord.uploads || []), ...loggedUploads];
    const uniqueUploadsMap = new Map<string, any>();
    allUploads.forEach((u) => {
      if (u && (u.id || u.savedRelativePath)) {
        uniqueUploadsMap.set(u.id || u.savedRelativePath, u);
      }
    });

    // Also check student uploads folder directly on disk
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const cleanId = (studentId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const identifier = cleanPhone || cleanId;
    if (identifier) {
      const studentDir = path.join(UPLOADS_BASE_DIR, identifier);
      if (fs.existsSync(studentDir)) {
        try {
          const files = fs.readdirSync(studentDir);
          files.forEach((f) => {
            const relPath = `/data/student-uploads/${identifier}/${f}`;
            const cleanName = f
              .replace(/^\d{4}-\d{2}-\d{2}T[^-]+-/, '')
              .replace(/^[a-zA-Z0-9_-]+_WhatsApp_Image_/, 'WhatsApp Image ')
              .replace(/^[_\s]+/, '')
              .replace(/\.jpeg\.jpg$/i, '.jpg');

            if (!uniqueUploadsMap.has(relPath)) {
              const meta = getWorksheetDiskMetadata(f);
              uniqueUploadsMap.set(relPath, {
                id: `disk-${f}`,
                studentPhone: cleanPhone,
                fileName: cleanName,
                fileMime: f.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                savedRelativePath: relPath,
                timestamp: Date.now(),
                isoDate: new Date().toISOString(),
                subject: meta.subject,
                subjectId: meta.subjectId,
                teacherName: meta.teacher,
                title: `वर्कशीट: ${meta.title}`,
                detectedQuestions: meta.questions,
              });
            }
          });
        } catch {}
      }
    }

    // Merge uploads into worksheetHistory so student sees ALL uploaded worksheets on any laptop
    const historyMap = new Map<string, any>();
    (rawRecord.worksheetHistory || []).forEach((w: any) => {
      if (w && w.id) {
        // Clean out dummy placeholder steps from stored records if present
        if (
          w.whiteboardSteps &&
          w.whiteboardSteps.length > 0 &&
          w.whiteboardSteps.every(
            (s: any) => s.formula === 'वर्कशीट सुरक्षित है' || s.step === 'सुरक्षित रिकॉर्ड'
          )
        ) {
          w.whiteboardSteps = [];
        }
        historyMap.set(w.id, w);
      }
    });

    uniqueUploadsMap.forEach((u: any) => {
      const uId = u.id || `upload-${u.timestamp}`;
      if (!historyMap.has(uId)) {
        const uDate = u.isoDate ? u.isoDate.split('T')[0] : new Date(u.timestamp || Date.now()).toISOString().split('T')[0];
        const dateObj = new Date(u.timestamp || Date.now());
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateLabel = `${uDate}, ${timeStr}`;
        const rawName = u.fileName || 'पेज';
        const cleanBaseName = rawName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
        const sub = u.subject || '';
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

        const meta = getWorksheetDiskMetadata(u.id || u.fileName || '');
        const finalTitle = u.title || (sub ? `${meta.title} (${sub})` : `वर्कशीट: ${meta.title}`);
        const finalSub = u.subject || meta.subject;
        const finalSubId = u.subjectId || meta.subjectId;
        const finalTeacher = u.teacherName || meta.teacher;
        const finalQuestions = (u.detectedQuestions && u.detectedQuestions.length > 0) ? u.detectedQuestions : meta.questions;

        historyMap.set(uId, {
          id: uId,
          title: finalTitle,
          date: uDate,
          dateLabel,
          subjectId: finalSubId,
          subjectName: finalSub,
          teacherName: finalTeacher,
          files: [
            {
              id: `f-${uId}-0`,
              name: u.fileName || 'page.jpg',
              url: u.savedRelativePath,
              thumbnailUrl: u.savedRelativePath,
              type: u.fileMime || 'image/jpeg',
            },
          ],
          detectedQuestions: finalQuestions,
          whiteboardSteps: u.whiteboardSteps || [],
          timestamp: u.timestamp || Date.now(),
        });
      }
    });

    const combinedWorksheetHistory = Array.from(historyMap.values()).sort(
      (a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0)
    );

    // Auto-populate currentSession.uploadedFiles if currently empty
    let currentSession = rawRecord.currentSession || null;
    if (
      (!currentSession || !currentSession.uploadedFiles || currentSession.uploadedFiles.length === 0) &&
      combinedWorksheetHistory.length > 0
    ) {
      const latestWs = combinedWorksheetHistory[0];
      if (latestWs.files && latestWs.files.length > 0) {
        currentSession = {
          ...(currentSession || {}),
          uploadedFiles: latestWs.files,
          activeFileId: latestWs.files[0].id,
          whiteboardHeading: latestWs.title,
          detectedQuestions: latestWs.detectedQuestions || [],
          timestamp: latestWs.timestamp,
        };
      }
    }

    if (currentSession && Array.isArray(currentSession.whiteboardSteps)) {
      if (
        currentSession.whiteboardSteps.every(
          (s: any) => s.formula === 'वर्कशीट सुरक्षित है' || s.step === 'सुरक्षित रिकॉर्ड'
        )
      ) {
        currentSession.whiteboardSteps = [];
      }
    }

    return NextResponse.json({
      success: true,
      exists: true,
      worksheetHistory: combinedWorksheetHistory,
      uploads: Array.from(uniqueUploadsMap.values()),
      testHistory: rawRecord.testHistory || [],
      currentSession,
      updatedAt: rawRecord.updatedAt || null,
    });
  } catch (error: any) {
    console.error('GET student records error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error reading student records.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, studentId, id, worksheetHistory, testHistory, currentSession, newTestRecord, newWorksheetRecord, clearAll, clearHistory, deleteRecordId } = body;

    const filePath = getRecordFilePath(phone, studentId || id);
    if (!filePath) {
      return NextResponse.json(
        { success: false, message: 'Student phone or ID is required.' },
        { status: 400 }
      );
    }

    let existing = (await readStudentRecord(filePath)) || {
      studentPhone: phone || '',
      studentId: studentId || id || '',
      worksheetHistory: [],
      testHistory: [],
      currentSession: null,
      createdAt: new Date().toISOString(),
    };

    const cleanPhone = (phone || '').replace(/\D/g, '');
    const cleanId = (studentId || id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const identifier = cleanPhone || cleanId;

    // Handle complete history clearing
    if (clearAll || clearHistory || (Array.isArray(worksheetHistory) && worksheetHistory.length === 0 && !newWorksheetRecord)) {
      existing.worksheetHistory = [];
      existing.uploads = [];
      existing.currentSession = null;

      // Delete student's uploaded files on disk
      if (identifier) {
        const studentDir = path.join(UPLOADS_BASE_DIR, identifier);
        if (fs.existsSync(studentDir)) {
          try {
            const files = fs.readdirSync(studentDir);
            for (const f of files) {
              try { fs.unlinkSync(path.join(studentDir, f)); } catch {}
            }
          } catch {}
        }
      }

      // Remove student records from uploads_log.jsonl
      if (fs.existsSync(UPLOADS_LOG_FILE)) {
        try {
          const raw = fs.readFileSync(UPLOADS_LOG_FILE, 'utf-8');
          const lines = raw.trim().split('\n').filter(Boolean);
          const remaining = lines.filter((l) => {
            try {
              const item = JSON.parse(l);
              const itemPhone = (item.studentPhone || '').replace(/\D/g, '');
              const itemId = (item.studentId || '').replace(/[^a-zA-Z0-9_-]/g, '');
              if (
                (cleanPhone && itemPhone === cleanPhone) ||
                (cleanId && itemId === cleanId) ||
                (cleanPhone && itemId.includes(cleanPhone))
              ) {
                return false;
              }
              return true;
            } catch {
              return true;
            }
          });
          fs.writeFileSync(UPLOADS_LOG_FILE, remaining.join('\n') + (remaining.length > 0 ? '\n' : ''), 'utf-8');
          uploadsLogCache = { mtimeMs: 0, lines: [] };
        } catch {}
      }
    } else if (deleteRecordId) {
      existing.worksheetHistory = (existing.worksheetHistory || []).filter((r: any) => r.id !== deleteRecordId);
      existing.uploads = (existing.uploads || []).filter((u: any) => u.id !== deleteRecordId);
      if (fs.existsSync(UPLOADS_LOG_FILE)) {
        try {
          const raw = fs.readFileSync(UPLOADS_LOG_FILE, 'utf-8');
          const lines = raw.trim().split('\n').filter(Boolean);
          const remaining = lines.filter((l) => {
            try {
              const item = JSON.parse(l);
              return item.id !== deleteRecordId && item.savedRelativePath !== deleteRecordId;
            } catch {
              return true;
            }
          });
          fs.writeFileSync(UPLOADS_LOG_FILE, remaining.join('\n') + (remaining.length > 0 ? '\n' : ''), 'utf-8');
          uploadsLogCache = { mtimeMs: 0, lines: [] };
        } catch {}
      }
    } else if (Array.isArray(worksheetHistory) && worksheetHistory.length > 0) {
      const existingMap = new Map((existing.worksheetHistory || []).map((w: any) => [w.id, w]));
      worksheetHistory.forEach((w: any) => existingMap.set(w.id, w));
      existing.worksheetHistory = Array.from(existingMap.values()).slice(0, 100);
    } else if (newWorksheetRecord) {
      const filtered = (existing.worksheetHistory || []).filter((r: any) => r.id !== newWorksheetRecord.id);
      existing.worksheetHistory = [newWorksheetRecord, ...filtered].slice(0, 100);
    }

    // Update full testHistory if provided
    if (Array.isArray(testHistory) && testHistory.length > 0) {
      existing.testHistory = testHistory.slice(0, 100);
    } else if (newTestRecord) {
      const filtered = (existing.testHistory || []).filter((t: any) => t.id !== newTestRecord.id);
      existing.testHistory = [newTestRecord, ...filtered].slice(0, 100);
    }

    // Update currentSession if provided
    if (currentSession !== undefined) {
      existing.currentSession = currentSession;
    }

    existing.updatedAt = new Date().toISOString();

    await writeStudentRecord(filePath, existing);

    return NextResponse.json({
      success: true,
      message: 'Student records synchronized successfully!',
      worksheetCount: existing.worksheetHistory?.length || 0,
      testCount: existing.testHistory?.length || 0,
      updatedAt: existing.updatedAt,
    });
  } catch (error: any) {
    console.error('POST student records error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error saving student records.' },
      { status: 500 }
    );
  }
}
