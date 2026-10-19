import { NextRequest, NextResponse } from 'next/server';
import { getAllAdminUsers, createAdminUser, findAdminByEmail } from '@/lib/dataStore';

export async function GET() {
  try {
    const adminUsers = await getAllAdminUsers();

    return NextResponse.json({
      success: true,
      users: adminUsers,
    });
  } catch (error: any) {
    console.error('Fetch roles error:', error);
    return NextResponse.json(
      { success: false, message: 'स्टाफ डेटा लोड करने में त्रुटि।' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, roleTitle, permissions } = body;

    if (!name || !email || !password || !roleTitle) {
      return NextResponse.json(
        { success: false, message: 'कृपया नाम, ईमेल, पासवर्ड और रोल का नाम भरें।' },
        { status: 400 }
      );
    }

    const existing = await findAdminByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'इस ईमेल पर पहले से एडमिन/स्टाफ अकाउंट बना हुआ है।' },
        { status: 409 }
      );
    }

    const defaultPermissions = {
      overview: Boolean(permissions?.overview),
      syllabus: Boolean(permissions?.syllabus),
      subscriptions: Boolean(permissions?.subscriptions),
      students: Boolean(permissions?.students),
      courses: Boolean(permissions?.courses),
      teachers: Boolean(permissions?.teachers),
      roles: Boolean(permissions?.roles),
    };

    const newStaff = await createAdminUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      role: 'SUB_ADMIN',
      roleTitle: roleTitle.trim(),
      permissions: defaultPermissions,
    });

    return NextResponse.json({
      success: true,
      message: `नया स्टाफ सदस्य "${newStaff.name}" सफलतापूर्वक जुड़ गया!`,
      user: {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        roleTitle: newStaff.roleTitle,
        permissions: newStaff.permissions,
      },
    });
  } catch (error: any) {
    console.error('Create role error:', error);
    return NextResponse.json(
      { success: false, message: 'स्टाफ अकाउंट बनाने में त्रुटि।' },
      { status: 500 }
    );
  }
}
