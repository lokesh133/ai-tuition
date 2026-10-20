import { NextResponse } from 'next/server';
import { grantSubscription, getAllSubscriptions } from '@/lib/dataStore';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      identifier = 'admin_tester',
      studentName = 'Admin Test Account',
      days = 30,
      planName = 'Admin Free Test Pass (30 Days)',
    } = body;

    const result = await grantSubscription({
      identifier,
      planName,
      days,
      amount: 0,
      status: 'ACTIVE',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `🎉 एडमिन फ्री टेस्ट पास एक्टिव: ${studentName} (${identifier}) को ${days} दिनों के लिए 100% फ्री एक्सेस दिया गया!`,
      subscription: result.subscription,
    });
  } catch (error: any) {
    console.error('Grant free subscription error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'फ्री एक्सेस देने में त्रुटि।' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const subscriptions = await getAllSubscriptions();
    return NextResponse.json({
      success: true,
      total: subscriptions.length,
      subscriptions,
    });
  } catch (error: any) {
    console.error('Fetch subscriptions error:', error);
    return NextResponse.json(
      { success: false, message: 'सब्सक्रिप्शन सूची लोड करने में त्रुटि।' },
      { status: 500 }
    );
  }
}
