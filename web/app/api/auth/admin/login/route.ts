import { NextRequest, NextResponse } from 'next/server';
import { findAdminByEmail } from '@/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।' },
        { status: 400 }
      );
    }

    const admin = await findAdminByEmail(email.trim());

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'अमान्य क्रेडेंशियल्स! यह एडमिन ईमेल मौजूद नहीं है।' },
        { status: 401 }
      );
    }

    if (admin.password !== password.trim()) {
      return NextResponse.json(
        { success: false, message: 'गलत पासवर्ड! कृपया पुनः प्रयास करें या पासवर्ड रीसेट करें।' },
        { status: 401 }
      );
    }

    if (admin.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'आपका एडमिन अकाउंट निष्क्रिय (Inactive) कर दिया गया है।' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `स्वागत है ${admin.name}!`,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        roleTitle: admin.roleTitle,
        permissions: admin.permissions,
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: 'लॉगिन में त्रुटि हुई।' },
      { status: 500 }
    );
  }
}
