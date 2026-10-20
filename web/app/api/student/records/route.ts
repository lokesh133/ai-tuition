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

// Read student records file
async function readStudentRecord(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading student record file:', err);
    return null;
  }
}

// Write student records file
async function writeStudentRecord(filePath: string, data: any) {
  try {
    await ensureDir();
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing student record file:', err);
    return false;
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

    const record = await readStudentRecord(filePath);
    if (!record) {
      return NextResponse.json({
        success: true,
        exists: false,
        worksheetHistory: [],
        testHistory: [],
        currentSession: null,
      });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      worksheetHistory: record.worksheetHistory || [],
      testHistory: record.testHistory || [],
      currentSession: record.currentSession || null,
      updatedAt: record.updatedAt || null,
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
    const { phone, studentId, id, worksheetHistory, testHistory, currentSession, newTestRecord, newWorksheetRecord } = body;

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

    // Update full worksheetHistory if provided
    if (Array.isArray(worksheetHistory)) {
      existing.worksheetHistory = worksheetHistory.slice(0, 100);
    } else if (newWorksheetRecord) {
      const filtered = (existing.worksheetHistory || []).filter((r: any) => r.id !== newWorksheetRecord.id);
      existing.worksheetHistory = [newWorksheetRecord, ...filtered].slice(0, 100);
    }

    // Update full testHistory if provided
    if (Array.isArray(testHistory)) {
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
