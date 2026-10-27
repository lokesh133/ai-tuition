import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RECORDS_DIR = path.join(process.cwd(), 'data', 'student-records');
const UPLOADS_DIR = path.join(process.cwd(), 'data', 'student-uploads');

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const studentId = searchParams.get('studentId') || searchParams.get('id');

    const cleanPhone = (phone || '').replace(/\D/g, '');
    const cleanId = (studentId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const identifier = cleanPhone || cleanId;

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: 'Student phone or ID is required.' },
        { status: 400 }
      );
    }

    const recordFile = path.join(RECORDS_DIR, `${identifier}.json`);
    let uploads: any[] = [];

    if (fs.existsSync(recordFile)) {
      try {
        const raw = await fs.promises.readFile(recordFile, 'utf-8');
        const data = JSON.parse(raw);
        uploads = data.uploads || [];
      } catch (err) {
        console.error('Error reading student uploads:', err);
      }
    }

    // Also check student uploads directory
    const studentUploadDir = path.join(UPLOADS_DIR, identifier);
    let diskFiles: string[] = [];
    if (fs.existsSync(studentUploadDir)) {
      try {
        diskFiles = await fs.promises.readdir(studentUploadDir);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      identifier,
      uploads,
      totalUploads: uploads.length,
      diskFilesCount: diskFiles.length,
    });
  } catch (error: any) {
    console.error('GET student uploads error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error reading student uploads.' },
      { status: 500 }
    );
  }
}
