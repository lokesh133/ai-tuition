import { NextRequest, NextResponse } from 'next/server';
import { createStudent, findStudentByPhone } from '@/lib/dataStore';
import { verifyOtpCode } from '@/lib/otpStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      password,
      classGrade,
      board = 'RBSE',
      medium = 'HINDI',
      city = 'Rajasthan',
      schoolName = '',
      otp,
    } = body;

    if (!name || !phone || !password || !classGrade) {
      return NextResponse.json(
        { success: false, message: 'Please fill in Student Name, Mobile Number, Password, and Class.' },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Student full name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    if (password.trim().length < 4) {
      return NextResponse.json(
        { success: false, message: 'Password / PIN must be at least 4 characters or digits.' },
        { status: 400 }
      );
    }

    const existing = await findStudentByPhone(cleanPhone);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'This mobile number is already registered. Please Login instead.' },
        { status: 409 }
      );
    }

    // Verify OTP if provided
    if (otp) {
      const verification = verifyOtpCode(cleanPhone, otp.trim(), 'SIGNUP');
      if (!verification.valid) {
        return NextResponse.json(
          { success: false, message: verification.message },
          { status: 400 }
        );
      }
    }

    const newStudent = await createStudent({
      name: name.trim(),
      phone: cleanPhone,
      password: password.trim(),
      classGrade,
      board,
      medium,
      city: city || 'Rajasthan',
      schoolName: schoolName ? schoolName.trim() : undefined,
      isSubscribed: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Welcome to AI Tutor.',
      student: {
        id: newStudent.id,
        name: newStudent.name,
        phone: newStudent.phone,
        classGrade: newStudent.classGrade,
        board: newStudent.board,
        medium: newStudent.medium,
        city: newStudent.city,
      },
    });
  } catch (error: any) {
    console.error('Student signup error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while creating student account.' },
      { status: 500 }
    );
  }
}

