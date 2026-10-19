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
  isSubscribed?: boolean;
}): Promise<Student> {
  const created = await prisma.user.create({
    data: {
      name: student.name,
      phone: student.phone,
      passwordHash: student.password,
      role: 'STUDENT',
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
