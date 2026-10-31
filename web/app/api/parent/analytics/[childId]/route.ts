import { NextRequest, NextResponse } from 'next/server';
import { callBackendService } from '@/lib/backendClient';

export async function GET(
  _request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const { childId } = params;
    // Internal Service Call to Backend using Vercel Service Binding
    const backendRes = await callBackendService(`/api/parent/analytics/${encodeURIComponent(childId)}`, {
      method: 'GET',
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, error: `Backend service responded with status ${backendRes.status}` },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[ParentAnalytics Route] Error calling backend service:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to communicate with internal backend service',
      },
      { status: 500 }
    );
  }
}

