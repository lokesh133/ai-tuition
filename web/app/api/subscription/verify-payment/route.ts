import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { grantSubscription } from '@/lib/dataStore';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentIdentifier = 'student_test',
      studentName = 'Student',
      isTestMode = false,
      amount = 200,
    } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const isAnnual = amount >= 1000;
    const planDays = isAnnual ? 365 : 30;
    const planLabel = isAnnual ? '₹1,499/वर्ष वार्षिक परीक्षा पैक' : '₹200/माह ऑल-एक्सेस पैक';

    // If sandbox / test payment mode
    if (isTestMode || razorpay_order_id?.startsWith('order_test_')) {
      const grantResult = await grantSubscription({
        identifier: studentIdentifier,
        planName: `${planLabel} (Test Mode)`,
        days: planDays,
        amount,
        status: 'ACTIVE',
      });

      return NextResponse.json({
        success: true,
        isTestMode: true,
        message: `🎉 टेस्ट मोड: ${planDays} दिनों का सब्सक्रिप्शन सफलतापूर्वक एक्टिव हो गया!`,
        subscription: grantResult.subscription,
      });
    }

    // Verify Real Razorpay Signature
    if (!keySecret) {
      return NextResponse.json(
        { success: false, message: 'Razorpay secret key not configured.' },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'अमान्य पेमेंट सिग्नेचर (Invalid Signature).' },
        { status: 400 }
      );
    }

    // Grant active subscription
    const grantResult = await grantSubscription({
      identifier: studentIdentifier,
      planName: `${planLabel} (Razorpay Paid)`,
      days: planDays,
      amount,
      status: 'ACTIVE',
    });

    return NextResponse.json({
      success: true,
      message: '🎉 भुगतान सफल! 30 दिनों के लिए विद्या AI ट्यूशन सक्रिय हो गया है।',
      subscription: grantResult.subscription,
      paymentId: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'भुगतान सत्यापन में त्रुटि।' },
      { status: 500 }
    );
  }
}
