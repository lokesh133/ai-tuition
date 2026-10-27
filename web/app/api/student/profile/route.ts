import { NextRequest, NextResponse } from 'next/server';
import { findStudentById, findStudentByPhone, updateStudentProfile } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');

    if (!id && !phone) {
      return NextResponse.json(
        { success: false, message: 'Student ID or phone is required.' },
        { status: 400 }
      );
    }

    let student = null;
    if (id) {
      student = await findStudentById(id);
    } else if (phone) {
      student = await findStudentByPhone(phone.replace(/\D/g, ''));
    }

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student profile not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone,
        classGrade: student.classGrade,
        board: student.board,
        medium: student.medium,
        city: student.city,
        isSubscribed: student.isSubscribed,
        doubtsAsked: student.doubtsAsked,
        createdAt: student.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while fetching profile.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, classGrade, board, medium, city, password } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Student ID is required for profile update.' },
        { status: 400 }
      );
    }

    if (name && name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid student name (at least 2 letters).' },
        { status: 400 }
      );
    }

    if (password && password.trim().length < 4) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 4 characters or digits.' },
        { status: 400 }
      );
    }

    const updated = await updateStudentProfile(id, {
      name,
      classGrade,
      board,
      medium,
      city,
      password,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Could not update student profile. Profile not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      student: {
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        classGrade: updated.classGrade,
        board: updated.board,
        medium: updated.medium,
        city: updated.city,
        isSubscribed: updated.isSubscribed,
        doubtsAsked: updated.doubtsAsked,
        createdAt: updated.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while updating profile.' },
      { status: 500 }
    );
  }
}
