import prisma from './prisma';

export interface Student {
  id: string;
  name: string;
  phone: string;
  password?: string;
  classGrade: string;
  board: string;
  medium: string;
  city: string;
  isSubscribed: boolean;
  doubtsAsked: number;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'SUB_ADMIN';
  roleTitle: string;
  permissions: {
    overview: boolean;
    syllabus: boolean;
    subscriptions: boolean;
    students: boolean;
    courses: boolean;
    teachers: boolean;
    roles: boolean;
  };
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// Ensure default Super Admin is present in Supabase DB
let isSeeded = false;
async function ensureSeed() {
  if (isSeeded) return;
  try {
    const existing = await prisma.user.findFirst({
      where: { email: 'admin@aituition.com' },
    });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: 'लोकेश शर्मा (Founder)',
          email: 'admin@aituition.com',
          passwordHash: 'admin',
          role: 'SUPER_ADMIN',
          roleTitle: 'Founder & Super Admin',
          permissions: {
            create: {
              overview: true,
              syllabus: true,
              subscriptions: true,
              students: true,
              courses: true,
              teachers: true,
              roles: true,
            },
          },
        },
      });
      console.log('⚡ Seeded default Super Admin (admin@aituition.com) in Supabase PostgreSQL.');
    }
    isSeeded = true;
  } catch (err) {
    console.error('Error ensuring default seed in DB:', err);
  }
}

// Student Operations (Supabase PostgreSQL)
export async function getAllStudents(): Promise<Student[]> {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone || '',
      classGrade: u.classGrade || 'Class 5th',
      board: u.board || 'RBSE',
      medium: u.medium || 'HINDI',
      city: u.city || 'Rajasthan',
      isSubscribed: u.isSubscribed,
      doubtsAsked: u.doubtsAsked,
      createdAt: u.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error('getAllStudents Prisma error:', err);
    return [];
  }
}

export async function createStudent(student: {
  name: string;
  phone: string;
  password: string;
  classGrade: string;
  board: string;
  medium: string;
  city: string;
  schoolName?: string;
  isSubscribed?: boolean;
}): Promise<Student> {
  const created = await prisma.user.create({
    data: {
      name: student.name,
      phone: student.phone,
      passwordHash: student.password,
      role: 'STUDENT',
      roleTitle: student.schoolName ? ("School: " + student.schoolName.trim()) : "Student",
      classGrade: student.classGrade,
      board: student.board,
      medium: student.medium,
      city: student.city,
      isSubscribed: Boolean(student.isSubscribed),
    },
  });

  return {
    id: created.id,
    name: created.name,
    phone: created.phone || '',
    classGrade: created.classGrade || '',
    board: created.board || 'RBSE',
    medium: created.medium || 'HINDI',
    city: created.city || 'Rajasthan',
    isSubscribed: created.isSubscribed,
    doubtsAsked: created.doubtsAsked,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function findStudentByPhone(phone: string): Promise<Student | null> {
  try {
    const u = await prisma.user.findFirst({
      where: { phone, role: 'STUDENT' },
    });
    if (!u) return null;
    return {
      id: u.id,
      name: u.name,
      phone: u.phone || '',
      password: u.passwordHash,
      classGrade: u.classGrade || '',
      board: u.board || 'RBSE',
      medium: u.medium || 'HINDI',
      city: u.city || 'Rajasthan',
      isSubscribed: u.isSubscribed,
      doubtsAsked: u.doubtsAsked,
      createdAt: u.createdAt.toISOString(),
    };
  } catch (err) {
    console.error('findStudentByPhone error:', err);
    return null;
  }
}

export async function findStudentById(id: string): Promise<Student | null> {
  try {
    const u = await prisma.user.findUnique({
      where: { id },
    });
    if (!u) return null;
    return {
      id: u.id,
      name: u.name,
      phone: u.phone || '',
      password: u.passwordHash,
      classGrade: u.classGrade || '',
      board: u.board || 'RBSE',
      medium: u.medium || 'HINDI',
      city: u.city || 'Rajasthan',
      isSubscribed: u.isSubscribed,
      doubtsAsked: u.doubtsAsked,
      createdAt: u.createdAt.toISOString(),
    };
  } catch (err) {
    console.error('findStudentById error:', err);
    return null;
  }
}

export async function updateStudentProfile(
  id: string,
  updates: {
    name?: string;
    classGrade?: string;
    board?: string;
    medium?: string;
    city?: string;
    password?: string;
  }
): Promise<Student | null> {
  try {
    const dataToUpdate: any = {};
    if (updates.name !== undefined) dataToUpdate.name = updates.name.trim();
    if (updates.classGrade !== undefined) dataToUpdate.classGrade = updates.classGrade;
    if (updates.board !== undefined) dataToUpdate.board = updates.board;
    if (updates.medium !== undefined) dataToUpdate.medium = updates.medium;
    if (updates.city !== undefined) dataToUpdate.city = updates.city;
    if (updates.password) dataToUpdate.passwordHash = updates.password.trim();

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return {
      id: updated.id,
      name: updated.name,
      phone: updated.phone || '',
      classGrade: updated.classGrade || '',
      board: updated.board || 'RBSE',
      medium: updated.medium || 'HINDI',
      city: updated.city || 'Rajasthan',
      isSubscribed: updated.isSubscribed,
      doubtsAsked: updated.doubtsAsked,
      createdAt: updated.createdAt.toISOString(),
    };
  } catch (err) {
    console.error('updateStudentProfile error:', err);
    return null;
  }
}

export async function updateStudentPasswordByPhone(
  phone: string,
  newPassword: string
): Promise<boolean> {
  try {
    const student = await prisma.user.findFirst({
      where: { phone, role: 'STUDENT' },
    });
    if (!student) return false;

    await prisma.user.update({
      where: { id: student.id },
      data: { passwordHash: newPassword.trim() },
    });
    return true;
  } catch (err) {
    console.error('updateStudentPasswordByPhone error:', err);
    return false;
  }
}

// Admin & Staff Operations (Supabase PostgreSQL)
export async function getAllAdminUsers(): Promise<AdminUser[]> {
  await ensureSeed();
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'SUB_ADMIN'] },
      },
      include: { permissions: true },
      orderBy: { createdAt: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email || '',
      role: u.role as 'SUPER_ADMIN' | 'SUB_ADMIN',
      roleTitle: u.roleTitle || (u.role === 'SUPER_ADMIN' ? 'Founder & Super Admin' : 'Staff'),
      permissions: {
        overview: Boolean(u.permissions?.overview),
        syllabus: Boolean(u.permissions?.syllabus),
        subscriptions: Boolean(u.permissions?.subscriptions),
        students: Boolean(u.permissions?.students),
        courses: Boolean(u.permissions?.courses),
        teachers: Boolean(u.permissions?.teachers),
        roles: Boolean(u.permissions?.roles),
      },
      createdAt: u.createdAt.toISOString(),
      status: 'ACTIVE',
    }));
  } catch (err) {
    console.error('getAllAdminUsers error:', err);
    return [];
  }
}

export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  await ensureSeed();
  try {
    const u = await prisma.user.findFirst({
      where: {
        email: { equals: email.trim(), mode: 'insensitive' },
        role: { in: ['SUPER_ADMIN', 'SUB_ADMIN'] },
      },
      include: { permissions: true },
    });
    if (!u) return null;

    return {
      id: u.id,
      name: u.name,
      email: u.email || '',
      password: u.passwordHash,
      role: u.role as 'SUPER_ADMIN' | 'SUB_ADMIN',
      roleTitle: u.roleTitle || 'Admin',
      permissions: {
        overview: Boolean(u.permissions?.overview),
        syllabus: Boolean(u.permissions?.syllabus),
        subscriptions: Boolean(u.permissions?.subscriptions),
        students: Boolean(u.permissions?.students),
        courses: Boolean(u.permissions?.courses),
        teachers: Boolean(u.permissions?.teachers),
        roles: Boolean(u.permissions?.roles),
      },
      createdAt: u.createdAt.toISOString(),
      status: 'ACTIVE',
    };
  } catch (err) {
    console.error('findAdminByEmail error:', err);
    return null;
  }
}

export async function createAdminUser(user: {
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'SUB_ADMIN';
  roleTitle: string;
  permissions: {
    overview: boolean;
    syllabus: boolean;
    subscriptions: boolean;
    students: boolean;
    courses: boolean;
    teachers: boolean;
    roles: boolean;
  };
}): Promise<AdminUser> {
  const created = await prisma.user.create({
    data: {
      name: user.name,
      email: user.email.toLowerCase(),
      passwordHash: user.password,
      role: user.role,
      roleTitle: user.roleTitle,
      permissions: {
        create: user.permissions,
      },
    },
    include: { permissions: true },
  });

  return {
    id: created.id,
    name: created.name,
    email: created.email || '',
    role: created.role as 'SUPER_ADMIN' | 'SUB_ADMIN',
    roleTitle: created.roleTitle || '',
    permissions: user.permissions,
    createdAt: created.createdAt.toISOString(),
    status: 'ACTIVE',
  };
}

export async function updateAdminPassword(email: string, newPassword: string): Promise<boolean> {
  try {
    await prisma.user.updateMany({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
      data: { passwordHash: newPassword },
    });
    return true;
  } catch (err) {
    console.error('updateAdminPassword error:', err);
    return false;
  }
}

// ==========================================
// 💳 SUBSCRIPTION & ADMIN FREE TEST PASS
// ==========================================

export interface StudentSubscriptionRecord {
  id: string;
  userId: string;
  studentName: string;
  phone: string;
  classGrade: string;
  planName: string;
  amount: number;
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRING' | 'OVERDUE';
  startDate: string;
  endDate: string;
  daysRemaining: number;
  createdAt: string;
}

export async function grantSubscription(params: {
  identifier: string; // phone, email, or user ID
  planName?: string;
  days?: number;
  amount?: number;
  paymentMethod?: string;
  status?: 'ACTIVE' | 'TRIAL';
}): Promise<{ success: boolean; message: string; subscription?: any }> {
  try {
    const {
      identifier,
      planName = '₹200/mo All-Access',
      days = 30,
      amount = 200,
      status = 'ACTIVE',
    } = params;

    // Find student
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { phone: identifier },
          { email: identifier },
        ],
      },
    });

    if (!user) {
      // If student not found by phone/email, create a quick profile
      user = await prisma.user.create({
        data: {
          name: identifier.includes('@') ? identifier.split('@')[0] : `Student (${identifier})`,
          phone: identifier.includes('@') ? undefined : identifier,
          email: identifier.includes('@') ? identifier : undefined,
          passwordHash: 'tuition123',
          role: 'STUDENT',
          isSubscribed: true,
        },
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Update user isSubscribed flag
    await prisma.user.update({
      where: { id: user.id },
      data: { isSubscribed: true },
    });

    // Create subscription record in DB
    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        planName,
        amount,
        status,
        startDate,
        endDate,
      },
    });

    return {
      success: true,
      message: `🎉 सब्सक्रिप्शन सफलतापूर्वक सक्रिय हो गया (${days} दिन मान्य)।`,
      subscription: {
        id: sub.id,
        userId: user.id,
        studentName: user.name,
        phone: user.phone,
        planName: sub.planName,
        amount: sub.amount,
        status: sub.status,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate.toISOString(),
        daysRemaining: days,
      },
    };
  } catch (err: any) {
    console.error('grantSubscription error:', err);
    return { success: false, message: err?.message || 'सब्सक्रिप्शन जोड़ने में त्रुटि हुई।' };
  }
}

export async function getSubscriptionStatus(identifier: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { phone: identifier },
          { email: identifier },
        ],
      },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return { isSubscribed: false, daysRemaining: 0, status: 'NOT_FOUND' };
    }

    const latestSub = user.subscriptions[0];
    if (!latestSub) {
      return {
        isSubscribed: user.isSubscribed,
        daysRemaining: user.isSubscribed ? 30 : 0,
        status: user.isSubscribed ? 'ACTIVE' : 'NO_SUBSCRIPTION',
      };
    }

    const now = new Date();
    const expiry = new Date(latestSub.endDate);
    const diffMs = expiry.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isActive = daysRemaining > 0 && latestSub.status === 'ACTIVE';

    return {
      isSubscribed: isActive,
      daysRemaining,
      planName: latestSub.planName,
      status: isActive ? 'ACTIVE' : 'EXPIRED',
      expiryDate: latestSub.endDate.toISOString(),
      studentName: user.name,
      phone: user.phone,
    };
  } catch (err) {
    console.error('getSubscriptionStatus error:', err);
    return { isSubscribed: false, daysRemaining: 0, status: 'ERROR' };
  }
}

export async function getAllSubscriptions(): Promise<StudentSubscriptionRecord[]> {
  try {
    const subs = await prisma.subscription.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return subs.map((s) => {
      const expiry = new Date(s.endDate);
      const diffMs = expiry.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      let status: 'ACTIVE' | 'TRIAL' | 'EXPIRING' | 'OVERDUE' = 'ACTIVE';
      if (s.status === 'TRIAL') status = 'TRIAL';
      else if (daysRemaining <= 0) status = 'OVERDUE';
      else if (daysRemaining <= 3) status = 'EXPIRING';

      return {
        id: s.id,
        userId: s.userId,
        studentName: s.user.name,
        phone: s.user.phone || '',
        classGrade: s.user.classGrade || 'Class 4th',
        planName: s.planName,
        amount: s.amount,
        status,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        daysRemaining,
        createdAt: s.createdAt.toISOString(),
      };
    });
  } catch (err) {
    console.error('getAllSubscriptions error:', err);
    return [];
  }
}

export async function toggleStudentSubscription(studentId: string, isFree: boolean) {
  try {
    const user = await prisma.user.findUnique({ where: { id: studentId } });
    if (!user) return { success: false, message: 'Student not found' };

    if (isFree) {
      // Set to 100% Free All Access (1 Year / Permanent until revoked by admin)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 2); // 2 years free pass

      await prisma.user.update({
        where: { id: studentId },
        data: { isSubscribed: true },
      });

      await prisma.subscription.create({
        data: {
          userId: studentId,
          planName: 'Admin Free Pass (गरीब छात्र / टेस्ट अकाउंट)',
          amount: 0,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      });

      return {
        success: true,
        message: `🎉 "${user.name}" को 100% फ्री एक्सेस दिया गया है। जब तक आप इसे बदलेंगे नहीं, यह फ्री रहेगा।`,
        isSubscribed: true,
      };
    } else {
      // Revert to Paid / Subscription Required
      await prisma.user.update({
        where: { id: studentId },
        data: { isSubscribed: false },
      });

      await prisma.subscription.updateMany({
        where: { userId: studentId, status: 'ACTIVE' },
        data: { status: 'OVERDUE' },
      });

      return {
        success: true,
        message: `ℹ️ "${user.name}" को सामान्य सब्सक्रिप्शन मोड (₹200 आवश्यक) में बदल दिया गया है।`,
        isSubscribed: false,
      };
    }
  } catch (err: any) {
    console.error('toggleStudentSubscription error:', err);
    return { success: false, message: err?.message || 'Error updating subscription' };
  }
}




