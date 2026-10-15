import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'rbse-curriculum.json');

function getCurriculumFile() {
  if (!fs.existsSync(DATA_FILE)) {
    // If missing, seed it
    return null;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[API Syllabus] Failed to read curriculum JSON:', err);
    return null;
  }
}

function saveCurriculumFile(data: any) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[API Syllabus] Failed to write curriculum JSON:', err);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const board = searchParams.get('board') || 'RBSE';
    const className = searchParams.get('class');
    const subjectId = searchParams.get('subject');

    let data = getCurriculumFile();
    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Curriculum data store not found or corrupt' },
        { status: 500 }
      );
    }

    const boardData = data[board] || data.RBSE;
    if (!boardData) {
      return NextResponse.json(
        { success: false, message: `Board ${board} not found` },
        { status: 404 }
      );
    }

    // If specific class requested
    if (className) {
      const classSubjects = boardData.classes?.[className]?.english || [];
      if (subjectId) {
        const sub = classSubjects.find(
          (s: any) => s.id.toLowerCase() === subjectId.toLowerCase()
        );
        return NextResponse.json({
          success: true,
          board,
          className,
          subject: sub || null,
        });
      }

      return NextResponse.json({
        success: true,
        board,
        className,
        subjects: classSubjects,
      });
    }

    // Return all classes for the board
    return NextResponse.json({
      success: true,
      board,
      classes: boardData.classes,
    });
  } catch (err: any) {
    console.error('[API Syllabus GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, board = 'RBSE', className, subjectId, data: payload } = body;

    let fullData = getCurriculumFile();
    if (!fullData) {
      return NextResponse.json(
        { success: false, message: 'Curriculum data store not initialized' },
        { status: 500 }
      );
    }

    if (!fullData[board]) {
      fullData[board] = { board, classes: {} };
    }
    if (!fullData[board].classes) {
      fullData[board].classes = {};
    }

    // Action 1: Bulk upload / overwrite full curriculum
    if (action === 'bulk_upload' && payload) {
      const ok = saveCurriculumFile(payload);
      if (!ok) {
        return NextResponse.json(
          { success: false, message: 'Failed to write bulk curriculum' },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Bulk curriculum updated successfully',
      });
    }

    // Action 2: Save entire subject (chapters + book name) for a class
    if (action === 'save_subject' && className && subjectId && payload) {
      if (!fullData[board].classes[className]) {
        fullData[board].classes[className] = { english: [], hindi: [] };
      }

      const engList = fullData[board].classes[className].english || [];
      const idx = engList.findIndex(
        (s: any) => s.id.toLowerCase() === subjectId.toLowerCase()
      );

      if (idx >= 0) {
        engList[idx] = { ...engList[idx], ...payload };
      } else {
        engList.push(payload);
      }

      fullData[board].classes[className].english = engList;
      fullData[board].classes[className].hindi = engList; // keep in sync

      const ok = saveCurriculumFile(fullData);
      return NextResponse.json({
        success: ok,
        message: ok ? `Subject "${payload.subject}" saved successfully!` : 'Error writing to store',
        subject: idx >= 0 ? engList[idx] : payload,
      });
    }

    // Action 3: Add or update single chapter
    if (action === 'save_chapter' && className && subjectId && payload) {
      const engList = fullData[board].classes?.[className]?.english || [];
      const sub = engList.find(
        (s: any) => s.id.toLowerCase() === subjectId.toLowerCase()
      );

      if (!sub) {
        return NextResponse.json(
          { success: false, message: `Subject ${subjectId} not found in ${className}` },
          { status: 404 }
        );
      }

      const chIdx = sub.chapters.findIndex((c: any) => c.id === payload.id);
      if (chIdx >= 0) {
        sub.chapters[chIdx] = { ...sub.chapters[chIdx], ...payload };
      } else {
        sub.chapters.push(payload);
      }

      // Re-sort by chapterNumber if present
      sub.chapters.sort((a: any, b: any) => (a.chapterNumber || 0) - (b.chapterNumber || 0));

      const ok = saveCurriculumFile(fullData);
      return NextResponse.json({
        success: ok,
        message: ok ? 'Chapter saved successfully!' : 'Error writing to store',
        chapters: sub.chapters,
      });
    }

    // Action 4: Delete single chapter
    if (action === 'delete_chapter' && className && subjectId && payload?.chapterId) {
      const engList = fullData[board].classes?.[className]?.english || [];
      const sub = engList.find(
        (s: any) => s.id.toLowerCase() === subjectId.toLowerCase()
      );

      if (!sub) {
        return NextResponse.json(
          { success: false, message: `Subject ${subjectId} not found` },
          { status: 404 }
        );
      }

      sub.chapters = sub.chapters.filter((c: any) => c.id !== payload.chapterId);
      const ok = saveCurriculumFile(fullData);
      return NextResponse.json({
        success: ok,
        message: ok ? 'Chapter deleted successfully!' : 'Error writing to store',
        chapters: sub.chapters,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action or parameters specified' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[API Syllabus POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
