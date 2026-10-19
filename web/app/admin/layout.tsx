'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  LogOut,
  Lock,
} from 'lucide-react';

interface NavItem {
  name: string;
  icon: any;
  href: string;
  permKey: 'overview' | 'syllabus' | 'subscriptions' | 'students' | 'courses' | 'teachers' | 'roles';
}

const ADMIN_NAV: NavItem[] = [
  { name: 'Founder Overview', icon: LayoutDashboard, href: '/admin', permKey: 'overview' },
  { name: 'RBSE पाठ्यक्रम (Syllabus)', icon: BookOpen, href: '/admin/syllabus', permKey: 'syllabus' },
  { name: 'Subscriptions & Revenue', icon: CreditCard, href: '/admin/subscriptions', permKey: 'subscriptions' },
  { name: 'Student Data & Doubts', icon: Users, href: '/admin/students', permKey: 'students' },
  { name: 'School Courses & RAG', icon: Sparkles, href: '/admin/courses', permKey: 'courses' },
  { name: 'AI Teachers & Pacing', icon: GraduationCap, href: '/admin/teachers', permKey: 'teachers' },
  { name: 'Role Management (सब-एडमिन)', icon: ShieldCheck, href: '/admin/roles', permKey: 'roles' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // If on admin login page, don't show admin dashboard sidebar
  const isLoginPage = pathname === '/admin/login';

  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_user');
      if (stored) {
        try {
          setCurrentAdmin(JSON.parse(stored));
        } catch (e) {
          // fallback
        }
      }
    }
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Check if current user has permission for active page
  const currentItem = ADMIN_NAV.find((item) => item.href === pathname);
  const isSuperAdmin = !currentAdmin || currentAdmin.role === 'SUPER_ADMIN';
  const hasAccess =
    isSuperAdmin ||
    !currentItem ||
    Boolean(currentAdmin?.permissions?.[currentItem.permKey]);

  // Filter visible nav items based on user's granted permissions
  const visibleNav = ADMIN_NAV.filter((item) => {
    if (isSuperAdmin) return true;
    return Boolean(currentAdmin?.permissions?.[item.permKey]);
  });

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_user');
    }
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 text-slate-300 p-5 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
              ⚡
            </div>
            <div>
              <span className="font-extrabold text-white text-base block leading-tight">
                {currentAdmin?.name ? currentAdmin.name.split(' ')[0] : 'Admin'} Console
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {currentAdmin?.roleTitle || 'Founder & Super Admin'}
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {visibleNav.map((item, idx) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Switch to Parent View</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-2 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>लॉगआउट (Sign Out)</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {!hasAccess ? (
          <div className="max-w-md mx-auto my-16 bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900">अनुमति नहीं है (Access Denied)</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              आपके सब-एडमिन रोल को इस पेज (<strong>{currentItem?.name}</strong>) को देखने की अनुमति नहीं दी गई है। कृपया सुपर-एडमिन (लोकेश शर्मा) से संपर्क करें।
            </p>
            <Link
              href="/admin"
              className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              ← वापस मुख्य पेज पर जाएं
            </Link>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
