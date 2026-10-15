'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

const ADMIN_NAV = [
  { name: 'Founder Overview', icon: LayoutDashboard, href: '/admin' },
  { name: 'RBSE पाठ्यक्रम (Syllabus)', icon: BookOpen, href: '/admin/syllabus' },
  { name: 'Subscriptions & Revenue', icon: CreditCard, href: '/admin/subscriptions' },
  { name: 'Student Data & Doubts', icon: Users, href: '/admin/students' },
  { name: 'School Courses & RAG', icon: Sparkles, href: '/admin/courses' },
  { name: 'AI Teachers & Pacing', icon: GraduationCap, href: '/admin/teachers' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
              <span className="font-extrabold text-white text-base block leading-tight">Super Admin</span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Founder: Lokesh Sharma</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {ADMIN_NAV.map((item, idx) => {
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

        {/* Back Link */}
        <div className="pt-6 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Switch to Parent View</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
