import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const potentialPaths = [
      path.resolve(process.cwd(), '..', 'gemini_tuition_tuning.jsonl'),
      path.resolve(process.cwd(), 'gemini_tuition_tuning.jsonl'),
      path.resolve(process.cwd(), 'data', 'gemini_tuition_tuning.jsonl'),
    ];

    let validPath = '';
    for (const p of potentialPaths) {
      if (fs.existsSync(p)) {
        validPath = p;
        break;
      }
    }

    if (!validPath) {
      return NextResponse.json({
        success: true,
        totalSamples: 0,
        samples: [],
        message: 'No training dataset file found yet. Interactions will automatically create it.',
      });
    }

    const fileContent = fs.readFileSync(validPath, 'utf8');
    const lines = fileContent.split('\n').filter((l) => l.trim().length > 0);
    const parsedSamples = [];

    // Parse last 20 samples for preview
    const previewLines = lines.slice(-20);
    for (const line of previewLines) {
      try {
        parsedSamples.push(JSON.parse(line));
      } catch {}
    }

    const { searchParams } = new URL(req.url);
    if (searchParams.get('download') === 'true') {
      return new NextResponse(fileContent, {
        headers: {
          'Content-Disposition': 'attachment; filename="gemini_tuition_tuning.jsonl"',
          'Content-Type': 'application/jsonl',
        },
      });
    }

    return NextResponse.json({
      success: true,
      totalSamples: lines.length,
      datasetPath: validPath,
      recentSamples: parsedSamples,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed reading training dataset' },
      { status: 500 }
    );
  }
}
