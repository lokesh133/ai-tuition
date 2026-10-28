import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const pathSegments = resolvedParams?.path || [];
    if (!pathSegments.length) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const safeRelativePath = pathSegments.join('/');
    // Prevent directory traversal
    if (safeRelativePath.includes('..')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const fullFilePath = path.join(process.cwd(), 'data', 'student-uploads', ...pathSegments);

    if (!fs.existsSync(fullFilePath)) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(fullFilePath);
    const ext = path.extname(fullFilePath).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.pdf') contentType = 'application/pdf';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Error serving student upload file:', err);
    return new NextResponse('Server Error', { status: 500 });
  }
}
