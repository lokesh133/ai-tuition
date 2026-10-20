import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'rbse-curriculum.json');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = 'upload',
      chapterId = 'c4-math-14',
      board = 'RBSE',
      className = 'Class 4th',
      subjectId = 'math',
      pageNumber,
      pages = [], // Array of { pageNumber: number, dataUrl: string, pageTitle?: string }
    } = body;

    // Action: Delete Single Page Image
    if (action === 'delete_page_image' && pageNumber) {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const fullData = JSON.parse(raw);
        for (const targetBoard of ['RBSE', 'CBSE']) {
          const engList = fullData[targetBoard]?.classes?.[className]?.english || [];
          const sub = engList.find((s: any) => s.id.toLowerCase() === subjectId.toLowerCase());
          if (sub) {
            const ch = sub.chapters.find((c: any) => c.id === chapterId);
            if (ch && Array.isArray(ch.bookPages)) {
              const page = ch.bookPages.find((p: any) => p.pageNumber === pageNumber);
              if (page) {
                delete page.imageUrl;
              }
            }
          }
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(fullData, null, 2), 'utf-8');
      }
      return NextResponse.json({ success: true, message: `पेज ${pageNumber} की फोटो हटा दी गई है।` });
    }

    // Action: Delete ALL Page Images for this Chapter at once (1 साथ डिलीट)
    if (action === 'delete_all_page_images') {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const fullData = JSON.parse(raw);
        for (const targetBoard of ['RBSE', 'CBSE']) {
          const engList = fullData[targetBoard]?.classes?.[className]?.english || [];
          const sub = engList.find((s: any) => s.id.toLowerCase() === subjectId.toLowerCase());
          if (sub) {
            const ch = sub.chapters.find((c: any) => c.id === chapterId);
            if (ch && Array.isArray(ch.bookPages)) {
              for (const page of ch.bookPages) {
                delete page.imageUrl;
              }
            }
          }
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(fullData, null, 2), 'utf-8');
      }

      // Also clean up physical files in upload directory
      const safeChapterId = chapterId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'book-pages', safeChapterId);
      if (fs.existsSync(uploadDir)) {
        try {
          const files = fs.readdirSync(uploadDir);
          for (const f of files) {
            try {
              fs.unlinkSync(path.join(uploadDir, f));
            } catch {}
          }
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: 'इस पाठ की सभी अपलोड की गई फोटो 1 साथ हटा दी गई हैं!',
      });
    }

    // Action: Edit Page Details (Title / Summary)
    if (action === 'edit_page_details' && pageNumber) {
      const { pageTitle, summary } = body;
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const fullData = JSON.parse(raw);
        for (const targetBoard of ['RBSE', 'CBSE']) {
          const engList = fullData[targetBoard]?.classes?.[className]?.english || [];
          const sub = engList.find((s: any) => s.id.toLowerCase() === subjectId.toLowerCase());
          if (sub) {
            const ch = sub.chapters.find((c: any) => c.id === chapterId);
            if (ch && Array.isArray(ch.bookPages)) {
              const page = ch.bookPages.find((p: any) => p.pageNumber === pageNumber);
              if (page) {
                if (pageTitle !== undefined) page.pageTitle = pageTitle;
                if (summary !== undefined) page.summary = summary;
              }
            }
          }
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(fullData, null, 2), 'utf-8');
      }
      return NextResponse.json({
        success: true,
        message: `पेज ${pageNumber} का विवरण अपडेट हो गया।`,
      });
    }

    // Action: Clear Sample Questions, Formulas and Concepts
    if (action === 'clear_sample_questions') {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const fullData = JSON.parse(raw);
        for (const targetBoard of ['RBSE', 'CBSE']) {
          const engList = fullData[targetBoard]?.classes?.[className]?.english || [];
          const sub = engList.find((s: any) => s.id.toLowerCase() === subjectId.toLowerCase());
          if (sub) {
            const ch = sub.chapters.find((c: any) => c.id === chapterId);
            if (ch) {
              ch.sampleQuestions = [];
              ch.keyFormulas = [];
              ch.concepts = [];
            }
          }
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(fullData, null, 2), 'utf-8');
      }
      return NextResponse.json({ success: true, message: 'डमी प्रश्न और सूत्र साफ़ कर दिए गए हैं।' });
    }

    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No pages provided for upload' },
        { status: 400 }
      );
    }

    // Target upload directory in public folder
    const safeChapterId = chapterId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'book-pages', safeChapterId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const savedPagesMap: Record<number, string> = {};

    // Process each page
    for (const pageItem of pages) {
      const pNum = pageItem.pageNumber;
      const dataUrl = pageItem.dataUrl;

      if (!dataUrl || !pNum) continue;

      // Extract base64
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1].includes('webp')
          ? 'webp'
          : matches[1].includes('png')
          ? 'png'
          : 'jpg';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `page-${pNum}.${ext}`;
        const filePath = path.join(uploadDir, filename);

        fs.writeFileSync(filePath, buffer);
        savedPagesMap[pNum] = `/uploads/book-pages/${safeChapterId}/${filename}?v=${Date.now()}`;
      } else if (dataUrl.startsWith('/uploads/')) {
        savedPagesMap[pNum] = dataUrl;
      }
    }

    // Now update rbse-curriculum.json
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const fullData = JSON.parse(raw);

      for (const targetBoard of ['RBSE', 'CBSE']) {
        const engList = fullData[targetBoard]?.classes?.[className]?.english || [];
        const sub = engList.find(
          (s: any) => s.id.toLowerCase() === subjectId.toLowerCase()
        );

        if (sub && Array.isArray(sub.chapters)) {
          const ch = sub.chapters.find((c: any) => c.id === chapterId);
          if (ch) {
            if (!Array.isArray(ch.bookPages)) {
              ch.bookPages = [];
            }

            // Update or inject imageUrl for matched pageNumber
            for (const [pNumStr, imgUrl] of Object.entries(savedPagesMap)) {
              const pNum = parseInt(pNumStr, 10);
              const existingPage = ch.bookPages.find((p: any) => p.pageNumber === pNum);
              if (existingPage) {
                existingPage.imageUrl = imgUrl;
              } else {
                ch.bookPages.push({
                  pageNumber: pNum,
                  pageTitle: `पेज ${pNum}: ${ch.titleHindi || ch.titleEnglish}`,
                  summary: `${ch.titleEnglish} - पृष्ठ ${pNum} का अध्ययन सामग्री व अभ्यास।`,
                  concepts: [`पेज ${pNum} मुख्य अवधारणा`],
                  imageUrl: imgUrl,
                });
              }
            }

            // Sort bookPages by pageNumber
            ch.bookPages.sort((a: any, b: any) => a.pageNumber - b.pageNumber);
          }
        }
      }

      fs.writeFileSync(DATA_FILE, JSON.stringify(fullData, null, 2), 'utf-8');
    }

    return NextResponse.json({
      success: true,
      message: `सफलतापूर्वक ${Object.keys(savedPagesMap).length} पृष्ठ फोटो कंप्रेस व सिंक कर दिए गए हैं!`,
      savedPages: savedPagesMap,
    });
  } catch (err: any) {
    console.error('[API upload-pages] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
