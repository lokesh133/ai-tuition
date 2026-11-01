import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
              uniqueUploadsMap.set(relPath, {
                id: `disk-${f}`,
                studentPhone: cleanPhone,
                fileName: cleanName,
                fileMime: f.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                savedRelativePath: relPath,
                timestamp: Date.now(),
                isoDate: new Date().toISOString(),
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

        const displayTitle = sub ? `${cleanBaseName} (${sub})` : `वर्कशीट: ${cleanBaseName}`;

        historyMap.set(uId, {
          id: uId,
          title: displayTitle,
          date: uDate,
          dateLabel,
          subjectId,
          subjectName: sub || 'वर्कशीट',
          teacherName,
          files: [
            {
              id: `f-${u.timestamp || Date.now()}-0`,
              name: u.fileName || 'page.jpg',
              url: u.savedRelativePath,
              thumbnailUrl: u.savedRelativePath,
              type: u.fileMime || 'image/jpeg',
            },
          ],
          detectedQuestions: u.detectedQuestions || [],
          whiteboardSteps: [],
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
