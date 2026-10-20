import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount = 200, currency = 'INR', studentName = 'Student', phone = '' } = body;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check if user has real keys or is in sandbox/demo mode
    const isTestPlaceholder =
      !keyId ||
      keyId.includes('placeholder') ||
      keyId.includes('demo') ||
      !keySecret ||
      keySecret.includes('placeholder') ||
      keySecret.includes('demo');

    if (isTestPlaceholder) {
      // Safe sandbox mode for testing before live credentials
      const testOrderId = `order_test_${Date.now()}`;
      return NextResponse.json({
        success: true,
        orderId: testOrderId,
        amount: amount * 100, // paise
        currency,
        isTestMode: true,
        message: 'Sandbox / Test Mode Active (Razorpay keys not yet live)',
      });
    }

    // Real Razorpay instance
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // in paise
      currency,
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        studentName,
        phone,
        product: 'Vidya AI Tuition - ₹200/mo All-Access',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      isTestMode: false,
    });
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'ऑर्डर बनाने में त्रुटि।',
      },
      { status: 500 }
    );
  }
}
